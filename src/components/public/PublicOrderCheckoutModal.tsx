import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
  Truck,
  Phone,
  User,
  MapPin,
  FileText,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';
import { api } from '../../services/api.js';
import { bdDistrictsAndThanas, isSearchTextMatch } from '../../data/bdLocations.js';
import { getAdjustedSellingPrice } from '../../utils/pricing.js';
import { getProductSizes } from '../../utils/productSizes.js';
import { ProductCard } from '../ProductCard.js';

export interface OrderItemState {
  productId: string;
  originalProduct: Product;
  productName: string;
  productCode: string;
  imageUrl: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export const PublicOrderCheckoutModal: React.FC<{ reseller?: any }> = ({ reseller }) => {
  const {
    lang,
    isCheckoutModalOpen,
    closeCheckoutModal,
    checkoutModalItems,
    employee,
    brandSettings,
    clearCart,
    showToast,
    publicCategory,
    setPublicCategory,
  } = useApp();

  // Active products in the order
  const [orderItems, setOrderItems] = useState<OrderItemState[]>([]);

  // Customer & Shipping Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ঢাকা');
  const [districtQuery, setDistrictQuery] = useState('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const [selectedThana, setSelectedThana] = useState('ধানমন্ডি');
  const [thanaQuery, setThanaQuery] = useState('');
  const [isThanaDropdownOpen, setIsThanaDropdownOpen] = useState(false);

  const [specificAddress, setSpecificAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Add Product Sub-Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<Product | null>(null);
  const [addSize, setAddSize] = useState<string>('M');
  const [addQuantity, setAddQuantity] = useState<number>(1);

  // Payment (Personal Send Money) Popup State
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isCopiedPhone, setIsCopiedPhone] = useState(false);

  // Alternative Method (COD) Confirmation State
  const [isAlternativeModalOpen, setIsAlternativeModalOpen] = useState(false);

  // Order Success Receipt State
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedOrderCode, setCopiedOrderCode] = useState(false);

  // Initialize order items whenever checkout items change or modal opens
  useEffect(() => {
    if (isCheckoutModalOpen) {
      // 1. Restore customer form inputs if saved in session
      try {
        const savedCust = sessionStorage.getItem('tawzoon_pending_order_customer');
        if (savedCust) {
          const parsed = JSON.parse(savedCust);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
          if (parsed.selectedDistrict) setSelectedDistrict(parsed.selectedDistrict);
          if (parsed.selectedThana) setSelectedThana(parsed.selectedThana);
          if (parsed.specificAddress) setSpecificAddress(parsed.specificAddress);
          if (parsed.specialNotes) setSpecialNotes(parsed.specialNotes);
        }
      } catch {}

      // 2. Load order items
      if (checkoutModalItems && checkoutModalItems.length > 0) {
        const mapped: OrderItemState[] = checkoutModalItems.map(item => {
          const unitPrice = getAdjustedSellingPrice(item.product, employee, brandSettings);
          const availableSizes = getProductSizes(item.product);
          const size = item.size || (availableSizes.length > 0 ? availableSizes[0] : 'স্ট্যান্ডার্ড');
          const img =
            (item.product as any).selectedImageUrl ||
            (item as any).imageUrl ||
            item.product.imageUrl ||
            item.product.images?.find(i => i.isPrimary)?.url ||
            item.product.images?.[0]?.url ||
            '/images/product_shop_dress_1790244714775.jpg';

          return {
            productId: item.product.id,
            originalProduct: item.product,
            productName: lang === 'bn' ? item.product.nameBn : (item.product.nameEn || item.product.nameBn),
            productCode: item.product.productCode,
            imageUrl: img,
            size,
            quantity: item.quantity || 1,
            unitPrice,
          };
        });
        setOrderItems(mapped);
        try {
          sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(mapped));
        } catch {}
      } else {
        // Fallback to items saved in session if any
        try {
          const savedItems = sessionStorage.getItem('tawzoon_pending_order_items');
          if (savedItems) {
            const parsed = JSON.parse(savedItems);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrderItems(parsed);
            }
          }
        } catch {}
      }

      setConfirmedOrder(null);
      setIsPaymentPopupOpen(false);
      setIsAlternativeModalOpen(false);
    }
  }, [isCheckoutModalOpen, checkoutModalItems, lang, employee, brandSettings]);

  // Load all available catalog products for the "Add Product" popup
  useEffect(() => {
    if (isCheckoutModalOpen && allProducts.length === 0) {
      api.getProducts().then(res => {
        if (res && res.products) {
          setAllProducts(res.products.filter(p => p.isActive && !p.isArchived));
        }
      }).catch(err => {
        console.warn('Failed to load products for picker:', err);
      });
    }
  }, [isCheckoutModalOpen, allProducts.length]);

  // Available districts and thanas
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

  // Delivery Charge Calculation:
  // Inside Dhaka = 70 TK, Outside Dhaka = 120 TK
  const isDhaka = useMemo(() => {
    const trimmed = selectedDistrict.trim();
    return trimmed === 'ঢাকা' || trimmed.toLowerCase() === 'dhaka';
  }, [selectedDistrict]);

  const deliveryCharge = isDhaka ? 70 : 120;

  // Subtotal and Total calculations
  const subtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [orderItems]);

  const grandTotal = subtotal + deliveryCharge;

  // Personal Payment Number (bKash & Nagad)
  const personalBkashNumber = brandSettings?.resellerSubscriptionPaymentPhone ||
    brandSettings?.helplinePhone ||
    brandSettings?.whatsappNumber ||
    '01800000000';
  const personalNagadNumber = personalBkashNumber;

  // Update item quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setOrderItems(prev => {
      const copy = [...prev];
      const newQty = Math.max(1, copy[index].quantity + delta);
      copy[index] = { ...copy[index], quantity: newQty };
      return copy;
    });
  };

  // Update item size
  const handleUpdateSize = (index: number, newSize: string) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], size: newSize };
      try {
        sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(copy));
      } catch {}
      return copy;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      try {
        sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(lang === 'bn' ? 'পণ্যটি সরানো হয়েছে।' : 'Item removed.');
  };

  // Open add product via public page full storefront browsing
  const handleOpenAddProduct = () => {
    try {
      sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(orderItems));
      sessionStorage.setItem('tawzoon_pending_order_customer', JSON.stringify({
        customerName,
        customerPhone,
        selectedDistrict,
        selectedThana,
        specificAddress,
        specialNotes,
      }));
      sessionStorage.setItem('tawzoon_is_adding_to_order', 'true');

      // Preserve or set active category so user is never dumped onto home page
      const firstItemCat = orderItems[0]?.originalProduct?.categorySlug || (orderItems[0] as any)?.product?.categorySlug;
      const targetCat = (publicCategory && publicCategory !== 'all' && publicCategory !== 'wishlist')
        ? publicCategory
        : (sessionStorage.getItem('tawzoon_last_browsed_category') || firstItemCat || 'shop');
      sessionStorage.setItem('tawzoon_last_browsed_category', targetCat);
      if (publicCategory === 'all') {
        setPublicCategory(targetCat);
      }

      window.dispatchEvent(new Event('tawzoon_order_mode_changed'));
    } catch {}

    closeCheckoutModal();
    showToast(
      lang === 'bn'
        ? 'পাবলিক পেজ থেকে যেকোনো ক্যাটাগরির পণ্য ও পছন্দের ছবি সিলেক্ট করে অর্ডারে যুক্ত করুন।'
        : 'Browse the public store to pick products & pictures to add to your order.',
      'info'
    );
  };

  // Confirm adding a new product to order
  const handleConfirmAddProduct = () => {
    if (!selectedProductToAdd) return;
    const unitPrice = getAdjustedSellingPrice(selectedProductToAdd, employee, brandSettings);
    const img =
      selectedProductToAdd.images?.find(i => i.isPrimary)?.url ||
      selectedProductToAdd.images?.[0]?.url ||
      selectedProductToAdd.imageUrl ||
      '/images/product_shop_dress_1790244714775.jpg';

    const newItem: OrderItemState = {
      productId: selectedProductToAdd.id,
      originalProduct: selectedProductToAdd,
      productName: lang === 'bn' ? selectedProductToAdd.nameBn : (selectedProductToAdd.nameEn || selectedProductToAdd.nameBn),
      productCode: selectedProductToAdd.productCode,
      imageUrl: img,
      size: addSize,
      quantity: addQuantity,
      unitPrice,
    };

    setOrderItems(prev => [...prev, newItem]);
    setIsAddProductOpen(false);
    setSelectedProductToAdd(null);
    setAddQuantity(1);
    showToast(lang === 'bn' ? 'নতুন পণ্য সফলভাবে যোগ করা হয়েছে!' : 'Product added to order!', 'success');
  };

  // Validate form before opening payment or alternative popup
  const validateForm = (): boolean => {
    if (orderItems.length === 0) {
      showToast(lang === 'bn' ? 'অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে।' : 'Select at least one product.', 'error');
      return false;
    }
    if (!customerName.trim()) {
      showToast(lang === 'bn' ? 'আপনার নাম লিখুন।' : 'Please enter your name.', 'error');
      return false;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      showToast(lang === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Enter 11-digit mobile number.', 'error');
      return false;
    }
    if (!specificAddress.trim()) {
      showToast(lang === 'bn' ? 'আপনার বিস্তারিত ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা) লিখুন।' : 'Please enter detailed delivery address.', 'error');
      return false;
    }
    return true;
  };

  // Primary action: "৳{deliveryCharge} ডেলিভারি চার্জ পরিশোধ করুন"
  const handlePayDeliveryChargeClick = () => {
    if (!validateForm()) return;
    setSenderPhone(customerPhone.trim());
    setTransactionId('');
    setIsPaymentPopupOpen(true);
  };

  // Secondary action: "বিকল্প পদ্ধতি"
  const handleAlternativeMethodClick = () => {
    if (!validateForm()) return;
    setIsAlternativeModalOpen(true);
  };

  // Final Order Submission Handler
  const executeOrderSubmission = async (params: {
    isAdvancePaid: boolean;
    paymentMethod: 'bKash' | 'Nagad' | 'COD';
    transactionId?: string;
    senderPhone?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const storedRef = typeof window !== 'undefined' ? sessionStorage.getItem('reseller_referral_code') : null;
      const referralCode = storedRef || employee?.id || undefined;
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const storeSlugFromPath = path.startsWith('/shop/') ? path.replace('/shop/', '').split('/')[0] : null;
      const storedStoreSlug = typeof window !== 'undefined' ? sessionStorage.getItem('reseller_store_slug') : null;
      const effectiveStoreSlug = reseller?.storeSlug || storeSlugFromPath || storedStoreSlug || undefined;

      const res = await api.submitPublicOrder({
        items: orderItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productCode: item.productCode,
          quantity: item.quantity,
          size: item.size,
          sellingPrice: item.unitPrice,
          imageUrl: item.imageUrl,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: specificAddress.trim(),
        district: selectedDistrict,
        thana: selectedThana,
        notes: specialNotes.trim(),
        deliveryCharge,
        paymentMethod: params.paymentMethod,
        transactionId: params.transactionId,
        senderPhone: params.senderPhone,
        isAdvancePaid: params.isAdvancePaid,
        referralCode,
        resellerStoreSlug: effectiveStoreSlug,
      });

      if (res && res.success) {
        setConfirmedOrder({
          orderCode: res.orderCode,
          customerName: res.customerName,
          customerPhone: res.customerPhone,
          customerAddress: res.customerAddress,
          orderDate: res.orderDate,
          items: [...orderItems],
          productsTotal: res.productsTotal,
          deliveryCharge: res.deliveryCharge,
          grandTotal: res.grandTotal,
          advancePaid: res.advancePaid,
          dueAmount: res.dueAmount,
          isAdvancePaid: res.isAdvancePaid,
          paymentMethod: res.paymentMethod,
          transactionId: res.transactionId,
        });
        clearCart();
        try {
          sessionStorage.removeItem('tawzoon_pending_order_items');
          sessionStorage.removeItem('tawzoon_pending_order_customer');
          sessionStorage.removeItem('tawzoon_is_adding_to_order');
          window.dispatchEvent(new Event('tawzoon_order_mode_changed'));
        } catch {}
        setIsPaymentPopupOpen(false);
        setIsAlternativeModalOpen(false);
        showToast(
          lang === 'bn'
            ? '🎉 আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!'
            : '🎉 Your order has been placed successfully!',
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit with Advance Payment TrxID
  const handlePaymentPopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone || senderPhone.replace(/[^0-9]/g, '').length < 11) {
      showToast(lang === 'bn' ? 'টাকা পাঠানোর ১১ ডিজিট মোবাইল নম্বর দিন।' : 'Enter valid sender phone number.', 'error');
      return;
    }
    if (!transactionId || transactionId.trim().length < 4) {
      showToast(lang === 'bn' ? 'সঠিক ট্রানজেকশন আইডি (TrxID) দিন।' : 'Enter valid Transaction ID.', 'error');
      return;
    }

    executeOrderSubmission({
      isAdvancePaid: true,
      paymentMethod,
      transactionId: transactionId.trim().toUpperCase(),
      senderPhone: senderPhone.trim(),
    });
  };

  // Submit with Alternative Method (Full Cash on Delivery)
  const handleConfirmAlternativeCOD = () => {
    executeOrderSubmission({
      isAdvancePaid: false,
      paymentMethod: 'COD',
    });
  };

  // Copy personal phone number helper
  const handleCopyPhone = (num: string) => {
    navigator.clipboard.writeText(num);
    setIsCopiedPhone(true);
    showToast(lang === 'bn' ? 'নম্বরটি কপি করা হয়েছে!' : 'Number copied!');
    setTimeout(() => setIsCopiedPhone(false), 2000);
  };

  // Robust clipboard copy with fallback
  const handleCopyText = async (textToCopy: string, successMessage: string) => {
    if (!textToCopy) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        showToast(successMessage, 'success');
        return;
      }
    } catch (e) {
      console.warn('Clipboard API error, attempting fallback:', e);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.left = '-99999px';
      textarea.style.top = '-99999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (copied) {
        showToast(successMessage, 'success');
      } else {
        showToast(lang === 'bn' ? 'কপি করতে ব্যর্থ হয়েছে।' : 'Copy failed.', 'error');
      }
    } catch (err) {
      showToast(lang === 'bn' ? 'কপি করতে সমস্যা হয়েছে।' : 'Failed to copy.', 'error');
    }
  };

  if (!isCheckoutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100005] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. ORDER SUCCESS CONFIRMATION RECEIPT                           */}
      {/* ------------------------------------------------------------- */}
      {confirmedOrder ? (
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] max-w-xl rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border-0 sm:border border-emerald-200 animate-in zoom-in-95 duration-200 my-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#009245] to-[#006e34] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between relative shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black leading-tight">
                  {lang === 'bn' ? 'আপনার অর্ডারটি পেন্ডিং আছে' : 'Your Order is Pending'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCheckoutModal}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt Body */}
          <div className="p-3.5 sm:p-5 space-y-3 overflow-y-auto flex-1 scrollbar-none">
            {/* Concise Order Status Instruction & Dynamic Admin WhatsApp Number */}
            {(() => {
              const displayPhone = reseller?.storePhone || reseller?.storeWhatsapp || reseller?.phone || brandSettings?.helplinePhone || brandSettings?.publicContactNumber || brandSettings?.whatsappNumber || '01800000000';
              let cleanPhone = displayPhone.replace(/[^0-9]/g, '');
              if (cleanPhone.startsWith('880') && cleanPhone.length === 13) {
                cleanPhone = cleanPhone.slice(2);
              }
              const formattedPhone = cleanPhone.length === 11 ? cleanPhone : displayPhone;

              return (
                <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl space-y-1.5 text-xs text-slate-800 shadow-3xs">
                  <p className="text-[11.5px] sm:text-xs text-slate-700 leading-relaxed font-semibold">
                    {lang === 'bn'
                      ? 'অর্ডার কনফার্ম করতে নিচের WhatsApp বাটনে মেসেজ দিন। কনফার্মেশন না পাওয়া পর্যন্ত অর্ডারটি পেন্ডিং থাকবে।'
                      : 'To confirm your order, send a message to the WhatsApp button below. The order will remain pending until confirmed.'}
                  </p>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-amber-200/70">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#009245]" />
                      <span className="text-[11px] text-slate-600 font-bold">
                        {lang === 'bn' ? 'হটলাইন:' : 'Hotline:'}
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900">{formattedPhone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(formattedPhone, lang === 'bn' ? 'নম্বর কপি হয়েছে!' : 'Number copied!')}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer active:scale-95"
                    >
                      কপি
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Customer Details */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer Name:'}</span>
                <span className="font-bold text-slate-900">{confirmedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                <span className="font-bold font-mono text-slate-900">{confirmedOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500">{lang === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Address:'}</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px] truncate">{confirmedOrder.customerAddress}</span>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-black text-slate-800">
                {lang === 'bn' ? 'অর্ডারকৃত পণ্যসমূহ:' : 'Ordered Items:'}
              </h5>
              <div className="space-y-2">
                {confirmedOrder.items.map((it: OrderItemState, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative group shrink-0">
                          <img src={it.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white" />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(it.imageUrl);
                                const blob = await res.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = blobUrl;
                                const safeName = (it.productName || 'product').replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_');
                                link.download = `${it.productCode || 'TNX'}_${safeName}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);
                                showToast(lang === 'bn' ? 'ছবি ডাউনলোড সম্পন্ন হয়েছে✓' : 'Image downloaded✓', 'success');
                              } catch {
                                const link = document.createElement('a');
                                link.href = it.imageUrl;
                                link.target = '_blank';
                                link.download = `${it.productCode || 'TNX'}.jpg`;
                                link.click();
                                showToast(lang === 'bn' ? 'ছবি ডাউনলোড সম্পন্ন হয়েছে✓' : 'Image downloaded✓', 'success');
                              }
                            }}
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white transition-opacity cursor-pointer"
                            title={lang === 'bn' ? 'ছবি ডাউনলোড করুন' : 'Download image'}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 truncate block">{it.productName}</span>
                          <span className="text-[10.5px] text-slate-500 font-mono">সাইজ: {it.size} | পরিমাণ: {it.quantity}টি</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">৳{(it.unitPrice * it.quantity).toLocaleString()}</span>
                    </div>

                    {/* Product Code & Product Link Copy buttons */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const code = it.productCode || 'TNX';
                          handleCopyText(code, lang === 'bn' ? `কোড (${code}) কপি হয়েছে✓` : `Code (${code}) copied✓`);
                        }}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#009245] border border-slate-200 rounded-lg text-[10.5px] font-mono font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-3xs active:scale-95"
                        title={lang === 'bn' ? 'প্রোডাক্ট কোড কপি করুন' : 'Copy product code'}
                      >
                        <Copy className="w-3 h-3 text-[#009245]" />
                        <span>কোড: #{it.productCode}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const productUrl = `${window.location.origin}/?product=${encodeURIComponent(it.productCode || it.productId)}`;
                          handleCopyText(productUrl, lang === 'bn' ? 'প্রোডাক্ট লিংক কপি হয়েছে✓' : 'Product link copied✓');
                        }}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#009245] border border-slate-200 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-3xs active:scale-95"
                        title={lang === 'bn' ? 'প্রোডাক্ট লিংক কপি করুন' : 'Copy product link'}
                      >
                        <Copy className="w-3 h-3 text-[#009245]" />
                        <span>{lang === 'bn' ? 'লিংক কপি' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>পণ্যের মোট মূল্য:</span>
                <span className="font-mono font-bold">৳{confirmedOrder.productsTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-mono font-bold">৳{confirmedOrder.deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-[#009245] font-black text-sm pt-1 border-t border-emerald-200">
                <span>সর্বমোট বিল:</span>
                <span className="font-mono">৳{confirmedOrder.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Direct Message Only */}
            {(() => {
              const targetWhatsapp = reseller?.storeWhatsapp || reseller?.storePhone || reseller?.phone || brandSettings?.whatsappNumber || brandSettings?.helplinePhone || '01800000000';
              let cleanWhatsapp = targetWhatsapp.replace(/[^0-9]/g, '');
              if (cleanWhatsapp.startsWith('0')) {
                cleanWhatsapp = '88' + cleanWhatsapp;
              } else if (!cleanWhatsapp.startsWith('88') && cleanWhatsapp.length === 10) {
                cleanWhatsapp = '88' + cleanWhatsapp;
              }

              const itemsText = confirmedOrder.items.map((it: any) => {
                const shortUrl = `${window.location.origin}/?product=${encodeURIComponent(it.productCode || it.productId)}`;
                return `📦 *${it.productName}*\n🏷️ কোড: #${it.productCode || 'TNX'}${it.size ? ` | সাইজ: ${it.size}` : ''} | পরিমাণ: ${it.quantity}টি\n💵 মূল্য: ৳${(it.unitPrice * it.quantity).toLocaleString()}\n🔗 লিংক: ${shortUrl}`;
              }).join('\n\n');

              const waText = `🛍️ *অর্ডার:* #${confirmedOrder.orderCode}
👤 *গ্রাহক:* ${confirmedOrder.customerName} (${confirmedOrder.customerPhone})
🏠 *ঠিকানা:* ${confirmedOrder.customerAddress}

${itemsText}

💰 *সর্বমোট বিল:* ৳${confirmedOrder.grandTotal.toLocaleString()} (ডেলিভারি চার্জ সহ)

আসসালামু আলাইকুম, আমি ওয়েবসাইট থেকে এই অর্ডারটি করেছি। দয়া করে কনফার্ম করে দ্রুত পাঠিয়ে দিন।`;

              const waLink = targetWhatsapp.startsWith('http')
                ? (targetWhatsapp.includes('text=') ? targetWhatsapp : `${targetWhatsapp}${targetWhatsapp.includes('?') ? '&' : '?'}text=${encodeURIComponent(waText)}`)
                : `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(waText)}`;

              return (
                <div className="pt-1">
                  {/* WhatsApp Direct Send Button */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 animate-pulse"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                    <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে সরাসরি অর্ডারটি পাঠান' : 'Send Order to WhatsApp'}</span>
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. MAIN ONLINE ORDER FORM (অর্ডার ফরম)                          */
        /* ------------------------------------------------------------- */
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl lg:max-w-3xl sm:rounded-3xl rounded-none shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col my-auto">
          
          {/* Top Bar Header */}
          <div className="p-4 sm:p-4.5 bg-gradient-to-r from-[#009245] via-[#00813c] to-[#006e33] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {lang === 'bn' ? 'অর্ডার ফরম পূরণ করুন' : 'Complete Your Order'}
                </h3>
                <span className="text-[11px] text-emerald-100 block">
                  {lang === 'bn' ? 'তথ্যগুলো দিন এবং সহজে অর্ডার সম্পন্ন করুন' : 'Fill details and confirm delivery'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCheckoutModal}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/20"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-none">
            
            {/* ----------------------------------------------------------- */}
            {/* SECTION A: PRODUCTS LIST + ADD/DELETE SYSTEM                */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#009245]" />
                  <span className="text-xs sm:text-sm font-black text-slate-800">
                    {lang === 'bn' ? 'অর্ডারের পণ্যসমূহ' : 'Order Items'} ({orderItems.length}টি)
                  </span>
                </div>

                {/* "+ আরও প্রোডাক্ট যোগ করুন" BUTTON */}
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '+ আরও প্রোডাক্ট যোগ করুন' : '+ Add More Products'}</span>
                </button>
              </div>

              {/* Items Card List */}
              {orderItems.length === 0 ? (
                <div className="p-6 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs font-bold text-slate-500">
                    {lang === 'bn' ? 'কোনো পণ্য সিলেক্ট করা নেই!' : 'No products selected!'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 bg-[#009245] text-white text-xs font-black rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderItems.map((item, idx) => {
                    const availableSizes = getProductSizes(item.originalProduct || (item as any).product);

                    return (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 transition-all hover:border-emerald-200"
                      >
                        {/* Top / Info Section */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0 mt-0.5 sm:mt-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <h5 className="text-xs sm:text-[13px] font-bold text-slate-900 truncate" title={item.productName}>
                              {item.productName}
                            </h5>
                            <div className="flex items-center flex-wrap gap-1.5 text-[10.5px] text-slate-500 font-mono">
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/70">
                                #{item.productCode}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-bold text-rose-600 font-mono text-xs">
                                ৳{item.unitPrice.toLocaleString()}
                              </span>
                            </div>

                            {/* Size selector pills */}
                            {availableSizes.length > 0 && (
                              <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-semibold">{lang === 'bn' ? 'সাইজ:' : 'Size:'}</span>
                                {availableSizes.map(sz => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => handleUpdateSize(idx, sz)}
                                    className={`px-2 py-0.5 text-[10px] font-black rounded-md border transition-all cursor-pointer ${
                                      item.size === sz
                                        ? 'bg-[#009245] text-white border-[#009245] shadow-xs'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity Counter, Line Total & Delete */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t border-slate-100 sm:border-t-0 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500 sm:hidden">
                              {lang === 'bn' ? 'পরিমাণ:' : 'Qty:'}
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-3xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, -1)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-black font-mono text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, 1)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center cursor-pointer text-xs font-bold transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Line total */}
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            ৳{(item.unitPrice * item.quantity).toLocaleString()}
                          </span>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                            title="পণ্যটি মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SECTION B: CUSTOMER & DELIVERY ADDRESS INFORMATION          */}
            {/* ----------------------------------------------------------- */}
            <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3 sm:p-4 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60">
                <User className="w-4 h-4 text-[#009245]" />
                <span className="text-xs sm:text-sm font-black text-slate-800">
                  {lang === 'bn' ? 'ডেলিভারি ঠিকানা ও তথ্য' : 'Delivery & Contact Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>{lang === 'bn' ? 'আপনার নাম' : 'Full Name'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder={lang === 'bn' ? 'যেমন: মোঃ আরিফুল ইসলাম' : 'e.g. Ariful Islam'}
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                    />
                  </div>
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>{lang === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'}</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                    />
                  </div>
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
                      value={districtQuery || selectedDistrict}
                      onFocus={() => {
                        setIsDistrictDropdownOpen(true);
                        setDistrictQuery('');
                      }}
                      onChange={e => {
                        setDistrictQuery(e.target.value);
                        setIsDistrictDropdownOpen(true);
                      }}
                      placeholder="জেলা সার্চ করুন..."
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                    />
                  </div>

                  {/* District Dropdown list */}
                  {isDistrictDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 space-y-0.5">
                      {matchingDistricts.map(dist => (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => {
                            setSelectedDistrict(dist);
                            setDistrictQuery('');
                            setIsDistrictDropdownOpen(false);
                            // Auto select first thana for this district
                            const thanas = bdDistrictsAndThanas[dist] || ['সদর'];
                            setSelectedThana(thanas[0] || 'সদর');
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer ${
                            selectedDistrict === dist ? 'bg-emerald-50 text-[#009245] font-black' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{dist}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dist === 'ঢাকা' ? '৳৭০' : '৳১২০'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Thana / Area Selection */}
                <div className="space-y-1 relative">
                  <label className="text-xs font-bold text-slate-700">
                    {lang === 'bn' ? 'থানা / উপজেলা / এলাকা' : 'Thana / Upazila / Area'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={thanaQuery || selectedThana}
                      onFocus={() => {
                        setIsThanaDropdownOpen(true);
                        setThanaQuery('');
                      }}
                      onChange={e => {
                        setThanaQuery(e.target.value);
                        setIsThanaDropdownOpen(true);
                      }}
                      placeholder="থানা / এলাকা লিখুন বা সিলেক্ট করুন..."
                      className="w-full pl-9 pr-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                    />
                  </div>

                  {/* Thana Dropdown list */}
                  {isThanaDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 space-y-0.5">
                      {matchingThanas.map(th => (
                        <button
                          key={th}
                          type="button"
                          onClick={() => {
                            setSelectedThana(th);
                            setThanaQuery('');
                            setIsThanaDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer ${
                            selectedThana === th ? 'bg-emerald-50 text-[#009245] font-black' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{th}</span>
                        </button>
                      ))}
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
                  value={specificAddress}
                  onChange={e => setSpecificAddress(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: বাসা- ১২/এ, রোড- ৪, ব্লক- বি, ধানমন্ডি, ঢাকা' : 'House, Road, Block, Area details...'}
                  className="w-full px-3 py-2 bg-white text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>

              {/* Special Note */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">
                  {lang === 'bn' ? 'বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)' : 'Special Instructions (Optional)'}
                </label>
                <input
                  type="text"
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: অফিস সময়ে ডেলিভারি দিন অথবা ফোন দিয়ে আসবেন' : 'e.g. Call before delivery'}
                  className="w-full px-3 py-1.5 bg-white text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SECTION C: AUTOMATIC DELIVERY FEE & FINANCIAL CALCULATION   */}
            {/* ----------------------------------------------------------- */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              {/* Delivery Zone Badge (Dhaka: 70 TK, Outside: 120 TK) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#009245]" />
                  <span className="text-xs font-bold text-slate-800">
                    {isDhaka
                      ? lang === 'bn' ? 'ঢাকার ভেতরে হোম ডেলিভারি' : 'Inside Dhaka Delivery'
                      : lang === 'bn' ? 'ঢাকার বাহিরে সমগ্র বাংলাদেশে হোম ডেলিভারি' : 'Outside Dhaka Delivery'}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg border ${
                  isDhaka
                    ? 'bg-emerald-50 text-[#009245] border-emerald-300'
                    : 'bg-blue-50 text-blue-700 border-blue-300'
                }`}>
                  ৳{deliveryCharge}
                </span>
              </div>

              {/* Financial Calculation Box */}
              <div className="space-y-1 text-xs font-bold text-slate-600">
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'পণ্যের মোট মূল্য:' : 'Product Subtotal:'}</span>
                  <span className="font-mono text-slate-800">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'হোম ডেলিভারি চার্জ:' : 'Delivery Fee:'}</span>
                  <span className="font-mono text-slate-800">৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-100 text-sm font-black">
                  <span>{lang === 'bn' ? 'সর্বমোট প্রদেয় বিল:' : 'Total Payable:'}</span>
                  <span className="font-mono text-[#009245] text-base">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION D: BOTTOM ACTION BUTTON: "অর্ডার কনফার্ম করুন"             */}
          {/* ------------------------------------------------------------- */}
          <div className="p-2.5 sm:p-3.5 bg-slate-50 border-t border-slate-200/90 shrink-0">
            <button
              type="button"
              onClick={async () => {
                if (!validateForm()) return;
                setIsSubmitting(true);
                try {
                  const storedRef = typeof window !== 'undefined' ? sessionStorage.getItem('reseller_referral_code') : null;
                  const referralCode = storedRef || employee?.id || undefined;
                  const path = typeof window !== 'undefined' ? window.location.pathname : '';
                  const storeSlugFromPath = path.startsWith('/shop/') ? path.replace('/shop/', '').split('/')[0] : null;
                  const storedStoreSlug = typeof window !== 'undefined' ? sessionStorage.getItem('reseller_store_slug') : null;
                  const effectiveStoreSlug = reseller?.storeSlug || storeSlugFromPath || storedStoreSlug || undefined;

                  const res = await api.submitPublicOrder({
                    items: orderItems.map(item => ({
                      productId: item.productId,
                      productName: item.productName,
                      productCode: item.productCode,
                      quantity: item.quantity,
                      size: item.size,
                      sellingPrice: item.unitPrice,
                      imageUrl: item.imageUrl,
                    })),
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim(),
                    customerAddress: specificAddress.trim(),
                    district: selectedDistrict,
                    thana: selectedThana,
                    notes: specialNotes.trim(),
                    deliveryCharge,
                    paymentMethod: 'COD',
                    isAdvancePaid: false,
                    referralCode,
                    resellerStoreSlug: effectiveStoreSlug,
                  });

                  if (res && res.success) {
                    setConfirmedOrder({
                      orderCode: res.orderCode,
                      customerName: res.customerName,
                      customerPhone: res.customerPhone,
                      customerAddress: res.customerAddress,
                      orderDate: res.orderDate,
                      items: [...orderItems],
                      productsTotal: res.productsTotal,
                      deliveryCharge: res.deliveryCharge,
                      grandTotal: res.grandTotal,
                      dueAmount: res.grandTotal,
                      isAdvancePaid: false,
                    });
                    clearCart();
                    try {
                      sessionStorage.removeItem('tawzoon_pending_order_items');
                      sessionStorage.removeItem('tawzoon_pending_order_customer');
                    } catch {}
                    showToast(lang === 'bn' ? 'অর্ডার সফলভাবে কনফার্ম হয়েছে!' : 'Order confirmed successfully!', 'success');
                  } else {
                    showToast((res as any)?.error || res?.message || (lang === 'bn' ? 'অর্ডার সাবমিট করতে সমস্যা হয়েছে।' : 'Failed to submit order.'), 'error');
                  }
                } catch (err) {
                  console.error('Order submission error:', err);
                  showToast(lang === 'bn' ? 'সার্ভার ত্রুটি। আবার চেষ্টা করুন।' : 'Server error. Please try again.', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#009245] hover:bg-[#007a38] text-white font-black text-xs sm:text-sm md:text-base shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 animate-pulse hover:scale-[1.01]"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{lang === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. PRODUCT SELECTION POPUP MODAL ("+ আরও প্রোডাক্ট যোগ করুন")   */}
      {/* ------------------------------------------------------------- */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-[100010] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] my-auto">
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-[#009245] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-200" />
                <h4 className="text-sm sm:text-base font-black">
                  {lang === 'bn' ? 'অর্ডারে আরও প্রোডাক্ট যুক্ত করুন' : 'Add Another Product'}
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
                  placeholder={lang === 'bn' ? 'পণ্যের নাম বা কোড দিয়ে খুঁজুন...' : 'Search by name or code...'}
                  className="w-full pl-9 pr-3 py-2 bg-white text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {allProducts
                .filter(p => isSearchTextMatch(p.nameBn || '', productSearchQuery) || isSearchTextMatch(p.productCode || '', productSearchQuery))
                .slice(0, 30)
                .map(prod => {
                  const pTitle = lang === 'bn' ? prod.nameBn : (prod.nameEn || prod.nameBn);
                  const pImg = prod.images?.find(i => i.isPrimary)?.url || prod.images?.[0]?.url || prod.imageUrl || '/images/product_shop_dress_1790244714775.jpg';
                  const price = getAdjustedSellingPrice(prod, employee, brandSettings);
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
                          <h6 className="text-xs font-bold text-slate-900 truncate max-w-[240px]">{pTitle}</h6>
                          <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200/60">
                              #{prod.productCode}
                            </span>
                            <span className="text-rose-600 font-bold">৳{price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-[#009245] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200">
                            {lang === 'bn' ? 'সিলেক্ট করুন' : 'Select'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Selected Product Size & Quantity Configuration */}
            {selectedProductToAdd && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Size selection */}
                  {getProductSizes(selectedProductToAdd).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        {lang === 'bn' ? 'সাইজ নির্বাচন:' : 'Select Size:'}
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
                      {lang === 'bn' ? 'পরিমাণ:' : 'Quantity:'}
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
                  className="w-full py-2.5 bg-[#009245] hover:bg-[#007a38] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অর্ডারে যুক্ত করুন' : 'Add to Order'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. PAYMENT POPUP (বিকাশ / নগদ পার্সোনাল সেন্ড মানি)               */}
      {/* ------------------------------------------------------------- */}
      {isPaymentPopupOpen && (
        <div className="fixed inset-0 z-[100020] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#009245] to-[#007534] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <div>
                  <h4 className="text-sm sm:text-base font-black">
                    {lang === 'bn' ? 'ডেলিভারি চার্জ অগ্রিম পরিশোধ করুন' : 'Advance Delivery Fee Payment'}
                  </h4>
                  <span className="text-[11px] text-emerald-100 block">
                    {lang === 'bn'
                      ? `প্রদেয় পরিমাণ: ৳${deliveryCharge} (${isDhaka ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'})`
                      : `Payable: ৳${deliveryCharge}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPaymentPopupOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Selector (bKash / Nagad) */}
            <form onSubmit={handlePaymentPopupSubmit} className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bKash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'bKash'
                      ? 'bg-rose-50 text-[#d12053] border-[#d12053] shadow-xs scale-102 ring-2 ring-rose-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#d12053]" />
                  <span>বিকাশ পার্সোনাল</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === 'Nagad'
                      ? 'bg-amber-50 text-[#f7941d] border-[#f7941d] shadow-xs scale-102 ring-2 ring-amber-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#f7941d]" />
                  <span>নগদ পার্সোনাল</span>
                </button>
              </div>

              {/* Personal Number Card with 1-Click Copy */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5 text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">
                  {paymentMethod === 'bKash' ? 'বিকাশ পার্সোনাল নম্বর (Send Money)' : 'নগদ পার্সোনাল নম্বর (Send Money)'}
                </span>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-wider">
                    {paymentMethod === 'bKash' ? personalBkashNumber : personalNagadNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(paymentMethod === 'bKash' ? personalBkashNumber : personalNagadNumber)}
                    className="p-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#009245] border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-3xs"
                    title="নম্বর কপি করুন"
                  >
                    {isCopiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-black text-[#009245]">
                  <span>টাকার পরিমাণ:</span>
                  <span className="font-mono text-base underline underline-offset-2">৳{deliveryCharge}</span>
                </div>
              </div>

              {/* Step by Step Send Money Guide */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-slate-700 space-y-1 leading-relaxed">
                <div className="font-bold text-slate-900 pb-0.5 border-b border-emerald-200/60">
                  📌 কীভাবে সেন্ড মানি করবেন:
                </div>
                <div>১. আপনার {paymentMethod} অ্যাপে গিয়ে <strong>&apos;Send Money&apos;</strong> চাপুন।</div>
                <div>২. প্রাপক নম্বরে উপরের পার্সোনাল নম্বরটি পেস্ট করুন।</div>
                <div>৩. টাকার পরিমাণ <strong>৳{deliveryCharge}</strong> দিয়ে সেন্ড মানি সম্পন্ন করুন।</div>
                <div>৪. লেনদেন শেষে প্রাপ্ত <strong>TrxID</strong> ও আপনার প্রেরক নম্বরটি নিচে দিন।</div>
              </div>

              {/* Input: Sender Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>যে নম্বর থেকে টাকা পাঠিয়েছেন</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                  placeholder="01XXXXXXXXX"
                  required
                  className="w-full px-3 py-2 bg-white text-xs sm:text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>

              {/* Input: Transaction ID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>ট্রানজেকশন আইডি (TrxID)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value.toUpperCase())}
                  placeholder="যেমন: BLA792K10X"
                  required
                  className="w-full px-3 py-2 bg-white text-xs sm:text-sm font-mono font-bold uppercase border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#009245]/20 focus:border-[#009245]"
                />
              </div>

              {/* Submit Payment Confirmation */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#009245] hover:bg-[#007a38] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>অর্ডার প্রসেস হচ্ছে...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>পেমেন্ট নিশ্চিত করুন ও অর্ডার সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ALTERNATIVE METHOD MODAL (বিকল্প পদ্ধতি: ক্যাশ অন ডেলিভারি)   */}
      {/* ------------------------------------------------------------- */}
      {isAlternativeModalOpen && (
        <div className="fixed inset-0 z-[100020] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm sm:text-base font-black">
                  {lang === 'bn' ? 'বিকল্প পদ্ধতি (ক্যাশ অন ডেলিভারি)' : 'Cash on Delivery Option'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAlternativeModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#009245]">
                <Truck className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <p>
                  <strong>ক্যাশ অন ডেলিভারি সুবিধা:</strong> পণ্য হাতে পাওয়ার পর ডেলিভারিম্যানকে মোট <strong>৳{grandTotal.toLocaleString()}</strong> (পণ্যের মূল্য ৳{subtotal.toLocaleString()} + ডেলিভারি চার্জ ৳{deliveryCharge}) ক্যাশ পরিশোধ করতে হবে।
                </p>
                <p className="text-slate-500 text-xs">
                  * আমাদের কাস্টমার কেয়ার প্রতিনিধি আপনার দেওয়া মোবাইল নম্বরে ({customerPhone}) কল করে অর্ডারটি কনফার্ম করবেন।
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAlternativeCOD}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#009245] hover:bg-[#007a38] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>অর্ডার রেকর্ড হচ্ছে...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAlternativeModalOpen(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  ফিরে যান
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
