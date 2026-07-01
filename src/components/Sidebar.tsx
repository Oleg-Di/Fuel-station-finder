
import { useMapStore } from '../store/useMapStore';
import { Station } from '../types/station';
import * as L from 'leaflet';

export function Sidebar() {
  // Достаем всё необходимое из централизованного Zustand-стора
  const { 
    stations, 
    filterType, 
    mapBounds, 
    selectedStation, 
    setFilterType, 
    setMapCenter, 
    setSelectedStation 
  } = useMapStore();

  // Умная фильтрация: оставляем только те станции, которые подходят под фильтр И видны на экране
  const filteredStations = stations.filter((station) => {
    const matchesType = filterType === 'all' ? true : station.type === filterType;
    
    // Если границы карты еще не инициализировались, временно показываем станцию
    const matchesBounds = mapBounds 
      ? mapBounds.contains(L.latLng(station.coordinates[0], station.coordinates[1]))
      : true;

    return matchesType && matchesBounds;
  });

  // Обработчик клика по карточке: плавно двигаем карту к станции и активируем её балун
  const handleStationClick = (station: Station) => {
    setMapCenter(station.coordinates);
    setSelectedStation(station);
  };

  return (
    <div className="w-80 h-[calc(100vh-64px)] bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg">
      
      {/* Шапка сайдбара и блок фильтров */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Станции на экране</h2>
        
        {/* Сетка кнопок-переключателей табов */}
        <div className="flex bg-gray-200 p-1 rounded-lg text-[12px] gap-0.5">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
              filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilterType('fuel')}
            className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
              filterType === 'fuel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⛽ Бензин
          </button>
          <button
            onClick={() => setFilterType('gas')}
            className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
              filterType === 'gas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💨 Газ
          </button>
          <button
            onClick={() => setFilterType('ev')}
            className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
              filterType === 'ev' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚡ Зарядки
          </button>
        </div>
      </div>

      {/* Прокручиваемый список карточек станций */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredStations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">В этой области ничего не найдено</p>
            <p className="text-xs text-gray-400 mt-1">Попробуйте подвигать карту</p>
          </div>
        ) : (
          filteredStations.map((station) => {
            // Проверяем, выбрана ли именно эта карточка прямо сейчас
            const isSelected = selectedStation?.id === station.id;
            
            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500' 
                    : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
              >
                {/* Название и Лэйбл типа станции */}
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight pr-2 truncate" title={station.name}>
                    {station.name}
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                    station.type === 'ev' 
                      ? 'bg-green-100 text-green-800' 
                      : station.type === 'fuel' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {station.type === 'ev' ? 'Электро' : station.type === 'fuel' ? 'Бензин' : 'Газ'}
                  </span>
                </div>
                
                {/* Адрес */}
                <p className="text-[11px] text-gray-500 mb-2 truncate" title={station.address}>
                  {station.address}
                </p>

                {/* Блок цен или разъемов в зависимости от типа станции */}
                {station.type !== 'ev' && station.fuelPrices ? (
                  // Вывод цен для Бензина и Газа
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs bg-gray-50 p-1.5 rounded-lg text-gray-600">
                    {station.fuelPrices.sp95 > 0 && (
                      <div>95: <span className="font-bold text-gray-900">€{station.fuelPrices.sp95}</span></div>
                    )}
                    {station.fuelPrices.diesel > 0 && (
                      <div>Дизель: <span className="font-bold text-gray-900">€{station.fuelPrices.diesel}</span></div>
                    )}
                    {station.fuelPrices.glp && (
                      <div>GLP: <span className="font-bold text-blue-600">€{station.fuelPrices.glp}</span></div>
                    )}
                    {station.fuelPrices.gnc && (
                      <div>GNC: <span className="font-bold text-purple-600">€{station.fuelPrices.gnc}</span></div>
                    )}
                  </div>
                ) : (
                  // Вывод доступных портов для Электрозарядок
                  <div className="flex flex-wrap gap-1">
                    {station.evConnectors?.map((connector, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          connector.available 
                            ? 'bg-gray-100 text-gray-700' 
                            : 'bg-red-50 text-red-600 line-through opacity-60'
                        }`}
                      >
                        {connector.type} ({connector.powerKw}kW)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}