import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';
import { api } from '../../services/api.js';
import { getResellerProfitPerUnit } from '../../utils/pricing.js';
import { ResellerOrderCheckoutModal, CheckoutOrderItem } from './ResellerOrderCheckoutModal.js';

interface ResellerCartTabProps {
  onOrderSuccess?: () => void;
}

export const ResellerCartTab: React.FC<ResellerCartTabProps> = ({ onOrderSuccess: onOrderSuccessCallback }) => {
  const {
    lang,
    cartItems,
    removeFromCart,
    clearCart,
    setResellerTab,
    employee,
    employeeToken,
    showToast,
    brandSettings,
  } = useApp();

  // Selection state for items in cart
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    cartItems.map((item) => item.id)
  );

  // Custom quantities per item id
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
    const qMap: Record<string, number> = {};
    cartItems.forEach((item) => {
      qMap[item.id] = (item as any).quantity || 1;
    });
    return qMap;
  });

  // Custom prices per item id
  const [itemPrices, setItemPrices] = useState<Record<string, number>>(() => {
    const pMap: Record<string, number> = {};
    cartItems.forEach((item) => {
      pMap[item.id] = item.sellingPrice;
    });
    return pMap;
  });

  // Sync selection, quantities and prices whenever cartItems changes
  React.useEffect(() => {
    setSelectedItemIds(cartItems.map((item) => item.id));
    setItemQuantities((prev) => {
      const next = { ...prev };
      cartItems.forEach((item) => {
        next[item.id] = item.quantity || next[item.id] || 1;
      });
      return next;
    });
    setItemPrices((prev) => {
      const next = { ...prev };
      cartItems.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = item.sellingPrice;
        }
      });
      return next;
    });
  }, [cartItems]);

  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Toggle selection
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map((item) => item.id));
    }
  };

  // Helper to calculate reseller commission per item (with 100 Tk profit limit rule)
  const getItemCommission = (product: Product, sellingPrice: number): number => {
    if (!employee) return 0;
    return getResellerProfitPerUnit(product, employee, brandSettings, sellingPrice);
  };

  // Filter selected items
  const activeSelectedItems = cartItems.filter((item) => selectedItemIds.includes(item.id));

  // Products Subtotal
  const productsTotalAmount = activeSelectedItems.reduce((sum, item) => {
    const qty = itemQuantities[item.id] || 1;
    const price = itemPrices[item.id] ?? item.sellingPrice;
    return sum + price * qty;
  }, 0);

  // Total Reseller Profit
  const totalProfit = activeSelectedItems.reduce((sum, item) => {
    const qty = itemQuantities[item.id] || 1;
    const price = itemPrices[item.id] ?? item.sellingPrice;
    const comm = getItemCommission(item, price);
    return sum + comm * qty;
  }, 0);

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-200">
      


      {/* When Cart is Empty */}
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-4 my-4">
          <div className="w-20 h-20 bg-emerald-50 text-[#009245] rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <ShoppingBag className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              {lang === 'bn' ? 'আপনার কার্ট এখন খালি!' : 'Your Cart is Empty!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {lang === 'bn'
                ? 'ক্যাটালগ থেকে আপনার পছন্দের যেকোনো প্রোডাক্টের “কার্ট করুন” বাটনে ক্লিক করে পণ্য যোগ করুন।'
                : 'Browse catalog and click "Add to Cart" on your favorite products.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setResellerTab('catalog')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ক্যাটালগ থেকে প্রোডাক্ট যোগ করুন' : 'Add Products from Catalog'}</span>
          </button>
        </div>
      ) : (
        /* Cart Items List */
        <div className="space-y-3">
          
          {/* Top Selection Controls */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedItemIds.length === cartItems.length && cartItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#009245] rounded cursor-pointer"
              />
              <span>{lang === 'bn' ? 'সবগুলো' : 'All'} ({selectedItemIds.length}/{cartItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setResellerTab('catalog')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-black text-[#009245] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ প্রোডাক্ট অ্যাড' : '+ Add Product'}</span>
            </button>
          </div>

          {/* Product Cards Loop */}
          {cartItems.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const qty = itemQuantities[item.id] || 1;
            const price = itemPrices[item.id] ?? item.sellingPrice;
            const baseCost = Math.max(0, item.sellingPrice - getItemCommission(item, item.sellingPrice));
            const liveProfit = Math.max(0, price - baseCost);

            return (
              <div
                key={item.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-white border-[#009245]/60 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200/80 opacity-75'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(item.id)}
                    className="w-4 h-4 accent-[#009245] rounded cursor-pointer mt-1 shrink-0"
                  />

                  {/* Variant Image */}
                  <img
                    src={
                      item.imageUrl ||
                      (item.images && item.images[0]?.url) ||
                      '/images/product_shop_dress_1790244714775.jpg'
                    }
                    alt={item.nameBn}
                    className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 shrink-0 shadow-3xs"
                  />

                  {/* Main Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {item.nameBn}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="font-mono text-[9.5px] font-bold text-[#009245] bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
                            #{item.productCode}
                          </span>
                          {((item as any).size || (item.sizes && item.sizes.length > 0)) ? (
                            <span className="bg-[#009245] text-white text-[10px] font-black px-2 py-0.5 rounded-md font-mono shadow-3xs">
                              সাইজ: {(item as any).size || item.sizes?.[0]}
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              সাইজ: ফ্রি সাইজ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete Item Cross Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title={lang === 'bn' ? 'আইটেম রিমুভ করুন' : 'Remove'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price & Quantity Controls Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 items-center">
                      
                      {/* Selling Price Editable Input */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          {lang === 'bn' ? 'বিক্রয়মূল্য (৳):' : 'Selling Price:'}
                        </span>
                        <input
                          type="number"
                          min={baseCost}
                          value={price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItemPrices((prev) => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-full px-2 py-1 text-xs font-black font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#009245] text-slate-900"
                        />
                      </div>

                      {/* Quantity Selector */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 block text-right">
                          {lang === 'bn' ? 'পরিমাণ (পিস):' : 'Quantity:'}
                        </span>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                              }))
                            }
                            className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              setItemQuantities((prev) => ({
                                ...prev,
                                [item.id]: isNaN(v) || v < 1 ? 1 : v,
                              }));
                            }}
                            className="w-8 text-center text-xs font-black font-mono bg-transparent outline-none border-none p-0"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setItemQuantities((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] || 1) + 1,
                              }))
                            }
                            className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Calculated Totals Row */}
                    <div className="flex items-center justify-between text-[11px] font-bold pt-1 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-600">
                        মোট বিক্রি: <span className="text-rose-600 font-mono font-black">৳{(price * qty).toLocaleString()}</span>
                      </span>
                      <span className="text-[#009245] font-mono font-black">
                        প্রফিট: +৳{(liveProfit * qty).toLocaleString()}
                      </span>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}

          {/* Sticky Bottom Cart Checkout Summary Bar */}
          <div className="fixed bottom-14 left-0 right-0 z-[500] bg-white border-t border-slate-200 shadow-2xl py-2 px-3 max-w-md mx-auto flex items-center justify-between gap-3">
            
            {/* Left: Total Profit */}
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shrink-0">
              <span className="text-[11px] text-emerald-900 font-bold">মোট প্রফিট:</span>
              <span className="text-xs sm:text-sm font-black text-[#009245] font-mono">+৳{totalProfit.toLocaleString()}</span>
            </div>

            {/* Right: Order Now Button */}
            <button
              type="button"
              disabled={activeSelectedItems.length === 0}
              onClick={() => {
                if (activeSelectedItems.length === 0) return;
                setIsCheckoutModalOpen(true);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>অর্ডার করুন ({activeSelectedItems.length}টি)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

      {/* Reseller Order Checkout Modal */}
      {isCheckoutModalOpen && (
        <ResellerOrderCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          items={activeSelectedItems.map((item) => {
            const price = itemPrices[item.id] ?? item.sellingPrice;
            const comm = getItemCommission(item, price);
            return {
              id: item.id,
              nameBn: item.nameBn,
              productCode: item.productCode,
              imageUrl: item.imageUrl || (item.images && item.images[0]?.url),
              size: item.sizes?.[0],
              quantity: itemQuantities[item.id] || 1,
              sellingPrice: price,
              profit: comm,
              originalProductId: item.originalProductId || item.id,
            };
          })}
          onOrderSuccess={(orderedItemIds) => {
            orderedItemIds.forEach((id) => removeFromCart(id));
            if (onOrderSuccessCallback) {
              onOrderSuccessCallback();
            }
          }}
        />
      )}

    </div>
  );
};
