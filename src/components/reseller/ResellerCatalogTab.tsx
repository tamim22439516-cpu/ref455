import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  ShoppingBag,
  Download,
  Copy,
  Check,
  Tag,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Layers,
  X,
  FolderOpen,
  Grid,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Shirt,
  Smartphone,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';
import { HeroSection } from '../HeroSection.js';
import { ScrollReveal } from '../common/ScrollReveal.js';
import { ResellerProductPreviewModal } from './ResellerProductPreviewModal.js';
import { isCategoryMatch, getBilingualSearchTerms, normalizeBengali, toCompactKey, findBestMatchingSubsection, extractProductFromInput } from '../ShopCategoryPage.js';
import { getAdjustedSellingPrice, getAdjustedRegularPrice, getResellerProfitPerUnit, getResellerWholesalePrice } from '../../utils/pricing.js';

interface ResellerCatalogTabProps {
  productsList: Product[];
  onTakeForSelling: (product: Product) => void;
}

export const ResellerCatalogTab: React.FC<ResellerCatalogTabProps> = ({
  productsList,
  onTakeForSelling,
}) => {
  const { lang, employee, brandSettings, subsections, categories, wishlistItems, toggleWishlist, showToast, publicSearch, resellerPreviewProduct, setResellerPreviewProduct, resellerCatalogView } = useApp();

  // Navigation View: 'public-home' (Public Home Page) | 'reseller-catalog' (Reseller Catalog Panel)
  const [currentView, setCurrentView] = useState<'public-home' | 'reseller-catalog'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true') {
      return 'reseller-catalog';
    }
    return resellerCatalogView || 'public-home';
  });

  useEffect(() => {
    if (resellerCatalogView) {
      setCurrentView(resellerCatalogView);
    }
  }, [resellerCatalogView]);

  // Active Category: 'all' | 'shop' | 'gadgets' | 'others'
  const [activeCategory, setActiveCategory] = useState<'all' | 'shop' | 'gadgets' | 'others'>('shop');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Side Catalog Drawer on Mobile (Auto-closes on selection)
  const [isSideCatalogOpen, setIsSideCatalogOpen] = useState(false);

  // Dedicated Product Preview Modal State
  const [downloadingProductId, setDownloadingProductId] = useState<string | null>(null);
  const savedScrollY = React.useRef(0);
  const [lastInteractedProductId, setLastInteractedProductId] = useState<string | null>(null);

  // Sync publicSearch from Header/Global search with Reseller Catalog
  useEffect(() => {
    if (publicSearch && publicSearch.trim()) {
      const q = publicSearch.trim();
      setSearchQuery(q);
      setCurrentView('reseller-catalog');

      const res = extractProductFromInput(q, productsList || []);
      if (res.matchedProduct) {
        setResellerPreviewProduct(res.matchedProduct);
        return;
      }
      if (res.isInvalidUrl || res.isInvalidCode) {
        showToast(
          lang === 'bn'
            ? 'ভুল বা অকার্যকর প্রোডাক্ট লিংক বা কোড! কোনো পণ্য পাওয়া যায়নি।'
            : 'Invalid product link or code! No product found.',
          'error'
        );
        setResellerPreviewProduct(null);
        return;
      }

      setResellerPreviewProduct(null);
      const matched = findBestMatchingSubsection(q, subsections || []);
      if (matched) {
        setSelectedSubCategory(matched.name);
      } else {
        let foundSubName: string | null = null;
        const qComp = toCompactKey(q);
        const prodMatch = (productsList || []).find(p => {
          const pSubBn = toCompactKey(p.subcategoryBn);
          const pSubEn = toCompactKey(p.subcategoryEn);
          return (pSubBn && (pSubBn === qComp || (qComp.length >= 4 && pSubBn.includes(qComp)))) ||
                 (pSubEn && (pSubEn === qComp || (qComp.length >= 4 && pSubEn.includes(qComp))));
        });
        if (prodMatch && prodMatch.subcategoryBn) {
          foundSubName = prodMatch.subcategoryBn;
        }
        setSelectedSubCategory(foundSubName);
      }
    } else if (publicSearch === '') {
      setSearchQuery('');
      setSelectedSubCategory(null);
      setResellerPreviewProduct(null);
    }
  }, [publicSearch, subsections, productsList, lang]);

  // Listen to tawzoon_search_submit for Reseller
  useEffect(() => {
    const handleSearchSubmit = (e: Event) => {
      const customEvent = e as CustomEvent;
      const query = customEvent.detail?.query || publicSearch;
      if (query && query.trim()) {
        const res = extractProductFromInput(query, productsList || []);
        if (res.matchedProduct) {
          setResellerPreviewProduct(res.matchedProduct);
          setCurrentView('reseller-catalog');
        } else if (res.isInvalidUrl || res.isInvalidCode) {
          showToast(
            lang === 'bn'
              ? 'ভুল বা অকার্যকর প্রোডাক্ট লিংক বা কোড! কোনো পণ্য পাওয়া যায়নি।'
              : 'Invalid product link or code! No product found.',
            'error'
          );
          setResellerPreviewProduct(null);
        }
      }
    };
    window.addEventListener('tawzoon_search_submit', handleSearchSubmit as EventListener);
    return () => window.removeEventListener('tawzoon_search_submit', handleSearchSubmit as EventListener);
  }, [productsList, lang, publicSearch]);

  // Listen to tawzoon_open_reseller_catalog to switch directly to Reseller Catalog View
  useEffect(() => {
    const handleOpenCatalog = (e: Event) => {
      const customEvent = e as CustomEvent;
      const cat = customEvent.detail?.category || 'all';
      setActiveCategory(cat as any);
      setSelectedSubCategory(null);
      setCurrentView('reseller-catalog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleModeChange = () => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true') {
        setCurrentView('reseller-catalog');
      }
    };

    window.addEventListener('tawzoon_open_reseller_catalog', handleOpenCatalog as EventListener);
    window.addEventListener('tawzoon_reseller_order_mode_changed', handleModeChange);
    return () => {
      window.removeEventListener('tawzoon_open_reseller_catalog', handleOpenCatalog as EventListener);
      window.removeEventListener('tawzoon_reseller_order_mode_changed', handleModeChange);
    };
  }, []);

  // Reset to Public Home view whenever bottom nav 'হোম' is clicked (unless in adding-to-order mode)
  useEffect(() => {
    const handleNavHome = () => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true') {
        setCurrentView('reseller-catalog');
        return;
      }
      setCurrentView('public-home');
      setSelectedSubCategory(null);
    };
    window.addEventListener('tawzoon_nav_home', handleNavHome);
    return () => window.removeEventListener('tawzoon_nav_home', handleNavHome);
  }, []);

  // Close modal and restore scroll position precisely to the product card
  const handleCloseModal = () => {
    const prodId = lastInteractedProductId;
    const scrollPos = savedScrollY.current;
    setResellerPreviewProduct(null);

    const restorePosition = () => {
      if (prodId) {
        const el = document.getElementById(`reseller-product-${prodId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
    };

    requestAnimationFrame(restorePosition);
    setTimeout(restorePosition, 40);
  };

  // Download all images for a product on catalog card
  const handleDownloadAllProductImages = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const images = product.images && product.images.length > 0
      ? product.images.filter(img => img.url && !img.url.endsWith('.mp4')).map(img => img.url)
      : [product.imageUrl || '/images/product_shop_dress_1790244714775.jpg'];

    setDownloadingProductId(product.id);
    showToast(
      lang === 'bn'
        ? `সবগুলো (${images.length}টি) ছবি এক এক করে ডাউনলোড হচ্ছে...`
        : `Downloading all ${images.length} images...`
    );

    for (let i = 0; i < images.length; i++) {
      try {
        const imgUrl = images[i];
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const safeName = (product.nameBn || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
        link.download = `${product.productCode || 'TNX'}_${safeName}_photo_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise(r => setTimeout(r, 450));
      } catch {
        const link = document.createElement('a');
        link.href = images[i];
        link.target = '_blank';
        link.download = `${product.productCode || 'TNX'}_${i + 1}.jpg`;
        link.click();
      }
    }

    setDownloadingProductId(null);
    showToast(
      lang === 'bn' ? 'সবগুলো ছবি সফলভাবে ডাউনলোড হয়েছে✓' : 'All images downloaded successfully✓'
    );
  };

  // Helper to calculate reseller commission for a product
  const getCommissionAmount = (product: Product): number => {
    if (!employee) return 0;
    if (employee.customCommissionRate && employee.customCommissionRate > 0) {
      return Math.round((product.sellingPrice * employee.customCommissionRate) / 100);
    }
    if (product.commissionType === 'percentage') {
      return Math.round((product.sellingPrice * (product.commissionRate || 10)) / 100);
    }
    return product.commissionRate || Math.round(product.sellingPrice * 0.1);
  };

  // Helper to count products matching subcategory
  const getSubCatCount = (subcatBn: string, catSlug: string) => {
    const activeList = (productsList || []).filter(p => p.isActive !== false && !p.isArchived);
    return activeList.filter((p) => {
      if (catSlug && catSlug !== 'all' && !isCategoryMatch(p.categorySlug, catSlug)) {
        return false;
      }
      const sBn = subcatBn.toLowerCase().trim();
      const pSubBn = (p.subcategoryBn || '').toLowerCase().trim();
      const pSubEn = (p.subcategoryEn || '').toLowerCase().trim();
      const pNameBn = (p.nameBn || '').toLowerCase();
      const pNameEn = (p.nameEn || '').toLowerCase();

      return (
        (pSubBn && (pSubBn.includes(sBn) || sBn.includes(pSubBn))) ||
        (pSubEn && (pSubEn.includes(sBn) || sBn.includes(pSubEn))) ||
        pNameBn.includes(sBn) ||
        pNameEn.includes(sBn)
      );
    }).length;
  };

  // Category Configuration for Subcategory Groups (2 per row in reseller panel)
  const currentCategoryConfig = useMemo(() => {
    const currentSlug = activeCategory;
    const activeSubs = (subsections || []).filter(
      s => s.isActive !== false && (currentSlug === 'all' || isCategoryMatch(s.parentSlug, currentSlug))
    );

    // Parent groups (e.g. ছেলেদের কালেকশন)
    const parentGroups = activeSubs.filter(s => !s.parentSub);

    let groups: Array<{
      id: string;
      titleBn: string;
      titleEn: string;
      subtitleBn: string;
      subtitleEn: string;
      bgColor: string;
      borderColor: string;
      accentColor: string;
      items: Array<{
        id: string;
        nameBn: string;
        nameEn: string;
        count: number;
        image: string;
      }>;
    }> = [];

    if (parentGroups.length > 0) {
      groups = parentGroups
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(pg => {
          const childItems = activeSubs
            .filter(s => s.parentSub && s.parentSub.trim() === pg.name.trim())
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const itemsToUse = childItems.length > 0 ? childItems : [pg];

          return {
            id: pg.id,
            titleBn: pg.name,
            titleEn: pg.name,
            subtitleBn: pg.description || '',
            subtitleEn: pg.description || '',
            bgColor: 'bg-[#f0faf3]',
            borderColor: 'border-[#d8f0e0]',
            accentColor: '#009245',
            items: itemsToUse.map(item => ({
              id: item.id,
              nameBn: item.name,
              nameEn: item.name,
              count: getSubCatCount(item.name, currentSlug),
              image:
                item.imageUrl ||
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
            })),
          };
        });
    }

    // Fallback if no groups configured
    if (groups.length === 0) {
      const activeProducts = (productsList || []).filter(
        p => p.isActive !== false && !p.isArchived && (currentSlug === 'all' || isCategoryMatch(p.categorySlug, currentSlug))
      );
      const uniqueSubs = Array.from(new Set(activeProducts.map(p => p.subcategoryBn).filter(Boolean)));
      groups = [
        {
          id: 'default-group',
          titleBn: isCategoryMatch(currentSlug, 'shop') ? 'পোশাক কালেকশন' : isCategoryMatch(currentSlug, 'gadgets') ? 'গ্যাজেট কালেকশন' : 'প্রোডাক্ট কালেকশন',
          titleEn: currentSlug.toUpperCase(),
          subtitleBn: 'সকল মানসম্মত পণ্য এক নজরে',
          subtitleEn: 'Browse all items',
          bgColor: 'bg-[#f0faf3]',
          borderColor: 'border-[#d8f0e0]',
          accentColor: '#009245',
          items: uniqueSubs.map((sub, idx) => ({
            id: `sub-${idx}`,
            nameBn: sub,
            nameEn: sub,
            count: getSubCatCount(sub, currentSlug),
            image:
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
          })),
        },
      ];
    }

    return {
      title: currentSlug.toUpperCase(),
      titleBn:
        isCategoryMatch(currentSlug, 'shop')
          ? 'পোশাক ও ফ্যাশন'
          : isCategoryMatch(currentSlug, 'gadgets')
          ? 'গ্যাজেটস ও টেকনোলজি'
          : isCategoryMatch(currentSlug, 'others')
          ? 'অন্যান্য ও লাইফস্টাইল'
          : 'সকল পণ্য',
      groups,
    };
  }, [activeCategory, subsections, productsList]);

  // All available categories for side drawer
  const allDrawerSections = useMemo(() => {
    const list = [
      { key: 'all' as const, labelBn: 'সব পণ্য', labelEn: 'All Products', count: (productsList || []).filter(p => p.isActive !== false && !p.isArchived).length },
      { key: 'shop' as const, labelBn: 'পোশাক ও ফ্যাশন (শপ)', labelEn: 'Clothing & Fashion', count: (productsList || []).filter(p => p.isActive !== false && !p.isArchived && isCategoryMatch(p.categorySlug, 'shop')).length },
      { key: 'gadgets' as const, labelBn: 'গ্যাজেটস ও টেকনোলজি', labelEn: 'Gadgets & Tech', count: (productsList || []).filter(p => p.isActive !== false && !p.isArchived && isCategoryMatch(p.categorySlug, 'gadgets')).length },
      { key: 'others' as const, labelBn: 'অন্যান্য নিত্যপ্রয়োজনীয়', labelEn: 'Others & Lifestyle', count: (productsList || []).filter(p => p.isActive !== false && !p.isArchived && isCategoryMatch(p.categorySlug, 'others')).length },
    ];
    return list;
  }, [productsList]);

  // Filtered Products for Catalog view
  const displayProducts = useMemo(() => {
    let list = (productsList || []).filter(
      p => p.isActive !== false && !p.isArchived
    );

    if (selectedSubCategory) {
      const sComp = toCompactKey(selectedSubCategory);
      list = list.filter(p => {
        const pSubBn = toCompactKey(p.subcategoryBn);
        const pSubEn = toCompactKey(p.subcategoryEn);
        const pNameBn = toCompactKey(p.nameBn);
        const pNameEn = toCompactKey(p.nameEn);
        return (
          (pSubBn && (pSubBn === sComp || pSubBn.includes(sComp) || sComp.includes(pSubBn))) ||
          (pSubEn && (pSubEn === sComp || pSubEn.includes(sComp) || sComp.includes(pSubEn))) ||
          pNameBn.includes(sComp) ||
          pNameEn.includes(sComp)
        );
      });
    } else if (activeCategory !== 'all') {
      list = list.filter(p => isCategoryMatch(p.categorySlug, activeCategory));
    }

    if (searchQuery.trim()) {
      const res = extractProductFromInput(searchQuery, list);
      if (res.matchedProduct) {
        list = [res.matchedProduct];
      } else if (res.isInvalidUrl || res.isInvalidCode) {
        list = [];
      } else {
        const termsArray = getBilingualSearchTerms(searchQuery);

        const isClothingSearch = ['shop', 'clothing', 'fashion', 'style', 'পোশাক', 'ফ্যাশন', 'শপ', 'ছেলেদের পোশাক', 'মেয়েদের পোশাক', 'কাপড়'].some(term => termsArray.some(t => t.includes(term) || term.includes(t)));
        const isGadgetSearch = ['gadget', 'gadgets', 'tech', 'electronics', 'গ্যাজেট', 'ইলেকট্রনিক্স', 'টেকনোলজি', 'স্মার্ট'].some(term => termsArray.some(t => t.includes(term) || term.includes(t)));
        const isOtherSearch = ['other', 'others', 'lifestyle', 'অন্যান্য', 'লাইফস্টাইল', 'বই', 'গিফট'].some(term => termsArray.some(t => t.includes(term) || term.includes(t)));

        list = list.filter(p => {
          const pCode = (p.productCode || '').toLowerCase().trim().replace(/^#/, '');
          const pId = (p.id || '').toLowerCase().trim();
          const pNameBn = normalizeBengali(p.nameBn);
          const pNameEn = (p.nameEn || '').toLowerCase();
          const pSubBn = normalizeBengali(p.subcategoryBn);
          const pSubEn = (p.subcategoryEn || '').toLowerCase();
          const pCatSlug = (p.categorySlug || '').toLowerCase();
          const pDescBn = normalizeBengali(p.shortDescBn || p.fullDescBn || '');

          const matchesCategory =
            (isClothingSearch && ['shop', 'style', 'fashion', 'lifestyle'].includes(pCatSlug)) ||
            (isGadgetSearch && ['gajet', 'gadget', 'gadgets', 'tech'].includes(pCatSlug)) ||
            (isOtherSearch && ['other', 'others'].includes(pCatSlug));

          return (
            termsArray.some(t =>
              pCode.includes(t) ||
              pId === t ||
              pNameBn.includes(t) ||
              pNameEn.includes(t) ||
              pSubBn.includes(t) ||
              pSubEn.includes(t) ||
              pCatSlug.includes(t) ||
              pDescBn.includes(t)
            ) || matchesCategory
          );
        });
      }
    }

    if (sortBy === 'price-low') {
      list.sort((a, b) => getAdjustedSellingPrice(a, employee, brandSettings) - getAdjustedSellingPrice(b, employee, brandSettings));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => getAdjustedSellingPrice(b, employee, brandSettings) - getAdjustedSellingPrice(a, employee, brandSettings));
    }

    return list;
  }, [activeCategory, selectedSubCategory, productsList, searchQuery, sortBy, employee, brandSettings]);

  // Display categories for Category Showcase in Public Home view
  const displayCategories = useMemo(() => {
    return (categories || []).filter(
      (c) => c.isActive !== false && c.slug !== 'd' && c.description !== 'd'
    );
  }, [categories]);

  // Handle Copy Full Marketing Post
  const handleCopyMarketingPost = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const desc = product.shortDescBn || product.fullDescBn || '';
    const ratingVal = product.starRating ? Number(product.starRating).toFixed(1) : '5.0';
    const sellingPrice = getAdjustedSellingPrice(product, employee, brandSettings);
    const regularPrice = getAdjustedRegularPrice(product, employee, brandSettings);

    const text = `🛍️ পণ্য: ${product.nameBn}
📌 প্রডাক্ট কোড: ${product.productCode}
💰 অফার বিক্রয়মূল্য: ৳${sellingPrice.toLocaleString()} (রেগুলার ৳${regularPrice.toLocaleString()})
⭐ কাস্টমার রেটিং: ${ratingVal} / 5.0
${desc ? `\n📝 পণ্যের বিবরণ:\n${desc}\n` : ''}
🚚 সারাদেশে দ্রুত হোম ডেলিভারি সুবিধা!
💵 ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন)
🛒 অর্ডার করতে এখনই আপনার নাম, মোবাইল নম্বর ও ঠিকানা লিখে মেসেজ করুন!`;

    navigator.clipboard.writeText(text);
    setCopiedPostId(product.id);
    showToast(
      lang === 'bn'
        ? 'মার্কেটিং পোস্ট ও বিবরণ কপি হয়েছে!'
        : 'Marketing post copied to clipboard!'
    );
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  const handleCopyCode = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    showToast(lang === 'bn' ? `প্রোডাক্ট কোড (${code}) কপি হয়েছে!` : `Product code (${code}) copied!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Handler for drawer category selection (Auto-hides drawer immediately)
  const handleSelectDrawerCategory = (cat: 'all' | 'shop' | 'gadgets' | 'others', sub: string | null = null) => {
    setActiveCategory(cat);
    setSelectedSubCategory(sub);
    setIsSideCatalogOpen(false); // Auto-hide!
  };

  // Navigate to Reseller Panel Catalog for a specific category
  const openResellerCatalog = (catSlug: 'all' | 'shop' | 'gadgets' | 'others') => {
    setActiveCategory(catSlug);
    setSelectedSubCategory(null);
    setCurrentView('reseller-catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exact 100% Identical Reseller Product Card Renderer (With emerald-500 border matching কাতুয়া section exactly)
  const renderProductCard = (product: Product) => {
    const commission = getResellerProfitPerUnit(product, employee, brandSettings);
    const sellingPrice = getAdjustedSellingPrice(product, employee, brandSettings);
    const regularPrice = getAdjustedRegularPrice(product, employee, brandSettings);
    const baseCostPrice = getResellerWholesalePrice(product, employee, brandSettings);

    const primaryImg =
      product.images?.find((img) => img.isPrimary)?.url ||
      product.images?.[0]?.url ||
      product.imageUrl ||
      '/images/product_shop_dress_1790244714775.jpg';

    const discountPercent = regularPrice > sellingPrice
      ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
      : 0;
    const ratingVal = product.starRating ? Number(product.starRating).toFixed(1) : '5.0';
    const isLiked = wishlistItems.some(w => w.id === product.id);

    return (
      <div
        key={product.id}
        id={`reseller-product-${product.id}`}
        onClick={() => {
          savedScrollY.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
          setLastInteractedProductId(product.id);
          setResellerPreviewProduct(product);
        }}
        className="group cursor-pointer bg-white rounded-2xl border border-emerald-300/80 hover:border-[#009245] p-2.5 sm:p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-2xs active:scale-[0.99]"
      >
        <div>
          {/* Top Row: Discount Badge, Star Rating & Reseller Profit Badge (Strict 1 line) */}
          <div className="flex items-center justify-between gap-1 mb-1.5 flex-nowrap min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              {discountPercent > 0 ? (
                <span className="text-[10px] sm:text-xs font-black text-white bg-rose-600 px-1.5 py-0.5 rounded-md leading-none shadow-xs whitespace-nowrap">
                  -{discountPercent}%
                </span>
              ) : <span />}

              <div className="flex items-center gap-0.5 text-[9.5px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded-md leading-none whitespace-nowrap">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{ratingVal}</span>
              </div>
            </div>

            {/* Profit Badge: Guaranteed 1 Line with whitespace-nowrap and shrink-0 */}
            <span className="text-[10px] sm:text-xs font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-md inline-flex items-center gap-0.5 shadow-2xs whitespace-nowrap shrink-0 leading-none">
              <span className="text-[#009245] font-mono whitespace-nowrap">+৳{commission.toLocaleString()}</span>
            </span>
          </div>

          {/* Centered Image Slot */}
          <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1 sm:p-2 mb-1.5 sm:mb-2">
            <img
              src={primaryImg}
              alt={product.nameBn}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src =
                  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';
              }}
            />

            {/* Floating Clean Heart Icon (Fully toggleable ON and OFF instantly) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              className="absolute top-2 right-2 p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10 focus:outline-none"
              title={lang === 'bn' ? 'পছন্দের তালিকায় রাখুন/বাদ দিন' : 'Toggle favorite'}
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  isLiked
                    ? 'fill-rose-600 text-rose-600 drop-shadow-sm'
                    : 'text-slate-400 hover:text-rose-600 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]'
                }`}
              />
            </button>
          </div>

          {/* SKU Code badge & Subcategory in 1 single line */}
          <div className="flex items-center gap-1 mb-1.5 flex-nowrap whitespace-nowrap overflow-hidden">
            <button
              type="button"
              onClick={(e) => handleCopyCode(product.id, product.productCode, e)}
              className="text-[9.5px] sm:text-[11px] font-mono font-bold text-emerald-800 bg-[#eafff3] border border-[#c6f6dd] px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-0.5 leading-none hover:bg-emerald-100 transition-colors cursor-pointer"
              title={lang === 'bn' ? 'কোড কপি করুন' : 'Copy Code'}
            >
              <span>{product.productCode}</span>
              {copiedCodeId === product.id ? (
                <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-2.5 h-2.5 text-emerald-700 opacity-60 shrink-0" />
              )}
            </button>

            {product.subcategoryBn && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate whitespace-nowrap">
                • {product.subcategoryBn}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-xs sm:text-[14px] md:text-[16px] font-bold text-slate-900 group-hover:text-[#009245] transition-colors line-clamp-1 leading-snug mb-1 sm:mb-2">
            {product.nameBn}
          </h3>

          {/* Price Section: পাইকারি ও খুচরা মূল্য */}
          <div className="bg-[#f0faf3] rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 border border-[#d8f0e0] space-y-0.5 sm:space-y-1 mb-2">
            <div className="flex items-center justify-between text-[11px] sm:text-[12px] md:text-[13px]">
              <span className="text-slate-600 font-medium whitespace-nowrap">
                {lang === 'bn' ? 'পাইকারি:' : 'Cost:'}
              </span>
              <span className="font-bold text-slate-900 font-mono text-[12px] md:text-[14px] whitespace-nowrap">
                ৳{baseCostPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm md:text-base pt-0.5 sm:pt-1 border-t border-emerald-200/70">
              <span className="text-[#009245] font-bold whitespace-nowrap">
                {lang === 'bn' ? 'বিক্রয়:' : 'Sell:'}
              </span>
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="font-black text-rose-600 font-mono text-xs sm:text-sm md:text-base">
                  ৳{sellingPrice.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-400 line-through font-mono hidden sm:inline">
                  ৳{regularPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Card Actions: All 3 Buttons Fit 100% Inside Frame with Zero Overflow */}
        <div className="pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1 min-w-0">
            
            {/* Primary Green Button: “কার্ট করুন” */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                savedScrollY.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                setLastInteractedProductId(product.id);
                setResellerPreviewProduct(product);
              }}
              className="flex-1 min-w-0 py-1.5 px-1 sm:px-2 text-[10px] sm:text-[11px] md:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-lg sm:rounded-xl shadow-2xs inline-flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'কার্ট করুন' : 'Add to Cart'}</span>
            </button>

            {/* Copy Marketing Post */}
            <button
              type="button"
              onClick={(e) => handleCopyMarketingPost(product, e)}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#009245] hover:text-[#007a3a] transition-colors cursor-pointer shrink-0 shadow-2xs active:scale-95"
              title={lang === 'bn' ? 'পোস্ট ও বিবরণ কপি করুন' : 'Copy marketing text'}
            >
              {copiedPostId === product.id ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 shrink-0" />
              )}
            </button>

            {/* All Images Download Button */}
            <button
              type="button"
              onClick={(e) => handleDownloadAllProductImages(product, e)}
              disabled={downloadingProductId === product.id}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#009245] hover:text-[#007a3a] transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50 active:scale-95"
              title={lang === 'bn' ? 'সবগুলো ছবি এক এক করে ডাউনলোড করুন' : 'Download all images'}
            >
              <Download className="w-3 h-3 shrink-0" />
            </button>

          </div>
        </div>

      </div>
    );
  };

  // -------------------------------------------------------------------------
  // VIEW 0: DEDICATED PRODUCT PREVIEW MODAL (Rendered after all hooks have run)
  // -------------------------------------------------------------------------
  if (resellerPreviewProduct !== null) {
    return (
      <ResellerProductPreviewModal
        product={resellerPreviewProduct}
        isOpen={true}
        onClose={() => setResellerPreviewProduct(null)}
        onTakeForSelling={(prod) => {
          setResellerPreviewProduct(null);
          onTakeForSelling(prod);
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // VIEW 1: PUBLIC STOREFRONT HOME PAGE (With Reseller Product Cards for Favorited items)
  // -------------------------------------------------------------------------
  if (currentView === 'public-home') {
    const favoritedProducts = wishlistItems;

    return (
      <div className="min-h-screen bg-[#f4f7f5] text-slate-900 pb-20">
        
        {/* 1. Hero Showcase Banner */}
        <HeroSection />

        {/* 2. Trust / Feature Badges Strip (Static Container & Text, Animated Pop-Up Icons) */}
        <ScrollReveal className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-1 sm:py-1.5" delay={0} duration={350}>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-emerald-500/50 hover:border-emerald-500 py-2 sm:py-2.5 px-1 sm:px-3 shadow-xs grid grid-cols-4 divide-x divide-slate-100 items-center overflow-visible">
            
            {/* Badge 1: Reliable Products */}
            <div className="group flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-1 sm:gap-2 p-0.5 sm:p-1.5 rounded-lg hover:bg-emerald-50/50 transition-colors duration-300 cursor-pointer">
              <div className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50/90 flex items-center justify-center shrink-0 border border-emerald-200/80 group-hover:bg-[#009245] group-hover:text-white group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 transform shadow-3xs">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#009245] group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="min-w-0 text-center sm:text-left pt-0.5">
                <h4 className="text-[7.5px] sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-[#009245] leading-normal sm:leading-relaxed transition-colors duration-300 whitespace-nowrap overflow-visible">
                  {lang === 'bn' ? 'নির্ভরযোগ্য পণ্য' : 'Authentic'}
                </h4>
                <p className="text-[7.5px] sm:text-[10px] text-slate-500 mt-0.5 hidden md:block">
                  {lang === 'bn' ? '১০০% মানসম্মত' : '100% Quality'}
                </p>
              </div>
            </div>

            {/* Badge 2: Nationwide Delivery */}
            <div className="group flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-1 sm:gap-2 p-0.5 sm:p-1.5 rounded-lg hover:bg-blue-50/50 transition-colors duration-300 cursor-pointer">
              <div className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-blue-50/90 flex items-center justify-center shrink-0 border border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 transform shadow-3xs">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="min-w-0 text-center sm:text-left pt-0.5">
                <h4 className="text-[7.5px] sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-blue-600 leading-normal sm:leading-relaxed transition-colors duration-300 whitespace-nowrap overflow-visible">
                  {lang === 'bn' ? 'সারা দেশে ডেলিভারি' : 'Nationwide'}
                </h4>
                <p className="text-[7.5px] sm:text-[10px] text-slate-500 mt-0.5 hidden md:block">
                  {lang === 'bn' ? 'দ্রুত ও নিরাপদ' : 'Fast Delivery'}
                </p>
              </div>
            </div>

            {/* Badge 3: Easy Return */}
            <div className="group flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-1 sm:gap-2 p-0.5 sm:p-1.5 rounded-lg hover:bg-amber-50/50 transition-colors duration-300 cursor-pointer">
              <div className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-amber-50/90 flex items-center justify-center shrink-0 border border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 transform shadow-3xs">
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="min-w-0 text-center sm:text-left pt-0.5">
                <h4 className="text-[7.5px] sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-amber-600 leading-normal sm:leading-relaxed transition-colors duration-300 whitespace-nowrap overflow-visible">
                  {lang === 'bn' ? 'সহজ রিটার্ন' : 'Easy Return'}
                </h4>
                <p className="text-[7.5px] sm:text-[10px] text-slate-500 mt-0.5 hidden md:block">
                  {lang === 'bn' ? '৭ দিনের মধ্যে' : '7 Days'}
                </p>
              </div>
            </div>

            {/* Badge 4: 24/7 Support */}
            <div className="group flex flex-col sm:flex-row items-center justify-center sm:justify-start text-center sm:text-left gap-1 sm:gap-2 p-0.5 sm:p-1.5 rounded-lg hover:bg-purple-50/50 transition-colors duration-300 cursor-pointer">
              <div className="w-5.5 h-5.5 sm:w-7.5 sm:h-7.5 rounded-lg bg-purple-50/90 flex items-center justify-center shrink-0 border border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-125 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 transform shadow-3xs">
                <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="min-w-0 text-center sm:text-left pt-0.5">
                <h4 className="text-[7.5px] sm:text-xs md:text-sm font-bold text-slate-900 group-hover:text-purple-600 leading-normal sm:leading-relaxed transition-colors duration-300 whitespace-nowrap overflow-visible">
                  {lang === 'bn' ? '২৪/৭ সাপোর্ট' : '24/7 Support'}
                </h4>
                <p className="text-[7.5px] sm:text-[10px] text-slate-500 mt-0.5 hidden md:block">
                  {lang === 'bn' ? 'যে কোনো সময়' : 'Help Anytime'}
                </p>
              </div>
            </div>

          </div>
        </ScrollReveal>

        {/* 3. ক্যাটাগরি সমূহ (Category Showcase Section with UI Animations) */}
        {displayCategories.length > 0 && (
          <section className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 pb-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-1.5 bg-[#009245] rounded-full inline-block" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {lang === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => openResellerCatalog('shop')}
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-[#009245] transition-colors flex items-center gap-1 group cursor-pointer"
              >
                <span>{lang === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'View All Categories'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {displayCategories.map((cat, idx) => {
                const count = productsList.filter(
                  (p) => p.categorySlug?.toLowerCase() === cat.slug?.toLowerCase() && p.isActive !== false
                ).length;

                // Distinct Professional Color Themes per Category
                const isShop = cat.slug.toLowerCase().includes('shop') || idx === 0;
                const isGadget = cat.slug.toLowerCase().includes('gadget') || cat.slug.toLowerCase().includes('gajet') || idx === 1;

                const theme = isShop
                  ? {
                      bg: 'bg-gradient-to-br from-emerald-100/95 via-emerald-50/90 to-teal-100/95 shadow-2xs backdrop-blur-md',
                      border: 'border-2 border-emerald-300/90',
                      hoverBorder: 'hover:border-emerald-500 hover:shadow-lg',
                      titleColor: 'text-[#009245]',
                      badgeBg: 'bg-white/95 backdrop-blur-md',
                      badgeBorder: 'border border-emerald-200/90',
                      badgeText: 'text-emerald-800',
                      btnBg: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xs',
                      iconBg: 'bg-white/95 backdrop-blur-md border border-emerald-200/90 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
                      glowOrb1: 'bg-emerald-400/40',
                      glowOrb2: 'bg-teal-300/40',
                      IconComponent: Shirt,
                    }
                  : isGadget
                  ? {
                      bg: 'bg-gradient-to-br from-sky-100/95 via-sky-50/90 to-blue-100/95 shadow-2xs backdrop-blur-md',
                      border: 'border-2 border-sky-300/90',
                      hoverBorder: 'hover:border-sky-500 hover:shadow-lg',
                      titleColor: 'text-[#0284c7]',
                      badgeBg: 'bg-white/95 backdrop-blur-md',
                      badgeBorder: 'border border-sky-200/90',
                      badgeText: 'text-sky-800',
                      btnBg: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-xs',
                      iconBg: 'bg-white/95 backdrop-blur-md border border-sky-200/90 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
                      glowOrb1: 'bg-sky-400/40',
                      glowOrb2: 'bg-cyan-300/40',
                      IconComponent: Smartphone,
                    }
                  : {
                      bg: 'bg-gradient-to-br from-purple-100/95 via-purple-50/90 to-fuchsia-100/95 shadow-2xs backdrop-blur-md',
                      border: 'border-2 border-purple-300/90',
                      hoverBorder: 'hover:border-purple-500 hover:shadow-lg',
                      titleColor: 'text-[#9333ea]',
                      badgeBg: 'bg-white/95 backdrop-blur-md',
                      badgeBorder: 'border border-purple-200/90',
                      badgeText: 'text-purple-800',
                      btnBg: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-xs',
                      iconBg: 'bg-white/95 backdrop-blur-md border border-purple-200/90 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
                      glowOrb1: 'bg-purple-400/40',
                      glowOrb2: 'bg-fuchsia-300/40',
                      IconComponent: Package,
                    };

                const IconTag = theme.IconComponent;

                return (
                  <div
                    key={cat.id}
                    onClick={() => openResellerCatalog(cat.slug as any)}
                    className={`relative ${theme.bg} ${theme.border} rounded-xl sm:rounded-2xl p-3.5 sm:p-4.5 md:p-5.5 lg:p-6 flex items-center justify-between gap-3 sm:gap-4 md:gap-5 min-h-[140px] sm:min-h-[165px] md:min-h-[200px] lg:min-h-[215px] transition-all duration-300 hover:shadow-md ${theme.hoverBorder} hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer group overflow-hidden`}
                  >
                    {/* Interior Ambient Blurred Glow Orbs for Glassmorphism Effect */}
                    <div className={`absolute -right-8 -bottom-8 w-36 h-36 md:w-44 md:h-44 rounded-full ${theme.glowOrb1} blur-2xl pointer-events-none transition-all group-hover:scale-125 duration-500`} />
                    <div className={`absolute -left-8 -top-8 w-32 h-32 md:w-40 md:h-40 rounded-full ${theme.glowOrb2} blur-xl pointer-events-none transition-all group-hover:scale-125 duration-500`} />

                    <div className="relative z-10 flex-1 flex flex-col justify-between h-full py-0.5 min-w-0">
                      <div className="space-y-1.5 md:space-y-2">
                        <div className="flex items-center justify-between gap-1.5 flex-nowrap min-w-0 w-full mb-1">
                          <h3 className={`text-xs sm:text-sm md:text-base lg:text-lg font-black ${theme.titleColor} uppercase tracking-tight leading-snug truncate group-hover:opacity-90 transition-opacity`}>
                            {cat.name}
                          </h3>
                          <span className={`${theme.badgeBg} border ${theme.badgeBorder} ${theme.badgeText} text-[9.5px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded-md shadow-3xs shrink-0 whitespace-nowrap`}>
                            {lang === 'bn' ? `${count} টি পণ্য` : `${count} Products`}
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs md:text-sm text-slate-800 font-medium line-clamp-2 leading-snug sm:leading-relaxed max-w-[280px] sm:max-w-[320px] lg:max-w-[360px]">
                          {cat.description || (lang === 'bn' ? 'প্রয়োজনীয় সব পণ্য এক জায়গায়।' : 'All essentials in one place.')}
                        </p>
                      </div>

                      <div className="pt-2 sm:pt-3 md:pt-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openResellerCatalog(cat.slug as any);
                          }}
                          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-4.5 md:py-2 rounded-lg sm:rounded-xl ${theme.btnBg} text-white text-[10.5px] sm:text-xs md:text-sm font-black transition-all duration-200 shadow-2xs hover:shadow-sm hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0`}
                        >
                          <span className="whitespace-nowrap">{lang === 'bn' ? 'এক্সপ্লোর করুন' : 'Explore'}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1.5 transition-transform duration-300 shrink-0" />
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10 shrink-0 flex flex-col justify-between items-end h-full py-0.5 gap-1.5 md:gap-2">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg sm:rounded-xl border flex items-center justify-center self-end shadow-3xs group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 ${theme.iconBg}`}>
                        <IconTag className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                      </div>
                      {cat.imageUrl && (
                        <div className="w-22 h-18 sm:w-32 sm:h-24 md:w-38 md:h-30 lg:w-42 lg:h-32 rounded-lg sm:rounded-xl overflow-hidden border border-white/90 shadow-2xs shrink-0 bg-white flex items-center justify-center">
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. "জনপ্রিয় পণ্য (পছন্দকৃত)" Section using 100% Identical Reseller Product Cards with emerald-500 border */}
        <section id="catalog-section" className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-1.5 bg-[#009245] rounded-full inline-block" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === 'bn' ? `জনপ্রিয় পণ্য (${favoritedProducts.length})` : `Popular Products (${favoritedProducts.length})`}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => openResellerCatalog('all')}
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-[#009245] transition-colors flex items-center gap-1 group cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Popular Products Grid using EXACT Reseller Product Card */}
          {favoritedProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
                <Heart className="w-6 h-6 fill-rose-100" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {lang === 'bn' ? 'কোনো পণ্য পছন্দ করা হয়নি (0)' : 'No favorited products (0)'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'যেকোনো পণ্যের ওপর থাকা লাভ (❤️) আইকনে ক্লিক করে লাভ রিঅ্যাক্ট দিন, সেগুলো এখানে (0 থেকে বেড়ে) যুক্ত হবে।'
                  : 'Tap the heart (❤️) icon on any product to add it to your popular favorites here.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openResellerCatalog('all')}
                  className="px-4 py-2 rounded-xl bg-[#009245] text-white text-xs font-bold shadow-xs hover:bg-[#007a3a] cursor-pointer"
                >
                  {lang === 'bn' ? 'পণ্য ব্রাউজ করুন' : 'Browse Products'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {favoritedProducts.map((product) => renderProductCard(product))}
            </div>
          )}
        </section>

      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW 2: RESELLER PANEL CATALOG (Original 5 Buttons + 2-Column Subcategories)
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-x-hidden min-h-screen pb-20 px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP 5 CATEGORY PILL BUTTONS (Only shown on main collections view: selectedSubCategory === null && !searchQuery.trim()) */}
      {/* ------------------------------------------------------------- */}
      {selectedSubCategory === null && !searchQuery.trim() && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-2.5 sm:p-3.5 shadow-2xs">
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            
            {/* Option 1: ব্যাক */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true') {
                  showToast(lang === 'bn' ? 'অর্ডার ফর্মে ফিরে যেতে নিচের সবুজ বাটন চাপুন।' : 'Use bottom bar to return to order.', 'info');
                  return;
                }
                setCurrentView('public-home');
                setSelectedSubCategory(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-0.5 bg-slate-50 text-slate-800 border border-slate-200 hover:bg-emerald-50 hover:text-[#009245] hover:border-emerald-200 active:scale-95"
              title={lang === 'bn' ? 'পূর্ববর্তী পেজে ফিরে যান' : 'Back'}
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'ব্যাক' : 'Back'}</span>
            </button>

            {/* Option 2: ক্যাটালগ (Catalog Drawer) */}
            <button
              type="button"
              onClick={() => setIsSideCatalogOpen(true)}
              className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isSideCatalogOpen
                  ? 'bg-[#009245] text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'ক্যাটালগ' : 'Catalog'}</span>
            </button>

            {/* Option 3: শপ (Shop) */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('shop');
                setSelectedSubCategory(null);
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'shop' && !isSideCatalogOpen
                  ? 'bg-[#009245] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-emerald-50 hover:text-[#009245]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'শপ' : 'Shop'}</span>
            </button>

            {/* Option 4: গ্যাজেট (Gadgets) */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('gadgets');
                setSelectedSubCategory(null);
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'gadgets' && !isSideCatalogOpen
                  ? 'bg-[#009245] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-emerald-50 hover:text-[#009245]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'গ্যাজেট' : 'Gadgets'}</span>
            </button>

            {/* Option 5: আদার্স (Others) */}
            <button
              type="button"
              onClick={() => {
                setActiveCategory('others');
                setSelectedSubCategory(null);
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeCategory === 'others' && !isSideCatalogOpen
                  ? 'bg-[#009245] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 hover:bg-emerald-50 hover:text-[#009245]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'আদার্স' : 'Others'}</span>
            </button>

          </div>
        </div>
      )}
      {selectedSubCategory === null && !searchQuery.trim() && currentCategoryConfig.groups.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {currentCategoryConfig.groups.map((group) => (
            <div
              key={group.id}
              className={`bg-[#f0faf3] border border-emerald-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-3 shadow-2xs`}
            >
              {/* Group Header (e.g. ছেলেদের কালেকশন) */}
              <div className="flex items-center justify-between pb-1">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className="w-3 sm:w-4 h-1 sm:h-1.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: group.accentColor }}
                    />
                    <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                      {lang === 'bn' ? group.titleBn : group.titleEn}
                    </h2>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 font-normal mt-0.5 truncate">
                    {lang === 'bn' ? group.subtitleBn : group.subtitleEn}
                  </p>
                </div>

                {group.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory(group.items[0].nameBn)}
                    className="text-[11px] sm:text-xs font-bold text-[#009245] hover:text-[#007a3a] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>

              {/* Sub-categories Grid (Strictly 2 per row on mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSubCategory(item.nameBn)}
                    className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 hover:shadow-md hover:border-[#009245] transition-all duration-200 flex flex-col justify-between"
                  >
                    {/* Image container */}
                    <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 mb-1.5 flex items-center justify-center p-1">
                      <img
                        src={item.image}
                        alt={item.nameBn}
                        className="w-full h-full object-cover object-center rounded group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Text info & arrow button */}
                    <div className="flex items-center justify-between gap-1 pt-0.5 min-w-0">
                      <div className="truncate min-w-0">
                        <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-[#009245] transition-colors leading-tight truncate">
                          {lang === 'bn' ? item.nameBn : item.nameEn}
                        </h4>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block">
                          {item.count} {lang === 'bn' ? 'পণ্য' : 'items'}
                        </span>
                      </div>

                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-50 group-hover:bg-[#009245] text-[#009245] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SUB-CATEGORY HEADER & TOOLBAR (When category or search is active) */}
      {/* ------------------------------------------------------------- */}
      {(selectedSubCategory !== null || searchQuery.trim() !== '') && (
        <div className="space-y-3">
          {/* Professional Header Bar matching Public / Modal style (image_f726a1c5.png) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex flex-nowrap items-center justify-between gap-1.5 sm:gap-2 w-full overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
              {selectedSubCategory !== null && (
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim()) setSearchQuery('');
                    setSelectedSubCategory(null);
                  }}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 active:scale-95 whitespace-nowrap border border-slate-200/80"
                  title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
              )}

              {/* Subcategory Title Badge matching image_f726a1c5.png */}
              <span className="text-xs sm:text-[13px] font-black text-[#009245] bg-emerald-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-emerald-200/80 shrink-0 whitespace-nowrap truncate inline-block">
                {selectedSubCategory || (lang === 'bn' ? 'অনুসন্ধান ফলাফল' : 'Search Results')}
              </span>

              {/* Item Count Badge */}
              <span className="text-[10px] sm:text-xs font-extrabold text-[#009245] bg-emerald-50/70 border border-emerald-200/80 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                {displayProducts.length} {lang === 'bn' ? 'টি' : 'items'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setIsSideCatalogOpen(true)}
                className="px-2.5 py-1 sm:py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-[#009245] border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 sm:py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-lg outline-none focus:border-[#009245] cursor-pointer shrink-0"
              >
                <option value="popular">{lang === 'bn' ? 'জনপ্রিয়তা' : 'Popularity'}</option>
                <option value="price-low">{lang === 'bn' ? 'দাম: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price-high">{lang === 'bn' ? 'দাম: বেশি থেকে কম' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>

          {/* Products Grid or Empty State */}
          {displayProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 text-center space-y-2 sm:space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#009245] mx-auto flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                {lang === 'bn' ? 'এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'অন্য কোনো সাব-ক্যাটাগরি নির্বাচন করুন বা ক্যাটালগ মেনু থেকে ঘুরে আসুন।'
                  : 'Select another sub-category or return to catalog.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-3.5">
              {displayProducts.map((product) => renderProductCard(product))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MOBILE SIDE CATALOG DRAWER (AUTO-HIDES IMMEDIATELY ON CLICK) */}
      {/* ------------------------------------------------------------- */}
      {isSideCatalogOpen && (
        <div className="fixed inset-0 z-[1100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSideCatalogOpen(false)}
          />

          {/* Drawer Slide-in Panel */}
          <div className="fixed inset-y-0 left-0 max-w-[300px] w-[85%] bg-white shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-250 border-r border-emerald-200">
            
            {/* Drawer Top Header */}
            <div>
              <div className="p-4 bg-[#009245] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  <div>
                    <h3 className="text-sm font-black tracking-wide">
                      {lang === 'bn' ? 'প্রোডাক্ট ক্যাটালগ মেনু' : 'Catalog Menu'}
                    </h3>
                    <p className="text-[10px] text-emerald-100 font-medium">
                      {lang === 'bn' ? 'ক্যাটাগরি বা সাব-সেকশন বেছে নিন' : 'Select category or section'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSideCatalogOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Category Navigation List - AUTO-CLOSES ON CLICK */}
              <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)]">
                
                {/* 1. Main Category Switcher Buttons */}
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 pb-1">
                    {lang === 'bn' ? 'মূল ক্যাটাগরি' : 'Main Categories'}
                  </div>
                  {allDrawerSections.map((sec) => (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => handleSelectDrawerCategory(sec.key, null)}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        activeCategory === sec.key && selectedSubCategory === null
                          ? 'bg-[#009245] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? sec.labelBn : sec.labelEn}</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeCategory === sec.key && selectedSubCategory === null
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sec.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 2. Sub-Sections and Groups */}
                {currentCategoryConfig.groups.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 pb-1">
                      {lang === 'bn' ? `${currentCategoryConfig.titleBn} - কালেকশন` : 'Collections'}
                    </div>

                    {currentCategoryConfig.groups.map((grp) => (
                      <div key={grp.id} className="space-y-1 bg-emerald-50/50 rounded-xl p-2 border border-emerald-100/70">
                        <div className="text-[11px] font-black text-emerald-950 px-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#009245]" />
                          <span>{lang === 'bn' ? grp.titleBn : grp.titleEn}</span>
                        </div>

                        <div className="space-y-0.5 pt-1">
                          {grp.items.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleSelectDrawerCategory(activeCategory, sub.nameBn)}
                              className={`w-full p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                selectedSubCategory === sub.nameBn
                                  ? 'bg-[#009245] text-white shadow-2xs font-bold'
                                  : 'text-slate-700 hover:bg-emerald-100/70'
                              }`}
                            >
                              <span className="truncate pr-2">{lang === 'bn' ? sub.nameBn : sub.nameEn}</span>
                              <span className={`text-[10px] font-bold ${selectedSubCategory === sub.nameBn ? 'text-white' : 'text-emerald-700'}`}>
                                {sub.count} {lang === 'bn' ? 'টি' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleSelectDrawerCategory('all', null)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-emerald-200 text-[#009245] hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সব পণ্য একসাথে দেখুন' : 'View All Products'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
