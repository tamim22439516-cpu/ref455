import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.js';
import { useApp } from '../../context/AppContext.js';
import { Download, Smartphone, Monitor, X, Star, CheckCircle, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

export const PWAAutoInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install, deferredPrompt } = usePWAInstall();
  const { lang, brandSettings, showToast } = useApp();

  const [hasDismissed, setHasDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showManualGuideModal, setShowManualGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !localStorage.getItem('tawzoon_pwa_dismissed');
  });

  const appName = brandSettings?.appName || 'TAWZOON';
  const logoUrl = brandSettings?.logoUrl || '/logo.png';



  // Listen to custom global event from Desktop Navbar or other triggers
  useEffect(() => {
    const handleTrigger = () => {
      handleInstallClick();
    };
    window.addEventListener('trigger_pwa_install', handleTrigger);
    return () => window.removeEventListener('trigger_pwa_install', handleTrigger);
  }, [isInstallable, deferredPrompt, isIOS]);

  // If running standalone (installed as app), completely hide all install prompts
  if (isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setIsOpen(false);
    setHasDismissed(true);
    try {
      localStorage.setItem('tawzoon_pwa_dismissed', 'true');
    } catch {}
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      if (isIOS) {
        setShowIOSModal(true);
        setIsOpen(false);
        return;
      }

      if (isInstallable || deferredPrompt || (window as any).__deferredPrompt) {
        const success = await install();
        if (success) {
          showToast(
            lang === 'bn'
              ? 'অভিনন্দন! অ্যাপটি সফলভাবে ডাউনলোড ও ইনস্টল হয়েছে!'
              : 'App successfully installed on your device!',
            'success'
          );
          setIsOpen(false);
          return;
        }
      }

      // If browser prevented direct prompt or requires manual address-bar install
      setShowManualGuideModal(true);
    } catch (err) {
      console.warn('Install trigger error:', err);
      setShowManualGuideModal(true);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. AUTO-PROMPT ON ENTRY: MOBILE BOTTOM SLIDE-UP SHEET          */}
      {/* ============================================================== */}
      {isOpen && isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-[700] p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 md:hidden pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 dark:border-slate-700 rounded-3xl shadow-[0_-8px_32px_rgba(0,146,69,0.18)] p-4 sm:p-5 relative overflow-hidden">
            
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#009245] to-teal-400" />

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 mb-3.5">
              {/* App Logo with clean, single rounded shape */}
              <img
                src={logoUrl}
                alt={appName}
                className="w-14 h-14 rounded-2xl object-cover shadow-md shrink-0 select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {appName} {lang === 'bn' ? 'অফিসিয়াল অ্যাপ' : 'Official App'}
                  </h3>
                  <span className="text-[9px] font-black text-[#009245] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                    {lang === 'bn' ? 'ফ্রি' : 'Free'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">
                    ৫.০ (অফিসিয়াল) • ইনস্ট্যান্ট ডাউনলোড
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  {lang === 'bn'
                    ? 'সহজ ও দ্রুত কেনাকাটা এবং বিজনেসের জন্য এখনই মোবাইলে অ্যাপটি ডাউনলোড ও ইনস্টল করুন।'
                    : 'Download & install the official app on your phone for instant shopping & orders.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>
                  {installing
                    ? (lang === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Installing...')
                    : (lang === 'bn' ? '📥 অ্যাপ ডাউনলোড ও ইনস্টল করুন' : '📥 Download & Install App')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                {lang === 'bn' ? 'পরে করব' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AUTO-PROMPT ON ENTRY: DESKTOP CARD MODAL (PC / LAPTOP)      */}
      {/* ============================================================== */}
      {isOpen && !isMobile && (
        <div className="fixed top-20 right-6 z-[700] w-[390px] max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 hidden md:block pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-5 relative overflow-hidden">
            
            {/* Top gradient highlight */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#009245] to-teal-400" />

            {/* Close button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              {/* App logo with clean, single rounded shape */}
              <img
                src={logoUrl}
                alt={appName}
                className="w-13 h-13 rounded-2xl object-cover shadow-md shrink-0 select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <div className="min-w-0 pr-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {appName} {lang === 'bn' ? 'ডেস্কটপ অ্যাপ্লিকেশন' : 'Desktop Application'}
                </h3>
                <p className="text-[11px] text-[#009245] font-bold mt-0.5 flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'Windows • Mac • Chrome' : 'Windows • Mac • Chrome'}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              {lang === 'bn'
                ? 'ডেস্কটপ বা ল্যাপটপ থেকে সরাসরি ফুল-স্ক্রিন এক্সপেরিয়েন্স ও ১ ক্লিকে ওপেন করার জন্য পিসি অ্যাপটি এখনই ডাউনলোড করুন।'
                : 'Install the official PC app for a dedicated, fast standalone desktop experience.'}
            </p>

            <div className="space-y-1.5 mb-4 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-150 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                <span>{lang === 'bn' ? 'ব্রাউজার ছাড়াই সরাসরি ডেস্কটপ আইকন থেকে ১ ক্লিকে ওপেন' : 'Opens directly from desktop with 1 click'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                <span>{lang === 'bn' ? 'রিয়েল-টাইম সেলস ও অর্ডার নোটিফিকেশন' : 'Real-time sales & order notifications'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                <span>{lang === 'bn' ? 'সুপার ফাস্ট লোডিং ও ১০০% নিরাপদ পিসি অ্যাপ' : 'Super fast loading & 100% safe desktop app'}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-[#009245] hover:from-emerald-700 hover:to-[#007a3a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>
                  {installing
                    ? (lang === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Installing...')
                    : (lang === 'bn' ? '📥 ডেস্কটপ অ্যাপ ডাউনলোড ও ইনস্টল' : '📥 Download & Install PC App')}
                </span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                {lang === 'bn' ? 'এখন নয়' : 'Not now'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ============================================================== */}
      {/* 4. IOS SAFARI INSTRUCTION MODAL                                */}
      {/* ============================================================== */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center relative">
            <button
              onClick={() => setShowIOSModal(false)}
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
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#009245] text-white font-extrabold text-xs shadow-md hover:bg-[#007a3a] transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি ✓' : 'Got it ✓'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MANUAL FALLBACK GUIDANCE MODAL                              */}
      {/* ============================================================== */}
      {showManualGuideModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-center relative">
            <button
              onClick={() => setShowManualGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <img
              src={logoUrl}
              alt={appName}
              className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 shadow-md select-none"
            />

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {appName} {lang === 'bn' ? 'অ্যাপ ডাউনলোড ও ইনস্টল' : 'Download Application'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {lang === 'bn'
                ? 'আপনার ডিভাইসে সহজে অ্যাপটি ইনস্টল করতে নিচের নিয়ম অনুসরণ করুন:'
                : 'Follow the quick instructions below to install the application:'}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-700 text-xs text-left text-slate-700 dark:text-slate-200 space-y-2 mb-5">
              {isMobile ? (
                <>
                  <p className="font-bold text-slate-900 dark:text-white">📱 মোবাইলে ইনস্টল করতে:</p>
                  <p>১. ব্রাউজারের উপরে/নিচে ৩ ডট মেনু (⋮) চাপুন।</p>
                  <p>২. 'Install app' অথবা 'Add to Home Screen' চাপুন।</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-slate-900 dark:text-white">💻 ডেস্কটপ / পিসিতে ইনস্টল করতে:</p>
                  <p>১. ব্রাউজারের ইউআরএল (URL) বারের ডানপাশে 📥 (Install App) আইকনে চাপুন।</p>
                  <p>২. অথবা ৩ ডট মেনু (⋮) → 'Cast, save and share' → 'Install TAWZOON' এ ক্লিক করুন।</p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowManualGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#009245] text-white font-extrabold text-xs shadow-md hover:bg-[#007a3a] transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
