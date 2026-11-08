import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  X,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Tag,
  ShoppingBag,
  Percent,
  Layout,
  Video,
  ChevronLeft,
  ChevronRight,
  FolderDown,
  Film,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext.js';
import { Product } from '../../../types/index.js';

import { CampaignToVideoData } from '../ResellerVideoGeneratorTab.js';

interface ResellerNewCampaignDesignerTabProps {
  productsList: Product[];
  onTakeForSelling?: (product: Product) => void;
  onNavigateToVideoGenerator?: (data: CampaignToVideoData) => void;
  selectedProduct?: Product | null;
  onSelectProduct?: (product: Product) => void;
  onOpenCatalog?: () => void;
}

interface GeneratedPoster {
  id: string;
  title: string;
  aspectRatio: '4:5' | '1:1';
  width: number;
  height: number;
  dataUrl: string;
  productImgUrl: string;
}

export const ResellerNewCampaignDesignerTab: React.FC<ResellerNewCampaignDesignerTabProps> = ({
  productsList,
  onTakeForSelling,
  onNavigateToVideoGenerator,
  selectedProduct: propSelectedProduct,
  onSelectProduct,
  onOpenCatalog,
}) => {
  const { lang, showToast } = useApp();

  // 1. Multiple Product Images State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(productsList[0] || null);
  const [productImagesList, setProductImagesList] = useState<string[]>([
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop&q=85',
  ]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [productName, setProductName] = useState<string>("প্রিমিয়াম ক্যাজুয়াল শার্ট");

  // 2. Pricing & Dynamic Offer System
  const [offerPrice, setOfferPrice] = useState<number>(1750);
  const [discountPercent, setDiscountPercent] = useState<number>(30);
  const [originalPrice, setOriginalPrice] = useState<number>(2500);

  const handleSelectCatalogProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductName(lang === 'bn' ? prod.nameBn : prod.nameEn);
    setOfferPrice(prod.sellingPrice || 1750);
    setOriginalPrice(prod.regularPrice || 2500);

    const images: string[] = [];
    if (prod.imageUrl) images.push(prod.imageUrl);
    if (prod.images && prod.images.length > 0) {
      prod.images.forEach((im) => {
        if (im.url && !images.includes(im.url)) images.push(im.url);
      });
    }
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop&q=85');
    }

    setProductImagesList(images);
    setActiveImageIndex(0);

    if (onSelectProduct) {
      onSelectProduct(prod);
    }
  };

  useEffect(() => {
    if (propSelectedProduct) {
      handleSelectCatalogProduct(propSelectedProduct);
    }
  }, [propSelectedProduct]);

  useEffect(() => {
    if (discountPercent > 0 && discountPercent < 100) {
      const calcOrig = Math.round(offerPrice / (1 - discountPercent / 100));
      setOriginalPrice(calcOrig);
    } else {
      setOriginalPrice(offerPrice);
    }
  }, [offerPrice, discountPercent]);

  // 3. Offer & Branding State
  const [offerTitle, setOfferTitle] = useState<string>('ঈদ মোবারক');
  const [shortDescription, setShortDescription] = useState<string>('ঈদের আনন্দে নিজেকে আরও স্টাইলিশ রাখুন');
  const [brandName, setBrandName] = useState<string>('TAWZOON');
  const [brandTagline, setBrandTagline] = useState<string>('EXCLUSIVE FASHION HUB');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [ctaText, setCtaText] = useState<string>('এখনই অর্ডার করুন');

  // 4. Output Posters & Carousel State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPosters, setGeneratedPosters] = useState<GeneratedPoster[]>([]);
  const [activePosterRatio, setActivePosterRatio] = useState<'4:5' | '1:1'>('4:5');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [previewModalPoster, setPreviewModalPoster] = useState<GeneratedPoster | null>(null);
  const [showDownloadOptionModal, setShowDownloadOptionModal] = useState<boolean>(false);
  const [showVideoOptionModal, setShowVideoOptionModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [isCatalogExpanded, setIsCatalogExpanded] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Refs
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.onload = () => resolve(fallback);
        fallback.onerror = (err) => reject(err);
        fallback.src = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&auto=format&fit=crop&q=85';
      };
      img.src = url;
    });
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // ==========================================
  // BATCH CANVAS RENDERER
  // ==========================================
  const generatePosters = useCallback(
    async (isManualTrigger: boolean = false) => {
      if (productImagesList.length === 0) return;
      setIsGenerating(true);
      if (isManualTrigger) {
        showToast(lang === 'bn' ? `পোস্টার জেনারেট হচ্ছে...` : 'Generating posters...');
      }

      try {
        const loadedLogoImg = customLogoUrl ? await loadImage(customLogoUrl).catch(() => null) : null;
        const canvas = hiddenCanvasRef.current || document.createElement('canvas');
        const posters: GeneratedPoster[] = [];

        const ratios: { id: GeneratedPoster['aspectRatio']; w: number; h: number }[] = [
          { id: '4:5', w: 1080, h: 1350 },
          { id: '1:1', w: 1080, h: 1080 },
        ];

        for (let i = 0; i < productImagesList.length; i++) {
          const imgUrl = productImagesList[i];
          const loadedProductImg = await loadImage(imgUrl).catch(() => null);

          for (const r of ratios) {
            canvas.width = r.w;
            canvas.height = r.h;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 1. BACKGROUND
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, r.w, r.h);

            const bgGrad = ctx.createRadialGradient(r.w * 0.7, r.h * 0.5, 100, r.w * 0.7, r.h * 0.5, r.w * 0.8);
            bgGrad.addColorStop(0, '#fffdf9');
            bgGrad.addColorStop(1, '#f5f0e6');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, r.w, r.h);

            // Thin gold border
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.strokeRect(24, 24, r.w - 48, r.h - 48);

            // 2. PRODUCT IMAGE (Right side - Auto aspect ratio container with ZERO white side gaps & thin professional border)
            const maxW = r.w * 0.50;
            const maxH = r.h * 0.58;

            let cardW = maxW;
            let cardH = maxH;

            if (loadedProductImg) {
              const imgRatio = loadedProductImg.width / loadedProductImg.height;
              cardW = maxW;
              cardH = cardW / imgRatio;

              if (cardH > maxH) {
                cardH = maxH;
                cardW = cardH * imgRatio;
              }
            }

            const prodX = r.w - cardW - 55;
            const prodY = 210 + (maxH - cardH) / 2;

            // Sleek Drop Shadow + White Tight Backing Box
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
            ctx.fillStyle = '#ffffff';
            drawRoundedRect(ctx, prodX - 4, prodY - 4, cardW + 8, cardH + 8, 16);
            ctx.fill();
            ctx.restore();

            // Draw Product Image Filling Container Perfectly (Zero white side gaps, zero zoom distortion)
            ctx.save();
            drawRoundedRect(ctx, prodX, prodY, cardW, cardH, 14);
            ctx.clip();
            if (loadedProductImg) {
              ctx.drawImage(loadedProductImg, prodX, prodY, cardW, cardH);
            }
            ctx.restore();

            // Professional Thin Border directly around the Product Frame
            ctx.save();
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, prodX - 4, prodY - 4, cardW + 8, cardH + 8, 16);
            ctx.stroke();
            ctx.restore();

            // 3. TOP BRANDING PILL & DYNAMIC TAG
            const topY = 55;
            ctx.save();
            const pillX = 55;
            const pillY = topY;
            const pillW = 380;
            const pillH = 75;

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 38);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pillX + 38, pillY + 38, 26, 0, Math.PI * 2);
            ctx.fill();

            if (loadedLogoImg) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(pillX + 38, pillY + 38, 24, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(loadedLogoImg, pillX + 14, pillY + 14, 48, 48);
              ctx.restore();
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText((brandName.charAt(0) || 'T').toUpperCase(), pillX + 38, pillY + 38);
            }

            ctx.fillStyle = '#0f172a';
            ctx.font = '800 21px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(brandName, pillX + 82, pillY + 28);

            ctx.fillStyle = '#64748b';
            ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(brandTagline, pillX + 82, pillY + 50);
            ctx.restore();

            // Top Right Tag
            ctx.save();
            const topTagW = 300;
            const topTagH = 65;
            const topTagX = r.w - topTagW - 55;
            const topTagY = topY + 5;

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, topTagX, topTagY, topTagW, topTagH, 32);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#b45309';
            ctx.font = '800 17px "Hind Siliguri", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`✨ ${offerTitle} ✨`, topTagX + topTagW / 2, topTagY + topTagH / 2);
            ctx.restore();

            // 4. MAIN HEADLINE & PRODUCT NAME
            ctx.save();
            const headX = 70;
            let headY = 320;

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 62px "Hind Siliguri", sans-serif';
            ctx.fillText(offerTitle, headX, headY);

            headY += 45;
            ctx.fillStyle = '#475569';
            ctx.font = '700 18px "Hind Siliguri", sans-serif';
            ctx.fillText(productName, headX, headY);
            ctx.restore();

            // 5. DISCOUNT BADGE
            ctx.save();
            const badgeX = 70;
            const badgeY = headY + 28;
            const badgeW = 360;
            const badgeH = 120;

            ctx.save();
            ctx.translate(badgeX + badgeW / 2, badgeY + badgeH / 2);
            ctx.rotate(-0.035);
            ctx.translate(-(badgeX + badgeW / 2), -(badgeY + badgeH / 2));

            const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
            badgeGrad.addColorStop(0, '#e11d48');
            badgeGrad.addColorStop(0.5, '#dc2626');
            badgeGrad.addColorStop(1, '#991b1b');
            ctx.fillStyle = badgeGrad;
            drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 24);
            ctx.fill();
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(badgeX - 16, badgeY + 42, 8, 0, Math.PI * 2);
            ctx.arc(badgeX - 26, badgeY + 76, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(badgeX + badgeW + 16, badgeY + 42, 8, 0, Math.PI * 2);
            ctx.arc(badgeX + badgeW + 26, badgeY + 76, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.font = '800 19px "Hind Siliguri", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('স্পেশাল অফার', badgeX + badgeW / 2, badgeY + 35);

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 50px "Hind Siliguri", sans-serif';
            ctx.fillText(`${discountPercent}% ছাড়`, badgeX + badgeW / 2, badgeY + 95);
            ctx.restore();
            ctx.restore();

            // 6. PRICE BOX
            ctx.save();
            const priceBoxX = 70;
            const priceBoxY = badgeY + badgeH + 18;
            const priceBoxW = 360;
            const priceBoxH = 130;

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, priceBoxX, priceBoxY, priceBoxW, priceBoxH, 20);
            ctx.fill();
            ctx.stroke();

            // Original price row
            ctx.fillStyle = '#475569';
            ctx.font = '700 18px "Hind Siliguri", sans-serif';
            ctx.fillText('আগের মূল্য', priceBoxX + 26, priceBoxY + 40);

            const origPriceStr = `৳ ${originalPrice.toLocaleString()}`;
            ctx.fillStyle = '#ef4444';
            ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(origPriceStr, priceBoxX + priceBoxW - 26, priceBoxY + 42);
            ctx.textAlign = 'left';

            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            const tw = ctx.measureText(origPriceStr).width;
            ctx.moveTo(priceBoxX + priceBoxW - 26 - tw, priceBoxY + 34);
            ctx.lineTo(priceBoxX + priceBoxW - 26, priceBoxY + 34);
            ctx.stroke();

            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(priceBoxX + 20, priceBoxY + 65);
            ctx.lineTo(priceBoxX + priceBoxW - 20, priceBoxY + 65);
            ctx.stroke();

            // Offer price row
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 20px "Hind Siliguri", sans-serif';
            ctx.fillText('অফার মূল্য', priceBoxX + 26, priceBoxY + 100);

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`৳ ${offerPrice.toLocaleString()}`, priceBoxX + priceBoxW - 26, priceBoxY + 102);
            ctx.textAlign = 'left';
            ctx.restore();

            // 6.5. PRODUCT DESCRIPTION
            ctx.save();
            const descX = 70;
            const descY = priceBoxY + priceBoxH + 22;
            ctx.fillStyle = '#475569';
            ctx.font = '700 15px "Hind Siliguri", sans-serif';
            ctx.fillText(shortDescription, descX, descY);
            ctx.restore();

            // 7. THREE BOTTOM FEATURE PILLS
            ctx.save();
            const pillRowY = r.h - 220;
            const totalW = r.w - 110;
            const singlePillW = (totalW - 30) / 3;

            const features = [
              { title: '১০০% অরিজিনাল', sub: 'প্রিমিয়াম কোয়ালিটি' },
              { title: 'ক্যাশ অন ডেলিভারি', sub: 'সারা দেশে দ্রুত পাঠানো' },
              { title: 'ঝামেলাহীন রিটার্ন', sub: 'নিরাপদ শপিং অভিজ্ঞতা' },
            ];

            features.forEach((feat, idx) => {
              const px = 55 + idx * (singlePillW + 15);
              ctx.fillStyle = '#fffbeb';
              ctx.strokeStyle = '#d4af37';
              ctx.lineWidth = 1.8;
              drawRoundedRect(ctx, px, pillRowY, singlePillW, 68, 18);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(px + 30, pillRowY + 34, 18, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#b45309';
              ctx.font = '900 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('✓', px + 30, pillRowY + 34);

              ctx.fillStyle = '#0f172a';
              ctx.font = '900 17px "Hind Siliguri", sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'alphabetic';
              ctx.fillText(feat.title, px + 58, pillRowY + 28);

              ctx.fillStyle = '#334155';
              ctx.font = '800 13.5px "Hind Siliguri", sans-serif';
              ctx.fillText(feat.sub, px + 58, pillRowY + 48);
            });
            ctx.restore();

            // 8. BOTTOM WIDE CTA BAR
            ctx.save();
            const ctaBtnX = 55;
            const ctaBtnY = r.h - 135;
            const ctaBtnW = r.w - 110;
            const ctaBtnH = 70;

            const ctaGrad = ctx.createLinearGradient(ctaBtnX, ctaBtnY, ctaBtnX + ctaBtnW, ctaBtnY + ctaBtnH);
            ctaGrad.addColorStop(0, '#0f172a');
            ctaGrad.addColorStop(1, '#1e293b');
            ctx.fillStyle = ctaGrad;
            drawRoundedRect(ctx, ctaBtnX, ctaBtnY, ctaBtnW, ctaBtnH, 18);
            ctx.fill();
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fbbf24';
            ctx.font = '800 24px "Hind Siliguri", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🛒  ${ctaText}  >`, ctaBtnX + ctaBtnW / 2, ctaBtnY + ctaBtnH / 2);
            ctx.restore();

            const dataUrl = canvas.toDataURL('image/png');
            posters.push({
              id: `${i}-${r.id}`,
              title: `Poster #${i + 1} (${r.id})`,
              aspectRatio: r.id,
              width: r.w,
              height: r.h,
              dataUrl,
              productImgUrl: imgUrl,
            });
          }
        }

        setGeneratedPosters(posters);
        setCarouselIndex(0);
        if (isManualTrigger) {
          showToast(lang === 'bn' ? `সকল ব্যানার তৈরি হয়েছে (${posters.length}টি)! ✨` : `${posters.length} posters generated!`);
        }
      } catch (err) {
        console.error(err);
        if (isManualTrigger) {
          showToast('ত্রুটি: পোস্টার তৈরি করা যায়নি');
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [
      productImagesList,
      customLogoUrl,
      brandName,
      brandTagline,
      offerTitle,
      shortDescription,
      productName,
      discountPercent,
      originalPrice,
      offerPrice,
      ctaText,
      lang,
      showToast,
    ]
  );

  useEffect(() => {
    generatePosters(false);
  }, [productImagesList]);

  // Download All Functionality (or Download for Selected Ratio)
  const handleDownloadRatio = (targetRatio: '4:5' | '1:1') => {
    const list = generatedPosters.filter((p) => p.aspectRatio === targetRatio);
    if (list.length === 0) return;
    showToast(lang === 'bn' ? `${targetRatio} এর ${list.length}টি ছবি ডাউনলোড হচ্ছে...` : `Downloading ${list.length} images...`);

    list.forEach((poster, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = poster.dataUrl;
        a.download = `poster-${idx + 1}-${poster.aspectRatio.replace(':', '-')}.png`;
        a.click();
      }, idx * 350);
    });
  };

  const handleSelectVideoFormat = (targetRatio: '4:5' | '1:1') => {
    setShowVideoOptionModal(false);
    // 1. Filter ONLY the banners generated in the specifically selected ratio!
    const matchingList = generatedPosters.filter((p) => p.aspectRatio === targetRatio);
    
    // 2. Extract dataUrls of the selected ratio banners
    const selectedRatioBanners = matchingList.length > 0
      ? matchingList.map((p) => p.dataUrl)
      : generatedPosters.map((p) => p.dataUrl);

    const selectedPoster = matchingList[0] || generatedPosters[0];

    const payload: CampaignToVideoData = {
      posterUrl: selectedPoster?.dataUrl || (productImagesList.length > 0 ? productImagesList[0] : ''),
      aspectRatio: targetRatio,
      generatedPosterUrls: selectedRatioBanners, // Strictly send only the chosen ratio pictures!
      productTitle: productName,
      sellingPrice: offerPrice,
      regularPrice: originalPrice,
      brandName: brandName,
      brandTagline: brandTagline,
      customLogoUrl: customLogoUrl,
      offerTitle: offerTitle,
      allImages: productImagesList,
    };

    if (onNavigateToVideoGenerator) {
      onNavigateToVideoGenerator(payload);
      showToast(
        lang === 'bn'
          ? `🎬 ${targetRatio === '4:5' ? '৪:৫' : '১:১'} রেশিওর পিকচার সহ ভিডিও জেনারেটরে যুক্ত করা হয়েছে!`
          : `Transferred ${targetRatio} ratio pictures to Video Generator!`
      );
    }
  };

  const fullPostText = `🔥 ${offerTitle}! প্রিমিয়াম ${productName} এখন বিশেষ অফার মূল্যে!
✨ ${brandName} - ${brandTagline}

${shortDescription}

🛍️ প্রোডাক্টের নাম: ${productName}
📏 সাইজ: স্ট্যান্ডার্ড সাইজ উপলব্ধ (M, L, XL, XXL)
🧵 ফেব্রিক ও কোয়ালিটি: ১০০% প্রিমিয়াম আরামদায়ক এক্সপোর্ট ফেব্রিক ও নিখুঁত ফিনিশিং

💰 পূর্বের মূল্য: ৳${originalPrice.toLocaleString()}/-
🔥 অফার মূল্য: মাত্র ৳${offerPrice.toLocaleString()}/-
🏷️ বিশেষ ছাড়: ${discountPercent}% ডিসকাউন্ট!

🚚 ডেলিভারি ও পেমেন্ট সুবিধা:
✔️ সারা দেশে দ্রুততম সময়ে ক্যাশ অন হোম ডেলিভারি
✔️ পার্সেল খুলে চেক করে টাকা পরিশোধের পূর্ণ নিশ্চয়তা

🛒 অর্ডার করার নিয়ম:
ইনবক্সে আপনার নাম, পূর্ণ ঠিকানা, মোবাইল নাম্বার এবং পছন্দের সাইজ ও কালার লিখে পাঠিয়ে দিন অথবা সরাসরি কল করুন! 📩

#${brandName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '')} #TawZoon #OnlineShoppingBD #TrendingFashion #PremiumQuality #SpecialOffer #CashOnDeliveryBD`;

  const handleCopyPost = () => {
    navigator.clipboard.writeText(fullPostText);
    setCopiedKey('full_post');
    showToast(lang === 'bn' ? 'সম্পূর্ণ ফেসবুক পোস্ট কপি হয়েছে! 📋' : 'Copied full Facebook post! 📋');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const activeRatioPosters = generatedPosters.filter((p) => p.aspectRatio === activePosterRatio);
  const currentDisplayPoster = activeRatioPosters[carouselIndex] || activeRatioPosters[0] || generatedPosters[0];

  return (
    <div className="space-y-6 w-full max-w-full mx-auto pb-20 text-slate-900 font-sans animate-in fade-in duration-300 px-2 sm:px-4 lg:px-6">
      {/* Main Grid: Control Panel (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 w-full">
        {/* LEFT COLUMN: Controls & Input Form (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* SECTION 1: MULTIPLE PRODUCT IMAGES */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 flex items-center gap-2 truncate">
                <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">১. প্রোডাক্ট ও ছবি (ছবি আপলোড)</span>
              </h3>
              <span className="text-[10px] sm:text-xs lg:text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-300 shrink-0">
                {productImagesList.length}টি ছবি
              </span>
            </div>

            {/* Catalog Products quick picker (Prominent & Professional) */}
            {productsList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenCatalog) {
                    onOpenCatalog();
                  } else {
                    setIsCatalogExpanded(!isCatalogExpanded);
                  }
                }}
                className="w-full py-2.5 sm:py-3 lg:py-3.5 px-3 sm:px-4 bg-[#009245] hover:bg-[#007a38] text-white rounded-xl text-xs sm:text-sm lg:text-base font-black shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98 border border-emerald-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-300" />
                  <span className="truncate">
                    🛍️ ক্যাটালগ পণ্য: {selectedProduct ? (lang === 'bn' ? selectedProduct.nameBn : selectedProduct.nameEn) : 'পণ্য নির্বাচন করুন'}
                  </span>
                </div>
                <span className="bg-white/20 px-2.5 py-1 rounded-lg text-[10.5px] sm:text-xs lg:text-xs whitespace-nowrap shrink-0">
                  ক্যাটালগ থেকে নির্বাচন ➔
                </span>
              </button>
            )}

            {/* Product Image Gallery (Single Row) + Square White Upload Plus Card */}
            <div className="space-y-2">
              <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700 block">সিলেক্টেড ছবিসমূহ:</label>

              {/* Single row of thumbnails with Square White Upload Button inside */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Square White Upload Plus Box */}
                <div
                  onClick={() => productFileInputRef.current?.click()}
                  className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-white border-2 border-dashed border-amber-500 hover:border-amber-600 flex flex-col items-center justify-center cursor-pointer text-amber-600 transition shrink-0 hover:bg-amber-50 shadow-2xs"
                  title="নতুন ছবি যোগ করুন"
                >
                  <Plus className="w-5 h-5 lg:w-6 lg:h-6 stroke-[2.5]" />
                </div>

                {/* Thumbnails list */}
                {productImagesList.map((imgUrl, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <div
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                        activeImageIndex === idx
                          ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                          : 'border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    {productImagesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = productImagesList.filter((_, i) => i !== idx);
                          setProductImagesList(updated);
                          if (activeImageIndex >= updated.length) setActiveImageIndex(updated.length - 1);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-sm opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">প্রোডাক্টের নাম (সাবহেডলাইনে দেখাবে):</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC PRICING SYSTEM */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-300 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 flex items-center gap-2 truncate">
                <Percent className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">২. ডাইনামিক অফার ও প্রাইসিং সিস্টেম</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">অফার মূল্য (বিক্রয় মূল্য ৳):</label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-amber-50/70 border border-amber-400 rounded-xl outline-none font-mono font-black text-amber-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">ডিসকাউন্ট (%):</label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-mono font-bold text-amber-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700 bg-slate-50 p-2.5 sm:p-3 lg:p-3.5 rounded-xl border border-slate-300">
              📊 স্বয়ংক্রিয় হিসাবকৃত আগের মূল্য (কাটা দাগসহ):{' '}
              <span className="text-red-600 font-mono font-black text-xs sm:text-sm lg:text-base">৳ {originalPrice.toLocaleString()}</span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">
                  অফার শিরোনাম (যেমন: bangladesh / ঈদ মোবারক):
                </label>
                <input
                  type="text"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">
                  প্রোডাক্ট বিবরণ (প্রাইজের নিচে ছোট করে দেখাবে):
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: BRANDING & LOGO */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-300 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 flex items-center gap-2 truncate">
                <Layout className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">৩. ব্র্যান্ডিং ও পেজ নাম</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">ব্র্যান্ড / পেজ নাম:</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700">সিটিএ বাটন টেক্সট (CTA):</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3 py-2 sm:py-2.5 lg:py-3 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm lg:text-base bg-slate-50 border border-slate-300 rounded-xl outline-none font-bold text-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            {/* Logo Circle Box with Direct Plus Icon overlay */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700 block">
                পেজের লোগো (লোগোতে ক্লিক করে আপলোড করুন):
              </label>
              <div className="flex items-center gap-3 p-2.5 sm:p-3 lg:p-3.5 bg-slate-50 rounded-2xl border border-slate-300">
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-white border-2 border-dashed border-amber-500 hover:border-amber-600 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group transition shadow-2xs"
                  title="লোগো আপলোড করুন"
                >
                  {customLogoUrl ? (
                    <img src={customLogoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <span className="text-sm sm:text-base lg:text-lg font-black text-slate-700">
                      {(brandName.charAt(0) || 'T').toUpperCase()}
                    </span>
                  )}
                  {/* Plus Icon Overlay */}
                  <div className="absolute inset-0 bg-amber-500/80 text-slate-950 opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm lg:text-base font-black text-slate-900 block">{brandName}</span>
                  <span className="text-[10px] sm:text-[11px] lg:text-xs text-slate-500 font-bold block">
                    লোগো পরিবর্তনের জন্য ক্লিক করুন (+)
                  </span>
                </div>
              </div>
            </div>

            {/* Green Vibrant Generate Button right at the end of Section 3 controls */}
            <div className="block pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => generatePosters(true)}
                disabled={isGenerating}
                className="w-full py-3.5 sm:py-4 lg:py-4.5 bg-gradient-to-r from-[#009245] to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm lg:text-base rounded-2xl shadow-lg shadow-emerald-900/20 border border-emerald-700 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 lg:w-5 lg:h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'পোস্টার তৈরি হচ্ছে...' : '✨ পোস্টার জেনারেট করুন'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Previews & Interactive Carousel (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-300 shadow-sm space-y-4 lg:sticky lg:top-4">
            {/* Section 4 Clean Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 flex items-center gap-2 truncate">
                <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">৪. প্রিভিউ ও ডিসপ্লে</span>
              </h3>

              {/* Aspect Ratio Switcher Tabs (4:5 and 1:1) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] sm:text-xs font-bold border border-slate-300 shrink-0">
                {(['4:5', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => {
                      setActivePosterRatio(ratio);
                      setCarouselIndex(0);
                    }}
                    className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer text-[10px] sm:text-xs lg:text-xs font-black ${
                      activePosterRatio === ratio
                        ? 'bg-amber-500 text-slate-950 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Carousel Preview Display with Left & Right Arrows */}
            <div className="space-y-3">
              {(() => {
                if (!currentDisplayPoster) {
                  return (
                    <div className="aspect-[4/5] rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs sm:text-sm">
                      পোস্টার জেনারেট হচ্ছে...
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {/* Main Display Container with Arrow Controls Overlay */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 shadow-xl border-2 border-slate-300 flex items-center justify-center max-h-[520px] group min-h-[250px]">
                      {currentDisplayPoster?.dataUrl ? (
                        <img
                          src={currentDisplayPoster.dataUrl}
                          alt="Poster Preview"
                          onClick={() => setPreviewModalPoster(currentDisplayPoster)}
                          className="w-full h-full object-contain max-h-[520px] cursor-pointer"
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold">পোস্টার তৈরির জন্য প্রস্তুত করুন</div>
                      )}

                      {/* Left Arrow Button */}
                      {activeRatioPosters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => (prev > 0 ? prev - 1 : activeRatioPosters.length - 1));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition shadow-lg cursor-pointer z-10 active:scale-90"
                          title="আগের ছবি"
                        >
                          <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7" />
                        </button>
                      )}

                      {/* Right Arrow Button */}
                      {activeRatioPosters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => (prev < activeRatioPosters.length - 1 ? prev + 1 : 0));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition shadow-lg cursor-pointer z-10 active:scale-90"
                          title="পরের ছবি"
                        >
                          <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7" />
                        </button>
                      )}

                      {/* Counter Badge */}
                      {activeRatioPosters.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
                          {carouselIndex + 1} / {activeRatioPosters.length}
                        </div>
                      )}
                    </div>

                    {/* Single Row 2 Main Action Buttons - Compact Non-Truncating Labels */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDownloadOptionModal(true)}
                        className="py-2.5 sm:py-3 lg:py-4 px-2 sm:px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] sm:text-xs lg:text-sm rounded-xl shadow-xs border border-amber-600 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 shrink-0" />
                        <span className="whitespace-nowrap">পিকচার ডাউনলোড</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowVideoOptionModal(true)}
                        className="py-2.5 sm:py-3 lg:py-4 px-2 sm:px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-[11px] sm:text-xs lg:text-sm rounded-xl shadow-xs border border-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                      >
                        <Video className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 shrink-0" />
                        <span className="whitespace-nowrap">জেনারেট</span>
                      </button>
                    </div>

                    {/* Single Full-width Facebook Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopyPost}
                      className="w-full py-2.5 sm:py-3 lg:py-4 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] sm:text-xs lg:text-sm rounded-xl shadow-xs border border-teal-700 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                    >
                      {copiedKey === 'full_post' ? (
                        <>
                          <Check className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 text-amber-300 stroke-[3] shrink-0" />
                          <span className="whitespace-nowrap">সম্পূর্ণ পোস্ট কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 shrink-0" />
                          <span className="whitespace-nowrap">সম্পূর্ণ ফেসবুক পোস্ট কপি করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Generated Thumbnails Grid */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[11px] sm:text-xs lg:text-sm font-bold text-slate-700 block">
                সমস্ত জেনারেটেড ব্যানার ({generatedPosters.length}টি):
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto">
                {generatedPosters.map((poster) => (
                  <div
                    key={poster.id}
                    onClick={() => {
                      setActivePosterRatio(poster.aspectRatio);
                      const matchingList = generatedPosters.filter((p) => p.aspectRatio === poster.aspectRatio);
                      const itemIdx = matchingList.findIndex((p) => p.id === poster.id);
                      setCarouselIndex(itemIdx >= 0 ? itemIdx : 0);
                    }}
                    className={`rounded-xl overflow-hidden bg-slate-100 border-2 cursor-pointer aspect-square relative group transition ${
                      currentDisplayPoster?.id === poster.id
                        ? 'border-amber-500 ring-2 ring-amber-500/30'
                        : 'border-slate-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {poster?.dataUrl ? (
                      <img src={poster.dataUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/70 text-white text-[8px] font-mono font-bold">
                      {poster.aspectRatio}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Download Option Modal */}
      {showDownloadOptionModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 relative shadow-2xl border border-slate-300 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <FolderDown className="w-4 h-4 text-amber-600 shrink-0" />
                <span>পিকচার ডাউনলোড ফরম্যাট</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowDownloadOptionModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">ফরম্যাট নির্বাচন করে ছবি ডাউনলোড করুন:</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleDownloadRatio('4:5');
                  setShowDownloadOptionModal(false);
                }}
                className="w-full py-3 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs border border-amber-600 cursor-pointer transition overflow-hidden"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap truncate">৪:৫ (4:5) ব্যানার ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadRatio('1:1');
                  setShowDownloadOptionModal(false);
                }}
                className="w-full py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs border border-slate-700 cursor-pointer transition overflow-hidden"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap truncate">১:১ (1:1) ব্যানার ডাউনলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Generator Option Modal */}
      {showVideoOptionModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 relative shadow-2xl border border-slate-300 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-600 shrink-0" />
                <span>ভিডিও জেনারেটর - রেশিও নির্বাচন</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowVideoOptionModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-bold">ভিডিওতে কোন রেশিওর পিকচারগুলো নিয়ে যুক্ত করতে চান সিলেক্ট করুন:</p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectVideoFormat('4:5')}
                className="w-full py-3 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs border border-indigo-700 cursor-pointer transition overflow-hidden active:scale-95"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap truncate">🎬 ৪:৫ (4:5) রেশিওর পিকচার নিব</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectVideoFormat('1:1')}
                className="w-full py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs border border-slate-700 cursor-pointer transition overflow-hidden active:scale-95"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap truncate">🎬 ১:১ (1:1) রেশিওর পিকচার নিব</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={productFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
              newUrls.push(URL.createObjectURL(files[i]));
            }
            setProductImagesList((prev) => [...newUrls, ...prev]);
          }
        }}
        className="hidden"
      />
      <input
        ref={logoFileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setCustomLogoUrl(url);
          }
        }}
        className="hidden"
      />
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Fullscreen Preview Modal */}
      {previewModalPoster && (
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[200px]">
                {previewModalPoster.title}
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewModalPoster.dataUrl;
                    a.download = `poster-${previewModalPoster.aspectRatio.replace(':', '-')}.png`;
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalPoster(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[55vh]">
              {previewModalPoster?.dataUrl ? (
                <img src={previewModalPoster.dataUrl} alt="Modal Preview" className="w-full h-full object-contain max-h-[55vh]" />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyPost}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Copy className="w-4 h-4" />
                <span>পোস্ট কপি করুন</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToVideoGenerator) {
                    const matchingList = generatedPosters.filter((p) => p.aspectRatio === previewModalPoster.aspectRatio);
                    const posterBanners = matchingList.length > 0 ? matchingList.map((p) => p.dataUrl) : [previewModalPoster.dataUrl];

                    onNavigateToVideoGenerator({
                      posterUrl: previewModalPoster.dataUrl,
                      aspectRatio: previewModalPoster.aspectRatio,
                      generatedPosterUrls: posterBanners,
                      productTitle: productName,
                      sellingPrice: offerPrice,
                      regularPrice: originalPrice,
                      brandName: brandName,
                      brandTagline: brandTagline,
                      customLogoUrl: customLogoUrl,
                      offerTitle: offerTitle,
                      allImages: productImagesList,
                    });
                    showToast(
                      lang === 'bn'
                        ? `🎬 সমস্ত জেনারেটেড ব্যানার সহ ভিডিও জেনারেটরে স্থানান্তর করা হয়েছে!`
                        : `Transferred all generated banners to Video Generator!`
                    );
                  }
                  setPreviewModalPoster(null);
                }}
                className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>🎬 {previewModalPoster.aspectRatio} ভিডিও তৈরি</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
