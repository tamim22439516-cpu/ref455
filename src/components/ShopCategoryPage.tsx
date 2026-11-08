import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.js';
import { Product, HeroSlideItem, Subsection } from '../types/index.js';
import { ProductCard } from './ProductCard.js';
import { ProductDetailsPage } from './ProductDetailsPage.js';
import { SLIDE_THEMES } from './HeroSection.js';
import { api } from '../services/api.js';
import { ScrollReveal } from './common/ScrollReveal.js';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  Check,
  X,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const isCategoryMatch = (slugA?: string, slugB?: string): boolean => {
  if (!slugA || !slugB) return false;
  const a = slugA.toLowerCase().trim();
  const b = slugB.toLowerCase().trim();
  if (a === b) return true;
  // Handle gajet / gadgets / gadget / tech
  if (['gajet', 'gadget', 'gadgets', 'tech'].includes(a) && ['gajet', 'gadget', 'gadgets', 'tech'].includes(b)) {
    return true;
  }
  // Handle other / others
  if (['other', 'others'].includes(a) && ['other', 'others'].includes(b)) {
    return true;
  }
  // Handle shop / fashion / lifestyle / style
  if (['shop', 'style', 'fashion', 'lifestyle'].includes(a) && ['shop', 'style', 'fashion', 'lifestyle'].includes(b)) {
    return true;
  }
  return false;
};

