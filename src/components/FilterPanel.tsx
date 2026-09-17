import React from 'react';
import { Search, Filter, RotateCcw, Calendar, Camera } from 'lucide-react';
import { FilterState, GPSFilterStatus } from '../types/photo';

interface FilterPanelProps {
  filter: FilterState;
  onFilterChange: (newFilter: Partial<FilterState>) => void;
  onResetFilter: () => void;
  cameraOptions: string[];
  darkMode: boolean;
  totalFiltered: number;
  totalPhotos: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
  cameraOptions,
  darkMode,
  totalFiltered,
  totalPhotos,
}) => {
  const isFiltered =
    filter.searchQuery.trim() !== '' ||
    filter.gpsStatus !== 'all' ||
    filter.camera !== '' ||
    filter.startDate !== '' ||
    filter.endDate !== '';

  return (
    <div
      id="filter-panel"
      className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-sm tracking-tight">Filter & Pencarian</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalFiltered} dari {totalPhotos} foto
          </span>
        </div>

        {isFiltered && (
          <button
            id="reset-filter-btn"
            onClick={onResetFilter}
            className={`self-start md:self-auto text-xs font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
              darkMode
                ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* 1. Real-time Search Box (Nama file, koordinat, kamera) */}
        <div className="lg:col-span-4 relative">
          <label htmlFor="search-input" className={`block text-[11px] font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Cari Foto
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              placeholder="Cari nama file, -0.305400, kamera..."
              value={filter.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-slate-900/70 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
              }`}
            />
          </div>
        </div>

        {/* 2. GPS Status Filter Dropdown dengan Badge Resmi */}
        <div className="lg:col-span-3">
          <label htmlFor="gps-status-select" className={`block text-[11px] font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Status / Sumber Koordinat
          </label>
          <select
            id="gps-status-select"
            value={filter.gpsStatus}
            onChange={(e) => onFilterChange({ gpsStatus: e.target.value as GPSFilterStatus })}
            className={`w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-slate-900/70 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
            }`}
          >
            <option value="all">Semua Status Foto</option>
            <option value="exif_gps">🟢 EXIF GPS</option>
            <option value="ocr_gps">🟡 OCR GPS (Timestamp)</option>
            <option value="no_gps">🔴 GPS TIDAK DITEMUKAN</option>
          </select>
        </div>

        {/* 3. Camera Model Dropdown */}
        <div className="lg:col-span-2">
          <label htmlFor="camera-select" className={`block text-[11px] font-semibold mb-1 flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Camera className="w-3 h-3 text-slate-400" />
            Kamera
          </label>
          <select
            id="camera-select"
            value={filter.camera}
            onChange={(e) => onFilterChange({ camera: e.target.value })}
            className={`w-full px-3 py-2 text-xs rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-blue-500 truncate ${
              darkMode
                ? 'bg-slate-900/70 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
            }`}
          >
            <option value="">Semua Kamera</option>
            {cameraOptions.map((cam) => (
              <option key={cam} value={cam}>
                {cam}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Date Range: Start & End */}
        <div className="lg:col-span-3">
          <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <Calendar className="w-3 h-3 text-slate-400" />
            Rentang Tanggal
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              id="start-date-input"
              type="date"
              aria-label="Tanggal Mulai"
              value={filter.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className={`w-full px-2 py-1.5 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-900/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <input
              id="end-date-input"
              type="date"
              aria-label="Tanggal Akhir"
              value={filter.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className={`w-full px-2 py-1.5 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-900/70 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
