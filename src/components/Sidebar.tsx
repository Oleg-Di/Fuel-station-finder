import { useMapStore } from '../store/useMapStore';
import { Station } from '../types/station';
import * as L from 'leaflet';

export function Sidebar() {
  const { 
    stations, 
    filterType, 
    mapBounds, 
    selectedStation, 
    maxPrice,
    setFilterType, 
    setMapCenter, 
    setSelectedStation,
    setMaxPrice
  } = useMapStore();

  // Умная фильтрация: тип + границы экрана + цена
  const filteredStations = stations.filter((station) => {
    const matchesType = filterType === 'all' ? true : station.type === filterType;
    
    const matchesBounds = mapBounds 
      ? mapBounds.contains(L.latLng(station.coordinates[0], station.coordinates[1]))
      : true;

    // Фильтр по цене: ищем минимальную доступную цену на станции (будь то 95, дизель или газ)
    // Если это электрозарядка, фильтр цены пропускает её автоматически
    let matchesPrice = true;
    if (station.type !== 'ev' && station.fuelPrices) {
      const prices = [
        station.fuelPrices.sp95,
        station.fuelPrices.diesel,
        station.fuelPrices.glp,
        station.fuelPrices.gnc
      ].filter((p): p is number => !!p && p > 0);

      if (prices.length > 0) {
        const minStationPrice = Math.min(...prices);
        matchesPrice = minStationPrice <= maxPrice;
      }
    }

    return matchesType && matchesBounds && matchesPrice;
  });

  const handleStationClick = (station: Station) => {
    setMapCenter(station.coordinates);
    setSelectedStation(station);
  };

  return (
    <div className="w-80 h-[calc(100vh-64px)] bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg">
      
      <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Станции на экране</h2>
        
        {/* Вкладки */}
        <div className="flex bg-gray-200 p-1 rounded-lg text-[12px] gap-0.5">
          {['all', 'fuel', 'gas', 'ev'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
                filterType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type === 'all' ? 'Все' : type === 'fuel' ? '⛽ Бензин' : type === 'gas' ? '💨 Газ' : '⚡ Зарядки'}
            </button>
          ))}
        </div>

        {/* Ползунок цены (рендерится с помощью лаконичного тернарника только для топлива/газа/всего) */}
        {filterType !== 'ev' && (
          <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-1 text-xs font-semibold text-gray-600">
              <span>Макс. цена топлива:</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold text-sm">
                €{maxPrice.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="1.00"
              max="2.20"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
            />
          </div>
        )}
      </div>

      {/* Список карточек */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredStations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Ничего не найдено. Измените фильтр цены или подвиньте карту.
          </div>
        ) : (
          filteredStations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            
            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight pr-2 truncate" title={station.name}>
                    {station.name}
                  </h3>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    station.type === 'ev' ? 'bg-green-100 text-green-800' : station.type === 'fuel' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {station.type === 'ev' ? 'Электро' : station.type === 'fuel' ? 'Бензин' : 'Газ'}
                  </span>
                </div>
                
                <p className="text-[11px] text-gray-500 mb-2 truncate">{station.address}</p>

                {station.type !== 'ev' && station.fuelPrices ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs bg-gray-50 p-1.5 rounded-lg text-gray-600">
                    {station.fuelPrices.sp95 > 0 && <div>95: <span className="font-bold text-gray-900">€{station.fuelPrices.sp95}</span></div>}
                    {station.fuelPrices.diesel > 0 && <div>Дизель: <span className="font-bold text-gray-900">€{station.fuelPrices.diesel}</span></div>}
                    {station.fuelPrices.glp && <div>GLP: <span className="font-bold text-blue-600">€{station.fuelPrices.glp}</span></div>}
                    {station.fuelPrices.gnc && <div>GNC: <span className="font-bold text-purple-600">€{station.fuelPrices.gnc}</span></div>}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {station.evConnectors?.map((c, idx) => (
                      <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.available ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-600 line-through opacity-60'}`}>{c.type} ({c.powerKw}kW)</span>
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