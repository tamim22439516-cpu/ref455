import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

interface ResellerTrainingBannerProps {
  onLearnClick: () => void;
}

export const ResellerTrainingBanner: React.FC<ResellerTrainingBannerProps> = ({ onLearnClick }) => {
  const { lang } = useApp();

  return (
    <div className="w-full pt-1 pb-1">
      {/* Outer Banner Container Frame with Highlighted Emerald Border & Professional Hover Glow matching Home Banner */}
      <div 
        onClick={onLearnClick}
        className="group relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#009245]/80 hover:border-[#009245] shadow-md hover:shadow-[0_10px_35px_rgba(0,146,69,0.35)] transition-all duration-300 ease-out select-none bg-transparent cursor-pointer active:scale-[0.995]"
        title={lang === 'bn' ? 'রিসেলার ভিডিও গাইড দেখতে ক্লিক করুন' : 'Click to watch Reseller Video Guide'}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLearnClick();
          }
        }}
      >
        <div className="relative z-10 w-full overflow-hidden flex items-center justify-center bg-transparent">
          <picture className="w-full block overflow-hidden aspect-[1670/941] sm:aspect-[2172/724] leading-none">
            <source media="(min-width: 640px)" srcSet="/assets/aistudio/image_14863ac2.png" />
            <img 
              src="/assets/aistudio/image_9a39c13e.png" 
              alt={lang === 'bn' ? 'রিসেলার হিসেবে কিভাবে শুরু করবেন? - স্টেপ বাই স্টেপ ভিডিও গাইড' : 'How to get started as a reseller? - Step by step video guide'}
              className="w-full h-full object-cover block select-none pointer-events-none group-hover:scale-[1.015] transition-transform duration-500 ease-out"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>

          {/* Centered Professional Video Guide CTA Button - Compact 'ভিডিও দেখুন' on mobile, full 'ভিডিও গাইড দেখুন' on desktop */}
          <div className="absolute top-[57.4%] -translate-y-1/2 sm:top-[53%] sm:translate-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLearnClick();
              }}
              aria-label={lang === 'bn' ? 'ভিডিও দেখুন' : 'Watch Video'}
              className="group/btn relative inline-flex items-center gap-1.5 sm:gap-2.5 md:gap-3 px-3.5 sm:px-6 md:px-8 lg:px-9 py-1 sm:py-2 md:py-2.5 lg:py-3 rounded-full text-white font-black tracking-tight shadow-[0_3px_12px_rgba(0,146,69,0.45)] sm:shadow-[0_4px_16px_rgba(0,146,69,0.45)] hover:shadow-[0_8px_25px_rgba(0,146,69,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border-2 border-white/95 overflow-hidden bg-gradient-to-r from-[#006837] via-[#009245] to-[#00b050]"
            >
              {/* White Circular Play Icon */}
              <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-white text-[#009245] flex items-center justify-center shadow-xs shrink-0">
                <Play className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 fill-current ml-0.5" />
              </div>

              {/* Button Text: 'ভিডিও দেখুন' on Mobile (<sm), 'ভিডিও গাইড দেখুন' on Desktop (>=sm) */}
              <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-black drop-shadow-xs select-none whitespace-nowrap">
                {lang === 'bn' ? (
                  <>
                    <span className="sm:hidden">ভিডিও দেখুন</span>
                    <span className="hidden sm:inline">ভিডিও গাইড দেখুন</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Watch Video</span>
                    <span className="hidden sm:inline">Watch Video Guide</span>
                  </>
                )}
              </span>

              {/* Right Arrow */}
              <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 stroke-[3] group-hover/btn:translate-x-1 transition-transform duration-300 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
