import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { Product, Sale, Transaction, Withdrawal } from '../../types/index.js';
import { playLoginSuccessSound } from '../../utils/soundEffects.js';
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  CircleDollarSign,
  ArrowDownToLine,
  Bell,
  HelpCircle,
  User,
  GraduationCap,
  Video,
  Globe,
  PlusCircle,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Languages,
  UserCheck,
  Shield
} from 'lucide-react';

// Import Tabs
import { ResellerLoginHistoryTab } from './ResellerLoginHistoryTab.js';
import { ResellerDashboardTab } from './ResellerDashboardTab.js';
import { ResellerCatalogTab } from './ResellerCatalogTab.js';
import { ResellerOrdersTab } from './ResellerOrdersTab.js';
import { ResellerEarningsTab } from './ResellerEarningsTab.js';
import { ResellerWithdrawalTab } from './ResellerWithdrawalTab.js';
import { ResellerNotificationsTab } from './ResellerNotificationsTab.js';
import { ResellerSupportTab } from './ResellerSupportTab.js';
import { ResellerProfileTab } from './ResellerProfileTab.js';
import { ResellerTrainingTab } from './ResellerTrainingTab.js';
import { ResellerVideoGeneratorTab } from './ResellerVideoGeneratorTab.js';
import { ResellerWebsiteGeneratorTab } from './ResellerWebsiteGeneratorTab.js';
import { ResellerCartTab } from './ResellerCartTab.js';
import { ResellerReferralTab } from './ResellerReferralTab.js';
import { UserBottomNav } from '../UserBottomNav.js';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents.js';

