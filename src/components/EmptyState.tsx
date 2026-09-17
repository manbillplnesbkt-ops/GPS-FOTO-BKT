import React from 'react';
import { Camera, UploadCloud, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onTriggerUpload: () => void;
  onLoadSample: () => void;
  darkMode: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onTriggerUpload,
  onLoadSample,
  darkMode,
}) => {
  return (
    <div
      id="empty-state-view"
      className={`p-8 sm:p-12 rounded-2xl border text-center flex flex-col items-center justify-center transition-colors shadow-sm ${
        darkMode ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
        <Camera className="w-8 h-8" />
      </div>

      <h3 className={`text-lg sm:text-xl font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        Belum Ada Foto yang Dimuat
      </h3>

      <p className="text-xs sm:text-sm max-w-md leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
        Upload satu atau beberapa foto untuk membaca koordinat GPS, melihat detail EXIF secara terstruktur, dan mengekspor data ke file Excel.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onTriggerUpload}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Foto</span>
        </button>

        <button
          onClick={onLoadSample}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all active:scale-95 ${
            darkMode
              ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Muat Contoh Sampel</span>
        </button>
      </div>
    </div>
  );
};
