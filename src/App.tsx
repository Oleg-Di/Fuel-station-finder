import { useEffect } from 'react';
import { MapView } from './components/MapView';
import { Sidebar } from './components/Sidebar';
import { useMapStore } from './store/useMapStore';

function App() {
  const loadRealStations = useMapStore((state) => state.loadRealStations);
  const isLoading = useMapStore((state) => state.isLoading);

  useEffect(() => {
    loadRealStations();
  }, [loadRealStations]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <header className="w-full h-14 bg-indigo-600 flex items-center justify-between px-6 shadow-md z-20">
        <h1 className="text-white font-black text-xl tracking-wide flex items-center gap-2">
          Base Carburantes API 🇪🇸
        </h1>
        {isLoading && (
          <span className="text-xs bg-indigo-700 text-indigo-200 px-3 py-1 rounded-full animate-pulse font-medium">
            Синхронизация цен...
          </span>
        )}
      </header>

      <div className="w-full flex-1 flex overflow-hidden">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
      <Sidebar />
      <MapView />
    </div>
      </div>
    </div>
  );
}

export default App;