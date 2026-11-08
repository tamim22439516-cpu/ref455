import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!forceShow) return false;
    return true;
  });

  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const handleReplay = () => {
      setIsExiting(false);
      setIsVisible(true);
    };
    window.addEventListener('replay_splash', handleReplay);
    (window as any).replayTawzoonSplash = handleReplay;
    return () => {
      window.removeEventListener('replay_splash', handleReplay);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      if (onComplete) onComplete();
      return;
    }

    // Lock body scroll during splash animation
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Start exit sequence at 700ms for swift, responsive feel
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 700);

    // Complete transition and unmount at 950ms
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = originalOverflow;
      try {
        sessionStorage.setItem('tawzoon_splash_completed', 'true');
      } catch (e) {
        // Fallback for private browsing
      }
      if (onComplete) onComplete();
    }, 950);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="tawzoon-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setIsVisible(false)}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 select-none overflow-hidden pt-safe pb-safe cursor-pointer"
          style={{
            minHeight: '100dvh',
            width: '100vw',
          }}
        >
          {/* Ambient Radial Glow Backdrop */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.6, 0.4] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute w-80 h-80 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 blur-3xl pointer-events-none"
          />

          {/* Centered Brand Emblem & Typography */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            {/* 3D TZ Logo Emblem */}
            <motion.div
              initial={{ scale: 0.65, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative mb-5"
            >
              {/* Outer soft shadow aura */}
              <div className="absolute inset-0 rounded-3xl bg-emerald-600/25 blur-xl transform scale-95" />

              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl shadow-emerald-950/15 bg-transparent">
                <img
                  src="/logo.png"
                  alt="TAWZOON"
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                TAWZOON
              </h1>
              <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1 tracking-wide">
                প্রিমিয়াম ই-কমার্স ও রিসেলার প্ল্যাটফর্ম
              </p>
            </motion.div>

            {/* Micro loading progress pill indicator (1.1s linear fill) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="w-32 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-7"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.05, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />
            </motion.div>
          </div>

          {/* Discreet bottom security/speed footnote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="absolute bottom-6 text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider"
          >
            FAST · SECURE · RELIABLE
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
