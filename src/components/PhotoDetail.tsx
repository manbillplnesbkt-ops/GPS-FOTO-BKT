import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  ScanText,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { PhotoData } from '../types/photo';
import { formatDateTime } from '../utils/dateUtils';
import { formatFileSize } from '../utils/fileUtils';

interface PhotoDetailProps {
  photo: PhotoData | null;
  onClose: () => void;
  onCopyCoordinates: (coords: string) => void;
  onOpenPreviewModal: (photo: PhotoData) => void;
  onRerunOcr?: (photo: PhotoData) => Promise<void>;
  onPrevious?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalPhotos?: number;
  darkMode: boolean;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({
  photo,
  onClose,
  onCopyCoordinates,
  onOpenPreviewModal,
  onRerunOcr,
  onPrevious,
  onNext,
  currentIndex = 0,
  totalPhotos = 0,
  darkMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);

  if (!photo) return null;

  const hasCoordinate = Boolean(photo.coordinate);
  const cameraName = [photo.make, photo.model].filter(Boolean).join(' ') || '-';

  const handleCopy = () => {
    if (!photo.coordinate) return;
    onCopyCoordinates(photo.coordinate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleRerun = async () => {
    if (!onRerunOcr || isScanningOcr) return;
    setIsScanningOcr(true);
    try {
      await onRerunOcr(photo);
    } finally {
      setIsScanningOcr(false);
    }
  };

  return (
    <div
      id="photo-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="photo-detail-card"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Top Bar */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight">DETAIL FOTO</h3>
              {totalPhotos > 0 && (
                <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Foto {currentIndex + 1} dari {totalPhotos}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Prev / Next Buttons */}
            {onPrevious && (
              <button
                onClick={onPrevious}
                disabled={currentIndex <= 0}
                className={`p-1.5 rounded-lg border transition-colors ${
                  currentIndex <= 0
                    ? 'opacity-40 cursor-not-allowed'
                    : darkMode
                    ? 'hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Foto sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                disabled={currentIndex >= totalPhotos - 1}
                className={`p-1.5 rounded-lg border transition-colors ${
                  currentIndex >= totalPhotos - 1
                    ? 'opacity-40 cursor-not-allowed'
                    : darkMode
                    ? 'hover:bg-slate-800 border-slate-700 text-slate-300'
                    : 'hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Foto berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              id="close-detail-modal-btn"
              onClick={onClose}
              className={`p-1.5 ml-1 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Image Container with Zoom option */}
          <div className="relative group overflow-hidden rounded-xl bg-slate-950 aspect-video flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <img
              src={photo.previewUrl}
              alt={photo.fileName}
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => onOpenPreviewModal(photo)}
              className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-sm transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Perbesar
            </button>
          </div>

          {/* Status Badge Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
              photo.gpsStatusType === 'exif_gps'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                : photo.gpsStatusType === 'ocr_gps'
                ? 'bg-amber-50/80 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                : 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
            }`}
          >
            <div>
              <span className="text-[10.5px] uppercase font-bold tracking-wider opacity-80 block mb-0.5">
                Status Koordinat
              </span>
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <span>
                  {photo.gpsStatusType === 'exif_gps'
                    ? '🟢 EXIF GPS'
                    : photo.gpsStatusType === 'ocr_gps'
                    ? '🟡 OCR GPS'
                    : '🔴 GPS TIDAK DITEMUKAN'}
                </span>
                <span className="text-xs font-normal opacity-75">
                  ({photo.source === 'EXIF' ? 'Metadata EXIF Asli' : photo.source === 'OCR' ? 'Cap Timestamp Foto' : 'Non-geotagged'})
                </span>
              </div>
            </div>

            {onRerunOcr && (
              <button
                type="button"
                onClick={handleRerun}
                disabled={isScanningOcr}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-current hover:bg-black/5 dark:hover:bg-white/10 transition-all flex items-center gap-1 shrink-0"
                title="Pindai ulang foto dengan mesin OCR"
              >
                <RefreshCw className={`w-3 h-3 ${isScanningOcr ? 'animate-spin' : ''}`} />
                <span>{isScanningOcr ? 'Memindai...' : 'Pindai OCR'}</span>
              </button>
            )}
          </div>

          {/* OCR Detection Details Card (If OCR was run or found) */}
          {(photo.source === 'OCR' || photo.ocrMatchedSnippet || photo.ocrText) && (
            <div
              id="ocr-detected-snippet-card"
              className={`p-3 rounded-xl border text-xs ${
                darkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ScanText className="w-3.5 h-3.5 text-amber-500" />
                <span>Hasil Pengenalan Teks OCR:</span>
              </div>
              {photo.ocrMatchedSnippet && (
                <p className="font-mono text-xs bg-black/10 dark:bg-black/30 p-2 rounded-lg font-semibold my-1 break-all">
                  &ldquo;{photo.ocrMatchedSnippet}&rdquo;
                </p>
              )}
              {photo.ocrText && (
                <div className="mt-1.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                    Teks Mentah Terbaca:
                  </span>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap max-h-24 overflow-y-auto p-1.5 bg-black/5 dark:bg-black/20 rounded">
                    {photo.ocrText}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Metadata Fields Section */}
          <div className="space-y-3 text-xs">
            {/* 1. Nama File */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nama File
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white break-all">
                {photo.fileName}
              </p>
            </div>

            {/* 2. KOORDINAT */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                KOORDINAT (Format Baku: -0.305400, 100.370867)
              </span>
              <p
                className={`font-mono font-bold text-sm ${
                  photo.source === 'OCR'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {hasCoordinate ? photo.coordinate : '-'}
              </p>
            </div>

            {/* 3. KOORDINAT DMS */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                KOORDINAT DMS
              </span>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200">
                {photo.dmsCoordinate || '-'}
              </p>
            </div>

            {/* 4. Altitude & Ukuran File */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Altitude
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {photo.altitude !== null ? `${photo.altitude} m` : '-'}
                </p>
              </div>

              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ukuran File
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {photo.fileSize ? formatFileSize(photo.fileSize) : '-'}
                </p>
              </div>
            </div>

            {/* 5. Tanggal / Jam */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Tanggal / Jam
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {formatDateTime(photo.dateTime)}
              </p>
            </div>

            {/* 6. Kamera */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold block uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Kamera / Sumber Foto
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {cameraName}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action: [ 📋 Salin Koordinat ] */}
        <div
          className={`p-4 border-t flex items-center justify-between gap-3 ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {hasCoordinate ? (
            <button
              id="detail-copy-coords-btn"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>✓ Koordinat berhasil disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>📋 Salin Koordinat</span>
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed text-center"
            >
              GPS Tidak Tersedia pada Foto Ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
