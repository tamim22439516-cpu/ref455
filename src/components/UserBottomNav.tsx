import React from 'react';
import { Home, LayoutDashboard, ShoppingCart, Package, User, Heart, ShoppingBag, LayoutGrid, Boxes } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

export const UserBottomNav: React.FC = () => {
  const {
    lang,
    activePortal,
    setActivePortal,
    publicCategory,
    setPublicCategory,
    publicSearch,
    setPublicSearch,
    selectedPublicSubcategory,
    setSelectedPublicSubcategory,
    refreshBootstrap,
    showToast,
    setSelectedProduct,
    resellerTab,
    setResellerTab,
    resellerCatalogView,
    setResellerCatalogView,
    isEmployeeAuthenticated,
    cartItems,
    isPublicCartOpen,
    setIsPublicCartOpen,
    wishlistItems,
    resellerPreviewProduct,
  } = useApp();

  // Hide bottom nav if user is inside the admin portal or viewing reseller product details
  if (activePortal === 'admin' || resellerPreviewProduct !== null) {
    return null;
  }

  const isReseller = activePortal === 'employee';

  const handleNavClick = (type: 'home' | 'dashboard' | 'orders' | 'cart' | 'profile') => {
    // Close global product details modal when navigating
    if (setSelectedProduct) setSelectedProduct(null);

    if (type === 'home') {
      if (setPublicSearch) setPublicSearch('');
      if (setSelectedPublicSubcategory) setSelectedPublicSubcategory(null);
      if (setIsPublicCartOpen) setIsPublicCartOpen(false);
      if (refreshBootstrap) {
        refreshBootstrap().catch(() => {});
      }

      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('catalog');
        if (setResellerCatalogView) setResellerCatalogView('public-home');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee');
          } catch {}
        }
        window.dispatchEvent(new CustomEvent('tawzoon_nav_home'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        setPublicCategory('all');
        window.dispatchEvent(new CustomEvent('tawzoon_nav_home'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'dashboard') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('dashboard');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/dashboard');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        setPublicCategory('shop_tab');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'orders') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('orders');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/orders');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActivePortal('public');
        setPublicCategory('wishlist');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (type === 'cart') {
      if (isEmployeeAuthenticated) {
        setActivePortal('employee');
        setResellerTab('cart');
        if (typeof window !== 'undefined') {
          try {
            history.replaceState(null, '', '#employee/cart');
          } catch {}
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setIsPublicCartOpen(true);
      }
    } else if (type === 'profile') {
      setActivePortal('employee');
      setResellerTab('profile');
      if (typeof window !== 'undefined') {
        try {
          history.replaceState(null, '', '#employee/profile');
        } catch {}
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isCartActive = isReseller ? resellerTab === 'cart' : Boolean(isPublicCartOpen);
  const isOrdersActive = !isCartActive && (isReseller ? resellerTab === 'orders' : (activePortal === 'public' && publicCategory === 'wishlist'));
  const isDashboardActive = !isCartActive && !isOrdersActive && (isReseller ? resellerTab === 'dashboard' : (activePortal === 'public' && publicCategory === 'shop_tab'));
  const isProfileActive = !isCartActive && !isOrdersActive && !isDashboardActive && (isReseller && (resellerTab === 'profile' || resellerTab === 'withdrawal' || resellerTab === 'earnings'));
  const isHomeActive = !isCartActive && !isOrdersActive && !isDashboardActive && !isProfileActive && (isReseller ? (resellerTab === 'catalog' && resellerCatalogView === 'public-home') : (activePortal === 'public' && publicCategory !== 'wishlist' && publicCategory !== 'shop_tab'));

  return (
    <nav
      aria-label="Mobile Bottom App Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[600] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 relative">
        
        {/* Item 1: Home (হোম) -> Catalog / Feed */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            isHomeActive
              ? 'text-[#009245] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Home className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px] leading-tight">
            {lang === 'bn' ? 'হোম' : 'Home'}
          </span>
        </button>

        {/* Item 2: Dashboard (ড্যাশবোর্ড) / All Products (সব পণ্য) */}
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            isDashboardActive
              ? 'text-[#009245] font-black scale-105'
              : 'text-slate-400 hover:text-[#009245] font-medium'
          }`}
        >
          {isReseller ? (
            <>
              <LayoutDashboard className="w-4.5 h-4.5 mb-0.5" />
              <span className="text-[10px] leading-tight">
                {lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
              </span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4.5 h-4.5 mb-0.5" />
              <span className="text-[10px] leading-tight">
                {lang === 'bn' ? 'সকল পণ্য' : 'All Products'}
              </span>
            </>
          )}
        </button>

        {/* Item 3: Center Floating Cart (কার্ট) */}
        <div className="flex-1 flex flex-col items-center justify-center relative -top-2.5">
          <button
            type="button"
            onClick={() => handleNavClick('cart')}
            className={`w-11 h-11 rounded-full text-white shadow-md flex items-center justify-center border-2 border-white dark:border-slate-900 transition-all active:scale-95 cursor-pointer relative ${
              isCartActive ? 'bg-[#007a3a] scale-105 ring-2 ring-[#009245]/60' : 'bg-[#009245] hover:bg-[#007a3a]'
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
              {cartItems.length}
            </span>
          </button>
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">
            {lang === 'bn' ? 'কার্ট' : 'Cart'}
          </span>
        </div>

        {/* Item 4: Orders (অর্ডার) / Wishlist (আমার পছন্দ) */}
        <button
          type="button"
          onClick={() => handleNavClick('orders')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer relative ${
            isOrdersActive
              ? 'text-[#009245] font-black scale-105'
              : 'text-slate-400 hover:text-[#009245] font-medium'
          }`}
        >
          {isReseller ? (
            <>
              <Package className="w-4.5 h-4.5 mb-0.5" />
              <span className="text-[10px] leading-tight">
                {lang === 'bn' ? 'অর্ডার' : 'Orders'}
              </span>
            </>
          ) : (
            <>
              <Heart className={`w-4.5 h-4.5 mb-0.5 ${isOrdersActive ? 'fill-[#009245]' : ''}`} />
              <span className="text-[10px] leading-tight">
                {lang === 'bn' ? 'আমার পছন্দ' : 'My Favorites'}
              </span>
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-2 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistItems.length}
                </span>
              )}
            </>
          )}
        </button>

        {/* Item 5: Profile (প্রোফাইল) */}
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
            isProfileActive
              ? 'text-[#009245] font-black scale-105'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <User className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px] leading-tight">
            {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
          </span>
        </button>

      </div>
    </nav>
  );
};
