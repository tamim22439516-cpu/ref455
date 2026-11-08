import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Progressive Web App Service Worker registration & Preview Cache Purge
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreview = window.location.hostname.includes('run.app') || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('127.0.0.1');

  if (isPreview) {
    // Cleanly unregister any stale SW in AI Studio dev/preview environment
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key).catch(() => {}));
      }).catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] ServiceWorker registration error:', error);
        });
    });
  }
}

