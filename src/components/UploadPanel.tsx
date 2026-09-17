import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ScanText,
  Info,
  Smartphone,
  ShieldCheck,
  Check
} from 'lucide-react';
import { isSupportedImageFile } from '../utils/fileUtils';

interface UploadPanelProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  lastProcessedStats: {
    total: number;
    exifGps: number;
    ocrGps: number;
    withoutGPS: number;
  } | null;
  whatsappMode: boolean;
  onToggleWhatsAppMode: () => void;
  verifyWithOcr: boolean;
  onToggleVerifyWithOcr: () => void;
  darkMode: boolean;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onFilesSelected,
  isProcessing,
  lastProcessedStats,
  whatsappMode,
  onToggleWhatsAppMode,
  verifyWithOcr,
  onToggleVerifyWithOcr,
  darkMode,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      processFiles(fileList);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      processFiles(fileList);
      e.target.value = '';
    }
  };

  const processFiles = (fileList: File[]) => {
    const validImages = fileList.filter(isSupportedImageFile);
    if (validImages.length === 0) {
      alert('Mohon pilih file gambar yang valid (JPG, JPEG, PNG, WEBP).');
      return;
    }
    onFilesSelected(validImages);
  };

  return (
    <div
      id="upload-section"
      className={`p-4 sm:p-5 rounded-2xl border shadow-sm transition-colors h-full flex flex-col justify-between ${
        darkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
      }`}
    >
      {/* Title & Mode Switch */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className={`font-semibold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <UploadCloud className="w-5 h-5 text-blue-500" />
          <span>Upload Foto</span>
        </h2>

        {/* WhatsApp Mode Toggle Badge */}
        <button
          type="button"
          onClick={onToggleWhatsAppMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            whatsappMode
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : darkMode
              ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-slate-200'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
          }`}
          title="Klik untuk mengaktifkan/menonaktifkan sorotan Mode WhatsApp"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mode WhatsApp</span>
          <span
            className={`w-2 h-2 rounded-full ${
              whatsappMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id="photo-file-input"
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff"
        className="hidden"
        onChange={handleInputChange}
        disabled={isProcessing}
      />

      {/* Drag & Drop Area */}
      <div
        id="drop-zone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative flex-1 min-h-[140px] flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : darkMode
            ? 'border-slate-700 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/60'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
        } ${isProcessing ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform ${
            isDragOver ? 'scale-110' : ''
          } ${
            darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}
        >
          <UploadCloud className="w-5 h-5" />
        </div>

        {isDragOver ? (
          <p className="text-sm font-semibold text-blue-500 animate-pulse">
            Lepaskan foto di sini
          </p>
        ) : (
          <>
            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              Pilih Foto atau Drag & Drop
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              JPG, JPEG, PNG, WEBP • Mendukung multi-file batch
            </p>
          </>
        )}

        <button
          type="button"
          disabled={isProcessing}
          className="mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-colors pointer-events-none"
        >
          {isProcessing ? 'Sedang Memproses...' : 'Pilih Foto'}
        </button>
      </div>

      {/* PIPELINE & OCR CONFIGURATION OPTIONS */}
      <div className="mt-3.5 space-y-2.5">
        {/* Toggle Option: Verifikasi dengan OCR */}
        <label
          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
            verifyWithOcr
              ? darkMode
                ? 'bg-blue-950/30 border-blue-800/60 text-blue-200'
                : 'bg-blue-50/70 border-blue-200 text-blue-900'
              : darkMode
              ? 'bg-slate-900/30 border-slate-700/60 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <input
            type="checkbox"
            checked={verifyWithOcr}
            onChange={onToggleVerifyWithOcr}
            className="mt-0.5 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <span className="font-semibold block">Verifikasi dengan OCR</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight mt-0.5">
              Jika aktif, OCR tetap memverifikasi teks timestamp meskipun metadata EXIF GPS sudah ditemukan.
            </span>
          </div>
        </label>

        {/* 7. KHUSUS FOTO WHATSAPP - PENJELASAN RESMI */}
        {whatsappMode && (
          <div
            id="whatsapp-mode-explanation-card"
            className={`p-3 rounded-xl border text-xs leading-relaxed transition-all animate-in fade-in duration-200 ${
              darkMode
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1 text-emerald-800 dark:text-emerald-300">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Penjelasan Mode WhatsApp:</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              &ldquo;Foto yang dikirim sebagai gambar melalui WhatsApp dapat kehilangan metadata GPS/EXIF. Jika koordinat tercetak pada foto menggunakan Timestamp Camera, aplikasi akan mencoba membacanya melalui OCR.&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Upload Processing Statistics Summary */}
      {lastProcessedStats && (
        <div
          id="upload-stats-summary"
          className={`mt-3.5 p-3 rounded-xl border text-xs space-y-1.5 ${
            darkMode ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>✓ {lastProcessedStats.total} foto berhasil diproses</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>🟢 {lastProcessedStats.exifGps} ditemukan via EXIF GPS</span>
          </div>
          {lastProcessedStats.ocrGps > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <ScanText className="w-4 h-4 shrink-0" />
              <span>🟡 {lastProcessedStats.ocrGps} ditemukan via OCR GPS</span>
            </div>
          )}
          {lastProcessedStats.withoutGPS > 0 && (
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>🔴 {lastProcessedStats.withoutGPS} foto tanpa koordinat</span>
            </div>
          )}
        </div>
      )}

      {/* Badge Reference Guide */}
      <div
        id="badge-reference-card"
        className={`mt-3.5 p-3 rounded-xl border text-[11px] ${
          darkMode ? 'bg-slate-900/40 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <span className="font-semibold block mb-1.5 text-slate-800 dark:text-slate-200">
          Indikator Status Koordinat:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-medium">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span>🟢</span>
            <span>EXIF GPS (Metadata asli)</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span>🟡</span>
            <span>OCR GPS (Cap teks foto)</span>
          </div>
          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <span>🔴</span>
            <span>GPS TIDAK DITEMUKAN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
