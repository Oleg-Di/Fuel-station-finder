import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const gasIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
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

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Компонент, который следит за движением карты и её анимациями
function MapEventsTracker({ center }: { center: [number, number] }) {
  const map = useMap();
  const setMapBounds = useMapStore((state) => state.setMapBounds);
  
  // При первом рендере записываем стартовые границы экрана
  useEffect(() => {
    setMapBounds(map.getBounds());
  }, [map, setMapBounds]);

  // Плавный полет, если поменялся центр (например, кликнули в сайдбаре)
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { animate: true, duration: 1.5 });
    }
  }, [center, map]);

  // Подписываемся на события движения карты
  useMapEvents({
    moveend: () => {
      setMapBounds(map.getBounds()); // Обновляем границы в сторе, когда карта остановилась
    },
    zoomend: () => {
      setMapBounds(map.getBounds()); // Обновляем границы при зуме
    }
  });
  
  return null;
}
  
export function MapView() {
  const { userLocation, mapCenter, zoom, stations, filterType, mapBounds, setUserLocation, setSelectedStation } = useMapStore();
  
  useEffect(() => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).navigator?.geolocation) return;
    
    (globalThis as any).navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        console.warn("Геолокация недоступна, ставим базовую точку:", error.message);
        setUserLocation([39.1558, -0.4325]); 
      },
      { enableHighAccuracy: false, timeout: 1000, maximumAge: 300000 }
    );
  }, [setUserLocation]);

  // Умная фильтрация: берем только то, что попадает в экран + соответствует типу!
  const displayedStations = stations.filter((station) => {
    // Проверяем тип (all / fuel / ev)
    const matchesType = filterType === 'all' ? true : station.type === filterType;
    
    // Проверяем, попадает ли маркер в текущий квадрат экрана
    const matchesBounds = mapBounds 
      ? mapBounds.contains(L.latLng(station.coordinates[0], station.coordinates[1]))
      : false;

    return matchesType && matchesBounds;
  });

  return (
    <div className="w-full h-[calc(100vh-64px)] relative">
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
          // Изящный вложенный тернарник: если ev — зеленая, если fuel — оранжевая, иначе (gas) — синяя
          icon={station.type === 'ev' ? evIcon : station.type === 'fuel' ? fuelIcon : gasIcon}
          eventHandlers={{
            // ... твои обработчики mouseover / mouseout / click прежние
          }}
        >
          {/* Внутри Popup тоже обнови отображение, чтобы там рендерились цены GLP и GNC */}
          <Popup closeButton={false}>
            <div className="p-1 font-sans">
              <h3 className="font-bold text-base border-b border-gray-200 pb-1 mb-1 text-gray-800">{station.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{station.address}</p>
              
              {station.fuelPrices && (
                <div className="text-sm space-y-0.5">
                  {station.fuelPrices.sp95 > 0 && (
                    <div className="flex justify-between gap-4"><span className="text-gray-600">SP95:</span><span className="font-semibold text-green-600">€{station.fuelPrices.sp95}</span></div>
                  )}
                  {station.fuelPrices.glp && (
                    <div className="flex justify-between gap-4"><span className="text-gray-600">Автогаз GLP:</span><span className="font-semibold text-blue-600">€{station.fuelPrices.glp}</span></div>
                  )}
                  {station.fuelPrices.gnc && (
                    <div className="flex justify-between gap-4"><span className="text-gray-600">Метан GNC:</span><span className="font-semibold text-purple-600">€{station.fuelPrices.gnc}</span></div>
                  )}
                  {station.fuelPrices.diesel > 0 && (
                    <div className="flex justify-between"><span className="text-gray-600">Diesel:</span><span className="font-semibold text-amber-600">€{station.fuelPrices.diesel}</span></div>
                  )}
                </div>
              )}
              
              {/* ... отображение EV коннекторов ниже остается без изменений ... */}
            </div>
          </Popup>
        </Marker>
        ))}
      </MapContainer>
    </div>
  );
}