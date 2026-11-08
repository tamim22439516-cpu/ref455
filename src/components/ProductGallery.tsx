import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Play } from 'lucide-react';
import { Product, ProductImage } from '../types/index.js';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtube.js';

interface ProductGalleryProps {
  product: Product;
  lang: 'bn' | 'en';
  onImageChange?: (url: string, index: number) => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product, lang, onImageChange }) => {
  // Extract images
  const rawImages: ProductImage[] = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'default-1', url: '/images/product_shop_dress_1790244714775.jpg', isPrimary: true, order: 1 }];

  // Video data
  const hasYouTube = Boolean(product.youtubeId || (product.videoType === 'youtube' && product.videoUrl));
  const hasUploadedVideo = Boolean(product.videoType === 'upload' && product.videoUrl);
  const hasVideo = hasYouTube || hasUploadedVideo;

  // Active view: either an image index or 'video'
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isVideoActive, setIsVideoActive] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  // Swipe support refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const currentImage = rawImages[activeIndex] || rawImages[0];
  const totalSlides = rawImages.length + (hasVideo ? 1 : 0);

  useEffect(() => {
    if (rawImages[activeIndex]?.url && onImageChange) {
      onImageChange(rawImages[activeIndex].url, activeIndex);
    }
  }, [activeIndex, product, onImageChange]);

  // YouTube auto-thumbnail or fallback
  const ytThumb = product.youtubeId ? getYouTubeThumbnail(product.youtubeId) : null;
  const videoThumb = ytThumb || currentImage?.url || '/images/hero_tawzoon_nexus_1790244695106.jpg';

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isVideoActive) {
      setIsVideoActive(false);
      setActiveIndex(rawImages.length - 1);
    } else if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else if (hasVideo) {
      setIsVideoActive(true);
    } else {
      setActiveIndex(rawImages.length - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isVideoActive) {
      setIsVideoActive(false);
      setActiveIndex(0);
    } else if (activeIndex < rawImages.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else if (hasVideo) {
      setIsVideoActive(true);
    } else {
      setActiveIndex(0);
    }
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go Next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const youtubeEmbedUrl = product.youtubeId ? getYouTubeEmbedUrl(product.youtubeId, true) : null;

  return (
    <div className="space-y-3 select-none">
      {/* Main Showcase Box */}
      <div
        className="relative aspect-4/3 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isVideoActive ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            {hasYouTube && youtubeEmbedUrl ? (
              <iframe
                src={youtubeEmbedUrl}
                title={product.nameEn}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : hasUploadedVideo && product.videoUrl ? (
              <video
                src={product.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={currentImage?.url}
              />
            ) : (
              <div className="text-white text-xs">Video unavailable</div>
            )}
          </div>
        ) : (
          <div
            className="w-full h-full relative cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
            title={lang === 'bn' ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to zoom'}
          >
            <img
              src={currentImage.url}
              alt={lang === 'bn' ? product.nameBn : product.nameEn}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Zoom Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(true);
              }}
              className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm backdrop-blur-xs transition-opacity opacity-80 hover:opacity-100"
              title={lang === 'bn' ? 'জুম করুন' : 'Zoom'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Counter Badge */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md pointer-events-none backdrop-blur-xs">
          {isVideoActive ? 'VIDEO' : `${activeIndex + 1} / ${rawImages.length}`}
        </div>

        {/* Navigation Arrows (if more than 1 slide) */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all opacity-80 hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {totalSlides > 1 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {rawImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => {
                setIsVideoActive(false);
                setActiveIndex(idx);
              }}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                !isVideoActive && activeIndex === idx
                  ? 'border-slate-900 ring-2 ring-slate-900/20'
                  : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}

          {/* Video Thumbnail Button */}
          {hasVideo && (
            <button
              onClick={() => setIsVideoActive(true)}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all bg-slate-900 flex items-center justify-center ${
                isVideoActive
                  ? 'border-slate-900 ring-2 ring-slate-900/30'
                  : 'border-slate-200 hover:border-slate-400 opacity-90'
              }`}
              title={lang === 'bn' ? 'ভিডিও দেখুন' : 'Watch Video'}
            >
              <img src={videoThumb} alt="" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xs">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-0.5 text-[8px] font-bold text-white uppercase tracking-wider font-mono">
                VIDEO
              </span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {isZoomed && !isVideoActive && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={currentImage.url}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {rawImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
