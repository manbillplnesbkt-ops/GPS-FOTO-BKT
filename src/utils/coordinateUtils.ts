/**
 * Utility functions for coordinate parsing, conversion, and formatting.
 * Supports EXIF DMS conversion and intelligent OCR pattern recognition.
 */

export interface ParsedCoordinateResult {
  latitude: number;
  longitude: number;
  coordinate: string; // Merged: "-0.305400, 100.370867"
  dmsCoordinate: string; // "0°18'19.44\"S, 100°22'15.12\"E"
  rawMatchedText: string;
}

/**
 * Checks if both coordinates are valid geographical degrees:
 * Latitude: -90 to +90
 * Longitude: -180 to +180
 */
export function isValidCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  if (
    latitude === null ||
    longitude === null ||
    latitude === undefined ||
    longitude === undefined ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return false;
  }
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0) // Null Island check unless strictly intended
  );
}

/**
 * Formats merged coordinate string: "-0.305400, 100.370867"
 * Guaranteed 6 decimal places as specified in user prompt.
 */
export function formatCoordinate(
  latitude: number | null,
  longitude: number | null,
  decimals: number = 6
): string | null {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }
  const latStr = (latitude as number).toFixed(decimals);
  const lngStr = (longitude as number).toFixed(decimals);
  return `${latStr}, ${lngStr}`;
}

/**
 * Converts decimal degrees to DMS string
 */
