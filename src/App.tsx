/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Navbar } from './components/Navbar.js';
import { PublicStorefront } from './components/PublicStorefront.js';
import { EmployeePortal } from './components/EmployeePortal.js';
import { AdminPortal } from './components/AdminPortal.js';
import { ProductDetailsModal } from './components/ProductDetailsModal.js';
import { VisualSearchModal } from './components/common/VisualSearchModal.js';
import { ToastContainer } from './components/ToastContainer.js';
import { UserBottomNav } from './components/UserBottomNav.js';
import { PublicCartDrawer } from './components/common/PublicCartDrawer.js';
import { AIChatWidget } from './components/common/AIChatWidget.js';
import { PublicOrderCheckoutModal } from './components/public/PublicOrderCheckoutModal.js';
import { PublicAddingToOrderBanner } from './components/public/PublicAddingToOrderBanner.js';
import { ResellerStorefrontView } from './components/public/ResellerStorefrontView.js';
import { PWAAutoInstallBanner } from './components/common/PWAAutoInstallBanner.js';
import { SplashScreen } from './components/common/SplashScreen.js';
import { AppUpdateModal } from './components/common/AppUpdateModal.js';

const MainView: React.FC = () => {
  const { activePortal, showPromo, resellerPreviewProduct } = useApp();

  // Detect if visiting /shop/:slug or ?store=slug
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const storeFromParam = searchParams?.get('store');
  const storeFromPath = path.startsWith('/shop/') ? path.replace('/shop/', '').split('/')[0] : null;
  const activeStoreSlug = storeFromParam || storeFromPath;

  if (activeStoreSlug) {
    return <ResellerStorefrontView storeSlug={activeStoreSlug} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* Top Bar Navigation */}
      <Navbar />

      {/* Floating Add to Order Banner for Public Storefront */}
      {activePortal === 'public' && <PublicAddingToOrderBanner />}

      {/* Dynamic Views */}
      <main className={`flex-1 ${showPromo ? 'pt-[85px] sm:pt-[92px]' : 'pt-[60px] sm:pt-[68px] lg:pt-[72px]'} ${activePortal !== 'admin' && !resellerPreviewProduct ? 'pb-20 sm:pb-22 md:pb-8' : 'pb-2'}`}>
        {activePortal === 'public' && <PublicStorefront />}
        {activePortal === 'employee' && <EmployeePortal />}
        {activePortal === 'admin' && <AdminPortal />}
      </main>

      {/* Permanent Bottom Navigation for Normal Users (Excludes Admin) */}
      <UserBottomNav />

      {/* Global Product Details Modal */}
      <ProductDetailsModal />

      {/* Global AI Visual Image Search Modal */}
      <VisualSearchModal />

      {/* Global Public Cart Slide-Over Drawer */}
      <PublicCartDrawer />

      {/* Global Public Order Checkout Modal */}
      <PublicOrderCheckoutModal />

      {/* Global Floating AI Chat Widget (Excludes Admin Portal) */}
      {activePortal !== 'admin' && <AIChatWidget />}

      {/* Global PWA Auto Install Prompt (Mobile & Desktop) */}
      <PWAAutoInstallBanner />

      {/* Global Remote App Update Modal (Notifies Resellers and App Users of New Releases) */}
      <AppUpdateModal />

      {/* Global Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <SplashScreen />
      <MainView />
    </AppProvider>
  );
}
