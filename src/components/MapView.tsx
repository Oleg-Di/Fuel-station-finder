import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const fuelIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const evIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const gasIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEventsTracker({ center }: { center: [number, number] }) {
    const map = useMap();
    const { setMapBounds, selectedStation } = useMapStore();
    
    // Ref для хранения таймера дебаунса
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
    // Безопасная функция обновления границ с задержкой
    const updateBoundsWithDebounce = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
        
          debounceTimerRef.current = setTimeout(() => {
            const currentBounds = map.getBounds();
            const stateBounds = useMapStore.getState().mapBounds;
        
            if (!stateBounds || !stateBounds.equals(currentBounds)) {
              setMapBounds(currentBounds);
            }
          }, 100);
    };
  
    useEffect(() => {
      // Пишем стартовые границы один раз при загрузке
      setMapBounds(map.getBounds());
      
      // Очищаем таймер при размонтировании компонента
      return () => {
        debounceTimerRef.current ? clearTimeout(debounceTimerRef.current) : null;
      };
    }, [map, setMapBounds]);
  
    useEffect(() => {
      if (center) {
        map.flyTo(center, 14, { animate: true, duration: 1.5 });
      }
    }, [center, map]);
  
    useEffect(() => {
      if (!selectedStation) return;
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const latLng = layer.getLatLng();
          if (latLng.lat === selectedStation.coordinates[0] && latLng.lng === selectedStation.coordinates[1]) {
            layer.openPopup();
          }
        }
      });
    }, [selectedStation, map]);
  
    // Слушаем события карты, используя нашу безопасную функцию
    useMapEvents({
      moveend: updateBoundsWithDebounce,
      zoomend: updateBoundsWithDebounce
    });
    
    return null;
  }
  
export function MapView() {
  const { 
    userLocation, 
    mapCenter, 
    zoom, 
    stations, 
    filterType, 
    mapBounds, 
    maxPrice,
    setUserLocation, 
    setMapCenter,
    setSelectedStation 
  } = useMapStore();

  // Функция ручного поиска геопозиции при нажатии на кнопку
  const handleFindMe = () => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).navigator?.geolocation) {
      alert("Геолокация не поддерживается вашим браузером");
      return;
    }
    
    (globalThis as any).navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setUserLocation([lat, lng]);
        setMapCenter([lat, lng]); 
      },
      (error: GeolocationPositionError) => {
        alert(`Не удалось определить положение: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

// Фильтруем маркеры на карте по типу, экрану и стоимости
const displayedStations = stations.filter((station) => {
    const matchesType = filterType === 'all' ? true : station.type === filterType;
    const matchesBounds = mapBounds ? mapBounds.contains(L.latLng(station.coordinates[0], station.coordinates[1])) : true; 
  
    let matchesPrice = true;
    if (station.type !== 'ev' && station.fuelPrices) {
      const validPrices: number[] = [];
      
      if (filterType === 'fuel') {
        if (station.fuelPrices.sp95 > 0) validPrices.push(station.fuelPrices.sp95);
        if (station.fuelPrices.diesel > 0) validPrices.push(station.fuelPrices.diesel);
      } else if (filterType === 'gas') {
        if (station.fuelPrices.glp && station.fuelPrices.glp > 0) validPrices.push(station.fuelPrices.glp);
        if (station.fuelPrices.gnc && station.fuelPrices.gnc > 0) validPrices.push(station.fuelPrices.gnc);
      } else {
        if (station.fuelPrices.sp95 > 0) validPrices.push(station.fuelPrices.sp95);
        if (station.fuelPrices.diesel > 0) validPrices.push(station.fuelPrices.diesel);
        if (station.fuelPrices.glp && station.fuelPrices.glp > 0) validPrices.push(station.fuelPrices.glp);
        if (station.fuelPrices.gnc && station.fuelPrices.gnc > 0) validPrices.push(station.fuelPrices.gnc);
      }
  
      if (validPrices.length > 0) {
        matchesPrice = Math.min(...validPrices) <= maxPrice;
      } else {
        matchesPrice = false;
      }
    }
  
    return matchesType && matchesBounds && matchesPrice;
  });

  return (
    <div className="w-full h-[calc(100vh-64px)] relative">
      
      {/* КНОПКА «ГДЕ Я» ПОВЕРХ КАРТЫ */}
      <button
  onClick={handleFindMe}
 
  className="absolute bottom-[400px] md:bottom-6 right-4 md:right-6 z-[1000] bg-white text-gray-700 hover:text-indigo-600 p-3 rounded-full shadow-xl border border-gray-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-opacity-95 backdrop-blur-sm group"
  title="Центрировать на мне"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className="w-6 h-6 transition-transform group-hover:rotate-45"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
</button>

      <MapContainer center={mapCenter} zoom={zoom} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventsTracker center={mapCenter} />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup><div className="text-sm font-bold">📍 Вы здесь</div></Popup>
          </Marker>
        )}

        {displayedStations.map((station) => (
          <Marker
            key={station.id}
            position={station.coordinates}
            icon={station.type === 'ev' ? evIcon : station.type === 'fuel' ? fuelIcon : gasIcon}
            eventHandlers={{
                // Типизируем e как L.LeafletMouseEvent
                mouseover: (e: L.LeafletMouseEvent) => {
                  e.target.openPopup();
                  setSelectedStation(station);
                },
                // И здесь тоже типизируем e
                mouseout: (e: L.LeafletMouseEvent) => {
                  const isCurrentSelected = useMapStore.getState().selectedStation?.id === station.id;
                  // Используем тернарный оператор для лаконичности
                  isCurrentSelected ? null : e.target.closePopup();
                },
                click: () => {
                  setSelectedStation(station);
                }
              }}
          >
            <Popup closeButton={false}>
              <div className="p-1 font-sans min-w-[180px]">
                <h3 className="font-bold text-sm border-b border-gray-200 pb-1 mb-1 text-gray-800">{station.name}</h3>
                <p className="text-[11px] text-gray-500 mb-2 leading-tight">{station.address}</p>
                
                {station.fuelPrices && station.type !== 'ev' && (
                  <div className="text-xs space-y-0.5">
                    {station.fuelPrices.sp95 > 0 && (
                      <div className="flex justify-between gap-4"><span className="text-gray-600">SP95:</span><span className="font-semibold text-green-600">€{station.fuelPrices.sp95}</span></div>
                    )}
                    {station.fuelPrices.glp && (
                      <div className="flex justify-between gap-4"><span className="text-gray-600">GLP (Газ):</span><span className="font-semibold text-blue-600">€{station.fuelPrices.glp}</span></div>
                    )}
                    {station.fuelPrices.gnc && (
                      <div className="flex justify-between gap-4"><span className="text-gray-600">GNC (Газ):</span><span className="font-semibold text-purple-600">€{station.fuelPrices.gnc}</span></div>
                    )}
                    {station.fuelPrices.diesel > 0 && (
                      <div className="flex justify-between"><span className="text-gray-600">Diesel:</span><span className="font-semibold text-amber-600">€{station.fuelPrices.diesel}</span></div>
                    )}
                  </div>
                )}

                {station.type === 'ev' && station.evConnectors && (
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-gray-400 block uppercase">Порты:</span>
                    {station.evConnectors.map((connector, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-2 text-[11px] bg-gray-50 p-1 rounded">
                        <span className="font-medium text-gray-700">{connector.type} ({connector.powerKw} kW)</span>
                        <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${connector.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {connector.available ? 'ОК' : 'Занят'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}