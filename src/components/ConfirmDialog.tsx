import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  darkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        id="confirm-delete-dialog"
        className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-3 text-red-500">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-base">{title}</h4>
        </div>

        <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {message}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            id="cancel-dialog-btn"
            onClick={onCancel}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-action-btn"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-all active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
