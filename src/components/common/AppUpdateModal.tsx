import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, ArrowRight, ShieldCheck, Download, AlertCircle, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents.js';
import { useApp } from '../../context/AppContext.js';

interface AppVersionInfo {
  version: string;
  publishedAt: number;
  releaseNotes: string;
  forceUpdate?: boolean;
}

export const AppUpdateModal: React.FC = () => {
  const { lang, brandSettings } = useApp();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const appName = brandSettings?.appName || 'TAWZOON';
  const logoUrl = brandSettings?.logoUrl || '/logo.png';

  // Check server for latest version
  const checkForUpdates = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Trigger Service Worker background update check
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            reg.update().catch(() => {});
            if (reg.waiting) {
              console.log('[AppUpdate] Service Worker has a waiting worker ready.');
            }
          }
        } catch {}
      }

      // 2. Fetch server app version with cache-busting
      const serverVersion = await api.getAppVersion();
      if (!serverVersion || !serverVersion.publishedAt) return;

      const storedPublishedAt = Number(localStorage.getItem('tawzoon_installed_published_at') || 0);

      // If initial launch without stored timestamp, seed it with current server timestamp
      if (!storedPublishedAt) {
        localStorage.setItem('tawzoon_installed_published_at', String(serverVersion.publishedAt));
        localStorage.setItem('tawzoon_installed_version', serverVersion.version);
        return;
      }

      // If server version timestamp is newer than stored timestamp -> UPDATE AVAILABLE!
      if (serverVersion.publishedAt > storedPublishedAt) {
        console.log(`[AppUpdate] New update detected! Server: ${serverVersion.publishedAt}, Client: ${storedPublishedAt}`);
        setUpdateInfo({
          version: serverVersion.version || '2.2.0',
          publishedAt: serverVersion.publishedAt,
          releaseNotes: serverVersion.releaseNotes || (lang === 'bn' ? 'নতুন পারফরম্যান্স, আইকন ও পণ্য আপডেট।' : 'New performance, icon and products update.'),
          forceUpdate: serverVersion.forceUpdate,
        });
        setUpdateAvailable(true);
        setIsDismissed(false);
      }
    } catch (err) {
      // Silent error: offline or network hiccup
    }
  }, [lang]);

  // Check on initial mount
  useEffect(() => {
    // Initial check after 2 seconds (allows page to boot smoothly)
    const initialTimer = setTimeout(() => {
      checkForUpdates();
    }, 2000);

    // Periodic check every 45 seconds
    const interval = setInterval(() => {
      checkForUpdates();
    }, 45000);

    // Check whenever user switches tabs or returns to app from home screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkForUpdates);

    // Listen to custom manual trigger
    const handleManualTrigger = () => {
      checkForUpdates();
    };
    window.addEventListener('check_app_updates', handleManualTrigger);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('check_app_updates', handleManualTrigger);
    };
  }, [checkForUpdates]);

  // Listen to realtime SSE broadcast events from server
  useRealtimeEvents((event) => {
    if (event.type === 'APP_UPDATE_PUBLISHED' || (event.type === 'STATE_UPDATED' && (event.data?.type === 'APP_UPDATE_PUBLISHED' || event.data?.type === 'BRANDING_UPDATED'))) {
      console.log('[AppUpdate] Realtime push notification received: New update published by admin!');
      checkForUpdates();
    }
  });

  // Listen for Service Worker updatefound & waiting events
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      const handleUpdateFound = () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[AppUpdate] Service Worker updated and waiting.');
            checkForUpdates();
          }
        });
      };

      reg.addEventListener('updatefound', handleUpdateFound);
    }).catch(() => {});
  }, [checkForUpdates]);

  // Execute the update download and activation
  const handleApplyUpdate = async () => {
    setIsUpdating(true);

    try {
      // 1. Tell Service Worker to activate immediately
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ action: 'SKIP_WAITING' });
        }
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ action: 'SKIP_WAITING' });
          navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_ALL_CACHES' });
        }
      }

      // 2. Clear all browser cache storage so new icons and assets load instantly
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
          console.log('[AppUpdate] All outdated caches purged.');
        } catch (e) {
          console.warn('[AppUpdate] Cache purge partial fail:', e);
        }
      }

      // 3. Mark update as applied in localStorage
      if (updateInfo?.publishedAt) {
        localStorage.setItem('tawzoon_installed_published_at', String(updateInfo.publishedAt));
      } else {
        localStorage.setItem('tawzoon_installed_published_at', String(Date.now()));
      }
      if (updateInfo?.version) {
        localStorage.setItem('tawzoon_installed_version', updateInfo.version);
      }

      // 4. Force hard reload from server
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error('[AppUpdate] Update failed:', err);
      window.location.reload();
    }
  };

  if (!updateAvailable || !updateInfo) {
    return null;
  }

  // If dismissed and not a forced update, render a compact floating pill at bottom-left
  if (isDismissed && !updateInfo.forceUpdate) {
    return (
      <div className="fixed bottom-20 left-4 z-[990] animate-bounce">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-2 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl border border-emerald-400/40 cursor-pointer transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'bn' ? 'নতুন আপডেট উপলব্ধ!' : 'Update Available!'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-slate-700 shadow-2xl p-6 sm:p-7 relative overflow-hidden text-center">
        {/* Top ambient color bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#009245] to-teal-400" />

        {/* Optional Dismiss button (only if not forced) */}
        {!updateInfo.forceUpdate && !isUpdating && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={lang === 'bn' ? 'পরে আপডেট করুন' : 'Update Later'}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Logo in clean, single rounded squircle */}
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-lg animate-pulse" />
          <img
            src={logoUrl}
            alt={appName}
            className="relative w-20 h-20 rounded-2xl object-cover shadow-lg mx-auto select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-md border border-white">
            v{updateInfo.version}
          </span>
        </div>

        {/* Title & Tagline */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
          {lang === 'bn' ? 'নতুন আপডেট প্রস্তুত!' : 'New Update Available!'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">
          {lang === 'bn'
            ? 'অ্যাপসের নতুন সংস্করণ প্রকাশিত হয়েছে। নতুন আইকন, পণ্য ও সকল ফিচার ব্যবহারের জন্য অ্যাপটি এখনই আপডেট করুন।'
            : 'A new version of the app has been published. Update now to get the latest icons, products, and features.'}
        </p>

        {/* Release Note Card */}
        {updateInfo.releaseNotes && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 mb-5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{lang === 'bn' ? 'আপডেটের মূল পরিবর্তনসমূহ:' : "What's New in this Update:"}</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}

        {/* Update progress indicator */}
        {isUpdating && (
          <div className="mb-5 space-y-2">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full animate-pulse w-full" />
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {lang === 'bn' ? 'নতুন আপডেট ডাউনলোড ও ইনস্টল হচ্ছে...' : 'Downloading & installing update...'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleApplyUpdate}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#009245] hover:from-emerald-700 hover:to-[#007a3a] text-white font-black text-sm shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-75"
          >
            <Download className={`w-4 h-4 ${isUpdating ? 'animate-bounce' : ''}`} />
            <span>
              {isUpdating
                ? (lang === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...')
                : (lang === 'bn' ? 'এখনই আপডেট করুন' : 'Update App Now')}
            </span>
          </button>

          {!updateInfo.forceUpdate && !isUpdating && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'পরে মনে করিয়ে দিন' : 'Remind Me Later'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
