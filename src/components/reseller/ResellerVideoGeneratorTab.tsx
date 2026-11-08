import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  Play,
  RefreshCw,
  Download,
  Check,
  X,
  Plus,
  Clapperboard,
  Film,
  Percent,
  ShoppingBag,
  Upload,
  Music,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';
import {
  MusicGenre,
  preRenderFullCommercialAudio,
} from '../../utils/commercialAudioEngine.js';

export interface CampaignToVideoData {
  posterUrl: string;
  aspectRatio: '1:1' | '4:5';
  generatedPosterUrls?: string[];
  productTitle?: string;
  sellingPrice?: number;
  regularPrice?: number;
  brandName?: string;
  brandTagline?: string;
  customLogoUrl?: string | null;
  offerTitle?: string;
  allImages?: string[];
}

interface ResellerVideoGeneratorTabProps {
  productsList?: Product[];
  onTakeForSelling?: (product: Product) => void;
  sharedCampaignData?: CampaignToVideoData | null;
  selectedProduct?: Product | null;
  onSelectProduct?: (product: Product) => void;
  onOpenCatalog?: () => void;
}

interface RenderedVideoCampaign {
  id: string;
  title: string;
  durationLabel: string;
  durationSeconds: number;
  resolution: string;
  fps: number;
  aspectRatio: '9:16' | '4:5';
  videoBlobUrl: string;
  thumbnailUrl: string;
}

