import React, { useState, useMemo } from 'react';
import { Video, Megaphone, Sparkles, Film, Layers, ArrowRight } from 'lucide-react';
import { useApp } from '../../../context/AppContext.js';
import { Product } from '../../../types/index.js';
import { ResellerVideoGeneratorTab, CampaignToVideoData } from '../ResellerVideoGeneratorTab.js';
import { ResellerNewCampaignDesignerTab } from './ResellerNewCampaignDesignerTab.js';
import { isCategoryMatch } from '../../ShopCategoryPage.js';

interface ResellerCampaignsHubProps {
  productsList: Product[];
  onTakeForSelling?: (product: Product) => void;
  initialTab?: 'video' | 'campaigns';
}

export const ResellerCampaignsHub: React.FC<ResellerCampaignsHubProps> = ({
  productsList,
  onTakeForSelling,
  initialTab,
}) => {
  const { lang, setResellerTab } = useApp();
  // Set default state to null so the user gets 2 beautiful selection cards first!
  const [activeSubTab, setActiveSubTab] = useState<'video' | 'campaigns' | null>(initialTab || null);
  const [sharedCampaignData, setSharedCampaignData] = useState<CampaignToVideoData | null>(null);

  // Independent Catalog States
  const [viewingCatalogFor, setViewingCatalogFor] = useState<'video' | 'campaigns' | null>(null);
  const [selectedProductForVideo, setSelectedProductForVideo] = useState<Product | null>(null);
  const [selectedProductForCampaigns, setSelectedProductForCampaigns] = useState<Product | null>(null);

  const [activeCatalogCategory, setActiveCatalogCategory] = useState<'all' | 'shop' | 'gadgets' | 'others'>('all');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');

  const handleNavigateToVideo = (data: CampaignToVideoData) => {
    setSharedCampaignData(data);
    setActiveSubTab('video');
  };

  // Filter Catalog Products specifically for the Independent Catalog Page
  const filteredProducts = useMemo(() => {
    return (productsList || []).filter((prod) => {
      if (prod.isActive === false || prod.isArchived) return false;
      
      // Category filter: 'shop' (Shop Related), 'gadgets' (Gadgets), 'others' (Other Products)
      if (activeCatalogCategory !== 'all') {
        if (!isCategoryMatch(prod.categorySlug, activeCatalogCategory)) {
          return false;
        }
      }
      
      // Search text query
      if (catalogSearchQuery.trim()) {
        const query = catalogSearchQuery.toLowerCase();
        const matchBn = (prod.nameBn || '').toLowerCase().includes(query);
        const matchEn = (prod.nameEn || '').toLowerCase().includes(query);
        const matchCode = (prod.productCode || '').toLowerCase().includes(query);
        return matchBn || matchEn || matchCode;
      }
      return true;
    });
  }, [productsList, activeCatalogCategory, catalogSearchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-[1920px] mx-auto pb-10">
      
      {/* 3. INDEPENDENT FULL-SECTION PRODUCT CATALOG PAGE */}
      {viewingCatalogFor !== null ? (
        <div className="bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5 animate-in fade-in duration-300">
          {/* Extremely Compact Control Bar (Fits everything on one row to maximize vertical space!) */}
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 relative">
            {/* 1. Quick Back/Close Button */}
            <button
              type="button"
              onClick={() => setViewingCatalogFor(null)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs shrink-0 flex items-center gap-1"
              title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <span>✕</span>
              <span className="hidden sm:inline">{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
            </button>

            {/* 2. Category Filter Menu Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="px-2.5 py-2 sm:px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs whitespace-nowrap"
              >
                <span>☰</span>
                <span className="max-w-[70px] sm:max-w-none truncate block">
                  {activeCatalogCategory === 'all' && (lang === 'bn' ? 'সব পণ্য' : 'All Products')}
                  {activeCatalogCategory === 'shop' && 'Shop Related'}
                  {activeCatalogCategory === 'gadgets' && 'Gadgets'}
                  {activeCatalogCategory === 'others' && 'Other Products'}
                </span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              {/* Absolute Dropdown Popover */}
              {isCategoryMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsCategoryMenuOpen(false)} />
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCatalogCategory('all');
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                        activeCatalogCategory === 'all' ? 'text-[#009245] bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang === 'bn' ? '📂 সব পণ্য' : '📂 All Products'}</span>
                      {activeCatalogCategory === 'all' && <span className="font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCatalogCategory('shop');
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                        activeCatalogCategory === 'shop' ? 'text-[#009245] bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang === 'bn' ? '🛍️ Shop Related' : '🛍️ Shop Related'}</span>
                      {activeCatalogCategory === 'shop' && <span className="font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCatalogCategory('gadgets');
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                        activeCatalogCategory === 'gadgets' ? 'text-[#009245] bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang === 'bn' ? '🔌 Gadgets' : '🔌 Gadgets'}</span>
                      {activeCatalogCategory === 'gadgets' && <span className="font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCatalogCategory('others');
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-between ${
                        activeCatalogCategory === 'others' ? 'text-[#009245] bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang === 'bn' ? '📦 Other Products' : '📦 Other Products'}</span>
                      {activeCatalogCategory === 'others' && <span className="font-bold">✓</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 3. Quick Name/Code Search Box */}
            <div className="flex-1 relative min-w-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'নাম বা কোড...' : 'Search...'}
                className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#009245] font-medium"
              />
            </div>

            {/* 4. Compact count indicator badge */}
            <span className="text-[10px] font-black bg-emerald-100 text-[#009245] px-2 py-1 rounded-lg shrink-0">
              {filteredProducts.length}টি
            </span>
          </div>

          {/* Product Grid: Exactly 3 Columns on Mobile (grid-cols-3) with small compact cards */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[65vh] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {filteredProducts.map((prod) => {
              const prodImg = prod.imageUrl || (prod.images && prod.images[0]?.url) || '';
              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    if (viewingCatalogFor === 'video') {
                      setSelectedProductForVideo(prod);
                      setActiveSubTab('video');
                    } else {
                      setSelectedProductForCampaigns(prod);
                      setActiveSubTab('campaigns');
                    }
                    setViewingCatalogFor(null);
                  }}
                  className="p-1.5 bg-white border border-slate-200 hover:border-[#009245]/60 hover:shadow-xs rounded-xl transition cursor-pointer flex flex-col justify-between space-y-1.5"
                >
                  <div className="space-y-1">
                    {/* Square containment aspect ratio frame */}
                    <div className="aspect-square rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden p-0.5 border border-slate-100">
                      {prodImg ? (
                        <img
                          src={prodImg}
                          alt=""
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                          <span className="text-[10px] text-slate-400 font-bold">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Name: Small and neat */}
                    <h4 className="text-[9px] sm:text-xs font-bold text-slate-800 line-clamp-2 leading-tight min-h-[24px]">
                      {lang === 'bn' ? prod.nameBn : prod.nameEn}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    {/* Retail Price */}
                    <p className="text-[9px] sm:text-xs font-black text-rose-600 font-mono leading-none">
                      ৳{prod.sellingPrice.toLocaleString()}
                    </p>

                    {/* Compact Select Button */}
                    <button
                      type="button"
                      className="w-full py-1 bg-[#009245] hover:bg-[#007a37] text-white text-[8.5px] sm:text-[10px] font-black rounded-lg text-center transition cursor-pointer whitespace-nowrap leading-none"
                    >
                      {lang === 'bn' ? 'সিলেক্ট' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center space-y-1">
                <p className="text-xl">🔍</p>
                <p className="text-xs font-bold text-slate-500">
                  {lang === 'bn' ? 'এই ক্যাটাগরিতে পণ্য পাওয়া যায়নি!' : 'No products found in this category!'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : activeSubTab === null ? (
        /* 1. INITIAL LANDING VIEW WITH 2 HIGH-GRADE SELECTION CARDS */
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-sm max-w-3xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-xl font-black text-slate-900">
              {lang === 'bn' ? '🚀 কমার্শিয়াল মার্কেটিং স্টুডিও' : '🚀 Commercial Marketing Studio'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
              {lang === 'bn'
                ? 'আপনার প্রোডাক্ট প্রমোশন ও বিক্রি বাড়াতে নিচের যেকোনো একটি স্টুডিও অপশন নির্বাচন করুন:'
                : 'Select one of the studio options below to start promoting and boosting your product sales:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Option 1: Video Generator Card */}
            <button
              type="button"
              onClick={() => setActiveSubTab('video')}
              className="p-5 sm:p-6 bg-gradient-to-br from-emerald-50/50 to-white hover:from-emerald-50 hover:to-emerald-100/30 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition-all duration-300 group cursor-pointer hover:shadow-md active:scale-[0.99] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#009245] flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <Film className="w-5 h-5 text-[#009245]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#009245] transition-colors">
                    {lang === 'bn' ? '🎬 ভিডিও জেনারেটর' : '🎬 Video Generator'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                    {lang === 'bn'
                      ? '১০৮০p ফুল এইচডি কমার্শিয়াল রিলস ও ফেসবুক প্রোমো ভিডিও তৈরি করুন মাখনের মতো অডিও সহ।'
                      : 'Generate 1080p Full HD commercial reels and Facebook promo videos with synchronized audio.'}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-[#009245] pt-1">
                <span>{lang === 'bn' ? 'ভিডিও তৈরি করুন' : 'Go to Video Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Option 2: Campaigns Designer Card */}
            <button
              type="button"
              onClick={() => setActiveSubTab('campaigns')}
              className="p-5 sm:p-6 bg-gradient-to-br from-purple-50/50 to-white hover:from-purple-50 hover:to-purple-100/30 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition-all duration-300 group cursor-pointer hover:shadow-md active:scale-[0.99] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                    {lang === 'bn' ? '🚀 কমার্শিয়াল ক্যাম্পেইনস' : '🚀 Commercial Campaigns'}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                    {lang === 'bn'
                      ? 'ফেসবুক ও সোশ্যাল মিডিয়ার জন্য চোখ ধাঁধানো ব্যানার, অফার পোস্টার ও কাস্টম ব্রান্ড আর্টওয়ার্ক ডিজাইন করুন।'
                      : 'Design eye-catching banners, offer posters, and custom brand artwork for social media.'}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-purple-600 pt-1">
                <span>{lang === 'bn' ? 'ক্যাম্পেইন ডিজাইন করুন' : 'Go to Design Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. SUB-TAB VIEW WITH HEADER SELECTOR */}
          <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-300 shadow-sm flex items-center justify-between gap-2 animate-in fade-in duration-300">
            {/* Button 1: Menu Selector (Three Dashes) */}
            <button
              type="button"
              onClick={() => setActiveSubTab(null)}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-sm font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0"
              title="মেনু নির্বাচন (Show Menu Selection)"
            >
              <span className="text-base leading-none">☰</span>
              <span className="text-[11px] sm:text-xs font-black">{lang === 'bn' ? 'মেনু' : 'Menu'}</span>
            </button>

            {/* Current Active Section Badge (Styled indicator) */}
            <div className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 text-[10.5px] sm:text-xs font-bold truncate">
              {activeSubTab === 'video' ? '🎬 ভিডিও জেনারেটর' : '🚀 ক্যাম্পেইনস'}
            </div>

            {/* Button 2: Quick Switch to Alternate Tab */}
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'video' ? 'campaigns' : 'video')}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-700 text-[11px] sm:text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0"
            >
              {activeSubTab === 'video' ? (
                <>
                  <span>🚀</span>
                  <span>ক্যাম্পেইনস</span>
                </>
              ) : (
                <>
                  <span>🎬</span>
                  <span>ভিডিও</span>
                </>
              )}
            </button>
          </div>

          {/* Dynamic Tab Content Area */}
          {activeSubTab === 'video' && (
            <ResellerVideoGeneratorTab
              productsList={productsList}
              onTakeForSelling={onTakeForSelling}
              sharedCampaignData={sharedCampaignData}
              selectedProduct={selectedProductForVideo}
              onSelectProduct={setSelectedProductForVideo}
              onOpenCatalog={() => setViewingCatalogFor('video')}
            />
          )}

          {activeSubTab === 'campaigns' && (
            <ResellerNewCampaignDesignerTab
              productsList={productsList}
              onTakeForSelling={onTakeForSelling}
              onNavigateToVideoGenerator={handleNavigateToVideo}
              selectedProduct={selectedProductForCampaigns}
              onSelectProduct={setSelectedProductForCampaigns}
              onOpenCatalog={() => setViewingCatalogFor('campaigns')}
            />
          )}
        </>
      )}
    </div>
  );
};
