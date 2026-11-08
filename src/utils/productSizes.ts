import { Product } from '../types/index.js';

/**
 * Returns available sizes for a product.
 * Prioritizes:
 * 1. Product's own `sizes` array (if non-empty)
 * 2. Size specification from `specifications`
 * 3. Parsed size information from product descriptions
 * 4. Default clothing sizes ['M', 'L', 'XL', 'XXL'] if the product is fashion/apparel
 * 5. Empty array for non-apparel items (e.g. phones, gadgets)
 */
export const getProductSizes = (product?: Product | null): string[] => {
  if (!product) return [];

  // 1. Explicit sizes array
  if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
    const cleanSizes = product.sizes
      .map(s => String(s).trim())
      .filter(Boolean);
    if (cleanSizes.length > 0) {
      return cleanSizes;
    }
  }

  // 2. Specifications check
  if (product.specifications && Array.isArray(product.specifications)) {
    const sizeSpec = product.specifications.find(
      s => s.keyBn === 'সাইজ' || s.keyEn?.toLowerCase() === 'size' || s.labelBn === 'সাইজ' || s.labelEn?.toLowerCase() === 'size'
    );
    if (sizeSpec) {
      const val = sizeSpec.valBn || sizeSpec.valEn || sizeSpec.valueBn || sizeSpec.valueEn || '';
      const tokens = val.split(/[,/| \s\t]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
      if (tokens.length > 0) {
        return Array.from(new Set(tokens));
      }
    }
  }

  // 3. Description parsing
  const desc = `${product.fullDescBn || ''} ${product.shortDescBn || ''} ${product.fullDescEn || ''} ${product.shortDescEn || ''}`;
  const sizeMatch = desc.match(/(?:Available\s*Sizes?|Sizes?|সাইজ|উপলব্ধ\s*সাইজ)\s*[:：\-]?\s*([^\n\r]+)/i);
  if (sizeMatch && sizeMatch[1]) {
    const raw = sizeMatch[1].replace(/[|/,\s]+/g, ' ').trim();
    const tokens = raw.split(/\s+/).map(t => t.trim().toUpperCase());
    const valid = tokens.filter(t =>
      ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', 'FREE'].includes(t)
    );
    if (valid.length > 0) {
      return Array.from(new Set(valid));
    }
  }

  // 4. Apparel / Fashion category fallback
  const cat = (product.categorySlug || '').toLowerCase();
  const subcatBn = (product.subcategoryBn || '').toLowerCase();
  const subcatEn = (product.subcategoryEn || '').toLowerCase();
  const nameBn = (product.nameBn || '').toLowerCase();
  const nameEn = (product.nameEn || '').toLowerCase();

  const isFashion =
    cat === 'shop' ||
    cat === 'fashion' ||
    cat === 'clothing' ||
    subcatBn.includes('কাতুয়া') ||
    subcatEn.includes('katua') ||
    subcatBn.includes('পাঞ্জাবি') ||
    subcatBn.includes('শার্ট') ||
    subcatBn.includes('টিশার্ট') ||
    subcatBn.includes('ড্রেস') ||
    nameBn.includes('katuwa') ||
    nameBn.includes('katua') ||
    nameEn.includes('katuwa') ||
    nameEn.includes('katua');

  if (isFashion) {
    return ['M', 'L', 'XL', 'XXL'];
  }

  return [];
};
