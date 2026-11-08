import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.js';
import { getAdjustedSellingPrice } from '../../utils/pricing.js';
import { getProductSizes } from '../../utils/productSizes.js';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  MessageCircle,
  PhoneCall,
  Check,
  Package,
  Download,
  Copy,
  Link2,
  UserCheck,
} from 'lucide-react';

export const PublicCartDrawer: React.FC = () => {
  const {
    lang,
    cartItems,
    isPublicCartOpen,
    setIsPublicCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    setSelectedProduct,
    showToast,
    employee,
    brandSettings,
    openCheckoutModal,
  } = useApp();

  if (!isPublicCartOpen) return null;

  // Financial calculations
  const subtotal = cartItems.reduce((sum, item) => sum + getAdjustedSellingPrice(item, employee, brandSettings) * (item.quantity || 1), 0);
  const deliveryFee = cartItems.length > 0 ? 120 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) return;
    setIsPublicCartOpen(false);
    openCheckoutModal(
      cartItems.map((item) => {
        const szs = getProductSizes(item);
        const resolved = item.sizes?.[0] || (szs.length > 0 ? szs[0] : 'স্ট্যান্ডার্ড');
        return {
          product: item,
          size: resolved,
          quantity: item.quantity || 1,
        };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-[100002] bg-slate-950/80 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden relative">
        
        {/* Header Frame */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#009245] via-[#00823c] to-[#006e33] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xs">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {lang === 'bn' ? 'আপনার শপিং কার্ট' : 'Shopping Cart'}
              </h3>
              <span className="text-xs text-emerald-100 font-medium block">
                {cartItems.length > 0
                  ? lang === 'bn' ? `${cartItems.length}টি পণ্য যোগ করা আছে` : `${cartItems.length} items added`
                  : lang === 'bn' ? 'কার্ট বর্তমানে খালি' : 'Cart is empty'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPublicCartOpen(false)}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all border border-white/20"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 scrollbar-none">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-[#009245] shadow-inner">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {lang === 'bn' ? 'আপনার শপিং কার্ট খালি!' : 'Your Cart is Empty!'}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  {lang === 'bn'
                    ? 'আমাদের ক্যাটালগ ঘুরে দেখুন এবং পছন্দের পণ্যগুলো কার্টে যোগ করুন।'
                    : 'Explore our catalog and add your favorite products.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublicCartOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>{lang === 'bn' ? 'পণ্যসমূহ দেখুন' : 'Explore Catalog'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800">
                  {lang === 'bn' ? 'কার্টের পণ্যসমূহ:' : 'Cart Items:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    showToast(lang === 'bn' ? 'কার্ট খালি করা হয়েছে' : 'Cart cleared');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-lg border border-rose-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'কার্ট খালি করুন' : 'Clear Cart'}</span>
                </button>
              </div>

              {cartItems.map((item, idx) => {
                const title = lang === 'bn' ? (item.nameBn || 'Product') : (item.nameEn || item.nameBn);
                const img = item.images?.[0]?.url || item.imageUrl || '/images/product_shop_dress_1790244714775.jpg';
                const itemQty = item.quantity || 1;
                const itemSizes = getProductSizes(item);
                const size = item.sizes?.[0] || (itemSizes.length > 0 ? itemSizes[0] : null);

                return (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3 transition-all hover:border-emerald-200"
                  >
                    <img
                      src={img}
                      alt={title}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={title}>
                          {title}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                          title="সরান"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {size && (
                          <span className="text-[10px] font-black text-[#009245] bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-md font-mono">
                            {size}
                          </span>
                        )}
                        <span className="text-xs font-black text-rose-600 font-mono">
                          ৳{(getAdjustedSellingPrice(item, employee, brandSettings) * itemQty).toLocaleString()}
                        </span>
                      </div>

                      {/* Quantity Counter */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10.5px] font-medium text-slate-500">
                          ৳{getAdjustedSellingPrice(item, employee, brandSettings).toLocaleString()} × {itemQty}
                        </span>

                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              if (itemQty <= 1) {
                                removeFromCart(item.id);
                              } else {
                                addToCart({ ...item, quantity: -1 });
                              }
                            }}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-black font-mono">{itemQty}</span>
                          <button
                            type="button"
                            onClick={() => addToCart({ ...item, quantity: 1 })}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 space-y-3 shrink-0">
            {/* Financial Summary Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/90 space-y-1.5 text-xs font-bold shadow-2xs">
              <div className="flex justify-between text-slate-600">
                <span>পণ্যের মোট দাম:</span>
                <span className="font-mono">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>আনুমানিক ডেলিভারি চার্জ:</span>
                <span className="font-mono">৳{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-100 text-sm font-black">
                <span>সর্বমোট আনুমানিক প্রদেয়:</span>
                <span className="font-mono text-[#009245] text-base">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCheckoutClick}
                className="w-full py-3 bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{lang === 'bn' ? 'অর্ডার করতে এগিয়ে যান' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPublicCartOpen(false)}
                className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer text-center"
              >
                {lang === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
