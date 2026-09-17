import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types/photo';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const getStyle = () => {
          switch (toast.type) {
            case 'success':
              return {
                bg: 'bg-emerald-900/95 text-emerald-100 border-emerald-700/80',
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              };
            case 'error':
              return {
                bg: 'bg-red-900/95 text-red-100 border-red-700/80',
                icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
              };
            case 'warning':
              return {
                bg: 'bg-amber-900/95 text-amber-100 border-amber-700/80',
                icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              };
            default:
              return {
                bg: 'bg-slate-900/95 text-slate-100 border-slate-700',
                icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
              };
          }
        };

        const { bg, icon } = getStyle();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-xs">
              <div className="font-semibold">{toast.title}</div>
              {toast.message && (
                <div className="text-[11px] opacity-90 mt-0.5">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:opacity-75 transition-opacity text-slate-300"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
