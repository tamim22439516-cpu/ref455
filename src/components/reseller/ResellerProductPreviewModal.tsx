import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Link2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Tag,
  Ruler,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';
import { getAdjustedSellingPrice, getAdjustedRegularPrice, getResellerProfitPerUnit, getResellerWholesalePrice } from '../../utils/pricing.js';
import { getProductSizes } from '../../utils/productSizes.js';
import { isCategoryMatch } from '../ShopCategoryPage.js';
import { ResellerOrderCheckoutModal, CheckoutOrderItem } from './ResellerOrderCheckoutModal.js';

interface ResellerProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onTakeForSelling?: (product: Product) => void;
}

export const ResellerProductPreviewModal: React.FC<ResellerProductPreviewModalProps> = ({
  product,
  isOpen,
  onClose,
  onTakeForSelling,
}) => {
  const { lang, employee, brandSettings, addToCart, wishlistItems = [], toggleWishlist, showToast } = useApp();
  const isWishlisted = product ? wishlistItems.some(p => p.id === product.id) : false;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Sizes setup
  const availableSizes = getProductSizes(product);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const isGadgetOrOther = product ? (
    isCategoryMatch(product.categorySlug, 'gadgets') ||
    isCategoryMatch(product.categorySlug, 'gajet') ||
    isCategoryMatch(product.categorySlug, 'others') ||
    isCategoryMatch(product.categorySlug, 'other') ||
    availableSizes.length === 0
  ) : false;

  const [customSellingPrice, setCustomSellingPrice] = useState<number | string>(() => {
    if (!product) return 0;
    const isGOrO = isCategoryMatch(product.categorySlug, 'gadgets') ||
      isCategoryMatch(product.categorySlug, 'gajet') ||
      isCategoryMatch(product.categorySlug, 'others') ||
      isCategoryMatch(product.categorySlug, 'other') ||
      availableSizes.length === 0;
    return isGOrO ? 0 : getAdjustedSellingPrice(product, employee, brandSettings);
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [isDirectCheckoutOpen, setIsDirectCheckoutOpen] = useState(false);

  // Adjusted pricing
  const adjustedSellingPrice = product ? getAdjustedSellingPrice(product, employee, brandSettings) : 0;
  const adjustedRegularPrice = product ? getAdjustedRegularPrice(product, employee, brandSettings) : 0;
  const commission = product ? getResellerProfitPerUnit(product, employee, brandSettings) : 0;

  // Reset custom price, quantity & unselect size when product changes/opens
  React.useEffect(() => {
    if (product && isOpen) {
      const sizes = getProductSizes(product);
      const isGOrO = isCategoryMatch(product.categorySlug, 'gadgets') ||
        isCategoryMatch(product.categorySlug, 'gajet') ||
        isCategoryMatch(product.categorySlug, 'others') ||
        isCategoryMatch(product.categorySlug, 'other') ||
        sizes.length === 0;
      const adjPrice = getAdjustedSellingPrice(product, employee, brandSettings);
      setCustomSellingPrice(isGOrO ? 0 : adjPrice);
      setSelectedSize(null);
      setQuantity(1);
      setIsDirectCheckoutOpen(false);
    }
  }, [product?.id, isOpen]);

  // Thumbnail list scroll management
  const thumbnailScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  // Filter images only (exclude video URLs)
  const images = product?.images && product.images.length > 0
    ? product.images.filter(img => img.url && !img.url.endsWith('.mp4')).map(img => img.url)
    : [product?.imageUrl || '/images/product_shop_dress_1790244714775.jpg'];

  const activeImage = images[activeImageIndex] || images[0];

  const checkThumbnailScroll = () => {
    if (thumbnailScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = thumbnailScrollRef.current;
      setCanScrollDown(scrollHeight - scrollTop - clientHeight > 8);
      setCanScrollUp(scrollTop > 8);
    }
  };

  React.useEffect(() => {
    if (isOpen && product) {
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
    }
  }, [images, isOpen, product]);

  if (!isOpen || !product) return null;

  const showInModalNotice = (msg: string, duration = 2200) => {
    setDownloadNotice(msg);
    setTimeout(() => setDownloadNotice(null), duration);
  };

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

  // Category name formatting: Keeps up to 2 full words without breaking single words like "কাতুয়া"
  const rawCategoryName = product.subcategoryBn || product.categorySlug || 'কাতুয়া';
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

  const baseCostPrice = getResellerWholesalePrice(product, employee, brandSettings);

  const starCount = product.starRating || 5;
  const regularPrice = adjustedRegularPrice > adjustedSellingPrice ? adjustedRegularPrice : Math.round(adjustedSellingPrice * 1.25);
  const discountPercent = regularPrice > adjustedSellingPrice
    ? Math.round(((regularPrice - adjustedSellingPrice) / regularPrice) * 100)
    : 10;
  const ratingVal = product.starRating ? Number(product.starRating).toFixed(1) : '5.0';

  // Live custom pricing & validation
  const livePrice = customSellingPrice !== '' && !isNaN(Number(customSellingPrice)) && Number(customSellingPrice) > 0
    ? Number(customSellingPrice)
    : (isGadgetOrOther ? 0 : adjustedSellingPrice);

  const isPriceValid = isGadgetOrOther
    ? (customSellingPrice !== '' && customSellingPrice !== 0 && !isNaN(Number(customSellingPrice)) && Number(customSellingPrice) >= baseCostPrice && Number(customSellingPrice) > 0)
    : (livePrice >= baseCostPrice);

  // Reseller profit calculation (বিক্রয়মূল্য - পাইকারি মূল্য)
  const liveProfit = customSellingPrice !== '' && !isNaN(Number(customSellingPrice)) ? Math.max(0, Number(customSellingPrice) - baseCostPrice) : 0;

  // Copy Shareable Link
  const handleCopyShareableLink = () => {
    const link = employee
      ? `${window.location.origin}/?ref=${employee.id}&product=${product.productCode}`
      : `${window.location.origin}/?product=${product.productCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Copy Product Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.productCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
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
      const safeName = (product.nameBn || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
      link.download = `${product.productCode || 'TNX'}_${safeName}_${idx + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showInModalNotice('ছবি ডাউনলোড সম্পন্ন হয়েছে✓', 2200);
    } catch {
      const link = document.createElement('a');
      link.href = imgUrl;
      link.target = '_blank';
      link.download = `${product.productCode || 'TNX'}_${idx + 1}.jpg`;
      link.click();
      showInModalNotice('ছবি ডাউনলোড সম্পন্ন হয়েছে✓', 2200);
    }
  };

  // Download All Images (One by one sequentially)
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
        const safeName = (product.nameBn || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
        link.download = `${product.productCode || 'TNX'}_${safeName}_photo_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise(r => setTimeout(r, 450));
      } catch (err) {
        console.error('Failed to download image:', err);
      }
    }

    setIsDownloadingAll(false);
    showInModalNotice('সবগুলো ছবি ডাউনলোড সম্পন্ন হয়েছে✓', 3000);
  };

  // Copy Full Marketing Post
  const handleCopyMarketingPost = () => {
    const desc = product.shortDescBn || product.fullDescBn || '';
    const sizes = product.sizes && product.sizes.length > 0
      ? product.sizes.join(', ')
      : '';

    const text = `🛍️ পণ্য: ${product.nameBn}
📌 প্রডাক্ট কোড: ${product.productCode}
💰 অফার বিক্রয়মূল্য: ৳${product.sellingPrice.toLocaleString()} (রেগুলার ৳${regularPrice.toLocaleString()})
⭐ কাস্টমার রেটিং: ${ratingVal} / 5.0
${sizes ? `📐 উপলব্ধ সাইজ: ${sizes}\n` : ''}${desc ? `\n📝 পণ্যের বিবরণ:\n${desc}\n` : ''}
🚚 সারাদেশে দ্রুত হোম ডেলিভারি সুবিধা!
💵 ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন)
🛒 অর্ডার করতে এখনই আপনার নাম, মোবাইল নম্বর ও ঠিকানা লিখে মেসেজ করুন!`;

    navigator.clipboard.writeText(text);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2200);
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full animate-in fade-in duration-200">
      
      {/* 1. Top Header Bar with Back Button, Category Badge, Link Copy & Code (Strict Single-Line Row) */}
      <div className="bg-white rounded-2xl border border-slate-300 p-2 sm:p-2.5 shadow-2xs flex flex-nowrap items-center justify-between gap-1.5 sm:gap-2 w-full overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 active:scale-95 whitespace-nowrap border border-slate-300"
            title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 shrink-0" />
            <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
          </button>

          {/* Category Badge */}
          <span
            className="text-xs sm:text-[13px] font-black text-[#009245] bg-emerald-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-emerald-300 shrink-0 whitespace-nowrap truncate inline-block"
            title={rawCategoryName}
          >
            {displayCategoryBadge}
          </span>

          {/* Product Link Button */}
          <button
            type="button"
            onClick={handleCopyShareableLink}
            className="flex items-center gap-1 cursor-pointer whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-emerald-300 transition-colors shrink-0 text-xs font-bold text-[#009245]"
            title="লিংক কপি করতে ক্লিক করুন"
          >
            <Link2 className="w-3.5 h-3.5 text-[#009245] shrink-0" />
            <span>{copiedLink ? '✓ লিংক কপি' : (lang === 'bn' ? 'প্রোডাক্ট লিংক' : 'Product Link')}</span>
          </button>
        </div>

        {/* Product Code */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            type="button"
            onClick={handleCopyCode}
            className="text-xs font-mono font-bold text-slate-700 hover:text-[#009245] transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-300 whitespace-nowrap shrink-0 shadow-3xs"
            title="কোড কপি করতে ক্লিক করুন"
          >
            {copiedCode ? (lang === 'bn' ? '✓ কোড কপি' : '✓ Copied') : `Code: #${product.productCode}`}
          </button>
        </div>
      </div>

      {/* 2. Main Product Content Box */}
      <div className="bg-white rounded-2xl border border-slate-300 p-3 sm:p-5 shadow-2xs relative">
        
        {/* ========================================================= */}
        {/* DESKTOP VIEW (hidden md:grid grid-cols-12 gap-6 items-start) */}
        {/* ========================================================= */}
        <div className="hidden md:grid grid-cols-12 gap-6 items-start">
          
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
                    alt={product.nameBn}
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
                    className="absolute bottom-3 left-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-300 text-slate-700 hover:text-[#009245] transition-all hover:scale-115 cursor-pointer z-10 focus:outline-none shadow-md group"
                    title="ছবি ডাউনলোড করুন"
                  >
                    <Download className="w-5 h-5 animate-bounce text-[#009245]" />
                  </button>

                  {/* Wishlist Heart Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border border-slate-300 transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10 focus:outline-none shadow-md"
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
                    className={`absolute bottom-3 right-3 p-2 bg-white/90 backdrop-blur-xs rounded-xl border transition-all cursor-pointer z-10 focus:outline-none hover:scale-115 shadow-md ${
                      zoomMode
                        ? 'text-[#009245] border-emerald-400'
                        : 'text-slate-700 hover:text-[#009245] border-slate-300'
                    }`}
                    title={zoomMode ? 'জুম বন্ধ করুন' : 'জুম করুন'}
                  >
                    {zoomMode ? <ZoomOut className="w-5 h-5 animate-pulse text-[#009245]" /> : <ZoomIn className="w-5 h-5 animate-pulse text-slate-700" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Row below Main Image: Rating Badge & Copy/Download Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
              {/* Star Rating Capsule */}
              <div className="flex items-center gap-1.5 bg-[#fffbeb] border border-amber-300 px-3 py-1.5 rounded-full shadow-3xs shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                <span className="text-xs font-black text-[#d97706] font-mono">{ratingVal}</span>
                <span className="text-xs text-[#b45309] font-bold">({lang === 'bn' ? 'রেটিং' : 'Rating'})</span>
              </div>

              {/* Post Copy & All Download Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyMarketingPost}
                  className="px-3.5 py-1.5 rounded-full border border-blue-300 bg-blue-50/70 text-xs font-black text-blue-700 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-3xs shrink-0 whitespace-nowrap"
                >
                  {copiedPost ? <Check className="w-4 h-4 text-[#009245]" /> : <Copy className="w-4 h-4 text-blue-500 animate-pulse" />}
                  <span>{copiedPost ? '✓ কপি' : (lang === 'bn' ? 'পোস্ট কপি' : 'Copy Post')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAllImages}
                  disabled={isDownloadingAll}
                  className="px-3.5 py-1.5 rounded-full border border-emerald-400 bg-emerald-50/80 text-xs font-black text-[#009245] hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-3xs shrink-0 whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-[#009245] animate-bounce" />
                  <span>{isDownloadingAll ? (lang === 'bn' ? 'ডাউনলোড...' : 'Down...') : (lang === 'bn' ? 'সব ডাউনলোড' : 'All Download')}</span>
                </button>
              </div>
            </div>

            {/* Header: Title + Stock Status Badge */}
            <div className="flex items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-200">
              <h2 className="font-black text-slate-900 leading-snug text-base lg:text-lg flex-1 min-w-0" title={product.nameBn}>
                {product.nameBn}
              </h2>

              <div className="flex items-center gap-1.5 text-xs font-black text-[#009245] bg-[#eafff3] px-3 py-1 rounded-full border border-emerald-300 shadow-2xs shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#009245]"></span>
                </span>
                <span>{lang === 'bn' ? 'স্টকে আছে' : 'In Stock'}</span>
              </div>
            </div>

            {/* Pricing Summary Box (3 Columns in light emerald card) */}
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

          </div>

          {/* DESKTOP RIGHT COLUMN (6 Columns) */}
          <div className="col-span-6 space-y-3.5">

            {/* Product Description Box (Dynamic from Admin) with Bold Highlighted Heading */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-300 space-y-2.5 shadow-3xs">
              <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 shadow-3xs">
                <span className="text-sm">📝</span>
                <span className="text-xs font-black text-emerald-900">
                  {lang === 'bn' ? 'পণ্যের বিবরণ:' : 'Description:'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line pt-1">
                {product.shortDescBn || product.fullDescBn || product.shortDescEn || product.fullDescEn || 'এখানে অ্যাডমিন প্যানেল থেকে যোগ করা পণ্যের বিবরণ থাকবে।'}
              </p>

              {/* Dynamic Marketing Highlights from Admin Panel */}
              {product.marketingHighlights && product.marketingHighlights.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <span className="text-xs font-black text-slate-800 block flex items-center gap-1">
                    <span>📌</span>
                    <span>{lang === 'bn' ? 'পণ্যের বৈশিষ্ট্য:' : 'Highlights:'}</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {product.marketingHighlights.map((hl, idx) => (
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
            {!isGadgetOrOther && availableSizes.length > 0 && (
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

            {/* Selling Price & Quantity Input Row */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-300 grid grid-cols-2 gap-3 sm:gap-4 shadow-2xs">
              
              {/* Selling Price Input Field */}
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-black text-slate-800 block whitespace-nowrap">
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
                        ? 'bg-slate-50 border-slate-300 focus:border-[#009245] text-slate-900 focus:bg-white'
                        : 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-500'
                    }`}
                    placeholder={lang === 'bn' ? 'মূল্য লিখুন' : 'Enter price'}
                  />
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="space-y-1 sm:space-y-1.5">
                <label className="text-xs sm:text-sm font-black text-slate-800 block whitespace-nowrap">
                  {lang === 'bn' ? 'পরিমাণ (পিস):' : 'Quantity:'}
                </label>

                <div className="h-11 sm:h-12 flex items-center justify-between bg-slate-50 border border-slate-300 rounded-xl p-1 sm:p-1.5 shadow-3xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
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
                      className="w-10 sm:w-14 text-center text-sm sm:text-base md:text-lg font-black text-slate-900 font-mono bg-transparent outline-none p-0 border-none"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-500 shrink-0">{lang === 'bn' ? 'পিস' : 'pcs'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-3xs"
                    title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Desktop Action Buttons Row */}
            {(() => {
              const canProceed = isGadgetOrOther
                ? (isPriceValid && quantity >= 1)
                : (isPriceValid && Boolean(selectedSize) && quantity >= 1);
              return (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Cart Button */}
                  <button
                    type="button"
                    disabled={!canProceed}
                    onClick={() => {
                      if (!canProceed) return;
                      const customizedProduct: Product = {
                        ...product,
                        sellingPrice: livePrice,
                        commissionRate: liveProfit,
                        imageUrl: activeImage,
                        sizes: isGadgetOrOther ? [] : [selectedSize as string],
                        quantity: quantity,
                        originalProductId: product.id,
                      };
                      addToCart(customizedProduct);
                      onClose();
                    }}
                    className="py-3 px-3 text-xs lg:text-sm font-black text-[#009245] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0 text-[#009245]" />
                    <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                  </button>

                  {/* Order Button */}
                  <button
                    type="button"
                    disabled={!canProceed}
                    onClick={() => {
                      if (!canProceed || !product) return;

                      const isAddingToOrder = typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_reseller_is_adding_to_order') === 'true';
                      if (isAddingToOrder) {
                        try {
                          const existingItemsRaw = sessionStorage.getItem('tawzoon_reseller_pending_order_items');
                          let currentItems: CheckoutOrderItem[] = existingItemsRaw ? JSON.parse(existingItemsRaw) : [];
                          if (!Array.isArray(currentItems)) currentItems = [];

                          const existingIndex = currentItems.findIndex(i =>
                            i.originalProductId === product.id && (isGadgetOrOther || (i.size || '') === (selectedSize || ''))
                          );

                          if (existingIndex >= 0) {
                            currentItems[existingIndex] = {
                              ...currentItems[existingIndex],
                              quantity: currentItems[existingIndex].quantity + quantity,
                              sellingPrice: livePrice,
                              profit: liveProfit,
                            };
                          } else {
                            const newItem: CheckoutOrderItem = {
                              id: `${product.id}_${isGadgetOrOther ? 'std' : (selectedSize || 'std')}_${Date.now()}`,
                              nameBn: product.nameBn,
                              productCode: product.productCode,
                              imageUrl: activeImage,
                              size: isGadgetOrOther ? undefined : (selectedSize || undefined),
                              quantity: quantity,
                              sellingPrice: livePrice,
                              profit: liveProfit,
                              originalProductId: product.id,
                            };
                            currentItems.push(newItem);
                          }

                          sessionStorage.setItem('tawzoon_reseller_pending_order_items', JSON.stringify(currentItems));
                          window.dispatchEvent(new Event('tawzoon_reseller_order_mode_changed'));

                          showToast(lang === 'bn' ? '✓ পণ্যটি সফলভাবে অর্ডারে যুক্ত হয়েছে!' : '✓ Product added to order!', 'success');
                          onClose();

                          window.dispatchEvent(
                            new CustomEvent('tawzoon_open_reseller_checkout', {
                              detail: { items: currentItems }
                            })
                          );
                          return;
                        } catch (err) {
                          console.error('Failed to add product to pending reseller order:', err);
                        }
                      }

                      setIsDirectCheckoutOpen(true);
                    }}
                    className="py-3 px-3 text-xs lg:text-sm font-black text-white bg-[#009245] hover:bg-[#007a39] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    <span>
                      {!isGadgetOrOther && !selectedSize
                        ? (lang === 'bn' ? '⚠️ সাইজ সিলেক্ট করুন' : 'Select Size')
                        : (lang === 'bn' ? (isGadgetOrOther ? 'অর্ডার করুন' : `অর্ডার করুন (${selectedSize})`) : (isGadgetOrOther ? 'Order Now' : `Order Now (${selectedSize})`))}
                    </span>
                  </button>
                </div>
              );
            })()}

          </div>

        </div>

        {/* ========================================================= */}
        {/* MOBILE VIEW (block md:hidden) - Unchanged                     */}
        {/* ========================================================= */}
        <div className="block md:hidden space-y-3.5">
          <div className="grid grid-cols-1 gap-4 items-start">
            
            {/* LEFT COLUMN: Gallery & Marketing actions */}
            <div className="space-y-3.5">
              
              {/* গ্যালারি */}
              <div className="flex flex-row gap-2 sm:gap-3.5 items-stretch w-full h-[340px] sm:h-[380px]">
                
                {/* থাম্বনেইল কলাম */}
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

                {/* মূল ডিসপ্লে */}
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
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 z-10 text-[9.5px] font-black text-white bg-rose-600 px-1.5 py-0.5 rounded-md leading-none shadow-xs">
                        {discountPercent}% ছাড়
                      </span>
                    )}

                    <img
                      src={activeImage}
                      alt={product.nameBn}
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
                        toggleWishlist(product);
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

              {/* স্টার রেটিং এবং পোস্ট কপি ও সব ডাউনলোড বাটন */}
              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-1 bg-[#fffbeb] border border-[#fef3c7] px-2 py-1 rounded-full shadow-3xs shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-black text-[#d97706] font-mono">{ratingVal}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyMarketingPost}
                    className="px-2 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-700 hover:border-[#009245] transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {copiedPost ? <Check className="w-3.5 h-3.5 text-[#009245]" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedPost ? '✓ কপি' : 'পোস্ট কপি'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAllImages}
                    disabled={isDownloadingAll}
                    className="px-2 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-700 hover:border-[#009245] transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isDownloadingAll ? 'ডাউনলোড...' : 'সব ডাউনলোড'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <h2 className="font-black text-slate-900 leading-tight text-sm truncate" title={product.nameBn}>
                  {product.nameBn}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-[#009245] bg-[#eafff3] px-2 py-0.5 rounded-full border border-[#bbf7d0] shrink-0">
                  <span>● স্টকে আছে</span>
                </div>
              </div>

              <div className="grid grid-cols-3 bg-gradient-to-r from-emerald-50/50 via-slate-50/50 to-emerald-50/50 rounded-2xl p-2 border border-emerald-100/90 text-center shadow-3xs divide-x divide-slate-200/80">
                <div className="px-1 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-500 block">মূল দাম</span>
                  <span className="text-sm font-black text-slate-900 font-mono">৳{(baseCostPrice * quantity).toLocaleString()}</span>
                </div>
                <div className="px-1 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-500 block">বিক্রি দাম</span>
                  <span className="text-sm font-black text-rose-600 font-mono">৳{(livePrice * quantity).toLocaleString()}</span>
                </div>
                <div className="px-1 bg-emerald-100/40 rounded-r-xl flex flex-col justify-center py-1">
                  <span className="text-[10px] font-black text-emerald-800 block">আপনার প্রফিট</span>
                  <span className="text-sm font-black text-[#009245] font-mono">+৳{(liveProfit * quantity).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5">
                {!isGadgetOrOther && availableSizes.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800">সাইজ সিলেক্ট করুন: *</label>
                      <span className="text-[10.5px] font-bold font-mono">
                        সিলেক্টেড: {selectedSize ? <span className="text-[#009245] font-black">{selectedSize}</span> : <span className="text-amber-600 font-bold">বাছাই করা হয়নি</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3 py-1 text-xs font-black rounded-xl border transition-all cursor-pointer ${
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
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70">
                  <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-300 space-y-1 shadow-3xs">
                    <label className="text-xs font-black text-slate-800 block">বিক্রয়মূল্য (৳):</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 font-mono pointer-events-none">৳</span>
                      <input
                        type="number"
                        value={customSellingPrice === 0 || customSellingPrice === '0' || customSellingPrice === '' ? '' : customSellingPrice}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          if (rawVal === '') setCustomSellingPrice('');
                          else {
                            const num = Number(rawVal);
                            setCustomSellingPrice(isNaN(num) ? '' : num);
                          }
                        }}
                        className="w-full h-10 pl-6 pr-2 text-sm font-black font-mono rounded-lg border outline-none bg-slate-50 border-slate-300 focus:border-[#009245] focus:bg-white"
                        placeholder="মূল্য লিখুন"
                      />
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-slate-300 space-y-1 shadow-3xs">
                    <label className="text-xs font-black text-slate-800 block">পরিমাণ (পিস):</label>
                    <div className="h-10 flex items-center justify-between bg-slate-50 border border-slate-300 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 shadow-3xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center justify-center gap-0.5">
                        <input
                          type="number"
                          min={1}
                          value={quantity || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setQuantity(isNaN(val) || val < 1 ? 1 : val);
                          }}
                          className="w-8 text-center text-sm font-black font-mono bg-transparent outline-none p-0 border-none"
                        />
                        <span className="text-[11px] font-bold text-slate-500">পিস</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuantity(prev => prev + 1)}
                        className="w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center cursor-pointer active:scale-95 shadow-3xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/60 space-y-0.5">
                <span className="text-xs font-black text-slate-800 block">পণ্যের বিবরণ:</span>
                <p className="text-[11.5px] text-slate-600 leading-normal font-medium whitespace-pre-line">
                  {product.shortDescBn || product.fullDescBn || 'এখানে পণ্যের বিস্তারিত তথ্য থাকবে।'}
                </p>
              </div>

              {(() => {
                const canProceed = isGadgetOrOther
                  ? (isPriceValid && quantity >= 1)
                  : (isPriceValid && Boolean(selectedSize) && quantity >= 1);
                return (
                  <div className="pt-0.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!canProceed}
                      onClick={() => {
                        if (!canProceed) return;
                        const customizedProduct: Product = {
                          ...product,
                          sellingPrice: livePrice,
                          commissionRate: liveProfit,
                          imageUrl: activeImage,
                          sizes: isGadgetOrOther ? [] : [selectedSize as string],
                          quantity: quantity,
                          originalProductId: product.id,
                        };
                        addToCart(customizedProduct);
                        onClose();
                      }}
                      className="py-3 px-2 text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0 text-[#009245]" />
                      <span>কার্টে যোগ করুন</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canProceed}
                      onClick={() => {
                        if (!canProceed || !product) return;
                        setIsDirectCheckoutOpen(true);
                      }}
                      className="py-3 px-2 text-xs font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4 shrink-0" />
                      <span>{isGadgetOrOther ? 'অর্ডার করুন' : `অর্ডার করুন (${selectedSize || ''})`}</span>
                    </button>
                  </div>
                );
              })()}

            </div>

          </div>
        </div>

      </div>

      {/* Direct Order Checkout Modal (হুবহু অর্ডারের প্রসেসিং) */}
      {isDirectCheckoutOpen && (
        <ResellerOrderCheckoutModal
          isOpen={isDirectCheckoutOpen}
          onClose={() => {
            setIsDirectCheckoutOpen(false);
            onClose();
          }}
          items={[
            {
              id: `${product.id}_${selectedSize || 'std'}`,
              nameBn: product.nameBn,
              productCode: product.productCode,
              imageUrl: activeImage,
              size: selectedSize || undefined,
              quantity: quantity,
              sellingPrice: livePrice,
              profit: liveProfit,
              originalProductId: product.id,
            },
          ]}
          onOrderSuccess={() => {}}
        />
      )}
    </div>
  );
};
