/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Truck, Sparkles, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

interface ResellerShopHeroBannerProps {
  reseller: {
    shopName?: string;
    businessName?: string;
    themeColor?: string;
    phone?: string;
    whatsappNumber?: string;
  };
  lang: 'bn' | 'en';
}

const resolveThemeHex = (color?: string): string => {
  if (!color) return '#009245';
  if (color.startsWith('#')) return color;
  const map: Record<string, string> = {
    emerald: '#009245',
    blue: '#2563eb',
    indigo: '#4f46e5',
    orange: '#ea580c',
    rose: '#e11d48',
    dark: '#0f172a',
  };
  return map[color] || '#009245';
};

export const ResellerShopHeroBanner: React.FC<ResellerShopHeroBannerProps> = ({ reseller, lang }) => {
  const shopTitle = reseller?.shopName || reseller?.businessName || (lang === 'bn' ? 'এক্সক্লুসিভ অনলাইন শপ' : 'Exclusive Online Shop');
  const themeHex = resolveThemeHex(reseller?.themeColor);

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-3" id="products-grid">
      <div 
        className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative border border-slate-200/80 p-6 sm:p-10 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, ${themeHex}dd 0%, ${themeHex}ee 50%, #0f172a 100%)`
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 rounded-full bg-black/15 blur-2xl pointer-events-none" />

        {/* Left Side: Shop Branding & Call to Action */}
        <div className="relative z-10 space-y-3 sm:space-y-4 max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-black shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{lang === 'bn' ? 'ভেরিফাইড অনলাইন শপ' : 'Verified Online Shop'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            {shopTitle}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-emerald-50 font-medium leading-relaxed max-w-xl">
            {lang === 'bn'
              ? 'ঘরে বসেই অর্ডার করুন আপনার পছন্দের পণ্য। সারা বাংলাদেশে ফাস্ট হোম ডেলিভারি এবং ক্যাশ অন ডেলিভারি সুবিধা।'
              : 'Order your favorite products from home. Fast home delivery and cash on delivery across Bangladesh.'}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <a
              href="#products-section"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('products-grid');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-emerald-50 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" style={{ color: themeHex }} />
              <span>{lang === 'bn' ? 'সব পণ্য দেখুন' : 'Browse Products'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/15 text-xs font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lang === 'bn' ? '১০০% অরিজিনাল ও মানসম্মত' : '100% Quality Guaranteed'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional E-Commerce Feature Badge Card */}
        <div className="relative z-10 w-full md:w-auto shrink-0 flex flex-col gap-2.5 sm:gap-3 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 shadow-xl max-w-xs text-xs font-bold text-white">
          <div className="flex items-center gap-3 pb-2.5 border-b border-white/15">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-md shrink-0">
              <Truck className="w-5 h-5" style={{ color: themeHex }} />
            </div>
            <div>
              <h4 className="text-sm font-black">{lang === 'bn' ? 'সারা দেশে হোম ডেলিভারি' : 'Nationwide Delivery'}</h4>
              <p className="text-[10px] text-emerald-100 font-normal">{lang === 'bn' ? 'দ্রুত ও নিরাপদ পরিবহন' : 'Fast & Secure Transit'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)' : 'Cash on Delivery Available'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{lang === 'bn' ? 'সহজ রিটার্ন ও এক্সচেঞ্জ পলিসি' : 'Easy Return Policy'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
