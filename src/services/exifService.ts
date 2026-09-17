import exifr from 'exifr';
import { PhotoData, CoordinateSource, GPSBadgeType } from '../types/photo';
import {
  formatCoordinate,
  formatDMSCoordinate,
  isValidCoordinate,
  convertExifGpsToDecimal,
} from '../utils/coordinateUtils';
import { parseExifDate } from '../utils/dateUtils';
import { generatePhotoId } from '../utils/fileUtils';
import { performPhotoOcr } from './ocrService';

export interface MetadataExtractionOptions {
  verifyWithOcr?: boolean;
  onProgressStatus?: (status: string) => void;
}

/**
 * Executes the complete Coordinate Reading Pipeline:
 *
 * STEP 1:
 * Baca metadata EXIF.
 * Cari GPSLatitude, GPSLongitude, GPSLatitudeRef, GPSLongitudeRef.
 * Konversi GPS DMS ke decimal degree -> "-0.305400, 100.370867".
 * Simpan sumber sebagai "EXIF".
 * Jika berhasil ditemukan, JANGAN melakukan OCR kecuali opsi verifyWithOcr diaktifkan.
 *
 * STEP 2 (FALLBACK OCR TIMESTAMP):
 * Jika EXIF tidak memiliki GPS:
 * Secara otomatis jalankan OCR pada foto (Timestamp Camera, GPS Map Camera, dll).
 * Jika koordinat ditemukan:
 * Gabungkan menjadi "-0.305400, 100.370867", Simpan sumber sebagai "OCR".
 *
 * STEP 3:
 * Jika keduanya tidak menemukan koordinat:
 * Badge: "GPS TIDAK DITEMUKAN"
 */
export async function extractPhotoMetadata(
  file: File,
  options: MetadataExtractionOptions = {}
): Promise<PhotoData> {
  const previewUrl = URL.createObjectURL(file);
  const id = generatePhotoId();

  let latitude: number | null = null;
  let longitude: number | null = null;
  let altitude: number | null = null;
  let rawDate: unknown = null;
  let make: string | null = null;
  let model: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  let coordinateSource: CoordinateSource = 'NONE';
  let gpsStatusType: GPSBadgeType = 'no_gps';
  let statusMessage: string | undefined;

  let ocrText: string | undefined;
  let ocrMatchedSnippet: string | undefined;
  let ocrVerified = false;

  // =========================================================================
  // STEP 1: Baca metadata EXIF (GPSLatitude, GPSLongitude, Ref)
  // =========================================================================
  options.onProgressStatus?.('Membaca metadata EXIF...');

  try {
    const exif = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      xmp: true,
    });

    if (exif) {
      // 1. Raw GPS tags conversion
      const rawLat = exif.GPSLatitude ?? exif.latitude;
      const rawLatRef = exif.GPSLatitudeRef;
      const rawLng = exif.GPSLongitude ?? exif.longitude;
      const rawLngRef = exif.GPSLongitudeRef;

      const convertedLat = convertExifGpsToDecimal(rawLat, rawLatRef);
      const convertedLng = convertExifGpsToDecimal(rawLng, rawLngRef);

      if (isValidCoordinate(convertedLat, convertedLng)) {
        latitude = convertedLat;
        longitude = convertedLng;
        coordinateSource = 'EXIF';
        gpsStatusType = 'exif_gps';
      }

      // Altitude
      if (typeof exif.GPSAltitude === 'number' && !isNaN(exif.GPSAltitude)) {
        altitude = Math.round(exif.GPSAltitude);
      } else if (typeof exif.altitude === 'number' && !isNaN(exif.altitude)) {
        altitude = Math.round(exif.altitude);
      }

      // Timestamp
      rawDate = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate || exif.SubSecDateTimeOriginal;

      // Camera Make & Model
      if (exif.Make) make = String(exif.Make).trim();
      if (exif.Model) model = String(exif.Model).trim();

      // Dimensions
      if (typeof exif.ImageWidth === 'number' || typeof exif.ExifImageWidth === 'number') {
        width = exif.ImageWidth || exif.ExifImageWidth;
      }
      if (typeof exif.ImageHeight === 'number' || typeof exif.ExifImageHeight === 'number') {
        height = exif.ImageHeight || exif.ExifImageHeight;
      }
    }
  } catch (err) {
    console.warn(`Gagal membaca EXIF dari file ${file.name}:`, err);
  }

  // =========================================================================
  // STEP 2: Evaluasi apakah perlu menjalankan OCR
  // - Jika EXIF ada dan tidak diminta verifikasi OCR: JANGAN lakukan OCR!
  // - Jika EXIF tidak ada GPS, ATAU verifyWithOcr diaktifkan: Jalankan OCR
  // =========================================================================
  const shouldRunOcr =
    gpsStatusType === 'no_gps' ||
    (gpsStatusType === 'exif_gps' && options.verifyWithOcr === true);

  if (shouldRunOcr) {
    options.onProgressStatus?.(
      gpsStatusType === 'no_gps'
        ? 'EXIF tanpa GPS: Menjalankan OCR Timestamp...'
        : 'Menjalankan verifikasi OCR...'
    );

    const ocrResult = await performPhotoOcr(file, options.onProgressStatus);
    ocrText = ocrResult.recognizedText;
    ocrMatchedSnippet = ocrResult.matchedText;

    if (ocrResult.success && isValidCoordinate(ocrResult.latitude, ocrResult.longitude)) {
      if (gpsStatusType === 'no_gps') {
        // Fallback OCR berhasil
        latitude = ocrResult.latitude;
        longitude = ocrResult.longitude;
        coordinateSource = 'OCR';
        gpsStatusType = 'ocr_gps';
        statusMessage = `Ditemukan melalui OCR cap foto: "${ocrResult.matchedText}"`;
      } else {
        // EXIF sudah ada + diverifikasi dengan OCR
        ocrVerified = true;
      }
    } else {
      if (gpsStatusType === 'no_gps') {
        statusMessage = 'Koordinat tidak ditemukan di EXIF maupun cap foto';
      }
    }
  }

  const hasGPS = isValidCoordinate(latitude, longitude);
  const coordinate = hasGPS ? formatCoordinate(latitude, longitude) : null;
  const dmsCoordinate = hasGPS ? formatDMSCoordinate(latitude, longitude) : null;
  const parsedIsoDate = parseExifDate(rawDate);

  return {
    id,
    file,
    fileName: file.name,
    fileSize: file.size,
    lastModified: file.lastModified,
    previewUrl,
    latitude: hasGPS ? latitude : null,
    longitude: hasGPS ? longitude : null,
    coordinate,
    dmsCoordinate,
    altitude: altitude !== null && !isNaN(altitude) ? altitude : null,
    dateTime: parsedIsoDate,
    make: make || (coordinateSource === 'OCR' ? 'Timestamp Camera' : null),
    model: model || (coordinateSource === 'OCR' ? 'WhatsApp/Photo' : null),
    width: width || null,
    height: height || null,
    hasGPS,
    gpsStatusType,
    source: coordinateSource,
    statusMessage,
    ocrText,
    ocrMatchedSnippet,
    ocrVerified,
  };
}

