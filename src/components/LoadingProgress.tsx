import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  current: number;
  total: number;
  currentFileName?: string;
  statusText?: string;
  darkMode: boolean;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  current,
  total,
  currentFileName,
  statusText,
  darkMode,
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div
        id="loading-progress-modal"
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base">Memproses Foto & EXIF...</h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pipeline EXIF & Fallback OCR Timestamp secara lokal di browser
            </p>
          </div>
        </div>

        {/* Progress Numbers */}
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span>{percentage}% Selesai</span>
          <span className="font-mono">{current} / {total} foto</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-3 space-y-1">
          {currentFileName && (
            <p className={`text-[11px] font-mono truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              File: <span className="font-semibold">{currentFileName}</span>
            </p>
          )}
          {statusText && (
            <p className="text-[11px] text-blue-500 dark:text-blue-400 font-medium animate-pulse">
              {statusText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
