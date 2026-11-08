import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOfficialReferenceCode,
  getEffectiveResellerMargin,
  getResellerWholesalePrice,
  getResellerProfitPerUnit,
  getStarDiscountPercent,
} from './pricing.ts';

test('isOfficialReferenceCode detects valid official codes', () => {
  assert.equal(isOfficialReferenceCode('TAWZOON9516'), true);
  assert.equal(isOfficialReferenceCode('tawzoon9516'), true);
  assert.equal(isOfficialReferenceCode('OFFICIAL_TAWZOON'), true);
  assert.equal(isOfficialReferenceCode('RANDOM_CODE'), false);
  assert.equal(isOfficialReferenceCode(null), false);
});

test('getEffectiveResellerMargin calculates correctly', () => {
  const brandSettings: any = { officialReferralCode: 'TAWZOON9516', nonOfficialMarkup: 10 };
  const officialReseller: any = { isOfficialReferral: true, resellerMargin: 0 };
  const generalReseller: any = { isOfficialReferral: false, resellerMargin: 10 };
  const customReseller: any = { isOfficialReferral: false, resellerMargin: 25 };

  assert.equal(getEffectiveResellerMargin(null, officialReseller, brandSettings), 0);
  assert.equal(getEffectiveResellerMargin(null, generalReseller, brandSettings), 10);
  assert.equal(getEffectiveResellerMargin(null, customReseller, brandSettings), 25);
  assert.equal(getEffectiveResellerMargin(null, null, brandSettings), 0);
});

test('getResellerWholesalePrice and profit calculations work as expected', () => {
  const testProduct: any = {
    id: 'prod-01',
    baseWholesalePrice: 470,
    originalPrice: 470,
    sellingPrice: 520,
  };
  const brandSettings: any = { officialReferralCode: 'TAWZOON9516', nonOfficialMarkup: 10 };
  const officialReseller: any = { isOfficialReferral: true, resellerMargin: 0 };
  const generalReseller: any = { isOfficialReferral: false, resellerMargin: 10 };

  assert.equal(getResellerWholesalePrice(testProduct, officialReseller, brandSettings), 470);
  assert.equal(getResellerProfitPerUnit(testProduct, officialReseller, brandSettings, 520), 50);

  assert.equal(getResellerWholesalePrice(testProduct, generalReseller, brandSettings), 480);
  assert.equal(getResellerProfitPerUnit(testProduct, generalReseller, brandSettings, 520), 40);
});

test('getStarDiscountPercent returns proper discount percentages', () => {
  assert.equal(getStarDiscountPercent(5), 10);
  assert.equal(getStarDiscountPercent(4), 15);
  assert.equal(getStarDiscountPercent(3), 20);
  assert.equal(getStarDiscountPercent(2), 25);
  assert.equal(getStarDiscountPercent(1), 30);
});
