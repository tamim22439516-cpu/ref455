export type Language = 'bn' | 'en';

export interface Category {
  id: string;
  slug: string; // 'shop' | 'gadgets' | 'others' | custom
  name: string; // Single title field as requested by user
  nameBn?: string;
  description: string; // Single description field
  imageUrl: string;
  order: number;
  isActive: boolean;
  itemCount?: number;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary?: boolean;
  order: number;
}

export interface ProductSpecification {
  keyBn?: string;
  keyEn?: string;
  valBn?: string;
  valEn?: string;
  labelBn?: string;
  labelEn?: string;
  valueBn?: string;
  valueEn?: string;
}

export type UserNavTab = 'home' | 'products' | 'sales' | 'earnings' | 'profile';

export interface Product {
  id: string;
  productCode: string;
  nameBn: string;
  nameEn: string;
  categorySlug: string;
  subcategoryBn: string;
  subcategoryEn: string;
  // NOTE: originalPrice is internal and only present in admin responses!
  originalPrice?: number;
  regularPrice?: number;
  sellingPrice: number;
  imageUrl?: string;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number; // e.g., 20 (%) or 300 (BDT)
  shortDescBn: string;
  shortDescEn: string;
  fullDescBn: string;
  fullDescEn: string;
  images: ProductImage[];
  // Video & Marketing
  videoType?: 'youtube' | 'upload' | 'none';
  videoUrl?: string; // YouTube URL or Uploaded Video URL
  youtubeId?: string; // Auto-extracted YouTube video ID
  marketingHighlights?: string[];
  marketingCaptionBn?: string;
  marketingCaptionEn?: string;
  colors: string[];
  sizes: string[];
  specifications: ProductSpecification[];
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  stockQuantity?: number;
  starRating?: number; // 1 to 5 star popularity indicator controlled by admin
  originalProductId?: string; // Cart reference to master product ID
  quantity?: number; // Selected order quantity in cart
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWallet {
  availableBalance: number;
  pendingWithdrawal: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingPenalty?: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  referenceCode?: string;
  district?: string;
  thana?: string;
  reference?: string;
  isOfficialReferral?: boolean;
  referralOwnerId?: string;
  referralOwnerName?: string;
  referralOwnerPhone?: string;
  referredBy?: string;
  role: 'EMPLOYEE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ARCHIVED';
  registeredAt: string;
  approvedAt?: string;
  customCommissionRate?: number; // Optional override
  resellerMargin?: number; // Admin defined margin / fixed payout per sale in TK (default 10 TK, 0 for official)
  referralMargin?: number; // Referral margin added to downlines' wholesale purchase price (default 10 TK)
  purchaseMarkup?: number; // Effective markup applied to this employee's own purchases
  referralCommissionRate?: number; // Referral commission percentage (default 10 for 10%)
  referralMaxBonusCap?: number; // Maximum referral commission cap in TK per sale (default 10 TK)
  downlineCustomRates?: Record<string, number>; // Specific member commission override: { [memberEmployeeId]: number }
  downlineCustomCaps?: Record<string, number>; // Specific member max cap override: { [memberEmployeeId]: number }
  wallet: EmployeeWallet;
  // Reseller Trial & Subscription
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'exempt';
  subscriptionExpiryDate?: string;
  isPaidSubscription?: boolean;
  customTrialDays?: number;
  trialExtendedDays?: number;
  trialStartedAt?: string;
  trialExpiryDate?: string;
  subscriptionPaymentStatus?: 'UNPAID' | 'PENDING' | 'PAID' | 'REJECTED';
  // Custom Store Fields
  storeSlug?: string;
  storeName?: string;
  storeLogoUrl?: string;
  storeWhatsapp?: string;
  storePhone?: string;
  storeThemeColor?: string;
  storeHeaderColor?: string;
  storeFooterColor?: string;
  storeStatus?: 'active' | 'suspended' | 'expired';
  registrationIp?: string;
  deviceFingerprint?: string;
  activeSessionToken?: string;
  lastActiveAt?: string | number;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  orderCode: string;
  employeeId: string;
  employeeName: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  basePrice?: number;
  actualSalePrice?: number;
  sellingPrice: number;
  totalAmount?: number;
  commissionRate?: number;
  commissionAmount: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  saleStatus?: 'Pending Verification' | 'Approved' | 'Rejected' | 'Confirmed' | 'Delivered' | string;
  commissionStatus?: 'Pending' | 'Approved' | 'Rejected';
  paymentStatus: 'PAID' | 'PENDING' | 'DELIVERED';
  saleDate: string;
  notes?: string;
  items?: Array<{
    productId: string;
    productName: string;
    productCode?: string;
    quantity: number;
    size?: string;
    color?: string;
    unitPrice?: number;
    sellingPrice?: number;
    basePrice?: number;
    totalAmount?: number;
    commissionAmount?: number;
    imageUrl?: string;
  }>;
  productImage?: string;
  variant?: string;
  color?: string;
  size?: string;
  paymentMethod?: string;
  transactionId?: string;
  courierPartner?: string;
  trackingCode?: string;
  courierTrackingUrl?: string;
  deliveryStatus?: string;
  profitReleased?: boolean;
  profitReleasedAt?: string;
  trackingTimeline?: Array<{
    id: string;
    step: number;
    titleBn: string;
    titleEn: string;
    location?: string;
    descriptionBn?: string;
    descriptionEn?: string;
    timestamp?: string;
    status: 'completed' | 'active' | 'pending';
    rawStatus?: string;
  }>;
  courierLiveStatus?: string;
  courierLastChecked?: string;
  district?: string;
  thana?: string;
  deliveryCharge?: number;
  isPublicOrder?: boolean;
  orderSource?: string;
  resellerId?: string;
  resellerName?: string;
  resellerStoreSlug?: string;
  resellerStoreName?: string;
  updatedAt?: string;
}

export interface Withdrawal {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  amount: number;
  feeAmount?: number;
  netPayout?: number;
  paymentMethod: 'bKash' | 'Nagad';
  accountType?: 'Personal' | 'Agent' | 'Merchant' | string;
  accountNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  processedDate?: string;
  adminNote?: string;
  employeeNote?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  employeeId: string;
  type: 'COMMISSION_EARNED' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_PAID' | 'WITHDRAWAL_REFUND' | 'ADJUSTMENT' | 'BALANCE_TOPUP';
  amount: number;
  balanceAfter: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  reference: string;
  description: string;
  timestamp: string;
}

export interface BalanceTopupRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  employeeReferenceCode?: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad';
  senderNumber: string;
  senderPhone?: string;
  trxId: string;
  transactionId?: string;
  screenshotUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAmount?: number;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  updatedAt?: string;
}

