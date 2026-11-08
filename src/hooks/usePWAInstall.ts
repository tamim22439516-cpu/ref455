import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPrompt) {
      return window.__deferredPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone display mode (already installed on phone or desktop)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect mobile device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const isMobileDevice = /android|iphone|ipad|ipod|mobile/i.test(userAgent) || window.innerWidth < 768;
    setIsMobile(isMobileDevice);

    // Catch early deferred prompt if already captured
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__deferredPrompt = null;
      setDeferredPrompt(null);
    };

    const handlePromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa_prompt_ready', handlePromptReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa_prompt_ready', handlePromptReady);
    };
  }, []);

  const install = useCallback(async () => {
    const promptToUse = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);
    if (!promptToUse) {
      return false;
    }
    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        window.__deferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPrompt)),
    isInstalled,
    isIOS,
    isMobile,
    install,
    deferredPrompt,
  };
}
