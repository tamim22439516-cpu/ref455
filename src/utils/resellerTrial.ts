import { BrandSettings, Employee } from '../types/index.js';

export interface ResellerTrialDetails {
  isTrialEnabled: boolean;
  isPaid: boolean;
  isExpired: boolean;
  isActiveTrial: boolean;
  startDate: Date;
  startDateFormattedBn: string;
  startDateFormattedEn: string;
  expiryDate: Date;
  expiryDateFormattedBn: string;
  expiryDateFormattedEn: string;
  elapsedDays: number;
  totalTrialDays: number;
  remainingDays: number;
  remainingHours: number;
  progressPercentage: number;
  fee: number;
  durationText: string;
  paymentPhone: string;
  noticeBn: string;
  statusBadge: {
    labelBn: string;
    labelEn: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: string;
  };
}

export function calculateResellerTrial(
  employee: Partial<Employee> | null | undefined,
  brandSettings: Partial<BrandSettings> | null | undefined
): ResellerTrialDetails {
  const isTrialEnabled = brandSettings?.resellerTrialEnabled !== false;
  const isOfficial = Boolean(
    employee?.isOfficialReferral === true ||
    employee?.reference?.toUpperCase() === 'TAWZOON9516' ||
    (employee as any)?.referredBy?.toUpperCase() === 'TAWZOON9516'
  );

  const isPaid = Boolean(
    isOfficial ||
    employee?.isPaidSubscription === true ||
    employee?.subscriptionStatus === 'active' ||
    employee?.subscriptionStatus === 'exempt'
  );

  // Registration / Trial start date determination
  const rawDateStr = employee?.trialStartedAt || employee?.registeredAt;
  let startDate = new Date();
  if (rawDateStr) {
    const parsed = new Date(rawDateStr);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  const now = new Date();
  const startTime = startDate.getTime();
  const nowTime = now.getTime();
  
  // Base trial days: custom per employee OR global setting (default 7 days)
  const baseDays = employee?.customTrialDays ?? brandSettings?.resellerTrialDays ?? 7;
  const extendedDays = employee?.trialExtendedDays ?? 0;
  const totalTrialDays = Math.max(1, baseDays + extendedDays);

  // Exact expiry timestamp
  const expiryTime = startTime + totalTrialDays * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(expiryTime);

  // Elapsed days calculation
  const diffTimeMs = Math.max(0, nowTime - startTime);
  const elapsedDays = Math.floor(diffTimeMs / (1000 * 60 * 60 * 24));

  // Remaining days calculation
  const remainingMs = Math.max(0, expiryTime - nowTime);
  const remainingDays = isPaid
    ? totalTrialDays
    : Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  
  const remainingHours = Math.max(0, Math.floor((remainingMs / (1000 * 60 * 60)) % 24));

  const isExpired = !isPaid && isTrialEnabled && remainingDays === 0;
  const isActiveTrial = !isPaid && isTrialEnabled && remainingDays > 0;

  // Progress percentage (0% = just started, 100% = trial ended)
  const progressPercentage = isPaid
    ? 100
    : Math.min(100, Math.max(0, Math.round(((totalTrialDays - remainingDays) / totalTrialDays) * 100)));

  const fee = brandSettings?.resellerSubscriptionFee ?? 500;
  const durationText = brandSettings?.resellerSubscriptionDuration || '১ বছর';
  const paymentPhone = brandSettings?.resellerSubscriptionPaymentPhone || brandSettings?.whatsappNumber || '01700000000';
  const noticeBn = brandSettings?.resellerSubscriptionNoticeBn ||
    `আপনার অ্যাকাউন্টের ${totalTrialDays} দিনের ফ্রি ট্রায়াল মেয়াদ সম্পন্ন হয়েছে। নিয়মিত পণ্য বিক্রয়, কমিশন ও সম্পূর্ণ সেবা সচল রাখতে সাবস্ক্রিপশন ফি (৳${fee}) পরিশোধ করুন।`;

  // Formatted date representations
  const startDateFormattedBn = startDate.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const startDateFormattedEn = startDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const expiryDateFormattedBn = expiryDate.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const expiryDateFormattedEn = expiryDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  let statusBadge = {
    labelBn: `ট্রায়াল: ${remainingDays} দিন বাকি`,
    labelEn: `Trial: ${remainingDays}d left`,
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    icon: '⏳'
  };

  if (isOfficial) {
    statusBadge = {
      labelBn: 'অফিসিয়াল রেফারেল (ফি মুক্ত)',
      labelEn: 'Official Referral (Exempt)',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
      icon: '⭐'
    };
  } else if (isPaid) {
    statusBadge = {
      labelBn: 'পেইড সাবস্ক্রিপশন (সক্রিয়)',
      labelEn: 'Paid Active',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-300',
      icon: '👑'
    };
  } else if (!isTrialEnabled) {
    statusBadge = {
      labelBn: 'আনলিমিটেড ফ্রি',
      labelEn: 'Unlimited Free',
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-700',
      borderClass: 'border-slate-300',
      icon: '⚪'
    };
  } else if (isExpired) {
    statusBadge = {
      labelBn: 'ট্রায়াল শেষ (পেইড আবশ্যক)',
      labelEn: 'Trial Expired',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-300',
      icon: '⚠️'
    };
  } else if (remainingDays <= 2) {
    statusBadge = {
      labelBn: `ট্রায়াল শেষ হচ্ছে: ${remainingDays} দিন বাকি`,
      labelEn: `Expiring Soon: ${remainingDays}d`,
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-900',
      borderClass: 'border-amber-400',
      icon: '🔥'
    };
  }

  return {
    isTrialEnabled,
    isPaid,
    isExpired,
    isActiveTrial,
    startDate,
    startDateFormattedBn,
    startDateFormattedEn,
    expiryDate,
    expiryDateFormattedBn,
    expiryDateFormattedEn,
    elapsedDays,
    totalTrialDays,
    remainingDays,
    remainingHours,
    progressPercentage,
    fee,
    durationText,
    paymentPhone,
    noticeBn,
    statusBadge
  };
}