export interface PaymentSetting {
  id: string;
  name: 'bKash' | 'Nagad';
  isEnabled: boolean;
  accountType: 'Personal' | 'Agent' | 'Merchant';
  accountNumber: string;
  instructionBn: string;
  instructionEn: string;
}

export interface HeroSlideItem {
  id: number | string;
  tagBn: string;
  tagEn: string;
  titleLine1Bn: string;
  titleLine1En: string;
  titleLine2Bn: string;
  titleLine2En: string;
  titleLine3Bn?: string;
  titleLine3En?: string;
  subheadBn: string;
  subheadEn: string;
  ctaBn: string;
  ctaEn: string;
  category: string;
  image: string; // Transparent PNG / cutout image or standard photo (mobile image)
  desktopImage?: string; // Desktop ultra-wide image
  hasCtaOverlay?: boolean; // Whether to render CTA button overlay on banner
  isFullBanner?: boolean;
}

export interface BrandSettings {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  brandDescriptionBn: string;
  brandDescriptionEn: string;
  heroHeadlineBn: string;
  heroHeadlineEn: string;
  heroSubheadBn: string;
  heroSubheadEn: string;
  heroBannerImage: string;
  heroSlides?: HeroSlideItem[];
  promoBannerActive: boolean;
  promoBannerTextBn: string;
  promoBannerTextEn: string;
  promoBannerLink: string;
  whatsappNumber?: string;
  publicContactNumber?: string;
  helplinePhone?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramEnabled?: boolean;
  publicNoticeText?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  // Reseller Panel Dedicated Contact Settings
  resellerWhatsappNumber?: string;
  resellerContactNumber?: string;
  resellerHotlinePhone?: string;
  resellerTerms?: Array<{ id: string; title: string; desc: string; isWarning?: boolean }>;
  // Reseller Dashboard Banner Customization
  resellerBannerBadgeBn?: string;
  resellerBannerBadgeEn?: string;
  resellerBannerTitleBn?: string;
  resellerBannerTitleEn?: string;
  resellerBannerButtonBn?: string;
  resellerBannerButtonEn?: string;
  resellerBannerSubtitleBn?: string;
  resellerBannerSubtitleEn?: string;
  resellerBannerFeaturesBn?: string[];
  resellerBannerFeaturesEn?: string[];
  resellerBannerBgImage?: string;
  // Website Maintenance & Controls
  isWebsiteOnline?: boolean;
  websiteMaintenanceNoticeBn?: string;
  websiteMaintenanceNoticeEn?: string;
  // Reseller Free Trial & Subscription Controls
  resellerTrialEnabled?: boolean;
  resellerTrialDays?: number;
  resellerSubscriptionFee?: number;
  resellerSubscriptionDuration?: string;
  resellerSubscriptionNoticeBn?: string;
  resellerSubscriptionPaymentPhone?: string;
  resellerSubscriptionPlan1Month?: number;
  resellerSubscriptionPlan6Months?: number;
  resellerSubscriptionPlan1Year?: number;
  resellerSubscriptionPlan2Years?: number;
  // AI Hub Controls
  publicAiPrompt?: string;
  publicAiEnabled?: boolean;
  publicAiLimitType?: 'unlimited' | 'daily_limit';
  publicAiDailyLimit?: number;

