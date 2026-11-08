import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.js';
import { Product } from '../types/index.js';
import { ProductCard } from './ProductCard.js';
import { getAdjustedSellingPrice, getAdjustedRegularPrice, getResellerWholesalePrice, getResellerProfitPerUnit } from '../utils/pricing.js';
import { bdDistrictsAndThanas, isSearchTextMatch } from '../data/bdLocations.js';
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  ShoppingCart,
  Home,
  X,
  Star,
  Download,
  Copy,
  Check,
  Link2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Truck,
  ShieldCheck,
  Search,
  FileText,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Tag,
  Ruler,
  ArrowRight,
} from 'lucide-react';

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  categoryProducts?: Product[];
  relatedProducts?: Product[];
  onSelectRelated?: (product: Product) => void;
  isPreview?: boolean;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onBack,
  categoryProducts = [],
  relatedProducts = [],
  onSelectRelated,
  isPreview = false,
}) => {
  const {
    lang,
    t,
    showToast,
    employee,
    addToCart,
    brandSettings,
    autoOpenCheckoutModal,
    setAutoOpenCheckoutModal,
    wishlistItems,
    toggleWishlist,
    cartItems,
    openCheckoutModal,
    activePortal,
  } = useApp();

  const isResellerPortal = activePortal === 'employee';

  const publicWhatsapp = brandSettings?.whatsappNumber || employee?.phone || '01700000000';
  const publicHelpline = brandSettings?.publicContactNumber || brandSettings?.helplinePhone || employee?.phone || '01700000000';
  const publicNotice = brandSettings?.publicNoticeText || 'অনুরোধ করা হচ্ছে: আপনি প্রোডাক্টটির ছবি ডাউনলোড করে বা লিংক কপি করে, আপনি যার পোস্টে বা লিংকে ক্লিক করে কিনতে এসেছেন তার সাথে কন্টাক্ট করে এগুলো তাকে পাঠিয়ে বলুন যে "এই পণ্যগুলো নেব"। তাহলে আপনার অর্ডারটি কনফার্ম হবে।';

  const [currentProduct, setCurrentProduct] = useState<Product>(product);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomMode, setZoomMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const isWishlisted = wishlistItems.some(p => p.id === currentProduct.id);

  useEffect(() => {
    if (autoOpenCheckoutModal) {
      setAutoOpenCheckoutModal(false);
      openCheckoutModal([{
        product: currentProduct,
        size: selectedSize || 'M',
        quantity: quantity,
      }]);
    }
  }, [autoOpenCheckoutModal, currentProduct, selectedSize, quantity, openCheckoutModal, setAutoOpenCheckoutModal]);

  // States for copy & download feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Dynamic state for "+ আরও প্রোডাক্ট যোগ করুন" mode across Public and Reseller
  const [isAddingToOrderMode, setIsAddingToOrderMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      if (typeof window === 'undefined') return;
      const isPublicAdding = sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true';
      const isResellerAdding = sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true';
      setIsAddingToOrderMode(isPublicAdding || isResellerAdding);
    };
    checkMode();
    window.addEventListener('tawzoon_order_mode_changed', checkMode);
    window.addEventListener('tawzoon_reseller_order_mode_changed', checkMode);
    window.addEventListener('storage', checkMode);
    return () => {
      window.removeEventListener('tawzoon_order_mode_changed', checkMode);
      window.removeEventListener('tawzoon_reseller_order_mode_changed', checkMode);
      window.removeEventListener('storage', checkMode);
    };
  }, []);

  // Quick order modal state (Reseller Delivery Order Sheet Style)
  const [checkoutSource, setCheckoutSource] = useState<'single' | 'cart'>('single');
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  // Checkout items list for this order
  const [checkoutItems, setCheckoutItems] = useState<Array<{
    product: Product;
    size: string;
    quantity: number;
  }>>([]);

  // Location Combobox States (Districts & Thanas)
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [districtQuery, setDistrictSearchQuery] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const [selectedThana, setSelectedThana] = useState('ধানমন্ডি');
  const [thanaQuery, setThanaSearchQuery] = useState('');
  const [isThanaDropdownOpen, setIsThanaDropdownOpen] = useState(false);

  const [specificAddress, setSpecificAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Delivery Fee Advance Toggle: 'no' = ৳120 COD, 'yes' = ৳0
  const [isDeliveryPaidAdvance, setIsDeliveryPaidAdvance] = useState<'yes' | 'no'>('no');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Filter Districts & Thanas
  const allDistricts = useMemo(() => Object.keys(bdDistrictsAndThanas), []);
  const matchingDistricts = useMemo(() => {
    return allDistricts.filter(dist => isSearchTextMatch(dist, districtQuery));
  }, [allDistricts, districtQuery]);

  const availableThanas = useMemo(() => {
    return bdDistrictsAndThanas[selectedDistrict] || ['সদর'];
  }, [selectedDistrict]);

  const matchingThanas = useMemo(() => {
    return availableThanas.filter(thana => isSearchTextMatch(thana, thanaQuery));
  }, [availableThanas, thanaQuery]);

  // Open Order Modal Handler
  const handleOpenOrderModal = () => {
    if (!selectedSize) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে প্রথমে একটি সাইজ সিলেক্ট করুন!' : 'Please select a size first!', 'error');
      return;
    }
    setCheckoutItems([{
      product: currentProduct,
      size: selectedSize,
      quantity: quantity
    }]);
    setIsQuickOrderOpen(true);
  };

  useEffect(() => {
    setCurrentProduct(product);
  }, [product]);

  useEffect(() => {
    setActiveImageIndex(0);
    setZoomMode(false);
    setSelectedSize(null);
    setQuantity(1);
    setIsQuickOrderOpen(false);
  }, [product?.id, product?.productCode]);

  // Source list of products in the current category/series
  const categoryList = useMemo(() => {
    if (categoryProducts && categoryProducts.length > 0) {
      return categoryProducts;
    }
    if (relatedProducts && relatedProducts.length > 0) {
      return relatedProducts;
    }
    return [];
  }, [categoryProducts, relatedProducts]);

  // Find index of clicked product in the category sequence
  const currentIndex = useMemo(() => {
    return categoryList.findIndex(
      (p) => p.id === currentProduct.id || p.productCode === currentProduct.productCode
    );
  }, [categoryList, currentProduct.id, currentProduct.productCode]);

  // Only show subsequent products (index > currentIndex) from the same category
  const subsequentProducts = useMemo(() => {
    if (currentIndex !== -1) {
      return categoryList.slice(currentIndex + 1);
    }
    return [];
  }, [categoryList, currentIndex]);

  const handleSelectRelated = (item: Product) => {
    setCurrentProduct(item);
    setActiveImageIndex(0);
    setSelectedSize(null);
    setQuantity(1);
    if (onSelectRelated) {
      onSelectRelated(item);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const title = lang === 'bn' ? (currentProduct.nameBn || 'Stylish Product') : (currentProduct.nameEn || currentProduct.nameBn);
  const subcat = lang === 'bn' ? currentProduct.subcategoryBn : currentProduct.subcategoryEn;
  const shortDesc = lang === 'bn' ? currentProduct.shortDescBn : currentProduct.shortDescEn;
  const fullDesc = lang === 'bn' ? currentProduct.fullDescBn : currentProduct.fullDescEn;

  // Filter images only (exclude video URLs)
  const images = useMemo(() => {
    if (currentProduct?.images && currentProduct.images.length > 0) {
      const filtered = currentProduct.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url))
        .filter((url: any) => url && typeof url === 'string' && !url.endsWith('.mp4'));
      if (filtered.length > 0) return filtered;
    }
    return [currentProduct?.imageUrl || '/images/product_shop_dress_1790244714775.jpg'];
  }, [currentProduct?.images, currentProduct?.imageUrl]);

  const activeImage = images[activeImageIndex] || images[0] || '/images/product_shop_dress_1790244714775.jpg';

  // Thumbnail list scroll management
  const thumbnailScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkThumbnailScroll = () => {
    if (thumbnailScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = thumbnailScrollRef.current;
      setCanScrollDown(scrollHeight - scrollTop - clientHeight > 8);
      setCanScrollUp(scrollTop > 8);
    }
  };

  useEffect(() => {
    checkThumbnailScroll();
    const el = thumbnailScrollRef.current;
    if (!el) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkThumbnailScroll();
      });
      ro.observe(el);
    }

    const timer = setTimeout(checkThumbnailScroll, 150);
    window.addEventListener('resize', checkThumbnailScroll);

    return () => {
      if (ro) ro.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', checkThumbnailScroll);
    };
  }, [images]);

  const handleScrollThumbnailsDown = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ top: 120, behavior: 'smooth' });
      setTimeout(checkThumbnailScroll, 250);
    }
  };

  const handleScrollThumbnailsUp = () => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ top: -120, behavior: 'smooth' });
      setTimeout(checkThumbnailScroll, 250);
    }
  };

  // Category name formatting
  const rawCategoryName = subcat || currentProduct.categorySlug || 'কাতুয়া';
  const getFormattedCategoryBadge = (name: string): string => {
    if (!name) return 'কাতুয়া';
    const words = name.trim().split(/\s+/);
    if (words.length <= 2) {
      if (name.length <= 14) return name;
      return name.slice(0, 12) + '...';
    }
    return words.slice(0, 2).join(' ') + '...';
  };
  const displayCategoryBadge = getFormattedCategoryBadge(rawCategoryName);

  // Adjusted pricing based on official reference rule
  const baseCostPrice = getResellerWholesalePrice(currentProduct, employee, brandSettings);
  const adjustedSellingPrice = getAdjustedSellingPrice(currentProduct, employee, brandSettings);
  const regularPrice = getAdjustedRegularPrice(currentProduct, employee, brandSettings);

  const [customSellingPrice, setCustomSellingPrice] = useState<number | string>(() => adjustedSellingPrice);

  useEffect(() => {
    setCustomSellingPrice(getAdjustedSellingPrice(currentProduct, employee, brandSettings));
  }, [currentProduct?.id, employee?.id]);

  const livePrice = customSellingPrice !== '' && !isNaN(Number(customSellingPrice)) && Number(customSellingPrice) > 0
    ? Number(customSellingPrice)
    : adjustedSellingPrice;

  const liveProfit = customSellingPrice !== '' && !isNaN(Number(customSellingPrice))
    ? Math.max(0, Number(customSellingPrice) - baseCostPrice)
    : Math.max(0, adjustedSellingPrice - baseCostPrice);

  const isPriceValid = livePrice >= baseCostPrice;

  const sellingPrice = livePrice;
  const discountPercent = regularPrice > sellingPrice
    ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
    : 10;
  const ratingVal = currentProduct.starRating ? Number(currentProduct.starRating).toFixed(1) : '5.0';

  // Available sizes
  const availableSizes = currentProduct.colors?.length
    ? currentProduct.colors
    : ['M', 'L', 'XL', 'XXL'];

  // Referral / Product URL
  const referralUrl = employee
    ? `${window.location.origin}/?ref=${employee.id}&product=${currentProduct.productCode}`
    : `${window.location.origin}/?product=${currentProduct.productCode}`;

  const showInModalNotice = (msg: string, duration = 2200) => {
    setDownloadNotice(msg);
    setTimeout(() => setDownloadNotice(null), duration);
  };

  // Copy Product Link
  const handleCopyShareableLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast(lang === 'bn' ? 'প্রোডাক্ট লিংক কপি হয়েছে!' : 'Product link copied!');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Copy Product Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentProduct.productCode);
    setCopiedCode(true);
    showToast(lang === 'bn' ? 'কোড কপি হয়েছে!' : 'Code copied!');
    setTimeout(() => setCopiedCode(false), 2200);
  };

  // Copy Marketing Post
  const handleCopyMarketingPost = () => {
    const customCaption = lang === 'bn' ? currentProduct.marketingCaptionBn : currentProduct.marketingCaptionEn;
    const caption =
      customCaption ||
      `🔥 ${title} 🔥\n\n${shortDesc || ''}\n\n📌 পণ্যের কোড: ${currentProduct.productCode}\n💰 বিশেষ অফার মূল্য: ৳${sellingPrice.toLocaleString()}\n📦 ডেলিভারি: সমগ্র বাংলাদেশে ক্যাশ অন হোম ডেলিভারি।\n\nঅর্ডার করতে এখনই বুক করুন!`;

    navigator.clipboard.writeText(caption);
    setCopiedPost(true);
    showToast(lang === 'bn' ? 'পোস্ট কপি সম্পন্ন হয়েছে!' : 'Post copied!');
    setTimeout(() => setCopiedPost(false), 2200);
  };

  // Download Single Image
  const handleDownloadSingle = async (imgUrl: string, idx: number) => {
    try {
      showInModalNotice('ছবি ডাউনলোড শুরু হচ্ছে...', 1500);
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = (currentProduct.nameBn || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
      link.download = `${currentProduct.productCode || 'TNX'}_${safeName}_${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showInModalNotice('ছবি ডাউনলোড সম্পন্ন হয়েছে✓', 2200);
    } catch {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.target = '_blank';
      link.download = `${currentProduct.productCode || 'TNX'}_${idx + 1}.jpg`;
      link.click();
      showInModalNotice('ছবি ডাউনলোড সম্পন্ন হয়েছে✓', 2200);
    }
  };

  // Download All Images
  const handleDownloadAllImages = async () => {
    setIsDownloadingAll(true);
    showInModalNotice(`সবগুলো (${images.length}টি) ছবি ডাউনলোড হচ্ছে...`, 2000);

    for (let i = 0; i < images.length; i++) {
      try {
        const imgUrl = images[i];
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const safeName = (currentProduct.nameBn || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
        link.download = `${currentProduct.productCode || 'TNX'}_${safeName}_photo_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch {
        const link = document.createElement('a');
        link.href = images[i];
        link.target = '_blank';
        link.click();
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsDownloadingAll(false);
    showInModalNotice('সবগুলো ছবি সফলভাবে ডাউনলোড হয়েছে✓', 2500);
  };

  // Add to Cart
  const handleAddToCart = () => {
    const sizeToUse = selectedSize || availableSizes[0] || 'M';
    const productWithSize: Product = {
      ...currentProduct,
      sizes: [sizeToUse],
      quantity: quantity,
    };
    addToCart(productWithSize);
  };

  // Quick Order Submit
  const handleQuickOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickPhone || quickPhone.length < 11) {
      showToast(lang === 'bn' ? 'সঠিক নাম এবং ১১ ডিজিট ফোন নম্বর দিন' : 'Enter valid name & 11-digit phone', 'error');
      return;
    }
    setIsSubmittingOrder(true);
    setTimeout(() => {
      setIsSubmittingOrder(false);
      setIsQuickOrderOpen(false);
      showToast(lang === 'bn' ? 'আপনার অর্ডার সফলভাবে বুক করা হয়েছে! শীঘ্রই কল করা হবে।' : 'Order placed successfully!', 'success');
    }, 1000);
  };

  return (
    <div className={`w-full ${isPreview ? 'bg-white text-slate-900 font-sans pb-2' : 'w-full text-slate-900 font-sans pb-2 sm:pb-3'} relative`}>
      
      {/* Floating Notice */}
      {downloadNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400/30 animate-in fade-in slide-in-from-top-2 duration-200">
          {downloadNotice}
        </div>
      )}

      <div className={isPreview ? "w-full p-0 space-y-2.5" : "w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-2 sm:pb-3 space-y-2.5 sm:space-y-3.5"}>
        
        {/* ------------------------------------------------------------- */}
        {/* TOP BAR: Back Button + Home > SHOP > Category > Title Breadcrumb */}
        {/* ------------------------------------------------------------- */}
        {!isPreview && (
          <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 border border-slate-300 dark:border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
              </button>

              {/* Breadcrumb Navigation */}
              <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold text-slate-500 whitespace-nowrap">
                <button
                  type="button"
                  onClick={onBack}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 sm:gap-1.5 text-slate-600 dark:text-slate-400 shrink-0"
                >
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                </button>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                <button type="button" onClick={onBack} className="hover:text-slate-900 dark:hover:text-white transition-colors uppercase font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  SHOP
                </button>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-bold shrink-0">{displayCategoryBadge}</span>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                <span className="text-[#009245] font-black max-w-[120px] sm:max-w-[200px] md:max-w-[320px] lg:max-w-none truncate">{title}</span>
              </nav>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs text-slate-700 dark:text-slate-300 font-mono font-bold hover:text-[#009245] transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 whitespace-nowrap shrink-0 hidden sm:inline-block shadow-2xs"
                title="কোড কপি করতে ক্লিক করুন"
              >
                {copiedCode ? '✓ কোড কপি' : `Code: #${currentProduct.productCode}`}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MAIN PRODUCT UI SHOWCASE CONTAINER (Solid White Card)           */}
        {/* ------------------------------------------------------------- */}
        <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-300 ${isPreview ? 'p-2 sm:p-2.5 shadow-none border-0' : 'p-2.5 sm:p-5 shadow-xs'} space-y-3`}>
          
          {/* ========================================================= */}
          {/* DESKTOP VIEW (hidden lg:grid grid-cols-12 gap-6 items-start) */}
          {/* ========================================================= */}
          <div className="hidden lg:grid grid-cols-12 gap-6 items-start">
            
            {/* DESKTOP LEFT COLUMN (6 Columns) */}
            <div className="col-span-6 space-y-3.5">
              
              {/* Gallery (Thumbnails + HD Display) */}
              <div className="flex flex-row gap-3.5 items-stretch w-full h-[480px] lg:h-[510px]">
                
                {/* Thumbnails Column */}
                <div className="relative flex flex-col items-center w-[56px] shrink-0 h-full py-0.5">
                  {canScrollUp && (
                    <button
                      type="button"
                      onClick={handleScrollThumbnailsUp}
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-[#009245] shadow-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer z-20"
                      title={lang === 'bn' ? 'উপরে স্ক্রল করুন' : 'Scroll Up'}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}

                  <div
                    ref={thumbnailScrollRef}
                    onScroll={checkThumbnailScroll}
                    className="h-full w-full overflow-y-auto flex flex-col items-center gap-2 scrollbar-none py-1 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-[54px] h-[54px] min-w-[54px] min-h-[54px] max-w-[54px] max-h-[54px] aspect-square rounded-xl overflow-hidden cursor-pointer bg-white shrink-0 transition-all p-0.5 flex items-center justify-center ${
                          activeImageIndex === idx
                            ? 'border-2 border-[#009245] shadow-xs'
                            : 'border border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover aspect-square rounded-lg" />
                      </button>
                    ))}
                  </div>

                  {canScrollDown && (
                    <button
                      type="button"
                      onClick={handleScrollThumbnailsDown}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white hover:bg-slate-100 text-slate-700 hover:text-[#009245] shadow-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer z-20"
                      title={lang === 'bn' ? 'নিচে স্ক্রল করুন' : 'Scroll Down'}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* HD Main Image Container */}
                <div className="flex-1 h-full min-w-0">
                  <div
                    onMouseMove={(e) => {
                      if (!zoomMode) return;
                      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
                      const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
                      setMousePos({ x, y });
                    }}
                    onTouchStart={(e) => {
                      if (!zoomMode || !e.touches[0]) return;
                      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
                      const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
                      setMousePos({ x, y });
                    }}
                    onTouchMove={(e) => {
                      if (!zoomMode || !e.touches[0]) return;
                      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
                      const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
                      setMousePos({ x, y });
                    }}
                    className={`relative h-full w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-300 flex items-center justify-center p-2 group shadow-inner transition-all duration-200 select-none ${
                      zoomMode ? 'touch-none cursor-crosshair' : ''
                    }`}
                  >
                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 z-10 text-xs font-black text-white bg-rose-600 px-2.5 py-1 rounded-md shadow-xs">
                        {discountPercent}% ছাড়
                      </span>
                    )}

                    {/* Main Full HD Image */}
                    <img
                      src={activeImage}
                      alt={title}
                      className={`max-w-full max-h-full w-auto h-auto object-contain rounded-xl ${
                        zoomMode ? 'transition-none cursor-crosshair' : 'transition-transform duration-200'
                      }`}
                      style={{
                        transform: zoomMode ? 'scale(3.2)' : 'scale(1)',
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                        willChange: zoomMode ? 'transform, transform-origin' : 'auto',
                        imageRendering: 'high-quality' as any,
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                      }}
                      loading="eager"
                    />

                    {/* Floating Sleek Minimalist Zoom Lens Indicator */}
                    {zoomMode && (
                      <div
                        className="absolute pointer-events-none z-20 w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/90 bg-emerald-500/15 ring-2 ring-white/80 shadow-xs flex items-center justify-center"
                        style={{
                          left: `${mousePos.x}%`,
                          top: `${mousePos.y}%`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 border border-white shadow-2xs" />
                      </div>
                    )}

                    {/* Single Image Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(activeImage, activeImageIndex)}
                      className="absolute bottom-3 left-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 text-slate-700 hover:text-[#009245] transition-all hover:scale-115 cursor-pointer z-10 focus:outline-none shadow-md group"
                      title="ছবি ডাউনলোড করুন"
                    >
                      <Download className="w-5 h-5 animate-bounce text-[#009245]" />
                    </button>

                    {/* Wishlist Heart Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(currentProduct);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10 focus:outline-none shadow-md"
                      title={lang === 'bn' ? 'পছন্দের তালিকায় রাখুন/বাদ দিন' : 'Toggle favorite'}
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors animate-pulse ${
                          isWishlisted
                            ? 'fill-rose-600 text-rose-600 drop-shadow-sm'
                            : 'text-slate-500 hover:text-rose-600'
                        }`}
                      />
                    </button>

                    {/* Zoom Toggle Floating Icon */}
                    <button
                      type="button"
                      onClick={() => setZoomMode(!zoomMode)}
                      className={`absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 transition-all cursor-pointer z-10 focus:outline-none hover:scale-115 shadow-md ${
                        zoomMode
                          ? 'text-[#009245] border-emerald-300'
                          : 'text-slate-700 hover:text-[#009245]'
                      }`}
                      title={zoomMode ? 'জুম বন্ধ করুন' : 'জুম করুন'}
                    >
                      {zoomMode ? <ZoomOut className="w-5 h-5 animate-pulse text-[#009245]" /> : <ZoomIn className="w-5 h-5 animate-pulse text-slate-700" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Row below Main Image: Rating Badge & Copy/Download Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                {/* Star Rating Capsule */}
                <div className="flex items-center gap-1.5 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-full shadow-3xs shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                  <span className="text-xs font-black text-[#d97706] font-mono">{ratingVal}</span>
                  <span className="text-xs text-[#b45309] font-bold">({lang === 'bn' ? 'রেটিং' : 'Rating'})</span>
                </div>

                {/* Post Copy & All Download Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isResellerPortal && (
                    <button
                      type="button"
                      onClick={handleCopyMarketingPost}
                      className="px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 text-xs font-black text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-3xs shrink-0 whitespace-nowrap"
                    >
                      {copiedPost ? <Check className="w-4 h-4 text-[#009245]" /> : <Copy className="w-4 h-4 text-blue-500 animate-pulse" />}
                      <span>{copiedPost ? '✓ কপি' : (lang === 'bn' ? 'পোস্ট কপি' : 'Copy Post')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDownloadAllImages}
                    disabled={isDownloadingAll}
                    className="px-3.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50/80 text-xs font-black text-[#009245] hover:bg-emerald-100 hover:border-emerald-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-3xs shrink-0 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 text-[#009245] animate-bounce" />
                    <span>{isDownloadingAll ? (lang === 'bn' ? 'ডাউনলোড...' : 'Down...') : (lang === 'bn' ? 'সব ডাউনলোড' : 'All Download')}</span>
                  </button>
                </div>
              </div>

              {/* Header: Title + Stock Status Badge (Moved here below Rating/Buttons) */}
              <div className="flex items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-100">
                <h1 className="font-black text-slate-900 leading-snug text-base lg:text-lg flex-1 min-w-0" title={title}>
                  {title}
                </h1>

                <div className="flex items-center gap-1.5 text-xs font-black text-[#009245] bg-[#eafff3] px-3 py-1 rounded-full border border-[#bbf7d0] shadow-2xs shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#009245]"></span>
                  </span>
                  <span>{lang === 'bn' ? 'স্টকে আছে' : 'In Stock'}</span>
                </div>
              </div>

              {/* Pricing Display */}
              {isResellerPortal ? (
                /* Reseller Mode: 3 Columns (মূল দাম, বিক্রি দাম, আপনার প্রফিট) */
                <div className="grid grid-cols-3 bg-[#eef8f2] rounded-2xl p-3.5 border border-emerald-300 text-center shadow-3xs divide-x divide-emerald-300">
                  <div className="px-2 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-500 block mb-0.5 whitespace-nowrap">{lang === 'bn' ? 'মূল দাম' : 'Base Price'}</span>
                    <span className="text-base lg:text-lg font-black text-slate-900 font-mono tracking-tight">
                      ৳{(baseCostPrice * quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-2 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-500 block mb-0.5 whitespace-nowrap">{lang === 'bn' ? 'বিক্রি দাম' : 'Selling Price'}</span>
                    <span className="text-base lg:text-lg font-black text-rose-600 font-mono tracking-tight">
                      ৳{(livePrice * quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-2 flex flex-col justify-center items-center">
                    <span className="text-xs font-black text-emerald-800 block mb-0.5 whitespace-nowrap">{lang === 'bn' ? 'আপনার প্রফিট' : 'Your Profit'}</span>
                    <span className="text-base lg:text-lg font-black text-[#009245] font-mono tracking-tight bg-[#dcf2e3] px-3 py-0.5 rounded-xl inline-block">
                      +৳{(liveProfit * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                /* Public Customer Mode: Clean Professional Price Display */
                <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 via-slate-50/60 to-emerald-50/70 rounded-2xl border border-emerald-300 flex items-center justify-between shadow-3xs">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-0.5">
                      {lang === 'bn' ? 'বিক্রয়মূল্য' : 'Selling Price'}
                    </span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl lg:text-3xl font-black text-rose-600 font-mono tracking-tight">
                        ৳{(sellingPrice * quantity).toLocaleString()}
                      </span>
                      {regularPrice > sellingPrice && (
                        <span className="text-sm lg:text-base text-slate-400 line-through font-mono">
                          ৳{(regularPrice * quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {discountPercent > 0 && (
                      <span className="text-xs font-black text-[#009245] bg-[#eafff3] border border-emerald-300 px-2.5 py-1 rounded-xl shadow-2xs">
                        {discountPercent}% {lang === 'bn' ? 'ছাড়' : 'OFF'}
                      </span>
                    )}
                    {regularPrice > sellingPrice && (
                      <span className="text-[11px] font-bold text-emerald-700">
                        {lang === 'bn' ? `(৳${((regularPrice - sellingPrice) * quantity).toLocaleString()} সাশ্রয়)` : `Save ৳${((regularPrice - sellingPrice) * quantity).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* DESKTOP RIGHT COLUMN (6 Columns) */}
            <div className="col-span-6 space-y-3.5">
              
              {/* Product Description Box */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-300 space-y-2.5 shadow-3xs">
                <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-3xs">
                  <span className="text-sm">📝</span>
                  <span className="text-xs font-black text-emerald-900">
                    {lang === 'bn' ? 'পণ্যের বিবরণ:' : 'Description:'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line pt-1">
                  {fullDesc || shortDesc || 'এখানে অ্যাডমিন প্যানেল থেকে যোগ করা পণ্যের বিবরণ থাকবে।'}
                </p>

                {/* Dynamic Marketing Highlights from Admin Panel */}
                {currentProduct.marketingHighlights && currentProduct.marketingHighlights.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-xs font-black text-slate-800 block flex items-center gap-1">
                      <span>📌</span>
                      <span>{lang === 'bn' ? 'পণ্যের বৈশিষ্ট্য:' : 'Highlights:'}</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {currentProduct.marketingHighlights.map((hl, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#009245] shrink-0" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Size Selection Pill Card */}
              {availableSizes.length > 0 && (
                <div className="p-3.5 bg-white rounded-2xl border border-slate-300 space-y-2 shadow-3xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>{lang === 'bn' ? 'সাইজ সিলেক্ট করুন:' : 'Select Size:'}</span>
                      <span className="text-[#009245]">*</span>
                    </label>
                    <span className="text-xs font-bold font-mono">
                      {lang === 'bn' ? 'সিলেক্টেড:' : 'Selected:'}{' '}
                      {selectedSize ? (
                        <span className="text-[#009245] font-black">{selectedSize}</span>
                      ) : (
                        <span className="text-rose-600 font-bold">{lang === 'bn' ? 'বাছাই করা হয়নি' : 'None'}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          selectedSize === size
                            ? 'bg-[#009245] text-white border-[#009245] shadow-xs scale-105'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-[#009245] hover:bg-emerald-50/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reseller custom price input vs Public quantity box */}
              {isResellerPortal ? (
                /* Reseller Mode: Custom Selling Price & Quantity Stepper */
                <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-3 sm:gap-4 shadow-2xs">
                  {/* Selling Price Input Field */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 block whitespace-nowrap">
                        {lang === 'bn' ? 'বিক্রয় মূল্য (৳):' : 'Selling Price (৳):'}
                      </label>
                      {isPriceValid && (
                        <span className="text-xs sm:text-sm font-black text-[#009245] font-mono whitespace-nowrap">
                          +৳{(liveProfit * quantity).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm sm:text-base font-black text-slate-400 font-mono pointer-events-none">৳</span>
                      <input
                        type="number"
                        value={customSellingPrice === 0 || customSellingPrice === '0' || customSellingPrice === '' ? '' : customSellingPrice}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          if (rawVal === '') {
                            setCustomSellingPrice('');
                          } else {
                            const num = Number(rawVal);
                            setCustomSellingPrice(isNaN(num) ? '' : num);
                          }
                        }}
                        className={`w-full h-11 sm:h-12 pl-8 sm:pl-9 pr-3 text-sm sm:text-base md:text-lg font-black font-mono rounded-xl border outline-none transition-all shadow-3xs ${
                          isPriceValid
                            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 focus:border-[#009245] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800'
                            : 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-500'
                        }`}
                        placeholder={lang === 'bn' ? 'মূল্য লিখুন' : 'Enter price'}
                      />
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 block whitespace-nowrap">
                      {lang === 'bn' ? 'পরিমাণ (পিস):' : 'Quantity:'}
                    </label>

                    <div className="h-11 sm:h-12 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-xl p-1 sm:p-1.5 shadow-3xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
                        title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                      >
                        <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-1">
                        <input
                          type="number"
                          min={1}
                          value={quantity || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setQuantity(isNaN(val) || val < 1 ? 1 : val);
                          }}
                          className="w-10 sm:w-14 text-center text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono bg-transparent outline-none p-0 border-none"
                        />
                        <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">{lang === 'bn' ? 'পিস' : 'pcs'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
                        title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Public Customer Mode: Clean Quantity Stepper & Price Summary */
                <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                  <div>
                    <label className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 block">
                      {lang === 'bn' ? 'পরিমাণ (পিস):' : 'Quantity:'}
                    </label>
                    <span className="text-xs font-semibold text-slate-500">
                      {lang === 'bn' ? 'সর্বমোট মূল্য:' : 'Total:'}{' '}
                      <span className="font-black text-rose-600 font-mono">৳{(sellingPrice * quantity).toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="h-11 sm:h-12 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-xl p-1 sm:p-1.5 shadow-3xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
                      title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                    >
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-3">
                      <input
                        type="number"
                        min={1}
                        value={quantity || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setQuantity(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="w-10 sm:w-14 text-center text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white font-mono bg-transparent outline-none p-0 border-none"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 shrink-0">{lang === 'bn' ? 'পিস' : 'pcs'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
                      title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Action Buttons Row */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Cart Button */}
                <button
                  type="button"
                  onClick={() => handleAddToCart()}
                  className="py-3 px-3 text-xs lg:text-sm font-black text-[#009245] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4 text-[#009245]" />
                  <span>{lang === 'bn' ? 'কার্ট করুন' : 'Add to Cart'}</span>
                </button>

                {/* Order Button */}
                <button
                  type="button"
                  onClick={() => {
                    const productWithImage = {
                      ...currentProduct,
                      sellingPrice: livePrice,
                      selectedImageUrl: activeImage,
                      imageUrl: activeImage,
                    };

                    const isAddingToOrder = typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true';
                    if (isAddingToOrder) {
                      try {
                        const existingItemsRaw = sessionStorage.getItem('tawzoon_pending_order_items');
                        let currentItems = existingItemsRaw ? JSON.parse(existingItemsRaw) : [];
                        if (!Array.isArray(currentItems)) currentItems = [];

                        const newItem = {
                          productId: currentProduct.id,
                          originalProduct: productWithImage,
                          productName: lang === 'bn' ? (currentProduct.nameBn || 'Product') : (currentProduct.nameEn || currentProduct.nameBn || 'Product'),
                          productCode: currentProduct.productCode,
                          imageUrl: activeImage,
                          size: selectedSize || availableSizes[0] || 'M',
                          quantity: quantity || 1,
                          unitPrice: livePrice,
                        };

                        currentItems.push(newItem);
                        sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(currentItems));
                        window.dispatchEvent(new Event('tawzoon_order_mode_changed'));

                        showToast(lang === 'bn' ? `✓ পণ্যটি অর্ডারে যুক্ত হয়েছে!` : `✓ Added product to Order!`, 'success');
                        openCheckoutModal(
                          currentItems.map((it: any) => ({
                            product: it.originalProduct || it.product || productWithImage,
                            size: it.size,
                            quantity: it.quantity,
                          }))
                        );
                        return;
                      } catch {}
                    }

                    openCheckoutModal([{
                      product: productWithImage,
                      size: selectedSize || availableSizes[0] || 'M',
                      quantity: quantity,
                    }]);
                  }}
                  className="py-3 px-3 text-xs lg:text-sm font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {isAddingToOrderMode
                      ? (lang === 'bn' ? 'অর্ডারে যুক্ত করুন (+১)' : 'Add to Order (+1)')
                      : (selectedSize
                          ? (lang === 'bn' ? `অর্ডার করুন (${selectedSize})` : `Order Now (${selectedSize})`)
                          : (lang === 'bn' ? 'অর্ডার করুন' : 'Order Now'))}
                  </span>
                </button>
              </div>

            </div>

          </div>

          {/* ========================================================= */}
          {/* MOBILE VIEW (block lg:hidden) - Unchanged                      */}
          {/* ========================================================= */}
          <div className="block lg:hidden space-y-3">
            <div className="grid grid-cols-1 gap-3.5 items-start">
              
              {/* LEFT COLUMN: Gallery & Marketing actions */}
              <div className="space-y-2.5">
                <div className="flex flex-row gap-2 sm:gap-3 items-stretch w-full h-[340px] sm:h-[380px]">
                  
                  <div className="relative flex flex-col items-center w-[46px] shrink-0 h-full py-0.5">
                    {canScrollUp && (
                      <button
                        type="button"
                        onClick={handleScrollThumbnailsUp}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white hover:bg-slate-100 text-slate-700 shadow-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer z-20"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                    )}

                    <div
                      ref={thumbnailScrollRef}
                      onScroll={checkThumbnailScroll}
                      className="h-full w-full overflow-y-auto flex flex-col items-center gap-1.5 scrollbar-none py-1 scroll-smooth"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-[44px] h-[44px] min-w-[44px] min-h-[44px] aspect-square rounded-xl overflow-hidden cursor-pointer bg-white shrink-0 transition-all p-0.5 flex items-center justify-center ${
                            activeImageIndex === idx
                              ? 'border-2 border-[#009245] shadow-xs'
                              : 'border border-slate-200 opacity-75'
                          }`}
                        >
                          <img src={img} alt="thumb" className="w-full h-full object-cover aspect-square rounded-lg" />
                        </button>
                      ))}
                    </div>

                    {canScrollDown && (
                      <button
                        type="button"
                        onClick={handleScrollThumbnailsDown}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white hover:bg-slate-100 text-slate-700 shadow-xs border border-slate-200 flex items-center justify-center transition-all cursor-pointer z-20"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 h-full min-w-0">
                    <div
                      onMouseMove={(e) => {
                        if (!zoomMode) return;
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
                        const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
                        setMousePos({ x, y });
                      }}
                      onTouchStart={(e) => {
                        if (!zoomMode || !e.touches[0]) return;
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
                        const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
                        setMousePos({ x, y });
                      }}
                      onTouchMove={(e) => {
                        if (!zoomMode || !e.touches[0]) return;
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const touch = e.touches[0];
                        const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
                        const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
                        setMousePos({ x, y });
                      }}
                      className={`relative h-full w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/90 flex items-center justify-center p-2 group shadow-inner transition-all duration-200 select-none ${
                        zoomMode ? 'touch-none cursor-crosshair' : ''
                      }`}
                    >
                      {discountPercent > 0 && (
                        <span className="absolute top-2.5 left-2.5 z-10 text-[9.5px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded-md leading-none shadow-xs">
                          {discountPercent}% ছাড়
                        </span>
                      )}

                      <img
                        src={activeImage}
                        alt={title}
                        className={`max-w-full max-h-full w-auto h-auto object-contain rounded-xl ${
                          zoomMode ? 'transition-none cursor-crosshair' : 'transition-transform duration-200'
                        }`}
                        style={{
                          transform: zoomMode ? 'scale(3.2)' : 'scale(1)',
                          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                          willChange: zoomMode ? 'transform, transform-origin' : 'auto',
                          imageRendering: 'high-quality' as any,
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden',
                        }}
                        loading="eager"
                      />

                      {/* Floating Sleek Minimalist Zoom Lens Indicator */}
                      {zoomMode && (
                        <div
                          className="absolute pointer-events-none z-20 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/90 bg-emerald-500/15 ring-2 ring-white/80 shadow-xs flex items-center justify-center"
                          style={{
                            left: `${mousePos.x}%`,
                            top: `${mousePos.y}%`,
                          }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 border border-white shadow-2xs" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(activeImage, activeImageIndex)}
                        className="absolute bottom-2.5 left-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 text-slate-700 hover:text-[#009245] transition-all hover:scale-115 cursor-pointer z-10 shadow-md"
                        title="ছবি ডাউনলোড করুন"
                      >
                        <Download className="w-4 h-4 animate-bounce text-[#009245]" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(currentProduct);
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10 shadow-md"
                        title={lang === 'bn' ? 'পছন্দের তালিকায় রাখুন/বাদ দিন' : 'Toggle favorite'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors animate-pulse ${
                            isWishlisted ? 'fill-rose-600 text-rose-600' : 'text-slate-500 hover:text-rose-600'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setZoomMode(!zoomMode)}
                        className={`absolute bottom-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 transition-all cursor-pointer z-10 hover:scale-115 shadow-md ${
                          zoomMode
                            ? 'text-[#009245] border-emerald-300'
                            : 'text-slate-700 hover:text-[#009245]'
                        }`}
                        title={zoomMode ? 'জুম বন্ধ করুন' : 'জুম করুন'}
                      >
                        {zoomMode ? <ZoomOut className="w-4 h-4 animate-pulse text-[#009245]" /> : <ZoomIn className="w-4 h-4 animate-pulse text-slate-700" />}
                      </button>
                    </div>
                  </div>

                </div>

                <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-2 py-1 rounded-full shadow-3xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                    <span className="text-[10.5px] font-black text-[#d97706] font-mono">{ratingVal}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyMarketingPost}
                      className="px-2 py-1 rounded-full border border-blue-200 bg-blue-50/70 text-[10px] font-black text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {copiedPost ? <Check className="w-3 h-3 text-[#009245]" /> : <Copy className="w-3 h-3 text-blue-500 animate-pulse" />}
                      <span>{copiedPost ? '✓ কপি' : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAllImages}
                      disabled={isDownloadingAll}
                      className="px-2 py-1 rounded-full border border-emerald-300 bg-emerald-50/80 text-[10px] font-black text-[#009245] hover:bg-emerald-100 hover:border-emerald-400 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Download className="w-3 h-3 text-[#009245] animate-bounce" />
                      <span>{isDownloadingAll ? 'ডাউনলোড...' : 'সব ডাউনলোড'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <h1 className="font-black text-slate-900 leading-tight text-base truncate" title={title}>
                    {title}
                  </h1>
                  <div className="flex items-center gap-1 text-[11px] font-black text-[#009245] bg-[#eafff3] px-2 py-0.5 rounded-full border border-[#bbf7d0] shrink-0">
                    <span>● স্টকে আছে</span>
                  </div>
                </div>

                <div className="p-2.5 bg-gradient-to-r from-emerald-50/80 via-slate-50/80 to-emerald-50/80 rounded-xl border border-emerald-100 flex items-center justify-between shadow-3xs">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 block mb-0.5">বিক্রয়মূল্য</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-rose-600 font-mono">
                        ৳{(sellingPrice * quantity).toLocaleString()}
                      </span>
                      {regularPrice > sellingPrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          ৳{(regularPrice * quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {discountPercent > 0 && (
                    <span className="text-[10.5px] font-black text-[#009245] bg-[#eafff3] border border-[#bbf7d0] px-2 py-0.5 rounded-lg">
                      {discountPercent}% ছাড়
                    </span>
                  )}
                </div>

                {(fullDesc || shortDesc) && (
                  <div className="space-y-1 pt-1">
                    <h4 className="text-xs font-bold text-slate-800">পণ্যের বিবরণ:</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      {fullDesc || shortDesc}
                    </p>
                  </div>
                )}

                <div className="p-2.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5 shadow-3xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800">সাইজ সিলেক্ট করুন:</label>
                      <span className="text-[10.5px] font-bold font-mono">
                        সিলেক্টেড: <span className="text-[#009245] font-black">{selectedSize || availableSizes[0] || 'M'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-[#009245] text-white border-[#009245]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                    <span className="text-xs font-bold text-slate-700">পরিমাণ (পিস):</span>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black font-mono text-slate-900">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddToCart()}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-[#009245] font-black text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#009245]" />
                    <span>কার্ট করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const productWithImage = {
                        ...currentProduct,
                        sellingPrice: livePrice,
                        selectedImageUrl: activeImage,
                        imageUrl: activeImage,
                      };

                      const isPublicAdding = typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true';
                      const isResellerAdding = typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true';

                      if (isPublicAdding) {
                        try {
                          const existingItemsRaw = sessionStorage.getItem('tawzoon_pending_order_items');
                          let currentItems = existingItemsRaw ? JSON.parse(existingItemsRaw) : [];
                          if (!Array.isArray(currentItems)) currentItems = [];

                          const newItem = {
                            productId: currentProduct.id,
                            originalProduct: productWithImage,
                            productName: lang === 'bn' ? (currentProduct.nameBn || 'Product') : (currentProduct.nameEn || currentProduct.nameBn || 'Product'),
                            productCode: currentProduct.productCode,
                            imageUrl: activeImage,
                            size: selectedSize || availableSizes[0] || 'M',
                            quantity: quantity || 1,
                            unitPrice: livePrice,
                          };

                          currentItems.push(newItem);
                          sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(currentItems));
                          window.dispatchEvent(new Event('tawzoon_order_mode_changed'));

                          showToast(lang === 'bn' ? '✓ পণ্যটি অর্ডারে যুক্ত হয়েছে!' : '✓ Added product to Order!', 'success');
                          openCheckoutModal(
                            currentItems.map((it: any) => ({
                              product: it.originalProduct || it.product || productWithImage,
                              size: it.size,
                              quantity: it.quantity,
                            }))
                          );
                          return;
                        } catch {}
                      }

                      if (isResellerAdding) {
                        try {
                          const existingRaw = sessionStorage.getItem('tawzoon_reseller_pending_order_items');
                          let currentItems = existingRaw ? JSON.parse(existingRaw) : [];
                          if (!Array.isArray(currentItems)) currentItems = [];

                          const newItem = {
                            productId: currentProduct.id,
                            product: productWithImage,
                            productName: lang === 'bn' ? (currentProduct.nameBn || 'Product') : (currentProduct.nameEn || currentProduct.nameBn || 'Product'),
                            productCode: currentProduct.productCode,
                            productImage: activeImage,
                            size: selectedSize || availableSizes[0] || 'M',
                            quantity: quantity || 1,
                            sellingPrice: livePrice,
                            regularPrice: currentProduct.sellingPrice || (currentProduct as any).price || 0,
                            commission: (currentProduct as any).resellerCommission || (currentProduct as any).commission || 0,
                          };

                          currentItems.push(newItem);
                          sessionStorage.setItem('tawzoon_reseller_pending_order_items', JSON.stringify(currentItems));
                          window.dispatchEvent(new Event('tawzoon_reseller_order_mode_changed'));
                          window.dispatchEvent(
                            new CustomEvent('tawzoon_open_reseller_checkout', {
                              detail: { items: currentItems },
                            })
                          );
                          showToast(lang === 'bn' ? '✓ পণ্যটি রিসেলার অর্ডারে যুক্ত হয়েছে!' : '✓ Added to Reseller Order!', 'success');
                          return;
                        } catch {}
                      }

                      openCheckoutModal([{
                        product: productWithImage,
                        size: selectedSize || availableSizes[0] || 'M',
                        quantity: quantity,
                      }]);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    {isAddingToOrderMode ? (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'অর্ডারে যুক্ত করুন (+১)' : 'Add to Order (+1)'}</span>
                      </>
                    ) : (
                      <span>
                        {selectedSize
                          ? (lang === 'bn' ? `এখনই অর্ডার করুন (${selectedSize})` : `Order Now (${selectedSize})`)
                          : (lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now')}
                      </span>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUBSEQUENT / RELATED PRODUCTS IN SAME CATEGORY                  */}
        {/* ------------------------------------------------------------- */}
        {!isPreview && subsequentProducts.length > 0 && (
          <div className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 bg-[#009245] rounded-full inline-block" />
              <h3 className="text-lg font-black text-slate-900">
                {lang === 'bn' ? 'এই ক্যাটাগরির অন্যান্য পণ্যসমূহ' : 'More Products in this Category'}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {subsequentProducts.slice(0, 10).map((relProd) => (
                <ProductCard
                  key={relProd.id}
                  product={relProd}
                  onCardClick={() => handleSelectRelated(relProd)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* RESELLER CONTACT NOTICE MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {isQuickOrderOpen && (
        <div className="fixed inset-0 z-[100001] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col my-auto">
            
            {/* Header Frame */}
            <div className="p-3.5 sm:p-4 bg-[#009245] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-200" />
                <h3 className="text-sm sm:text-base font-black">
                  {lang === 'bn' ? 'রিসেলারের সাথে যোগাযোগ করুন' : 'Contact Reseller'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickOrderOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

             {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 text-center">
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-line">
                  {publicNotice}
                </p>
                <div className="pt-1 flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href={`tel:${publicHelpline.replace(/[^0-9+]/g, '')}`}
                    className="text-xs sm:text-sm font-black text-white bg-[#009245] hover:bg-[#007a3a] px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>কল দিন: {publicHelpline}</span>
                  </a>
                </div>
              </div>

              {/* Product Media Action Row */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-left">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentProduct.images?.[activeImageIndex]?.url || currentProduct.images?.[0]?.url || '/images/product_shop_dress_1790244714775.jpg'}
                    alt={title}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {title}
                    </h5>
                    <p className="text-[10.5px] text-slate-500 font-bold font-mono">
                      কোড: #{currentProduct.productCode || 'TNX'} {selectedSize ? `| সাইজ: ${selectedSize}` : ''}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50">
                  <button
                    type="button"
                    onClick={async () => {
                      const imgUrl = currentProduct.images?.[activeImageIndex]?.url || currentProduct.images?.[0]?.url || '';
                      if (!imgUrl) return;
                      try {
                        const res = await fetch(imgUrl);
                        const blob = await res.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = objectUrl;
                        a.download = `product-${currentProduct.productCode || 'TNX'}-${activeImageIndex + 1}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(objectUrl);
                        showToast(lang === 'bn' ? 'ছবি ডাউনলোড শুরু হয়েছে!' : 'Image download started!', 'success');
                      } catch {
                        const a = document.createElement('a');
                        a.href = imgUrl;
                        a.target = '_blank';
                        a.download = `product-${currentProduct.productCode || 'TNX'}-${activeImageIndex + 1}.jpg`;
                        a.click();
                        showToast(lang === 'bn' ? 'ছবি ওপেন হয়েছে, ডাউনলোড করুন' : 'Image opened to download', 'info');
                      }
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-black rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>ছবি ডাউনলোড</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : '';
                      const refId = employee?.id || '';
                      const link = `${origin}/?ref=${refId}&product=${currentProduct.productCode || ''}`;
                      navigator.clipboard.writeText(link);
                      showToast(lang === 'bn' ? 'লিংক ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Link copied to clipboard!', 'success');
                    }}
                    className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-black rounded-lg border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#009245]" />
                    <span>লিংক কপি করুন</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={
                    publicWhatsapp.startsWith('http')
                      ? (publicWhatsapp.includes('text=') ? publicWhatsapp : `${publicWhatsapp}${publicWhatsapp.includes('?') ? '&' : '?'}text=${encodeURIComponent(`আসসালামু আলাইকুম! আমি "${title}" (কোড: #${currentProduct.productCode}${selectedSize ? `, সাইজ: ${selectedSize}` : ''}) পণ্যটি অর্ডার করতে চাই।`)}`)
                      : `https://wa.me/${(() => {
                          let digits = publicWhatsapp.replace(/[^0-9]/g, '');
                          if (digits.startsWith('0')) return '88' + digits;
                          if (!digits.startsWith('88') && digits.length === 10) return '88' + digits;
                          return digits;
                        })()}?text=${encodeURIComponent(`আসসালামু আলাইকুম! আমি "${title}" (কোড: #${currentProduct.productCode}${selectedSize ? `, সাইজ: ${selectedSize}` : ''}) পণ্যটি অর্ডার করতে চাই।`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে মেসেজ দিন' : 'Message on WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsQuickOrderOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer border border-slate-200"
                >
                  <span>{lang === 'bn' ? 'ঠিক আছে / স্কিপ' : 'Okay / Skip'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