/**
 * Creates realistic sample documentation photos covering all 3 badge states:
 * 1. 🟢 EXIF GPS (Drone DJI & Canon DSLR)
 * 2. 🟡 OCR GPS (WhatsApp photo with Timestamp Camera overlay)
 * 3. 🔴 GPS TIDAK DITEMUKAN (Standard office document / screenshot)
 */
export function createSampleDemoPhotos(): PhotoData[] {
  const samples = [
    {
      fileName: 'DJI_0042_NgaraiSianok.jpg',
      latitude: -0.305400,
      longitude: 100.370867,
      altitude: 912,
      dateTime: '2026-09-17T08:30:24Z',
      make: 'DJI',
      model: 'Mavic 3 Enterprise',
      width: 5280,
      height: 3956,
      color: '#0284c7',
      label: 'Titik Ukur Ngarai Sianok',
      source: 'EXIF' as CoordinateSource,
      badge: 'exif_gps' as GPSBadgeType,
      stampText: '',
    },
    {
      fileName: 'WA_IMG_20260917_JamGadang_Timestamp.jpg',
      latitude: -0.305116,
      longitude: 100.369255,
      altitude: 928,
      dateTime: '2026-09-17T09:15:10Z',
      make: 'Timestamp Camera',
      model: 'WhatsApp Photo',
      width: 1600,
      height: 1200,
      color: '#d97706',
      label: 'Monumen Jam Gadang (WhatsApp)',
      source: 'OCR' as CoordinateSource,
      badge: 'ocr_gps' as GPSBadgeType,
      stampText: '17/09/2026 09:15:10\nLat: -0.305116, Lon: 100.369255',
      ocrMatchedSnippet: 'Lat: -0.305116, Lon: 100.369255',
    },
    {
      fileName: 'GEO_SURVEY_DanauManinjau.jpg',
      latitude: -0.298412,
      longitude: 100.201844,
      altitude: 461,
      dateTime: '2026-09-17T11:45:33Z',
      make: 'Canon',
      model: 'EOS R5',
      width: 8192,
      height: 5464,
      color: '#2563eb',
      label: 'Survei Elevasi Danau Maninjau',
      source: 'EXIF' as CoordinateSource,
      badge: 'exif_gps' as GPSBadgeType,
      stampText: '',
    },
    {
      fileName: 'WA_IMG_JembatanKelok9_DMS.jpg',
      latitude: -0.068214,
      longitude: 100.697422,
      altitude: null,
      dateTime: '2026-09-17T14:20:05Z',
      make: 'Timestamp Camera Pro',
      model: 'WhatsApp Photo',
      width: 1920,
      height: 1080,
      color: '#0d9488',
      label: 'Jembatan Kelok 9 (Format DMS)',
      source: 'OCR' as CoordinateSource,
      badge: 'ocr_gps' as GPSBadgeType,
      stampText: '0°04\'05.57"S 100°41\'50.72"E\n17/09/2026 14:20:05',
      ocrMatchedSnippet: '0°04\'05.57"S 100°41\'50.72"E',
    },
    {
      fileName: 'CATATAN_KANTOR_TanpaGPS.png',
      latitude: null,
      longitude: null,
      altitude: null,
      dateTime: '2026-09-17T17:30:00Z',
      make: 'Apple',
      model: 'iPhone 15 Pro',
      width: 1920,
      height: 1080,
      color: '#64748b',
      label: 'Dokumen Rencana Teknis (Non-GPS)',
      source: 'NONE' as CoordinateSource,
      badge: 'no_gps' as GPSBadgeType,
      stampText: '',
    },
  ];

  return samples.map((sample, idx) => {
    const stampSvg = sample.stampText
      ? `<rect x="20" y="320" width="560" height="60" rx="8" fill="rgba(0,0,0,0.75)"/>
         <text x="35" y="345" font-family="monospace" font-size="13" font-weight="bold" fill="#facc15">${sample.stampText.split('\n')[0] || ''}</text>
         <text x="35" y="365" font-family="monospace" font-size="13" font-weight="bold" fill="#ffffff">${sample.stampText.split('\n')[1] || ''}</text>`
      : '';

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="g${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${sample.color}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#g${idx})"/>
      <circle cx="300" cy="150" r="50" fill="rgba(255,255,255,0.15)"/>
      <circle cx="300" cy="150" r="22" fill="#ffffff"/>
      <circle cx="300" cy="150" r="10" fill="${sample.color}"/>
      <text x="300" y="240" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${sample.label}</text>
      <text x="300" y="270" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.85)" text-anchor="middle">${sample.fileName}</text>
      <text x="300" y="295" font-family="system-ui, sans-serif" font-size="12" fill="rgba(255,255,255,0.65)" text-anchor="middle">${sample.make} ${sample.model} • Sumber: ${sample.source}</text>
      ${stampSvg}
    </svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const previewUrl = URL.createObjectURL(blob);
    const hasGPS = sample.latitude !== null && sample.longitude !== null;

    const coordinate = hasGPS ? formatCoordinate(sample.latitude, sample.longitude) : null;
    const dmsCoordinate = hasGPS ? formatDMSCoordinate(sample.latitude, sample.longitude) : null;

    return {
      id: `sample_${idx + 1}_${Date.now()}`,
      fileName: sample.fileName,
      fileSize: 2450000 + idx * 315000,
      lastModified: Date.now() - (6 - idx) * 3600000,
      previewUrl,
      latitude: sample.latitude,
      longitude: sample.longitude,
      coordinate,
      dmsCoordinate,
      altitude: sample.altitude,
      dateTime: sample.dateTime,
      make: sample.make,
      model: sample.model,
      width: sample.width,
      height: sample.height,
      hasGPS,
      gpsStatusType: sample.badge,
      source: sample.source,
      statusMessage:
        sample.source === 'OCR'
          ? `Koordinat dideteksi dari cap Timestamp Camera: "${sample.ocrMatchedSnippet}"`
          : sample.source === 'EXIF'
          ? 'Koordinat terbaca dari metadata EXIF asli kamera'
          : 'Foto tidak memiliki koordinat GPS di EXIF maupun cap foto',
      ocrText: sample.stampText,
      ocrMatchedSnippet: sample.ocrMatchedSnippet,
    };
  });
}
