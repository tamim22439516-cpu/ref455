import React, { useState } from 'react';
import { Product } from '../types/index.js';
import { useApp } from '../context/AppContext.js';
import { getAdjustedSellingPrice, getAdjustedRegularPrice } from '../utils/pricing.js';
import { Heart, Star, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onCardClick?: () => void;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  compact: _compact = false,
  onCardClick,
  viewMode = 'grid',
}) => {
  const { lang, setSelectedProduct, addToCart, showToast, wishlistItems, toggleWishlist, employee, brandSettings } = useApp();

  const isWishlisted = wishlistItems.some(p => p.id === product.id);

  const title = lang === 'bn' ? product.nameBn : product.nameEn;
  const primaryImg = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const imgUrl = primaryImg?.url || '/images/product_shop_dress_1790244714775.jpg';

  const sellingPrice = getAdjustedSellingPrice(product, employee, brandSettings);
  const regularPrice = getAdjustedRegularPrice(product, employee, brandSettings);
  const discountPercent = regularPrice > sellingPrice
    ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
    : 0;

  const ratingVal = product.starRating ? Number(product.starRating).toFixed(1) : '5.0';
  const ratingCount = 50 + (product.id ? product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 80 : 40);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCardClick();
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else {
      setSelectedProduct(product);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 hover:border-emerald-300/80 dark:border-slate-800 dark:hover:border-emerald-700/60 p-2.5 sm:p-3 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 relative"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Product Image Slot */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 shrink-0 border border-slate-100/80">
            {discountPercent > 0 && (
              <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded leading-none z-10">
                -{discountPercent}%
              </span>
            )}
            <img
              src={imgUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Details Column */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded leading-none">
                {product.productCode}
              </span>
              {product.subcategoryBn && (
                <span className="text-[10px] font-medium text-slate-500 truncate">
                  • {lang === 'bn' ? product.subcategoryBn : (product.subcategoryEn || product.subcategoryBn)}
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#009245] transition-colors truncate">
              {title}
            </h4>

            {/* Price & Rating */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-black text-rose-600 font-mono">
                  ৳{sellingPrice.toLocaleString()}
                </span>
                {regularPrice > sellingPrice && (
                  <span className="text-[11px] text-slate-400 line-through font-mono font-normal">
                    ৳{regularPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{ratingVal}</span>
                <span className="text-slate-400 text-[10px] font-normal">({ratingCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Column on Right */}
        <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <button
            onClick={handleToggleWishlist}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>
          <button
            onClick={handleAddToCart}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#eafff3] text-[#009245] hover:bg-[#009245] hover:text-white border border-[#c6f6dd]/80 transition-all shadow-2xs hover:scale-105 flex items-center gap-1"
            title={lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs font-bold hidden sm:inline">{lang === 'bn' ? 'কার্টে নিন' : 'Add'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 hover:border-emerald-300/80 dark:border-slate-800 dark:hover:border-emerald-700/60 p-2.5 sm:p-3 hover:shadow-sm transition-all duration-200 flex flex-col justify-between relative"
    >
      <div>
        {/* Top Row: Red Discount Badge & Wishlist Heart Button */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          {discountPercent > 0 ? (
            <span className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded-md leading-none">
              -{discountPercent}%
            </span>
          ) : <span />}

          <button
            onClick={handleToggleWishlist}
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Product Image Centered Slot (Compact aspect-square) */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 mb-2">
          <img
            src={imgUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* SKU / Product Serial code badge */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded leading-none">
            {product.productCode}
          </span>
          {product.subcategoryBn && (
            <span className="text-[10px] font-medium text-slate-500 truncate">
              • {lang === 'bn' ? product.subcategoryBn : (product.subcategoryEn || product.subcategoryBn)}
            </span>
          )}
        </div>

        {/* Product Title (Compact line-clamp) */}
        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-[#009245] transition-colors line-clamp-1 leading-snug mb-1">
          {title}
        </h4>

        {/* Price Row: Selling Price + Strike-through Regular Price */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-sm sm:text-base font-black text-rose-600 font-mono">
            ৳{sellingPrice.toLocaleString()}
          </span>
          {regularPrice > sellingPrice && (
            <span className="text-[11px] text-slate-400 line-through font-mono font-normal">
              ৳{regularPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Rating (Star) & Add to Cart Button */}
      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
        {/* Rating */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{ratingVal}</span>
          <span className="text-slate-400 text-[10px] font-normal">({ratingCount})</span>
        </div>

        {/* Compact Light Green Cart Button with Shopping Bag */}
        <button
          onClick={handleAddToCart}
          className="p-1.5 rounded-lg bg-[#eafff3] text-[#009245] hover:bg-[#009245] hover:text-white border border-[#c6f6dd]/80 transition-all shadow-2xs hover:scale-105"
          title={lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
