import { create } from 'zustand';

interface MapState {
  userLocation: [number, number] | null; // [latitude, longitude]
  mapCenter: [number, number];           // Где сейчас отцентрована карта
  zoom: number;
  setUserLocation: (location: [number, number]) => void;
  setMapCenter: (center: [number, number]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  mapCenter: [40.416775, -3.703790], // По умолчанию Мадрид, пока не определим геопозицию
  zoom: 13,

  setUserLocation: (location) => set({ userLocation: location, mapCenter: location }),
  setMapCenter: (center) => set({ mapCenter: center }),
}));