export function decimalToDMS(
  decimal: number,
  type: 'latitude' | 'longitude'
): string {
  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    return '-';
  }

  const absDecimal = Math.abs(decimal);
  const degrees = Math.floor(absDecimal);
  const minutesNotTruncated = (absDecimal - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

  let direction = '';
  if (type === 'latitude') {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

/**
 * Formats merged DMS coordinate string: "0°18'19.44\"S, 100°22'15.12\"E"
 */
export function formatDMSCoordinate(
  latitude: number | null,
  longitude: number | null
): string | null {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }
  const latDms = decimalToDMS(latitude as number, 'latitude');
  const lngDms = decimalToDMS(longitude as number, 'longitude');
  return `${latDms}, ${lngDms}`;
}

/**
 * Converts DMS components (degrees, minutes, seconds, ref) to Decimal Degrees.
 * Example:
 * Latitude: 0° 18' 19.44" S -> -0.305400
 * Longitude: 100° 22' 15.12" E -> 100.370867
 */
export function dmsToDecimal(
  deg: number,
  min: number,
  sec: number,
  ref?: string
): number {
  let decimal = Math.abs(deg) + min / 60 + sec / 3600;
  const upperRef = ref ? ref.trim().toUpperCase() : '';
  if (upperRef === 'S' || upperRef === 'W' || deg < 0) {
    decimal = -Math.abs(decimal);
  }
  return Number(decimal.toFixed(6));
}

/**
 * Converts EXIF raw coordinates or arrays to decimal degree.
 * Supports exifr number, [deg, min, sec] tuple, and Ref tag ('N','S','E','W').
 */
export function convertExifGpsToDecimal(
  rawVal: unknown,
  refVal?: unknown
): number | null {
  if (rawVal === null || rawVal === undefined) return null;

  const refStr = typeof refVal === 'string' ? refVal.trim().toUpperCase() : '';

  // Case 1: [degrees, minutes, seconds] array
  if (Array.isArray(rawVal) && rawVal.length >= 3) {
    const deg = Number(rawVal[0]);
    const min = Number(rawVal[1]);
    const sec = Number(rawVal[2]);
    if (!isNaN(deg) && !isNaN(min) && !isNaN(sec)) {
      return dmsToDecimal(deg, min, sec, refStr);
    }
  }

  // Case 2: Number already converted (e.g. by exifr)
  if (typeof rawVal === 'number' && !isNaN(rawVal)) {
    let val = rawVal;
    if (refStr === 'S' || refStr === 'W') {
      val = -Math.abs(val);
    } else if (refStr === 'N' || refStr === 'E') {
      val = Math.abs(val);
    }
    return Number(val.toFixed(6));
  }

  return null;
}

/**
 * Intelligent Coordinate Parser from OCR Text.
 * Recognizes multiple formats:
 * - -0.305400, 100.370867
 * - -0.305400 100.370867
 * - Lat -0.305400 Lon 100.370867
 * - Latitude -0.305400 Longitude 100.370867
 * - GPS -0.305400, 100.370867
 * - S -0.305400 E 100.370867
 * - 0°18'19.44"S 100°22'15.12"E
 * - S 0°18'19.44" E 100°22'15.12"
 * Filters out false positives like dates (17/09/2026), times (09:25:31), and dimensions.
 */
export function parseCoordinatesFromText(rawText: string): ParsedCoordinateResult | null {
  if (!rawText || !rawText.trim()) return null;

  // Clean OCR noise: normalize commas, degree symbols, quotation marks, line breaks
  const normalized = rawText
    .replace(/[\r\n]+/g, ' ')
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•|;]/g, ' ')
    .trim();

  // ==========================================
  // PATTERN 1: DMS Format (Degree Minute Second)
  // Example: 0°18'19.44"S 100°22'15.12"E or S 0°18'19.44" E 100°22'15.12"
  // ==========================================
  const dmsRegex =
    /(?:([NSns])\s*)?(\d{1,2})\s*[°o*d\s]\s*(\d{1,2})\s*['’\s]\s*(\d{1,2}(?:[.,]\d+)?)\s*["”']?\s*([NSns])?[,\s]+(?:([EWew])\s*)?(\d{1,3})\s*[°o*d\s]\s*(\d{1,2})\s*['’\s]\s*(\d{1,2}(?:[.,]\d+)?)\s*["”']?\s*([EWew])?/i;

  const dmsMatch = normalized.match(dmsRegex);
  if (dmsMatch) {
    const latRef = dmsMatch[1] || dmsMatch[5] || 'N';
    const latDeg = parseInt(dmsMatch[2], 10);
    const latMin = parseInt(dmsMatch[3], 10);
    const latSec = parseFloat(dmsMatch[4].replace(',', '.'));

    const lngRef = dmsMatch[6] || dmsMatch[10] || 'E';
    const lngDeg = parseInt(dmsMatch[7], 10);
    const lngMin = parseInt(dmsMatch[8], 10);
    const lngSec = parseFloat(dmsMatch[9].replace(',', '.'));

    if (!isNaN(latDeg) && !isNaN(latMin) && !isNaN(latSec) && !isNaN(lngDeg) && !isNaN(lngMin) && !isNaN(lngSec)) {
      const lat = dmsToDecimal(latDeg, latMin, latSec, latRef);
      const lng = dmsToDecimal(lngDeg, lngMin, lngSec, lngRef);

      if (isValidCoordinate(lat, lng)) {
        return {
          latitude: lat,
          longitude: lng,
          coordinate: formatCoordinate(lat, lng)!,
          dmsCoordinate: formatDMSCoordinate(lat, lng)!,
          rawMatchedText: dmsMatch[0].trim(),
        };
      }
    }
  }

  // ==========================================
  // PATTERN 2: Labeled Latitude & Longitude
  // Examples:
  // - Lat -0.305400 Lon 100.370867
  // - Latitude -0.305400 Longitude 100.370867
  // - Lat: -0.305400, Lon: 100.370867
  // ==========================================
  const labeledRegex =
    /Lat(?:itude)?[:\s]*([+-]?\s*\d{1,2}(?:[.,]\d+)?)\s*([NSns])?[,\s]+Lon(?:g|gitude)?[:\s]*([+-]?\s*\d{1,3}(?:[.,]\d+)?)\s*([EWew])?/i;

  const labeledMatch = normalized.match(labeledRegex);
  if (labeledMatch) {
    let lat = parseFloat(labeledMatch[1].replace(/\s+/g, '').replace(',', '.'));
    const latRef = labeledMatch[2]?.toUpperCase();
    let lng = parseFloat(labeledMatch[3].replace(/\s+/g, '').replace(',', '.'));
    const lngRef = labeledMatch[4]?.toUpperCase();

    if (latRef === 'S' && lat > 0) lat = -lat;
    if (lngRef === 'W' && lng > 0) lng = -lng;

    lat = Number(lat.toFixed(6));
    lng = Number(lng.toFixed(6));

    if (isValidCoordinate(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        coordinate: formatCoordinate(lat, lng)!,
        dmsCoordinate: formatDMSCoordinate(lat, lng)!,
        rawMatchedText: labeledMatch[0].trim(),
      };
    }
  }

  // ==========================================
  // PATTERN 3: GPS Tagged Prefix
  // Examples:
  // - GPS -0.305400, 100.370867
  // - GPS: -0.305400 100.370867
  // - GPS: S -0.305400 E 100.370867
  // ==========================================
  const gpsRegex =
    /GPS[:\s]*(?:([NSns])\s*)?([+-]?\s*\d{1,2}(?:[.,]\d+)?)\s*([NSns])?[,\s]+(?:([EWew])\s*)?([+-]?\s*\d{1,3}(?:[.,]\d+)?)\s*([EWew])?/i;

  const gpsMatch = normalized.match(gpsRegex);
  if (gpsMatch) {
    const latRef = (gpsMatch[1] || gpsMatch[3] || '').toUpperCase();
    let lat = parseFloat(gpsMatch[2].replace(/\s+/g, '').replace(',', '.'));
    const lngRef = (gpsMatch[4] || gpsMatch[6] || '').toUpperCase();
    let lng = parseFloat(gpsMatch[5].replace(/\s+/g, '').replace(',', '.'));

    if (latRef === 'S' && lat > 0) lat = -lat;
    if (lngRef === 'W' && lng > 0) lng = -lng;

    lat = Number(lat.toFixed(6));
    lng = Number(lng.toFixed(6));

    if (isValidCoordinate(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        coordinate: formatCoordinate(lat, lng)!,
        dmsCoordinate: formatDMSCoordinate(lat, lng)!,
        rawMatchedText: gpsMatch[0].trim(),
      };
    }
  }

  // ==========================================
  // PATTERN 4: Cardinal Direction Prefix/Suffix
  // Examples:
  // - S -0.305400 E 100.370867
  // - S 0.305400, E 100.370867
  // - 0.305400S, 100.370867E
  // ==========================================
  const cardinalRegex =
    /(?:([NSns])\s*)?([+-]?\d{1,2}(?:[.,]\d+)?)\s*([NSns])?[,\s]+(?:([EWew])\s*)?([+-]?\d{1,3}(?:[.,]\d+)?)\s*([EWew])?/i;

  const cardinalMatch = normalized.match(cardinalRegex);
  if (cardinalMatch) {
    const latRef = (cardinalMatch[1] || cardinalMatch[3] || '').toUpperCase();
    const lngRef = (cardinalMatch[4] || cardinalMatch[6] || '').toUpperCase();

    // Must have at least one cardinal indicator or decimal points
    if (latRef || lngRef) {
      let lat = parseFloat(cardinalMatch[2].replace(',', '.'));
      let lng = parseFloat(cardinalMatch[5].replace(',', '.'));

      if (latRef === 'S' && lat > 0) lat = -lat;
      if (lngRef === 'W' && lng > 0) lng = -lng;

      lat = Number(lat.toFixed(6));
      lng = Number(lng.toFixed(6));

      if (isValidCoordinate(lat, lng)) {
        return {
          latitude: lat,
          longitude: lng,
          coordinate: formatCoordinate(lat, lng)!,
          dmsCoordinate: formatDMSCoordinate(lat, lng)!,
          rawMatchedText: cardinalMatch[0].trim(),
        };
      }
    }
  }

  // ==========================================
  // PATTERN 5: Pure Decimal Pairs with Commas or Spaces
  // Examples:
  // - -0.305400, 100.370867
  // - -0.305400 100.370867
  // CRITICAL CHECK: Ignore dates (dd/mm/yyyy), times (hh:mm:ss), resolutions (1920x1080)
  // Require at least 3-6 decimal digits to prevent false positives from integer numbers
  // ==========================================
  const decimalPairRegex =
    /(?:^|[^\d/:-])([+-]?\d{1,2}[.,]\d{3,8})[,\s]+([+-]?\d{1,3}[.,]\d{3,8})(?:[^\d.]|$)/;

  const decimalMatch = normalized.match(decimalPairRegex);
  if (decimalMatch) {
    const latRaw = decimalMatch[1].replace(',', '.');
    const lngRaw = decimalMatch[2].replace(',', '.');

    const lat = Number(parseFloat(latRaw).toFixed(6));
    const lng = Number(parseFloat(lngRaw).toFixed(6));

    if (isValidCoordinate(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        coordinate: formatCoordinate(lat, lng)!,
        dmsCoordinate: formatDMSCoordinate(lat, lng)!,
        rawMatchedText: `${decimalMatch[1]}, ${decimalMatch[2]}`.trim(),
      };
    }
  }

  return null;
}
