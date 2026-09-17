/**
 * FotoGPS Reader
 * Baca Koordinat Foto • EXIF • Fallback OCR Timestamp • Export Excel
 * 100% Client-side Processing
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PhotoData, FilterState, SortField, SortDirection, ToastMessage } from './types/photo';
import { extractPhotoMetadata, createSampleDemoPhotos } from './services/exifService';
import { performPhotoOcr } from './services/ocrService';
import { exportPhotosToExcel } from './services/excelService';
import { getFileFingerprint } from './utils/fileUtils';

import { Header } from './components/Header';
import { StatisticsCards } from './components/StatisticsCards';
import { UploadPanel } from './components/UploadPanel';
import { FilterPanel } from './components/FilterPanel';
import { PhotoDetail } from './components/PhotoDetail';
import { PhotoTable } from './components/PhotoTable';
import { EmptyState } from './components/EmptyState';
import { LoadingProgress } from './components/LoadingProgress';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Pipeline Features: WhatsApp Mode & OCR Verify
  const [whatsappMode, setWhatsAppMode] = useState<boolean>(true);
  const [verifyWithOcr, setVerifyWithOcr] = useState<boolean>(false);

  // Filters & Sorting
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    gpsStatus: 'all',
    camera: '',
    startDate: '',
    endDate: '',
  });

  const [sortField, setSortField] = useState<SortField>('fileName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Loading & Progress
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [currentProcessingName, setCurrentProcessingName] = useState<string>('');
  const [currentProcessingStatus, setCurrentProcessingStatus] = useState<string>('');

  // Last batch processing stats
  const [lastProcessedStats, setLastProcessedStats] = useState<{
    total: number;
    exifGps: number;
    ocrGps: number;
    withoutGPS: number;
  } | null>(null);

  // Modals & Notifications
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState<boolean>(false);
  const [previewModalPhoto, setPreviewModalPhoto] = useState<PhotoData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Synchronize Dark Mode Class on root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast Helper
  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        try {
          URL.revokeObjectURL(p.previewUrl);
        } catch {
          // ignore
        }
      });
    };
  }, [photos]);

  // Upload Batch Handler
  const handleFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setProgressCurrent(0);
    setProgressTotal(files.length);

    const existingFingerprints = new Set(
      photos.map((p) => (p.file ? getFileFingerprint(p.file) : `${p.fileName}_${p.fileSize}_${p.lastModified}`))
    );

    const newPhotos: PhotoData[] = [];
    let duplicateCount = 0;
    let exifGpsCount = 0;
    let ocrGpsCount = 0;
    let noGpsCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentProcessingName(file.name);
      setCurrentProcessingStatus('Membaca metadata EXIF...');
      setProgressCurrent(i + 1);

      const fp = getFileFingerprint(file);
      if (existingFingerprints.has(fp)) {
        duplicateCount++;
        continue;
      }

      try {
        const photoData = await extractPhotoMetadata(file, {
          verifyWithOcr,
          onProgressStatus: (status) => setCurrentProcessingStatus(status),
        });

        newPhotos.push(photoData);
        existingFingerprints.add(fp);

        if (photoData.gpsStatusType === 'exif_gps') {
          exifGpsCount++;
        } else if (photoData.gpsStatusType === 'ocr_gps') {
          ocrGpsCount++;
        } else {
          noGpsCount++;
        }
      } catch (err) {
        console.error(`Error processing file ${file.name}:`, err);
        addToast('error', 'Gagal memproses foto', file.name);
      }

      // Small async tick to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setIsProcessing(false);
    setCurrentProcessingName('');
    setCurrentProcessingStatus('');

    if (newPhotos.length > 0) {
      setLastProcessedStats({
        total: newPhotos.length,
        exifGps: exifGpsCount,
        ocrGps: ocrGpsCount,
        withoutGPS: noGpsCount,
      });

      const details = [
        exifGpsCount > 0 ? `🟢 ${exifGpsCount} EXIF GPS` : null,
        ocrGpsCount > 0 ? `🟡 ${ocrGpsCount} OCR GPS` : null,
        noGpsCount > 0 ? `🔴 ${noGpsCount} Tanpa GPS` : null,
      ]
        .filter(Boolean)
        .join(', ');

      addToast(
        'success',
        `${newPhotos.length} foto selesai dianalisis`,
        details || undefined
      );
    }

    if (duplicateCount > 0) {
      addToast(
        'info',
        `${duplicateCount} foto duplikat dilewati`,
        'File dengan nama dan ukuran yang sama sudah ada di daftar.'
      );
    }
  };

  // Load Sample Field Photos
  const handleLoadSampleData = () => {
    const samples = createSampleDemoPhotos();
    setPhotos((prev) => [...prev, ...samples]);

    const exifGps = samples.filter((s) => s.gpsStatusType === 'exif_gps').length;
    const ocrGps = samples.filter((s) => s.gpsStatusType === 'ocr_gps').length;
    const withoutGPS = samples.filter((s) => s.gpsStatusType === 'no_gps').length;

    setLastProcessedStats({
      total: samples.length,
      exifGps,
      ocrGps,
      withoutGPS,
    });

    addToast(
      'success',
      'Contoh Sampel Dimuat',
      `${samples.length} foto contoh (EXIF asli, Cap Timestamp WhatsApp OCR, dan Non-geotagged) siap diuji.`
    );
  };

  // Delete All Handler
  const handleConfirmDeleteAll = () => {
    photos.forEach((p) => {
      try {
        URL.revokeObjectURL(p.previewUrl);
      } catch {
        // ignore
      }
    });

    setPhotos([]);
    setSelectedPhotoId(null);
    setIsDetailOpen(false);
    setLastProcessedStats(null);
    setFilter({
      searchQuery: '',
      gpsStatus: 'all',
      camera: '',
      startDate: '',
      endDate: '',
    });
    setConfirmDeleteDialogOpen(false);

    addToast('info', 'Semua Data Dihapus', 'Seluruh foto dan memori EXIF telah dibersihkan.');
  };

  // Re-scan a single photo using OCR
  const handleRerunOcr = async (photo: PhotoData) => {
    try {
      const res = await performPhotoOcr(photo.file || photo.previewUrl);
      if (res.success && res.coordinate) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  coordinate: res.coordinate,
                  latitude: res.latitude,
                  longitude: res.longitude,
                  dmsCoordinate: res.dmsCoordinate,
                  hasGPS: true,
                  gpsStatusType: 'ocr_gps',
                  source: 'OCR',
                  ocrText: res.recognizedText,
                  ocrMatchedSnippet: res.matchedText,
                  ocrVerified: true,
                }
              : p
          )
        );
        addToast(
          'success',
          'Koordinat Terdeteksi via OCR',
          `Berhasil membaca cap: ${res.coordinate}`
        );
      } else {
        addToast(
          'info',
          'Pindaian OCR Selesai',
          'Tidak ditemukan format koordinat yang valid pada cap foto ini.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjalankan OCR';
      addToast('error', 'Error OCR', msg);
    }
  };

  // Dynamic camera options for filter dropdown
  const cameraOptions = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      const cam = [p.make, p.model].filter(Boolean).join(' ').trim();
      if (cam) set.add(cam);
    });
    return Array.from(set).sort();
  }, [photos]);

  // Filtered Photos List
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      // 1. Search query: nama file, koordinat, kamera
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesName = p.fileName.toLowerCase().includes(q);
        const matchesCoord = p.coordinate ? p.coordinate.toLowerCase().includes(q) : false;
        const matchesDms = p.dmsCoordinate ? p.dmsCoordinate.toLowerCase().includes(q) : false;
        const cameraString = [p.make, p.model].filter(Boolean).join(' ').toLowerCase();
        const matchesCam = cameraString.includes(q);

        if (!matchesName && !matchesCoord && !matchesDms && !matchesCam) {
          return false;
        }
      }

      // 2. GPS Status filter (all, exif_gps, ocr_gps, no_gps)
      if (filter.gpsStatus === 'exif_gps' && p.gpsStatusType !== 'exif_gps') return false;
      if (filter.gpsStatus === 'ocr_gps' && p.gpsStatusType !== 'ocr_gps') return false;
      if (filter.gpsStatus === 'no_gps' && p.gpsStatusType !== 'no_gps') return false;

      // 3. Camera filter
      if (filter.camera) {
        const cam = [p.make, p.model].filter(Boolean).join(' ').trim();
        if (cam !== filter.camera) return false;
      }

      // 4. Date range filter
      if (filter.startDate) {
        if (!p.dateTime) return false;
        const photoDateStr = p.dateTime.substring(0, 10);
        if (photoDateStr < filter.startDate) return false;
      }
      if (filter.endDate) {
        if (!p.dateTime) return false;
        const photoDateStr = p.dateTime.substring(0, 10);
        if (photoDateStr > filter.endDate) return false;
      }

      return true;
    });
  }, [photos, filter]);

  // Sorted Photos List
  const sortedPhotos = useMemo(() => {
    return [...filteredPhotos].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'fileName':
          comparison = a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
          break;
        case 'coordinate':
          if (!a.coordinate && !b.coordinate) comparison = 0;
          else if (!a.coordinate) comparison = 1;
          else if (!b.coordinate) comparison = -1;
          else comparison = a.coordinate.localeCompare(b.coordinate);
          break;
        case 'dmsCoordinate':
          if (!a.dmsCoordinate && !b.dmsCoordinate) comparison = 0;
          else if (!a.dmsCoordinate) comparison = 1;
          else if (!b.dmsCoordinate) comparison = -1;
          else comparison = a.dmsCoordinate.localeCompare(b.dmsCoordinate);
          break;
        case 'altitude':
          if (a.altitude === null && b.altitude === null) comparison = 0;
          else if (a.altitude === null) comparison = 1;
          else if (b.altitude === null) comparison = -1;
          else comparison = a.altitude - b.altitude;
          break;
        case 'dateTime':
          if (!a.dateTime && !b.dateTime) comparison = 0;
          else if (!a.dateTime) comparison = 1;
          else if (!b.dateTime) comparison = -1;
          else comparison = new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
          break;
        case 'camera': {
          const camA = [a.make, a.model].filter(Boolean).join(' ');
          const camB = [b.make, b.model].filter(Boolean).join(' ');
          comparison = camA.localeCompare(camB);
          break;
        }
        case 'status':
          comparison = a.gpsStatusType.localeCompare(b.gpsStatusType);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredPhotos, sortField, sortDirection]);

  // Selected Photo object
  const selectedPhoto = useMemo(() => {
    if (!selectedPhotoId) return null;
    return photos.find((p) => p.id === selectedPhotoId) || null;
  }, [photos, selectedPhotoId]);

  // Current selected photo index in sorted view
  const currentPhotoIndex = useMemo(() => {
    if (!selectedPhotoId) return -1;
    return sortedPhotos.findIndex((p) => p.id === selectedPhotoId);
  }, [sortedPhotos, selectedPhotoId]);

  // Navigate Prev / Next in Detail modal
  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setSelectedPhotoId(sortedPhotos[currentPhotoIndex - 1].id);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < sortedPhotos.length - 1 && currentPhotoIndex >= 0) {
      setSelectedPhotoId(sortedPhotos[currentPhotoIndex + 1].id);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewModalPhoto) {
        if (e.key === 'Escape') {
          setPreviewModalPhoto(null);
        }
        return;
      }
      if (isDetailOpen) {
        if (e.key === 'Escape') {
          setIsDetailOpen(false);
        } else if (e.key === 'ArrowLeft') {
          handlePreviousPhoto();
        } else if (e.key === 'ArrowRight') {
          handleNextPhoto();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen, currentPhotoIndex, sortedPhotos, previewModalPhoto]);

  // Select photo and open detail
  const handleSelectPhoto = (photo: PhotoData) => {
    setSelectedPhotoId(photo.id);
    setIsDetailOpen(true);
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Copy Coordinates: format "-0.305400, 100.370867"
  const handleCopyCoordinates = async (coordsText: string) => {
    try {
      await navigator.clipboard.writeText(coordsText);
      addToast('success', '✓ Koordinat berhasil disalin', coordsText);
    } catch {
      addToast('error', 'Gagal menyalin koordinat ke clipboard.');
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    try {
      const photosToExport = sortedPhotos.length > 0 ? sortedPhotos : photos;
      exportPhotosToExcel(photosToExport);
      addToast(
        'success',
        'File Excel Berhasil Dibuat',
        'Mengunduh file .xlsx dengan format baku koordinat desimal dan DMS.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat file Excel.';
      addToast('error', 'Gagal Export Excel', msg);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onLoadSampleData={handleLoadSampleData}
        photosCount={photos.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Top Row: Upload Foto (Left 50%) & Statistik (Right 50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="h-full">
            <UploadPanel
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
              lastProcessedStats={lastProcessedStats}
              whatsappMode={whatsappMode}
              onToggleWhatsAppMode={() => setWhatsAppMode((prev) => !prev)}
              verifyWithOcr={verifyWithOcr}
              onToggleVerifyWithOcr={() => setVerifyWithOcr((prev) => !prev)}
              darkMode={darkMode}
            />
          </div>

          <div className="h-full">
            <StatisticsCards
              photos={photos}
              filteredCount={sortedPhotos.length}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* 3. Filter & Table Data Foto or Empty State */}
        {photos.length === 0 ? (
          <EmptyState
            onTriggerUpload={() => {
              const inputEl = document.getElementById('photo-file-input') as HTMLInputElement | null;
              inputEl?.click();
            }}
            onLoadSample={handleLoadSampleData}
            darkMode={darkMode}
          />
        ) : (
          <>
            {/* Filter & Pencarian Bar */}
            <FilterPanel
              filter={filter}
              onFilterChange={(newF) => setFilter((prev) => ({ ...prev, ...newF }))}
              onResetFilter={() =>
                setFilter({
                  searchQuery: '',
                  gpsStatus: 'all',
                  camera: '',
                  startDate: '',
                  endDate: '',
                })
              }
              cameraOptions={cameraOptions}
              darkMode={darkMode}
              totalFiltered={sortedPhotos.length}
              totalPhotos={photos.length}
            />

            {/* Full-Width Table Data Foto */}
            <PhotoTable
              photos={sortedPhotos}
              selectedPhoto={selectedPhoto}
              onSelectPhoto={handleSelectPhoto}
              onCopyCoordinates={handleCopyCoordinates}
              onExportExcel={handleExportExcel}
              onConfirmDeleteAll={() => setConfirmDeleteDialogOpen(true)}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              darkMode={darkMode}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`py-6 border-t mt-8 text-center text-xs transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
        }`}
      >
        <p>
          FotoGPS Reader • Pipeline EXIF &amp; OCR Timestamp Fallback • 100% diproses di browser tanpa upload ke server.
        </p>
      </footer>

      {/* Batch Upload Progress Overlay */}
      {isProcessing && (
        <LoadingProgress
          current={progressCurrent}
          total={progressTotal}
          currentFileName={currentProcessingName}
          statusText={currentProcessingStatus}
          darkMode={darkMode}
        />
      )}

      {/* Detail Foto Modal Dialog */}
      {isDetailOpen && selectedPhoto && (
        <PhotoDetail
          photo={selectedPhoto}
          currentIndex={currentPhotoIndex}
          totalPhotos={sortedPhotos.length}
          onPrevious={handlePreviousPhoto}
          onNext={handleNextPhoto}
          onClose={() => setIsDetailOpen(false)}
          onCopyCoordinates={handleCopyCoordinates}
          onOpenPreviewModal={(p) => setPreviewModalPhoto(p)}
          onRerunOcr={handleRerunOcr}
          darkMode={darkMode}
        />
      )}

      {/* Confirmation Dialog Modal */}
      <ConfirmDialog
        isOpen={confirmDeleteDialogOpen}
        title="Hapus semua foto?"
        message="Semua foto dan data EXIF yang sedang dibaca akan dihapus dari memori aplikasi."
        confirmLabel="Hapus Semua"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setConfirmDeleteDialogOpen(false)}
        darkMode={darkMode}
      />

      {/* Full Photo Lightbox Preview Modal */}
      <PhotoPreviewModal
        photo={previewModalPhoto}
        onClose={() => setPreviewModalPhoto(null)}
        onCopyCoordinates={handleCopyCoordinates}
        darkMode={darkMode}
      />

      {/* Toast Feedback Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
