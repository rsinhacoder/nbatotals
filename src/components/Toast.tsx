import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#121826] text-slate-800 dark:text-zinc-200 shadow-lg',
    error: 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#121826] text-slate-800 dark:text-zinc-200 shadow-lg',
    info: 'border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#121826] text-slate-800 dark:text-zinc-200 shadow-lg',
  };

  return (
    <div
      className={`pointer-events-auto border rounded-xl p-3.5 shadow-md flex items-start gap-3 animate-slide-up transition-all ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0 text-xs">
        <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs">{toast.title}</div>
        {toast.message && <div className="text-slate-600 dark:text-zinc-400 mt-0.5">{toast.message}</div>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 p-0.5 rounded cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
