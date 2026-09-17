import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Eye,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ScanText,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { PhotoData, SortField, SortDirection } from '../types/photo';
import { formatDateTime } from '../utils/dateUtils';

interface PhotoTableProps {
  photos: PhotoData[];
  selectedPhoto: PhotoData | null;
  onSelectPhoto: (photo: PhotoData) => void;
  onCopyCoordinates: (coords: string) => void;
  onExportExcel: () => void;
  onConfirmDeleteAll: () => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  darkMode: boolean;
}

export const PhotoTable: React.FC<PhotoTableProps> = ({
  photos,
  selectedPhoto,
  onSelectPhoto,
  onCopyCoordinates,
  onExportExcel,
  onConfirmDeleteAll,
  sortField,
  sortDirection,
  onSort,
  darkMode,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [recentlyCopiedId, setRecentlyCopiedId] = useState<string | null>(null);

  const totalPhotos = photos.length;

  // Pagination calculation
  const itemsPerPage = pageSize === 'all' ? totalPhotos || 1 : pageSize;
  const totalPages = Math.ceil(totalPhotos / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = pageSize === 'all' ? totalPhotos : Math.min(startIndex + itemsPerPage, totalPhotos);
  const displayedPhotos = photos.slice(startIndex, endIndex);

  const handleCopy = (photo: PhotoData) => {
    if (!photo.coordinate) return;
    onCopyCoordinates(photo.coordinate);
    setRecentlyCopiedId(photo.id);
    setTimeout(() => {
      setRecentlyCopiedId((curr) => (curr === photo.id ? null : curr));
    }, 2000);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-500 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-500 ml-1 inline" />
    );
  };

  return (
    <div
      id="table-section"
      className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
      }`}
    >
      {/* Table Toolbar Header */}
      <div
        className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900/40 border-slate-700/80' : 'bg-slate-50/70 border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-base sm:text-lg tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              DATA FOTO
            </h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                darkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {totalPhotos} foto
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Pipeline pembacaan koordinat: EXIF camera ➜ Fallback OCR Timestamp ➜ Validasi desimal derajat
          </p>
        </div>

        {/* Action Buttons: Export Excel & Hapus Semua */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="export-excel-btn"
            onClick={onExportExcel}
            disabled={totalPhotos === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all ${
              totalPhotos === 0
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 active:scale-95'
            }`}
            title="Download seluruh data foto ke file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            id="delete-all-btn"
            onClick={onConfirmDeleteAll}
            disabled={totalPhotos === 0}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all ${
              totalPhotos === 0
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-red-600 hover:bg-red-700 shadow-red-500/20 active:scale-95'
            }`}
            title="Hapus seluruh foto dan data dari memori browser"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        </div>
      </div>

      {/* Table Content (Full Width) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[960px]">
          <thead
            className={`border-b text-[11px] font-semibold uppercase tracking-wider select-none ${
              darkMode
                ? 'bg-slate-900/60 text-slate-300 border-slate-700'
                : 'bg-slate-100/80 text-slate-600 border-slate-200'
            }`}
          >
            <tr>
              <th className="py-3 px-3 text-center w-12">No</th>
              <th className="py-3 px-3 w-16 text-center">Foto</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('fileName')}
              >
                Nama File {renderSortIcon('fileName')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('coordinate')}
              >
                KOORDINAT {renderSortIcon('coordinate')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('dmsCoordinate')}
              >
                Koordinat DMS {renderSortIcon('dmsCoordinate')}
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('altitude')}
              >
                Altitude {renderSortIcon('altitude')}
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('dateTime')}
              >
                Tanggal/Jam {renderSortIcon('dateTime')}
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('camera')}
              >
                Kamera {renderSortIcon('camera')}
              </th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-blue-500 transition-colors"
                onClick={() => onSort('status')}
              >
                Status GPS {renderSortIcon('status')}
              </th>
              <th className="py-3 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-700/60' : 'divide-slate-100'}`}>
            {displayedPhotos.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  Tidak ada foto yang cocok dengan pencarian atau filter yang dipilih.
                </td>
              </tr>
            ) : (
              displayedPhotos.map((photo, index) => {
                const globalIndex = startIndex + index + 1;
                const isSelected = selectedPhoto?.id === photo.id;
                const cameraInfo = [photo.make, photo.model].filter(Boolean).join(' ') || '-';
                const hasCoordinate = Boolean(photo.coordinate);
                const isCopied = recentlyCopiedId === photo.id;

                return (
                  <tr
                    key={photo.id}
                    onClick={() => onSelectPhoto(photo)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? darkMode
                          ? 'bg-blue-950/40 text-blue-200'
                          : 'bg-blue-50/90 text-blue-950 font-medium'
                        : darkMode
                        ? 'hover:bg-slate-700/40 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {/* 1. No */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {globalIndex}
                    </td>

                    {/* 2. Foto Thumbnail */}
                    <td className="py-2 px-3 text-center">
                      <div className="w-12 h-9 mx-auto rounded-md overflow-hidden bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                        <img
                          src={photo.previewUrl}
                          alt={photo.fileName}
                          className="w-full h-full object-cover transition-transform hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                    </td>

                    {/* 3. Nama File */}
                    <td className="py-2.5 px-4 font-medium max-w-[200px] truncate" title={photo.fileName}>
                      {photo.fileName}
                    </td>

                    {/* 4. KOORDINAT (Latitude, Longitude) */}
                    <td className="py-2.5 px-4 font-mono font-medium whitespace-nowrap">
                      {hasCoordinate ? (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              photo.source === 'OCR'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {photo.coordinate}
                          </span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                              photo.source === 'OCR'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                            title={`Sumber: ${photo.source}`}
                          >
                            {photo.source}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* 5. Koordinat DMS */}
                    <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {photo.dmsCoordinate || '-'}
                    </td>

                    {/* 6. Altitude */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {photo.altitude !== null ? `${photo.altitude} m` : '-'}
                    </td>

                    {/* 7. Tanggal/Jam */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {formatDateTime(photo.dateTime)}
                    </td>

                    {/* 8. Kamera */}
                    <td className="py-2.5 px-3 max-w-[140px] truncate" title={cameraInfo}>
                      {cameraInfo}
                    </td>

                    {/* 9. Status GPS - BADGES RESMI */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {photo.gpsStatusType === 'exif_gps' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <span>🟢</span>
                          <span>EXIF GPS</span>
                        </span>
                      ) : photo.gpsStatusType === 'ocr_gps' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <span>🟡</span>
                          <span>OCR GPS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <span>🔴</span>
                          <span>GPS TIDAK DITEMUKAN</span>
                        </span>
                      )}
                    </td>

                    {/* 10. Aksi */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectPhoto(photo)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            darkMode
                              ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                              : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                          title="Lihat Detail Foto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {hasCoordinate && (
                          <button
                            onClick={() => handleCopy(photo)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : darkMode
                                ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                            title="Salin Koordinat (Latitude, Longitude)"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          darkMode ? 'bg-slate-900/40 border-slate-700/80 text-slate-400' : 'bg-slate-50/70 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>
            Menampilkan <strong className="text-slate-900 dark:text-white">{totalPhotos > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong className="text-slate-900 dark:text-white">{endIndex}</strong> dari{' '}
            <strong className="text-slate-900 dark:text-white">{totalPhotos}</strong> foto
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px]">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg border outline-none text-xs font-semibold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Semua</option>
            </select>
          </div>
        </div>

        {pageSize !== 'all' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={`p-1.5 rounded-lg border transition-colors ${
                safePage <= 1
                  ? 'opacity-40 cursor-not-allowed'
                  : darkMode
                  ? 'hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono text-xs">
              Hal {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={`p-1.5 rounded-lg border transition-colors ${
                safePage >= totalPages
                  ? 'opacity-40 cursor-not-allowed'
                  : darkMode
                  ? 'hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'hover:bg-slate-200 border-slate-200 text-slate-800'
              }`}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
