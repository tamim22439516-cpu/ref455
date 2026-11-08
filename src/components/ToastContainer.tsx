import React from 'react';
import { useApp } from '../context/AppContext.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000000] flex flex-col items-center gap-1.5 pointer-events-none max-w-[85vw]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#009245]/88 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-emerald-300/30 flex items-center gap-1.5 text-[11px] font-black animate-in fade-in zoom-in-95 duration-150 max-w-[85vw] whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-200 shrink-0" />}
          {toast.type === 'info' && <Info className="w-3.5 h-3.5 text-sky-200 shrink-0" />}

          <span className="font-bold leading-normal truncate font-sans text-white tracking-wide">
            {toast.message.normalize('NFC')}
          </span>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-white/70 hover:text-white p-0.5 transition-colors shrink-0 ml-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
