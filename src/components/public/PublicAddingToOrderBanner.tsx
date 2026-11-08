import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

export const PublicAddingToOrderBanner: React.FC = () => {
  const { lang, openCheckoutModal, isCheckoutModalOpen } = useApp();
  const [isActive, setIsActive] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const checkState = () => {
    if (typeof window === 'undefined') return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const isMode = sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true';
    setIsActive(isMode);
    try {
      const items = JSON.parse(sessionStorage.getItem('tawzoon_pending_order_items') || '[]');
      setItemCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setItemCount(0);
    }
  };

  useEffect(() => {
    checkState();

    const handleModeChange = () => checkState();
    window.addEventListener('tawzoon_order_mode_changed', handleModeChange);
    window.addEventListener('storage', handleModeChange);

    // Poll periodically while mounted to stay instantly responsive
    const interval = setInterval(checkState, 800);

    return () => {
      window.removeEventListener('tawzoon_order_mode_changed', handleModeChange);
      window.removeEventListener('storage', handleModeChange);
      clearInterval(interval);
    };
  }, []);

  // Do not render if mode is inactive or if the checkout modal is currently open
  if (!isActive || isCheckoutModalOpen) return null;

  const handleReturnToOrderForm = () => {
    try {
      const items = JSON.parse(sessionStorage.getItem('tawzoon_pending_order_items') || '[]');
      sessionStorage.removeItem('tawzoon_is_adding_to_order');
      setIsActive(false);
      window.dispatchEvent(new Event('tawzoon_order_mode_changed'));
      openCheckoutModal(
        items.map((it: any) => ({
          product: it.originalProduct || it.product || it,
          size: it.size,
          quantity: it.quantity,
        }))
      );
    } catch {
      sessionStorage.removeItem('tawzoon_is_adding_to_order');
      setIsActive(false);
      openCheckoutModal();
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem('tawzoon_is_adding_to_order');
    setIsActive(false);
    window.dispatchEvent(new Event('tawzoon_order_mode_changed'));
  };

  return (
    <aside
      aria-label="Order Addition Bar"
      className="fixed bottom-16 sm:bottom-5 left-1/2 -translate-x-1/2 z-[990] max-w-sm sm:max-w-md w-[92%] sm:w-auto bg-blue-600/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xl border border-blue-400/40 flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
          <Package className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <div className="text-[11px] sm:text-xs font-black text-white truncate flex items-center gap-1">
            <span>
              {lang === 'bn'
                ? `অর্ডারে যোগ (${itemCount}টি)`
                : `Adding (${itemCount})`}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping shrink-0" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleReturnToOrderForm}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-[#009245] text-[11px] font-black shadow-xs cursor-pointer transition-all flex items-center gap-1 active:scale-95"
        >
          <span>{lang === 'bn' ? 'অর্ডারে ফিরুন' : 'Return'}</span>
          <ArrowRight className="w-3 h-3 text-[#009245]" />
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          title={lang === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
