import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';
import { Product, Sale, Withdrawal, Transaction } from '../types/index.js';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { ResellerDashboardTab } from './reseller/ResellerDashboardTab.js';
import { ResellerCatalogTab } from './reseller/ResellerCatalogTab.js';
import { ResellerOrdersTab } from './reseller/ResellerOrdersTab.js';
import { ResellerEarningsTab } from './reseller/ResellerEarningsTab.js';
import { ResellerWithdrawalTab } from './reseller/ResellerWithdrawalTab.js';
import { ResellerNotificationsTab } from './reseller/ResellerNotificationsTab.js';
import { ResellerSupportTab } from './reseller/ResellerSupportTab.js';
import { ResellerProfileTab } from './reseller/ResellerProfileTab.js';
import { ResellerCartTab } from './reseller/ResellerCartTab.js';
import { ResellerTrainingTab } from './reseller/ResellerTrainingTab.js';
import { ResellerLoginHistoryTab } from './reseller/ResellerLoginHistoryTab.js';
import { ResellerReferralTab } from './reseller/ResellerReferralTab.js';
import { ResellerVideoGeneratorTab } from './reseller/ResellerVideoGeneratorTab.js';
import { ResellerCampaignsHub } from './reseller/campaigns/ResellerCampaignsHub.js';
import { ResellerWebsiteGeneratorTab } from './reseller/ResellerWebsiteGeneratorTab.js';
import { ResellerAddingToOrderBanner } from './reseller/ResellerAddingToOrderBanner.js';
import { ResellerOrderCheckoutModal, CheckoutOrderItem } from './reseller/ResellerOrderCheckoutModal.js';
import { BilingualLocationInput } from './common/BilingualLocationInput.js';
import { searchBilingualDistricts, searchBilingualThanas } from '../data/bdLocations.js';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents.js';

