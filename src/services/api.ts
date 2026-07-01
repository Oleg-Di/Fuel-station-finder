import { Station, StationType } from '../types/station';

const BASE_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes';

// Описываем структуру сырого ответа от сервера Министерства энергетики Испании
interface PublicStationItem {
  IDEESS: string;
  Rótulo: string;
  Dirección: string;
  Municipio: string;
  Latitud: string;
  'Longitud (WGS84)': string;
  'Precio Gasolina 95 E5': string;
  'Precio Gasolina 98 E5': string;
  'Precio Gasoleo A': string;
  'Precio Gas Licuado de Petróleo': string; // Поле для газа GLP
  'Precio Gas Natural Comprimido': string;  // Поле для газа GNC
}

export async function fetchSpanishGasStations(): Promise<Station[]> {
  try {
    // Запрашиваем полный список наземных станций по всей стране
    const response = await fetch(`${BASE_URL}/EstacionesTerrestres/`);
    if (!response.ok) throw new Error('Ошибка сети при запросе к Geoportal Gasolineras');
    
    const data = await response.json();
    const rawStations: PublicStationItem[] = data.ListaEESSPrecio;

    // Мапим и трансформируем данные без жесткой привязки к конкретному городу
    return rawStations
      .filter((item) => item.Latitud && item['Longitud (WGS84)']) // Проверяем наличие координат
      .map((item) => {
        // Конвертируем испанский формат координат (строка с запятой) в нормальный float
        const lat = parseFloat(item.Latitud.replace(',', '.'));
        const lng = parseFloat(item['Longitud (WGS84)'].replace(',', '.'));
        
        // Безопасно парсим цены на топливо (если цены нет — оставляем undefined или 0)
        const sp95 = item['Precio Gasolina 95 E5'] ? parseFloat(item['Precio Gasolina 95 E5'].replace(',', '.')) : undefined;
        const sp98 = item['Precio Gasolina 98 E5'] ? parseFloat(item['Precio Gasolina 98 E5'].replace(',', '.')) : undefined;
        const diesel = item['Precio Gasoleo A'] ? parseFloat(item['Precio Gasoleo A'].replace(',', '.')) : undefined;
        
        // Безопасно парсим цены на газ
        const glp = item['Precio Gas Licuado de Petróleo'] ? parseFloat(item['Precio Gas Licuado de Petróleo'].replace(',', '.')) : undefined;
        const gnc = item['Precio Gas Natural Comprimido'] ? parseFloat(item['Precio Gas Natural Comprimido'].replace(',', '.')) : undefined;

        // Определяем тип станции: если на заправке есть газ, но нет обычного 95-го,
        // ставим тип 'gas'. В остальных случаях — стандартный 'fuel'.
        const finalType: StationType = (glp || gnc) && !sp95 ? 'gas' : 'fuel';

        return {
          id: item.IDEESS,
          name: item.Rótulo.trim() ? item.Rótulo.trim() : 'Gasolinera',
          brand: item.Rótulo.trim(),
          type: finalType,
          address: item.Dirección,
          coordinates: [lat, lng] as [number, number],
          fuelPrices: {
            sp95: sp95 || 0,
            sp98: isNaN(sp98 as number) ? undefined : sp98,
            diesel: diesel || 0,
            glp: isNaN(glp as number) ? undefined : glp,
            gnc: isNaN(gnc as number) ? undefined : gnc,
          }
        };
      })
      // Исключаем из выдачи "пустые" станции, которые закрыты или не передали никаких цен
      .filter((s) => s.fuelPrices?.sp95 || s.fuelPrices?.glp || s.fuelPrices?.gnc || s.fuelPrices?.diesel);
  } catch (error) {
    console.error('Не удалось загрузить данные из Минэнерго Испании:', error);
    return [];
  }
}