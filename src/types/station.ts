// Добавляем 'gas' в типы станций
export type StationType = 'fuel' | 'ev' | 'gas';

export interface FuelPrices {
  sp95: number;
  sp98?: number;
  diesel: number;
  glp?: number; // Автогаз СУГ
  gnc?: number; // Газ метан
}

export interface EVConnector {
  type: 'Type2' | 'CCS2' | 'CHAdeMO';
  powerKw: number;
  available: boolean;
}

export interface Station {
  id: string;
  name: string;
  type: StationType; // 'fuel' | 'ev' | 'gas'
  brand: string;
  address: string;
  coordinates: [number, number];
  fuelPrices?: FuelPrices;
  evConnectors?: EVConnector[];
}