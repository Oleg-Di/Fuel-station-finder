import { create } from 'zustand';
import { Station, StationType } from '../types/station';
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
  mapBounds: L.LatLngBounds | null; // Храним текущие границы экрана
  
  setUserLocation: (location: [number, number]) => void;
  setMapCenter: (center: [number, number]) => void;
  setSelectedStation: (station: Station | null) => void;
  setFilterType: (type: StationType | 'all') => void;
  setMapBounds: (bounds: L.LatLngBounds) => void; // Метод обновления границ
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

  setUserLocation: (location) => set({ userLocation: location, mapCenter: location }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setFilterType: (type) => set({ filterType: type }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  
  loadRealStations: async () => {
    set({ isLoading: true });
    const realGasStations = await fetchSpanishGasStations();
    set((state) => ({
      stations: [...state.stations, ...realGasStations],
      isLoading: false
    }));
  }
}));