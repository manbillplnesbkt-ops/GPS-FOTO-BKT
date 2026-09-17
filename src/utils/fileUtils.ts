/**
 * Utility functions for file processing and validation
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function generatePhotoId(): string {
  return 'photo_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

export function getFileFingerprint(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

export function isSupportedImageFile(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/heic',
  ];
  if (validTypes.includes(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'heic'].includes(ext || '');
}
