import React from 'react';
import { MapPin, ShieldCheck, Moon, Sun, Sparkles } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLoadSampleData: () => void;
  photosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onLoadSampleData,
  photosCount,
}) => {
  return (
    <header
      id="app-header"
      className={`sticky top-0 z-30 transition-colors border-b backdrop-blur-md ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              FotoGPS Reader
            </h1>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Baca Koordinat • Data Foto • Export Excel
            </p>
          </div>
        </div>

        {/* Right: Security Badge & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 100% Lokal Privacy Badge */}
          <div
            id="privacy-badge"
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-slate-800/60 border-slate-700/80 text-emerald-400'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold block leading-tight">🛡 100% Lokal</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Foto tidak diunggah ke server
              </span>
            </div>
          </div>

          {/* Quick Demo Sample Data Button */}
          <button
            id="header-load-sample-btn"
            onClick={onLoadSampleData}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Coba aplikasi dengan sampel foto lapangan bersensor GPS"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Contoh Sampel</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl border transition-colors ${
              darkMode
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-amber-400'
                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
            }`}
            title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
