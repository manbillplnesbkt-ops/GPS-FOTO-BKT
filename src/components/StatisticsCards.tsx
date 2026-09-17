import React from 'react';
import { Camera, MapPin, ScanText, AlertCircle } from 'lucide-react';
import { PhotoData } from '../types/photo';

interface StatisticsCardsProps {
  photos: PhotoData[];
  filteredCount: number;
  darkMode: boolean;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  photos,
  filteredCount,
  darkMode,
}) => {
  const totalPhotos = photos.length;
  const exifGpsCount = photos.filter((p) => p.gpsStatusType === 'exif_gps').length;
  const ocrGpsCount = photos.filter((p) => p.gpsStatusType === 'ocr_gps').length;
  const noGpsCount = photos.filter((p) => p.gpsStatusType === 'no_gps').length;

  const cards = [
    {
      id: 'stat-total-photos',
      title: 'Total Foto',
      value: totalPhotos,
      badgeText: totalPhotos > 0 && filteredCount !== totalPhotos ? `${filteredCount} difilter` : undefined,
      icon: Camera,
      colorClass: 'blue',
      borderClass: darkMode ? 'border-blue-900/40' : 'border-blue-100',
      bgIconClass: darkMode ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600',
    },
    {
      id: 'stat-exif-gps',
      title: 'EXIF GPS',
      badgePrefix: '🟢',
      value: exifGpsCount,
      percentage: totalPhotos > 0 ? `${Math.round((exifGpsCount / totalPhotos) * 100)}%` : undefined,
      description: 'Dari metadata EXIF',
      icon: MapPin,
      colorClass: 'emerald',
      borderClass: darkMode ? 'border-emerald-900/40' : 'border-emerald-100',
      bgIconClass: darkMode ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'stat-ocr-gps',
      title: 'OCR GPS',
      badgePrefix: '🟡',
      value: ocrGpsCount,
      percentage: totalPhotos > 0 ? `${Math.round((ocrGpsCount / totalPhotos) * 100)}%` : undefined,
      description: 'Cap Timestamp Camera',
      icon: ScanText,
      colorClass: 'amber',
      borderClass: darkMode ? 'border-amber-900/40' : 'border-amber-100',
      bgIconClass: darkMode ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600',
    },
    {
      id: 'stat-no-gps',
      title: 'GPS Tidak Ada',
      badgePrefix: '🔴',
      value: noGpsCount,
      percentage: totalPhotos > 0 ? `${Math.round((noGpsCount / totalPhotos) * 100)}%` : undefined,
      description: 'Tidak ada koordinat',
      icon: AlertCircle,
      colorClass: 'rose',
      borderClass: darkMode ? 'border-rose-900/40' : 'border-rose-100',
      bgIconClass: darkMode ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div id="statistics-section" className="flex flex-col h-full gap-3 justify-between">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            id={card.id}
            className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all flex-1 ${
              card.borderClass
            } ${
              darkMode
                ? 'bg-slate-800/80 text-white hover:bg-slate-800'
                : 'bg-white text-slate-900 hover:bg-slate-50/90'
            }`}
          >
            {/* Left: Icon & Text Information */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${card.bgIconClass}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {card.badgePrefix && <span className="text-xs shrink-0">{card.badgePrefix}</span>}
                  <span
                    className={`text-xs font-bold tracking-wide uppercase truncate ${
                      darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {card.title}
                  </span>
                </div>
                {card.description && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5 truncate">
                    {card.description}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Numerical Metrics & Badges */}
            <div className="text-right flex flex-col items-end shrink-0 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                  {card.value}
                </span>
                {card.percentage && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      card.colorClass === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : card.colorClass === 'amber'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}
                  >
                    {card.percentage}
                  </span>
                )}
              </div>
              {card.badgeText && (
                <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 mt-0.5">
                  {card.badgeText}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
