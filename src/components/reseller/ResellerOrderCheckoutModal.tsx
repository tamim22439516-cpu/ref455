import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Package,
  ShieldCheck,
  Search,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  Check,
  FileText,
  User,
  Phone,
  MapPin,
  Loader2,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Product } from '../../types/index.js';
import { bdDistrictsAndThanas, isSearchTextMatch } from '../../data/bdLocations.js';
import { getAdjustedSellingPrice, getResellerProfitPerUnit } from '../../utils/pricing.js';
import { getProductSizes } from '../../utils/productSizes.js';
import { ResellerAddBalanceModal } from './ResellerAddBalanceModal.js';

export interface CheckoutOrderItem {
  id: string;
  nameBn: string;
  productCode: string;
  imageUrl?: string;
  size?: string;
  quantity: number;
  sellingPrice: number;
  profit: number;
  originalProductId: string;
}

interface ResellerOrderCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutOrderItem[];
  onOrderSuccess: (orderedItemIds: string[]) => void;
}

export const ResellerOrderCheckoutModal: React.FC<ResellerOrderCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const { lang, employee, employeeToken, showToast, brandSettings, setActivePortal, setResellerTab, setResellerCatalogView } = useApp();

  // Active items in this checkout session
  const [activeItems, setActiveItems] = useState<CheckoutOrderItem[]>(items);
  const [confirmedOrderData, setConfirmedOrderData] = useState<any | null>(null);

  // Customer Information States
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Courier Check State
  const [isCourierChecking, setIsCourierChecking] = useState(false);
  const [courierReport, setCourierReport] = useState<{
    delivered: number;
    returned: number;
    totalOrders: number;
    successRate: number;
    riskStatus?: string;
    riskTextBn?: string;
  } | null>(null);
  const [isReportBadgeAttached, setIsReportBadgeAttached] = useState(false);

  // Delivery Information States
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [districtQuery, setDistrictSearchQuery] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const [selectedThana, setSelectedThana] = useState('ধানমন্ডি');
  const [thanaQuery, setThanaSearchQuery] = useState('');
  const [isThanaDropdownOpen, setIsThanaDropdownOpen] = useState(false);

  const [specificAddress, setSpecificAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Delivery Fee Advance Toggle: null = unselected, 'no' = ৳120 COD, 'yes' = ৳0
  const [isDeliveryPaidAdvance, setIsDeliveryPaidAdvance] = useState<'yes' | 'no' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resellerPageName, setResellerPageName] = useState(() => localStorage.getItem('reseller_page_name') || '');
  const [isMemoGenerated, setIsMemoGenerated] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingDeliveryAdvance, setPendingDeliveryAdvance] = useState<'yes' | 'no' | null>(null);
  const [isDeliveryConfirmOpen, setIsDeliveryConfirmOpen] = useState(false);
  const [isLowBalanceWarningOpen, setIsLowBalanceWarningOpen] = useState(false);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);

  // Product Add Popup States
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [addSize, setAddSize] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState<number>(1);

  // Sync active items when props change (only if not currently showing memo)
  useEffect(() => {
    if (!confirmedOrderData && items && items.length > 0) {
      setActiveItems(items);
    }
  }, [items, confirmedOrderData]);

  // Restore customer form inputs & pending items from session storage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const savedCust = sessionStorage.getItem('tawzoon_reseller_pending_order_customer');
        if (savedCust) {
          const parsed = JSON.parse(savedCust);
          if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.selectedDistrict) setSelectedDistrict(parsed.selectedDistrict);
          if (parsed.selectedThana) setSelectedThana(parsed.selectedThana);
          if (parsed.specificAddress) setSpecificAddress(parsed.specificAddress);
          if (parsed.specialNotes) setSpecialNotes(parsed.specialNotes);
        }
      } catch {}

      try {
        const savedItems = sessionStorage.getItem('tawzoon_reseller_pending_order_items');
        if (savedItems) {
          const parsed = JSON.parse(savedItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveItems(parsed);
          }
        }
      } catch {}
    }
  }, [isOpen]);

  // Keep saved customer info synchronized in session storage
  useEffect(() => {
    if (isOpen && (customerPhone || customerName || specificAddress)) {
      try {
        sessionStorage.setItem('tawzoon_reseller_pending_order_customer', JSON.stringify({
          customerPhone,
          customerName,
          selectedDistrict,
          selectedThana,
          specificAddress,
          isDeliveryPaidAdvance,
          specialNotes,
        }));
      } catch {}
    }
  }, [isOpen, customerPhone, customerName, selectedDistrict, selectedThana, specificAddress, isDeliveryPaidAdvance, specialNotes]);

  // Keep saved items synchronized in session storage
  useEffect(() => {
    if (isOpen && activeItems.length > 0) {
      try {
        sessionStorage.setItem('tawzoon_reseller_pending_order_items', JSON.stringify(activeItems));
      } catch {}
    }
  }, [isOpen, activeItems]);

  // Load catalog products for "+ আরও প্রোডাক্ট যোগ করুন"
  useEffect(() => {
    if (isAddProductOpen && allCatalogProducts.length === 0) {
      setIsLoadingCatalog(true);
      api.getProducts().then(res => {
        if (res && res.products) {
          setAllCatalogProducts(res.products.filter(p => p.isActive && !p.isArchived));
        }
      }).catch(err => {
        console.warn('Failed to load products for reseller checkout picker:', err);
      }).finally(() => {
        setIsLoadingCatalog(false);
      });
    }
  }, [isAddProductOpen, allCatalogProducts.length]);

  if (!isOpen) return null;
  if (!confirmedOrderData && activeItems.length === 0) return null;

  // Filter Districts & Thanas
  const allDistricts = Object.keys(bdDistrictsAndThanas);
  const matchingDistricts = allDistricts.filter(dist =>
    isSearchTextMatch(dist, districtQuery)
  );

  const availableThanas = bdDistrictsAndThanas[selectedDistrict] || ['সদর'];
  const matchingThanas = availableThanas.filter(thana =>
    isSearchTextMatch(thana, thanaQuery)
  );

  // Is Dhaka check
  const isDhaka = selectedDistrict.trim() === 'ঢাকা' || selectedDistrict.trim().toLowerCase() === 'dhaka';

  // Financial Calculations
  const productsTotalAmount = activeItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const standardDeliveryCharge = isDhaka ? 70 : 120;
  const deliveryFee = isDeliveryPaidAdvance === 'yes' ? 0 : isDeliveryPaidAdvance === 'no' ? standardDeliveryCharge : null;
  const grandTotalAmount = productsTotalAmount + (deliveryFee ?? 0);
  const totalProfit = activeItems.reduce((sum, item) => sum + item.profit * item.quantity, 0);

  // Quantity Stepper: update item quantity directly
  const handleUpdateQty = (itemId: string, delta: number) => {
    setActiveItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Remove Item from order
  const handleRemoveItem = (itemId: string) => {
    if (activeItems.length === 1) {
      showToast(lang === 'bn' ? 'অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে।' : 'At least one product required.', 'error');
      return;
    }
    setActiveItems(prev => prev.filter(i => i.id !== itemId));
    showToast(lang === 'bn' ? 'পণ্যটি সরানো হয়েছে।' : 'Item removed.');
  };

  // Add Product from Catalog: Duplicate prevention & size validation
  const handleConfirmAddProduct = () => {
    if (!selectedProductToAdd) return;
    const sellPrice = getAdjustedSellingPrice(selectedProductToAdd, employee, brandSettings);
    const profit = getResellerProfitPerUnit(selectedProductToAdd, employee, brandSettings, sellPrice);
    const pImg = selectedProductToAdd.images?.find(i => i.isPrimary)?.url ||
      selectedProductToAdd.images?.[0]?.url ||
      selectedProductToAdd.imageUrl ||
      '/images/product_shop_dress_1790244714775.jpg';

    // Duplicate check: check if same originalProductId AND same size already exist in order
    const existingIndex = activeItems.findIndex(i =>
      i.originalProductId === selectedProductToAdd.id && (i.size || '') === (addSize || '')
    );

    if (existingIndex >= 0) {
      // Increase quantity of existing item without creating duplicate card
      setActiveItems(prev => {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + addQuantity,
        };
        return copy;
      });
      showToast(
        lang === 'bn'
          ? `পণ্যটির পরিমাণ +${addQuantity} বৃদ্ধি করা হয়েছে!`
          : `Item quantity increased by ${addQuantity}!`,
        'success'
      );
    } else {
      // Add new distinct item
      const newItem: CheckoutOrderItem = {
        id: `${selectedProductToAdd.id}_${addSize || 'std'}_${Date.now()}`,
        nameBn: selectedProductToAdd.nameBn,
        productCode: selectedProductToAdd.productCode,
        imageUrl: pImg,
        size: addSize || undefined,
        quantity: addQuantity,
        sellingPrice: sellPrice,
        profit: profit,
        originalProductId: selectedProductToAdd.id,
      };
      setActiveItems(prev => [...prev, newItem]);
      showToast(
        lang === 'bn' ? 'পণ্য সফলভাবে অর্ডারে যুক্ত হয়েছে!' : 'Product added to order!',
        'success'
      );
    }

    setIsAddProductOpen(false);
    setSelectedProductToAdd(null);
    setAddQuantity(1);
    setProductSearchQuery('');
  };

  // Open Add Product via Reseller Catalog Page (Preserves all items, customer info & opens catalog)
  const handleOpenAddProductFromCatalog = () => {
    try {
      sessionStorage.setItem('tawzoon_reseller_pending_order_items', JSON.stringify(activeItems));
      sessionStorage.setItem('tawzoon_reseller_pending_order_customer', JSON.stringify({
        customerPhone,
        customerName,
        selectedDistrict,
        selectedThana,
        specificAddress,
        isDeliveryPaidAdvance,
        specialNotes,
      }));
      sessionStorage.setItem('tawzoon_reseller_is_adding_to_order', 'true');
      window.dispatchEvent(new Event('tawzoon_reseller_order_mode_changed'));
    } catch (e) {
      console.warn('Session save error:', e);
    }

    onClose();
    setResellerTab('catalog');
    if (setResellerCatalogView) {
      setResellerCatalogView('reseller-catalog');
    }
    window.dispatchEvent(new CustomEvent('tawzoon_open_reseller_catalog', { detail: { category: 'all' } }));
    showToast(
      lang === 'bn'
        ? 'রিসেলার ক্যাটালগ থেকে যেকোনো ক্যাটাগরির পণ্য পছন্দ করে সাইজ ও কোয়ান্টিটি দিয়ে অর্ডারে যুক্ত করুন।'
        : 'Browse reseller catalog and pick products to add to your order.',
      'info'
    );
  };

  // Customer Phone Check with Real API & Autofill
  const handleCheckCustomerPhone = async () => {
    const clean = customerPhone.replace(/[^0-9]/g, '');
    if (!clean || clean.length < 11) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে কাস্টমারের সচল ১১ ডিজিট নম্বর লিখুন' : 'Enter 11-digit phone number', 'error');
      return;
    }

    setIsCourierChecking(true);
    try {
      const res = await fetch(`/api/common/customer-history?phone=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        const delivered = data.courierNetwork?.deliveredParcels ?? data.deliveredOrders ?? 0;
        const returned = data.courierNetwork?.returnedParcels ?? data.rejectedOrders ?? 0;
        const total = delivered + returned;
        const successRate = data.courierNetwork?.successRate ?? (total > 0 ? Math.round((delivered / total) * 100) : 100);

        setCourierReport({
          delivered,
          returned,
          totalOrders: data.courierNetwork?.totalParcels ?? data.totalOrders ?? 0,
          successRate,
          riskStatus: data.courierNetwork?.riskStatus || (returned >= 2 ? 'RED' : returned === 1 ? 'YELLOW' : 'GREEN'),
          riskTextBn: data.courierNetwork?.riskTextBn,
        });

        // Autofill real customer info if existing sales history found
        if (data.salesHistory && Array.isArray(data.salesHistory) && data.salesHistory.length > 0) {
          const latestWithName = data.salesHistory.find((s: any) => s.customerName && s.customerName.trim().length > 0);
          if (latestWithName?.customerName && !customerName.trim()) {
            setCustomerName(latestWithName.customerName.trim());
          }

          const latestWithAddr = data.salesHistory.find((s: any) => s.customerAddress && s.customerAddress.trim().length > 0);
          if (latestWithAddr?.customerAddress && !specificAddress.trim()) {
            const rawAddr = latestWithAddr.customerAddress;
            if (rawAddr.includes('ঠিকানা:')) {
              const parts = rawAddr.split('ঠিকানা:');
              setSpecificAddress(parts[1]?.trim() || rawAddr);
            } else {
              setSpecificAddress(rawAddr);
            }

            for (const d of allDistricts) {
              if (rawAddr.includes(d)) {
                setSelectedDistrict(d);
                const thanas = bdDistrictsAndThanas[d] || ['সদর'];
                for (const th of thanas) {
                  if (rawAddr.includes(th)) {
                    setSelectedThana(th);
                    break;
                  }
                }
                break;
              }
            }
          }

          showToast(lang === 'bn' ? '✓ কাস্টমারের পূর্ববর্তী তথ্য পাওয়া গেছে এবং পূরণ করা হয়েছে!' : 'Customer history found & filled!', 'success');
        } else {
          showToast(lang === 'bn' ? 'নতুন কাস্টমার (পূর্ববর্তী কোনো রেকর্ড নেই)' : 'New customer (0 previous records)', 'info');
        }
      } else {
        setCourierReport({
          delivered: 0,
          returned: 0,
          totalOrders: 0,
          successRate: 100,
        });
        showToast(lang === 'bn' ? 'নতুন কাস্টমার (পূর্ববর্তী কোনো রেকর্ড নেই)' : 'New customer (0 previous records)', 'info');
      }
    } catch {
      setCourierReport({
        delivered: 0,
        returned: 0,
        totalOrders: 0,
        successRate: 100,
      });
      showToast(lang === 'bn' ? 'নতুন কাস্টমার (পূর্ববর্তী কোনো রেকর্ড নেই)' : 'New customer (0 previous records)', 'info');
    } finally {
      setIsCourierChecking(false);
    }
  };

  // Submit Order
  const handleFinalOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check reseller wallet balance - blocked ONLY if balance is strictly below -120 Tk
    const currentWalletBal = Number(employee?.wallet?.availableBalance ?? 0);
    if (currentWalletBal < -120) {
      setIsLowBalanceWarningOpen(true);
      return;
    }

    if (activeItems.length === 0) {
      showToast(lang === 'bn' ? 'কোনো পণ্য সিলেক্ট করা নেই' : 'No items selected', 'error');
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/[^0-9]/g, '').length < 11) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে কাস্টমারের সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন' : 'Enter valid 11-digit mobile number', 'error');
      return;
    }

    if (!customerName.trim()) {
      showToast(lang === 'bn' ? 'কাস্টমারের নাম লিখুন' : 'Enter customer name', 'error');
      return;
    }

    if (!specificAddress.trim()) {
      showToast(lang === 'bn' ? 'কাস্টমারের পূর্ণ হোম ডেলিভারি ঠিকানা লিখুন' : 'Enter delivery address', 'error');
      return;
    }

    if (isDeliveryPaidAdvance === null) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে ডেলিভারি চার্জ অগ্রিম নেওয়া হয়েছে কিনা সিলেক্ট করুন' : 'Select delivery charge advance status', 'error');
      return;
    }

    if (!employeeToken) {
      showToast(lang === 'bn' ? 'সেশন মেয়াদোত্তীর্ণ, অনুগ্রহ করে লগইন করুন' : 'Please login again', 'error');
      return;
    }

    const fullAddress = `জেলা: ${selectedDistrict}, থানা: ${selectedThana}, ঠিকানা: ${specificAddress.trim()}`;
    const reportNote = isReportBadgeAttached && courierReport
      ? ` [রিপোর্ট: ডেলিভারি ${courierReport.delivered}টি, রিটার্ন ${courierReport.returned}টি, ${courierReport.successRate}%]`
      : '';
    const deliveryNote = isDeliveryPaidAdvance === 'yes' ? ' [ডেলিভারি চার্জ অগ্রিম পেইড]' : ' [ডেলিভারি চার্জ ক্যাশ অন ৳১২০]';

    setIsSubmitting(true);
    const sharedOrderCode = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    try {
      for (const item of activeItems) {
        const sizeNote = item.size ? ` [সাইজ: ${item.size}]` : '';
        const cleanProdId = item.originalProductId
          ? item.originalProductId.split('_')[0]
          : item.id.split('_')[0];
        await api.employeeRecordSale(employeeToken, {
          productId: cleanProdId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: fullAddress,
          quantity: item.quantity,
          actualSalePrice: item.sellingPrice,
          orderCode: sharedOrderCode,
          size: item.size,
          notes: `${specialNotes}${sizeNote}${deliveryNote}${reportNote}`.trim(),
        });
      }

      const orderRecord = {
        orderId: sharedOrderCode,
        date: new Date().toLocaleString('bn-BD'),
        brandName: brandSettings?.appName || employee?.name || 'Tawzoon Nexus',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        fullAddress,
        items: [...activeItems],
        productsTotalAmount,
        deliveryFee: deliveryFee ?? 0,
        grandTotalAmount,
        totalProfit,
      };

      showToast(
        lang === 'bn'
          ? `🎉 সফলভাবে ${activeItems.length}টি পণ্যের অর্ডার কনফার্ম হয়েছে!`
          : `🎉 Order confirmed for ${activeItems.length} items!`,
        'success'
      );

      setConfirmedOrderData(orderRecord);
      sessionStorage.removeItem('tawzoon_reseller_pending_order_customer');
      sessionStorage.removeItem('tawzoon_reseller_pending_order_items');
      sessionStorage.removeItem('tawzoon_reseller_is_adding_to_order');
      window.dispatchEvent(new Event('tawzoon_reseller_order_mode_changed'));
      onOrderSuccess(activeItems.map(i => i.id));
    } catch (err: any) {
      if (err?.requiresBalanceTopup || err?.message?.includes('ব্যালেন্স') || err?.message?.includes('balance')) {
        setIsLowBalanceWarningOpen(true);
      } else {
        showToast(err.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* CUSTOMER DELIVERY INFORMATION FORM (STEP 1 REMOVED PERMANENTLY) */}
      {/* ------------------------------------------------------------- */}
      {!confirmedOrderData && (
        <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl rounded-none sm:rounded-3xl border-0 sm:border border-emerald-100/90 shadow-2xl overflow-hidden flex flex-col my-auto">
            
            {/* Modal Header: Title, Icon & Close button strictly on 1 line across all viewports */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#009245] text-white flex items-center justify-between gap-2 shrink-0 border-b border-emerald-600/30">
              <div className="flex items-center gap-2.5 min-w-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200 shrink-0" />
                <h3 className="text-sm sm:text-lg lg:text-xl font-black truncate leading-tight">কাস্টমারের ডেলিভারি তথ্য</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors active:scale-95"
              >
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form Body: Single clean vertical scroll, hidden scrollbar, touch friendly */}
            <form onSubmit={handleFinalOrderSubmit} className="p-3.5 sm:p-6 lg:p-7 space-y-3 sm:space-y-4 overflow-y-auto overflow-x-hidden flex-1 overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* ----------------------------------------------------------- */}
              {/* SECTION 1: ORDERED PRODUCTS LIST + ADD/REMOVE SYSTEM        */}
              {/* ----------------------------------------------------------- */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#009245]" />
                    <span className="text-xs sm:text-sm font-black text-slate-800">
                      অর্ডারকৃত পণ্যসমূহ ({activeItems.length}টি)
                    </span>
                  </div>

                  {/* "+ আরও প্রোডাক্ট যোগ করুন" Button */}
                  <button
                    type="button"
                    onClick={handleOpenAddProductFromCatalog}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ আরও প্রোডাক্ট যোগ করুন</span>
                  </button>
                </div>

                {/* Items Card List */}
                <div className="space-y-2.5">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 transition-all hover:border-emerald-200"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <img
                            src={item.imageUrl || '/images/product_shop_dress_1790244714775.jpg'}
                            alt={item.nameBn}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                          />

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={item.nameBn}>
                              {item.nameBn}
                            </h4>

                            <div className="flex items-center gap-1.5 text-[10.5px] sm:text-xs text-slate-600 flex-wrap">
                              <span className="font-mono font-bold text-[#009245] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">
                                #{item.productCode}
                              </span>
                              {item.size && (
                                <span className="bg-[#009245] text-white text-[10px] font-black px-1.5 py-0.5 rounded font-mono shrink-0">
                                  সাইজ: {item.size}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 active:scale-95"
                          title="পণ্যটি মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity Stepper & Price / Profit Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs sm:text-sm">
                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500">পরিমাণ:</span>
                          <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-black font-mono text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className="w-5 h-5 rounded bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Price & Profit Badges */}
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="text-slate-800">
                            বিক্রি: <span className="font-black text-rose-600">৳{(item.sellingPrice * item.quantity).toLocaleString()}</span>
                          </span>
                          <span className="text-[#009245] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            প্রফিট: +৳{(item.profit * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SECTION 2: CUSTOMER INFORMATION & MOBILE NUMBER CHECK       */}
              {/* ----------------------------------------------------------- */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                  <User className="w-4 h-4 text-[#009245]" />
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    {lang === 'bn' ? 'ডেলিভারি ঠিকানা ও তথ্য' : 'Delivery & Contact Information'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Name */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>{lang === 'bn' ? 'কাস্টমারের নাম' : 'Full Name'}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: আরিফ হাসান' : 'e.g. Arif Hasan'}
                        className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone + "নম্বর চেক" Button */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>{lang === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1 min-w-0">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                          placeholder="01XXXXXXXXX"
                          className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] font-bold text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isCourierChecking}
                        onClick={handleCheckCustomerPhone}
                        className="px-3 py-2 bg-[#009245] hover:bg-[#007a3a] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {isCourierChecking ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>যাচাই হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>নম্বর চেক</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Courier Report Banner INSIDE the exact same container of Mobile Phone */}
                    {courierReport && (() => {
                        const successRate = typeof courierReport.successRate === 'number'
                          ? courierReport.successRate
                          : parseInt(String(courierReport.successRate), 10) || 0;
                        const isHighRisk = courierReport.riskStatus === 'RED' || successRate < 50;
                        const isModerateRisk = courierReport.riskStatus === 'YELLOW' || (successRate >= 50 && successRate < 80);

                        return (
                          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-xs space-y-2.5 text-xs transition-all duration-200 mt-2">
                            {/* Header: Title, Level & Close button */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-slate-900 font-black text-xs sm:text-sm">
                                <ShieldCheck className="w-4 h-4 text-[#009245]" />
                                <span>ডেলিভারি হিস্ট্রি রিপোর্ট</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500">
                                  লেভেলঃ
                                  <span className={`ml-1 px-2 py-0.5 rounded font-black ${
                                    isHighRisk
                                      ? 'bg-rose-100 text-rose-700'
                                      : isModerateRisk
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {isHighRisk ? 'High Risk' : isModerateRisk ? 'Moderate' : 'Medium (নিরাপদ)'}
                                  </span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCourierReport(null);
                                    setIsReportBadgeAttached(false);
                                  }}
                                  className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                                  title="বন্ধ করুন"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Clean, bold delivery stats (ShopBase BD style without annoying nested borders) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-bold text-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <span>ডেলিভারি অর্ডারঃ</span>
                                  <span className="bg-[#009245] text-white px-2 py-0.5 rounded font-mono font-black text-xs shadow-xs">
                                    {courierReport.delivered}
                                  </span>
                                  <span>টি</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span>রিটার্ন অর্ডারঃ</span>
                                  <span className="bg-rose-600 text-white px-2 py-0.5 rounded font-mono font-black text-xs shadow-xs">
                                    {courierReport.returned}
                                  </span>
                                  <span>টি</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500">সফলতার হারঃ</span>
                                  <span className="font-mono font-black text-[#009245]">
                                    {successRate}%
                                  </span>
                                </div>
                              </div>

                              <div>
                                {!isReportBadgeAttached ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsReportBadgeAttached(true);
                                      showToast(lang === 'bn' ? 'রিপোর্ট অর্ডারে যুক্ত করা হয়েছে✓' : 'Report attached');
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                                  >
                                    <Plus className="w-3 h-3 stroke-[3]" />
                                    <span>রিপোর্ট যুক্ত করুন</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-black text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>✓ যুক্ত হয়েছে</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Clean Slim Progress Indicator */}
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isHighRisk ? 'bg-rose-500' : isModerateRisk ? 'bg-amber-500' : 'bg-[#009245]'
                                }`}
                                style={{ width: `${Math.min(Math.max(successRate, 0), 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  {/* District Selection (Searchable) */}
                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{lang === 'bn' ? 'জেলা সিলেক্ট করুন' : 'Select District'}</span>
                      <span className="text-[10.5px] font-bold text-[#009245] font-mono">
                        {isDhaka ? '৳৭০ ডেলিভারি' : '৳১২০ ডেলিভারি'}
                      </span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={isDistrictDropdownOpen ? districtQuery : selectedDistrict}
                        onFocus={() => {
                          setIsDistrictDropdownOpen(true);
                          setDistrictSearchQuery('');
                        }}
                        onChange={(e) => {
                          setDistrictSearchQuery(e.target.value);
                          setIsDistrictDropdownOpen(true);
                        }}
                        placeholder="জেলা সার্চ করুন..."
                        className="w-full pl-9 pr-8 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] font-bold text-slate-900"
                      />
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {isDistrictDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] p-1 space-y-0.5">
                        {matchingDistricts.length > 0 ? (
                          matchingDistricts.map((dist) => (
                            <button
                              key={dist}
                              type="button"
                              onClick={() => {
                                setSelectedDistrict(dist);
                                setIsDistrictDropdownOpen(false);
                                setDistrictSearchQuery('');
                                const thanas = bdDistrictsAndThanas[dist] || ['সদর'];
                                setSelectedThana(thanas[0] || 'সদর');
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer ${
                                selectedDistrict === dist ? 'bg-emerald-50 text-[#009245] font-black' : 'hover:bg-slate-100 text-slate-700 font-bold'
                              }`}
                            >
                              <span>{dist}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {dist === 'ঢাকা' ? '৳৭০' : '৳১২০'}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-slate-500 text-center font-medium">কোনো জেলা পাওয়া যায়নি!</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thana / Upazila Selection */}
                  <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-slate-700">
                      {lang === 'bn' ? 'থানা / উপজেলা / এলাকা' : 'Thana / Upazila / Area'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={isThanaDropdownOpen ? thanaQuery : selectedThana}
                        onFocus={() => {
                          setIsThanaDropdownOpen(true);
                          setThanaSearchQuery('');
                        }}
                        onChange={(e) => {
                          setThanaSearchQuery(e.target.value);
                          setIsThanaDropdownOpen(true);
                        }}
                        placeholder="থানা / এলাকা লিখুন..."
                        className="w-full pl-9 pr-8 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] font-bold text-slate-900"
                      />
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {isThanaDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-[9999] p-1 space-y-0.5">
                        {matchingThanas.length > 0 ? (
                          matchingThanas.map((thana) => (
                            <button
                              key={thana}
                              type="button"
                              onClick={() => {
                                setSelectedThana(thana);
                                setIsThanaDropdownOpen(false);
                                setThanaSearchQuery('');
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer ${
                                selectedThana === thana ? 'bg-emerald-50 text-[#009245] font-black' : 'hover:bg-slate-100 text-slate-700 font-bold'
                              }`}
                            >
                              <span>{thana}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-slate-500 text-center font-medium">কোনো থানা পাওয়া যায়নি!</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>


                {/* Detailed Address */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>{lang === 'bn' ? 'সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা নং, রোড নং, এলাকা)' : 'Detailed Address'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={specificAddress}
                    onChange={(e) => setSpecificAddress(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: বাসা- ১২/এ, রোড- ৪, ব্লক- বি, ধানমন্ডি, ঢাকা' : 'House, Road, Block, Area details...'}
                    className="w-full px-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] font-bold text-slate-900 resize-none"
                  />
                </div>

                {/* Special Instructions */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">
                    {lang === 'bn' ? 'বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)' : 'Special Instructions (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: অফিস সময়ে ডেলিভারি দিন অথবা ফোন দিয়ে আসবেন' : 'e.g. Call before delivery'}
                    className="w-full px-3 py-1.5 bg-white text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245] text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SECTION 4: DELIVERY CHARGE ADVANCE PAYMENT OPTION           */}
              {/* ----------------------------------------------------------- */}
              <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-center space-y-2.5">
                <div className="text-xs sm:text-sm font-black text-amber-950 text-center">
                  <span>ডেলিভারি চার্জ (৳{isDhaka ? 70 : 120}) অগ্রিম নিয়েছেন?</span>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-black pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeliveryAdvance('yes');
                      setIsDeliveryConfirmOpen(true);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer min-w-[95px] sm:min-w-[110px] ${
                      isDeliveryPaidAdvance === 'yes'
                        ? 'bg-[#009245] text-white border-[#009245] shadow-2xs scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isDeliveryPaidAdvance === 'yes' ? 'bg-white text-[#009245]' : 'border border-slate-300'
                    }`}>
                      {isDeliveryPaidAdvance === 'yes' ? '✓' : ''}
                    </span>
                    <span>হ্যাঁ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeliveryAdvance('no');
                      setIsDeliveryConfirmOpen(true);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all cursor-pointer min-w-[95px] sm:min-w-[110px] ${
                      isDeliveryPaidAdvance === 'no'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isDeliveryPaidAdvance === 'no' ? 'bg-white text-rose-600' : 'border border-slate-300'
                    }`}>
                      {isDeliveryPaidAdvance === 'no' ? '✓' : ''}
                    </span>
                    <span>না</span>
                  </button>
                </div>
              </div>

              {/* Delivery Charge Confirmation Modal */}
              {isDeliveryConfirmOpen && (
                <div className="fixed inset-0 z-[100020] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
                  <div className="bg-white w-full max-w-md rounded-3xl border border-amber-200 shadow-2xl overflow-hidden flex flex-col my-auto p-5 sm:p-6 space-y-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs font-black text-xl">
                      ⚠️
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        ডেলিভারি চার্জ সংক্রান্ত গুরুত্বপূর্ণ নির্দেশনা
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed text-left bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80">
                        ডেলিভারি চার্জ রিসেলারকেই কাস্টমারের কাছ থেকে সংগ্রহ করতে হবে। ডেলিভারি ড্রাইভার বা কোম্পানি এই টাকা আপনার হয়ে সংগ্রহ করবে না। তাই অর্ডার নিশ্চিত করার আগে কাস্টমারের সঙ্গে ডেলিভারি চার্জের বিষয়ে কথা বলে নিশ্চিত হয়ে নিন।
                        <br /><br />
                        আপনি কি বিষয়টি বুঝে এই নির্বাচনটি নিশ্চিত করতে চান?
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeliveryConfirmOpen(false);
                          setPendingDeliveryAdvance(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDeliveryPaidAdvance(pendingDeliveryAdvance);
                          setIsDeliveryConfirmOpen(false);
                          setPendingDeliveryAdvance(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                      >
                        ঠিক আছে, নিশ্চিত করুন
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* SECTION 5: TOTAL ORDER SUMMARY ROW                          */}
              {/* ----------------------------------------------------------- */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-[#f0faf3] border border-emerald-200 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 shadow-3xs divide-x divide-emerald-200/80">
                <div className="px-1 text-center flex-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block font-medium truncate">আইটেম</span>
                  <span className="text-slate-900 font-black font-mono text-xs sm:text-sm truncate block">{activeItems.length}টি</span>
                </div>

                <div className="px-1 text-center flex-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block font-medium truncate">পণ্যের মূল্য</span>
                  <span className="text-slate-900 font-mono font-black text-xs sm:text-sm truncate block">
                    ৳{productsTotalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="px-1 text-center flex-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block font-medium truncate">ডেলিভারি</span>
                  <span className="text-amber-800 font-mono font-black text-xs sm:text-sm truncate block">
                    {deliveryFee !== null ? `৳${deliveryFee}` : '--'}
                  </span>
                </div>

                <div className="px-1 text-center flex-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block font-medium truncate">মোট বিল</span>
                  <span className="text-rose-600 font-mono font-black text-xs sm:text-sm md:text-base truncate block">
                    {deliveryFee !== null ? `৳${grandTotalAmount.toLocaleString()}` : '--'}
                  </span>
                </div>

                <div className="px-1 text-center flex-1 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-emerald-800 block font-medium truncate">প্রফিট</span>
                  <span className="text-[#009245] font-mono font-black text-xs sm:text-sm md:text-base truncate block">+৳{totalProfit.toLocaleString()}</span>
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* SECTION 6: SUBMIT ORDER BUTTON                              */}
              {/* ----------------------------------------------------------- */}
              <div className="pt-2 pb-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isDeliveryPaidAdvance === null}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>অর্ডার প্রক্রিয়াজাত হচ্ছে...</span>
                  ) : isDeliveryPaidAdvance === null ? (
                    <span>⚠️ ডেলিভারি চার্জ অগ্রিম নিয়েছেন কিনা সিলেক্ট করুন</span>
                  ) : (
                    <span>কনফার্ম অর্ডার করুন 🚀 (৳{grandTotalAmount.toLocaleString()})</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRODUCT SELECTION POPUP MODAL ("+ আরও প্রোডাক্ট যোগ করুন")     */}
      {/* ------------------------------------------------------------- */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100010] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-[#009245] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-200" />
                <h4 className="text-sm sm:text-base font-black">
                  অর্ডারে আরও প্রোডাক্ট যুক্ত করুন
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={e => setProductSearchQuery(e.target.value)}
                  placeholder="পণ্যের নাম বা কোড দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-3 py-2 bg-white text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {isLoadingCatalog ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#009245] mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">পণ্য লোড হচ্ছে...</p>
                </div>
              ) : (
                allCatalogProducts
                  .filter(p => isSearchTextMatch(p.nameBn || '', productSearchQuery) || isSearchTextMatch(p.productCode || '', productSearchQuery))
                  .slice(0, 30)
                  .map(prod => {
                    const pTitle = prod.nameBn;
                    const pImg = prod.images?.find(i => i.isPrimary)?.url || prod.images?.[0]?.url || prod.imageUrl || '/images/product_shop_dress_1790244714775.jpg';
                    const price = getAdjustedSellingPrice(prod, employee, brandSettings);
                    const profit = getResellerProfitPerUnit(prod, employee, brandSettings, price);
                    const isSelected = selectedProductToAdd?.id === prod.id;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedProductToAdd(prod);
                          const sizes = getProductSizes(prod);
                          setAddSize(sizes.length > 0 ? sizes[0] : 'স্ট্যান্ডার্ড');
                        }}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#009245] ring-2 ring-[#009245]/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={pImg} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-100 bg-slate-50 shrink-0" />
                          <div className="min-w-0 space-y-0.5">
                            <h6 className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-[280px]">{pTitle}</h6>
                            <div className="flex items-center gap-2 text-[10.5px] font-mono">
                              <span className="text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200/60">
                                #{prod.productCode}
                              </span>
                              <span className="text-rose-600 font-bold">৳{price.toLocaleString()}</span>
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">
                                প্রফিট: +৳{profit}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-[#009245] text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                              সিলেক্ট করুন
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Selected Product Size & Quantity Configuration */}
            {selectedProductToAdd && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Size selection */}
                  {getProductSizes(selectedProductToAdd).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        সাইজ নির্বাচন:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {getProductSizes(selectedProductToAdd).map(sz => {
                          const isActive = (addSize || getProductSizes(selectedProductToAdd)[0]) === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setAddSize(sz)}
                              className={`px-2 py-0.5 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#009245] text-white border-[#009245]'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block text-right">
                      পরিমাণ:
                    </span>
                    <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-3xs">
                      <button
                        type="button"
                        onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black font-mono">{addQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setAddQuantity(addQuantity + 1)}
                        className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAddProduct}
                  className="w-full py-2.5 bg-[#009245] hover:bg-[#007a38] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>অর্ডারে যুক্ত করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Order Memo Preview Modal */}
      {confirmedOrderData && (
        <div className="fixed inset-0 z-[100050] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            
            {/* Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-[#009245] text-white flex items-center justify-between gap-2 shrink-0 border-b border-emerald-600/30">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-emerald-200 shrink-0" />
                <h3 className="text-sm font-black truncate leading-tight">
                  {!isMemoGenerated ? 'মেমো ইনফরমেশন দিন' : 'কাস্টমার ক্যাশ মেমো'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrderData(null);
                  setIsMemoGenerated(false);
                  setResellerTab('orders');
                  onClose();
                }}
                aria-label="বন্ধ করুন"
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors active:scale-95"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50 text-xs text-slate-800 font-medium">
              
              {!isMemoGenerated ? (
                /* Step A: Input Page/Brand Name */
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#009245] flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">আপনার নিজস্ব ক্যাশ মেমো তৈরি করুন</h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                      মেমোতে আপনার ফেসবুক পেইজ বা প্রতিষ্ঠানের নাম বসবে। এতে আপনার পাইকারি মূল্য, প্রফিট বা কোনো গোপন তথ্য কাস্টমার দেখতে পাবে না।
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      আপনার পেইজ / প্রতিষ্ঠানের নাম দিন <span className="text-[#009245]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={resellerPageName}
                      onChange={(e) => {
                        setResellerPageName(e.target.value);
                        localStorage.setItem('reseller_page_name', e.target.value);
                      }}
                      placeholder="যেমন: আরিয়ান কালেকশন / My Online Shop"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!resellerPageName.trim()}
                    onClick={() => setIsMemoGenerated(true)}
                    className="w-full py-3 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>মেমো তৈরি করুন 📄</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrderData(null);
                      setIsMemoGenerated(false);
                      setResellerTab('orders');
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    স্কিপ করুন
                  </button>
                </div>
              ) : (
                /* Step B: Beautiful Generated Memo with html2canvas target wrapper */
                <div className="space-y-3">
                  
                  {/* Container that html2canvas will convert into image */}
                  <div id="memo-canvas" className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-slate-800">
                    
                    {/* Header */}
                    <div className="text-center pb-3 border-b-2 border-dashed border-slate-200 space-y-1">
                      <h2 className="text-lg font-black text-emerald-700 tracking-tight leading-tight uppercase">
                        {resellerPageName}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-black tracking-wider uppercase">ক্যাশ মেমো ও ডেলিভারি ইনভয়েস</p>
                    </div>

                    {/* Memo Meta details */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                      <span>মেমো নং: <strong className="text-slate-850 font-black">{confirmedOrderData.orderId}</strong></span>
                      <span>তারিখ: <strong className="text-slate-850">{confirmedOrderData.date}</strong></span>
                    </div>

                    {/* Customer Info Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">কাস্টমারের নাম:</span>
                        <span className="font-black text-slate-900">{confirmedOrderData.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">মোবাইল নম্বর:</span>
                        <span className="font-black text-slate-900 font-mono">{confirmedOrderData.customerPhone}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-bold text-slate-500 shrink-0">ডেলিভারি ঠিকানা:</span>
                        <span className="font-bold text-slate-900 text-right leading-tight">{confirmedOrderData.fullAddress}</span>
                      </div>
                    </div>

                    {/* Product List Table */}
                    <div className="space-y-1.5">
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                              <th className="p-2.5">পণ্য বিবরণী</th>
                              <th className="p-2.5 text-center">পরিমাণ</th>
                              <th className="p-2.5 text-right">মূল্য</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                            {confirmedOrderData.items.map((item: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-2.5 leading-snug">
                                  <span className="font-black text-slate-900 block truncate max-w-[150px]">{item.nameBn}</span>
                                  {item.size && (
                                    <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-black mt-0.5 inline-block">
                                      সাইজ: {item.size}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-mono font-black">{item.quantity} পিস</td>
                                <td className="p-2.5 text-right font-mono font-black text-slate-900">৳{(item.sellingPrice * item.quantity).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Price calculations without profit/agent commission */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">পণ্যের মূল্য:</span>
                        <span className="font-black text-slate-900 font-mono">৳{confirmedOrderData.productsTotalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">ডেলিভারি চার্জ:</span>
                        <span className="font-black text-slate-900 font-mono">৳{confirmedOrderData.deliveryFee}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-black text-emerald-700">
                        <span>সর্বমোট দেয় বিল (COD):</span>
                        <span className="font-mono text-base">৳{confirmedOrderData.grandTotalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Thank you note */}
                    <p className="text-[9.5px] text-center text-slate-400 font-black tracking-wider uppercase pt-1">
                      * আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *
                    </p>

                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={async () => {
                        setIsDownloading(true);
                        try {
                          const itemsCount = confirmedOrderData.items.length;
                          const canvasWidth = 600;
                          const canvasHeight = 720 + (itemsCount * 55);

                          const scale = 3; // Ultra HD (Retina 3x scale)
                          const canvas = document.createElement('canvas');
                          canvas.width = canvasWidth * scale;
                          canvas.height = canvasHeight * scale;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) throw new Error('Could not get 2d context');

                          // Apply Retina scaling factor
                          ctx.scale(scale, scale);

                          // Enable high-quality image smoothing
                          ctx.imageSmoothingEnabled = true;
                          ctx.imageSmoothingQuality = 'high';

                          // 1. White Background
                          ctx.fillStyle = '#FFFFFF';
                          ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                          // 2. Premium Top Bar with Gold Sub-Line
                          ctx.fillStyle = '#15803d'; // Rich forest green
                          ctx.fillRect(0, 0, canvasWidth, 14);
                          ctx.fillStyle = '#d97706'; // Golden yellow accent line
                          ctx.fillRect(0, 14, canvasWidth, 3);

                          // 3. Draw Outer Border with subtle double frame
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 2;
                          ctx.strokeRect(8, 25, canvasWidth - 16, canvasHeight - 33);
                          ctx.strokeStyle = '#e2e8f0';
                          ctx.lineWidth = 1;
                          ctx.strokeRect(12, 29, canvasWidth - 24, canvasHeight - 41);

                          // 4. Subtle security seal watermark in background
                          ctx.save();
                          ctx.translate(canvasWidth / 2, canvasHeight / 2);
                          ctx.rotate(-Math.PI / 8); // rotate 22.5 degrees
                          ctx.strokeStyle = 'rgba(21, 128, 61, 0.05)';
                          ctx.lineWidth = 3;
                          ctx.beginPath();
                          ctx.arc(0, 0, 85, 0, Math.PI * 2);
                          ctx.stroke();
                          ctx.fillStyle = 'rgba(21, 128, 61, 0.05)';
                          ctx.textAlign = 'center';
                          ctx.font = 'bold 16px "Arial", sans-serif';
                          ctx.fillText('ORIGINAL MEMO', 0, -10);
                          ctx.fillText('★ VERIFIED ★', 0, 15);
                          ctx.restore();

                          // 5. Header: Page Name (Huge, Bold, Elegant)
                          ctx.fillStyle = '#15803d';
                          ctx.textAlign = 'center';
                          ctx.font = 'bold 30px "Arial", sans-serif';
                          ctx.fillText(resellerPageName.toUpperCase(), canvasWidth / 2, 68);

                          // Subtitle
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText('ক্যাশ মেমো ও ডেলিভারি ইনভয়েস', canvasWidth / 2, 90);

                          // Styled Divider Line
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1.5;
                          ctx.setLineDash([5, 3]);
                          ctx.beginPath();
                          ctx.moveTo(35, 108);
                          ctx.lineTo(canvasWidth - 35, 108);
                          ctx.stroke();
                          ctx.setLineDash([]); // Reset dash

                          // 6. Memo Meta Details (Left & Right aligned)
                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(`মেমো নং: `, 35, 138);
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.orderId, 95, 138);

                          ctx.textAlign = 'right';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(`তারিখ: `, canvasWidth - 190, 138);
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 12px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.date, canvasWidth - 35, 138);

                          // 7. Customer Info Box (With green left-highlight vertical bar)
                          const boxY = 160;
                          const boxHeight = 115;
                          const boxWidth = canvasWidth - 70;

                          // Rounded Background
                          ctx.fillStyle = '#f8fafc';
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1;
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, boxY, boxWidth, boxHeight, 14);
                          } else {
                            ctx.rect(35, boxY, boxWidth, boxHeight);
                          }
                          ctx.fill();
                          ctx.stroke();

                          // Draw highlight bar on the left of customer card
                          ctx.fillStyle = '#15803d';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, boxY, 6, boxHeight, [14, 0, 0, 14]);
                          } else {
                            ctx.fillRect(35, boxY, 6, boxHeight);
                          }
                          ctx.fill();

                          // Customer details labels and values
                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText('কাস্টমারের নাম:', 55, boxY + 32);
                          ctx.fillText('মোবাইল নম্বর:', 55, boxY + 62);
                          ctx.fillText('ডেলিভারি ঠিকানা:', 55, boxY + 92);

                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.customerName, 175, boxY + 32);
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText(confirmedOrderData.customerPhone, 175, boxY + 62);
                          
                          // Wrap and draw address
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          const addressText = confirmedOrderData.fullAddress;
                          const maxAddressWidth = canvasWidth - 230;
                          ctx.fillText(addressText, 175, boxY + 92, maxAddressWidth);

                          // 8. Product List Table Header
                          let currentY = boxY + boxHeight + 35;
                          ctx.fillStyle = '#15803d';
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, currentY, boxWidth, 38, [10, 10, 0, 0]);
                          } else {
                            ctx.fillRect(35, currentY, boxWidth, 38);
                          }
                          ctx.fill();

                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.textAlign = 'left';
                          ctx.fillText('পণ্য বিবরণী', 50, currentY + 24);
                          ctx.textAlign = 'center';
                          ctx.fillText('পরিমাণ', canvasWidth / 2 + 50, currentY + 24);
                          ctx.textAlign = 'right';
                          ctx.fillText('মূল্য', canvasWidth - 50, currentY + 24);

                          // Items Rows with alternate background styling
                          currentY += 38;
                          confirmedOrderData.items.forEach((item: any, idx: number) => {
                            // Alternate shading
                            ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                            ctx.fillRect(35, currentY, boxWidth, 50);

                            ctx.strokeStyle = '#e2e8f0';
                            ctx.lineWidth = 1;
                            ctx.strokeRect(35, currentY, boxWidth, 50);

                            ctx.textAlign = 'left';
                            ctx.fillStyle = '#0f172a';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(item.nameBn, 50, currentY + 20, 260);

                            ctx.fillStyle = '#64748b';
                            ctx.font = 'bold 10.5px "Arial", sans-serif';
                            const sizeText = item.size ? ` [সাইজ: ${item.size}]` : '';
                            ctx.fillText(`#${item.productCode}${sizeText}`, 50, currentY + 38);

                            ctx.textAlign = 'center';
                            ctx.fillStyle = '#0f172a';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(`${item.quantity} পিস`, canvasWidth / 2 + 50, currentY + 29);

                            ctx.textAlign = 'right';
                            ctx.font = 'bold 13px "Arial", sans-serif';
                            ctx.fillText(`৳${(item.sellingPrice * item.quantity).toLocaleString()}`, canvasWidth - 50, currentY + 29);

                            currentY += 50;
                          });

                          // 9. Totals summary Card
                          currentY += 20;
                          ctx.fillStyle = '#f8fafc';
                          ctx.strokeStyle = '#cbd5e1';
                          ctx.lineWidth = 1;
                          ctx.beginPath();
                          if (ctx.roundRect) {
                            ctx.roundRect(35, currentY, boxWidth, 115, 12);
                          } else {
                            ctx.rect(35, currentY, boxWidth, 115);
                          }
                          ctx.fill();
                          ctx.stroke();

                          ctx.textAlign = 'left';
                          ctx.fillStyle = '#475569';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText('পণ্যের মূল্য:', 55, currentY + 30);
                          ctx.fillText('ডেলিভারি চার্জ:', 55, currentY + 60);
                          
                          ctx.fillStyle = '#15803d';
                          ctx.font = 'bold 14px "Arial", sans-serif';
                          ctx.fillText('সর্বমোট দেয় বিল (COD):', 55, currentY + 92);

                          ctx.textAlign = 'right';
                          ctx.fillStyle = '#0f172a';
                          ctx.font = 'bold 13px "Arial", sans-serif';
                          ctx.fillText(`৳${confirmedOrderData.productsTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 30);
                          ctx.fillText(`৳${confirmedOrderData.deliveryFee}`, canvasWidth - 55, currentY + 60);
                          
                          ctx.fillStyle = '#15803d';
                          ctx.font = 'bold 17px "Arial", sans-serif';
                          ctx.fillText(`৳${confirmedOrderData.grandTotalAmount.toLocaleString()}`, canvasWidth - 55, currentY + 92);

                          // 10. Official Signature Block section (Premium)
                          currentY += 165;
                          ctx.strokeStyle = '#94a3b8';
                          ctx.lineWidth = 1;
                          ctx.setLineDash([4, 3]);

                          // Left side: Customer sign line
                          ctx.beginPath();
                          ctx.moveTo(35, currentY - 50);
                          ctx.lineTo(155, currentY - 50);
                          ctx.stroke();

                          // Right side: Authorized sign line
                          ctx.beginPath();
                          ctx.moveTo(canvasWidth - 155, currentY - 50);
                          ctx.lineTo(canvasWidth - 35, currentY - 50);
                          ctx.stroke();

                          ctx.setLineDash([]); // Reset line dash

                          ctx.fillStyle = '#64748b';
                          ctx.font = 'bold 11px "Arial", sans-serif';
                          ctx.textAlign = 'center';
                          ctx.fillText('ক্রেতার স্বাক্ষর', 95, currentY - 32);
                          ctx.fillText('অনুমোদিত স্বাক্ষর', canvasWidth - 95, currentY - 32);

                          // 11. Custom Thank you note footer
                          ctx.textAlign = 'center';
                          ctx.fillStyle = '#64748b';
                          ctx.font = 'bold 11px "Arial", sans-serif';
                          ctx.fillText('* আমাদের থেকে কেনাকাটা করার জন্য ধন্যবাদ *', canvasWidth / 2, currentY);

                          // Trigger HD download trigger
                          const imgData = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `MEMO_${resellerPageName.replace(/\s+/g, '_')}_${confirmedOrderData.orderId}.png`;
                          link.href = imgData;
                          link.click();
                          showToast(lang === 'bn' ? 'মেমো ইমেজ সফলভাবে ডাউনলোড হয়েছে!' : 'Memo downloaded!', 'success');
                        } catch (err: any) {
                          console.error('Canvas download error:', err);
                          showToast(lang === 'bn' ? `ডাউনলোড সমস্যা: ${err?.message || err}` : 'Download failed', 'error');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#009245] hover:bg-[#007a3a] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{isDownloading ? 'মেমো তৈরি হচ্ছে...' : 'মেমো ডাউনলোড করুন 📥'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMemoGenerated(false)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center"
                      >
                        এডিট করুন ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmedOrderData(null);
                          setIsMemoGenerated(false);
                          setResellerTab('orders');
                          onClose();
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#009245] font-black text-xs transition-colors cursor-pointer text-center"
                      >
                        ঠিক আছে ✅
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Low Balance Warning Modal (Insufficient Balance) */}
      {isLowBalanceWarningOpen && (
        <div className="fixed inset-0 z-[100100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-slate-900">
                {lang === 'bn' ? 'আপনার অ্যাকাউন্টে ব্যালেন্স যোগ করুন' : 'Add Balance to Continue'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? `আপনার বর্তমান ব্যালেন্স ৳${Number(employee?.wallet?.availableBalance ?? 0).toLocaleString()}। কোম্পানির নিয়ম অনুযায়ী ব্যালেন্স -৳১২০ এর নিচে নেমে গেলে নতুন অর্ডার কনফার্ম করা যায় না। পরবর্তী অর্ডার করতে অনুগ্রহ করে ব্যালেন্স যোগ করুন।`
                  : `Your current balance is ৳${Number(employee?.wallet?.availableBalance ?? 0).toLocaleString()}. Orders cannot be confirmed when balance drops below -৳120. Please add balance to continue.`}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsLowBalanceWarningOpen(false);
                  setIsAddBalanceModalOpen(true);
                }}
                className="w-full py-3 bg-[#009245] hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <Wallet className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ব্যালেন্স অ্যাড করুন' : 'Add Balance Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLowBalanceWarningOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'bn' ? 'পরে করব' : 'Later'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Reseller Add Balance Modal */}
      <ResellerAddBalanceModal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        initialAmount={120}
        onSuccess={() => {
          setIsAddBalanceModalOpen(false);
          setIsLowBalanceWarningOpen(false);
        }}
      />
    </>
  );
};