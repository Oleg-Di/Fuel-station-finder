import { Station } from '../types/station';

export const mockStations: Station[] = [
  {
    id: '1',
    name: 'Repsol Alzira',
    type: 'fuel',
    brand: 'Repsol',
    address: 'Av. de la Dignitat Umana, 46600 Alzira, Valencia',
    coordinates: [39.1558, -0.4325],
    fuelPrices: {
      sp95: 1.629,
      sp98: 1.769,
      diesel: 1.519
    }
  },
  {
    id: '2',
    name: 'Iberdrola Charging Station',
    type: 'ev',
    brand: 'Iberdrola',
    address: 'Carrer de Sueca, 46600 Alzira, Valencia',
    coordinates: [39.1512, -0.4280],
    evConnectors: [
      { type: 'Type2', powerKw: 22, available: true },
      { type: 'CCS2', powerKw: 50, available: false }
    ]
  },
  {
    id: '3',
    name: 'Cepsa Valencia',
    type: 'fuel',
    brand: 'Cepsa',
    address: 'Av. de Giorgeta, 46007 Valencia',
    coordinates: [39.4594, -0.3862],
    fuelPrices: {
      sp95: 1.599,
      diesel: 1.499
    }
  },
  {
    id: '4',
    name: 'Tesla Supercharger',
    type: 'ev',
    brand: 'Tesla',
    address: 'CC Bonaire, 46960 Aldaia, Valencia',
    coordinates: [39.4831, -0.4778],
    evConnectors: [
      { type: 'CCS2', powerKw: 150, available: true }
    ]
  }
];