import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import {
  ShoppingCart,
  Search,
  User,
  Globe,
  ShieldCheck,
  X,
  Bell,
  LogOut,
  ChevronRight,
  Camera,
  ArrowLeft,
  Menu,
  Home,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Heart,
  Download,
  Monitor,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';
import { SearchInputWithImage } from './common/SearchInputWithImage.js';
import { BkashBalanceButton } from './common/BkashBalanceButton.js';
import { api } from '../services/api.js';
import { NotificationItem } from '../types/index.js';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents.js';

export const Navbar: React.FC = () => {
  const {
    lang,
    setLang,
    brandSettings,
    activePortal,
    setActivePortal,
    publicCategory,
    setPublicCategory,
    publicSearch,
    setPublicSearch,
    setSelectedProduct,
    selectedPublicSubcategory,
    setSelectedPublicSubcategory,
    refreshBootstrap,
    isAdminAuthenticated,
    adminToken,
    isEmployeeAuthenticated,
    employeeToken,
    employee,
    employeeLogout,
    adminLogout,
    theme,
    setTheme,
    showToast,
    showPromo,
    setShowPromo,
    resellerTab,
    setResellerTab,
    resellerCatalogView,
    setResellerCatalogView,
    cartItems,
    isPublicCartOpen,
    setIsPublicCartOpen,
    wishlistItems,
    isAdminMobileMenuOpen,
    setIsAdminMobileMenuOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
  } = useApp();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const brandName = brandSettings?.appName || 'TAWZOON NEXUS';

  const getReadPublicIds = (): string[] => {
    try {
      const raw = localStorage.getItem('tawzoon_read_public_notifs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [readPublicIds, setReadPublicIds] = useState<string[]>(getReadPublicIds);
  const isInitialLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  // Elegant, harmonious dual chime for incoming notifications
  const playNotificationChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: now, duration: 0.18, gainVal: 0.12 },
        { freq: 783.99, time: now + 0.12, duration: 0.28, gainVal: 0.15 }
      ];
      notes.forEach(({ freq, time, duration, gainVal }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(gainVal, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // Unlock audio context on user interaction to handle browser autoplay policies
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const dummyCtx = new AudioContextClass();
          dummyCtx.resume().then(() => {
            dummyCtx.close().catch(() => {});
          }).catch(() => {});
        }
      } catch {}
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Dynamic notification fetcher supporting Public, Reseller, and Admin
  const loadNotifs = useCallback(async (isRealtimeEvent = false) => {
    try {
      let list: NotificationItem[] = [];
      if (activePortal === 'employee' && employeeToken && isEmployeeAuthenticated) {
        const res = await api.employeeGetNotifications(employeeToken);
        if (Array.isArray(res)) list = res;
      } else if (activePortal === 'admin' && adminToken && isAdminAuthenticated) {
        const res = await api.adminGetNotifications(adminToken);
        if (Array.isArray(res)) list = res;
      } else {
        // Public Storefront (visitors and buyers)
        const res = await api.publicGetNotifications();
        if (Array.isArray(res)) list = res;
      }

      setNotificationsList(list);

      // On initial load or page refresh: register existing IDs silently WITHOUT sound
      if (isInitialLoadRef.current) {
        list.forEach(item => knownNotificationIdsRef.current.add(item.id));
        isInitialLoadRef.current = false;
        return;
      }

      // On subsequent fetches or real-time events: check for brand-new notification IDs
      let hasBrandNew = false;
      for (const item of list) {
        if (!knownNotificationIdsRef.current.has(item.id)) {
          knownNotificationIdsRef.current.add(item.id);
          hasBrandNew = true;
        }
      }

      // Play alert chime ONLY when a genuine new notification arrives live
      if (hasBrandNew && isRealtimeEvent) {
        playNotificationChime();
      }
    } catch {
      // silent fail
    }
  }, [activePortal, employeeToken, adminToken, isEmployeeAuthenticated, isAdminAuthenticated, playNotificationChime]);

  // Initial and gentle periodic polling fallback (only runs when tab is active and visible)
  useEffect(() => {
    loadNotifs(false);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadNotifs(false);
    }, 30000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadNotifs(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadNotifs]);

  // Listen to Server-Sent Real-time Events for instant notification delivery
  useRealtimeEvents((event) => {
    if (
      event.type === 'NEW_NOTIFICATION' ||
      event.type === 'NOTIFICATION_ADDED' ||
      event.type === 'NOTIFICATION_DELETED' ||
      event.type === 'BRANDING_UPDATED' ||
      (event.type === 'STATE_UPDATED' && (event.data?.type === 'NOTIFICATION_ADDED' || event.data?.type === 'BRANDING_UPDATED'))
    ) {
      loadNotifs(true);
    }
  });

  // Listen for local tab / portal read events
  useEffect(() => {
    const handleUpdate = () => {
      setReadPublicIds(getReadPublicIds());
      loadNotifs(false);
    };
    window.addEventListener('tawzoon_notifications_updated', handleUpdate);
    return () => window.removeEventListener('tawzoon_notifications_updated', handleUpdate);
  }, [loadNotifs]);

  // Compute accurate unread count per active portal (NO fake numbers, NO fake 99+)
  const unreadCount = useMemo(() => {
    if (activePortal === 'employee') {
      return notificationsList.filter(n => !n.isRead).length;
    }
    if (activePortal === 'admin') {
      return notificationsList.filter(n => !n.isRead).length;
    }
    // Public portal
    return notificationsList.filter(n => !n.isRead && !readPublicIds.includes(n.id)).length;
  }, [notificationsList, activePortal, readPublicIds]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        if (!publicSearch.trim()) {
          setIsSearchExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [publicSearch]);

  const notificationText =
    brandSettings?.promoBannerTextBn ||
    (lang === 'bn'
      ? '🎉 স্বাগতম! দেশজুড়ে ক্যাশ অন ডেলিভারি ও দ্রুত হোম ডেলিভারি সুবিধা।'
      : '🎉 Welcome! Nationwide Cash on Delivery & Fast Delivery.');

  const isReseller = activePortal === 'employee';

  const handleNavClick = (type: 'home' | 'dashboard' | 'orders' | 'cart' | 'profile') => {
    if (setSelectedProduct) setSelectedProduct(null);

    if (type === 'home') {
      if (setSelectedProduct) setSelectedProduct(null);
      if (setPublicSearch) setPublicSearch('');
      if (setSelectedPublicSubcategory) setSelectedPublicSubcategory(null);
      if (setIsPublicCartOpen) setIsPublicCartOpen(false);
      if (refreshBootstrap) {
        refreshBootstrap().catch(() => {});
      }

      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        if (setResellerTab) setResellerTab('catalog');
        if (setResellerCatalogView) setResellerCatalogView('public-home');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee');
          } catch {}
        }
        window.dispatchEvent(new CustomEvent('tawzoon_nav_home'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        if (setPublicCategory) setPublicCategory('all');
        window.dispatchEvent(new CustomEvent('tawzoon_nav_home'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'dashboard') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('dashboard');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/dashboard');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        if (setPublicCategory) setPublicCategory('shop_tab');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'orders') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('orders');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/orders');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        if (setPublicCategory) setPublicCategory('wishlist');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'cart') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('cart');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/cart');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsPublicCartOpen(true);
      }
    } else if (type === 'profile') {
      setActivePortal('employee');
      setResellerTab('profile');
      if (typeof window !== 'undefined') {
        try {
          history.replaceState(null, '', '#employee/profile');
        } catch {}
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isCartActive = isReseller ? resellerTab === 'cart' : Boolean(isPublicCartOpen);
  const isOrdersActive = !isCartActive && (isReseller
    ? resellerTab === 'orders'
    : activePortal === 'public' && publicCategory === 'wishlist');
  const isDashboardActive = !isCartActive && !isOrdersActive && (isReseller
    ? resellerTab === 'dashboard'
    : activePortal === 'public' && publicCategory === 'shop_tab');
  const isHomeActive = !isCartActive && !isOrdersActive && !isDashboardActive && (isReseller
    ? (resellerTab === 'catalog' && resellerCatalogView === 'public-home')
    : activePortal === 'public' && publicCategory !== 'wishlist' && publicCategory !== 'shop_tab');

  const handleProfileClick = () => {
    setProfileMenuOpen(false);
    if (isEmployeeAuthenticated) {
      setActivePortal('employee');
      setResellerTab('profile');
    } else {
      setActivePortal('employee');
    }
  };

  const handleAdminLoginClick = () => {
    setProfileMenuOpen(false);
    setActivePortal('admin');
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    if (activePortal === 'admin' || isAdminAuthenticated) {
      adminLogout();
      showToast(lang === 'bn' ? 'অ্যাডমিন লগআউট সম্পন্ন হয়েছে' : 'Admin logged out');
    } else {
      employeeLogout();
      showToast(lang === 'bn' ? 'সফলভাবে লগআউট হয়েছেন' : 'Logged out successfully');
    }
  };

  const handleHeaderSearchSubmit = () => {
    if (activePortal === 'employee') {
      setResellerTab('catalog');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tawzoon_search_submit', { detail: { query: publicSearch } }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[500] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      
      {/* Top Notification Announcement Bar (Slimmer & Sleeker) */}
      {showPromo && (
        <div className="bg-[#009245] text-white text-[11px] py-1 px-2.5 sm:px-4 font-medium tracking-wide flex flex-nowrap items-center justify-between gap-1.5 sm:gap-2 shadow-inner w-full overflow-hidden">
          <div 
            onClick={() => {
              setActivePortal('public');
              if (setPublicCategory) setPublicCategory('all');
            }} 
            className="flex items-center gap-1.5 min-w-0 flex-1 truncate cursor-pointer hover:underline"
            title={lang === 'bn' ? 'হোম পেজে যেতে চাপ দিন' : 'Click to go to homepage'}
          >
            <Bell className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-200" />
            <span className="truncate text-[11px] sm:text-xs font-bold leading-tight">
              {lang === 'bn'
                ? brandSettings?.promoBannerTextBn || notificationText
                : brandSettings?.promoBannerTextEn || notificationText}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="text-emerald-100 hover:text-white text-[10.5px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPromo(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors cursor-pointer shrink-0"
              title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Bar - Compact Single Row for Mobile & Desktop */}
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5 lg:gap-3.5 relative">
        
        {isSearchExpanded ? (
          /* EXPANDED FULL-WIDTH SEARCH BAR FOR MOBILE ONLY */
          <div
            ref={searchContainerRef}
            className="flex-1 w-full flex items-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {/* Back Button to close search */}
            <button
              type="button"
              onClick={() => setIsSearchExpanded(false)}
              className="p-2 rounded-xl text-slate-600 hover:text-[#009245] hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              title={lang === 'bn' ? 'সার্চ বন্ধ করুন' : 'Close search'}
            >
              <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>

            {/* High-visibility Big Search Input with Camera & Clear */}
            <div className="flex-1 min-w-0">
              <SearchInputWithImage
                value={publicSearch}
                onChange={setPublicSearch}
                onSearchSubmit={handleHeaderSearchSubmit}
                placeholder={lang === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                size="md"
                autoFocus
                onClose={() => setIsSearchExpanded(false)}
                className="shadow-xs"
              />
            </div>
          </div>
        ) : (
          /* STANDARD NAVBAR LAYOUT */
          <>
            {/* 1. Left: Brand Logo & Wordmark */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
              {activePortal === 'admin' && isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsAdminMobileMenuOpen(!isAdminMobileMenuOpen);
                    } else {
                      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center mr-1 shadow-3xs"
                  title="Menu"
                >
                  <Menu className="w-5.5 h-5.5 text-slate-800 dark:text-slate-200" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer shrink-0"
                title={lang === 'bn' ? 'হোম পেজ' : 'Home'}
              >
                {/* Brand Logo - Original header wrapper */}
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                  <img
                    src={brandSettings?.logoUrl || '/logo.png'}
                    alt={brandName}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                </div>

                {/* Brand Title - Crisp & Professional without blinking/fading animation */}
                <div className="flex items-center min-w-0">
                  {brandName.toUpperCase().startsWith('TAWZOON') ? (
                    <span className="text-lg sm:text-2xl font-black tracking-tight uppercase leading-none">
                      <span className="text-slate-900 dark:text-white">TAW</span>
                      <span className="text-[#009245]">ZOON</span>
                    </span>
                  ) : (
                    <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-[#009245] transition-colors uppercase leading-tight truncate max-w-[120px] sm:max-w-[200px]">
                      {brandName}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* 2A. DESKTOP ONLY: Direct Working Search Bar with Embedded Camera (Professional Medium Size) */}
            <div className="hidden sm:block shrink-0 w-[255px] md:w-[310px] lg:w-[365px] mx-3">
              <SearchInputWithImage
                value={publicSearch}
                onChange={setPublicSearch}
                onSearchSubmit={handleHeaderSearchSubmit}
                placeholder={lang === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                size="sm"
                className="shadow-2xs hover:shadow-xs"
              />
            </div>

            {/* 2B. MOBILE ONLY: Dedicated Search Icon for Reseller Header; Original Pill for Public Header */}
            {isEmployeeAuthenticated && activePortal !== 'admin' ? (
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                className="sm:hidden w-8 h-8 rounded-full bg-[#edf2f6] dark:bg-slate-800 hover:bg-[#e4ebf0] dark:hover:bg-slate-700 flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer shadow-2xs border border-slate-200/60 dark:border-slate-700/60 active:scale-95"
                title={lang === 'bn' ? 'সার্চ করতে চাপুন' : 'Tap to search'}
                aria-label={lang === 'bn' ? 'সার্চ' : 'Search'}
              >
                <Search className="w-4.5 h-4.5 text-slate-700 dark:text-slate-200 hover:text-[#009245] transition-colors" />
              </button>
            ) : (
              <div className="sm:hidden flex-1 min-w-0 max-w-[135px] xs:max-w-[165px] mx-1">
                <div
                  onClick={() => setIsSearchExpanded(true)}
                  className="w-full flex items-center gap-1.5 bg-[#edf2f6] dark:bg-slate-800 hover:bg-[#e4ebf0] dark:hover:bg-slate-700 rounded-full px-3 py-1.5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group border border-slate-200/40 dark:border-slate-700/50"
                  title={lang === 'bn' ? 'সার্চ করতে চাপুন' : 'Tap to search'}
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#009245] transition-colors shrink-0" />
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {publicSearch ? publicSearch : (lang === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...')}
                  </span>
                </div>
              </div>
            )}

            {/* 2C. DESKTOP HEADER NAVIGATION (PC & Desktop only - Slightly larger, professional, crisp opacity) */}
            {activePortal !== 'admin' && (
              <nav aria-label="Desktop Navigation" className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
                {/* 1. Home (হোম) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out cursor-pointer ${
                    isHomeActive
                      ? 'bg-emerald-50 text-[#009245] dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs ring-1 ring-[#009245]/20 scale-[1.02]'
                      : 'text-slate-700 hover:text-[#009245] hover:bg-emerald-50/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 active:scale-95'
                  }`}
                  title={lang === 'bn' ? 'হোম পেজ' : 'Home'}
                >
                  <Home className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isHomeActive ? 'scale-105' : ''}`} />
                  <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                </button>

                {/* 2. Dashboard (ড্যাশবোর্ড) / All Products (সকল পণ্য) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out cursor-pointer ${
                    isDashboardActive
                      ? 'bg-emerald-50 text-[#009245] dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs ring-1 ring-[#009245]/20 scale-[1.02]'
                      : 'text-slate-700 hover:text-[#009245] hover:bg-emerald-50/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 active:scale-95'
                  }`}
                  title={isReseller ? (lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard') : (lang === 'bn' ? 'সকল পণ্য' : 'All Products')}
                >
                  {isReseller ? (
                    <>
                      <LayoutDashboard className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isDashboardActive ? 'scale-105' : ''}`} />
                      <span>{lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isDashboardActive ? 'scale-105' : ''}`} />
                      <span>{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                    </>
                  )}
                </button>

                {/* 3. Orders (অর্ডার) / Favorites (আমার পছন্দ) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('orders')}
                  className={`relative flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out cursor-pointer ${
                    isOrdersActive
                      ? 'bg-emerald-50 text-[#009245] dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs ring-1 ring-[#009245]/20 scale-[1.02]'
                      : 'text-slate-700 hover:text-[#009245] hover:bg-emerald-50/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 active:scale-95'
                  }`}
                  title={isReseller ? (lang === 'bn' ? 'অর্ডারসমূহ' : 'Orders') : (lang === 'bn' ? 'পছন্দের তালিকা' : 'Favorites')}
                >
                  {isReseller ? (
                    <>
                      <Package className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isOrdersActive ? 'scale-105' : ''}`} />
                      <span>{lang === 'bn' ? 'অর্ডার' : 'Orders'}</span>
                    </>
                  ) : (
                    <>
                      <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all duration-300 ${isOrdersActive ? 'fill-[#009245] scale-105' : ''}`} />
                      <span>{lang === 'bn' ? 'পছন্দ' : 'Favorites'}</span>
                      {wishlistItems && wishlistItems.length > 0 && (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none animate-badge-pulse">
                          {wishlistItems.length}
                        </span>
                      )}
                    </>
                  )}
                </button>

                {/* 4. Cart (কার্ট) */}
                <button
                  type="button"
                  onClick={() => handleNavClick('cart')}
                  className={`relative flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ease-in-out cursor-pointer ${
                    isCartActive
                      ? 'bg-emerald-50 text-[#009245] dark:bg-emerald-950/60 dark:text-emerald-400 shadow-2xs ring-1 ring-[#009245]/20 scale-[1.02]'
                      : 'text-slate-700 hover:text-[#009245] hover:bg-emerald-50/50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 active:scale-95'
                  }`}
                  title={lang === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
                >
                  <ShoppingCart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-300 ${isCartActive ? 'scale-105' : ''}`} />
                  <span>{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
                  <span className={`min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none transition-all duration-300 ${
                    isCartActive ? 'bg-[#009245] text-white shadow-2xs scale-105' : 'bg-[#009245] text-white'
                  }`}>
                    {cartItems.length}
                  </span>
                </button>
              </nav>
            )}

            {/* 3. Right Action Group: Balance Pill + Bell + Avatar (Optimized gap & professional alignment) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Balance Button - Only visible for authenticated reseller account, hidden in Admin view */}
              {isEmployeeAuthenticated && activePortal !== 'admin' && (
                <div className="shrink-0 animate-in fade-in duration-200">
                  <BkashBalanceButton compact />
                </div>
              )}
          
              {/* Notification Bell Icon with Professional Badge Pulse Animation */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isEmployeeAuthenticated) {
                      setActivePortal('employee');
                      setResellerTab('notifications');
                    } else {
                      setActivePortal('public');
                      setPublicCategory('notifications');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-[#009245] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-110 active:scale-90 relative cursor-pointer"
                  title={lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  
                  {/* Dynamic Unread Notification Badge with Real Count (Never Fake 99+) */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#e31b23] text-white text-[9.5px] font-black flex items-center justify-center shadow-xs border-[1.5px] border-white dark:border-slate-900 leading-none animate-badge-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* 2. Profile Avatar & Beautiful Dropdown Menu with Active Online Indicator */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="relative rounded-full transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none shrink-0 p-0.5 border-2 border-[#009245] bg-white dark:bg-slate-900 shadow-2xs"
                  title={lang === 'bn' ? 'প্রোফাইল মেনু' : 'Profile Menu'}
                  aria-label="Profile Menu"
                >
                  {isEmployeeAuthenticated && employee ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {employee.avatarUrl ? (
                        <img
                          src={employee.avatarUrl}
                          alt={employee.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#009245] text-white font-black text-xs flex items-center justify-center">
                          {employee.name ? employee.name.charAt(0).toUpperCase() : 'R'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 dark:bg-slate-800 text-[#009245] flex items-center justify-center hover:bg-[#009245] hover:text-white transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  {/* Active Online Indicator (Green/Cyan-blue live ping signal) */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#009245] border-2 border-white dark:border-slate-900 shadow-xs"></span>
                  </span>
                </button>

            {/* Sleek Profile Dropdown Menu (Profile, Admin Login, Language, Logout) */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                
                {/* User Header Summary in Dropdown */}
                {isEmployeeAuthenticated && employee ? (
                  <div className="p-2.5 bg-[#f0faf3] dark:bg-slate-700/60 rounded-xl border border-[#d8f0e0] dark:border-slate-600">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-emerald-300 shrink-0 flex items-center justify-center shadow-2xs">
                        {employee.avatarUrl ? (
                          <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-[#009245]">
                            {employee.name ? employee.name.charAt(0).toUpperCase() : 'R'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {employee.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold truncate">
                          <span>{employee.phone}</span>
                          <span>•</span>
                          <span className="bg-white dark:bg-slate-800 px-1 py-0.2 rounded font-mono text-[9px] text-[#009245]">
                            {employee.referenceCode || `ID: ${employee.id.slice(-5)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'স্বাগতম গেস্ট' : 'Welcome Guest'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn' ? 'রিসেলার অ্যাকাউন্টে লগইন করুন' : 'Login to your reseller account'}
                    </p>
                  </div>
                )}

                {/* Menu Action List */}
                <div className="space-y-1">
                  
                  {/* 1. Profile / Account Details */}
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-[#009245] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#009245]" />
                      <span>{lang === 'bn' ? 'আমার প্রোফাইল ও অ্যাকাউন্ট' : 'My Profile & Details'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                   {/* 3. Language Switch */}
                   <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
                     <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                       <Globe className="w-4 h-4 text-[#009245]" />
                       <span>{lang === 'bn' ? 'ভাষা (Language)' : 'Language'}</span>
                     </span>
                     <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                       <button
                         type="button"
                         onClick={() => {
                           setLang('bn');
                           showToast('ভাষা পরিবর্তন করে বাংলা করা হয়েছে');
                         }}
                         className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                           lang === 'bn' ? 'bg-[#009245] text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                         }`}
                       >
                         বাং
                       </button>
                       <button
                         type="button"
                         onClick={() => {
                           setLang('en');
                           showToast('Language changed to English');
                         }}
                         className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                           lang === 'en' ? 'bg-[#009245] text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                         }`}
                       >
                         EN
                       </button>
                     </div>
                   </div>

                   {/* 4. Theme Switch (English label 'Theme', Moon & Sun icons) */}
                   <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
                     <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                       <Palette className="w-4 h-4 text-[#009245]" />
                       <span>Theme</span>
                     </span>
                     <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                       <button
                         type="button"
                         onClick={() => {
                           setTheme('light');
                           showToast('White theme activated');
                         }}
                         className={`p-1.5 px-2.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                           theme === 'light'
                             ? 'bg-[#009245] text-white shadow-xs'
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                         }`}
                         title="White Mode"
                         aria-label="White Mode"
                       >
                         <Sun className="w-3.5 h-3.5" />
                       </button>
                       <button
                         type="button"
                         onClick={() => {
                           setTheme('dark');
                           showToast('Dark theme activated');
                         }}
                         className={`p-1.5 px-2.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                           theme === 'dark'
                             ? 'bg-[#009245] text-white shadow-xs'
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                         }`}
                         title="Dark Mode"
                         aria-label="Dark Mode"
                       >
                         <Moon className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   </div>

                   {/* Professional App Download Button with Thin Border, Smooth Opacity Animation & Blue Install Pill */}
                   <button
                     type="button"
                     onClick={() => {
                       setProfileMenuOpen(false);
                       window.dispatchEvent(new CustomEvent('trigger_pwa_install'));
                     }}
                     className="w-full p-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 shadow-2xs hover:shadow-xs flex items-center justify-between transition-all cursor-pointer group active:scale-98 animate-pulse"
                   >
                     <span className="flex items-center gap-2">
                       <Download className="w-4 h-4 text-[#009245] group-hover:scale-110 transition-transform" />
                       <span className="font-semibold tracking-tight">{typeof window !== 'undefined' && window.innerWidth < 768 ? 'APK Download' : 'PC App Download'}</span>
                     </span>
                     <span className="text-[9px] font-bold uppercase tracking-wider bg-[#009245] hover:bg-[#007a3a] px-2 py-0.5 rounded-md text-white shadow-3xs transition-colors">
                       Install
                     </span>
                   </button>

                  
                   {/* 2. Admin Login */}
                   <button
                     type="button"
                     onClick={handleAdminLoginClick}
                     className="w-full p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-[#009245] flex items-center justify-between transition-colors cursor-pointer"
                   >
                     <span className="flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-600" />
                       <span>{lang === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login'}</span>
                     </span>
                     <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                       {lang === 'bn' ? 'ম্যানেজার' : 'Admin'}
                     </span>
                   </button>

                  {(isEmployeeAuthenticated || isAdminAuthenticated) ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="w-full p-2 rounded-xl text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1 shadow-2xs"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'রিসেলার লগইন / রেজিস্ট্রেশন' : 'Reseller Login / Register'}</span>
                    </button>
                  )}

                </div>

              </div>
            )}
          </div>
        </div>
      </>
    )}
  </div>

    </header>
  );
};
