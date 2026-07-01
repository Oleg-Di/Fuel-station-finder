import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import * as L from 'leaflet';

// Хак для Leaflet: по умолчанию в React иконки маркеров ломаются из-за путей сборщика.
// Мы принудительно переназначаем стандартный маркер на рабочий URL.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Вспомогательный компонент для плавного перемещения камеры карты
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapView() {
  const { userLocation, mapCenter, zoom, setUserLocation } = useMapStore();

  // Запрашиваем геопозицию при первой загрузке
  useEffect(() => {
    if (typeof window === 'undefined' || !window.navigator.geolocation) return;

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.error("Ошибка при получении геопозиции:", error);
      }
    );
  }, [setUserLocation]);

  return (
    <div className="w-full h-[calc(100vh-64px)] relative">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        className="w-full h-full z-0"
      >
        {/* Слой карты от OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Плавный перенос камеры на центр */}
        <ChangeView center={mapCenter} />

        {/* Если геопозиция определена, ставим маркер пользователя */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-sm font-bold">📍 Вы находитесь здесь</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}