export const ResellerPortal: React.FC = () => {
  const {
    lang,
    setLang,
    employee,
    employeeToken,
    isEmployeeAuthenticated,
    setEmployeeSession,
    employeeLogout,
    resellerTab,
    setResellerTab,
    showToast,
    setActivePortal,
    setPublicCategory,
    brandSettings,
    refreshEmployeeProfile,
  } = useApp();

  // Auth fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // App Lists
  const [salesList, setSalesList] = useState<Sale[]>([]);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal State for adding new sales
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);

  // Fetch all reseller lists
  const fetchAllData = async () => {
    if (!employeeToken) return;
    setLoadingData(true);
    try {
      const [sales, txs, withdrawals, prods] = await Promise.all([
        api.employeeGetSales(employeeToken),
        api.employeeGetTransactions(employeeToken),
        api.employeeGetWithdrawals(employeeToken),
        api.employeeGetProducts(employeeToken),
      ]);
      setSalesList(Array.isArray(sales) ? sales : []);
      setTransactionsList(Array.isArray(txs) ? txs : []);
      setWithdrawalsList(Array.isArray(withdrawals) ? withdrawals : []);
      setProductsList(Array.isArray(prods) ? prods : (prods?.products || []));
    } catch (err) {
      console.error('Failed to load reseller portal data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isEmployeeAuthenticated && employeeToken) {
      fetchAllData();
    }
  }, [isEmployeeAuthenticated, employeeToken]);

  // Real-time listener: immediately sync margin, bonuses, and catalog updates
  useRealtimeEvents((event) => {
    if (event.type === 'RESELLER_MARGIN_UPDATED' || event.type === 'STATE_UPDATED' || event.type === 'COMMISSION_UPDATED') {
      refreshEmployeeProfile();
      if (isEmployeeAuthenticated && employeeToken) {
        fetchAllData();
      }
    }
  });

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে আইডি এবং পাসওয়ার্ড দিন' : 'Please provide ID and password', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.employeeLogin({ identifier, password });
      if (res && res.token && res.employee) {
        setEmployeeSession(res.token, res.employee, true);
        playLoginSuccessSound();

        // Record login session for Login History
        try {
          const ua = navigator.userAgent;
          let deviceName = 'Windows PC / Desktop';
          let browser = 'Google Chrome';
          let os = 'Windows 11';
          let type: 'mobile' | 'desktop' | 'tablet' = 'desktop';

          if (/android/i.test(ua)) {
            deviceName = 'Android Smartphone';
            os = 'Android OS';
            type = 'mobile';
          } else if (/iphone|ipad|ipod/i.test(ua)) {
            deviceName = /ipad/i.test(ua) ? 'Apple iPad Tablet' : 'Apple iPhone';
            os = 'iOS';
            type = /ipad/i.test(ua) ? 'tablet' : 'mobile';
          } else if (/macintosh|mac os x/i.test(ua)) {
            deviceName = 'Apple Mac Desktop';
            os = 'macOS';
            type = 'desktop';
          }

          if (/firefox/i.test(ua)) browser = 'Mozilla Firefox';
          else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
          else if (/edge/i.test(ua)) browser = 'Microsoft Edge';
          else if (/chrome/i.test(ua)) browser = 'Google Chrome';

          const existingSessions = JSON.parse(localStorage.getItem('tawzoon_reseller_login_sessions') || '[]');
          const updatedSessions = existingSessions.map((s: any) => ({ ...s, isCurrent: false }));
          const newSession = {
            id: 'sess-' + Date.now(),
            deviceName,
            browser,
            os,
            ipAddress: '103.102.27.' + Math.floor(Math.random() * 150 + 10),
            location: 'Dhaka, Bangladesh',
            loginTime: new Date().toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }),
            isCurrent: true,
            type
          };
          localStorage.setItem('tawzoon_reseller_login_sessions', JSON.stringify([newSession, ...updatedSessions]));
        } catch {
          // ignore
        }

        showToast(lang === 'bn' ? 'সাফল্যের সাথে লগইন হয়েছে!' : 'Logged in successfully!', 'success');
      } else {
        showToast(lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে' : 'Login failed'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEmployeeAuthenticated || !employee) {
    // Show Login
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans flex flex-col justify-between">
        {/* Header */}
        <header className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white">
          <button
            onClick={() => {
              setActivePortal('public');
              setPublicCategory('all');
            }}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer hover:opacity-85 transition-opacity"
          >
            {brandSettings?.logoUrl ? (
              <img 
                src={brandSettings.logoUrl} 
                alt="App Logo" 
                className="w-8 h-8 rounded-xl object-cover shadow-xs shrink-0" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                T
              </div>
            )}
            <span className="text-xl font-black tracking-tight text-slate-900">
              {brandSettings?.appName || 'TAWZOON NEXUS'}
            </span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActivePortal('public');
                setPublicCategory('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#009245] hover:bg-emerald-100 border border-emerald-200/50 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <span>🏠 {lang === 'bn' ? 'পাবলিক ওয়েবসাইট' : 'Public Website'}</span>
            </button>
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-[#009245]" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#009245] flex items-center justify-center mx-auto mb-3">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {lang === 'bn' ? 'রিসেলার ও স্টাফ লগইন' : 'Reseller & Staff Login'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'আপনার আইডি এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন' : 'Enter your credentials to access portal'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'ইউজার আইডি / মোবাইল নাম্বার' : 'User ID / Mobile Number'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: RES-1234 বা 017xxxxxxxx' : 'e.g. RES-1234 or 017xxxxxxxx'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#009245] text-sm text-slate-950 transition-colors bg-[#FAFAFA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#009245] text-sm text-slate-950 transition-colors bg-[#FAFAFA]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#009245] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>{lang === 'bn' ? 'অনুমোদন যাচাই করা হচ্ছে...' : 'Authenticating...'}</span>
                ) : (
                  <span>{lang === 'bn' ? 'লগইন করুন' : 'Log In'}</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400">
            &copy; 2026 TAWZOON NEXUS. All Rights Reserved.
          </p>
        </footer>
      </div>
    );
  }

  // Dashboard Tab definition
  const menuItems = [
    { id: 'dashboard', labelBn: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', labelBn: 'ক্যাটালগ প্রোডাক্ট', labelEn: 'Product Catalog', icon: BookOpen },
    { id: 'orders', labelBn: 'অর্ডার তালিকা', labelEn: 'Order List', icon: ShoppingBag },
    { id: 'cart', labelBn: 'কার্ট (অর্ডার করুন)', labelEn: 'Cart / Checkout', icon: PlusCircle },
    { id: 'earnings', labelBn: 'উপার্জন ও বোনাস', labelEn: 'My Earnings', icon: CircleDollarSign },
    { id: 'withdrawal', labelBn: 'টাকা উত্তোলন', labelEn: 'Withdraw Fund', icon: ArrowDownToLine },
    { id: 'training', labelBn: 'প্রশিক্ষণ ও গাইড', labelEn: 'Training Videos', icon: GraduationCap },
    { id: 'video-generator', labelBn: 'ভিডিও জেনারেটর', labelEn: 'Video Generator', icon: Video },
    { id: 'notifications', labelBn: 'বিজ্ঞপ্তি', labelEn: 'Notifications', icon: Bell },
    { id: 'support', labelBn: 'হেল্প ও সাপোর্ট', labelEn: 'Help & Support', icon: HelpCircle },
    { id: 'login-history', labelBn: 'লগইন হিস্ট্রি', labelEn: 'Login History', icon: Shield },
    { id: 'profile', labelBn: 'প্রোফাইল', labelEn: 'My Profile', icon: User }
  ];

  // Render main tab component
  const renderTabContent = () => {
    switch (resellerTab) {
      case 'dashboard':
        return (
          <ResellerDashboardTab
            salesList={salesList}
            transactionsList={transactionsList}
            onOpenRecordSale={() => setResellerTab('cart')}
            onOpenWithdraw={() => setResellerTab('withdrawal')}
            onSwitchTab={(tab) => setResellerTab(tab)}
          />
        );
      case 'catalog':
        return (
          <ResellerCatalogTab
            productsList={productsList}
            onTakeForSelling={(product) => {
              setResellerTab('video-generator');
            }}
          />
        );
      case 'orders':
        return (
          <ResellerOrdersTab
            salesList={salesList}
            productsList={productsList}
            onOpenRecordSale={() => setResellerTab('cart')}
            onRefresh={fetchAllData}
          />
        );
      case 'cart':
        return <ResellerCartTab onOrderSuccess={fetchAllData} />;
      case 'earnings':
        return <ResellerEarningsTab transactionsList={transactionsList} salesList={salesList} />;
      case 'withdrawal':
        return <ResellerWithdrawalTab withdrawalsList={withdrawalsList} onRefresh={fetchAllData} />;
      case 'notifications':
        return <ResellerNotificationsTab />;
      case 'support':
        return <ResellerSupportTab />;
      case 'login-history':
        return <ResellerLoginHistoryTab />;
      case 'profile':
        return (
          <ResellerProfileTab
            onOpenWithdrawal={() => setResellerTab('withdrawal')}
            onRefresh={fetchAllData}
          />
        );
      case 'training':
        return <ResellerTrainingTab />;
      case 'video-generator':
        return (
          <ResellerVideoGeneratorTab
            productsList={productsList}
            onOpenCatalog={() => setResellerTab('catalog')}
          />
        );
      case 'create-website':
        return <ResellerWebsiteGeneratorTab />;
      case 'referral':
        return <ResellerReferralTab />;
      default:
        return (
          <ResellerDashboardTab
            salesList={salesList}
            transactionsList={transactionsList}
            onOpenRecordSale={() => setResellerTab('cart')}
            onOpenWithdraw={() => setResellerTab('withdrawal')}
            onSwitchTab={(tab) => setResellerTab(tab)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 z-30">
        <button
          onClick={() => {
            setActivePortal('public');
            setPublicCategory('all');
          }}
          className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
        >
          {brandSettings?.logoUrl ? (
            <img 
              src={brandSettings.logoUrl} 
              alt="App Logo" 
              className="w-7 h-7 rounded-xl object-cover shadow-3xs shrink-0" 
            />
          ) : (
            <div className="w-7 h-7 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-[10px] shadow-3xs shrink-0">
              T
            </div>
          )}
          <span className="text-base font-black tracking-tight text-slate-900 truncate max-w-[150px]">
            {brandSettings?.appName || 'TAWZOON NEXUS'}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActivePortal('public');
              setPublicCategory('all');
            }}
            className="px-2.5 py-1 rounded-xl bg-emerald-50 text-[#009245] border border-emerald-150 text-[11px] font-black cursor-pointer shadow-3xs"
          >
            🏠 {lang === 'bn' ? 'হোম' : 'Home'}
          </button>
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="p-1.5 rounded-lg border border-slate-100 text-[#009245] bg-[#FAFAFA]"
          >
            <Languages className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-800 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 p-6 space-y-8 min-h-screen">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {brandSettings?.logoUrl ? (
              <img 
                src={brandSettings.logoUrl} 
                alt="App Logo" 
                className="w-9 h-9 rounded-xl object-cover shadow-xs shrink-0" 
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-sm shadow-2xs shrink-0">
                T
              </div>
            )}
            <span className="text-lg font-black tracking-tight text-slate-900 truncate block">
              {brandSettings?.appName || 'TAWZOON NEXUS'}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            {lang === 'bn' ? 'রিসেলার পোর্টাল' : 'RESELLER PORTAL'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = resellerTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setResellerTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#009245] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-slate-100 flex items-center justify-center text-slate-700 font-bold overflow-hidden shadow-sm">
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 truncate">{employee.name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold truncate">{(employee as any).employeeCode || employee.phone}</p>
            </div>
          </div>

          <button
            onClick={employeeLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="fixed top-0 bottom-0 left-0 w-80 bg-white p-6 flex flex-col justify-between shadow-xl z-50 animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6 flex-1 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-black tracking-tight text-slate-900 block">
                    TAWZOON
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    {lang === 'bn' ? 'রিসেলার পোর্টাল' : 'RESELLER PORTAL'}
                  </span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 border border-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-700" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = resellerTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setResellerTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#009245] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile Info in Drawer */}
            <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-bold overflow-hidden shadow-sm">
                  {employee.avatarUrl ? (
                    <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{employee.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{(employee as any).employeeCode || employee.phone}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  employeeLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'bn' ? 'লগআউট' : 'Log Out'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 min-h-screen flex flex-col overflow-x-hidden">
        {/* Upper Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">
              {lang === 'bn' ? 'স্বাগতম,' : 'Welcome back,'}
            </span>
            <span className="text-sm font-black text-slate-950">
              {employee.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setActivePortal('public');
                setPublicCategory('all');
              }}
              className="px-4 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-250/60 text-[#009245] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <span>🏠 {lang === 'bn' ? 'পাবলিক ওয়েবসাইট' : 'Public Website'}</span>
            </button>
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-[#009245]" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace panel */}
        <div className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto w-full max-w-[1920px] mx-auto">
          {loadingData ? (
            <div className="min-h-[50vh] flex items-center justify-center flex-col gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#009245] animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'ডাটা লোড হচ্ছে...' : 'Loading portal assets...'}
              </p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </main>

      {/* Mobile-only Bottom Navigation Bar */}
      <div className="lg:hidden">
        <UserBottomNav />
      </div>
    </div>
  );
};