export const normalizeBengali = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\u09DF/g, '\u09AF') // Replace য় (U+09DF) with য (U+09AF)
    .replace(/\u09DC/g, '\u09A1') // Replace ড় with ড
    .replace(/\u09DD/g, '\u09A2') // Replace ঢ় with ঢ
    .replace(/\u09C0/g, '\u09BF') // Replace ী with ি
    .replace(/\u09C2/g, '\u09C1') // Replace ূ with ু
    .replace(/\u0982/g, '\u0999') // Replace ং with ঙ
    .replace(/\u09BC/g, '') // Remove Bengali nukta ় (U+09BC)
    .replace(/[\u0981।!?.,;:_#"'`\(\)\[\]\{\}]/g, '') // Remove punctuation & diacritics
    .trim();
};

export const toCompactKey = (str: string | undefined | null): string => {
  if (!str) return '';
  return normalizeBengali(str)
    .replace(/[-\s]/g, '')
    .trim();
};

export const GENERIC_SEARCH_WORDS = [
  'shirt', 'শার্ট', 'tshirt', 'টিশার্ট', 'টি-শার্ট', 'pant', 'প্যান্ট', 'cloth', 'পোশাক', 'ড্রেস', 'dress', 'collection', 'কালেকশন'
];

export const SUBSECTION_ALIAS_PAIRS: Array<[string[], string]> = [
  [['katuya', 'katua', 'katuwa', 'কাতুয়া', 'কাতুয়া'], 'কাতুয়া'],
  [['panjabi', 'punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী'], 'পাঞ্জাবি'],
  [['polo', 'poloshirt', 'পোলো', 'পোলোশার্ট', 'পোলো শার্ট'], 'পোলো শার্ট'],
  [['basictshirt', 'basict-shirt', 'basicshirt', 'বেসিকটিশার্ট', 'বেসিকটি-শার্ট', 'বেসিক টি-শার্ট', 'বেসিক টিশার্ট', 'বেসিক টি শার্ট'], 'বেসিক টিশার্ট'],
  [['dropshoulder', 'dropshouldertshirt', 'ড্রপশোল্ডার', 'ড্রপশোল্ডারটিশার্ট', 'ড্রপ শোল্ডার টিশার্ট', 'ড্রপ শোল্ডার টি-শার্ট'], 'ড্রপশোল্ডার টিশার্ট'],
  [['longsleeve', 'longsleevetshirt', 'লংস্লিভ', 'লংস্লিভটিশার্ট', 'লং-স্লিভটিশার্ট', 'লং-স্লিভ টিশার্ট', 'লং স্লিভ টি-শার্ট'], 'লং-স্লিভ টিশার্ট'],
  [['printshirt', 'printedshirt', 'প্রিন্টশার্ট', 'প্রিন্ট শার্ট'], 'প্রিন্ট শার্ট'],
  [['book', 'books', 'বই'], 'book'],
  [['bangla', 'বাংলা'], 'bangla'],
];

export const QUALIFIER_GROUPS: string[][] = [
  ['পোলো', 'polo'],
  ['বেসিক', 'basic'],
  ['ড্রপশোল্ডার', 'dropshoulder'],
  ['লংস্লিভ', 'longsleeve'],
  ['প্রিন্ট', 'print'],
  ['কাতুয়া', 'katua', 'katuya'],
  ['পাঞ্জাবি', 'panjabi', 'punjabi'],
  ['book', 'বই']
];

export const hasQualifierConflict = (qComp: string, sComp: string): boolean => {
  for (const qGroup of QUALIFIER_GROUPS) {
    const qHas = qGroup.some(w => qComp.includes(toCompactKey(w)));
    const sHas = qGroup.some(w => sComp.includes(toCompactKey(w)));
    if (qHas && !sHas) {
      // Check if s has a different qualifier
      for (const otherGroup of QUALIFIER_GROUPS) {
        if (otherGroup !== qGroup && otherGroup.some(w => sComp.includes(toCompactKey(w)))) {
          return true; // Conflict! E.g. query has 'বেসিক', s has 'পোলো'
        }
      }
    }
  }
  return false;
};

export const findBestMatchingSubsection = (query: string, subs: Subsection[]): Subsection | null => {
  if (!query || !query.trim() || !subs || subs.length === 0) return null;
  const rawQ = query.trim();
  const qComp = toCompactKey(rawQ);
  if (!qComp) return null;

  let bestSub: Subsection | null = null;
  let bestScore = 0;

  for (const s of subs) {
    if (!s || !s.name) continue;
    const sRaw = s.name.trim();
    const sComp = toCompactKey(sRaw);
    if (!sComp) continue;

    // Reject conflicts immediately (e.g. searching 'বেসিক টি-শার্ট' must never match 'পোলো শার্ট')
    if (hasQualifierConflict(qComp, sComp)) {
      continue;
    }

    let score = 0;

    // 1. Exact compact equality (e.g. 'বেসিক টি-শার্ট' matches 'বেসিক টিশার্ট')
    if (qComp === sComp) {
      score = 1000;
    }

    // 2. Alias group match (e.g. 'basic tshirt' matches 'বেসিক টিশার্ট')
    if (score < 1000) {
      for (const [aliases, canonical] of SUBSECTION_ALIAS_PAIRS) {
        const cComp = toCompactKey(canonical);
        const matchesS = (sComp === cComp) || aliases.some(a => toCompactKey(a) === sComp);
        const matchesQ = (qComp === cComp) || aliases.some(a => toCompactKey(a) === qComp);
        if (matchesS && matchesQ) {
          score = 900;
          break;
        }
      }
    }

    // 3. Substring inclusion if not a purely generic single word
    if (score === 0) {
      const isGeneric = GENERIC_SEARCH_WORDS.some(w => toCompactKey(w) === qComp);
      if (!isGeneric) {
        if (sComp.includes(qComp) && qComp.length >= 4) {
          score = 600 + (qComp.length / sComp.length) * 100;
        } else if (qComp.includes(sComp) && sComp.length >= 4) {
          score = 500 + (sComp.length / qComp.length) * 100;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSub = s;
    }
  }

  return bestScore >= 500 ? bestSub : null;
};

export const getBilingualSearchTerms = (query: string): string[] => {
  const raw = query.toLowerCase().trim();
  const clean = normalizeBengali(raw).replace(/^#/, '');
  const terms = new Set<string>([raw, clean]);

  if (raw.includes('-')) {
    terms.add(raw.replace(/-/g, ''));
    terms.add(raw.replace(/-/g, ' '));
  }
  if (clean.includes('-')) {
    terms.add(clean.replace(/-/g, ''));
    terms.add(clean.replace(/-/g, ' '));
  }

  const isTShirt = /t-?shirt|টি-?শার্ট|টিশার্ট|টি\s*শার্ট/i.test(raw) || /t-?shirt|টি-?শার্ট|টিশার্ট|টি\s*শার্ট/i.test(clean);
  const isPolo = /polo|পোলো/i.test(raw) || /polo|পোলো/i.test(clean);
  const isBasic = /basic|বেসিক/i.test(raw) || /basic|বেসিক/i.test(clean);

  if (isBasic && isTShirt) {
    ['basic tshirt', 'basic t-shirt', 'বেসিক টিশার্ট', 'বেসিক টি-শার্ট', 'বেসিক টি শার্ট'].forEach(a => terms.add(a));
  } else if (isTShirt) {
    ['tshirt', 't-shirt', 'টি-শার্ট', 'টিশার্ট', 'টি শার্ট'].forEach(a => terms.add(a));
  } else if (isPolo) {
    ['polo', 'পোলো', 'polo shirt', 'পোলো শার্ট'].forEach(a => terms.add(a));
  } else if (/shirt|শার্ট/i.test(raw) || /shirt|শার্ট/i.test(clean)) {
    ['shirt', 'শার্ট'].forEach(a => terms.add(a));
  }

  const otherAliases: Array<[RegExp, string[]]> = [
    [/katuya|katua|katuwa|কাতুয়া|কাতুয়া/i, ['katuya', 'katua', 'katuwa', 'কাতুয়া', 'কাতুয়া']],
    [/panjabi|punjabi|পাঞ্জাবি|পাঞ্জাবী/i, ['panjabi', 'punjabi', 'পাঞ্জাবি', 'পাঞ্জাবী']],
    [/book|books|বই/i, ['book', 'books', 'বই']],
    [/gadget|gadgets|গ্যাজেট/i, ['gadget', 'gadgets', 'tech', 'গ্যাজেট', 'টেকনোলজি']],
    [/watch|smartwatch|ঘড়ি|ঘড়ি/i, ['watch', 'smartwatch', 'ঘড়ি', 'ঘড়ি']],
    [/headphone|headphones|হেডফোন/i, ['headphone', 'headphones', 'earbuds', 'হেডফোন']],
    [/shoe|shoes|জুতা|জুতো/i, ['shoe', 'shoes', 'জুতা', 'জুতো']],
    [/jacket|জ্যাকেট/i, ['jacket', 'জ্যাকেট']],
    [/pant|pants|প্যান্ট/i, ['pant', 'pants', 'প্যান্ট']],
    [/dropshoulder|ড্রপশোল্ডার|ড্রপ\s*শোল্ডার/i, ['dropshoulder', 'ড্রপশোল্ডার', 'ড্রপ শোল্ডার টিশার্ট']],
    [/longsleeve|লংস্লিভ|লং-?স্লিভ/i, ['longsleeve', 'লংস্লিভ', 'লং-স্লিভ টিশার্ট']],
    [/printshirt|প্রিন্ট\s*শার্ট/i, ['print shirt', 'printed shirt', 'প্রিন্ট শার্ট']],
  ];

  for (const [pattern, aliases] of otherAliases) {
    if (pattern.test(raw) || pattern.test(clean)) {
      aliases.forEach(a => terms.add(a));
    }
  }

  return Array.from(terms);
};

export const extractProductFromInput = (
  input: string,
  products: Product[]
): { matchedProduct: Product | null; isUrl: boolean; isCode: boolean; isInvalidUrl: boolean; isInvalidCode: boolean } => {
  if (!input || !input.trim() || !products || products.length === 0) {
    return { matchedProduct: null, isUrl: false, isCode: false, isInvalidUrl: false, isInvalidCode: false };
  }

  const raw = input.trim();
  const rawLower = raw.toLowerCase();
  const isUrl = rawLower.startsWith('http://') ||
                rawLower.startsWith('https://') ||
                rawLower.startsWith('www.') ||
                rawLower.includes('localhost') ||
                rawLower.includes('?product=') ||
                rawLower.includes('&product=') ||
                rawLower.includes('?code=') ||
                rawLower.includes('&code=') ||
                rawLower.includes('?id=') ||
                rawLower.includes('&id=') ||
                rawLower.includes('/product/') ||
                rawLower.includes('/p/');

  if (isUrl) {
    try {
      const urlToParse = raw.startsWith('http') ? raw : `https://${raw}`;
      const urlObj = new URL(urlToParse);
      const param = urlObj.searchParams.get('product') ||
                    urlObj.searchParams.get('productCode') ||
                    urlObj.searchParams.get('code') ||
                    urlObj.searchParams.get('id');

      if (param) {
        const cleanParam = decodeURIComponent(param).trim().replace(/^#/, '').toLowerCase();
        const found = products.find(p =>
          (p.productCode && p.productCode.trim().replace(/^#/, '').toLowerCase() === cleanParam) ||
          (p.id && p.id.trim().toLowerCase() === cleanParam)
        );
        if (found) {
          return { matchedProduct: found, isUrl: true, isCode: false, isInvalidUrl: false, isInvalidCode: false };
        }
      }

      const segments = urlObj.pathname.split('/').filter(Boolean);
      for (const seg of segments) {
        const cleanSeg = decodeURIComponent(seg).trim().replace(/^#/, '').toLowerCase();
        const found = products.find(p =>
          (p.productCode && p.productCode.trim().replace(/^#/, '').toLowerCase() === cleanSeg) ||
          (p.id && p.id.trim().toLowerCase() === cleanSeg)
        );
        if (found) {
          return { matchedProduct: found, isUrl: true, isCode: false, isInvalidUrl: false, isInvalidCode: false };
        }
      }

      if (urlObj.hash) {
        const cleanHash = decodeURIComponent(urlObj.hash).trim().replace(/^#/, '').toLowerCase();
        const found = products.find(p =>
          (p.productCode && p.productCode.trim().replace(/^#/, '').toLowerCase() === cleanHash) ||
          (p.id && p.id.trim().toLowerCase() === cleanHash)
        );
        if (found) {
          return { matchedProduct: found, isUrl: true, isCode: false, isInvalidUrl: false, isInvalidCode: false };
        }
      }

      return { matchedProduct: null, isUrl: true, isCode: false, isInvalidUrl: true, isInvalidCode: false };
    } catch {
      return { matchedProduct: null, isUrl: true, isCode: false, isInvalidUrl: true, isInvalidCode: false };
    }
  }

  const cleanCode = raw.replace(/^#/, '').trim().toLowerCase();
  const isDirectCodeMatch = products.find(p => {
    const pCode = (p.productCode || '').trim().replace(/^#/, '').toLowerCase();
    const pId = (p.id || '').trim().toLowerCase();
    return pCode === cleanCode || pId === cleanCode || (p.productCode && rawLower === p.productCode.toLowerCase());
  });

  if (isDirectCodeMatch) {
    return { matchedProduct: isDirectCodeMatch, isUrl: false, isCode: true, isInvalidUrl: false, isInvalidCode: false };
  }

  const isCodeCandidate = raw.startsWith('#') || /^sku-|^tnx-/i.test(raw);
  if (isCodeCandidate) {
    return { matchedProduct: null, isUrl: false, isCode: true, isInvalidUrl: false, isInvalidCode: true };
  }

  return { matchedProduct: null, isUrl: false, isCode: false, isInvalidUrl: false, isInvalidCode: false };
};

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'delivery-ad-banner-01',
    tagBn: 'হোম ডেলিভারি',
    tagEn: 'HOME DELIVERY',
    titleLine1Bn: 'অর্ডার করুন ঘরে বসে',
    titleLine1En: 'Order From Home',
    titleLine2Bn: 'হোম ডেলিভারি',
    titleLine2En: 'Home Delivery',
    titleLine3Bn: 'সারা বাংলা দেশে',
    titleLine3En: 'Across Bangladesh',
    subheadBn: 'ফাস্ট ডেলিভারি, হাই কোয়ালিটি এবং ১০০% স্যাটিসফ্যাকশন গ্যারান্টি',
    subheadEn: 'Fast Delivery, High Quality & 100% Satisfaction Guarantee',
    ctaBn: 'পণ্যসমূহ দেখুন',
    ctaEn: 'Explore Products',
    category: 'all',
    image: '/assets/aistudio/Tawzoon_Home_Delivery_Advertisement_4c0ccbb4.png',
    isFullBanner: true,
  },
  {
    id: 1,
    tagBn: 'গুণগত মানের পণ্য',
    tagEn: 'QUALITY ASSURED PRODUCTS',
    titleLine1Bn: 'আপনার প্রতিদিনের',
    titleLine1En: 'Everything For Your',
    titleLine2Bn: 'প্রয়োজনের সবকিছু',
    titleLine2En: 'Daily Needs',
    titleLine3Bn: 'এক জায়গায়',
    titleLine3En: 'In One Place',
    subheadBn: 'নির্বাচিত, মানসম্মত এবং নির্ভরযোগ্য পণ্য এখন আরও সহজে',
    subheadEn: 'Carefully curated, premium, and authentic products delivered with trust',
    ctaBn: 'পণ্যসমূহ দেখুন',
    ctaEn: 'Explore Products',
    category: 'all',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    tagBn: 'স্মার্ট গ্যাজেটস ও টেক',
    tagEn: 'SMART GADGETS & TECH',
    titleLine1Bn: 'আধুনিক লাইফস্টাইলের',
    titleLine1En: 'Modern Lifestyle',
    titleLine2Bn: 'সেরা টেকনোলজি ও স্মার্ট',
    titleLine2En: 'Smart Tech &',
    titleLine3Bn: 'এক্সেসরিজ',
    titleLine3En: 'Accessories',
    subheadBn: 'স্মার্ট ওয়াচ, হেডফোন ও প্রিমিয়াম গ্যাজেট এখন বিশেষ অফারে',
    subheadEn: 'Explore cutting-edge audio, smart wearables, and essentials',
    ctaBn: 'গ্যাজেট দেখুন',
    ctaEn: 'Explore Gadgets',
    category: 'gadgets',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 'others-collection-banner-04',
    tagBn: 'আদার্স প্রোডাক্টস',
    tagEn: 'OTHERS PRODUCTS',
    titleLine1Bn: 'আপনার প্রতিদিনের',
    titleLine1En: 'Everything For Your',
    titleLine2Bn: 'প্রয়োজনের সবকিছু',
    titleLine2En: 'Daily Needs & Essentials',
    titleLine3Bn: 'এক জায়গায়',
    titleLine3En: 'In One Place',
    subheadBn: 'কাপড়, গৃহস্থালি, রান্নাঘরের সামগ্রী, ব্যক্তিগত যত্ন, খেলনা, ছাতা, ব্যাগ এবং আরও অনেক প্রয়োজনীয় পণ্য—সবই এখানে',
    subheadEn: 'Household, kitchenware, personal care, toys, umbrella, bags and more essentials — all here',
    ctaBn: 'আদার্স পণ্য দেখুন',
    ctaEn: 'Explore Others',
    category: 'others',
    image: '/assets/aistudio/image_96f645c2.png',
    desktopImage: '/assets/aistudio/image_a1d50f15.png',
    isFullBanner: true,
  },
];

interface ShopCategoryPageProps {
  categorySlug?: string;
  products: Product[];
  loading?: boolean;
}

interface SubCatItem {
  id: string;
  nameBn: string;
  nameEn: string;
  count: number;
  image: string;
}

interface CategoryGroup {
  id: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  items: SubCatItem[];
}

export const ShopCategoryPage: React.FC<ShopCategoryPageProps> = ({
  categorySlug = 'shop',
  products,
  loading,
}) => {
  const { lang, setPublicCategory, setPublicSearch, showPromo, subsections, brandSettings, categories, publicSearch, showToast, selectedPublicSubcategory, setSelectedPublicSubcategory, selectedProduct, setSelectedProduct } = useApp();

  const currentSlug = categorySlug.toLowerCase().trim();

  // If null -> Category Overview Page
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(selectedPublicSubcategory);

  useEffect(() => {
    setSelectedSubCategory(selectedPublicSubcategory);
  }, [selectedPublicSubcategory]);

  const handleSelectSubCategory = (sub: string | null) => {
    setSelectedSubCategory(sub);
    setSelectedPublicSubcategory(sub);
  };

  // If viewing a product -> Product Details Page
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const prevSearchRef = useRef<string | undefined>(publicSearch);

  // Sync publicSearch from Header search with Public Category page (ONLY when search query actually changes)
  useEffect(() => {
    if (publicSearch === prevSearchRef.current) {
      return;
    }
    const hadSearch = Boolean(prevSearchRef.current && prevSearchRef.current.trim());
    prevSearchRef.current = publicSearch;

    if (publicSearch && publicSearch.trim()) {
      const res = extractProductFromInput(publicSearch, products || []);
      if (res.matchedProduct) {
        setViewingProduct(res.matchedProduct);
        return;
      }
      if (res.isInvalidUrl || res.isInvalidCode) {
        showToast(
          lang === 'bn'
            ? 'ভুল বা অকার্যকর প্রোডাক্ট লিংক বা কোড! কোনো পণ্য পাওয়া যায়নি।'
            : 'Invalid product link or code! No product found.',
          'error'
        );
        return;
      }

      setViewingProduct(null);
      const q = publicSearch.trim();
      const matched = findBestMatchingSubsection(q, subsections || []);
      if (matched) {
        setSelectedSubCategory(matched.name);
      } else {
        let foundSubName: string | null = null;
        const qComp = toCompactKey(q);
        const prodMatch = (products || []).find(p => {
          const pSubBn = toCompactKey(p.subcategoryBn);
          const pSubEn = toCompactKey(p.subcategoryEn);
          return (pSubBn && (pSubBn === qComp || (qComp.length >= 4 && pSubBn.includes(qComp)))) ||
                 (pSubEn && (pSubEn === qComp || (qComp.length >= 4 && pSubEn.includes(qComp))));
        });
        if (prodMatch && prodMatch.subcategoryBn) {
          foundSubName = prodMatch.subcategoryBn;
        }
        setSelectedSubCategory(foundSubName);
      }
    } else if (hadSearch) {
      setViewingProduct(null);
    }
  }, [publicSearch, subsections, products, lang]);

  // Listen to tawzoon_search_submit event
  useEffect(() => {
    const handleSearchSubmit = (e: Event) => {
      const customEvent = e as CustomEvent;
      const query = customEvent.detail?.query || publicSearch;
      if (query && query.trim()) {
        const res = extractProductFromInput(query, products || []);
        if (res.matchedProduct) {
          setViewingProduct(res.matchedProduct);
        } else if (res.isInvalidUrl || res.isInvalidCode) {
          showToast(
            lang === 'bn'
              ? 'ভুল বা অকার্যকর প্রোডাক্ট লিংক বা কোড! কোনো পণ্য পাওয়া যায়নি।'
              : 'Invalid product link or code! No product found.',
            'error'
          );
          setViewingProduct(null);
        }
      }
    };
    window.addEventListener('tawzoon_search_submit', handleSearchSubmit as EventListener);
    return () => window.removeEventListener('tawzoon_search_submit', handleSearchSubmit as EventListener);
  }, [products, lang, publicSearch]);

  const isAllOrShopTab = currentSlug === 'shop_tab' || currentSlug === 'all';
  const isGadget = currentSlug === 'gadgets' || currentSlug === 'gajet' || currentSlug.includes('gadget') || currentSlug.includes('tech');
  const isShop = currentSlug === 'shop' || currentSlug === 'fashion' || currentSlug === 'lifestyle' || currentSlug.includes('cloth') || currentSlug.includes('wear') || currentSlug === 'style';
  const isOther = currentSlug === 'other' || currentSlug === 'others';

  const matchedCatObj = useMemo(() => {
    return (categories || []).find(
      c => isCategoryMatch(c.slug, currentSlug) || c.id === currentSlug
    );
  }, [categories, currentSlug]);

  // Get active hero slide & theme for this category
  const heroSlides = useMemo(() => {
    return (brandSettings?.heroSlides && brandSettings.heroSlides.length > 0)
      ? brandSettings.heroSlides
      : DEFAULT_HERO_SLIDES;
  }, [brandSettings]);

  const activeSlideIndex = useMemo(() => {
    const idx = heroSlides.findIndex(s => isCategoryMatch(s.category, currentSlug) || s.category === currentSlug);
    if (idx !== -1) return idx;
    if (isShop) {
      const sIdx = heroSlides.findIndex(s => s.category === 'shop' || s.id === 'shopping-collection-banner-02');
      if (sIdx !== -1) return sIdx;
      return 1;
    }
    if (isGadget) {
      const gIdx = heroSlides.findIndex(s => s.category === 'gadgets' || s.id === 'gadgets-collection-banner-03');
      if (gIdx !== -1) return gIdx;
      return 2;
    }
    if (isOther) {
      const oIdx = heroSlides.findIndex(s => s.category === 'others' || s.category === 'other' || s.id === 'others-collection-banner-04');
      if (oIdx !== -1) return oIdx;
      return 3;
    }
    return 0;
  }, [currentSlug, heroSlides, isGadget, isShop, isOther]);

  const activeSlide = heroSlides[activeSlideIndex] || DEFAULT_HERO_SLIDES[activeSlideIndex] || DEFAULT_HERO_SLIDES[0];
  const activeTheme = SLIDE_THEMES[activeSlideIndex % SLIDE_THEMES.length];

  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(1000000); // Dynamic max price initialized high
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Find the highest product price in this category to set filter slider dynamically
  const maxProductPrice = useMemo(() => {
    const list = (products || []).filter(
      p => (isAllOrShopTab ? true : isCategoryMatch(p.categorySlug, currentSlug)) && p.isActive !== false && !p.isArchived
    );
    if (list.length === 0) return 10000;
    const maxVal = Math.max(...list.map(p => p.sellingPrice || 0));
    return Math.ceil(maxVal / 1000) * 1000; // Round up to nearest 1,000
  }, [products, currentSlug, isAllOrShopTab]);

  // Sync maxPrice with maximum loaded product price
  useEffect(() => {
    if (maxProductPrice > 0) {
      setMaxPrice(maxProductPrice);
    }
  }, [maxProductPrice]);

  // Drawers
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState<boolean>(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);



  // Dynamic calculation of products matching subcategory / keyword
  const getSubCatCount = (subcatBn: string, subcatEn: string, catSlug?: string) => {
    const isAll = !catSlug || catSlug === 'all' || catSlug === 'shop_tab';
    const activeList = (products || []).filter(
      p => p.isActive !== false && !p.isArchived && (isAll ? true : isCategoryMatch(p.categorySlug, catSlug))
    );

    const sBn = normalizeBengali(subcatBn);
    const sEn = (subcatEn || '').toLowerCase().trim();

    return activeList.filter((p) => {
      const pSubBn = normalizeBengali(p.subcategoryBn);
      const pSubEn = (p.subcategoryEn || '').toLowerCase().trim();
      const pNameBn = normalizeBengali(p.nameBn);
      const pNameEn = (p.nameEn || '').toLowerCase();

      return (
        (pSubBn && (pSubBn.includes(sBn) || sBn.includes(pSubBn))) ||
        (pSubEn && (pSubEn.includes(sEn) || sEn.includes(pSubEn))) ||
        pNameBn.includes(sBn) ||
        pNameEn.includes(sEn)
      );
    }).length;
  };

  // Dynamic Category Configuration from backend Database / Subsections
  const categoryConfig = useMemo(() => {
    const activeSubs = (subsections || []).filter(
      s => s.isActive !== false && (isAllOrShopTab ? true : isCategoryMatch(s.parentSlug, currentSlug))
    );

    // Find parent group subsections (those without parentSub)
    const parentGroups = activeSubs.filter(s => !s.parentSub);

    let groups: CategoryGroup[] = [];

    if (parentGroups.length > 0) {
      groups = parentGroups
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(pg => {
          // Find child items where parentSub matches pg.name
          const childItems = activeSubs
            .filter(s => s.parentSub && s.parentSub.trim() === pg.name.trim())
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const items = childItems.length > 0
            ? childItems.map(item => ({
                id: item.id,
                nameBn: item.name,
                nameEn: item.name,
                count: getSubCatCount(item.name, item.name, currentSlug),
                image: item.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
              }))
            : [{
                id: pg.id,
                nameBn: pg.name,
                nameEn: pg.name,
                count: getSubCatCount(pg.name, pg.name, currentSlug),
                image: pg.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
              }];

          const isGadget = pg.parentSlug === 'gadgets' || pg.name?.toLowerCase().includes('gadget') || pg.name?.includes('গ্যাজেট');
          const isOther = pg.parentSlug === 'other' || pg.name?.toLowerCase().includes('book') || pg.name?.includes('অন্যান্য');

          const bgColor = isGadget ? 'bg-[#f0f9ff]' : isOther ? 'bg-[#faf5ff]' : 'bg-[#f0faf3]';
          const borderColor = isGadget ? 'border-sky-300' : isOther ? 'border-purple-300' : 'border-emerald-300';
          const accentColor = isGadget ? '#0284c7' : isOther ? '#9333ea' : '#009245';

          return {
            id: pg.id,
            titleBn: pg.name,
            titleEn: pg.name,
            subtitleBn: pg.description || '',
            subtitleEn: pg.description || '',
            bgColor,
            borderColor,
            accentColor,
            items,
          };
        });
    } else if (activeSubs.length > 0) {
      // Direct subcategories without parent group
      groups = [
        {
          id: 'direct-subs',
          titleBn: matchedCatObj?.name || (isAllOrShopTab ? 'সকল পণ্য' : currentSlug.toUpperCase()),
          titleEn: matchedCatObj?.name || (isAllOrShopTab ? 'ALL PRODUCTS' : currentSlug.toUpperCase()),
          subtitleBn: 'সাব-ক্যাটাগরি সমূহ',
          subtitleEn: 'Subcategories',
          bgColor: 'bg-[#f0faf3]',
          borderColor: 'border-[#d8f0e0]',
          accentColor: '#009245',
          items: activeSubs.map(item => ({
            id: item.id,
            nameBn: item.name,
            nameEn: item.name,
            count: getSubCatCount(item.name, item.name, currentSlug),
            image: item.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
          })),
        },
      ];
    }

    // Fallback if no subsections configured for this category yet
    if (groups.length === 0) {
      const allCategoryProducts = (products || []).filter(
        p => p.isActive !== false && !p.isArchived && (isAllOrShopTab ? true : isCategoryMatch(p.categorySlug, currentSlug))
      );
      const uniqueSubs = Array.from(new Set(allCategoryProducts.map(p => p.subcategoryBn).filter(Boolean)));
      if (uniqueSubs.length > 0) {
        groups = [
          {
            id: 'default-group',
            titleBn: matchedCatObj?.name || (isAllOrShopTab ? 'সকল পণ্য' : currentSlug.toUpperCase()),
            titleEn: matchedCatObj?.name || (isAllOrShopTab ? 'ALL PRODUCTS' : currentSlug.toUpperCase()),
            subtitleBn: 'সকল প্রোডাক্ট কালেকশন',
            subtitleEn: 'All product collections',
            bgColor: 'bg-[#f0faf3]',
            borderColor: 'border-[#d8f0e0]',
            accentColor: '#009245',
            items: uniqueSubs.map((sub, idx) => ({
              id: `sub-${idx}`,
              nameBn: sub,
              nameEn: sub,
              count: getSubCatCount(sub, sub, currentSlug),
              image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
            })),
          },
        ];
      }
    }

    const titleStr = isAllOrShopTab
      ? (lang === 'bn' ? 'সকল পণ্য' : 'ALL PRODUCTS')
      : isShop
      ? 'SHOP — STYLE'
      : isGadget
      ? 'GADGET — STYLE'
      : isOther
      ? 'OTHER — STYLE'
      : (matchedCatObj?.name ? `${matchedCatObj.name.toUpperCase()} — STYLE` : `${currentSlug.toUpperCase()} — STYLE`);

    const headlineStr = isAllOrShopTab
      ? (lang === 'bn' ? 'সকল মানসম্মত পণ্য এক জায়গায়' : 'All Products in One Place')
      : isShop
      ? (lang === 'bn' ? 'পোশাক, ফ্যাশন ও লাইফস্টাইল কালেকশন' : 'Fashion & Lifestyle Collection')
      : isGadget
      ? (lang === 'bn' ? 'স্মার্ট গ্যাজেটস ও টেকনোলজি কালেকশন' : 'Smart Gadgets & Tech Collection')
      : isOther
      ? (lang === 'bn' ? 'বই, নিত্যপ্রয়োজনীয় ও লাইফস্টাইল কালেকশন' : 'Books, Essentials & Lifestyle Collection')
      : (matchedCatObj?.description || `${matchedCatObj?.name || currentSlug} কালেকশন`);

    return {
      title: titleStr,
      titleBn: isAllOrShopTab
        ? 'সকল পণ্য'
        : isShop
        ? 'SHOP — STYLE'
        : isGadget
        ? (lang === 'bn' ? 'গ্যাজেট — স্টাইল' : 'GADGET — STYLE')
        : isOther
        ? (lang === 'bn' ? 'আদার — স্টাইল' : 'OTHER — STYLE')
        : (matchedCatObj?.name ? `${matchedCatObj.name} — STYLE` : `${currentSlug} — STYLE`),
      bannerHeadlineBn: headlineStr,
      bannerHeadlineEn: 'Curated Collection',
      bannerSubtitleBn: 'মানসম্মত ও ট্রেন্ডি পণ্য এখন এক জায়গায়',
      bannerSubtitleEn: 'Quality products delivered nationwide',
      sloganBn: isGadget
        ? 'স্মার্ট\nলাইফে সেরা\nটেকনোলজি'
        : isOther
        ? 'প্রতিদিনের\nপ্রয়োজনে\nসবকিছু'
        : 'স্টাইলে\nআপনার\nআত্মবিশ্বাস',
      sloganEn: 'Style\nIn Your\nConfidence',
      bannerImage: isGadget
        ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80'
        : isOther
        ? 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000&auto=format&fit=crop&q=80',
      groups,
    };
  }, [currentSlug, subsections, products, lang, isAllOrShopTab, isGadget, isShop, isOther, matchedCatObj]);

  // Database driven products list
  const displayProducts = useMemo(() => {
    let list = (products || []).filter(
      p => p.isActive !== false && !p.isArchived
    );

    if (selectedSubCategory) {
      const sComp = toCompactKey(selectedSubCategory);
      list = list.filter(p => {
        const pSubBn = toCompactKey(p.subcategoryBn);
        const pSubEn = toCompactKey(p.subcategoryEn);
        const pNameBn = toCompactKey(p.nameBn);
        const pNameEn = toCompactKey(p.nameEn);
        return (
          (pSubBn && (pSubBn === sComp || pSubBn.includes(sComp) || sComp.includes(pSubBn))) ||
          (pSubEn && (pSubEn === sComp || pSubEn.includes(sComp) || sComp.includes(pSubEn))) ||
          pNameBn.includes(sComp) ||
          pNameEn.includes(sComp)
        );
      });
    } else if (!isAllOrShopTab) {
      list = list.filter(p => isCategoryMatch(p.categorySlug, currentSlug));
    } else if (publicSearch && publicSearch.trim()) {
      const res = extractProductFromInput(publicSearch, list);
      if (res.matchedProduct) {
        list = [res.matchedProduct];
      } else if (res.isInvalidUrl || res.isInvalidCode) {
        list = [];
      } else {
        const terms = getBilingualSearchTerms(publicSearch);
        list = list.filter(p => {
          const pCode = (p.productCode || '').toLowerCase().trim().replace(/^#/, '');
          const pId = (p.id || '').toLowerCase().trim();
          const pNameBn = normalizeBengali(p.nameBn);
          const pNameEn = (p.nameEn || '').toLowerCase();
          const pSubBn = normalizeBengali(p.subcategoryBn);
          const pSubEn = (p.subcategoryEn || '').toLowerCase();

          return terms.some(t =>
            pCode.includes(t) ||
            pId === t ||
            pNameBn.includes(t) ||
            pNameEn.includes(t) ||
            pSubBn.includes(t) ||
            pSubEn.includes(t)
          );
        });
      }
    }

    // 2. Filter by max price
    if (typeof maxPrice === 'number' && maxPrice > 0) {
      list = list.filter(p => (Number(p.sellingPrice) || 0) <= maxPrice);
    }

    // 3. Filter by selected brands
    if (selectedBrands && selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.some(brand => {
        const bLower = brand.toLowerCase();
        if ((p as any).brand && String((p as any).brand).toLowerCase().includes(bLower)) return true;
        if ((p as any).brandName && String((p as any).brandName).toLowerCase().includes(bLower)) return true;
        if (p.specifications && Array.isArray(p.specifications)) {
          const found = p.specifications.some(s => {
            const k = (s.keyEn || s.keyBn || s.labelEn || s.labelBn || '').toLowerCase();
            const v = (s.valEn || s.valBn || s.valueEn || s.valueBn || '').toLowerCase();
            return (k.includes('brand') || k.includes('ব্র্যান্ড')) && v.includes(bLower);
          });
          if (found) return true;
        }
        const nameBn = (p.nameBn || '').toLowerCase();
        const nameEn = (p.nameEn || '').toLowerCase();
        const descBn = (p.shortDescBn || p.fullDescBn || '').toLowerCase();
        const descEn = (p.shortDescEn || p.fullDescEn || '').toLowerCase();
        if (nameBn.includes(bLower) || nameEn.includes(bLower) || descBn.includes(bLower) || descEn.includes(bLower)) {
          return true;
        }
        if (bLower === 'premium' && (nameBn.includes('প্রিমিয়াম') || nameBn.includes('প্রিমিয়াম') || descBn.includes('প্রিমিয়াম') || descBn.includes('প্রিমিয়াম'))) {
          return true;
        }
        if (bLower === 'original' && (nameBn.includes('অরিজিনাল') || descBn.includes('অরিজিনাল') || nameBn.includes('আসল'))) {
          return true;
        }
        if (bLower === 'local' && (nameBn.includes('লোকাল') || nameBn.includes('দেশি') || nameBn.includes('দেশী'))) {
          return true;
        }
        if (bLower === 'imported' && (nameBn.includes('ইম্পোর্টেড') || nameBn.includes('আমদানি') || descBn.includes('ইম্পোর্টেড'))) {
          return true;
        }
        return false;
      }));
    }

    // 4. Filter by minimum rating
    if (selectedRating && selectedRating > 0) {
      list = list.filter(p => {
        const r = p.starRating ? Number(p.starRating) : 5.0;
        return r >= selectedRating;
      });
    }

    // 5. Sorting options
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (Number(a.sellingPrice) || 0) - (Number(b.sellingPrice) || 0));
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => (Number(b.sellingPrice) || 0) - (Number(a.sellingPrice) || 0));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else {
      // Default: 'popular'
      list = [...list].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.isFeatured) scoreA += 500;
        if (b.isFeatured) scoreB += 500;
        if (a.isTrending) scoreA += 300;
        if (b.isTrending) scoreB += 300;
        if (a.isNewArrival) scoreA += 100;
        if (b.isNewArrival) scoreB += 100;
        const ratingA = a.starRating ? Number(a.starRating) : 5.0;
        const ratingB = b.starRating ? Number(b.starRating) : 5.0;
        scoreA += ratingA * 20;
        scoreB += ratingB * 20;
        const countA = 50 + (a.id ? a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 80 : 40);
        const countB = 50 + (b.id ? b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 80 : 40);
        scoreA += countA;
        scoreB += countB;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [currentSlug, products, selectedSubCategory, publicSearch, maxPrice, selectedBrands, selectedRating, sortBy, isAllOrShopTab]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleRating = (stars: number) => {
    setSelectedRating(prev => (prev === stars ? null : stars));
  };

  const handleResetFilters = () => {
    setMaxPrice(maxProductPrice);
    setSelectedBrands([]);
    setSelectedRating(null);
  };

  // If a product is clicked, render Image 4: Dedicated Product Details Page!
  const activeViewingProduct = viewingProduct || selectedProduct;
  if (activeViewingProduct) {
    return (
      <ProductDetailsPage
        product={activeViewingProduct}
        onBack={() => {
          const isAdding = typeof window !== 'undefined' && sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true';
          if (isAdding && (!categorySlug || categorySlug === 'all')) {
            const targetCat = activeViewingProduct.categorySlug || sessionStorage.getItem('tawzoon_last_browsed_category') || 'shop';
            setPublicCategory(targetCat);
          }
          setViewingProduct(null);
          setSelectedProduct(null);
        }}
        categoryProducts={displayProducts}
        onSelectRelated={(prod) => {
          setViewingProduct(prod);
          setSelectedProduct(prod);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-2 sm:pb-3 space-y-2.5 sm:space-y-3.5">
      <ScrollReveal className="space-y-2.5 sm:space-y-3.5" delay={0} duration={300}>
      
      {/* ------------------------------------------------------------- */}
      {/* CASE 1: CATEGORY OVERVIEW PAGE (Only when no search is active) */}
      {/* ------------------------------------------------------------- */}
      {selectedSubCategory === null && !publicSearch?.trim() ? (
        <div className="space-y-2.5 sm:space-y-3.5">
          
          {/* Top Strip Bar: Conditional layer depending on whether opened from 'সকল পণ্য' bottom tab or Homepage explore */}
          {currentSlug === 'shop_tab' ? (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  onClick={() => setPublicCategory('all')}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold text-slate-500 truncate">
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[#009245] font-black truncate flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#009245] shrink-0" />
                    <span>{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                  </span>
                </nav>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/50 shadow-2xs shrink-0">
                {categoryConfig.groups.length} {lang === 'bn' ? 'টি ক্যাটাগরি' : 'Categories'}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setPublicCategory('all');
                    setSelectedPublicSubcategory(null);
                    setPublicSearch('');
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold text-slate-500 truncate">
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[#009245] font-black uppercase truncate">
                    {categoryConfig.title}
                  </span>
                </nav>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/50 shadow-2xs shrink-0">
                {categoryConfig.groups.length} {lang === 'bn' ? 'টি ক্যাটাগরি' : 'Categories'}
              </div>
            </div>
          )}

          {/* Category Groups / Subsections */}
          <div className="space-y-3 sm:space-y-4">
            {categoryConfig.groups.length === 0 ? (
              loading ? (
                <div className="bg-[#f0faf3] border border-[#d8f0e0]/70 rounded-2xl p-4 sm:p-5 space-y-3 animate-pulse">
                  <div className="h-5 w-40 bg-emerald-200/60 rounded-md" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-xl border border-slate-100 p-2 space-y-2">
                        <div className="aspect-square bg-slate-100 rounded-lg" />
                        <div className="h-2.5 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#009245] flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {lang === 'bn' ? `${categoryConfig.title} এ এখনো কোনো পণ্য বা সাব-ক্যাটাগরি নেই` : `No items in ${categoryConfig.title} yet`}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {lang === 'bn'
                      ? 'অ্যাডমিন প্যানেল থেকে এই ক্যাটাগরিতে সাব-ক্যাটাগরি বা পণ্য যোগ করলে তা এখানে স্বয়ংক্রিয়ভাবে লাইভ হবে।'
                      : 'Adding products or subcategories to this category in the admin panel will automatically show them here.'}
                  </p>
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}</span>
                  </button>
                </div>
              )
            ) : (
              categoryConfig.groups.map((group) => (
                <div
                  key={group.id}
                  className={`${group.bgColor} border ${group.borderColor} rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5 shadow-xs transition-shadow duration-300`}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-0.5 sm:pb-1">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span
                          className="w-3 sm:w-4 h-1 sm:h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: group.accentColor }}
                        />
                        <h2 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight">
                          {lang === 'bn' ? group.titleBn : group.titleEn}
                        </h2>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 font-normal mt-0.5 line-clamp-1">
                        {lang === 'bn' ? group.subtitleBn : group.subtitleEn}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const target = (group.items && group.items.length > 0 && group.items[0]?.nameBn) ? group.items[0].nameBn : (group.titleBn || 'all');
                        handleSelectSubCategory(target);
                      }}
                      className="text-[10px] sm:text-xs font-bold text-slate-800 hover:text-[#009245] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'View All'}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  {/* Sub-categories Grid (Exact Card Layout from Image 2) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSubCategory(item.nameBn)}
                        className="group cursor-pointer bg-white rounded-xl border border-slate-300 hover:border-[#009245] p-1.5 sm:p-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between active:scale-95 shadow-2xs"
                      >
                        {/* Image container */}
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 mb-1 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.nameBn}
                            className="w-full h-full object-cover object-center rounded-lg group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Category Title (Full 1-Line without any truncation) */}
                        <div className="pt-0.5 pb-1">
                          <h4 className="text-[8.5px] sm:text-xs font-black text-slate-900 group-hover:text-[#009245] transition-colors leading-tight whitespace-nowrap overflow-visible tracking-tight">
                            {lang === 'bn' ? item.nameBn : item.nameEn}
                          </h4>
                        </div>

                        {/* Bottom Row: Highlighted Product Count & Arrow Button */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                          {/* Highlighted Product Count Badge */}
                          <span className="bg-emerald-50 text-[#009245] font-extrabold text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-300/80 shadow-2xs">
                            {item.count} {lang === 'bn' ? 'পণ্য' : 'items'}
                          </span>

                          {/* Arrow Button */}
                          <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-slate-100 group-hover:bg-[#009245] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* CASE 2: CATEGORY / PRODUCT LISTING PAGE (No Banner, 1-Line Filters) */
        /* ------------------------------------------------------------- */
        <div className="space-y-2.5 sm:space-y-3.5">
          
          {/* Top Strip Bar when Subcategory is active */}
          {currentSlug === 'shop_tab' ? (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    if (publicSearch && publicSearch.trim()) {
                      setPublicSearch('');
                      setSelectedPublicSubcategory(null);
                      setSelectedSubCategory(null);
                    } else if (selectedSubCategory !== null) {
                      handleSelectSubCategory(null);
                    } else {
                      setPublicCategory('all');
                      setSelectedPublicSubcategory(null);
                      setPublicSearch('');
                    }
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className="hover:text-[#009245] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#009245]" />
                    <span>{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-black truncate">
                    {selectedSubCategory || (lang === 'bn' ? `"${publicSearch}" এর সার্চ রেজাল্ট` : `Search: "${publicSearch}"`)}
                  </span>
                </div>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/50 shadow-2xs shrink-0">
                {displayProducts.length} {lang === 'bn' ? 'টি পণ্য' : 'Items'}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    if (publicSearch && publicSearch.trim()) {
                      setPublicSearch('');
                      setSelectedPublicSubcategory(null);
                      setSelectedSubCategory(null);
                    } else if (selectedSubCategory !== null) {
                      handleSelectSubCategory(null);
                    } else {
                      setPublicCategory('all');
                      setSelectedPublicSubcategory(null);
                      setPublicSearch('');
                    }
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-[13px] font-semibold text-slate-500 truncate">
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 sm:gap-1.5 transition-colors shrink-0"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors uppercase font-bold text-slate-600 dark:text-slate-300 shrink-0 truncate max-w-[90px] sm:max-w-none"
                  >
                    {categoryConfig.title}
                  </button>
                  <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-black truncate">
                    {selectedSubCategory || (lang === 'bn' ? `"${publicSearch}" এর সার্চ রেজাল্ট` : `Search: "${publicSearch}"`)}
                  </span>
                </nav>
              </div>
            </div>
          )}

          {/* Section Bar: Title & Count + Non-Scrollable 100% Fit 1-Line Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-1.5 sm:p-2.5 rounded-lg border border-sky-200/80 dark:border-sky-900/50 shadow-2xs space-y-1 sm:space-y-1.5">
            
            {/* Title & Count */}
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {selectedSubCategory || (lang === 'bn' ? `"${publicSearch}" এর সার্চ রেজাল্ট` : `Search: "${publicSearch}"`)}
              </h2>
              <span className="bg-emerald-50 text-[#009245] border border-emerald-200/50 text-[9px] sm:text-[10.5px] font-bold px-1.5 py-0.5 rounded-full">
                {displayProducts.length} {lang === 'bn' ? 'টি পণ্য' : 'items'}
              </span>
            </div>

            {/* Exact 100% Width Fit (Zero Scrollbar on any screen) */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 w-full text-xs">
              
              {/* Category Button */}
              <button
                onClick={() => {
                  setCategoryDrawerOpen(prev => !prev);
                  setFilterDrawerOpen(false);
                }}
                className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 border py-1 sm:py-1.5 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  categoryDrawerOpen
                    ? 'bg-[#009245] text-white border-[#009245]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <Shirt className={`w-3.5 h-3.5 shrink-0 ${categoryDrawerOpen ? 'text-white' : 'text-[#009245]'}`} />
                <span className="truncate">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
              </button>

              {/* Filter Button */}
              <button
                onClick={() => {
                  setFilterDrawerOpen(prev => !prev);
                  setCategoryDrawerOpen(false);
                }}
                className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 border py-1 sm:py-1.5 px-1.5 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  filterDrawerOpen
                    ? 'bg-[#009245] text-white border-[#009245]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/80 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 shrink-0 ${filterDrawerOpen ? 'text-white' : 'text-[#009245]'}`} />
                <span className="truncate">{lang === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex-[1.2] min-w-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-lg py-1 sm:py-1.5 px-1 sm:px-2 text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:border-[#009245] shadow-2xs cursor-pointer text-[10px] sm:text-xs truncate"
                >
                  <option value="popular">{lang === 'bn' ? 'জনপ্রিয়তা' : 'Popular'}</option>
                  <option value="newest">{lang === 'bn' ? 'নতুন পণ্য' : 'Newest'}</option>
                  <option value="price_asc">{lang === 'bn' ? 'দাম: কম' : 'Price: Low'}</option>
                  <option value="price_desc">{lang === 'bn' ? 'দাম: বেশি' : 'Price: High'}</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800 shadow-2xs shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 md:p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#009245] text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 md:p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#009245] text-white'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              {/* Items Per Page Dropdown (Desktop Only) */}
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-lg md:rounded-xl px-2.5 py-1.5 md:py-2.5 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#009245] shadow-2xs cursor-pointer text-[11px] md:text-sm hidden md:block shrink-0"
              >
                <option value={24}>{lang === 'bn' ? '২৪ টি প্রতি পেজ' : '24 per page'}</option>
                <option value={36}>{lang === 'bn' ? '৩৬ টি প্রতি পেজ' : '36 per page'}</option>
                <option value={48}>{lang === 'bn' ? '৪৮ টি প্রতি পেজ' : '48 per page'}</option>
              </select>

            </div>

            {/* Inline Filter Panel: Positioned directly beneath Filter button, spans 100% width with ZERO side gap! */}
            {filterDrawerOpen && (
              <div className="p-3 sm:p-4 mt-2 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#009245] rounded-full inline-block" />
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      {lang === 'bn' ? 'ফিল্টার করুন' : 'Filter Products'}
                    </h4>
                  </div>
                  <button
                    onClick={() => setFilterDrawerOpen(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center border border-slate-200/80 dark:border-slate-600 shadow-2xs group active:scale-95"
                    title={lang === 'bn' ? 'ফিল্টার বন্ধ করুন' : 'Close Filter'}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300" />
                  </button>
                </div>

                {/* Max Price Slider */}
                <div className="space-y-1.5 bg-white dark:bg-slate-850 p-2.5 sm:p-3 rounded-lg border border-slate-200/70 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px]">
                    <span>{lang === 'bn' ? 'সর্বোচ্চ দাম (৳)' : 'Max Price (৳)'}</span>
                    <span className="font-mono text-[#009245] font-black text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800">৳{maxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max={Math.max(10000, maxProductPrice)}
                    step={maxProductPrice > 50000 ? "1000" : "250"}
                    value={maxPrice > Math.max(10000, maxProductPrice) ? Math.max(10000, maxProductPrice) : maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#009245] cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                    <span>৳ ৫০০</span>
                    <span>৳ {Math.max(10000, maxProductPrice).toLocaleString()}+</span>
                  </div>
                </div>

                {/* Brand & Rating grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Brand */}
                  <div className="space-y-1.5">
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#009245]" />
                      <span>{lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Premium', 'Original', 'Local', 'Imported'].map((brand) => (
                        <label
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2.5 rounded-lg border transition-all ${
                            selectedBrands.includes(brand)
                              ? 'bg-emerald-50 border-[#009245] text-[#007a3a] dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 font-black shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-600 text-slate-900 dark:text-white font-bold hover:border-emerald-400 hover:bg-emerald-50/30 shadow-2xs'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              selectedBrands.includes(brand)
                                ? 'bg-[#009245] border-[#009245] text-white shadow-2xs'
                                : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {selectedBrands.includes(brand) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-black tracking-wide truncate">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-1.5">
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{lang === 'bn' ? 'রেটিং' : 'Rating'}</span>
                    </h5>
                    <div className="space-y-1.5">
                      {[5, 4, 3].map((stars) => (
                        <label
                          key={stars}
                          onClick={() => toggleRating(stars)}
                          className={`flex items-center gap-2 cursor-pointer select-none py-1.5 px-2.5 rounded-lg border transition-all ${
                            selectedRating === stars
                              ? 'bg-emerald-50 border-[#009245] text-[#007a3a] dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 font-black shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-600 text-slate-900 dark:text-white font-bold hover:border-emerald-400 hover:bg-emerald-50/30 shadow-2xs'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              selectedRating === stars
                                ? 'bg-[#009245] border-[#009245] text-white shadow-2xs'
                                : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {selectedRating === stars && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {[...Array(stars)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-1">
                              {stars} {lang === 'bn' ? 'স্টার ও উপরে' : 'Stars & up'}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="py-1.5 sm:py-2 px-3 sm:px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {displayProducts.length} {lang === 'bn' ? 'টি পণ্য পাওয়া গেছে' : 'items found'}
                    </span>
                    <button
                      onClick={() => setFilterDrawerOpen(false)}
                      className="py-1.5 sm:py-2 px-4 sm:px-5 bg-[#009245] hover:bg-[#007a3a] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Category Panel: Positioned directly beneath Category button, spans 100% width with ZERO side gap! */}
            {categoryDrawerOpen && (
              <div className="pt-3 mt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-4 bg-[#009245] rounded-full inline-block" />
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm md:text-base">
                      {lang === 'bn' ? 'ক্যাটাগরি সমূহ' : 'All Categories'}
                    </h4>
                  </div>
                  <button
                    onClick={() => setCategoryDrawerOpen(false)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center border border-slate-200/80 dark:border-slate-600 shadow-2xs group active:scale-95"
                    title={lang === 'bn' ? 'ক্যাটাগরি বন্ধ করুন' : 'Close Categories'}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:rotate-90 group-hover:scale-115 transition-transform duration-300 animate-pulse group-hover:animate-none" />
                  </button>
                </div>

                <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
                  <button
                    onClick={() => {
                      setSelectedSubCategory(null);
                      setCategoryDrawerOpen(false);
                    }}
                    className={`w-full text-left py-2 md:py-2.5 px-3 md:px-4 rounded-xl text-xs md:text-sm font-bold flex items-center justify-between border transition-all cursor-pointer shadow-2xs ${
                      selectedSubCategory === null
                        ? 'bg-[#009245] text-white border-[#009245] shadow-xs'
                        : 'text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shirt className={`w-4 h-4 ${selectedSubCategory === null ? 'text-white' : 'text-[#009245]'}`} />
                      <span>{categoryConfig.title} ({lang === 'bn' ? 'সকল' : 'All'})</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
                  </button>

                  {categoryConfig.groups.map((group) => (
                    <div key={group.id} className="space-y-1.5 md:space-y-2 pt-1">
                      <h5 className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                        {group.titleBn}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2">
                        {group.items.map((subcat) => (
                          <button
                            key={subcat.id}
                            onClick={() => {
                              setSelectedSubCategory(subcat.nameBn);
                              setCategoryDrawerOpen(false);
                            }}
                            className={`w-full text-left py-1.5 md:py-2.5 px-2.5 md:px-3.5 rounded-lg md:rounded-xl text-[11px] md:text-sm font-bold flex items-center justify-between transition-all border cursor-pointer shadow-2xs ${
                              selectedSubCategory === subcat.nameBn
                                ? 'bg-[#009245] text-white border-[#009245] shadow-xs'
                                : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 md:gap-2 truncate">
                              <Shirt className={`w-3.5 h-3.5 md:w-4 md:h-4 shrink-0 ${selectedSubCategory === subcat.nameBn ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{subcat.nameBn}</span>
                            </div>
                            <span className={`text-[10px] md:text-xs font-semibold shrink-0 ml-1.5 ${selectedSubCategory === subcat.nameBn ? 'text-emerald-100' : 'text-slate-400'}`}>
                              ({subcat.count})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Clean Product Grid or List View or Empty State */}
          {displayProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    compact={true}
                    viewMode="grid"
                    onCardClick={() => setViewingProduct(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    compact={true}
                    viewMode="list"
                    onCardClick={() => setViewingProduct(product)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-6 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#009245] mx-auto shadow-2xs">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {selectedSubCategory
                  ? (lang === 'bn' ? `"${selectedSubCategory}" এ বর্তমানে কোনো পণ্য নেই` : `No products found in "${selectedSubCategory}"`)
                  : (lang === 'bn' ? `"${publicSearch || ''}" এর জন্য কোনো পণ্য পাওয়া যায়নি` : `No products found for "${publicSearch || ''}"`)}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {lang === 'bn'
                  ? 'এই সাব-ক্যাটাগরিতে শীঘ্রই নতুন স্টক যুক্ত করা হবে। এই ক্যাটাগরির অন্যান্য সকল পণ্য দেখতে নিচের বাটনে ক্লিক করুন।'
                  : 'New stocks will be added soon. Click below to view all available products in this category.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory(null)}
                  className="bg-[#009245] hover:bg-[#007a3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === 'bn' ? `সকল ${categoryConfig.title} পণ্য দেখুন` : `View All ${categoryConfig.title} Products`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      </ScrollReveal>
    </div>
  );
};
