/**
 * Utility functions for date parsing, formatting, and filtering
 */

export function parseExifDate(dateVal: unknown): string | null {
  if (!dateVal) return null;

  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    return dateVal.toISOString();
  }

  if (typeof dateVal === 'string') {
    // Standard EXIF format is often "YYYY:MM:DD HH:MM:SS"
    const exifPattern = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    const match = dateVal.trim().match(exifPattern);
    if (match) {
      const [, y, m, d, hh, mm, ss] = match;
      const parsedDate = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    }

    const standardDate = new Date(dateVal);
    if (!isNaN(standardDate.getTime())) {
      return standardDate.toISOString();
    }
  }

  return null;
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return 'Tidak tersedia';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Tidak tersedia';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return 'Tidak tersedia';
  }
}

export function formatTimestampForFilename(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${mins}${secs}`;
}