export const ResellerVideoGeneratorTab: React.FC<ResellerVideoGeneratorTabProps> = ({
  productsList = [],
  onTakeForSelling,
  sharedCampaignData,
  selectedProduct: propSelectedProduct,
  onSelectProduct,
  onOpenCatalog,
}) => {
  const { lang, showToast } = useApp();

  // Selected Catalog Product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Branding & Logo
  const [brandName, setBrandName] = useState<string>('TawZoon');
  const [brandTagline, setBrandTagline] = useState<string>('STYLE FOR EVERY YOU');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Product Data
  const [productTitle, setProductTitle] = useState<string>("প্রোডাক্টের নাম লিখুন");
  const [sellingPrice, setSellingPrice] = useState<number>(800);
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [regularPrice, setRegularPrice] = useState<number>(1000);

  // Auto-calculate regularPrice whenever sellingPrice or discountPercent changes
  useEffect(() => {
    if (discountPercent > 0 && discountPercent < 100) {
      const calcReg = Math.round(sellingPrice / (1 - discountPercent / 100));
      setRegularPrice(calcReg);
    } else {
      setRegularPrice(sellingPrice);
    }
  }, [sellingPrice, discountPercent]);

  // Special Offer Banner
  const [enableSpecialOffer, setEnableSpecialOffer] = useState<boolean>(true);
  const [specialOfferText, setSpecialOfferText] = useState<string>('স্পেশাল অফার');

  // Color Variant Images (Dominant 70%–80% display)
  const [variantImages, setVariantImages] = useState<string[]>([]);

  // Video Aspect Ratio Format ('9:16' Reels | '4:5' FB Portrait)
  const [videoAspectRatio, setVideoAspectRatio] = useState<'9:16' | '4:5'>('9:16');

  useEffect(() => {
    if (sharedCampaignData) {
      // Gather all generated banner artwork and product images
      const images: string[] = [];

      // 1. If generated poster banners exist for the selected campaign, load ONLY those generated poster banners!
      if (sharedCampaignData.generatedPosterUrls && sharedCampaignData.generatedPosterUrls.length > 0) {
        sharedCampaignData.generatedPosterUrls.forEach((url) => {
          if (url && !images.includes(url)) images.push(url);
        });
      } else if (sharedCampaignData.posterUrl) {
        images.push(sharedCampaignData.posterUrl);
      } else if (sharedCampaignData.allImages && sharedCampaignData.allImages.length > 0) {
        sharedCampaignData.allImages.forEach((img) => {
          if (img && !images.includes(img)) images.push(img);
        });
      }

      if (images.length > 0) {
        setVariantImages(images);
      }

      // Transfer all product & branding fields
      if (sharedCampaignData.aspectRatio) setVideoAspectRatio(sharedCampaignData.aspectRatio === '4:5' ? '4:5' : '9:16');
      if (sharedCampaignData.productTitle) setProductTitle(sharedCampaignData.productTitle);
      if (sharedCampaignData.sellingPrice) {
        setSellingPrice(sharedCampaignData.sellingPrice);
        if (sharedCampaignData.regularPrice && sharedCampaignData.regularPrice > sharedCampaignData.sellingPrice) {
          const disc = Math.round(((sharedCampaignData.regularPrice - sharedCampaignData.sellingPrice) / sharedCampaignData.regularPrice) * 100);
          setDiscountPercent(disc);
        }
      }
      if (sharedCampaignData.regularPrice) setRegularPrice(sharedCampaignData.regularPrice);
      if (sharedCampaignData.brandName) setBrandName(sharedCampaignData.brandName);
      if (sharedCampaignData.brandTagline) setBrandTagline(sharedCampaignData.brandTagline);
      if (sharedCampaignData.customLogoUrl !== undefined) setCustomLogoUrl(sharedCampaignData.customLogoUrl);
      if (sharedCampaignData.offerTitle) setSpecialOfferText(sharedCampaignData.offerTitle);
    }
  }, [sharedCampaignData]);

  // Exactly 2.0 seconds per picture as requested (e.g. 4 pictures = 8s, 5 pictures = 10s)
  const secondsPerImage = 2.0;

  // Audio Engine States (Background Music & UI Sound Effects)
  // "প্রত্যেকটা যখন ইউআই অ্যানিমেশন হয়েছে প্রোডাক্টগুলা, সেই সময় কোন সাউন্ড ইফেক্ট ইউজ করতে পারবা? আবার একটা ব্যাকগ্রাউন্ড মিউজিক এই প্রোডাক্ট অনুযায়ী"
  const [musicGenre, setMusicGenre] = useState<MusicGenre>('upbeat_pop');
  const [musicVolume, setMusicVolume] = useState<number>(0.7);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [sfxVolume, setSfxVolume] = useState<number>(0.6);
  const [customAudioBuffer, setCustomAudioBuffer] = useState<AudioBuffer | null>(null);
  const [customAudioFileName, setCustomAudioFileName] = useState<string>('');

  // Playback & Active Variant selection
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const videoFps = 60; // 60 FPS standard for buttery smooth motion

  // Video Generation / Export States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<RenderedVideoCampaign | null>(null);

  // Canvas & Audio Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const loadedImagesCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // AI Social Media Copywriter States
  // "একটা কপি অপশন। মানে এটা এআই অটোমেটিক তোমার টাইটেল আর ডেসক্রিপশনটা বুঝে একটা মানে এআই টাইটেল, ডেসক্রিপশন, হ্যাশট্যাগ পোস্ট করার জন্য। সমস্ত ডিটেইলস দেওয়া থাকবে, জাস্ট কপি করবো, পেস্ট করবো।"
  const [aiSocialCopy, setAiSocialCopy] = useState<{
    catchyHeadline: string;
    shortHook: string;
    description: string;
    reelsCaption: string;
    hashtags: string[];
    fullPostCopy: string;
  } | null>(null);
  const [isGeneratingAiCopy, setIsGeneratingAiCopy] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Copy helper with feedback
  const handleCopyText = (text: string, sectionKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    showToast(lang === 'bn' ? 'ক্লিপবোর্ডে কপি হয়েছে! পেস্ট করুন 📋' : 'Copied to clipboard! 📋');
    setTimeout(() => {
      setCopiedSection((prev) => (prev === sectionKey ? null : prev));
    }, 2500);
  };

  // Generate AI Social Media Post Copy & Hashtags
  const generateAiCopy = useCallback(async () => {
    setIsGeneratingAiCopy(true);
    try {
      const res = await fetch('/api/reseller/generate-social-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle,
          sellingPrice,
          regularPrice,
          brandName,
          brandTagline,
          specialOfferText: enableSpecialOffer ? specialOfferText : '',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAiSocialCopy(json.data);
      }
    } catch (err) {
      console.warn('AI Copy generation error:', err);
    } finally {
      setIsGeneratingAiCopy(false);
    }
  }, [productTitle, sellingPrice, regularPrice, brandName, brandTagline, enableSpecialOffer, specialOfferText]);

  // Initial smart default copy generation
  useEffect(() => {
    const disc = regularPrice > sellingPrice ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100) : 0;
    const cleanBrand = (brandName || 'TawZoon').trim();
    const pageTag = '#' + cleanBrand.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '');

    const headline = `🔥 ${enableSpecialOffer ? specialOfferText : 'ধামাকা অফার'}! প্রিমিয়াম ${productTitle} এখন সেরা অফার মূল্যে!`;
    const fullPost =
`${headline}
✨ ${cleanBrand} - ${brandTagline || 'STYLE FOR EVERY YOU'}

স্টাইল আর আভিজাত্যের সেরা কম্বিনেশন! আপনার প্রতিদিনের ফ্যাশনে নিয়ে আসুন স্মার্ট ও প্রিমিয়াম লুক।

🛍️ প্রোডাক্টের নাম: ${productTitle}
📏 উপলব্ধ সাইজ (Available Sizes): M (38), L (40), XL (42), XXL (44)
🧵 ফেব্রিক ও কোয়ালিটি: ১০০% প্রিমিয়াম আরামদায়ক এক্সপোর্ট ফেব্রিক ও নিখুঁত স্টিচিং
🎨 কালার ভ্যারিয়েন্ট: ভিডিওতে প্রদর্শিত সকল আকর্ষণীয় কালার কালেকশন

💰 স্পেশাল অফার মূল্য: মাত্র ৳${sellingPrice.toLocaleString()}/- ${regularPrice > sellingPrice ? `(পূর্বের মূল্য: ৳${regularPrice.toLocaleString()}/-)` : ''}
${disc > 0 ? `🏷️ বিশেষ ডিসকাউন্ট: ${disc}% ছাড়!\n` : ''}
⭐ প্রিমিয়াম বৈশিষ্ট্যসমূহ:
✔️ ১০০% প্রিমিয়াম কোয়ালিটি ও বডি কমফোর্ট ফেব্রিক
✔️ দীর্ঘস্থায়ী কালার ও নিখুঁত ফিনিশিং গ্যারান্টি
✔️ আধুনিক ও আকর্ষণীয় ট্রেন্ডি স্মার্ট ডিজাইন
✔️ ক্যাজুয়াল, অফিস কিংবা পার্টিতে ব্যবহারের জন্য পারফেক্ট

🚚 ডেলিভারি ও পেমেন্ট সুবিধা:
✔️ সারা দেশে দ্রুততম সময়ে ক্যাশ অন হোম ডেলিভারি
✔️ পার্সেল খুলে চেক করে টাকা পরিশোধের পূর্ণ নিশ্চয়তা

🛒 অর্ডার করার সহজ নিয়ম:
ইনবক্সে আপনার নাম, পূর্ণ ঠিকানা, মোবাইল নাম্বার এবং পছন্দের সাইজ ও কালার লিখে পাঠিয়ে দিন অথবা সরাসরি মেসেজ দিন! 📩

${pageTag} #TawZoon #TawZoonNexus #OnlineShoppingBD #TrendingFashion #PremiumQuality #SpecialOffer #CashOnDeliveryBD #ViralReels`;

    const defaultData = {
      catchyHeadline: headline,
      shortHook: `স্টাইল আর প্রিমিয়াম কমফোর্টের এক অনন্য মিশ্রণ! আপনার পছন্দের কালারে আজই সংগ্রহ করুন।`,
      description: fullPost,
      reelsCaption: `🔥 সেরা অফারে প্রিমিয়াম ${productTitle}! এখনই অর্ডার করতে ইনবক্স করুন। 🛍️✨`,
      hashtags: [
        pageTag,
        '#TawZoon',
        '#TawZoonNexus',
        '#TrendingFashion',
        '#OnlineShoppingBD',
        '#PremiumQuality',
        '#SpecialOffer',
        '#CashOnDeliveryBD',
        '#ViralReels',
      ],
      fullPostCopy: fullPost,
    };

    setAiSocialCopy(defaultData);
  }, [productTitle, sellingPrice, regularPrice, brandName, brandTagline, enableSpecialOffer, specialOfferText]);

  // Helper to extract image URL
  const getProductMainImg = (prod: Product) => {
    return prod.imageUrl || (prod.images && prod.images.length > 0 ? prod.images[0].url : '') || '';
  };

  // When a catalog product is picked, auto-populate all fields cleanly
  const handleSelectCatalogProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductTitle(lang === 'bn' ? (product.nameBn || product.nameEn) : (product.nameEn || product.nameBn));
    const reg = product.regularPrice || Math.round(product.sellingPrice * 1.25);
    const disc = reg > product.sellingPrice ? Math.round(((reg - product.sellingPrice) / reg) * 100) : 20;
    setSellingPrice(product.sellingPrice);
    setDiscountPercent(disc);
    setRegularPrice(reg);

    // Populate variant images
    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img.url && !images.includes(img.url)) images.push(img.url);
      });
    }
    if (images.length === 0) {
      const mainImg = getProductMainImg(product);
      if (mainImg) images.push(mainImg);
    }

    if (images.length > 0) {
      setVariantImages(images);
      setActiveVariantIndex(0);
    }

    setIsCatalogModalOpen(false);

    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  // Sync propSelectedProduct when parent updates it
  useEffect(() => {
    if (propSelectedProduct) {
      handleSelectCatalogProduct(propSelectedProduct);
    }
  }, [propSelectedProduct]);

  // Upload custom variant pictures
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const newImages: string[] = [];
      let count = 0;

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
          }
          count++;
          if (count === fileArray.length) {
            setVariantImages((prev) => [...prev, ...newImages]);
            showToast(
              lang === 'bn'
                ? `${fileArray.length}টি ভ্যারিয়েন্ট ছবি যুক্ত হয়েছে!`
                : `${fileArray.length} variant image(s) added!`
            );
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove specific variant image
  const removeVariantImage = (index: number) => {
    if (variantImages.length <= 1) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি ছবি থাকতে হবে' : 'At least one image is required', 'error');
      return;
    }
    setVariantImages((prev) => prev.filter((_, i) => i !== index));
    if (activeVariantIndex >= variantImages.length - 1) {
      setActiveVariantIndex(0);
    }
  };

  // Upload custom brand / page logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setCustomLogoUrl(url);
          loadImage(url).catch((err) => console.warn('Could not load logo image', err));
          showToast(
            lang === 'bn' ? 'পেজের লোগো সফলভাবে যুক্ত হয়েছে! 🎨' : 'Page logo uploaded successfully! 🎨'
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset to default logo
  const handleRemoveLogo = () => {
    setCustomLogoUrl(null);
    showToast(lang === 'bn' ? 'ডিফল্ট লোগো সেট করা হয়েছে' : 'Reverted to default brand logo');
  };

  // Custom Background Audio Upload Handler (MP3 / WAV / OGG)
  const handleCustomAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(lang === 'bn' ? 'অডিও ফাইল লোড হচ্ছে...' : 'Loading audio file...');
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) throw new Error('Web Audio not supported');
      const tempCtx = new AudioCtxClass();
      const decoded = await tempCtx.decodeAudioData(arrayBuffer);
      setCustomAudioBuffer(decoded);
      setCustomAudioFileName(file.name);
      setMusicGenre('custom');
      showToast(
        lang === 'bn'
          ? `🎵 কাস্টম মিউজিক যুক্ত হয়েছে: ${file.name.slice(0, 20)}`
          : `🎵 Custom music loaded: ${file.name.slice(0, 20)}`
      );
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      showToast(
        lang === 'bn' ? 'অডিও ফাইলটি পড়া যায়নি। দয়া করে অন্য MP3/WAV ফাইল দিন।' : 'Could not decode audio file',
        'error'
      );
    }
  };

  // Reliable image loader with caching
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (loadedImagesCacheRef.current.has(src)) {
      return Promise.resolve(loadedImagesCacheRef.current.get(src)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImagesCacheRef.current.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          loadedImagesCacheRef.current.set(src, fallbackImg);
          resolve(fallbackImg);
        };
        fallbackImg.onerror = reject;
        fallbackImg.src = src;
      };
      img.src = src;
    });
  }, []);

  // Preload all variant images and custom logo
  useEffect(() => {
    variantImages.forEach((src) => {
      loadImage(src).catch((e) => console.warn('Could not preload image', e));
    });
    if (customLogoUrl) {
      loadImage(customLogoUrl).catch((e) => console.warn('Could not preload logo', e));
    }
  }, [variantImages, customLogoUrl, loadImage]);

  // Rounded rectangle path helper
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // RENDER A SINGLE HIGH-DEFINITION FRAME (Used for both Live Preview & Video Recording)
  const renderFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      realWidth: number,
      realHeight: number,
      timeSeconds: number,
      totalDuration: number,
      imageSequence: (HTMLImageElement | null)[],
      expectedNumVariants?: number
    ) => {
      // Clear the actual canvas coordinates
      ctx.clearRect(0, 0, realWidth, realHeight);

      ctx.save();
      // Smooth dynamic scaling factor (1.0 for 1080p rendering, 0.5 for ultra lag-free mobile preview)
      const scaleFactor = realWidth / 1080;
      ctx.scale(scaleFactor, scaleFactor);

      // Define local virtual 1080p viewport boundaries so all sub-drawings scale flawlessly without code modification
      const width = 1080;
      const height = Math.round(realHeight / scaleFactor);

      const discountPercent =
        regularPrice > sellingPrice
          ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
          : 20;

      // ========================================================
      // 1. CLEAN LUXURY WHITE STUDIO BACKDROP WITH GAUSSIAN-BLURRED FLOWING SHAPES
      // ========================================================
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.35, '#f8fafc');
      bgGrad.addColorStop(0.7, '#f1f5f9');
      bgGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Studio ambient soft radial glow behind the product center
      const centerX = width / 2;
      const centerY = height * 0.44;
      const studioLight = ctx.createRadialGradient(centerX, centerY - 60, 40, centerX, centerY, width * 0.75);
      studioLight.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      studioLight.addColorStop(0.4, 'rgba(238, 246, 255, 0.4)');
      studioLight.addColorStop(0.8, 'rgba(224, 231, 255, 0.1)');
      studioLight.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
      ctx.fillStyle = studioLight;
      ctx.fillRect(0, 0, width, height);

      // --- DYNAMIC HARDWARE-ACCELERATED ORGANIC GLASS AURA & GAUSSIAN SHAPES (100% GPU, ZERO LAG) ---
      ctx.save();
      // Apply subtle Gaussian blur as requested ("গউসিয়ান ব্লার বেশি মারবা না, হালকা মারবা যাতে শেপটা বোঝা যায় যে ওখানে শেপ একটা আছে, এনিমেশন হচ্ছে")
      ctx.filter = 'blur(16px)';
      ctx.globalAlpha = 0.46; // Soft, translucent and atmospheric so it looks dreamy and gentle

      // 1. Curvy Silk Ribbons flowing smoothly (Emerald/Mint/Cyan Luxury Blend)
      const waveShiftY = (timeSeconds * 85) % (height * 1.35);
      const cornerSway1 = Math.sin(timeSeconds * 0.75) * (width * 0.22);
      const cornerSway2 = Math.cos(timeSeconds * 0.55) * (width * 0.18);
      for (let rep = -1; rep <= 1; rep++) {
        const curBaseY = -waveShiftY + rep * (height * 1.35);
        ctx.beginPath();
        const startX = centerX - 180 + cornerSway1;
        const startY = curBaseY + height + 160;
        ctx.moveTo(startX, startY);
        const cp1x = centerX + 260 + Math.sin(timeSeconds * 1.2) * 90;
        const cp1y = curBaseY + height * 0.72;
        const cp2x = centerX - 260 + Math.cos(timeSeconds * 0.9) * 100;
        const cp2y = curBaseY + height * 0.40;
        const midX = centerX + cornerSway2;
        const midY = curBaseY + height * 0.18;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
        const cp3x = centerX + 220 + Math.sin(timeSeconds * 0.8) * 90;
        const cp3y = curBaseY - 40;
        const endX = centerX - 140 + cornerSway1;
        const endY = curBaseY - 180;
        ctx.bezierCurveTo(cp3x, cp3y, endX + 60, endY + 60, endX, endY);
        ctx.lineTo(endX + 240, endY);
        ctx.bezierCurveTo(cp3x + 180, cp3y, midX + 240, midY, cp2x + 180, cp2y);
        ctx.bezierCurveTo(cp1x + 180, cp1y, startX + 240, startY - 40, startX + 240, startY);
        ctx.closePath();

        const ribbonGrad = ctx.createLinearGradient(0, curBaseY, width, curBaseY + height);
        ribbonGrad.addColorStop(0, 'rgba(0, 146, 69, 0.22)');
        ribbonGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.32)');
        ribbonGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.28)');
        ribbonGrad.addColorStop(1, 'rgba(59, 130, 246, 0.18)');
        ctx.fillStyle = ribbonGrad;
        ctx.fill();
      }

      // 2. Floating Soft Emerald/Mint Pearl Sphere (Gaussian-style smooth radial falloff)
      const orb1X = centerX - 250 + Math.sin(timeSeconds * 0.65) * 70;
      const orb1Y = centerY - 70 + Math.cos(timeSeconds * 0.55) * 60;
      const orb1R = 360 + Math.sin(timeSeconds * 1.2) * 35;
      const orb1Grad = ctx.createRadialGradient(orb1X, orb1Y, 20, orb1X, orb1Y, orb1R);
      orb1Grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      orb1Grad.addColorStop(0.45, 'rgba(52, 211, 153, 0.22)');
      orb1Grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.08)');
      orb1Grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = orb1Grad;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, orb1R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Floating Soft Sapphire/Cyan Pearl Sphere (Gaussian-style smooth radial falloff)
      const orb2X = centerX + 250 + Math.cos(timeSeconds * 0.6) * 70;
      const orb2Y = centerY + 90 + Math.sin(timeSeconds * 0.65) * 60;
      const orb2R = 350 + Math.cos(timeSeconds * 1.1) * 30;
      const orb2Grad = ctx.createRadialGradient(orb2X, orb2Y, 20, orb2X, orb2Y, orb2R);
      orb2Grad.addColorStop(0, 'rgba(6, 182, 212, 0.42)');
      orb2Grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.20)');
      orb2Grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.07)');
      orb2Grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = orb2Grad;
      ctx.beginPath();
      ctx.arc(orb2X, orb2Y, orb2R, 0, Math.PI * 2);
      ctx.fill();

      // 4. Subtle Warm Luxury Gold Glow Sphere (Accents the luxury feel)
      const orb3X = centerX + Math.sin(timeSeconds * 0.45) * 140;
      const orb3Y = centerY - 280 + Math.cos(timeSeconds * 0.7) * 45;
      const orb3R = 280;
      const orb3Grad = ctx.createRadialGradient(orb3X, orb3Y, 15, orb3X, orb3Y, orb3R);
      orb3Grad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
      orb3Grad.addColorStop(0.55, 'rgba(251, 191, 36, 0.08)');
      orb3Grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = orb3Grad;
      ctx.beginPath();
      ctx.arc(orb3X, orb3Y, orb3R, 0, Math.PI * 2);
      ctx.fill();

      ctx.filter = 'none'; // Restore sharp filter for remaining elements
      ctx.restore();

      // Subtle light sparkle accents (sparkle drift)
      const sparkleT = timeSeconds * 1.5;
      ctx.save();
      for (let s = 0; s < 4; s++) {
        const sx = centerX + Math.sin(sparkleT + s * 1.6) * (width * 0.38);
        const sy = centerY + Math.cos(sparkleT * 0.8 + s * 1.4) * (height * 0.22);
        const sa = 0.25 + 0.25 * Math.sin(sparkleT * 2 + s);
        ctx.fillStyle = `rgba(37, 99, 235, ${sa})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const is4x5 = height < 1600;

      // ========================================================
      // 2. TOP HEADER: BRANDING & BIG SPECIAL OFFER BANNER
      // ========================================================
      // Brand Logo & Name (Top-Left) with Subtle Micro-Animation & Soft Delicate CC Light
      const brandX = 54;
      const brandY = is4x5 ? 36 : 56;
      ctx.save();
      const iconSize = is4x5 ? 52 : 64;

      // Subtle breathing pulse & micro-float on brand mark
      const brandPulse = 1.0 + Math.sin(timeSeconds * 2.5) * 0.012;
      const brandFloatY = Math.sin(timeSeconds * 2.0) * 1.5;

      ctx.translate(brandX + iconSize / 2, brandY + iconSize / 2 + brandFloatY);
      ctx.scale(brandPulse, brandPulse);
      ctx.translate(-(brandX + iconSize / 2), -(brandY + iconSize / 2 + brandFloatY));

      const customLogoImg =
        customLogoUrl && loadedImagesCacheRef.current.has(customLogoUrl)
          ? loadedImagesCacheRef.current.get(customLogoUrl)
          : null;

      if (customLogoImg) {
        // User's uploaded custom page logo
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        drawRoundedRect(ctx, brandX, brandY, iconSize, iconSize, is4x5 ? 14 : 18);
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        drawRoundedRect(ctx, brandX, brandY, iconSize, iconSize, is4x5 ? 14 : 18);
        ctx.stroke();

        ctx.save();
        drawRoundedRect(ctx, brandX + 4, brandY + 4, iconSize - 8, iconSize - 8, is4x5 ? 10 : 14);
        ctx.clip();

        const lRatio = customLogoImg.width / customLogoImg.height;
        let lw = iconSize - 8;
        let lh = lw / lRatio;
        if (lh > iconSize - 8) {
          lh = iconSize - 8;
          lw = lh * lRatio;
        }
        ctx.drawImage(
          customLogoImg,
          brandX + 4 + (iconSize - 8 - lw) / 2,
          brandY + 4 + (iconSize - 8 - lh) / 2,
          lw,
          lh
        );
        ctx.restore();
      } else {
        // Default brand logo box
        ctx.fillStyle = '#0f172a';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        drawRoundedRect(ctx, brandX, brandY, iconSize, iconSize, is4x5 ? 14 : 18);
        ctx.fill();

        // Accent color inside logo
        ctx.fillStyle = '#009245';
        drawRoundedRect(ctx, brandX + iconSize * 0.45, brandY + 8, iconSize * 0.45, iconSize - 16, 10);
        ctx.fill();

        // Monogram (First letter of brand name or 'T')
        const monogramLetter = (brandName.trim().charAt(0) || 'T').toUpperCase();
        ctx.fillStyle = '#ffffff';
        ctx.font = is4x5 ? '900 28px sans-serif' : '900 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(monogramLetter, brandX + iconSize / 2, brandY + iconSize / 2 + 1);
      }

      // Delicate, soft CC Light sheen across the brand logo
      const brandSweepPeriod = 3.6;
      const brandSweepT = (timeSeconds % brandSweepPeriod) / 1.6;
      if (brandSweepT <= 1.0) {
        ctx.save();
        drawRoundedRect(ctx, brandX, brandY, iconSize, iconSize, is4x5 ? 14 : 18);
        ctx.clip();
        const bSweepX = brandX - 30 + brandSweepT * (iconSize + 60);
        const bGrad = ctx.createLinearGradient(bSweepX - 20, brandY, bSweepX + 20, brandY + iconSize);
        bGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        bGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)'); // Very soft luxury gleam
        bGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(brandX - 10, brandY - 10, iconSize + 20, iconSize + 20);
        ctx.restore();
      }

      // Brand Text (100% HD Crisp)
      const textX = brandX + iconSize + 16;
      ctx.fillStyle = '#0f172a';
      ctx.font = is4x5 ? '800 34px "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif' : '800 42px "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.shadowBlur = 0;
      ctx.fillText(brandName, textX, brandY);

      if (brandTagline) {
        ctx.fillStyle = '#64748b';
        ctx.font = is4x5 ? '700 15px "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif' : '700 18px "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText(brandTagline.toUpperCase(), textX, brandY + (is4x5 ? 36 : 44));
      }
      ctx.restore();

      // BIG EYE-CATCHING "স্পেশাল অফার" BANNER WITH SOFTER CC LIGHT SWEEP
      if (enableSpecialOffer) {
        ctx.save();
        const bannerW = is4x5 ? 350 : 425;
        const bannerH = is4x5 ? 78 : 96;
        const bannerX = width - bannerW - (is4x5 ? 36 : 54);
        const bannerY = is4x5 ? 28 : 48;

        const bannerCenterX = bannerX + bannerW / 2;
        const bannerCenterY = bannerY + bannerH / 2;

        // Dynamic pulse animation (subtle scale up & down)
        const pulse = 1.0 + Math.sin(timeSeconds * 3.5) * 0.035;
        // Subtle rhythmic tilt (-4 deg to -2 deg)
        const tilt = (-3.2 + Math.sin(timeSeconds * 2.2) * 1.0) * (Math.PI / 180);

        ctx.translate(bannerCenterX, bannerCenterY);
        ctx.rotate(tilt);
        ctx.scale(pulse, pulse);
        ctx.translate(-bannerCenterX, -bannerCenterY);

        // Pulsing glowing aura (softer, gentle red shadow up & down)
        const glowBlur = 8 + Math.sin(timeSeconds * 2.5) * 4;
        const glowAlpha = 0.12 + Math.sin(timeSeconds * 2.5) * 0.05;

        // Glowing Red/Ruby Gradient
        const bannerGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
        bannerGrad.addColorStop(0, '#dc2626');
        bannerGrad.addColorStop(0.5, '#ef4444');
        bannerGrad.addColorStop(1, '#b91c1c');

        ctx.fillStyle = bannerGrad;
        ctx.shadowColor = `rgba(220, 38, 38, ${glowAlpha})`;
        ctx.shadowBlur = glowBlur;
        ctx.shadowOffsetY = 3;
        drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 24);
        ctx.fill();

        // White border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3.5;
        drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 24);
        ctx.stroke();

        // SOFTER, MORE SUBTLE CC LIGHT SWEEP (Toned down as requested)
        const sweepPeriod = 2.6;
        const sweepT = (timeSeconds % sweepPeriod) / 1.6;
        if (sweepT <= 1.0) {
          ctx.save();
          drawRoundedRect(ctx, bannerX, bannerY, bannerW, bannerH, 24);
          ctx.clip();

          const sweepX = bannerX - 80 + sweepT * (bannerW + 200);
          const ccLightGrad = ctx.createLinearGradient(sweepX - 50, bannerY - 20, sweepX + 50, bannerY + bannerH + 20);
          ccLightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          ccLightGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.12)');
          ccLightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.38)'); // Toned down core
          ccLightGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.12)');
          ccLightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = ccLightGrad;
          ctx.fillRect(bannerX - 100, bannerY - 30, bannerW + 200, bannerH + 60);
          ctx.restore();
        }

        // Banner text: "⚡ স্পেশাল অফার" (100% HD Crisp)
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 42px "Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(`⚡ ${specialOfferText}`, bannerX + bannerW * 0.42, bannerY + bannerH / 2);

        // Circular Discount Tag on right of banner
        const discR = 54;
        const discCX = bannerX + bannerW - 10;
        const discCY = bannerY + bannerH / 2;

        ctx.fillStyle = '#facc15'; // Vibrant gold
        ctx.shadowColor = 'rgba(234, 179, 8, 0.65)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(discCX, discCY, discR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(discCX, discCY, discR - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Softer CC light sheen on discount badge
        if (sweepT <= 1.0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(discCX, discCY, discR, 0, Math.PI * 2);
          ctx.clip();
          const sweepX = bannerX - 80 + sweepT * (bannerW + 200);
          const discShine = ctx.createLinearGradient(sweepX - 35, discCY - discR, sweepX + 35, discCY + discR);
          discShine.addColorStop(0, 'rgba(255, 255, 255, 0)');
          discShine.addColorStop(0.5, 'rgba(255, 255, 255, 0.42)'); // Softer gleam
          discShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = discShine;
          ctx.fillRect(discCX - discR - 10, discCY - discR - 10, discR * 2 + 20, discR * 2 + 20);
          ctx.restore();
        }

        // Discount Percent Text (100% HD Crisp)
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 36px "Plus Jakarta Sans", "Hind Siliguri", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0;
        ctx.fillText(`${discountPercent}%`, discCX, discCY - 12);
        ctx.font = '700 22px "Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('ছাড়', discCX, discCY + 20);

        ctx.restore();
      }

      // ========================================================
      // 3. HEADLINE (PRODUCT TITLE) & PRICE SECTION (HD CRISP & THICK BOLD)
      // ========================================================
      const headY = is4x5 ? 135 : 210;
      ctx.save();
      // Product Title (Large, Clean & 100% Crisp HD)
      ctx.fillStyle = '#0f172a';
      ctx.font = is4x5
        ? '800 36px "Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif'
        : '800 46px "Hind Siliguri", "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0; // Pure crisp HD without blurry bleed
      ctx.fillText(productTitle, centerX, headY);

      // Price Row with Subtle UI Animation (gentle 2% breathing pulse)
      const priceRowY = is4x5 ? 195 : 295;
      const pricePulse = 1.0 + Math.sin(timeSeconds * 2.8) * 0.02;

      ctx.save();
      ctx.translate(centerX, priceRowY);
      ctx.scale(pricePulse, pricePulse);
      ctx.translate(-centerX, -priceRowY);

      const sellPriceStr = `৳${sellingPrice.toLocaleString()}`;
      // High-grade font stack with bold weight
      const priceFont = is4x5
        ? '800 52px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
        : '800 70px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.font = priceFont;
      const sellW = ctx.measureText(sellPriceStr).width;

      const regPriceStr = regularPrice > sellingPrice ? `৳${regularPrice.toLocaleString()}` : '';
      ctx.font = is4x5
        ? '700 30px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
        : '700 38px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      const regW = regPriceStr ? ctx.measureText(regPriceStr).width : 0;

      const pillW = is4x5 ? 124 : 156;
      const pillH = is4x5 ? 42 : 52;
      const gap = is4x5 ? 18 : 24;
      const totalRowW = sellW + (regW ? regW + gap : 0) + pillW + gap;
      let curX = centerX - totalRowW / 2;

      // Selling Price (EXTRA THICK / BOLD, 100% HD CRISP)
      ctx.font = priceFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0; // Pure HD crispness

      // Stroke thickening for solid bold weight (মোটা / বোল্ড)
      ctx.strokeStyle = '#009245';
      ctx.lineWidth = is4x5 ? 2.8 : 3.6;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(sellPriceStr, curX, priceRowY);

      // Solid fill on top
      ctx.fillStyle = '#009245';
      ctx.fillText(sellPriceStr, curX, priceRowY);
      curX += sellW + gap;

      // Strikethrough Regular Price (HD Crisp)
      if (regPriceStr) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = is4x5
          ? '700 30px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
          : '700 38px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText(regPriceStr, curX, priceRowY);

        // Red crossout line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(curX - 2, priceRowY);
        ctx.lineTo(curX + regW + 2, priceRowY);
        ctx.stroke();

        curX += regW + gap;
      }

      // "অফার মূল্য" Pill Badge (100% HD Crisp)
      ctx.fillStyle = '#dcfce7';
      drawRoundedRect(ctx, curX, priceRowY - (is4x5 ? 21 : 26), pillW, pillH, is4x5 ? 12 : 16);
      ctx.fill();
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, curX, priceRowY - (is4x5 ? 21 : 26), pillW, pillH, is4x5 ? 12 : 16);
      ctx.stroke();

      ctx.fillStyle = '#166534';
      ctx.font = is4x5
        ? '800 19px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
        : '800 24px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('অফার মূল্য', curX + pillW / 2, priceRowY);

      ctx.restore(); // Restore price pulse
      ctx.restore();

      // ========================================================
      // 4. MAIN HERO PRODUCT (DYNAMIC SLIDE-IN TRANSITIONS)
      // ========================================================
      const numVariants = expectedNumVariants || Math.max(1, imageSequence.length);
      const variantCycleTime = totalDuration / numVariants;
      const currentCycle = (timeSeconds % totalDuration) / variantCycleTime;
      const activeIdx = Math.min(Math.floor(currentCycle), numVariants - 1);
      const timeInCycle = (timeSeconds % totalDuration) - activeIdx * variantCycleTime;

      // Extended transition duration (0.75s) for silky smooth, unhurried fluid sliding
      const transDuration = Math.min(0.75, variantCycleTime * 0.40);
      const inTransition = numVariants > 1 && timeInCycle < transDuration && (activeIdx > 0 || timeSeconds >= variantCycleTime);
      const transProgress = inTransition ? Math.min(1.0, Math.max(0.0, timeInCycle / transDuration)) : 1.0;

      // Smooth cosine ease-in-out curve: 0.5 - 0.5 * cos(PI * t)
      // Provides perfectly continuous acceleration/deceleration with zero initial/final velocity jumps
      const t = Math.min(1.0, Math.max(0.0, transProgress));
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * t);

      // Subtle natural breathing levitation (applied to settled hero product)
      const breathProgress = (Math.sin(timeSeconds * 1.8) + 1) / 2;
      const cameraScale = 1.0 + breathProgress * 0.04;
      const floatY = Math.sin(timeSeconds * 2.2) * (is4x5 ? 3 : 4.5);

      // Helper to draw single product image with position, scale, rotation and opacity (Ultra-Optimized 60 FPS)
      const drawHeroCard = (
        img: HTMLImageElement,
        offsetX: number,
        offsetY: number,
        scale: number,
        rotationRad: number,
        alpha: number
      ) => {
        if (!img || alpha <= 0.005) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        const baseHeroY = is4x5 ? 610 : 860;
        const heroX = centerX + offsetX;
        const heroY = baseHeroY + floatY + offsetY;

        ctx.translate(heroX, heroY);
        if (rotationRad !== 0) {
          ctx.rotate(rotationRad);
        }
        ctx.scale(scale, scale);

        // Native Proportional Dimensions (No white box, no thick borders, pure native aspect ratio)
        const maxStageW = width * (is4x5 ? 0.90 : 0.88);
        const maxStageH = is4x5 ? 650 : 920;

        const imgRatio = (img.width && img.height) ? (img.width / img.height) : 1.0;
        let drawW = maxStageW;
        let drawH = drawW / imgRatio;
        if (drawH > maxStageH) {
          drawH = maxStageH;
          drawW = drawH * imgRatio;
        }

        // 1. Ambient soft glowing gaussian halo behind native image (100% GPU, zero lag)
        const haloR = Math.max(drawW, drawH) * 0.58;
        const cardHalo = ctx.createRadialGradient(0, 0, 20, 0, 0, haloR);
        cardHalo.addColorStop(0, 'rgba(16, 185, 129, 0.20)');
        cardHalo.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
        cardHalo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cardHalo;
        ctx.fillRect(-haloR, -haloR, haloR * 2, haloR * 2);

        // 2. Sleek rounded corners container (borderRadius) with 100% native aspect ratio
        const frameRadius = is4x5 ? 20 : 26;

        // Clip to rounded shape to give the product image sleek rounded corners
        ctx.save();
        drawRoundedRect(ctx, -drawW / 2, -drawH / 2, drawW, drawH, frameRadius);
        ctx.clip();
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore(); // Restore clip

        // 3. User Requested: Very thin, professional light-blue border stroke
        ctx.strokeStyle = '#38bdf8'; // Sleek professional light-blue (Sky Blue)
        ctx.lineWidth = is4x5 ? 1.5 : 2.0;
        drawRoundedRect(ctx, -drawW / 2, -drawH / 2, drawW, drawH, frameRadius);
        ctx.stroke();

        ctx.restore(); // Restore scale/translate/alpha
      };

      // Stage clipping bounds: protects header and footer vertically from being covered by sliding cards
      // Horizontally uses wide bleed (-width * 2 to width * 5) so cards never get cut off or sliced on canvas edges during slide
      const stageClipTop = is4x5 ? 230 : 330;
      const stageClipBottom = is4x5 ? 990 : 1380;

      ctx.save();
      ctx.beginPath();
      ctx.rect(-width * 2, stageClipTop, width * 5, stageClipBottom - stageClipTop);
      ctx.clip();

      if (inTransition && numVariants > 1) {
        const prevIdx = (activeIdx - 1 + numVariants) % numVariants;
        const prevImg = imageSequence[prevIdx] || imageSequence[0];
        const nextImg = imageSequence[activeIdx] || imageSequence[0];

        // 4 Rotating Multi-Directional Cinematic Transitions with Smooth Ease-in-Out Motion:
        // Style 0: Right-to-Left Slide with Depth Focus
        // Style 1: Bottom-to-Top Elevate with Smooth Rise
        // Style 2: Left-to-Right Slide with Depth Focus
        // Style 3: Top-to-Bottom Cascade with Smooth Glide
        const slideStyle = activeIdx % 4;

        const travelX = width * 1.15;
        const travelY = (stageClipBottom - stageClipTop) * 1.05;

        let outgoingX = 0;
        let outgoingY = 0;
        let outgoingScale = 1.0;
        let outgoingAlpha = 1.0;

        let incomingX = 0;
        let incomingY = 0;
        let incomingScale = 1.0;
        let incomingAlpha = 1.0;

        if (slideStyle === 0) {
          // Right-to-Left Slide
          outgoingX = -eased * travelX;
          outgoingScale = 1.0 - 0.04 * eased;
          outgoingAlpha = 1.0 - eased;

          incomingX = (1.0 - eased) * travelX;
          incomingScale = 0.96 + 0.04 * eased;
          incomingAlpha = eased;
        } else if (slideStyle === 1) {
          // Bottom-to-Top Elevate
          outgoingY = -eased * travelY;
          outgoingScale = 1.0 - 0.04 * eased;
          outgoingAlpha = 1.0 - eased;

          incomingY = (1.0 - eased) * travelY;
          incomingScale = 0.96 + 0.04 * eased;
          incomingAlpha = eased;
        } else if (slideStyle === 2) {
          // Left-to-Right Slide
          outgoingX = eased * travelX;
          outgoingScale = 1.0 - 0.04 * eased;
          outgoingAlpha = 1.0 - eased;

          incomingX = -(1.0 - eased) * travelX;
          incomingScale = 0.96 + 0.04 * eased;
          incomingAlpha = eased;
        } else {
          // Top-to-Bottom Cascade
          outgoingY = eased * travelY;
          outgoingScale = 1.0 - 0.04 * eased;
          outgoingAlpha = 1.0 - eased;

          incomingY = -(1.0 - eased) * travelY;
          incomingScale = 0.96 + 0.04 * eased;
          incomingAlpha = eased;
        }

        // 1. Draw outgoing product card (fading away cleanly in direction of motion)
        if (prevImg) {
          drawHeroCard(prevImg, outgoingX, outgoingY, cameraScale * outgoingScale, 0, outgoingAlpha);
        }

        // 2. Draw incoming product card (zooming into sharp focus with clean entrance)
        if (nextImg) {
          drawHeroCard(nextImg, incomingX, incomingY, cameraScale * incomingScale, 0, incomingAlpha);
        }
      } else {
        // Settled hero product with natural breathing and levitation
        const activeImage = imageSequence[activeIdx] || imageSequence[0];
        if (activeImage) {
          drawHeroCard(activeImage, 0, 0, cameraScale, 0, 1.0);
        } else {
          // Empty placeholder card on studio stage when no images are added yet
          ctx.save();
          const heroX = centerX;
          const heroY = (is4x5 ? 610 : 860) + floatY;
          ctx.translate(heroX, heroY);

          const maxStageW = width * (is4x5 ? 0.82 : 0.80);
          const maxStageH = is4x5 ? 540 : 760;

          ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 12;

          const frameRadius = is4x5 ? 24 : 32;
          drawRoundedRect(ctx, -maxStageW / 2, -maxStageH / 2, maxStageW, maxStageH, frameRadius);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 8]);
          drawRoundedRect(ctx, -maxStageW / 2 + 16, -maxStageH / 2 + 16, maxStageW - 32, maxStageH - 32, frameRadius - 8);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#009245';
          ctx.font = is4x5 ? '800 60px sans-serif' : '800 76px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🖼️', 0, -35);

          ctx.fillStyle = '#0f172a';
          ctx.font = is4x5 ? '800 28px "Hind Siliguri", sans-serif' : '800 36px "Hind Siliguri", sans-serif';
          ctx.fillText('কোনো ছবি যুক্ত করা হয়নি', 0, 35);

          ctx.fillStyle = '#64748b';
          ctx.font = is4x5 ? '600 20px "Hind Siliguri", sans-serif' : '600 25px "Hind Siliguri", sans-serif';
          ctx.fillText('ক্যাটালগ থেকে নির্বাচন করুন অথবা ছবি আপলোড করুন', 0, 80);

          ctx.restore();
        }
      }

      ctx.restore(); // Restores stage clipping

      // ========================================================
      // 5. BOTTOM MULTI-VARIANT CAROUSEL (SHOWS ALL UPLOADED IMAGES)
      // ========================================================
      const thumbY = is4x5 ? 1015 : 1410;
      const thumbW = is4x5 ? 90 : 116;
      const thumbH = is4x5 ? 108 : 138;
      const thumbGap = is4x5 ? 14 : 20;
      const totalThumbs = imageSequence.length;

      // Calculate smooth horizontal scroll offset so active variant is centered when > 4 images
      let carouselOffset = 0;
      if (totalThumbs <= 4) {
        // Center the row if 4 or fewer
        const totalW = totalThumbs * thumbW + (totalThumbs - 1) * thumbGap;
        carouselOffset = centerX - totalW / 2;
      } else {
        // If more than 4 images: smoothly glide so activeIdx stays centered, with others visible on left and right!
        const targetActiveCenter = activeIdx * (thumbW + thumbGap) + thumbW / 2;
        let prevActiveCenter = targetActiveCenter;
        if (inTransition) {
          const prevIdx = (activeIdx - 1 + totalThumbs) % totalThumbs;
          prevActiveCenter = prevIdx * (thumbW + thumbGap) + thumbW / 2;
        }
        const currentActiveCenter = prevActiveCenter + (targetActiveCenter - prevActiveCenter) * (inTransition ? eased : 1.0);
        carouselOffset = centerX - currentActiveCenter;
      }

      ctx.save();
      // Render all uploaded variant thumbnails
      for (let v = 0; v < totalThumbs; v++) {
        const tx = carouselOffset + v * (thumbW + thumbGap);

        // Skip drawing if completely off-screen
        if (tx < -thumbW - 50 || tx > width + 50) continue;

        const isCurrent = v === activeIdx;
        const thumbImg = imageSequence[v];

        ctx.save();
        // Base white card
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = isCurrent ? 'rgba(0, 146, 69, 0.35)' : 'rgba(0, 0, 0, 0.12)';
        ctx.shadowBlur = isCurrent ? 24 : 10;
        ctx.shadowOffsetY = isCurrent ? 8 : 4;
        drawRoundedRect(ctx, tx, thumbY, thumbW, thumbH, is4x5 ? 14 : 20);
        ctx.fill();

        // Rounded image inside thumbnail
        ctx.save();
        drawRoundedRect(ctx, tx + 5, thumbY + 5, thumbW - 10, thumbH - 10, is4x5 ? 11 : 16);
        ctx.clip();

        if (thumbImg) {
          const tRatio = thumbImg.width / thumbImg.height;
          let tw = thumbW - 10;
          let th = tw / tRatio;
          if (th > thumbH - 10) {
            th = thumbH - 10;
            tw = th * tRatio;
          }
          ctx.drawImage(thumbImg, tx + 5 + (thumbW - 10 - tw) / 2, thumbY + 5 + (thumbH - 10 - th) / 2, tw, th);
        }
        ctx.restore();

        // Active Variant Border Highlight (Green border ring)
        if (isCurrent) {
          ctx.strokeStyle = '#009245';
          ctx.lineWidth = is4x5 ? 3.8 : 5;
          drawRoundedRect(ctx, tx, thumbY, thumbW, thumbH, is4x5 ? 14 : 20);
          ctx.stroke();

          // "Active" dot
          ctx.fillStyle = '#009245';
          ctx.beginPath();
          ctx.arc(tx + thumbW / 2, thumbY - 8, is4x5 ? 4.5 : 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          drawRoundedRect(ctx, tx, thumbY, thumbW, thumbH, is4x5 ? 14 : 20);
          ctx.stroke();
        }

        ctx.restore();
      }
      ctx.restore();

      // ========================================================
      // 6. BOTTOM CALL TO ACTION PILL (SAFE ZONE LIFTED ABOVE MEDIA CONTROLS)
      // ========================================================
      const ctaY = is4x5 ? 1165 : 1600;
      const ctaW = is4x5 ? 560 : 680;
      const ctaH = is4x5 ? 78 : 96;
      const ctaX = centerX - ctaW / 2;
      const pillR = is4x5 ? 38 : 48;

      // Ultra-smooth breathing scale (soft 1.5% amplitude with pure continuous sine wave)
      const ctaPulse = 1.0 + Math.sin(timeSeconds * 2.4) * 0.015;

      ctx.save();
      ctx.translate(centerX, ctaY + ctaH / 2);
      ctx.scale(ctaPulse, ctaPulse);
      ctx.translate(-centerX, -(ctaY + ctaH / 2));

      // Emerald glowing CTA background
      const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
      ctaGrad.addColorStop(0, '#009245');
      ctaGrad.addColorStop(1, '#007a37');

      ctx.fillStyle = ctaGrad;
      ctx.shadowColor = 'rgba(0, 146, 69, 0.45)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, pillR);
      ctx.fill();

      // Silky smooth interior light sheen wave (sweeps gently across button every 2.6 seconds)
      ctx.save();
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, pillR);
      ctx.clip();
      const sheenPeriod = 2.6;
      const sheenT = (timeSeconds % sheenPeriod) / 1.6;
      if (sheenT <= 1.0) {
        const sheenEase = 0.5 - 0.5 * Math.cos(sheenT * Math.PI);
        const sheenX = ctaX - 100 + sheenEase * (ctaW + 200);
        const sheenGrad = ctx.createLinearGradient(sheenX - 60, ctaY, sheenX + 60, ctaY + ctaH);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.28)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(ctaX - 120, ctaY - 10, ctaW + 240, ctaH + 20);
      }
      ctx.restore();

      // Base thin crisp border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 0;
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, pillR);
      ctx.stroke();

      // Silky Smooth Traveling Laser Glow Border (Continuous LineDashOffset)
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.0;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 14;
      ctx.setLineDash([120, 240]);
      ctx.lineDashOffset = -timeSeconds * 260; // Constant perimeter glide
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, pillR);
      ctx.stroke();
      ctx.restore();

      // Button Text (100% HD Crisp Solid White)
      ctx.fillStyle = '#ffffff';
      ctx.font = is4x5
        ? '800 28px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
        : '800 35px "Hind Siliguri", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0; // Razor-sharp HD without blurry shadow bleed
      ctx.fillText('🛒  অর্ডার করতে এখনই ইনবক্স করুন', centerX, ctaY + ctaH / 2);
      ctx.restore(); // Restores CTA button context
      ctx.restore(); // CRITICAL: Restores outer frame context from line 497
    },
    [brandName, brandTagline, enableSpecialOffer, productTitle, regularPrice, sellingPrice, specialOfferText, customLogoUrl]
  );

  // FULL HIGH-DEFINITION CLIENT-SIDE VIDEO RECORDER GENERATOR WITH INTEGRATED COMMERCIAL AUDIO (BGM + SFX)
  const handleGenerateVideoMP4 = async () => {
    if (variantImages.length === 0) {
      showToast(
        lang === 'bn' ? 'দয়া করে কমপক্ষে ১টি প্রোডাক্টের ছবি যুক্ত করুন' : 'Please add at least 1 image',
        'error'
      );
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(2);
    setStatusMessage(lang === 'bn' ? 'অডিও মিক্সিং শুরু হচ্ছে...' : 'Starting audio mixing...');

    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    const chosenMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';

    let recordingAudioCtx: AudioContext | null = null;

    try {
      // 1. Ensure all variant images & custom logo are preloaded into memory
      const loadedVariantImages: HTMLImageElement[] = [];
      const preloadCount = variantImages.length; // No artificial limit as requested
      for (let i = 0; i < preloadCount; i++) {
        const img = await loadImage(variantImages[i]);
        loadedVariantImages.push(img);
        setGenerationProgress(2 + Math.round((i / preloadCount) * 8));
      }
      
      const cappedVariantImages = variantImages;
      
      if (customLogoUrl) {
        try {
          await loadImage(customLogoUrl);
        } catch (e) {
          console.warn('Could not preload custom logo for MP4 generation', e);
        }
      }

      // Generate strictly at True Full HD 1080p (1080x1920 for 9:16 Reels/TikTok, 1080x1350 for 4:5 Facebook)
      const canvasW = 1080;
      const canvasH = videoAspectRatio === '4:5' ? 1350 : 1920;
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = canvasW;
      renderCanvas.height = canvasH;
      // CRITICAL: Attach canvas to DOM offscreen so browser GPU compositor paints every frame without throttling
      renderCanvas.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;opacity:0.01;z-index:-9999;';
      document.body.appendChild(renderCanvas);

      const renderCtx = renderCanvas.getContext('2d', { alpha: false });
      if (!renderCtx) throw new Error('Canvas context not available');

      renderCtx.imageSmoothingEnabled = true;
      renderCtx.imageSmoothingQuality = 'high';

      // Detect mobile device to optimize FPS and bitrate for buttery smooth mobile video playback without stutter or freezing
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      const fps = isMobileDevice ? 30 : 60;
      const targetVideoBitrate = isMobileDevice ? 3_500_000 : 8_000_000;

      // Exactly 2.0s per image as requested (e.g. 4 images = 8s, 5 images = 10s, 6 images = 12s)
      const numImages = Math.max(1, cappedVariantImages.length);
      const calculatedDuration = numImages * secondsPerImage; // 4 * 2.0 = 8.0s
      const totalDurationSec = Math.max(2, calculatedDuration);

      setStatusMessage(lang === 'bn' ? 'মিউজিক প্রস্তুত হচ্ছে...' : 'Preparing commercial music...');
      setGenerationProgress(12);

      // Pre-render entire commercial audio (BGM + Transition Whooshes + Chimes)
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      let sourceNode: AudioBufferSourceNode | null = null;
      try {
        const audioBuffer = await preRenderFullCommercialAudio(
          totalDurationSec,
          secondsPerImage,
          numImages,
          {
            musicGenre,
            musicVolume,
            sfxEnabled,
            sfxVolume,
            customAudioBuffer,
            customAudioFileName,
          }
        );
        
        setGenerationProgress(20);

        if (audioBuffer) {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            recordingAudioCtx = new AudioCtxClass();
            if (recordingAudioCtx.state === 'suspended') {
              await recordingAudioCtx.resume();
            }
            audioDestination = recordingAudioCtx.createMediaStreamDestination();
            sourceNode = recordingAudioCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(audioDestination);
          }
        }
      } catch (audioErr) {
        console.warn('Audio pre-rendering failed, continuing video only', audioErr);
      }

      const canvasStream = renderCanvas.captureStream(fps);
      const videoTrack = canvasStream.getVideoTracks()[0];

      // Combine video track and audio track into a single MediaStream
      const mixedTracks: MediaStreamTrack[] = [videoTrack];
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        mixedTracks.push(...audioDestination.stream.getAudioTracks());
      }
      const stream = new MediaStream(mixedTracks);

      const recorderOptions: MediaRecorderOptions = {
        videoBitsPerSecond: targetVideoBitrate, // Optimized for mobile vs desktop
        audioBitsPerSecond: 128_000,
      };
      if (chosenMime) {
        recorderOptions.mimeType = chosenMime;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      const recordedChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const recordPromise = new Promise<string>((resolve, reject) => {
        recorder.onstop = () => {
          const isMp4 = chosenMime.toLowerCase().includes('mp4');
          const finalBlob = new Blob(recordedChunks, { type: isMp4 ? 'video/mp4' : 'video/webm' });
          const videoUrl = URL.createObjectURL(finalBlob);
          resolve(videoUrl);
        };
        recorder.onerror = (e) => reject(e);
      });

      // Prime initial frame 0 onto canvas so stream is active with sharp image immediately
      renderFrame(
        renderCtx,
        canvasW,
        canvasH,
        0,
        totalDurationSec,
        loadedVariantImages,
        numImages
      );

      // Start recorder and synchronized audio stream simultaneously
      recorder.start(100); // 100ms chunks for smooth keyframing
      await new Promise((r) => setTimeout(r, 60)); // 60ms to let MediaRecorder lock initial keyframe

      if (sourceNode) {
        sourceNode.start(0);
      }

      // Real-time smooth recording loop synchronized with audio
      const recStartTime = performance.now();

      await new Promise<void>((resolve) => {
        let isDone = false;
        let isDrawing = false;
        let rAfId: number | null = null;
        let safetyTimer: any = null;

        const tick = () => {
          if (isDone) return;
          const now = performance.now();
          const elapsedSec = (now - recStartTime) / 1000;

          if (elapsedSec >= totalDurationSec) {
            isDone = true;
            if (rAfId) cancelAnimationFrame(rAfId);
            if (safetyTimer) clearTimeout(safetyTimer);

            // Draw exact final frame at totalDurationSec
            try {
              renderFrame(
                renderCtx,
                canvasW,
                canvasH,
                totalDurationSec - 0.001,
                totalDurationSec,
                loadedVariantImages,
                numImages
              );
            } catch (e) {}
            resolve();
            return;
          }

          if (!isDrawing) {
            isDrawing = true;
            try {
              renderFrame(
                renderCtx,
                canvasW,
                canvasH,
                elapsedSec,
                totalDurationSec,
                loadedVariantImages,
                numImages
              );
            } catch (renderErr) {
              console.warn('Frame render error:', renderErr);
            } finally {
              isDrawing = false;
            }

            // Progress updates smoothly from 20% to 98% across totalDurationSec
            const progress = 20 + Math.min(78, Math.round((elapsedSec / totalDurationSec) * 78));
            setGenerationProgress(progress);

            const currentSec = Math.min(Math.round(totalDurationSec), Math.floor(elapsedSec) + 1);
            setStatusMessage(
              lang === 'bn'
                ? `ভিডিও প্রস্তুত হচ্ছে (${currentSec}/${Math.round(totalDurationSec)} সে.)...`
                : `Generating video (${currentSec}/${Math.round(totalDurationSec)}s)...`
            );
          }

          rAfId = requestAnimationFrame(tick);
        };

        rAfId = requestAnimationFrame(tick);

        // Watchdog timeout to prevent hanging if tab becomes backgrounded
        safetyTimer = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            if (rAfId) cancelAnimationFrame(rAfId);
            resolve();
          }
        }, (totalDurationSec + 3) * 1000);
      });

      // Allow 250ms for final audio/video packets to buffer into MediaRecorder
      await new Promise((r) => setTimeout(r, 250));

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }

      const videoBlobUrl = await recordPromise;
      const resLabel =
        videoAspectRatio === '4:5'
          ? '১০৮০x১৩৫০ (৪:৫ Full HD FB)'
          : '১০৮০x১৯২০ (৯:১৬ Full HD Reels)';

      // Cleanup MediaStream tracks immediately
      stream.getTracks().forEach(track => track.stop());
      if (recordingAudioCtx && recordingAudioCtx.state !== 'closed') {
        await recordingAudioCtx.close();
      }
      try {
        if (renderCanvas.parentNode) {
          renderCanvas.parentNode.removeChild(renderCanvas);
        }
      } catch (e) {}

      // Cleanup old generated video URL if it exists to prevent memory leaks
      if (generatedVideo?.videoBlobUrl) {
        URL.revokeObjectURL(generatedVideo.videoBlobUrl);
      }

      const videoResult: RenderedVideoCampaign = {
        id: `campaign-${Date.now()}`,
        title: productTitle,
        durationLabel: `${totalDurationSec}s`,
        durationSeconds: totalDurationSec,
        resolution: resLabel,
        fps: videoFps,
        aspectRatio: videoAspectRatio,
        videoBlobUrl,
        thumbnailUrl: cappedVariantImages[0],
      };

      setGeneratedVideo(videoResult);
      setIsGenerating(false);
      setGenerationProgress(100);
      showToast(
        lang === 'bn'
          ? `ভিডিও সফলভাবে তৈরি হয়েছে! আপনি এখন দেখতে ও ডাউনলোড করতে পারেন।`
          : `Video generated successfully! You can now view and download it.`
      );
    } catch (err: any) {
      console.error('Video generation error:', err);
      showToast(
        lang === 'bn' ? 'ভিডিও তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Video generation failed. Please try again.',
        'error'
      );
    } finally {
      if (recordingAudioCtx && recordingAudioCtx.state !== 'closed') {
        try {
          recordingAudioCtx.close();
        } catch (e) {}
      }
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };

  // Direct Download Trigger with optimal naming
  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    const cleanTitle = (productTitle || 'Commercial').trim().replace(/[^a-zA-Z0-9\u0980-\u09FF_-]/g, '-');
    const ratioTag = generatedVideo.aspectRatio === '4:5' ? '4x5-FB' : '9x16-Reels';
    const filename = `TawZoon-${cleanTitle}-${ratioTag}-1080p-FullHD.mp4`;

    const a = document.createElement('a');
    a.href = generatedVideo.videoBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(lang === 'bn' ? `Full HD ভিডিও ডাউনলোড শুরু হয়েছে! ⬇️` : 'Full HD Video download started! ⬇️');
  };

  return (
    <div className="space-y-4 w-full max-w-full pb-16 text-slate-900 font-sans animate-in fade-in duration-300 px-2 sm:px-4 lg:px-6">
      {/* ==========================================
          TOP CATALOG PRODUCT PICKER CHIPS (PROMINENT & PROFESSIONAL)
      ========================================== */}
      {productsList.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (onOpenCatalog) {
              onOpenCatalog();
            } else {
              setIsCatalogModalOpen(!isCatalogModalOpen);
            }
          }}
          className="w-full py-2.5 sm:py-3 px-3 sm:px-4 bg-[#009245] hover:bg-[#007a38] text-white rounded-xl text-xs sm:text-sm lg:text-base font-black shadow-xs transition-all flex items-center justify-between cursor-pointer active:scale-98 border border-emerald-600"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-300" />
            <span className="truncate">
              🛍️ ক্যাটালগ পণ্য: {selectedProduct ? (lang === 'bn' ? selectedProduct.nameBn : selectedProduct.nameEn) : 'পণ্য নির্বাচন করুন'}
            </span>
          </div>
          <span className="bg-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10.5px] sm:text-xs lg:text-sm font-bold whitespace-nowrap shrink-0">
            ক্যাটালগ থেকে নির্বাচন ➔
          </span>
        </button>
      )}

      {/* ==========================================
          DESKTOP 2-COLUMN / MOBILE 1-COLUMN RESPONSIVE LAYOUT
          Desktop: Editor on Left (7 cols), Video Preview on Right (5 cols, sticky)
          Mobile: Vertical Stack (Mobile View 100% Unchanged)
      ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start w-full">
        {/* LEFT COLUMN: Controls & Video Design Editor (lg: 7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4 lg:space-y-5">
          {/* ==========================================
              1. VIDEO DESIGN EDITOR (ON TOP AS REQUESTED)
          ========================================== */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-300 shadow-2xs space-y-4 lg:space-y-5">
            <h4 className="text-xs sm:text-sm lg:text-base font-black text-slate-800 border-b border-slate-200 pb-2.5 flex items-center justify-between">
              <span className="whitespace-nowrap truncate">ভিডিওর তথ্য ও ডিজাইন এডিটর</span>
              <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-500 font-mono shrink-0">1080x1920 Full HD</span>
            </h4>

        {/* STEP 1: COLOR VARIANTS / VIDEO IMAGES (RIGHT BELOW CATALOG SELECTOR) */}
        <div className="space-y-1.5 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] sm:text-xs lg:text-sm font-bold text-slate-700 block whitespace-nowrap truncate">
              কালার ভ্যারিয়েন্ট ছবিসমূহ ({variantImages.length}টি):
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10.5px] sm:text-xs lg:text-sm font-bold text-[#009245] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">+ ছবি যোগ করুন</span>
            </button>
          </div>

          {variantImages.length === 0 ? (
            <div className="p-3 sm:p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-between gap-2 my-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base sm:text-lg shrink-0">🖼️</span>
                <p className="text-[10.5px] sm:text-xs lg:text-sm text-slate-600 font-bold truncate">
                  {lang === 'bn' ? 'ছবি যুক্ত করা হয়নি। ক্যাটালগ থেকে নিন অথবা নতুন ছবি যোগ করুন।' : 'No images added yet. Pick from catalog or upload.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {productsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCatalog) onOpenCatalog();
                      else setIsCatalogModalOpen(true);
                    }}
                    className="px-2.5 sm:px-3 py-1.5 bg-[#009245] hover:bg-[#007a38] text-white text-[10px] sm:text-xs lg:text-sm font-black rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    ক্যাটালগ ➔
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-black rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  + ছবি
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none]">
              {variantImages.map((img, idx) => (
                <div
                  key={idx}
                  className="w-12 h-14 sm:w-14 sm:h-16 lg:w-16 lg:h-20 rounded-xl overflow-hidden bg-slate-50 border-2 border-slate-300 shrink-0 relative shadow-2xs group"
                >
                  <img src={img} alt={`variant-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeVariantImage(idx)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer shadow"
                    title="Remove Image"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-14 sm:w-14 sm:h-16 lg:w-16 lg:h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#009245] bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-0.5 cursor-pointer text-slate-500 shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#009245]" />
                <span className="text-[8.5px] sm:text-[9.5px] lg:text-[11px] font-bold whitespace-nowrap">যোগ করুন</span>
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: PRODUCT TITLE & OFFER BANNER & PRICING */}
        <div className="space-y-3 pb-3 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:gap-3.5">
            <div className="space-y-1">
              <label className="text-[10.5px] sm:text-xs lg:text-sm font-bold text-slate-800 block whitespace-nowrap truncate">
                হেডলাইন / প্রোডাক্টের নাম:
              </label>
              <input
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="e.g. Men's Casual Premium Shirt"
                className="w-full px-3 py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base bg-slate-50/90 focus:bg-white border border-slate-300 focus:border-[#009245] rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/15 font-bold text-slate-800 transition shadow-3xs"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] sm:text-xs lg:text-sm font-bold text-slate-800 block whitespace-nowrap truncate">
                  স্পেশাল অফার ব্যানার টেক্সট:
                </label>
                <label className="text-[9.5px] sm:text-xs font-bold text-emerald-700 flex items-center gap-1 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableSpecialOffer}
                    onChange={(e) => setEnableSpecialOffer(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="whitespace-nowrap">ব্যানার দেখান</span>
                </label>
              </div>
              <input
                type="text"
                value={specialOfferText}
                disabled={!enableSpecialOffer}
                onChange={(e) => setSpecialOfferText(e.target.value)}
                placeholder="e.g. স্পেশাল অফার"
                className="w-full px-3 py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base bg-red-50/40 focus:bg-white border border-red-300 focus:border-red-500 rounded-xl outline-none focus:ring-2 focus:ring-red-500/15 font-bold text-red-700 disabled:opacity-50 transition shadow-3xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-600 uppercase tracking-wider block whitespace-nowrap truncate">
                বিক্রয় মূল্য (PRICE):
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm lg:text-base font-bold text-emerald-700">৳</span>
                <input
                  type="number"
                  value={sellingPrice === 0 ? '' : sellingPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSellingPrice(val === '' ? 0 : Number(val));
                  }}
                  className="w-full pl-6 sm:pl-7 pr-2 py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-emerald-50/40 focus:bg-white border border-emerald-400 focus:border-[#009245] rounded-lg lg:rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-black text-emerald-950 font-mono transition shadow-3xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-600 uppercase tracking-wider block whitespace-nowrap truncate">
                পূর্বের মূল্য (REGULAR):
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm lg:text-base font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  value={regularPrice}
                  readOnly
                  disabled
                  className="w-full pl-6 sm:pl-7 pr-2 py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-slate-100 border border-slate-300 rounded-lg lg:rounded-xl outline-none font-bold text-slate-600 font-mono cursor-not-allowed opacity-90 shadow-3xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-600 uppercase tracking-wider block whitespace-nowrap truncate">
                ডিসকাউন্ট হার (%):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent === 0 ? '' : discountPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiscountPercent(val === '' ? 0 : Math.max(0, Math.min(99, Number(val))));
                  }}
                  className="w-full px-2.5 py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-red-50/40 focus:bg-white border border-red-300 focus:border-red-500 rounded-lg lg:rounded-xl outline-none focus:ring-2 focus:ring-red-500/15 font-black text-red-800 font-mono transition shadow-3xs"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-bold text-red-500">% ছাড়</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: BRANDING & PAGE LOGO */}
        <div className="space-y-2 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-[10.5px] sm:text-xs lg:text-sm font-bold text-slate-800 block whitespace-nowrap truncate">
              পেজ ব্রান্ডিং ও কাস্টম লোগো (Page Branding & Logo):
            </label>
            <span className="text-[9.5px] sm:text-xs text-slate-500 font-medium shrink-0 whitespace-nowrap">ভিডিওর উপরে দেখাবে</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-300 shadow-3xs">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-white border-2 border-slate-300 overflow-hidden flex items-center justify-center shadow-2xs relative shrink-0">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt="Page Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-black text-lg sm:text-xl">
                    {(brandName.trim().charAt(0) || 'T').toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[10.5px] sm:text-xs lg:text-sm font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                    <span>{customLogoUrl ? 'লোগো পরিবর্তন' : 'লোগো আপলোড'}</span>
                  </button>
                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 rounded-lg text-[10px] sm:text-xs font-bold cursor-pointer transition whitespace-nowrap"
                    >
                      রিসেট
                    </button>
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-500 whitespace-nowrap">PNG বা JPG লোগো দিন</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 flex-1">
              <div className="space-y-0.5">
                <label className="text-[9.5px] sm:text-xs lg:text-xs font-bold text-slate-600 block whitespace-nowrap truncate">পেজ / ব্র্যান্ডের নাম:</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. TawZoon / My Shop"
                  className="w-full px-2.5 py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-slate-50/90 focus:bg-white border border-slate-300 focus:border-[#009245] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/15 font-bold text-slate-800 transition shadow-3xs"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9.5px] sm:text-xs lg:text-xs font-bold text-slate-600 block whitespace-nowrap truncate">ট্যাগলাইন (Tagline):</label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. STYLE FOR EVERY YOU"
                  className="w-full px-2.5 py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-slate-50/90 focus:bg-white border border-slate-300 focus:border-[#009245] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/15 font-bold text-slate-700 transition shadow-3xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 5: COMMERCIAL BACKGROUND MUSIC & SOUND EFFECTS */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#009245] text-white flex items-center justify-center text-xs font-bold shrink-0">
                <Music className="w-3.5 h-3.5" />
              </div>
              <label className="text-xs sm:text-sm lg:text-base font-black text-slate-900 block whitespace-nowrap truncate">
                কমার্শিয়াল মিউজিক ও ট্রানজিশন সাউন্ড
              </label>
            </div>
            <span className="text-[9.5px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold border border-emerald-300 shrink-0 whitespace-nowrap">
              {musicGenre !== 'none' ? 'মিউজিক চালু' : 'মিউজিক বন্ধ'}
            </span>
          </div>

          {/* Music Genre Selector Pills */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] sm:text-xs lg:text-xs font-bold text-slate-600 block whitespace-nowrap">ব্যাকগ্রাউন্ড মিউজিক থিম নির্বাচন করুন:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { id: 'upbeat_pop', label: '🎶 আপবিট পপ বিট', sub: 'E-Commerce Trendy' },
                { id: 'luxury_chill', label: '✨ লাক্সারি ফ্যাশন ভাইব', sub: 'Modern Chill Lounge' },
                { id: 'viral_reels', label: '🔥 ভাইরাল রিলস ট্র্যাপ', sub: 'Punchy TikTok Beat' },
                { id: 'soft_acoustic', label: '🎸 সফট অ্যাকোস্টিক', sub: 'Calm & Lo-Fi Pluck' },
                { id: 'custom', label: '📁 কাস্টম মিউজিক', sub: customAudioFileName ? customAudioFileName.slice(0, 14) + '...' : 'MP3/WAV আপলোড' },
                { id: 'none', label: '🔇 মিউজিক ছাড়া', sub: 'No Background Music' },
              ].map((g) => {
                const isSel = musicGenre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      if (g.id === 'custom' && !customAudioBuffer) {
                        audioFileInputRef.current?.click();
                      } else {
                        setMusicGenre(g.id as MusicGenre);
                      }
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer shadow-3xs ${
                      isSel
                        ? 'border-[#009245] bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-950 ring-2 ring-emerald-500/25 font-black'
                        : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400 text-slate-700 font-bold'
                    }`}
                  >
                    <p className="text-[10.5px] sm:text-xs lg:text-sm font-bold truncate whitespace-nowrap">{g.label}</p>
                    <p className="text-[8.5px] sm:text-[9.5px] lg:text-[11px] text-slate-500 truncate whitespace-nowrap">{g.sub}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom Audio Upload Button (when custom is selected) */}
            {musicGenre === 'custom' && (
              <div className="flex items-center justify-between p-2 sm:p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-300 text-xs shadow-3xs">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-900 truncate whitespace-nowrap">
                  {customAudioFileName ? `ফাইলের নাম: ${customAudioFileName}` : 'আপনার ডিভাইস থেকে যেকোনো অডিও দিন'}
                </span>
                <button
                  type="button"
                  onClick={() => audioFileInputRef.current?.click()}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                  <span>{customAudioFileName ? 'ফাইল পরিবর্তন' : 'অডিও আপলোড'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Audio Controls: SFX Checkbox & Volume Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-300 shadow-3xs">
            {/* Transition SFX Toggle */}
            <div className="space-y-1">
              <label className="text-[9.5px] sm:text-xs font-bold text-slate-600 block whitespace-nowrap">ট্রানজিশন সাউন্ড ইফেক্ট:</label>
              <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800 shadow-3xs">
                <input
                  type="checkbox"
                  checked={sfxEnabled}
                  onChange={(e) => setSfxEnabled(e.target.checked)}
                  className="rounded text-[#009245] focus:ring-0 cursor-pointer"
                />
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">🔔 সুইশ ও ট্রানজিশন সাউন্ড</span>
              </label>
            </div>

            {/* Music Volume */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-600">
                <span className="whitespace-nowrap">মিউজিক ভলিউম:</span>
                <span className="text-emerald-700 font-mono font-black">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                disabled={musicGenre === 'none'}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full accent-[#009245] cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-600">
                <span className="whitespace-nowrap">সাউন্ড ইফেক্ট ভলিউম:</span>
                <span className="text-emerald-700 font-mono font-black">{Math.round(sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sfxVolume}
                disabled={!sfxEnabled}
                onChange={(e) => setSfxVolume(Number(e.target.value))}
                className="w-full accent-[#009245] cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT COLUMN: Video Studio Preview & Generation Panel (lg: 5 cols, sticky on desktop) */}
    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
      {/* ==========================================
          2. VIDEO STUDIO PREVIEW & GENERATION PANEL
      ========================================== */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 lg:p-5 border border-slate-300 shadow-sm space-y-3 lg:space-y-4">
        {/* COMPACT SINGLE-LINE HEADER */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-lg bg-emerald-100 text-[#009245] flex items-center justify-center font-bold shrink-0">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4.5 lg:h-4.5 text-[#009245]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm lg:text-base font-black text-slate-900 truncate leading-tight">
                কমার্শিয়াল ভিডিও স্টুডিও
              </h3>
              <p className="text-[9.5px] sm:text-[10px] lg:text-xs text-slate-500 font-medium truncate">
                {variantImages.length}টি ছবি • {Math.max(2, Math.round(variantImages.length * secondsPerImage))} সেকেন্ড (প্রতি ছবি ২ সে.)
              </p>
            </div>
          </div>

          {/* Clean Aspect Ratio Options & Quality Badge (Only 9:16 and 4:5 as requested) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Automatic 720p HD & 60 FPS Badge (Optimized for Facebook/TikTok & Zero Mobile Lag) */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] lg:text-xs font-black border border-emerald-300">
              <span>✨ ৭২০p এইচডি • ৬০ FPS</span>
            </span>

            {/* Compact 2-Option Segmented Frame Toggle (9:16 & 4:5 ONLY as requested) */}
            <div className="inline-flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-300 shrink-0">
              <button
                type="button"
                onClick={() => setVideoAspectRatio('9:16')}
                className={`px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-md text-[10px] sm:text-xs lg:text-xs font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  videoAspectRatio === '9:16'
                    ? 'bg-[#009245] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📱 9:16 রিলস</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoAspectRatio('4:5')}
                className={`px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-md text-[10px] sm:text-xs lg:text-xs font-black transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  videoAspectRatio === '4:5'
                    ? 'bg-[#009245] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📘 4:5 ফেসবুক</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==========================================
            DYNAMIC SCREEN VIEWPORT (9:16 or 4:5)
            Zero-Lag Mode: Static card before generation,
            Hardware-accelerated native player after generation
        ========================================== */}
        <div
          className={`relative w-full mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-300 bg-slate-950 transition-all duration-300 ${
            videoAspectRatio === '4:5' ? 'max-w-[320px] sm:max-w-[340px] lg:max-w-[360px] aspect-[4/5]' : 'max-w-[300px] sm:max-w-[320px] lg:max-w-[340px] aspect-[9/16]'
          }`}
        >
          {generatedVideo ? (
            /* Active View: Generated Video Player (autoPlay={false} to prevent jerk/hitch on finish) */
            <div className="w-full h-full relative">
              <video
                key={generatedVideo.videoBlobUrl}
                src={generatedVideo.videoBlobUrl}
                controls
                autoPlay={false}
                muted={false}
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-contain rounded-2xl bg-black"
              />
            </div>
          ) : (
            /* Zero CPU Static Poster Preview Before Generation */
            <div className="w-full h-full relative bg-gradient-to-b from-slate-900 via-slate-900 to-black select-none flex flex-col justify-between p-3.5 sm:p-4 text-white overflow-hidden">
              {/* Top Banner & Badges */}
              <div className="space-y-1.5 z-10">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] lg:text-[11px] font-black tracking-wide shadow-xs truncate max-w-[170px]">
                    ⚡ {enableSpecialOffer ? specialOfferText : 'স্পেশাল অফার'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9.5px] lg:text-[10px] font-bold border border-emerald-500/30">
                      ৭২০p এইচডি • ৬০ FPS
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-slate-200 text-[10px] lg:text-[11px] font-bold border border-white/10">
                      {videoAspectRatio === '4:5' ? '📘 ৪:৫ FB' : '📱 ৯:১৬ রিলস'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] lg:text-xs text-slate-300">
                  <span className="font-bold text-white truncate max-w-[160px]">
                    {brandName || 'TawZoon'}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold shrink-0">
                    ⏱️ {Math.max(2, Math.round(variantImages.length * secondsPerImage))}s ({variantImages.length} ছবি)
                  </span>
                </div>
              </div>

              {/* Main Product Image Poster Frame with Play Overlay */}
              <div className="relative my-auto flex items-center justify-center py-2 z-10">
                <div className="relative max-h-[220px] sm:max-h-[260px] lg:max-h-[280px] max-w-[90%] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-white/5">
                  {variantImages[activeVariantIndex] || variantImages[0] ? (
                    <img
                      src={variantImages[activeVariantIndex] || variantImages[0]}
                      alt={productTitle}
                      className="w-full h-full max-h-[220px] sm:max-h-[260px] lg:max-h-[280px] object-contain block mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <ShoppingBag className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs">ছবি যুক্ত করুন</span>
                    </div>
                  )}

                  {/* Play Overlay Button to Trigger Video Generation */}
                  <button
                    type="button"
                    onClick={handleGenerateVideoMP4}
                    disabled={isGenerating}
                    className="absolute inset-0 bg-black/35 hover:bg-black/20 active:bg-black/45 flex flex-col items-center justify-center transition-all cursor-pointer group"
                    title="ভিডিও তৈরি করুন"
                  >
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-[#009245] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-transform duration-200">
                      <Play className="w-7 h-7 lg:w-8 lg:h-8 fill-white ml-1" />
                    </div>
                    <span className="mt-2.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] lg:text-xs font-black shadow-md border border-white/20">
                      🎬 ৭২০p এইচডি ভিডিও তৈরি করুন ({Math.max(2, Math.round(variantImages.length * secondsPerImage))} সে.)
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Card Mock Details */}
              <div className="space-y-1.5 z-10 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="font-bold text-white truncate max-w-[170px]">
                    {productTitle}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="font-black text-emerald-400 text-sm lg:text-base">
                      ৳{sellingPrice.toLocaleString()}
                    </span>
                    {regularPrice > sellingPrice && (
                      <span className="text-[10px] lg:text-xs text-slate-400 line-through ml-1.5">
                        ৳{regularPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center text-[10.5px] lg:text-xs font-black shadow-sm flex items-center justify-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>🛒 অর্ডার করতে এখনই ইনবক্স করুন</span>
                </div>
              </div>

              {/* Subtle luxury backdrop effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>
          )}

          {/* Progress Overlay when Generating Full HD Video */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-20 space-y-3">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-base font-black text-white">৭২০p এইচডি ভিডিও প্রস্তুত হচ্ছে ({generationProgress}%)</p>
                <p className="text-xs text-emerald-300 font-medium font-mono">{statusMessage}</p>
              </div>
              <div className="w-full max-w-[220px] bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#009245] h-full rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-300">
                {videoAspectRatio === '4:5' ? '৭২০x৯০০ (৪:৫ Facebook)' : '৭২০x১২৮০ (৯:১৬ Reels)'} রেন্ডারিং চলছে
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons: Generate Video & Download & 1-Click Post Copy */}
        {generatedVideo ? (
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadVideo}
                className="w-full py-3.5 lg:py-4 px-3 rounded-2xl bg-[#009245] hover:bg-[#007a37] active:scale-[0.99] text-white font-black text-xs sm:text-sm lg:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer overflow-hidden border border-emerald-700"
              >
                <Download className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                <span className="whitespace-nowrap truncate">
                  ⬇️ {generatedVideo.resolution} ডাউনলোড ({Math.max(2, Math.round(variantImages.length * secondsPerImage))} সে.)
                </span>
              </button>

              {aiSocialCopy && (
                <button
                  type="button"
                  onClick={() => handleCopyText(aiSocialCopy.fullPostCopy, 'full_post')}
                  className="w-full py-3.5 lg:py-4 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm lg:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer overflow-hidden border border-indigo-700"
                >
                  {copiedSection === 'full_post' ? (
                    <>
                      <Check className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-300 stroke-[3] shrink-0" />
                      <span className="whitespace-nowrap truncate">পোস্ট কপি হয়েছে! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                      <span className="whitespace-nowrap truncate">📋 পোস্ট কপি করুন</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerateVideoMP4}
              disabled={isGenerating}
              className="w-full py-2.5 lg:py-3.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs sm:text-sm lg:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition overflow-hidden"
            >
              <RefreshCw className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#009245] shrink-0" />
              <span className="whitespace-nowrap truncate">পুনরায় তৈরি করুন (৭২০p • ৬০ FPS)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGenerateVideoMP4}
              disabled={isGenerating}
              className="w-full py-3.5 lg:py-4 px-4 rounded-2xl bg-[#009245] hover:bg-[#007a37] active:scale-[0.99] text-white font-black text-xs sm:text-sm lg:text-base transition-all shadow-lg hover:shadow-emerald-600/20 border border-emerald-700 flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
            >
              <Clapperboard className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
              <span className="whitespace-nowrap truncate">🎬 ৭২০p এইচডি ভিডিও তৈরি করুন (৬০ FPS • {Math.max(2, Math.round(variantImages.length * secondsPerImage))} সে.)</span>
            </button>

            {aiSocialCopy && (
              <button
                type="button"
                onClick={() => handleCopyText(aiSocialCopy.fullPostCopy, 'full_post')}
                className="w-full py-3 lg:py-3.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs overflow-hidden"
              >
                {copiedSection === 'full_post' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
                    <span className="text-emerald-700 whitespace-nowrap truncate">পোস্ট কপি হয়েছে! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="whitespace-nowrap truncate">📋 পোস্ট কপি করুন (বিবরণ ও হ্যাশট্যাগ)</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

      {/* Hidden File Input for Variant Images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Hidden File Input for Custom Page Logo */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Hidden File Input for Custom Background Audio */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCustomAudioUpload}
        className="hidden"
      />
    </div>
  );
};
