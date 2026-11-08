import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Check,
  Copy,
  Eye,
  Tag,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';

export const VisualSearchModal: React.FC = () => {
  const {
    lang,
    isVisualSearchOpen,
    closeVisualSearch,
    visualSearchImage,
    visualSearchResults,
    isVisualSearching,
    visualDetectedInfo,
    startVisualSearch,
    activePortal,
    setActivePortal,
    setResellerTab,
    setSelectedProduct,
    setResellerPreviewProduct,
    setResellerCatalogView,
    setPublicCategory,
    setPublicSearch,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeVisualSearch(true);
    if (activePortal === 'employee') {
      setResellerTab('catalog');
      setResellerPreviewProduct(product);
    } else {
      if (activePortal !== 'public') {
        setActivePortal('public');
      }
      setSelectedProduct(product);
    }
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {}
  };

  if (!isVisualSearchOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      startVisualSearch(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      startVisualSearch(file);
    } else {
      showToast(lang === 'bn' ? 'দয়া করে একটি সঠিক ইমেজ ফাইল ড্রপ করুন।' : 'Please drop a valid image file.', 'error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCopyPost = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const desc = product.shortDescBn || product.fullDescBn || '';
    const text = `🛍️ পণ্য: ${product.nameBn}
📌 প্রডাক্ট কোড: ${product.productCode}
💰 অফার বিক্রয়মূল্য: ৳${product.sellingPrice.toLocaleString()}
${desc ? `\n📝 বিবরণ:\n${desc}\n` : ''}
🚚 সারাদেশে দ্রুত হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি!`;

    navigator.clipboard.writeText(text);
    setCopiedId(product.id);
    showToast(lang === 'bn' ? 'মার্কেটিং বিবরণ কপি হয়েছে!' : 'Product description copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleFilterInCatalog = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeVisualSearch(true);
    if (visualDetectedInfo?.itemTypeBn) {
      setPublicSearch(visualDetectedInfo.itemTypeBn);
    }
    if (activePortal === 'employee') {
      setResellerTab('catalog');
    } else {
      if (activePortal !== 'public') {
        setActivePortal('public');
      }
      const el = document.getElementById('catalog-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isReseller = activePortal === 'employee';

  return (
    <>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Dark Blur Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          onClick={() => closeVisualSearch()}
        />

        {/* Main Modal Container */}
        <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-emerald-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Modal Top Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-700 via-[#009245] to-emerald-600 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight leading-tight flex items-center gap-1.5">
                  <span>{lang === 'bn' ? 'ছবি দিয়ে পণ্য অনুসন্ধান' : 'Visual Image Search'}</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-emerald-100">
                    AI Lens
                  </span>
                </h3>
                <p className="text-[10px] sm:text-xs text-emerald-100 font-medium">
                  {lang === 'bn' ? 'ছবি ড্রপ করুন বা আপলোড করে যেকোনো প্রোডাক্ট খুঁজে নিন' : 'Drop or upload image to find matching products'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => closeVisualSearch()}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
                title={lang === 'bn' ? 'ফিরে যান' : 'Back'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
              </button>
              <button
                type="button"
                onClick={() => closeVisualSearch()}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            
            {/* 1. Drag & Drop / Upload Image Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer relative ${
                isDragOver
                  ? 'border-[#009245] bg-emerald-50/90 dark:bg-emerald-950/40 scale-[1.01]'
                  : 'border-emerald-200 dark:border-slate-700 bg-emerald-50/40 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Left/Center: Upload instructions & Icon */}
                <div className="flex items-center gap-3 sm:gap-4 text-left">
                  {visualSearchImage ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white border-2 border-[#009245] shadow-md shrink-0 relative group">
                      <img
                        src={visualSearchImage}
                        alt="Searched"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#009245]/15 text-[#009245] flex items-center justify-center shrink-0">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {visualSearchImage
                        ? (lang === 'bn' ? 'অন্য ছবি দিয়ে সার্চ করতে এখানে ড্রপ করুন' : 'Drop another image here to search')
                        : (lang === 'bn' ? 'প্রোডাক্টের ছবি ড্র্যাগ করে এখানে ছেড়ে দিন' : 'Drag & drop product picture here')}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'bn'
                        ? 'বা আপনার গ্যালারি/কম্পিউটার থেকে ছবি আপলোড করতে ক্লিক করুন (JPG, PNG, WEBP)'
                        : 'or click to browse from device (JPG, PNG, WEBP)'}
                    </p>
                  </div>
                </div>

                {/* Right: Upload Button */}
                <button
                  type="button"
                  className="py-2 px-3.5 rounded-xl bg-[#009245] text-white hover:bg-[#007a3a] text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Browse Image'}</span>
                </button>

              </div>
            </div>

            {/* 2. AI Recognition Status & Detected Tags */}
            {visualSearchImage && (
              <div className="bg-[#f0faf3] dark:bg-slate-800/90 border border-[#d8f0e0] dark:border-slate-700 rounded-2xl p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#009245]" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {isVisualSearching
                        ? (lang === 'bn' ? '🔍 ছবিটি বিশ্লেষণ ও মিল মেলানো হচ্ছে...' : '🔍 Analyzing image and searching...')
                        : (lang === 'bn' ? 'শনাক্তকৃত বৈশিষ্ট্য ও মিল:' : 'Detected Attributes & Match:')}
                    </span>
                  </div>

                  {!isVisualSearching && visualSearchResults.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFilterInCatalog}
                      className="text-[11px] font-bold text-[#009245] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'ক্যাটালগে এই রেজাল্ট ফিল্টার করুন' : 'Filter in Catalog'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tag Cloud */}
                {visualDetectedInfo && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {visualDetectedInfo.itemTypeBn && (
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-emerald-200 dark:border-slate-600 text-xs font-bold text-[#009245] dark:text-emerald-300">
                        🏷️ {visualDetectedInfo.itemTypeBn}
                      </span>
                    )}
                    {Array.isArray(visualDetectedInfo.colors) &&
                      visualDetectedInfo.colors.map((c: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                        >
                          🎨 {c}
                        </span>
                      ))}
                    {visualDetectedInfo.descriptionBn && (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium pl-1 italic">
                        "{visualDetectedInfo.descriptionBn}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visual Verification Comparison Box */}
            {visualSearchImage && visualSearchResults.length > 0 && !isVisualSearching && (
              <div className="bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/90 dark:bg-slate-800 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#009245]" />
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'bn' ? '🔍 নিশ্চিত করুন: আপনার আপলোড করা ছবি ও ক্যাটাগরি মিল' : '🔍 Verification: Searched Photo & Match'}
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold bg-[#009245] text-white px-2 py-0.5 rounded-full shadow-3xs">
                    {lang === 'bn' ? 'সঠিক মিল নিশ্চিত ✓' : 'Verified Match ✓'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-6 py-2">
                  {/* User Uploaded Search Image */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border-2 border-[#009245] shadow-md p-1">
                      {visualSearchImage ? (
                        <img
                          src={visualSearchImage}
                          alt="User Searched"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-[9px] font-bold">No Image</div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1">
                      {lang === 'bn' ? 'আপনার সার্চ করা ছবি' : 'Your Search Photo'}
                    </span>
                  </div>

                  <div
                    onClick={(e) => {
                      if (visualSearchResults[0]?.product) {
                        handleSelectProduct(visualSearchResults[0].product, e);
                      }
                    }}
                    className="flex flex-col items-center text-[#009245] animate-pulse cursor-pointer group hover:scale-110 active:scale-95 transition-transform"
                    title={lang === 'bn' ? 'পণ্যটি দেখতে ক্লিক করুন' : 'Click to view product'}
                  >
                    <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8" />
                    <span className="text-[9px] font-bold">
                      {visualSearchResults[0]?.matchScore || 90}% {lang === 'bn' ? 'মিল' : 'Match'}
                    </span>
                  </div>

                  {/* Top Matched Product Image */}
                  {visualSearchResults[0] && (() => {
                    const topProd = visualSearchResults[0].product;
                    const topImg = topProd.images?.find((img) => img.isPrimary)?.url || topProd.images?.[0]?.url || topProd.imageUrl || '/images/product_shop_dress_1790244714775.jpg';
                    return (
                      <div
                        onClick={(e) => handleSelectProduct(topProd, e)}
                        className="flex flex-col items-center cursor-pointer group active:scale-95 transition-transform"
                        title={lang === 'bn' ? 'পণ্যটি দেখতে ক্লিক করুন' : 'Click to view product'}
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border-2 border-emerald-500 shadow-md p-1 group-hover:scale-105 transition-transform">
                          <img
                            src={topImg}
                            alt={topProd.nameBn}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#009245] group-hover:underline mt-1 truncate max-w-[120px] inline-flex items-center gap-0.5">
                          <span>{topProd.productCode || topProd.nameBn}</span>
                          <Eye className="w-2.5 h-2.5 shrink-0" />
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* 3. Matching Products Results Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{lang === 'bn' ? 'মিল পাওয়া প্রোডাক্টসমূহ' : 'Matching Products'}</span>
                  {!isVisualSearching && (
                    <span className="text-[11px] font-normal text-slate-500">
                      ({visualSearchResults.length} {lang === 'bn' ? 'টি পাওয়া গেছে' : 'found'})
                    </span>
                  )}
                </h4>
              </div>

              {/* Loading Skeleton */}
              {isVisualSearching ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#009245] mx-auto flex items-center justify-center animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    {lang === 'bn' ? 'ছবি বিশ্লেষণ করা হচ্ছে...' : 'Analyzing photo...'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {lang === 'bn'
                      ? 'AI ভিশন মডেলের মাধ্যমে আপনার ছবির সাথে মিলিয়ে সেরা প্রোডাক্টগুলো লোড হচ্ছে।'
                      : 'AI is searching our catalog to find products matching your image.'}
                  </p>
                </div>
              ) : visualSearchResults.length === 0 && visualSearchImage ? (
                <div className="py-10 text-center space-y-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এই ছবির সাথে হুবহু কোনো প্রোডাক্ট মেলেনি।' : 'No direct match found for this image.'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'অন্য কোনো পরিষ্কার প্রোডাক্ট ছবি ড্রপ করুন।' : 'Try uploading another clear product photo.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {visualSearchResults.map(({ product, matchScore }) => {
                    const primaryImg =
                      product.images?.find((img) => img.isPrimary)?.url ||
                      product.images?.[0]?.url ||
                      product.imageUrl ||
                      '/images/product_shop_dress_1790244714775.jpg';

                    return (
                      <div
                        key={product.id}
                        className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 sm:p-3 hover:shadow-lg hover:border-[#009245] transition-all flex flex-col justify-between relative"
                      >
                        <div>
                          {/* Match Score Badge */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-[#eafff3] dark:bg-emerald-950/60 border border-[#c6f6dd] dark:border-emerald-800/60 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-[#009245]" />
                              <span>{matchScore}% {lang === 'bn' ? 'মিল' : 'Match'}</span>
                            </span>

                            <span className="text-[9px] font-mono text-slate-400 font-bold">
                              {product.productCode}
                            </span>
                          </div>

                          {/* Product Image Slot */}
                          <div
                            onClick={(e) => handleSelectProduct(product, e)}
                            className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-700 mb-2 flex items-center justify-center p-1.5 cursor-pointer active:scale-95 transition-transform"
                          >
                            <img
                              src={primaryImg}
                              alt={product.nameBn}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Title & Category */}
                          <h4
                            onClick={(e) => handleSelectProduct(product, e)}
                            className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#009245] transition-colors line-clamp-1 leading-tight mb-1 cursor-pointer"
                          >
                            {product.nameBn}
                          </h4>

                          {/* Price Info */}
                          <div className="bg-[#f0faf3] dark:bg-slate-700/60 rounded-xl p-1.5 sm:p-2 border border-[#d8f0e0] dark:border-slate-600 mb-2">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                                {lang === 'bn' ? 'মূল্য:' : 'Price:'}
                              </span>
                              <span className="font-black text-rose-600 font-mono">
                                ৳{product.sellingPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={(e) => handleSelectProduct(product, e)}
                            className="w-full py-1.5 px-2 text-[10px] sm:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] active:scale-[0.98] rounded-lg shadow-2xs inline-flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </>
  );
};

