import { useMapStore } from '../store/useMapStore';
import * as L from 'leaflet';
import type { Station } from '../types/station';

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
        const minStationPrice = Math.min(...validPrices);
        matchesPrice = minStationPrice <= maxPrice;
      } else {
        matchesPrice = false; 
      }
    }

    return matchesType && matchesBounds && matchesPrice;
  });

  const handleStationClick = (station: Station) => {
    setMapCenter(station.coordinates);
    setSelectedStation(station);
    
    // На мобилках скроллим карту вверх к маркеру при клике на карточку
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    /* МАГИЯ ТАЙЛВИНДА ДЛЯ АДАПТИВНОСТИ:
      w-full md:w-80 -> На мобилках на всю ширину, на ПК — 320px
      h-96 md:h-[calc(100vh-64px)] -> На мобилках снизу фиксированная высота шторки, на ПК — во весь рост
      border-t md:border-t-0 md:border-r -> Граница сверху на мобилках, справа на ПК
    */
    <div className="w-full md:w-80 h-96 md:h-[calc(100vh-64px)] bg-white border-t md:border-t-0 md:border-r border-gray-200 flex flex-col z-10 shadow-lg relative shrink-0">
      
      {/* Шапка с фильтрами */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-base md:text-xl font-bold text-gray-800">Станции на экране</h2>
          <span className="text-xs text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full font-medium md:hidden">
            Найдено: {filteredStations.length}
          </span>
        </div>
        
        {/* Вкладки */}
        <div className="flex bg-gray-200 p-1 rounded-lg text-[11px] md:text-[12px] gap-0.5">
          {['all', 'fuel', 'gas', 'ev'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`flex-1 py-1.5 text-center font-medium rounded-md transition-all ${
                filterType === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type === 'all' ? 'Все' : type === 'fuel' ? '⛽ Бенз' : type === 'gas' ? '💨 Газ' : '⚡ Электро'}
            </button>
          ))}
        </div>

        {/* Ползунок цены */}
        {filterType !== 'ev' && (
          <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-1 text-[11px] font-semibold text-gray-600">
              <span>Макс. цена топлива:</span>
              <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-bold text-xs">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
        {filteredStations.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Ничего не найдено. Измените фильтр цены или подвиньте карту.
          </div>
        ) : (
          filteredStations.map((station) => {
            const isSelected = selectedStation?.id === station.id;
            
            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-sm' 
                    : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-bold text-gray-900 text-xs md:text-sm leading-tight pr-2 truncate" title={station.name}>
                    {station.name}
                  </h3>
                  <span className={`text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    station.type === 'ev' ? 'bg-green-100 text-green-800' : station.type === 'fuel' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {station.type === 'ev' ? '⚡' : station.type === 'fuel' ? '⛽' : '💨'}
                  </span>
                </div>
                
                <p className="text-[10px] md:text-[11px] text-gray-500 mb-1.5 truncate">{station.address}</p>

                {station.type !== 'ev' && station.fuelPrices ? (
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] bg-gray-50 p-1 rounded-lg text-gray-600">
                    {station.fuelPrices.sp95 > 0 && <div>95: <span className="font-bold text-gray-900">€{station.fuelPrices.sp95}</span></div>}
                    {station.fuelPrices.diesel > 0 && <div>D: <span className="font-bold text-gray-900">€{station.fuelPrices.diesel}</span></div>}
                    {station.fuelPrices.glp && <div>GLP: <span className="font-bold text-blue-600">€{station.fuelPrices.glp}</span></div>}
                    {station.fuelPrices.gnc && <div>GNC: <span className="font-bold text-purple-600">€{station.fuelPrices.gnc}</span></div>}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {station.evConnectors?.map((c, idx) => (
                      <span key={idx} className={`text-[9px] px-1 py-0.5 rounded font-medium ${c.available ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-600 line-through opacity-60'}`}>{c.type} ({c.powerKw}kW)</span>
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