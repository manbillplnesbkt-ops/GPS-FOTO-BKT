import * as XLSX from 'xlsx';
import { PhotoData } from '../types/photo';
import { formatDateTime, formatTimestampForFilename } from '../utils/dateUtils';

/**
 * Generates and downloads an Excel (.xlsx) workbook containing:
 * 1. Sheet "Data Foto" with merged KOORDINAT, KOORDINAT DMS, Sumber (EXIF / OCR), and metadata
 * 2. Sheet "Ringkasan" with statistics and breakdown of EXIF vs OCR GPS
 */
export function exportPhotosToExcel(photos: PhotoData[]): void {
  if (!photos || photos.length === 0) {
    throw new Error('Tidak ada data foto untuk diekspor.');
  }

  const wb = XLSX.utils.book_new();

  // 1. DATA FOTO SHEET
  const rowsData = photos.map((p, index) => {
    let statusGpsText = 'GPS TIDAK DITEMUKAN';
    if (p.gpsStatusType === 'exif_gps') {
      statusGpsText = 'EXIF GPS';
    } else if (p.gpsStatusType === 'ocr_gps') {
      statusGpsText = 'OCR GPS';
    }

    return {
      No: index + 1,
      'Nama File': p.fileName,
      KOORDINAT: p.coordinate || '-',
      'KOORDINAT DMS': p.dmsCoordinate || '-',
      'Sumber Koordinat': p.source !== 'NONE' ? p.source : '-',
      Altitude: p.altitude !== null ? `${p.altitude} m` : '-',
      'Tanggal/Jam': formatDateTime(p.dateTime),
      'Make Kamera': p.make || '-',
      'Model Kamera': p.model || '-',
      'Status GPS': statusGpsText,
      'Catatan Deteksi': p.ocrMatchedSnippet ? `OCR: ${p.ocrMatchedSnippet}` : (p.statusMessage || '-'),
    };
  });

  const wsData = XLSX.utils.json_to_sheet(rowsData);

  // Column width configuration
  wsData['!cols'] = [
    { wch: 6 },  // No
    { wch: 32 }, // Nama File
    { wch: 26 }, // KOORDINAT
    { wch: 32 }, // KOORDINAT DMS
    { wch: 18 }, // Sumber Koordinat
    { wch: 12 }, // Altitude
    { wch: 22 }, // Tanggal/Jam
    { wch: 18 }, // Make Kamera
    { wch: 22 }, // Model Kamera
    { wch: 24 }, // Status GPS
    { wch: 36 }, // Catatan Deteksi
  ];

  XLSX.utils.book_append_sheet(wb, wsData, 'Data Foto');

  // 2. RINGKASAN SHEET (Summary Sheet)
  const totalPhotos = photos.length;
  const exifGpsCount = photos.filter((p) => p.gpsStatusType === 'exif_gps').length;
  const ocrGpsCount = photos.filter((p) => p.gpsStatusType === 'ocr_gps').length;
  const totalWithGps = exifGpsCount + ocrGpsCount;
  const noGpsCount = photos.filter((p) => p.gpsStatusType === 'no_gps').length;
  const coveragePercent = totalPhotos > 0 ? ((totalWithGps / totalPhotos) * 100).toFixed(1) + '%' : '0%';

  // Unique camera list
  const cameraSet = new Set<string>();
  photos.forEach((p) => {
    const cam = [p.make, p.model].filter(Boolean).join(' ').trim();
    if (cam) cameraSet.add(cam);
  });
  const camerasUsed = cameraSet.size > 0 ? Array.from(cameraSet).join(', ') : 'Tidak terdeteksi';

  // Date ranges
  const validDates = photos
    .map((p) => (p.dateTime ? new Date(p.dateTime).getTime() : null))
    .filter((t): t is number => t !== null && !isNaN(t))
    .sort((a, b) => a - b);

  const earliestDate = validDates.length > 0 ? formatDateTime(new Date(validDates[0]).toISOString()) : '-';
  const latestDate = validDates.length > 0 ? formatDateTime(new Date(validDates[validDates.length - 1]).toISOString()) : '-';

  const summaryData = [
    { Parameter: 'Nama Aplikasi', Nilai: 'FotoGPS Reader' },
    { Parameter: 'Waktu Ekspor', Nilai: formatDateTime(new Date().toISOString()) },
    { Parameter: 'Total Foto', Nilai: totalPhotos },
    { Parameter: '🟢 EXIF GPS', Nilai: exifGpsCount },
    { Parameter: '🟡 OCR GPS (Timestamp)', Nilai: ocrGpsCount },
    { Parameter: '🔴 GPS TIDAK DITEMUKAN', Nilai: noGpsCount },
    { Parameter: 'Total Koordinat Terdeteksi', Nilai: totalWithGps },
    { Parameter: 'Persentase Deteksi Koordinat', Nilai: coveragePercent },
    { Parameter: 'Kamera / Sumber yang Digunakan', Nilai: camerasUsed },
    { Parameter: 'Tanggal Foto Paling Awal', Nilai: earliestDate },
    { Parameter: 'Tanggal Foto Paling Akhir', Nilai: latestDate },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 32 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // File download: FotoGPS_Reader_YYYYMMDD_HHmmss.xlsx
  const filename = `FotoGPS_Reader_${formatTimestampForFilename()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