export const EmployeePortal: React.FC = () => {
  const {
    lang,
    employee,
    employeeToken,
    isEmployeeAuthenticated,
    setEmployeeSession,
    showToast,
    brandSettings,
    resellerTab,
    setResellerTab,
    setSelectedProduct,
    refreshEmployeeProfile,
    employeeLogout,
    resellerPreviewProduct,
  } = useApp();

  // Instant live sync on server events (bonus limit changes, margin updates, approval)
  useRealtimeEvents((event) => {
    if (
      event.type === 'RESELLER_MARGIN_UPDATED' ||
      event.type === 'STATE_UPDATED' ||
      event.type === 'EMPLOYEE_UPDATED' ||
      event.type === 'COMMISSION_UPDATED'
    ) {
      refreshEmployeeProfile();
      if (isEmployeeAuthenticated && employeeToken) {
        loadEmployeeDashboard();
      }
    }
  });

  // Auth mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessNotice, setAuthSuccessNotice] = useState<string | null>(null);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<{
    name: string;
    phone: string;
    email: string;
    district: string;
    thana: string;
    reference: string;
  } | null>(null);

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regDistrict, setRegDistrict] = useState('');
  const [regThana, setRegThana] = useState('');
  const toEnglishDigits = (str: string): string => {
    const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return (str || '').replace(/[০-৯]/g, (w) => bengaliNumbers.indexOf(w).toString());
  };

  const handlePhoneChange = (val: string) => {
    // Convert Bengali numerals to English, strip non-digits, and cap strictly at 11 digits
    const digitsOnly = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setRegPhone(digitsOnly.slice(0, 11));
  };

  const handleLoginIdChange = (val: string) => {
    // Convert Bengali numerals to English, strip non-digits, and cap strictly at 11 digits
    const digitsOnly = toEnglishDigits(val).replace(/[^0-9]/g, '');
    setLoginId(digitsOnly.slice(0, 11));
  };

  const isHardPassword = (pwd: string): boolean => {
    if (!pwd || pwd.length < 6) return false;
    // Reject passwords that are only digits
    if (/^\d+$/.test(pwd)) return false;
    // Reject passwords that are only letters
    if (/^[a-zA-Z]+$/.test(pwd)) return false;
    // Must contain both letters and digits
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    if (!hasLetter || !hasDigit) return false;
    // Common trivial passwords to reject
    const weakList = ['123456', '12345678', 'password', 'pass123', 'admin123', 'qwerty'];
    if (weakList.includes(pwd.toLowerCase())) return false;
    return true;
  };

  const getInitialInviteRef = () => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const refParam = params.get('ref') || params.get('referral');
        if (refParam && refParam.trim()) {
          return refParam.toUpperCase().trim();
        }
      } catch {
        // Safe ignore
      }
    }
    return '';
  };

  const initialInvite = getInitialInviteRef();
  const [regReference, setRegReference] = useState(initialInvite);
  const [isRefLocked, setIsRefLocked] = useState(Boolean(initialInvite));
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Auto-detect referral code ONLY when entering directly via a shared link (?ref=CODE or ?referral=CODE)
  useEffect(() => {
    const invite = getInitialInviteRef();
    if (invite) {
      setRegReference(invite);
      setIsRefLocked(true);
      setAuthMode('register');
      // Clean query parameter from browser address bar so refreshing the page does not reload the invite link
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        url.searchParams.delete('referral');
        const newSearch = url.searchParams.toString() ? '?' + url.searchParams.toString() : '';
        window.history.replaceState({}, document.title, url.pathname + newSearch + url.hash);
      } catch {}
    } else {
      setRegReference('');
      setIsRefLocked(false);
    }

    // Clean up any old localStorage or sessionStorage lingering keys
    try {
      localStorage.removeItem('tawzoon_invite_ref');
      sessionStorage.removeItem('tawzoon_invite_ref');
    } catch {}
  }, []);

  // Dashboard data
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  // Reseller Checkout Modal & Adding-to-Order management
  const [resellerCheckoutModalOpen, setResellerCheckoutModalOpen] = useState(false);
  const [resellerCheckoutModalItems, setResellerCheckoutModalItems] = useState<CheckoutOrderItem[]>([]);

  useEffect(() => {
    const handleOpenResellerCheckout = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detailItems = customEvent.detail?.items;
      if (Array.isArray(detailItems) && detailItems.length > 0) {
        setResellerCheckoutModalItems(detailItems);
      } else {
        try {
          const savedItems = JSON.parse(sessionStorage.getItem('tawzoon_reseller_pending_order_items') || '[]');
          if (Array.isArray(savedItems) && savedItems.length > 0) {
            setResellerCheckoutModalItems(savedItems);
          }
        } catch {}
      }
      setResellerCheckoutModalOpen(true);
    };

    window.addEventListener('tawzoon_open_reseller_checkout', handleOpenResellerCheckout as EventListener);
    return () => {
      window.removeEventListener('tawzoon_open_reseller_checkout', handleOpenResellerCheckout as EventListener);
    };
  }, []);

  const loadEmployeeDashboard = async () => {
    if (!employeeToken) return;
    try {
      const [, sales, wds, trxs, prods] = await Promise.all([
        api.employeeGetDashboard(employeeToken),
        api.employeeGetSales(employeeToken),
        api.employeeGetWithdrawals(employeeToken),
        api.employeeGetTransactions(employeeToken),
        api.employeeGetProducts(employeeToken),
      ]);
      setSalesList(sales || []);
      setWithdrawalsList(wds || []);
      setTransactionsList(trxs || []);
      setProductsList(prods?.products || (Array.isArray(prods) ? prods : []));
    } catch (err: any) {
      if (err?.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.message.includes('Session expired'))) {
        employeeLogout();
      } else if (err.message && (err.message.includes('Rate exceeded') || err.message.includes('Unexpected token') || err.message.includes('JSON'))) {
        console.warn('Dashboard fetch rate-limited. Retrying in background.');
      } else {
        console.warn('Failed to fetch reseller dashboard data:', err?.message || err);
      }
    }
  };

  useEffect(() => {
    if (isEmployeeAuthenticated) {
      loadEmployeeDashboard();
    }
  }, [isEmployeeAuthenticated, employeeToken, resellerTab]);

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanIdentifier = toEnglishDigits(loginId).trim().replace(/[^0-9]/g, '');
    if (cleanIdentifier.length !== 11 || !cleanIdentifier.startsWith('01')) {
      setAuthError(
        lang === 'bn'
          ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01XXXXXXXXX)। নম্বরটি অবশ্যই 01 দিয়ে শুরু হতে হবে এবং মোট ১১ ডিজিট হতে হবে।'
          : 'Please enter a valid 11-digit mobile number starting with 01.'
      );
      return;
    }

    setAuthLoading(true);
    try {
      const res = await api.employeeLogin({
        identifier: cleanIdentifier,
        password: loginPassword,
      });
      setEmployeeSession(res.token, res.employee, true);
      showToast(lang === 'bn' ? 'রিসেলার প্যানেলে স্বাগতম!' : 'Welcome to Reseller Panel!');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isHardPassword(regPassword)) {
      setAuthError(
        lang === 'bn'
          ? 'সহজ পাসওয়ার্ড গ্রহণযোগ্য নয়! পাসওয়ার্ডটি হার্ড (Hard) হতে হবে—কমপক্ষে ৬ অক্ষরের মধ্যে বর্ণ (A-Z/a-z) ও সংখ্যা (0-9) মিলিয়ে দিন (যেমন: Pass1234)।'
          : 'Simple passwords are not allowed! Password must be hard/strong with at least 6 characters combining letters and numbers.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError(lang === 'bn' ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি!' : 'Passwords do not match!');
      return;
    }

    const cleanPhone = toEnglishDigits(regPhone).replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setAuthError(
        lang === 'bn'
          ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)। ১১ ডিজিটের কম বা বেশি গ্রহণ করা হবে না।'
          : 'Please provide an exact 11-digit mobile number starting with 01.'
      );
      return;
    }

    if (!regEmail || !regEmail.trim()) {
      setAuthError(lang === 'bn' ? 'ইমেইল ঠিকানা প্রদান করা আবশ্যক! ইমেইল ছাড়া অ্যাকাউন্ট তৈরি করা যাবে না।' : 'Email address is required! Account cannot be created without an email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setAuthError(lang === 'bn' ? 'দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন (যেমন: user@example.com)' : 'Please provide a valid email address.');
      return;
    }

    if (!regDistrict.trim()) {
      setAuthError(lang === 'bn' ? 'দয়া করে আপনার জেলা নির্বাচন করুন' : 'Please select your district.');
      return;
    }

    if (!regThana.trim()) {
      setAuthError(lang === 'bn' ? 'দয়া করে আপনার থানা বা উপজেলা নির্বাচন করুন' : 'Please select your thana/upazila.');
      return;
    }

    if (isRefLocked && (!regReference || !regReference.trim())) {
      setAuthError(lang === 'bn' ? 'আমন্ত্রণিক রেফারেল কোড আবশ্যক!' : 'Invited referral code is required!');
      return;
    }

    const finalReference = regReference.trim() ? regReference.trim().toUpperCase() : 'TAWZOON9516';

    setAuthLoading(true);
    try {
      const submittedData = {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: cleanPhone,
        district: regDistrict.trim(),
        thana: regThana.trim(),
        reference: finalReference,
      };

      const res = await api.employeeRegister({
        name: submittedData.name,
        email: submittedData.email,
        phone: submittedData.phone,
        district: submittedData.district,
        thana: submittedData.thana,
        password: regPassword,
        reference: submittedData.reference,
      });

      setRegisteredSuccessData(submittedData);
      setAuthSuccessNotice(lang === 'bn' ? 'রেজিস্ট্রেশন সফল হয়েছে! অ্যাকাউন্ট অনুমোদনের পর লগইন করতে পারবেন।' : res.messageEn);
      setAuthMode('login');
      setLoginId(cleanPhone);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegDistrict('');
      setRegThana('');
      setRegReference('');
      setIsRefLocked(false);
      try {
        localStorage.removeItem('tawzoon_invite_ref');
        sessionStorage.removeItem('tawzoon_invite_ref');
      } catch {}
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTakeForSelling = (product: Product) => {
    setSelectedProduct(product);
  };

  // ----------------------------------------------------
  // UNAUTHENTICATED: CLEAN & PROFESSIONAL RESELLER AUTH HUB
  // ----------------------------------------------------
  if (!isEmployeeAuthenticated || !employee) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative animate-in fade-in duration-200">
        
        {/* Main Professional Auth Card */}
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-150 shadow-xl p-6 sm:p-8 space-y-5">
          
          {/* Brand Logo & Header */}
          <div className="text-center space-y-2">
            {/* Brand Logo with crisp white border wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 mx-auto shadow-md flex items-center justify-center">
              <img
                src={brandSettings?.logoUrl || '/logo.png'}
                alt="App Logo"
                className="w-full h-full rounded-xl object-cover select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {authMode === 'register' ? 'রিসেলার অ্যাকাউন্ট খুলুন' : 'রিসেলার একাউন্টে লগইন'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'register'
                  ? 'বিনা পুঁজিতে অনলাইনে রিসেলিং ব্যবসা শুরু করুন এবং ঘরে বসে আয় করুন'
                  : 'আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে অ্যাকাউন্টে প্রবেশ করুন'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login' ? 'bg-[#009245] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>লগইন করুন</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'register' ? 'bg-[#009245] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>রেজিস্ট্রেশন (নতুন)</span>
            </button>
          </div>

          {authSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{authSuccessNotice}</span>
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? 'মোবাইল নম্বর অথবা আইডি' : 'Phone or User ID'}
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  value={loginId}
                  onChange={(e) => handleLoginIdChange(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-[#009245] outline-none font-mono font-bold text-slate-900 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                    title={showLoginPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 text-xs sm:text-sm font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{authLoading ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Signing In...') : 'লগইন করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* 1. Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="যেমন: মোঃ সাকিব হাসান"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                />
              </div>

              {/* 2. Mobile Phone */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Phone'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={11}
                  value={regPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-bold text-slate-900"
                />
              </div>

              {/* 3. Email Address (Mandatory) */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} <span className="text-[#009245]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-medium text-slate-900"
                />
              </div>

              {/* 5. Clean District & Thana Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <BilingualLocationInput
                  id="reg-district-field"
                  label={lang === 'bn' ? 'জেলা' : 'District'}
                  required
                  value={regDistrict}
                  onChange={(val) => {
                    setRegDistrict(val);
                    setRegThana('');
                  }}
                  placeholder={lang === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}
                  searchFn={(q) => searchBilingualDistricts(q)}
                  emptyHint={lang === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No district found'}
                />

                <BilingualLocationInput
                  id="reg-thana-field"
                  label={lang === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'}
                  required
                  value={regThana}
                  onChange={(val) => setRegThana(val)}
                  placeholder={
                    regDistrict
                      ? (lang === 'bn' ? 'থানা নির্বাচন করুন' : 'Select Thana')
                      : (lang === 'bn' ? 'প্রথমে জেলা নির্বাচন করুন' : 'Select district first')
                  }
                  searchFn={(q) => searchBilingualThanas(q, regDistrict)}
                  emptyHint={lang === 'bn' ? 'কোনো থানা পাওয়া যায়নি' : 'No thana found'}
                />
              </div>

              {/* 6. Referral Code (Optional if not locked) */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 block">
                  {lang === 'bn' ? (isRefLocked ? 'আমন্ত্রণিক রেফারেল কোড' : 'রেফারেল কোড (ঐচ্ছিক)') : (isRefLocked ? 'Invited Referral Code' : 'Referral Code (Optional)')} {isRefLocked && <span className="text-[#009245]">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required={isRefLocked}
                    readOnly={isRefLocked}
                    value={regReference}
                    onChange={(e) => {
                      if (!isRefLocked) {
                        setRegReference(e.target.value.toUpperCase().trim());
                      }
                    }}
                    placeholder={lang === 'bn' ? 'রেফারেল কোড (যদি থাকে)' : 'Referral code (Optional)'}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl font-mono font-bold uppercase tracking-wider outline-none transition-all ${
                      isRefLocked
                        ? 'bg-[#eafff3]/80 border-2 border-emerald-300 text-emerald-900 cursor-not-allowed select-none pl-8.5'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#009245] text-slate-900'
                    }`}
                  />
                  {isRefLocked && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#009245]">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Password & Confirm */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-[#009245]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                      title={showRegPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">
                    {lang === 'bn' ? 'কনফার্ম পাসওয়ার্ড' : 'Confirm'} <span className="text-[#009245]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                      title={showRegConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-500 font-bold flex items-center gap-1.5 px-0.5">
                <span className="text-[#009245] font-black">🔒</span>
                <span>{lang === 'bn' ? 'হার্ড পাসওয়ার্ড দিন: অন্তত ৬ অক্ষরে বর্ণ (a-z) ও সংখ্যা (0-9) মিলিয়ে লিখুন।' : 'Hard password required: at least 6 characters with letters (a-z) & numbers (0-9).'}</span>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 text-xs sm:text-sm font-black text-white bg-[#009245] hover:bg-[#007a3a] rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                <span>{authLoading ? 'রেজিস্ট্রেশন হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Perks Footer */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-black">✓</span>
              <span>বিনামূল্যে আজীবন রিসেলার মেম্বারশিপ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-black">✓</span>
              <span>প্রতিটি প্রোডাক্ট অর্ডারে আকর্ষণীয় কমিশন আয়</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-black">✓</span>
              <span>বিকাশ বা নগদ একাউন্টে যেকোনো সময় টাকা উইথড্র</span>
            </div>
          </div>

        </div>

        {/* Registration Success & Admin Approval WhatsApp Popup Modal */}
        {registeredSuccessData && (
          <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-slate-100 relative text-center space-y-4 animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setRegisteredSuccessData(null)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Status Header Icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-100 text-[#009245] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              {/* Title & Admin Notice */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  রেজিস্ট্রেশন সম্পন্ন হয়েছে!
                </h3>
                <div className="p-3 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-bold leading-relaxed text-left flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">⏳</span>
                  <div>
                    <span>আপনার অ্যাকাউন্টটি এডমিন অ্যাপ্রুভ করার পরে আপনার অ্যাকাউন্টটি শুরু করা যাবে।</span>
                    <span className="block text-[11px] text-amber-800 font-normal mt-0.5">
                      দ্রুত অ্যাকাউন্ট চালু করতে নিচের বাটনে ক্লিক করে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ পাঠান।
                    </span>
                  </div>
                </div>
              </div>

              {/* Registered Information Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 text-left text-xs space-y-2">
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center justify-between">
                  <span>আপনার তথ্যসমূহ</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-emerald-200">
                    অপেক্ষমান
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 gap-2">
                  <span className="text-slate-500 shrink-0">নাম:</span>
                  <span className="font-bold text-slate-900 text-right truncate">{registeredSuccessData.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 gap-2">
                  <span className="text-slate-500 shrink-0">মোবাইল নম্বর:</span>
                  <span className="font-mono font-bold text-slate-900 text-right">{registeredSuccessData.phone}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 gap-2">
                  <span className="text-slate-500 shrink-0">ইমেইল:</span>
                  <span className="font-medium text-slate-900 truncate max-w-[200px] text-right">{registeredSuccessData.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 gap-2">
                  <span className="text-slate-500 shrink-0">জেলা ও থানা:</span>
                  <span className="font-bold text-slate-900 text-right">{registeredSuccessData.thana}, {registeredSuccessData.district}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 gap-2">
                  <span className="text-slate-500 shrink-0">রেফারেল কোড:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {registeredSuccessData.reference}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/8801722439516?text=${encodeURIComponent(
                    `*নতুন রিসেলার একাউন্ট অনুমোদন আবেদন*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *নাম:* ${registeredSuccessData.name}\n📱 *মোবাইল:* ${registeredSuccessData.phone}\n📧 *ইমেইল:* ${registeredSuccessData.email}\n📍 *এলাকা:* ${registeredSuccessData.thana}, ${registeredSuccessData.district}\n🔖 *রেফারেল কোড:* ${registeredSuccessData.reference}\n━━━━━━━━━━━━━━━━━━━━━\n_আসসালামু আলাইকুম, আমি তাওজুন (Tawzoon) প্ল্যাটফর্মে রিসেলার হিসেবে রেজিস্ট্রেশন সম্পন্ন করেছি। অনুগ্রহ করে আমার একাউন্টটি দ্রুত ভেরিফাই ও অনুমোদন করে দিন।_`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 text-xs sm:text-sm font-black text-white bg-[#25D366] hover:bg-[#1ebd5a] rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>হোয়াটসঅ্যাপে যোগাযোগ করুন</span>
                </a>

                {/* Back to Login Button */}
                <button
                  type="button"
                  onClick={() => setRegisteredSuccessData(null)}
                  className="w-full py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  লগইন পেজে যান
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED: RESELLER DASHBOARD
  // ----------------------------------------------------
  return (
    <div className={`min-h-screen bg-slate-50/70 text-slate-900 ${resellerPreviewProduct ? 'pb-2 sm:pb-3 min-h-0' : 'pb-24'} w-full max-w-full overflow-x-hidden`}>
      {/* 3. Main Dynamic Content Area (Full Display Responsive Layout matching Public Page) */}
      <div className={`w-full max-w-[1920px] mx-auto ${resellerTab === 'catalog' ? 'p-0' : `px-3 sm:px-6 lg:px-8 xl:px-10 ${resellerPreviewProduct ? 'pt-1 sm:pt-2' : 'pt-2 sm:pt-4'}`}`}>
        {resellerTab === 'dashboard' && (
          <ResellerDashboardTab
            salesList={salesList}
            transactionsList={transactionsList}
            onOpenRecordSale={() => setResellerTab('catalog')}
            onOpenWithdraw={() => setResellerTab('withdrawal')}
            onSwitchTab={(tab) => setResellerTab(tab)}
          />
        )}

        {resellerTab === 'catalog' && (
          <ResellerCatalogTab
            productsList={productsList}
            onTakeForSelling={handleTakeForSelling}
          />
        )}

        {resellerTab === 'training' && (
          <ResellerTrainingTab />
        )}

        {(resellerTab === 'campaigns' || resellerTab === 'video-generator') && (
          <ResellerCampaignsHub
            productsList={productsList}
            onTakeForSelling={handleTakeForSelling}
            initialTab={resellerTab === 'video-generator' ? 'video' : undefined}
          />
        )}

        {resellerTab === 'orders' && (
          <ResellerOrdersTab
            salesList={salesList}
            productsList={productsList}
            onRefresh={loadEmployeeDashboard}
            onOpenRecordSale={() => setResellerTab('catalog')}
          />
        )}

        {resellerTab === 'cart' && (
          <ResellerCartTab onOrderSuccess={loadEmployeeDashboard} />
        )}

        {resellerTab === 'earnings' && (
          <ResellerEarningsTab
            transactionsList={transactionsList}
            salesList={salesList}
          />
        )}

        {resellerTab === 'create-website' && (
          <ResellerWebsiteGeneratorTab />
        )}

        {resellerTab === 'withdrawal' && (
          <ResellerWithdrawalTab
            withdrawalsList={withdrawalsList}
            onRefresh={loadEmployeeDashboard}
          />
        )}

        {resellerTab === 'notifications' && (
          <ResellerNotificationsTab />
        )}

        {resellerTab === 'referral' && (
          <ResellerReferralTab />
        )}

        {resellerTab === 'support' && (
          <ResellerSupportTab />
        )}

        {resellerTab === 'login-history' && (
          <ResellerLoginHistoryTab />
        )}

        {resellerTab === 'profile' && (
          <ResellerProfileTab
            onOpenWithdrawal={() => setResellerTab('withdrawal')}
            onRefresh={loadEmployeeDashboard}
          />
        )}
      </div>

      {/* Reseller Adding To Order Floating Bar */}
      <ResellerAddingToOrderBanner isCheckoutOpen={resellerCheckoutModalOpen} />

      {/* Top-Level Reseller Order Checkout Modal */}
      {resellerCheckoutModalOpen && (
        <ResellerOrderCheckoutModal
          isOpen={resellerCheckoutModalOpen}
          onClose={() => setResellerCheckoutModalOpen(false)}
          items={resellerCheckoutModalItems}
          onOrderSuccess={() => {
            setResellerCheckoutModalOpen(false);
            loadEmployeeDashboard();
          }}
        />
      )}
    </div>
  );
};
