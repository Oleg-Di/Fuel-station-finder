import { create } from 'zustand';
import type { Station, StationType } from '../types/station';
import { mockStations } from '../data/mockStations';
import { fetchSpanishGasStations } from '../services/api';
import * as L from 'leaflet';

interface MapState {
  userLocation: [number, number] | null;
  mapCenter: [number, number];
  zoom: number;
  stations: Station[];
  selectedStation: Station | null;
  filterType: StationType | 'all';
  isLoading: boolean;
  mapBounds: L.LatLngBounds | null;
  maxPrice: number; // Максимальная цена для фильтра
  
  setUserLocation: (location: [number, number]) => void;
  setMapCenter: (center: [number, number]) => void;
  setSelectedStation: (station: Station | null) => void;
  setFilterType: (type: StationType | 'all') => void;
  setMapBounds: (bounds: L.LatLngBounds) => void;
  setMaxPrice: (price: number) => void; // Метод изменения макс. цены
  loadRealStations: () => Promise<void>;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  mapCenter: [39.1558, -0.4325], 
  zoom: 12,
  stations: mockStations.filter(s => s.type === 'ev'), 
  selectedStation: null,
  filterType: 'all',
  isLoading: false,
  mapBounds: null,
  maxPrice: 2.5, // По умолчанию ставим максимум (2.50 €)

  setUserLocation: (location) => set({ userLocation: location, mapCenter: location }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setFilterType: (type) => set({ filterType: type }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setMaxPrice: (price) => set({ maxPrice: price }),
  
  loadRealStations: async () => {
    set({ isLoading: true });
    const realGasStations = await fetchSpanishGasStations();
    set((state) => ({
      stations: [...state.stations, ...realGasStations],
      isLoading: false
    }));
  }
}));