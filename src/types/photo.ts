export type CoordinateSource = 'EXIF' | 'OCR' | 'NONE';

export type GPSBadgeType = 'exif_gps' | 'ocr_gps' | 'no_gps';

export interface PhotoData {
  id: string;
  file?: File;
  fileName: string;
  fileSize?: number;
  lastModified?: number;
  previewUrl: string;

  latitude: number | null;
  longitude: number | null;

  // Gabungan Latitude, Longitude: "-0.305400, 100.370867"
  coordinate: string | null;

  // Gabungan DMS: "0°18'19.44\"S, 100°22'15.12\"E"
  dmsCoordinate: string | null;

  altitude: number | null;
  dateTime: string | null;

  make: string | null;
  model: string | null;

  width: number | null;
  height: number | null;

  hasGPS: boolean;
  gpsStatusType: GPSBadgeType;
  source: CoordinateSource;
  statusMessage?: string;

  // OCR specific metadata
  ocrText?: string;
  ocrMatchedSnippet?: string;
  ocrVerified?: boolean;
}

export type GPSFilterStatus = 'all' | 'exif_gps' | 'ocr_gps' | 'no_gps';

export type SortField =
  | 'fileName'
  | 'coordinate'
  | 'dmsCoordinate'
  | 'altitude'
  | 'dateTime'
  | 'camera'
  | 'status';

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  gpsStatus: GPSFilterStatus;
  camera: string;
  startDate: string;
  endDate: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
