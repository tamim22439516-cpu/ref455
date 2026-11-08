import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Copy,
  ExternalLink,
  Save,
  MessageCircle,
  Phone,
  Store,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  Sliders,
  Check,
  CheckCircle2,
  Trash2,
  Palette,
  Sparkles,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { compressImageFile } from '../../utils/imageCompressor.js';

export const ResellerWebsiteGeneratorTab: React.FC = () => {
  const { lang, employee, employeeToken, showToast, refreshEmployeeProfile, brandSettings, paymentSettings } = useApp();

  // If store is already active, start in 'store_card' view; if not, directly in 'setup' view!
  const hasActiveStore = Boolean(employee?.storeSlug);
  const [isEditing, setIsEditing] = useState<boolean>(!hasActiveStore);
  const [createdSuccess, setCreatedSuccess] = useState<boolean>(false);
  const [successActionType, setSuccessActionType] = useState<'create' | 'update'>('create');

  // Custom Website Form States
  const [storeName, setStoreName] = useState(
    employee?.storeName || (employee?.name ? `${employee.name} এক্সপ্রেস শপ` : 'আমার এক্সপ্রেস শপ')
  );
  const [slug, setSlug] = useState(
    employee?.storeSlug || (employee?.id ? `shop_${employee.id.substring(0, 6)}` : 'my_store')
  );
  const [storeLogoUrl, setStoreLogoUrl] = useState<string>(
    employee?.storeLogoUrl || employee?.avatarUrl || ''
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    employee?.storeWhatsapp || employee?.phone || '01712345678'
  );
  const [phoneNum, setPhoneNum] = useState(
    employee?.storePhone || employee?.phone || '01712345678'
  );
  // Default to standard emerald hex '#009245'
  const [themeColor, setThemeColor] = useState<string>(() => {
    const raw = employee?.storeThemeColor;
    if (raw && raw.startsWith('#')) return raw;
    return '#009245';
  });
  const [headerColor, setHeaderColor] = useState<string>(employee?.storeHeaderColor || '#ffffff');
  const [footerColor, setFooterColor] = useState<string>(employee?.storeFooterColor || '#0f172a');

  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription Renewal & Payment States (Requirement 6)
  const [subPlan, setSubPlan] = useState<'1_month' | '6_months' | '1_year' | '2_years'>('1_year');
  const [subPaymentMethod, setSubPaymentMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [subSenderPhone, setSubSenderPhone] = useState(employee?.phone || '');
  const [subTrxId, setSubTrxId] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Plan pricing tiers from Admin BrandSettings
  const planFees = {
    '1_month': brandSettings?.resellerSubscriptionPlan1Month ?? 150,
    '6_months': brandSettings?.resellerSubscriptionPlan6Months ?? 500,
    '1_year': brandSettings?.resellerSubscriptionPlan1Year ?? brandSettings?.resellerSubscriptionFee ?? 999,
    '2_years': brandSettings?.resellerSubscriptionPlan2Years ?? 1800,
  };
  const activePlanFee = planFees[subPlan];

  // Active payment gateway setting
  const activePaymentSetting = paymentSettings?.find(p => p.name === subPaymentMethod && p.isEnabled)
    || paymentSettings?.find(p => p.name === subPaymentMethod)
    || paymentSettings?.[0];

  // Sync state if employee profile updates
  useEffect(() => {
    if (employee) {
      if (employee.storeName) setStoreName(employee.storeName);
      if (employee.storeSlug) setSlug(employee.storeSlug);
      if (employee.storeLogoUrl) setStoreLogoUrl(employee.storeLogoUrl);
      if (employee.storeWhatsapp) setWhatsappNumber(employee.storeWhatsapp);
      if (employee.storePhone) setPhoneNum(employee.storePhone);
      if (employee.storeHeaderColor) setHeaderColor(employee.storeHeaderColor);
      if (employee.storeFooterColor) setFooterColor(employee.storeFooterColor);
      if (employee.storeThemeColor) {
        const raw = employee.storeThemeColor;
        if (raw.startsWith('#')) {
          setThemeColor(raw);
        }
      }
      if (employee.phone && !subSenderPhone) {
        setSubSenderPhone(employee.phone);
      }
    }
  }, [employee]);

  // Subscription & Trial duration calculation (Server-side time basis)
  const isOfficial = Boolean(
    employee?.isOfficialReferral === true ||
    employee?.reference?.toUpperCase() === 'TAWZOON9516'
  );

  const isPaid = Boolean(
    isOfficial ||
    employee?.isPaidSubscription === true ||
    employee?.subscriptionStatus === 'active' ||
    employee?.subscriptionStatus === 'exempt'
  );

  const now = Date.now();
  const subExpiryTime = employee?.subscriptionExpiryDate ? new Date(employee.subscriptionExpiryDate).getTime() : 0;
  const trialExpiryTime = (employee as any)?.trialExpiryDate ? new Date((employee as any).trialExpiryDate).getTime() : 0;

  const isTrialExpired = !isPaid && trialExpiryTime > 0 && now > trialExpiryTime;
  const isSubscriptionExpired = isPaid && !isOfficial && subExpiryTime > 0 && now > subExpiryTime;
  const needsPayment = isTrialExpired || isSubscriptionExpired;

  const totalTrialDays = (employee as any)?.customTrialDays ?? brandSettings?.resellerTrialDays ?? 7;
  const daysRemaining = isPaid
    ? (subExpiryTime > 0 ? Math.max(0, Math.ceil((subExpiryTime - now) / (1000 * 60 * 60 * 24))) : 365)
    : (trialExpiryTime > 0 ? Math.max(0, Math.ceil((trialExpiryTime - now) / (1000 * 60 * 60 * 24))) : totalTrialDays);

  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${slug || 'my_store'}`;

  // Auto-generate clean slug as user types shop name
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (!employee?.storeSlug) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 24);
      if (generated) {
        setSlug(generated);
      }
    }
  };

  // Image Upload Handler (from user device gallery)
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImageFile(file, 400, 0.8);
      if (base64) {
        setStoreLogoUrl(base64);
        showToast(lang === 'bn' ? 'লোগো সফলভাবে নির্বাচিত হয়েছে!✓' : 'Logo selected successfully!✓', 'success');
      }
    } catch {
      showToast(lang === 'bn' ? 'লোগো নির্বাচন ব্যর্থ হয়েছে' : 'Failed to select logo', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Save / Update Store Settings
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !slug.trim()) {
      showToast(lang === 'bn' ? 'দোকানের নাম এবং ইউআরএল দিন' : 'Store name and slug required', 'error');
      return;
    }
    if (!employeeToken) {
      showToast(lang === 'bn' ? 'লগইন সেশন পাওয়া যায়নি' : 'Authentication missing', 'error');
      return;
    }

    const isExisting = Boolean(employee?.storeSlug);
    setIsSaving(true);
    try {
      const res = await api.employeeUpdateStore(employeeToken, {
        storeName: storeName.trim(),
        storeSlug: slug.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        storeLogoUrl: storeLogoUrl ? storeLogoUrl.trim() : (employee?.avatarUrl || ''),
        storeWhatsapp: whatsappNumber.trim(),
        storePhone: phoneNum.trim(),
        storeThemeColor: themeColor,
        storeHeaderColor: headerColor,
        storeFooterColor: footerColor,
      });

      if (res && res.success) {
        await refreshEmployeeProfile();
        setSuccessActionType(isExisting ? 'update' : 'create');
        setCreatedSuccess(true);
        setIsEditing(false);
        showToast(
          lang === 'bn'
            ? (isExisting ? 'ওয়েবসাইট আপডেট হয়েছে!' : 'ওয়েবসাইট তৈরি হয়েছে!')
            : 'Custom website successfully created/updated!',
          'success'
        );
      } else {
        showToast(lang === 'bn' ? 'ওয়েবসাইট সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save website', 'error');
      }
    } catch (err: any) {
      showToast(err.message || (lang === 'bn' ? 'ত্রুটি ঘটেছে' : 'An error occurred'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast(lang === 'bn' ? 'স্টোর লিংক কপি হয়েছে!📋' : 'Store link copied!📋');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmitSubscriptionPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTrxId.trim()) {
      showToast(lang === 'bn' ? 'সঠিক Transaction ID (TrxID) দিন' : 'Please provide Transaction ID', 'error');
      return;
    }
    if (!subSenderPhone.trim()) {
      showToast(lang === 'bn' ? 'প্রেরক মোবাইল নম্বর দিন' : 'Sender phone number required', 'error');
      return;
    }
    if (!employeeToken) {
      showToast(lang === 'bn' ? 'লগইন সেশন নেই' : 'Session expired', 'error');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await api.employeeSubmitSubscriptionPayment(employeeToken, {
        paymentMethod: subPaymentMethod,
        senderPhone: subSenderPhone.trim(),
        trxId: subTrxId.trim().toUpperCase(),
        amount: activePlanFee,
        planDuration: subPlan,
      });

      if (res && res.success) {
        await refreshEmployeeProfile();
        setSubTrxId('');
        showToast(
          lang === 'bn'
            ? 'পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করার পর সক্রিয় হবে।'
            : 'Payment request submitted! Admin will verify and activate.',
          'success'
        );
      } else {
        showToast((res as any)?.error || 'পেমেন্ট জমা ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'ত্রুটি ঘটেছে', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-[1920px] mx-auto pb-24 animate-in fade-in duration-200">
      
      {/* Hidden File Input for Gallery Logo Pick */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* TOP HEADER: Clean Back Button & Title Only (No Clutter) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-300 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {hasActiveStore && isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
            </button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'ডিজিটাল শপ সেটআপ' : 'Digital Shop Setup'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {totalTrialDays} দিনের ফ্রি ট্রায়াল • সম্পূর্ণ ব্যক্তিগত অনলাইন শপ
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
            isPaid
              ? 'bg-emerald-50 text-[#009245] border-emerald-300'
              : isTrialExpired
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-emerald-50 text-[#009245] border-emerald-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isTrialExpired ? 'bg-rose-600' : 'bg-[#009245] animate-ping'}`} />
            <span>
              {isPaid
                ? 'শপ সক্রিয় (পেইড)'
                : isTrialExpired
                ? 'মেয়াদ শেষ'
                : hasActiveStore
                ? `ট্রায়াল: ${daysRemaining} দিন বাকি`
                : `${totalTrialDays} দিনের ফ্রি ট্রায়াল`}
            </span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: ACTIVE STORE DETAILS CARD (When website is already created)
          Clicking "এডিট অপশন" reveals the setup form again!
         ========================================================================= */}
      {hasActiveStore && !isEditing && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-300 shadow-sm space-y-5 animate-in fade-in duration-200">
          
          {/* EXPLICIT SUCCESS BANNER (Shown immediately upon store save/update without page refresh) */}
          {createdSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-[#009245] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[#009245]">
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-[#009245]" />
                  <h3 className="text-base font-black">
                    {successActionType === 'create' ? 'ওয়েবসাইট তৈরি হয়েছে!' : 'ওয়েবসাইট আপডেট হয়েছে!'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedSuccess(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                আপনার ব্যক্তিগত অনলাইন শপ সফলভাবে প্রস্তুত হয়েছে। নিচের লিংক কাস্টমারদের সাথে শেয়ার করুন বা এখনই শপ ভিজিট করুন।
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href={`/shop/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ওয়েবসাইট দেখুন</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#009245]" />
                  <span>লিংক কপি করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Header Info with Logo & Store Name */}
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-50 flex items-center justify-center shrink-0 shadow-xs">
                {storeLogoUrl ? (
                  <img src={storeLogoUrl} alt={storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-[#009245]" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {storeName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-black border ${
                    isPaid
                      ? 'bg-emerald-100 text-[#009245] border-emerald-300'
                      : (isTrialExpired || isSubscriptionExpired)
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'bg-emerald-100 text-[#009245] border-emerald-300'
                  }`}>
                    {isPaid
                      ? `পেইড সাবস্ক্রিপশন সক্রিয় (${daysRemaining} দিন বাকি)`
                      : (isTrialExpired || isSubscriptionExpired)
                      ? 'মেয়াদ শেষ (পেমেন্ট আবশ্যক)'
                      : `${totalTrialDays} দিনের ট্রায়াল (${daysRemaining} দিন বাকি)`}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <span>রিসেলার:</span>
                    <span className="font-bold text-slate-800">{employee?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* EDIT BUTTON (Prominently placed as requested) */}
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'bn' ? 'এডিট করুন' : 'Edit Settings'}</span>
            </button>
          </div>

          {/* Store Live Link Box with Copy & Visit */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-[11px] font-bold text-slate-500 block">
              {lang === 'bn' ? 'আপনার ব্যক্তিগত ওয়েবসাইট লিংক:' : 'Your Website URL:'}
            </label>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-0 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono font-bold text-[#009245] truncate shadow-2xs">
                {fullUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#009245]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
              </button>
              <a
                href={`/shop/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'শপ ভিজিট করুন' : 'Visit Store'}</span>
              </a>
            </div>
          </div>

          {/* Contact & Theme Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-3xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#009245] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">WhatsApp</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{whatsappNumber}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-3xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">হেল্পলাইন</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{phoneNum}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-3xs flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl shrink-0 shadow-2xs border border-black/10"
                style={{ backgroundColor: themeColor }}
              />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 font-bold block">থিম কালার</span>
                <span className="text-xs font-mono font-bold text-slate-900 uppercase block">{themeColor}</span>
              </div>
            </div>
          </div>

          {/* SUBSCRIPTION & PAYMENT CONTROL SECTION */}
          {(needsPayment || employee?.subscriptionPaymentStatus === 'PENDING') && (
            <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-br from-amber-50/60 via-white to-rose-50/30 border-amber-200 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {needsPayment ? 'আপনার ফ্রি ট্রায়াল শেষ হয়েছে। ওয়েবসাইট চালু রাখতে পেমেন্ট করুন।' : 'সাবস্ক্রিপশন পেমেন্ট স্ট্যাটাস'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {needsPayment
                      ? 'পেমেন্ট সম্পন্ন করে নিচের ফর্মটি পূরণ করুন। অ্যাডমিন ভেরিফাই করে আপনার ওয়েবসাইট পুনরায় চালু করবেন।'
                      : 'আপনার পেমেন্ট বর্তমানে অ্যাডমিন অনুমোদনের অপেক্ষায় আছে।'}
                  </p>
                </div>
              </div>

              {employee?.subscriptionPaymentStatus === 'PENDING' ? (
                <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span>আপনার পেমেন্ট রিকোয়েস্ট যাচাই প্রক্রিয়াধীন রয়েছে। অ্যাডমিন অনুমোদন করলে ওয়েবসাইট পুনরায় চালু হবে।</span>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {/* Select Plan Duration */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      প্ল্যান নির্বাচন করুন
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: '1_month', label: '১ মাস', fee: planFees['1_month'] },
                        { key: '6_months', label: '৬ মাস', fee: planFees['6_months'] },
                        { key: '1_year', label: '১ বছর', fee: planFees['1_year'] },
                        { key: '2_years', label: '২ বছর', fee: planFees['2_years'] },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setSubPlan(p.key as any)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            subPlan === p.key
                              ? 'border-[#009245] bg-emerald-50 text-[#009245] font-black ring-1 ring-[#009245]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold'
                          }`}
                        >
                          <div className="text-xs">{p.label}</div>
                          <div className="text-sm font-black mt-0.5">৳{p.fee}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Details */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      পেমেন্ট মেথড বেছে নিন (Send Money / Personal)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSubPaymentMethod('bKash')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          subPaymentMethod === 'bKash'
                            ? 'border-pink-500 bg-pink-50 text-pink-700 ring-1 ring-pink-500'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>bKash</span>
                        <span className="text-[11px] font-mono font-bold">
                          ({paymentSettings?.find(p => p.name === 'bKash')?.accountNumber || brandSettings?.resellerSubscriptionPaymentPhone || '01XXXXXXXXX'})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubPaymentMethod('Nagad')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          subPaymentMethod === 'Nagad'
                            ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>Nagad</span>
                        <span className="text-[11px] font-mono font-bold">
                          ({paymentSettings?.find(p => p.name === 'Nagad')?.accountNumber || brandSettings?.resellerSubscriptionPaymentPhone || '01XXXXXXXXX'})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Sender Phone & TrxID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) *
                      </label>
                      <input
                        type="text"
                        placeholder="01XXXXXXXXX"
                        value={subSenderPhone}
                        onChange={(e) => setSubSenderPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold focus:border-[#009245] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        ট্রানজেকশন আইডি (TrxID) *
                      </label>
                      <input
                        type="text"
                        placeholder="TrxID (যেমন: 9J283HDK)"
                        value={subTrxId}
                        onChange={(e) => setSubTrxId(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:border-[#009245] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Payment button */}
                  <button
                    type="button"
                    disabled={isSubmittingPayment || !subTrxId.trim() || !subSenderPhone.trim()}
                    onClick={handleSubmitSubscriptionPayment}
                    className="w-full py-2.5 px-4 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isSubmittingPayment ? 'জমা হচ্ছে...' : `৳${activePlanFee} পেমেন্ট সাবমিট করুন`}</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          VIEW 2: COMPACT CLEAN SETUP & EDIT FORM (Mobile-optimized, zero clutter)
         ========================================================================= */}
      {(!hasActiveStore || isEditing) && (
        <form onSubmit={handleSaveStore} className="space-y-4 sm:space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
            {/* COLUMN 1: SECTION 1: LOGO & SHOP NAME */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-300 shadow-xs space-y-4">
              
              {/* Logo Picker (Compact layout for mobile & desktop) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-800 block">
                  {lang === 'bn' ? 'দোকানের লোগো (গ্যালারি থেকে ফটো নির্বাচন)' : 'Shop Logo'}
                </label>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-300">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                    {storeLogoUrl ? (
                      <img src={storeLogoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'গ্যালারি থেকে লোগো দিন' : 'Choose Logo'}</span>
                      </button>

                      {storeLogoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setStoreLogoUrl('');
                            showToast(lang === 'bn' ? 'লোগো মুছে ফেলা হয়েছে' : 'Logo removed');
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>মুছুন</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10.5px] text-slate-400 font-medium">
                      মোবাইলের গ্যালারি থেকে যেকোনো ছবি নির্বাচন করুন
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  {lang === 'bn' ? 'দোকানের নাম *' : 'Shop Name *'}
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="যেমন: ফ্যাশন প্যালেস এক্সপ্রেস"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#009245] shadow-3xs"
                  required
                />
              </div>

              {/* Shop Slug / URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  {lang === 'bn' ? 'শপ ইউআরএল (স্লাগ) *' : 'Shop URL Slug *'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-600 shrink-0 select-none">
                    /shop/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="fashion_palace"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#009245] shadow-3xs"
                    required
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 font-mono truncate">
                  {fullUrl}
                </p>
              </div>

            </div>

            {/* COLUMN 2: SECTION 2 (CONTACT NUMBERS) & SECTION 3 (THEME COLOR PICKER) */}
            <div className="space-y-4 sm:space-y-6">
              {/* SECTION 2: CONTACT NUMBERS */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-300 shadow-xs space-y-3.5">
                <h3 className="text-xs font-black text-slate-800 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'bn' ? 'যোগাযোগ ও WhatsApp নম্বর' : 'Contact Numbers'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp নম্বর *</span>
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="01712345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#009245] shadow-3xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-600" />
                      <span>যোগাযোগ নম্বর (হেল্পলাইন) *</span>
                    </label>
                    <input
                      type="text"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      placeholder="01712345678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#009245] shadow-3xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: THEME COLOR BOX PICKER */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-300 shadow-xs space-y-3">
                <h3 className="text-xs font-black text-slate-800 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'bn' ? 'ওয়েবসাইটের থিম কালার বক্স' : 'Theme Color Box'}</span>
                </h3>

                <p className="text-[11px] text-slate-500 font-medium">
                  কালার বক্সে ক্লিক করে আপনার পছন্দের যেকোনো ব্র্যান্ড কালার সিলেক্ট করুন:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Theme Color Picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700">থিম কালার</label>
                    <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-slate-300" />
                  </div>
                  {/* Header Color Picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700">হেডার কালার</label>
                    <input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-slate-300" />
                  </div>
                  {/* Footer Color Picker */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-700">ফুটার কালার</label>
                    <input type="color" value={footerColor} onChange={(e) => setFooterColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer border border-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: SINGLE ACTION BUTTON (Full width across bottom) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-[#009245] hover:bg-[#007a38] text-white text-xs sm:text-sm font-black rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? (lang === 'bn' ? 'ওয়েবসাইট তৈরি হচ্ছে...' : 'Creating Website...')
                  : hasActiveStore
                  ? (lang === 'bn' ? 'ওয়েবসাইট আপডেট করুন' : 'Update Website')
                  : (lang === 'bn' ? 'ওয়েবসাইট তৈরি করুন' : 'Create Website')}
              </span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
