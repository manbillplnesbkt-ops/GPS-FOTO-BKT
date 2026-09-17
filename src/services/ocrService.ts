/**
 * OCR Service for detecting stamped GPS coordinates on photos
 * Supports Timestamp Camera, GPS Map Camera, and Open Camera formats.
 * 100% Client-side using Tesseract.js.
 */

import { createWorker, Worker } from 'tesseract.js';
import { parseCoordinatesFromText } from '../utils/coordinateUtils';

let ocrWorker: Worker | null = null;
let isWorkerInitializing = false;

/**
 * Initializes and caches a singleton Tesseract worker.
 */
export async function getOcrWorker(): Promise<Worker> {
  if (ocrWorker) return ocrWorker;
  if (isWorkerInitializing) {
    // Wait until initialized
    while (isWorkerInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (ocrWorker) return ocrWorker;
  }

  isWorkerInitializing = true;
  try {
    const worker = await createWorker('eng');
    ocrWorker = worker;
    return worker;
  } finally {
    isWorkerInitializing = false;
  }
}

/**
 * Preprocesses and crops specific regions of an image into a data URL for fast OCR:
 * Region 1: Bottom 32% (standard Timestamp Camera location)
 * Region 2: Top 22% (alternative header timestamp location)
 * Region 3: Full scaled image (fallback)
 */
async function extractRegionDataUrl(
  imageSource: string | HTMLImageElement,
  region: 'bottom' | 'top' | 'full'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = typeof imageSource === 'string' ? new Image() : imageSource;
    if (typeof imageSource === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = imageSource;
    }

    const process = () => {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      // Limit max processing width to 1400px for speed while maintaining high OCR legibility
      const targetWidth = Math.min(naturalWidth, 1400);
      const scale = targetWidth / naturalWidth;

      let srcY = 0;
      let srcHeight = naturalHeight;

      if (region === 'bottom') {
        const cropPercent = 0.32;
        srcY = Math.floor(naturalHeight * (1 - cropPercent));
        srcHeight = naturalHeight - srcY;
      } else if (region === 'top') {
        const cropPercent = 0.22;
        srcY = 0;
        srcHeight = Math.floor(naturalHeight * cropPercent);
      }

      canvas.width = Math.floor(naturalWidth * scale);
      canvas.height = Math.floor(srcHeight * scale);

      // Draw cropped slice
      ctx.drawImage(
        img,
        0,
        srcY,
        naturalWidth,
        srcHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Simple contrast & threshold boost for yellow/white/red stamped text
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale luminance
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Slight contrast stretch
          const contrast = (gray - 128) * 1.3 + 128;
          const val = Math.max(0, Math.min(255, contrast));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // Continue with standard canvas if ImageData manipulation blocked
      }

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    if (img.complete && (img.naturalWidth || img.width)) {
      process();
    } else {
      img.onload = () => process();
      img.onerror = (e) => reject(e);
    }
  });
}

export interface OcrCoordResult {
  latitude: number | null;
  longitude: number | null;
  coordinate: string | null;
  dmsCoordinate: string | null;
  recognizedText: string;
  matchedText?: string;
  success: boolean;
}

/**
 * Executes multi-pass OCR on a photo to detect stamped coordinates.
 * Pass 1: Bottom 32% (Fastest & most common for Timestamp Camera)
 * Pass 2: Top 22% (If bottom produced no coordinates)
 * Pass 3: Full scaled image (If bottom and top produced no coordinates)
 */
export async function performPhotoOcr(
  imageSource: string | File,
  onProgress?: (status: string) => void
): Promise<OcrCoordResult> {
  const imageUrl = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
  const isCreatedUrl = typeof imageSource !== 'string';

  try {
    onProgress?.('Menginisialisasi modul OCR...');
    const worker = await getOcrWorker();

    // 1. Pass 1: Bottom Region
    onProgress?.('Membaca teks timestamp (area bawah foto)...');
    const bottomSlice = await extractRegionDataUrl(imageUrl, 'bottom');
    const resBottom = await worker.recognize(bottomSlice);
    let allText = resBottom.data.text || '';

    let parsed = parseCoordinatesFromText(allText);
    if (parsed) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        coordinate: parsed.coordinate,
        dmsCoordinate: parsed.dmsCoordinate,
        recognizedText: allText.trim(),
        matchedText: parsed.rawMatchedText,
        success: true,
      };
    }

    // 2. Pass 2: Top Region
    onProgress?.('Membaca teks timestamp (area atas foto)...');
    const topSlice = await extractRegionDataUrl(imageUrl, 'top');
    const resTop = await worker.recognize(topSlice);
    const topText = resTop.data.text || '';
    allText += '\n' + topText;

    parsed = parseCoordinatesFromText(topText);
    if (parsed) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        coordinate: parsed.coordinate,
        dmsCoordinate: parsed.dmsCoordinate,
        recognizedText: allText.trim(),
        matchedText: parsed.rawMatchedText,
        success: true,
      };
    }

    // 3. Pass 3: Full image fallback
    onProgress?.('Menganalisis seluruh area foto...');
    const fullSlice = await extractRegionDataUrl(imageUrl, 'full');
    const resFull = await worker.recognize(fullSlice);
    const fullText = resFull.data.text || '';
    allText += '\n' + fullText;

    parsed = parseCoordinatesFromText(fullText);
    if (parsed) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        coordinate: parsed.coordinate,
        dmsCoordinate: parsed.dmsCoordinate,
        recognizedText: allText.trim(),
        matchedText: parsed.rawMatchedText,
        success: true,
      };
    }

    return {
      latitude: null,
      longitude: null,
      coordinate: null,
      dmsCoordinate: null,
      recognizedText: allText.trim(),
      success: false,
    };
  } catch (err) {
    console.warn('OCR error:', err);
    return {
      latitude: null,
      longitude: null,
      coordinate: null,
      dmsCoordinate: null,
      recognizedText: '',
      success: false,
    };
  } finally {
    if (isCreatedUrl) {
      try {
        URL.revokeObjectURL(imageUrl);
      } catch {
        // ignore
      }
    }
  }
}
