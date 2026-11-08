import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Language,
  BrandSettings,
  Category,
  PaymentSetting,
  Product,
  Employee,
  Subsection,
} from '../types/index.js';
import { translations } from '../i18n/translations.js';
import { api, authStorage } from '../services/api.js';
import { getProductSizes } from '../utils/productSizes.js';

export type UserNavTab = 'home' | 'products' | 'sales' | 'earnings' | 'profile';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)['bn'];
  brandSettings: BrandSettings | null;
  setBrandSettings: React.Dispatch<React.SetStateAction<BrandSettings | null>>;
  categories: Category[];
  subsections: Subsection[];
  paymentSettings: PaymentSetting[];
  refreshBootstrap: () => Promise<void>;

  // Navigation / View state
  activePortal: 'public' | 'employee' | 'admin';
  setActivePortal: (portal: 'public' | 'employee' | 'admin') => void;
  userNavTab: UserNavTab;
  setUserNavTab: (tab: UserNavTab) => void;
  publicCategory: string;
  setPublicCategory: (cat: string) => void;
  publicSearch: string;
  setPublicSearch: (search: string) => void;
  selectedPublicSubcategory: string | null;
  setSelectedPublicSubcategory: (sub: string | null) => void;

  // Selected product details modal
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  // Admin Auth state
  adminToken: string | null;
  adminEmail: string | null;
  isAdminAuthenticated: boolean;
  setAdminSession: (token: string, email: string, silent?: boolean) => void;
  adminLogout: () => Promise<void>;

  // Employee Auth state
  employeeToken: string | null;
  employee: Employee | null;
  isEmployeeAuthenticated: boolean;
  setEmployeeSession: (token: string, emp: Employee, silent?: boolean) => void;
  employeeLogout: () => Promise<void>;
  refreshEmployeeProfile: () => Promise<void>;
  resellerTab: 'dashboard' | 'catalog' | 'orders' | 'cart' | 'earnings' | 'withdrawal' | 'notifications' | 'support' | 'login-history' | 'profile' | 'training' | 'video-generator' | 'campaigns' | 'referral' | 'referral-details' | 'create-website';
  setResellerTab: (tab: 'dashboard' | 'catalog' | 'orders' | 'cart' | 'earnings' | 'withdrawal' | 'notifications' | 'support' | 'login-history' | 'profile' | 'training' | 'video-generator' | 'campaigns' | 'referral' | 'referral-details' | 'create-website') => void;
  resellerCatalogView: 'public-home' | 'reseller-catalog';
  setResellerCatalogView: (view: 'public-home' | 'reseller-catalog') => void;
  resellerActiveCategory: 'all' | 'shop' | 'gadgets' | 'others';
  setResellerActiveCategory: (cat: 'all' | 'shop' | 'gadgets' | 'others' | string) => void;
  referralClientId: string | null;
  setReferralClientId: (id: string | null) => void;
  resellerPreviewProduct: Product | null;
  setResellerPreviewProduct: (product: Product | null) => void;

  // Visual Image Search state
  isVisualSearchOpen: boolean;
  setIsVisualSearchOpen: (open: boolean) => void;
  visualSearchImage: string | null;
  visualSearchResults: Array<{ product: Product; matchScore: number; reason?: string }>;
  isVisualSearching: boolean;
  visualDetectedInfo: any;
  startVisualSearch: (fileOrBase64: File | string) => Promise<void>;
  closeVisualSearch: (skipHistoryBack?: boolean) => void;

  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Admin Mobile Menu State
  isAdminMobileMenuOpen: boolean;
  setIsAdminMobileMenuOpen: (open: boolean) => void;

  // Admin Desktop Sidebar State
  isDesktopSidebarOpen: boolean;
  setIsDesktopSidebarOpen: (open: boolean) => void;

  // Promo Bar visibility
  showPromo: boolean;
  setShowPromo: (show: boolean) => void;

  // Cart state
  cartItems: Product[];
  isPublicCartOpen: boolean;
  setIsPublicCartOpen: (open: boolean) => void;
  autoOpenCheckoutModal: boolean;
  setAutoOpenCheckoutModal: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  checkoutModalItems: Array<{ product: Product; size?: string; quantity: number }>;
  setCheckoutModalItems: (items: Array<{ product: Product; size?: string; quantity: number }>) => void;
  openCheckoutModal: (items?: Array<{ product: Product; size?: string; quantity: number }>) => void;
  closeCheckoutModal: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('tawzoon_lang') as Language) || 'bn';
    } catch {
      return 'bn';
    }
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tawzoon_theme') as 'light' | 'dark' | null;
        if (saved === 'dark') return 'dark';
      } catch {}
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tawzoon_theme', newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const DEFAULT_FALLBACK_CATEGORIES: Category[] = [
    { id: 'cat-shop', name: 'SHOP — Style', slug: 'shop', description: 'পোশাক, ফ্যাশন ও লাইফস্টাইল কালেকশন', imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80', isActive: true, order: 1 },
    { id: 'cat-gadgets', name: 'GADGETS', slug: 'gadgets', description: 'স্মার্ট ইলেকট্রনিক্স ও গ্যাজেটস কালেকশন', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', isActive: true, order: 2 },
    { id: 'cat-others', name: 'OTHERS', slug: 'other', description: 'বই, গিফট ও অন্যান্য প্রয়োজনীয় কালেকশন', imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80', isActive: true, order: 3 },
  ];

  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_cached_brand');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_cached_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FALLBACK_CATEGORIES;
  });

  const [subsections, setSubsections] = useState<Subsection[]>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_cached_subsections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>(() => {
    try {
      const saved = localStorage.getItem('tawzoon_cached_payment_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const getInitialPortal = (): 'public' | 'employee' | 'admin' => {
    if (typeof window !== 'undefined') {
      try {
        const search = new URLSearchParams(window.location.search);
        const refParam = search.get('ref') || search.get('referral');
        if (refParam) {
          const cleanRef = refParam.toUpperCase().trim();
          try {
            sessionStorage.setItem('tawzoon_invite_ref', cleanRef);
          } catch {}
          try {
            localStorage.removeItem('tawzoon_invite_ref');
          } catch {}
        } else {
          try {
            localStorage.removeItem('tawzoon_invite_ref');
          } catch {}
        }
        const portalParam = search.get('portal');
        if (portalParam === 'employee' || portalParam === 'reseller') return 'employee';
        if (portalParam === 'admin') return 'admin';
        if (portalParam === 'public') return 'public';
        if (refParam) return 'employee';

        const hash = window.location.hash.toLowerCase();
        if (hash === '#admin') return 'admin';
        if (hash === '#employee' || hash === '#reseller') return 'employee';
        const saved = localStorage.getItem('tawzoon_portal');
        if (saved === 'admin' || saved === 'employee' || saved === 'public') {
          return saved;
        }
      } catch {
        // Safe ignore on restricted iframe environments
      }
    }
    return 'public';
  };

  const [activePortal, setActivePortalState] = useState<'public' | 'employee' | 'admin'>(getInitialPortal);
  const [userNavTab, setUserNavTabState] = useState<UserNavTab>('home');
  const [publicCategory, setPublicCategoryState] = useState<string>('all');
  const [publicSearch, setPublicSearch] = useState<string>('');
  const [selectedPublicSubcategory, setSelectedPublicSubcategoryState] = useState<string | null>(null);

  const isNavigatingBackRef = useRef(false);

  const setPublicCategory = useCallback((cat: string) => {
    setPublicCategoryState(prev => {
      if (prev === cat) return prev;
      if (cat !== 'all' && !isNavigatingBackRef.current) {
        try {
          sessionStorage.setItem('tawzoon_last_browsed_category', cat);
          window.history.pushState(
            { appView: 'category', cat },
            '',
            window.location.pathname + window.location.search + '#cat-' + cat
          );
        } catch {}
      }
      if (cat === 'all') {
        setSelectedPublicSubcategoryState(null);
      }
      return cat;
    });
  }, []);

  const setSelectedPublicSubcategory = useCallback((sub: string | null) => {
    setSelectedPublicSubcategoryState(prev => {
      if (prev === sub) return prev;
      if (sub && !isNavigatingBackRef.current) {
        try {
          window.history.pushState(
            { appView: 'subcategory', sub },
            '',
            window.location.pathname + window.location.search + '#sub-' + encodeURIComponent(sub)
          );
        } catch {}
      }
      return sub;
    });
  }, []);

  const [selectedProduct, setSelectedProductState] = useState<Product | null>(null);

  const setSelectedProduct = useCallback((product: Product | null) => {
    setSelectedProductState(prev => {
      if (prev === product) return prev;
      if (product && !isNavigatingBackRef.current) {
        try {
          if (typeof window !== 'undefined' && window.history.state?.appModal === 'visual-search') {
            window.history.replaceState(
              { appModal: 'product-details', id: product.id },
              '',
              window.location.pathname + window.location.search + '#product'
            );
          } else if (typeof window !== 'undefined' && window.history.state?.appModal === 'product-details' && window.history.state?.id === product.id) {
            // Already product-details in history
          } else {
            window.history.pushState(
              { appModal: 'product-details', id: product.id },
              '',
              window.location.pathname + window.location.search + '#product'
            );
          }
        } catch {}
      } else if (!product && prev && !isNavigatingBackRef.current) {
        if (typeof window !== 'undefined' && window.history.state?.appModal === 'product-details') {
          try {
            isNavigatingBackRef.current = true;
            window.history.back();
            setTimeout(() => { isNavigatingBackRef.current = false; }, 100);
          } catch {}
        }
      }
      return product;
    });
  }, []);

  const [showPromo, setShowPromoState] = useState<boolean>(true);

  const setShowPromo = (show: boolean) => {
    setShowPromoState(show);
  };

  // Helper to normalize any category slug variant into standard reseller category keys
  const normalizeCategorySlug = (slug?: string | null): 'all' | 'shop' | 'gadgets' | 'others' => {
    if (!slug) return 'all';
    const s = slug.toLowerCase().trim();
    if (s === 'all') return 'all';
    if (['shop', 'style', 'fashion', 'clothing', 'পোশাক', 'শপ'].includes(s)) return 'shop';
    if (['gadgets', 'gadget', 'gajet', 'tech', 'electronics', 'গ্যাজেট'].includes(s)) return 'gadgets';
    if (['others', 'other', 'lifestyle', 'book', 'books', 'অন্যান্য'].includes(s)) return 'others';
    return 'all';
  };

  // Employee Auth & Navigation state
  const [employeeToken, setEmployeeToken] = useState<string | null>(() => authStorage.getEmployeeToken());
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [resellerTab, setResellerTabState] = useState<'dashboard' | 'catalog' | 'orders' | 'cart' | 'earnings' | 'withdrawal' | 'notifications' | 'support' | 'login-history' | 'profile' | 'training' | 'video-generator' | 'campaigns' | 'referral' | 'referral-details' | 'create-website'>('catalog');
  const [resellerCatalogView, setResellerCatalogViewState] = useState<'public-home' | 'reseller-catalog'>('public-home');
  const [resellerActiveCategory, setResellerActiveCategoryState] = useState<'all' | 'shop' | 'gadgets' | 'others'>('shop');
  const [referralClientId, setReferralClientId] = useState<string | null>(null);
  const [resellerPreviewProduct, setResellerPreviewProductState] = useState<Product | null>(null);

  const setResellerTab = useCallback((tab: any) => {
    setResellerTabState(prev => {
      if (prev === tab) return prev;
      if (tab !== 'catalog' && !isNavigatingBackRef.current) {
        try {
          window.history.pushState(
            { appView: 'reseller-tab', tab },
            '',
            '#employee/' + tab
          );
        } catch {}
      }
      return tab;
    });
  }, []);

  const setResellerPreviewProduct = useCallback((product: Product | null) => {
    setResellerPreviewProductState(prev => {
      if (prev === product) return prev;
      if (product && !isNavigatingBackRef.current) {
        try {
          if (typeof window !== 'undefined' && window.history.state?.appModal === 'visual-search') {
            window.history.replaceState(
              { appModal: 'reseller-preview', id: product.id },
              '',
              window.location.pathname + window.location.search + '#preview'
            );
          } else if (typeof window !== 'undefined' && window.history.state?.appModal === 'reseller-preview' && window.history.state?.id === product.id) {
            // Already reseller-preview in history
          } else {
            window.history.pushState(
              { appModal: 'reseller-preview', id: product.id },
              '',
              window.location.pathname + window.location.search + '#preview'
            );
          }
        } catch {}
      } else if (!product && prev && !isNavigatingBackRef.current) {
        if (typeof window !== 'undefined' && window.history.state?.appModal === 'reseller-preview') {
          try {
            isNavigatingBackRef.current = true;
            window.history.back();
            setTimeout(() => { isNavigatingBackRef.current = false; }, 100);
          } catch {}
        }
      }
      return product;
    });
  }, []);

  const setResellerCatalogView = (view: 'public-home' | 'reseller-catalog') => {
    setResellerCatalogViewState(view);
  };

  const setResellerActiveCategory = (cat: 'all' | 'shop' | 'gadgets' | 'others' | string) => {
    setResellerActiveCategoryState(normalizeCategorySlug(cat));
  };

  const setActivePortal = (portal: 'public' | 'employee' | 'admin') => {
    setActivePortalState(portal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tawzoon_portal', portal);
      if (portal === 'admin') {
        if (window.location.hash !== '#admin') window.location.hash = '#admin';
      } else if (portal === 'employee') {
        if (!window.location.hash.startsWith('#employee')) window.location.hash = '#employee';
      } else {
        if (window.location.hash === '#admin' || window.location.hash.startsWith('#employee')) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
    if (portal === 'public') {
      setUserNavTabState((prev: UserNavTab) => (prev === 'products' ? 'products' : 'home'));
    }
  };

  // Sync hash changes with active portal & reseller navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setActivePortalState('admin');
        localStorage.setItem('tawzoon_portal', 'admin');
      } else if (hash.startsWith('#employee')) {
        setActivePortalState('employee');
        localStorage.setItem('tawzoon_portal', 'employee');

        const subRoute = hash.replace(/^#employee\/?/, '').trim();
        if (!subRoute || subRoute === 'home') {
          setResellerTabState('catalog');
        } else if (subRoute === 'dashboard') {
          setResellerTabState('dashboard');
        } else if (subRoute === 'orders') {
          setResellerTabState('orders');
        } else if (subRoute === 'cart') {
          setResellerTabState('cart');
        } else if (subRoute === 'catalog') {
          setResellerTabState('catalog');
          setResellerCatalogViewState('reseller-catalog');
          setResellerActiveCategoryState('all');
        } else if (['shop', 'style', 'fashion', 'clothing'].includes(subRoute)) {
          setResellerTabState('catalog');
          setResellerCatalogViewState('reseller-catalog');
          setResellerActiveCategoryState('shop');
        } else if (['gadgets', 'gadget', 'gajet', 'tech', 'electronics'].includes(subRoute)) {
          setResellerTabState('catalog');
          setResellerCatalogViewState('reseller-catalog');
          setResellerActiveCategoryState('gadgets');
        } else if (['others', 'other', 'lifestyle', 'book', 'books'].includes(subRoute)) {
          setResellerTabState('catalog');
          setResellerCatalogViewState('reseller-catalog');
          setResellerActiveCategoryState('others');
        } else if (['earnings', 'withdrawal', 'notifications', 'support', 'profile', 'training', 'video-generator', 'campaigns', 'referral', 'referral-details', 'create-website'].includes(subRoute)) {
          setResellerTabState(subRoute as any);
        }
      } else if (hash === '#products' || hash === '#home' || hash === '') {
        setActivePortalState('public');
        localStorage.setItem('tawzoon_portal', 'public');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const setUserNavTab = (tab: UserNavTab) => {
    setUserNavTabState(tab);
  };

  // Admin
  const [adminToken, setAdminToken] = useState<string | null>(() => authStorage.getAdminToken());
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Visual Search state
  const [isVisualSearchOpen, setIsVisualSearchOpenState] = useState(false);
  const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
  const [visualSearchResults, setVisualSearchResults] = useState<Array<{ product: Product; matchScore: number; reason?: string }>>([]);
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualDetectedInfo, setVisualDetectedInfo] = useState<any>(null);

  const setIsVisualSearchOpen = useCallback((open: boolean) => {
    setIsVisualSearchOpenState(prev => {
      if (prev === open) return prev;
      if (open && !isNavigatingBackRef.current) {
        try {
          window.history.pushState(
            { appModal: 'visual-search' },
            '',
            window.location.pathname + window.location.search + '#visual-search'
          );
        } catch {}
      } else if (!open && prev && !isNavigatingBackRef.current) {
        if (typeof window !== 'undefined' && window.history.state?.appModal === 'visual-search') {
          try {
            isNavigatingBackRef.current = true;
            window.history.back();
            setTimeout(() => { isNavigatingBackRef.current = false; }, 100);
          } catch {}
        }
      }
      return open;
    });
  }, []);

  const startVisualSearch = async (fileOrBase64: File | string) => {
    setIsVisualSearchOpen(true);
    setIsVisualSearching(true);
    setVisualSearchResults([]);
    setVisualDetectedInfo(null);

    let base64Str = '';
    let mimeType = 'image/jpeg';

    if (typeof fileOrBase64 === 'string') {
      base64Str = fileOrBase64;
      const match = fileOrBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    } else {
      mimeType = fileOrBase64.type || 'image/jpeg';
      base64Str = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    }

    setVisualSearchImage(base64Str);

    try {
      const res = await api.visualSearch(base64Str, mimeType);
      if (res && res.matchedProducts) {
        setVisualSearchResults(res.matchedProducts);
        setVisualDetectedInfo(res.detectedItem || null);
        showToast(
          lang === 'bn'
            ? `✨ ${res.matchedProducts.length}টি মিল পাওয়া পণ্য পাওয়া গেছে!`
            : `✨ Found ${res.matchedProducts.length} matching products!`
        );
      }
    } catch (err: any) {
      console.error('Visual search failed:', err);
      showToast(
        lang === 'bn' ? 'ছবি দিয়ে অনুসন্ধানে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।' : 'Visual search failed, please retry.',
        'error'
      );
    } finally {
      setIsVisualSearching(false);
    }
  };

  const closeVisualSearch = useCallback((skipHistoryBack: boolean = false) => {
    if (skipHistoryBack === true) {
      setIsVisualSearchOpenState(false);
    } else {
      setIsVisualSearchOpen(false);
    }
  }, [setIsVisualSearchOpen]);

  // Toasts with 1500ms duplicate window suppression and max 3 visible toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (!message || !message.trim()) return;

    // Normalize Bengali text using NFC to fix detached vowel signs (hrosvikaar, dirghikaar, etc.)
    const normalizedMsg = message.trim().normalize('NFC');
    const key = `${type}:${normalizedMsg}`;
    const now = Date.now();
    const lastSeen = recentToastsRef.current.get(key);

    // Suppress exact duplicate toast within 1800ms window
    if (lastSeen && now - lastSeen < 1800) {
      return;
    }
    recentToastsRef.current.set(key, now);

    // Evict old entries from deduplication map periodically
    if (recentToastsRef.current.size > 25) {
      for (const [k, timestamp] of recentToastsRef.current.entries()) {
        if (now - timestamp > 8000) recentToastsRef.current.delete(k);
      }
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => {
      // Keep maximum 3 toasts visible at once to avoid covering the UI
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...trimmed, { id, type, message: normalizedMsg }];
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('tawzoon_lang', newLang);
  };

  const refreshBootstrap = async () => {
    try {
      const data = await api.getBootstrap();
      setBrandSettings(data.brandSettings);
      setCategories(data.categories);
      if (data.subsections) {
        setSubsections(data.subsections);
      }
      setPaymentSettings(data.paymentSettings);
      try {
        if (data.brandSettings) localStorage.setItem('tawzoon_cached_brand', JSON.stringify(data.brandSettings));
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          localStorage.setItem('tawzoon_cached_categories', JSON.stringify(data.categories));
        }
        if (Array.isArray(data.subsections)) {
          localStorage.setItem('tawzoon_cached_subsections', JSON.stringify(data.subsections));
        }
        if (Array.isArray(data.paymentSettings)) {
          localStorage.setItem('tawzoon_cached_payment_settings', JSON.stringify(data.paymentSettings));
        }
      } catch {}
    } catch (err: any) {
      if (err.message && (err.message.includes('Rate exceeded') || err.message.includes('Unexpected token') || err.message.includes('JSON'))) {
        console.warn('Failed to load bootstrap data due to rate limits. Loading robust offline fallback state.');
      } else {
        console.error('Failed to load bootstrap data:', err);
      }
      setBrandSettings({
        appName: "TAWZOON",
        logoUrl: "",
        faviconUrl: "",
        brandDescriptionBn: "প্রিমিয়াম প্রোডাক্ট মার্কেটিং ও অনুমোদিত রিসেলার নেটওয়ার্ক প্ল্যাটফর্ম। সাশ্রয়ী ও মানসম্পন্ন পণ্য সবার দোড়গোড়ায়।",
        brandDescriptionEn: "Premium dynamic product marketing & authorized reseller distribution network.",
        heroHeadlineBn: "আধুনিক জীবনের প্রিমিয়াম পণ্য ও স্মার্ট মার্কেটিং",
        heroHeadlineEn: "Curated Premium Products & Empowered Commerce",
        heroSubheadBn: "ফ্যাশন, অত্যাধুনিক গ্যাজেট ও লাইফস্টাইল পণ্য সংগ্রহ করুন সহজে।",
        heroSubheadEn: "Explore refined collections across fashion.",
        heroBannerImage: "/images/hero_tawzoon_nexus_1790244695106.jpg",
        promoBannerActive: true,
        promoBannerTextBn: "বিশেষ অফার: নতুন সিজনের ট্রেন্ডিং গ্যাজেট ও ফ্যাশন কালেকশনে আকর্ষণীয় রিওয়ার্ড!",
        promoBannerTextEn: "Exclusive: Explore new trending gadgets and seasonal fashion!",
        promoBannerLink: "#shop",
        resellerBannerBadgeBn: "সহজ উপায়ে শিখুন",
        resellerBannerBadgeEn: "Learn Easily",
        resellerBannerTitleBn: "নতুন রিসেলার?",
        resellerBannerTitleEn: "New Reseller?",
        resellerBannerSubtitleBn: "অ্যাপ ব্যবহার শিখুন সহজ ভিডিও টিউটোরিয়ালে",
        resellerBannerSubtitleEn: "Learn app usage with easy video tutorials",
        resellerBannerButtonBn: "কোর্সসমূহ দেখুন",
        resellerBannerButtonEn: "View Courses",
        resellerBannerFeaturesBn: ["অর্ডার করুন", "কমিশন অর্জন", "বিক্রি বাড়ান", "ধাপে ধাপে গাইডলাইন"],
        resellerBannerFeaturesEn: ["Place Order", "Earn Commission", "Increase Sales", "Step-by-Step Guide"],
        isWebsiteOnline: true,
        websiteMaintenanceNoticeBn: "ওয়েবসাইটটি সাময়িকভাবে মেইনটেন্যান্স বা আপডেট কাজের জন্য স্থগিত আছে। খুব শীঘ্রই আমরা পুনরায় সরাসরি সার্ভারে লাইভ হবো।",
        websiteMaintenanceNoticeEn: "The website is currently under scheduled maintenance. We will be back online shortly.",
        publicAiPrompt: "আপনি Tawzoon Nexus-এর স্মার্ট কাস্টমার সাপোর্ট এআই অ্যাসিস্ট্যান্ট। কাস্টমারদের প্রোডাক্ট তথ্য, অর্ডার ও হেল্পলাইন নাম্বার শেয়ার করুন।",
        resellerAiPrompt: "আপনি রিসেলার অ্যাসিস্ট্যান্ট এআই। রিসেলারদের সেলস বাড়াতে, মার্কেটিং পোস্টের ক্যাচ-লাইন তৈরি করতে এবং কাস্টমার কনভিন্স করার গাইড দিন।",
        videoAiLimitType: "daily_limit",
        videoAiDailyLimit: 10,
        videoAiPricePerMonth: 490,
        campaignAiEnabled: true,
        resellerNotificationNotice: "🎉 সকল রিসেলারদের অবগতির জন্য জানানো যাচ্ছে যে, সকল নিয়মিত অর্ডারে বোনাস কমিশন অফার চলমান রয়েছে!",
      });
      if (!localStorage.getItem('tawzoon_cached_brand')) {
        showToast(
          lang === 'bn' 
            ? 'সার্ভার লোড হতে অতিরিক্ত সময় নিচ্ছে। অফলাইন মোডে ব্যাকআপ ডাটা লোড করা হয়েছে।' 
            : 'Server is taking too long to respond. Fallback data loaded.',
          'info'
        );
      }
    }
  };

  // Initial bootstrap
  useEffect(() => {
    refreshBootstrap();
  }, []);

  // Synchronize app name and logo with document title and favicon
  useEffect(() => {
    if (brandSettings) {
      if (brandSettings.appName) {
        document.title = brandSettings.appName;
      }
      if (brandSettings.logoUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = brandSettings.logoUrl;
      }
    }
  }, [brandSettings]);

  // Validate admin token on mount
  useEffect(() => {
    if (adminToken) {
      api.adminGetMe(adminToken)
        .then(res => {
          setAdminEmail(res.email);
        })
        .catch(() => {
          authStorage.clearAdminToken();
          setAdminToken(null);
          setAdminEmail(null);
        });
    }
  }, [adminToken]);

  // Validate employee token on mount
  useEffect(() => {
    if (employeeToken) {
      api.employeeGetMe(employeeToken)
        .then(emp => {
          setEmployee(emp);
        })
        .catch(() => {
          authStorage.clearEmployeeToken();
          setEmployeeToken(null);
          setEmployee(null);
        });
    }
  }, [employeeToken]);

  // Check for completion of 'Add Product' flow
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('isAddingToOrderModeComplete') === 'true') {
      localStorage.removeItem('isAddingToOrderModeComplete');
      openCheckoutModal();
    }
  }, [cartItems]);

  const setAdminSession = (token: string, email: string, silent: boolean = false) => {
    authStorage.setAdminToken(token);
    setAdminToken(token);
    setAdminEmail(email);
    if (!silent) {
      showToast(lang === 'bn' ? 'অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে।' : 'Admin session authenticated successfully.');
    }
  };

  const adminLogout = async () => {
    if (adminToken) {
      try {
        await api.adminLogout(adminToken);
      } catch (err) {
        // Continue logout anyway
      }
    }
    authStorage.clearAdminToken();
    setAdminToken(null);
    setAdminEmail(null);
    setActivePortal('public');
    showToast(lang === 'bn' ? 'অ্যাডমিন সেশন সমাপ্ত হয়েছে।' : 'Admin logged out.');
  };

  const setEmployeeSession = (token: string, emp: Employee, silent: boolean = false) => {
    authStorage.setEmployeeToken(token);
    setEmployeeToken(token);
    setEmployee(emp);
    if (!silent) {
      showToast(lang === 'bn' ? 'মার্কেটার হিসেবে সফলভাবে লগইন হয়েছে।' : 'Logged in as marketer successfully.');
    }
  };

  const employeeLogout = async () => {
    if (employeeToken) {
      try {
        await api.employeeLogout(employeeToken);
      } catch (err) {
        // Continue logout anyway
      }
    }
    authStorage.clearEmployeeToken();
    setEmployeeToken(null);
    setEmployee(null);
    setActivePortal('public');
    showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে।' : 'Marketer signed out.');
  };

  const refreshEmployeeProfile = async () => {
    if (employeeToken) {
      try {
        const emp = await api.employeeGetMe(employeeToken);
        setEmployee(emp);
      } catch (err: any) {
        if (err?.message?.includes('401') || err?.message?.includes('403') || err?.message?.includes('Forbidden') || err?.message?.includes('Unauthorized') || err?.message?.includes('Session expired')) {
          authStorage.clearEmployeeToken();
          setEmployeeToken(null);
          setEmployee(null);
        } else {
          console.warn('Failed to refresh employee profile:', err?.message || err);
        }
      }
    }
  };


  const [isPublicCartOpen, setIsPublicCartOpenState] = useState(false);
  const [autoOpenCheckoutModal, setAutoOpenCheckoutModal] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpenState] = useState(false);
  const [checkoutModalItems, setCheckoutModalItems] = useState<Array<{ product: Product; size?: string; quantity: number }>>([]);

  const setIsPublicCartOpen = useCallback((open: boolean) => {
    setIsPublicCartOpenState(prev => {
      if (prev === open) return prev;
      if (open && !isNavigatingBackRef.current) {
        try {
          window.history.pushState(
            { appModal: 'cart' },
            '',
            window.location.pathname + window.location.search + '#cart'
          );
        } catch {}
      } else if (!open && prev && !isNavigatingBackRef.current) {
        if (typeof window !== 'undefined' && window.history.state?.appModal === 'cart') {
          try {
            isNavigatingBackRef.current = true;
            window.history.back();
            setTimeout(() => { isNavigatingBackRef.current = false; }, 100);
          } catch {}
        }
      }
      return open;
    });
  }, []);

  const setIsCheckoutModalOpen = useCallback((open: boolean) => {
    setIsCheckoutModalOpenState(prev => {
      if (prev === open) return prev;
      if (open && !isNavigatingBackRef.current) {
        try {
          window.history.pushState(
            { appModal: 'checkout' },
            '',
            window.location.pathname + window.location.search + '#checkout'
          );
        } catch {}
      } else if (!open && prev && !isNavigatingBackRef.current) {
        if (typeof window !== 'undefined' && window.history.state?.appModal === 'checkout') {
          try {
            isNavigatingBackRef.current = true;
            window.history.back();
            setTimeout(() => { isNavigatingBackRef.current = false; }, 100);
          } catch {}
        }
      }
      return open;
    });
  }, []);

  // MASTER POPSTATE LISTENER: Listens to browser back/forward buttons (Chrome, Safari, Mobile Chrome)
  useEffect(() => {
    const handlePopState = () => {
      isNavigatingBackRef.current = true;

      // Reverse Priority Popping for active modals & views:
      const isAddingToOrder = typeof window !== 'undefined' && (
        sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true' ||
        sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true'
      );

      if (selectedProduct) {
        setSelectedProductState(null);
      } else if (resellerPreviewProduct) {
        setResellerPreviewProductState(null);
      } else if (isCheckoutModalOpen) {
        setIsCheckoutModalOpenState(false);
      } else if (isPublicCartOpen) {
        setIsPublicCartOpenState(false);
      } else if (isVisualSearchOpen) {
        setIsVisualSearchOpenState(false);
      } else if (isAdminMobileMenuOpen) {
        setIsAdminMobileMenuOpen(false);
      } else if (selectedPublicSubcategory) {
        setSelectedPublicSubcategoryState(null);
      } else if (publicCategory !== 'all') {
        if (!isAddingToOrder) {
          setPublicCategoryState('all');
        }
      } else if (resellerTab !== 'catalog') {
        setResellerTabState('catalog');
        if (!isAddingToOrder) {
          setResellerCatalogViewState('public-home');
        }
      } else if (activePortal !== 'public') {
        if (!isAddingToOrder) {
          setActivePortalState('public');
        }
      }

      setTimeout(() => {
        isNavigatingBackRef.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    selectedProduct,
    resellerPreviewProduct,
    isCheckoutModalOpen,
    isPublicCartOpen,
    isVisualSearchOpen,
    isAdminMobileMenuOpen,
    selectedPublicSubcategory,
    publicCategory,
    resellerTab,
    activePortal,
  ]);

  const openCheckoutModal = (items?: Array<{ product: Product; size?: string; quantity: number }>) => {
    if (items && items.length > 0) {
      setCheckoutModalItems(items);
    } else if (cartItems.length > 0) {
      setCheckoutModalItems(
        cartItems.map(item => {
          const szs = getProductSizes(item);
          return {
            product: item,
            size: item.sizes?.[0] || (szs.length > 0 ? szs[0] : 'স্ট্যান্ডার্ড'),
            quantity: item.quantity || 1,
          };
        })
      );
    } else if (selectedProduct) {
      const szs = getProductSizes(selectedProduct);
      setCheckoutModalItems([
        {
          product: selectedProduct,
          size: selectedProduct.sizes?.[0] || (szs.length > 0 ? szs[0] : 'স্ট্যান্ডার্ড'),
          quantity: 1,
        },
      ]);
    }
    setIsPublicCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
  };

  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem('tawzoon_wishlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const sanitizeWishlistForStorage = (items: Product[]) => {
    return items.slice(0, 50).map(p => {
      let primaryUrl = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || p.imageUrl || '';
      if (typeof primaryUrl === 'string' && primaryUrl.startsWith('data:') && primaryUrl.length > 5000) {
        primaryUrl = '';
      }
      return {
        id: p.id,
        originalProductId: p.originalProductId,
        productCode: p.productCode,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        sellingPrice: p.sellingPrice,
        regularPrice: p.regularPrice,
        categorySlug: p.categorySlug,
        subcategoryBn: p.subcategoryBn,
        subcategoryEn: p.subcategoryEn,
        imageUrl: primaryUrl,
        images: primaryUrl ? [{ id: '1', url: primaryUrl, isPrimary: true, order: 0 }] : [],
        starRating: p.starRating,
        sizes: Array.isArray(p.sizes) ? p.sizes.slice(0, 5) : [],
        commissionType: p.commissionType || 'percentage',
        commissionRate: p.commissionRate || 0,
        shortDescBn: '',
        shortDescEn: '',
        fullDescBn: '',
        fullDescEn: '',
      } as Product;
    });
  };

  const safeSaveWishlist = (items: Product[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      const sanitized = sanitizeWishlistForStorage(items);
      localStorage.setItem('tawzoon_wishlist', JSON.stringify(sanitized));
    } catch (err: any) {
      console.warn('[Storage] Quota issue while saving wishlist. Purging old cache...', err);
      try {
        localStorage.removeItem('tawzoon_cached_products');
        localStorage.removeItem('tawzoon_cached_subsections');
        localStorage.removeItem('tawzoon_cached_categories');
        localStorage.removeItem('tawzoon_search_history');
        const minimal = items.slice(0, 25).map(p => ({
          id: p.id,
          productCode: p.productCode,
          nameBn: p.nameBn,
          sellingPrice: p.sellingPrice,
          regularPrice: p.regularPrice,
          categorySlug: p.categorySlug,
          subcategoryBn: p.subcategoryBn,
          imageUrl: p.imageUrl || p.images?.[0]?.url || '',
        }));
        localStorage.setItem('tawzoon_wishlist', JSON.stringify(minimal));
      } catch (innerErr) {
        console.warn('[Storage] Could not persist wishlist to localStorage. Retaining in memory only.', innerErr);
      }
    }
  };

  const toggleWishlist = (product: Product) => {
    const exists = wishlistItems.some(p => p.id === product.id);
    let updated: Product[];
    if (exists) {
      updated = wishlistItems.filter(p => p.id !== product.id);
      showToast(lang === 'bn' ? 'পছন্দের তালিকা থেকে সরানো হয়েছে।' : 'Removed from favorites.');
    } else {
      updated = [...wishlistItems, product];
      showToast(lang === 'bn' ? 'পছন্দের তালিকায় যুক্ত করা হয়েছে।' : 'Added to favorites.');
    }
    setWishlistItems(updated);
    safeSaveWishlist(updated);
  };

  const addToCart = (product: Product) => {
    const size = product.sizes?.[0] || 'স্ট্যান্ডার্ড';
    const entryId = `${product.originalProductId || product.id}_${size}`;
    const productWithEntryId: Product = {
      ...product,
      id: entryId,
      originalProductId: product.originalProductId || product.id,
    };

    setCartItems(prev => {
      const existingIdx = prev.findIndex(p => p.id === entryId);
      if (existingIdx > -1) {
        const updated = [...prev];
        const prevQty = updated[existingIdx].quantity || 1;
        const addQty = product.quantity || 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...productWithEntryId,
          quantity: prevQty + addQty,
        };
        return updated;
      }
      return [...prev, productWithEntryId];
    });

    if (typeof localStorage !== 'undefined' && localStorage.getItem('isAddingToOrderMode') === 'true') {
      localStorage.removeItem('isAddingToOrderMode');
      localStorage.setItem('isAddingToOrderModeComplete', 'true');
    }

    showToast(lang === 'bn' ? `✓ '${product.nameBn}' (${size}) কার্টে যোগ হয়েছে!` : `✓ Added '${product.nameBn}' (${size}) to Cart!`);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(p => p.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const t = translations[lang];

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        brandSettings,
        setBrandSettings,
        categories,
        subsections,
        paymentSettings,
        refreshBootstrap,
        activePortal,
        setActivePortal,
        userNavTab,
        setUserNavTab,
        publicCategory,
        setPublicCategory,
        publicSearch,
        setPublicSearch,
        selectedPublicSubcategory,
        setSelectedPublicSubcategory,
        selectedProduct,
        setSelectedProduct,
        adminToken,
        adminEmail,
        isAdminAuthenticated: Boolean(adminToken && adminEmail),
        setAdminSession,
        adminLogout,
        employeeToken,
        employee,
        isEmployeeAuthenticated: Boolean(employeeToken && employee && employee.status === 'APPROVED'),
        setEmployeeSession,
        employeeLogout,
        refreshEmployeeProfile,
        resellerTab,
        setResellerTab,
        resellerCatalogView,
        setResellerCatalogView,
        resellerActiveCategory,
        setResellerActiveCategory,
        referralClientId,
        setReferralClientId,
        resellerPreviewProduct,
        setResellerPreviewProduct,
        isVisualSearchOpen,
        setIsVisualSearchOpen,
        visualSearchImage,
        visualSearchResults,
        isVisualSearching,
        visualDetectedInfo,
        startVisualSearch,
        closeVisualSearch,
        theme,
        setTheme,
        toggleTheme,
        isAdminMobileMenuOpen,
        setIsAdminMobileMenuOpen,
        isDesktopSidebarOpen,
        setIsDesktopSidebarOpen,
        showPromo,
        setShowPromo,
        cartItems,
        isPublicCartOpen,
        setIsPublicCartOpen,
        autoOpenCheckoutModal,
        setAutoOpenCheckoutModal,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        checkoutModalItems,
        setCheckoutModalItems,
        openCheckoutModal,
        closeCheckoutModal,
        addToCart,
        removeFromCart,
        clearCart,
        wishlistItems,
        toggleWishlist,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
