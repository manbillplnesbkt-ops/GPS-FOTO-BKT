import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { PhotoData } from '../types/photo';
import { formatDateTime } from '../utils/dateUtils';

interface PhotoPreviewModalProps {
  photo: PhotoData | null;
  onClose: () => void;
  onCopyCoordinates?: (coords: string) => void;
  darkMode: boolean;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  onClose,
  onCopyCoordinates,
  darkMode,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!photo) return null;

  const hasCoordinate = Boolean(photo.coordinate);

  const handleCopy = () => {
    if (!photo.coordinate || !onCopyCoordinates) return;
    onCopyCoordinates(photo.coordinate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border shadow-2xl ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Top Bar */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="truncate">
            <h4 className="font-bold text-sm truncate" title={photo.fileName}>
              {photo.fileName}
            </h4>
            <p className="text-[11px] text-slate-400">
              {photo.width && photo.height ? `${photo.width} × ${photo.height} px • ` : ''}
              {formatDateTime(photo.dateTime)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasCoordinate && onCopyCoordinates && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                title="Salin Koordinat"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {copied ? 'Tersalin' : 'Salin Koordinat'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
              }`}
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Image Display */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70 min-h-[320px]">
          <img
            src={photo.previewUrl}
            alt={photo.fileName}
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Bottom EXIF Snapshot */}
        <div
          className={`p-3.5 text-xs border-t flex flex-wrap items-center justify-between gap-2 ${
            darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-4">
            {hasCoordinate ? (
              <div className="flex items-center gap-2 font-mono font-semibold text-blue-500 dark:text-blue-400">
                <span>KOORDINAT: {photo.coordinate}</span>
                {photo.altitude !== null && (
                  <span className="text-slate-400 font-sans font-normal">• {photo.altitude} m</span>
                )}
              </div>
            ) : (
              <span className="text-amber-500 font-medium">GPS Tidak Tersedia</span>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            {[photo.make, photo.model].filter(Boolean).join(' ') || 'Kamera tidak terdeteksi'}
          </div>
        </div>
      </div>
    </div>
  );
};
