import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Smartphone, X } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang, brandSettings } = useApp();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const logoUrl = brandSettings?.logoUrl || '/logo.png';
  const appName = brandSettings?.appName || 'TAWZOON';

  const handleTrigger = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (isInstallable) {
      await install();
      return;
    }
    window.dispatchEvent(new CustomEvent('trigger_pwa_install'));
  };

  return (
    <>
      <button
        onClick={handleTrigger}
        className={`inline-flex items-center gap-1.5 font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
          compact
            ? 'px-2.5 py-1 text-[11px] bg-[#009245] text-white hover:bg-[#007a3a]'
            : 'px-3 py-1.5 text-xs bg-[#009245] text-white hover:bg-[#007a3a]'
        }`}
        title={lang === 'bn' ? 'অফিসিয়াল অ্যাপ ইনস্টল ও ডাউনলোড করুন' : 'Install & Download App'}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>{lang === 'bn' ? 'অ্যাপ ডাউনলোড' : 'Download App'}</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={logoUrl}
              alt={appName}
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-md select-none"
            />

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {appName} {lang === 'bn' ? 'আইফোন / আইপ্যাডে ইনস্টল করুন' : 'Install on iPhone / iPad'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {lang === 'bn'
                ? 'আইফোনে অ্যাপটি হোম স্ক্রিনে ইনস্টল করতে নিচের সহজ ২টি ধাপ অনুসরণ করুন:'
                : 'Follow these 2 simple steps to add the app to your iPhone Home Screen:'}
            </p>

            <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 mb-5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#009245] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ১
                </span>
                <span>
                  {lang === 'bn'
                    ? 'সাফারি ব্রাউজারের নিচে শেয়ার (Share) বাটনে ট্যাপ করুন।'
                    : 'Tap the Share icon at the bottom of Safari browser.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#009245] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  ২
                </span>
                <span>
                  {lang === 'bn'
                    ? "নিচে স্ক্রল করে 'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন) চাপুন।"
                    : "Scroll down and tap 'Add to Home Screen'."}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#009245] text-white font-extrabold text-xs shadow-md hover:bg-[#007a3a] transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি ✓' : 'Got it ✓'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
