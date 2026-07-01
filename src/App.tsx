import { MapView } from './components/MapView';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased">
      {/* Шапка приложения */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h1 className="text-lg font-black text-gray-950 tracking-tight">EcoStation Finder</h1>
            <p className="text-xs text-gray-500 font-medium -mt-1">Цены на топливо и электрозарядки</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs">Карта готова</span>
        </div>
      </header>

      {/* Контейнер с картой */}
      <main className="flex-1">
        <MapView />
      </main>
    </div>
  );
}