  resellerAiPrompt?: string;
  resellerAiEnabled?: boolean;
  resellerAiLimitType?: 'unlimited' | 'daily_limit';
  resellerAiDailyLimit?: number;

  videoAiEnabled?: boolean;
  videoAiLimitType?: 'unlimited' | 'daily_limit';
  videoAiDailyLimit?: number;
  videoAiPricePerMonth?: number;

  websiteAiEnabled?: boolean;
  websiteAiLimitType?: 'unlimited' | 'total_limit';
  websiteAiTotalLimit?: number;

  campaignAiEnabled?: boolean;
  // Reseller Notification Notice Bar
  resellerNotificationNotice?: string;
  officialReferralCode?: string;
  nonOfficialMarkup?: number;
  // Reseller Withdrawal System Settings
  mandatoryReserveBalance?: number;
  sendMoneyFee?: number;
  // App Version & Remote Broadcast Update Controls
  appVersion?: string;
  lastPublishedAt?: number;
  releaseNotes?: string;
  forceUpdate?: boolean;
  updatedAt?: number;
}

export interface NotificationItem {
  id: string;
  recipientRole: 'ADMIN' | 'EMPLOYEE' | 'PUBLIC';
  employeeId?: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  type: 'SALE' | 'EMPLOYEE' | 'WITHDRAWAL' | 'SYSTEM' | 'COMMISSION' | 'ANNOUNCEMENT';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actor: string;
  target: string;
  previousValue?: string;
  newValue?: string;
  ip?: string;
  timestamp: string;
}

export interface AdminSession {
  token: string;
  email: string;
  role: 'SUPER_ADMIN';
  createdAt: number;
  expiresAt: number;
}

export interface EmployeeSession {
  token: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'EMPLOYEE';
  createdAt: number;
  expiresAt: number;
}

export interface Subsection {
  id: string;
  parentSlug: string;
  parentSub?: string;
  name: string;
  description: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

export interface TrainingVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  order: number;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  joinedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ReferralEarning {
  id: string;
  referrerId: string;
  clientId: string;
  saleId?: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED';
  timestamp: string;
}

export interface ReferralSettings {
  defaultRatePercent: number; // e.g. 10 (10% commission on downline profit)
  defaultMaxCap: number; // e.g. 10 (10 TK max cap per order)
  nonOfficialMarkup: number; // e.g. 10 (10 TK markup for non-official referrals)
  officialReferralCode: string; // e.g. 'TAWZOON9516' (Admin only confidential)
}

export interface SubscriptionPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  resellerName?: string;
  employeePhone: string;
  storeSlug?: string;
  resellerStoreSlug?: string;
  storeName?: string;
  resellerStoreName?: string;
  paymentMethod: string;
  senderPhone: string;
  trxId: string;
  amount: number;
  planDuration: string;
  planDurationDays: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string;
}

