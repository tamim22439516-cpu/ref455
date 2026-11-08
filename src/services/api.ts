import {
  Category,
  Product,
  Employee,
  Sale,
  Withdrawal,
  Transaction,
  BrandSettings,
  PaymentSetting,
  NotificationItem,
  AuditLogItem,
  Subsection,
  SubscriptionPayment,
  BalanceTopupRequest,
} from '../types/index.js';

const ADMIN_TOKEN_KEY = 'tawzoon_admin_token';
const EMPLOYEE_TOKEN_KEY = 'tawzoon_emp_token';

export const authStorage = {
  getAdminToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setAdminToken: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearAdminToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),

  getEmployeeToken: () => localStorage.getItem(EMPLOYEE_TOKEN_KEY),
  setEmployeeToken: (token: string) => localStorage.setItem(EMPLOYEE_TOKEN_KEY, token),
  clearEmployeeToken: () => localStorage.removeItem(EMPLOYEE_TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 5, delay = 800): Promise<T> {
  try {
    const empToken = authStorage.getEmployeeToken();
    const adminToken = authStorage.getAdminToken();
    const defaultAuth = empToken ? `Bearer ${empToken}` : (adminToken ? `Bearer ${adminToken}` : undefined);

    let activeRef: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        const search = new URLSearchParams(window.location.search);
        activeRef = search.get('ref') || search.get('referral') || sessionStorage.getItem('tawzoon_invite_ref');
      } catch {}
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(defaultAuth ? { Authorization: defaultAuth } : {}),
      ...(activeRef ? { 'x-referral-code': activeRef } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      const isHtml = Boolean(text && (text.trim().startsWith('<') || text.toLowerCase().includes('<!doctype') || text.toLowerCase().includes('html')));
      if (res.status === 401 || res.status === 403) {
        if (endpoint.includes('/employee') || endpoint.includes('/auth/employee')) {
          authStorage.clearEmployeeToken();
        } else if (endpoint.includes('/admin') || endpoint.includes('/auth/admin')) {
          authStorage.clearAdminToken();
        }
        throw new Error(res.status === 401 ? 'ভুল ইমেইল বা পাসওয়ার্ড! সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।' : 'অনুমোদিত নয়: সেশন শেষ হয়ে গেছে বা সঠিক অনুমতি নেই।');
      }

      if (retries > 0 && (res.status === 429 || res.status >= 500 || isHtml || text.includes('Rate exceeded') || text.includes('Too Many Requests'))) {
        await new Promise(r => setTimeout(r, delay));
        return request<T>(endpoint, options, retries - 1, delay * 1.5);
      }

      if (isHtml) {
        if (endpoint.includes('/auth/')) {
          throw new Error('সার্ভারের সাথে সংযোগে সাময়িক বিলম্ব হচ্ছে। অনুগ্রহ করে ৫-১০ সেকেন্ড পর সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
        }
        throw new Error('সার্ভার রেসপন্স তৈরি হতে বিলম্ব হচ্ছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।');
      }
      throw new Error(text || `Request failed with status ${res.status}`);
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        if (endpoint.includes('/employee') || endpoint.includes('/auth/employee')) {
          authStorage.clearEmployeeToken();
        } else if (endpoint.includes('/admin') || endpoint.includes('/auth/admin')) {
          authStorage.clearAdminToken();
        }
      }
      if ((res.status === 429 || res.status >= 500) && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return request<T>(endpoint, options, retries - 1, delay * 1.5);
      }
      const rawErr = data?.error || data?.message || `Request failed with status ${res.status}`;
      const isHtml = typeof rawErr === 'string' && (rawErr.trim().startsWith('<') || rawErr.toLowerCase().includes('html'));
      if (isHtml && retries > 0) {
        await new Promise(r => setTimeout(r, delay));
        return request<T>(endpoint, options, retries - 1, delay * 1.5);
      }
      throw new Error(isHtml ? 'সার্ভার রেসপন্স তৈরি হতে বিলম্ব হচ্ছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।' : rawErr);
    }
    return data as T;
  } catch (err: any) {
    if (retries > 0 && (
      err.message?.includes('Rate exceeded') ||
      err.message?.includes('429') ||
      err.message?.includes('network') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('aborted') ||
      err.message?.includes('status 200') ||
      err.message?.includes('সার্ভার রেসপন্স তৈরি হতে বিলম্ব হচ্ছে')
    )) {
      await new Promise(r => setTimeout(r, delay));
      return request<T>(endpoint, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

export const api = {
  // Public
  publicGetNotifications: () =>
    request<NotificationItem[]>('/api/public/notifications'),

  getBootstrap: async () => {
    try {
      return await request<{
        brandSettings: BrandSettings;
        categories: Category[];
        subsections?: any[];
        paymentSettings: PaymentSetting[];
        featuredProducts: Product[];
        trendingProducts: Product[];
        newArrivalProducts: Product[];
      }>('/api/public/bootstrap', {}, 2, 300);
    } catch (err: any) {
      console.warn('[Bootstrap] Network delay or offline fallback activated:', err?.message || err);
      let cachedBrand: any = null;
      let cachedCats: any = null;
      let cachedSubs: any = null;
      let cachedPay: any = null;
      try {
        const b = localStorage.getItem('tawzoon_cached_brand');
        if (b) cachedBrand = JSON.parse(b);
        const c = localStorage.getItem('tawzoon_cached_categories');
        if (c) cachedCats = JSON.parse(c);
        const s = localStorage.getItem('tawzoon_cached_subsections');
        if (s) cachedSubs = JSON.parse(s);
        const p = localStorage.getItem('tawzoon_cached_payment_settings');
        if (p) cachedPay = JSON.parse(p);
      } catch {}

      return {
        brandSettings: cachedBrand || {
          appName: "TAWZOON",
          logoUrl: "",
          faviconUrl: "",
          brandDescriptionBn: "প্রিমিয়াম প্রোডাক্ট মার্কেটিং ও অনুমোদিত রিসেলার নেটওয়ার্ক প্ল্যাটফর্ম। সাশ্রয়ী ও মানসম্পন্ন পণ্য সবার দোড়গোড়ায়।",
          brandDescriptionEn: "Premium dynamic product marketing & authorized reseller distribution network.",
          heroHeadlineBn: "আধুনিক জীবনের প্রিমিয়াম পণ্য ও স্মার্ট মার্কেটিং",
          heroHeadlineEn: "Curated Premium Products & Empowered Commerce",
          heroSubheadBn: "ফ্যাশন, অত্যাধুনিক গ্যাজেট ও লাইফস্টাইল পণ্য সংগ্রহ করুন সহজে।",
          heroSubheadEn: "Explore refined collections across fashion.",
          heroBannerImage: "/images/hero_tawzoon_nexus_1790244695106.jpg",
          promoBannerActive: true,
          promoBannerTextBn: "বিশেষ অফার: নতুন সিজনের ট্রেন্ডিং গ্যাজেট ও ফ্যাশন কালেকশনে আকর্ষণীয় রিওয়ার্ড!",
          promoBannerTextEn: "Exclusive: Explore new trending gadgets and seasonal fashion!",
          promoBannerLink: "#shop",
          resellerBannerBadgeBn: "সহজ উপায়ে শিখুন",
          resellerBannerBadgeEn: "Learn Easily",
          resellerBannerTitleBn: "নতুন রিসেলার?",
          resellerBannerTitleEn: "New Reseller?",
          resellerBannerSubtitleBn: "অ্যাপ ব্যবহার শিখুন সহজ ভিডিও টিউটোরিয়ালে",
          resellerBannerSubtitleEn: "Learn app usage with easy video tutorials",
          resellerBannerButtonBn: "কোর্সসমূহ দেখুন",
          resellerBannerButtonEn: "View Courses",
          resellerBannerFeaturesBn: ["অর্ডার করুন", "কমিশন অর্জন", "বিক্রি বাড়ান", "ধাপে ধাপে গাইডলাইন"],
          resellerBannerFeaturesEn: ["Place Order", "Earn Commission", "Increase Sales", "Step-by-Step Guide"],
          isWebsiteOnline: true,
          websiteMaintenanceNoticeBn: "ওয়েবসাইটটি সাময়িকভাবে মেইনটেন্যান্স বা আপডেট কাজের জন্য স্থগিত আছে। খুব শীঘ্রই আমরা পুনরায় সরাসরি সার্ভারে লাইভ হবো।",
          websiteMaintenanceNoticeEn: "The website is currently under scheduled maintenance. We will be back online shortly.",
          publicAiPrompt: "আপনি Tawzoon Nexus-এর স্মার্ট কাস্টমার সাপোর্ট এআই অ্যাসিস্ট্যান্ট। কাস্টমারদের প্রোডাক্ট তথ্য, অর্ডার ও হেল্পলাইন নাম্বার শেয়ার করুন।",
          resellerAiPrompt: "আপনি রিসেলার অ্যাসিস্ট্যান্ট এআই। রিসেলারদের সেলস বাড়াতে, মার্কেটিং পোস্টের ক্যাচ-লাইন তৈরি করতে এবং কাস্টমার কনভিন্স করার গাইড দিন।",
          videoAiLimitType: "daily_limit",
          videoAiDailyLimit: 10,
          videoAiPricePerMonth: 490,
          campaignAiEnabled: true,
          resellerNotificationNotice: "🎉 সকল রিসেলারদের অবগতির জন্য জানানো যাচ্ছে যে, সকল নিয়মিত অর্ডারে বোনাস কমিশন অফার চলমান রয়েছে!",
        },
        categories: Array.isArray(cachedCats) ? cachedCats : [],
        subsections: Array.isArray(cachedSubs) ? cachedSubs : [],
        paymentSettings: Array.isArray(cachedPay) ? cachedPay : [],
        featuredProducts: [],
        trendingProducts: [],
        newArrivalProducts: []
      };
    }
  },

  getProducts: (params?: { category?: string; search?: string; sort?: string; filter?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.filter) query.set('filter', params.filter);
    return request<{ products: Product[]; total: number }>(`/api/public/products?${query.toString()}`);
  },

  getProductDetails: (id: string) => request<Product>(`/api/public/products/${id}`),

  visualSearch: (imageBase64: string, mimeType?: string) =>
    request<{
      success: boolean;
      detectedItem?: {
        detectedCategory?: string;
        itemTypeBn?: string;
        itemTypeEn?: string;
        colors?: string[];
        keywords?: string[];
        descriptionBn?: string;
      };
      matchedProducts: Array<{
        product: Product;
        matchScore: number;
        reason?: string;
      }>;
    }>('/api/public/visual-search', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    }),

  testTelegram: (payload: { token?: string; chatId?: string }) =>
    request<{ success: boolean; message?: string; error?: string }>('/api/telegram/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitPublicOrder: (payload: {
    items: Array<{
      productId: string;
      productName: string;
      productCode: string;
      quantity: number;
      size?: string;
      sellingPrice: number;
      imageUrl?: string;
    }>;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    district: string;
    thana: string;
    notes?: string;
    deliveryCharge: number;
    paymentMethod: 'bKash' | 'Nagad' | 'COD';
    transactionId?: string;
    senderPhone?: string;
    isAdvancePaid: boolean;
    referralCode?: string;
    resellerStoreSlug?: string;
  }) =>
    request<{
      success: boolean;
      orderCode: string;
      itemsCount: number;
      productsTotal: number;
      deliveryCharge: number;
      grandTotal: number;
      advancePaid: number;
      dueAmount: number;
      isAdvancePaid: boolean;
      paymentMethod: string;
      transactionId?: string;
      customerName: string;
      customerPhone: string;
      customerAddress: string;
      orderDate: string;
      message: string;
    }>('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Auth
  adminLogin: (email: string, password: string) =>
    request<{ success: boolean; token: string; admin: { email: string; role: string } }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  adminRequestOtp: (email: string, password: string) =>
    request<{ success: boolean; message: string }>('/api/auth/admin/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  adminVerifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; token: string; admin: { email: string; role: string } }>('/api/auth/admin/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  adminGetMe: (token: string) =>
    request<{ email: string; role: string }>('/api/auth/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminLogout: (token: string) =>
    request<{ success: boolean }>('/api/auth/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Employee Auth
  employeeRegister: (payload: {
    name: string;
    email?: string;
    phone: string;
    district: string;
    thana: string;
    password: string;
    reference?: string;
  }) =>
    request<{ success: boolean; messageBn: string; messageEn: string }>('/api/auth/employee/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  employeeLogin: (payload: { identifier: string; password: string }) =>
    request<{ success: boolean; token: string; employee: Employee }>('/api/auth/employee/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminTestTelegram: (token: string, payload: { botToken?: string; chatId?: string }) =>
    request<{ success: boolean; message: string; chatId?: string }>('/api/admin/test-telegram', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  employeeGetMe: (token: string) =>
    request<Employee>('/api/auth/employee/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeUpdateProfile: (token: string, payload: { name: string; avatarUrl?: string }) =>
    request<{ success: boolean; employee: Employee }>('/api/employee/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  employeeUpdateStore: (token: string, payload: any) =>
    request<{ success: boolean; employee: Employee }>('/api/employee/store', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  getPublicStore: (slug: string) =>
    request<{
      success: boolean;
      reseller: Employee;
      isExpired: boolean;
      isSuspended?: boolean;
      subscriptionInfo?: any;
      products: Product[];
    }>(`/api/store/${slug}`),

  employeeSubmitSubscriptionPayment: (
    token: string,
    payload: {
      paymentMethod: string;
      senderPhone: string;
      trxId: string;
      amount: number;
      planDuration: string;
    }
  ) =>
    request<{ success: boolean; messageBn: string; payment: SubscriptionPayment; employee: Employee }>(
      '/api/employee/submit-subscription-payment',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  employeeUploadAvatar: (token: string, imageBase64: string) =>
    request<{ success: boolean; url: string }>('/api/employee/upload-avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image: imageBase64 }),
    }),

  employeeGetNotifications: (token: string) =>
    request<NotificationItem[]>('/api/employee/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeGetProducts: (token?: string) =>
    request<{ products: Product[]; total: number }>('/api/employee/products', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  employeeGetReferrals: (token: string) =>
    request<{
      referenceCode: string;
      totalCount: number;
      approvedCount: number;
      pendingCount: number;
      bonusEarned: number;
      thisMonthEarned?: number;
      balanceAdded?: number;
      referrals: Array<{
        id: string;
        name: string;
        phone: string;
        district?: string;
        thana?: string;
        status: string;
        registeredAt: string;
        avatarUrl?: string;
        orderCount?: number;
        deliveredOrders?: number;
        cancelledOrders?: number;
        totalSales?: number;
        referralCommission?: number;
        paidCommission?: number;
        pendingCommission?: number;
      }>;
    }>('/api/employee/referrals', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeGetReferralClientDetails: (token: string, clientId: string) =>
    request<{
      client: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        district?: string;
        thana?: string;
        registeredAt: string;
        status: string;
      };
      stats: {
        totalOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        totalSales: number;
        generatedCommission: number;
        paidCommission: number;
        pendingCommission: number;
      };
      orders: any[];
    }>(`/api/employee/referrals/${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeGetTrainingVideos: (token: string) =>
    request<any[]>('/api/employee/training-videos', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeChangePassword: (token: string, payload: { oldPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/api/employee/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  employeeMarkNotificationRead: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/employee/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeMarkAllNotificationsRead: (token: string) =>
    request<{ success: boolean }>('/api/employee/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeLogout: (token: string) =>
    request<{ success: boolean }>('/api/auth/employee/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Employee Operations
  employeeGetDashboard: (token: string) =>
    request<{
      wallet: Employee['wallet'];
      metrics: {
        todaySales: number;
        todayEarnings: number;
        totalSales: number;
        totalEarnings: number;
        availableBalance: number;
        pendingWithdrawal: number;
        totalWithdrawn: number;
        salesCount: number;
      };
      recentSales: Sale[];
      recentTransactions: Transaction[];
      recentWithdrawals: Withdrawal[];
    }>('/api/employee/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeRecordSale: (token: string, payload: {
    productId: string;
    actualSalePrice?: number;
    quantity: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    notes?: string;
    orderCode?: string;
    size?: string;
  }) =>
    request<{ success: boolean; sale: Sale; message: string }>('/api/employee/sales', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  employeeGetSales: (token: string) =>
    request<Sale[]>('/api/employee/sales', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeGetTransactions: (token: string) =>
    request<Transaction[]>('/api/employee/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  employeeRequestWithdrawal: (token: string, payload: {
    amount: number;
    paymentMethod: 'bKash' | 'Nagad';
    accountType?: 'Personal' | 'Agent' | 'Merchant' | string;
    accountNumber: string;
    note?: string;
  }) =>
    request<{ success: boolean; withdrawal: Withdrawal; wallet: Employee['wallet']; message: string }>(
      '/api/employee/withdrawals',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  employeeGetWithdrawals: (token: string) =>
    request<Withdrawal[]>('/api/employee/withdrawals', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPaymentSettings: () =>
    request<PaymentSetting[]>('/api/payment-settings'),

  employeeSubmitBalanceTopup: (
    token: string,
    payload: {
      amount: number;
      paymentMethod: 'bKash' | 'Nagad';
      senderNumber: string;
      trxId: string;
      screenshotUrl?: string;
    }
  ) =>
    request<{ success: boolean; message: string; request: BalanceTopupRequest }>(
      '/api/employee/balance-requests',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  employeeGetBalanceTopups: (token: string) =>
    request<BalanceTopupRequest[]>('/api/employee/balance-requests', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetBalanceTopups: (token: string) =>
    request<BalanceTopupRequest[]>('/api/admin/balance-requests', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminActionBalanceTopup: (
    token: string,
    id: string,
    payload: {
      action: 'APPROVE' | 'REJECT';
      approvedAmount?: number;
      adminNote?: string;
    }
  ) =>
    request<{ success: boolean; message: string; request: BalanceTopupRequest; wallet?: any }>(
      `/api/admin/balance-requests/${id}/action`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  employeePaySubscription: (token: string, payload: {
    paymentMethod: string;
    trxId?: string;
    amount: number;
    senderPhone?: string;
  }) =>
    request<{ success: boolean; employee: Employee; messageBn: string; messageEn: string; trxId: string }>(
      '/api/employee/pay-subscription',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  // Admin Operations
  adminGetDashboard: (token: string) =>
    request<{
      stats: {
        totalProducts: number;
        activeProducts: number;
        totalEmployees: number;
        pendingEmployees: number;
        todaySales: number;
        todayCommission: number;
        totalSalesRevenue: number;
        totalCommissionPaid: number;
        pendingWithdrawalsTotal: number;
        pendingWithdrawalsCount: number;
        paidWithdrawalsTotal: number;
        netAdminRevenue: number;
      };
      recentSales: Sale[];
      pendingWithdrawals: Withdrawal[];
      recentEmployees: Employee[];
      recentAuditLogs: AuditLogItem[];
    }>('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetProducts: (token: string) =>
    request<Product[]>('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUploadImages: (token: string, images: { name: string; data: string }[]) =>
    request<{ success: boolean; urls: string[] }>('/api/admin/upload-images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ images }),
    }),

  adminUploadVideo: (token: string, data: string) =>
    request<{ success: boolean; url: string }>('/api/admin/upload-video', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data }),
    }),

  adminCreateProduct: (token: string, product: Partial<Product>) =>
    request<{ success: boolean; product: Product }>('/api/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(product),
    }),

  adminUpdateProduct: (token: string, id: string, product: Partial<Product>) =>
    request<{ success: boolean; product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(product),
    }),

  adminArchiveProduct: (token: string, id: string) =>
    request<{ success: boolean; product: Product }>(`/api/admin/products/${id}/archive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminDeleteProduct: (token: string, id: string) =>
    request<{ success: boolean; deleted: boolean; archived: boolean; undoWindow?: boolean }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminToggleProductStatus: (token: string, id: string) =>
    request<{ success: boolean; isActive: boolean }>(`/api/admin/products/${id}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetCategories: (token: string) =>
    request<Category[]>('/api/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminCreateCategory: (token: string, category: Partial<Category>) =>
    request<{ success: boolean; category: Category }>('/api/admin/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(category),
    }),

  adminUpdateCategory: (token: string, id: string, category: Partial<Category>) =>
    request<{ success: boolean; category: Category }>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(category),
    }),

  adminDeleteCategory: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminReorderCategories: (token: string, orders: { id: string; order: number }[]) =>
    request<{ success: boolean }>('/api/admin/categories/reorder', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orders }),
    }),

  adminGetSubsections: (token: string) =>
    request<Subsection[]>('/api/admin/subsections', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminSaveSubsections: (token: string, subsections: Subsection[]) =>
    request<{ success: boolean; subsections: Subsection[] }>('/api/admin/subsections', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subsections }),
    }),

  adminDeleteSubsection: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/admin/subsections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUndoDelete: (token: string) =>
    request<{ success: boolean; message: string }>('/api/admin/undo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminReorderSubsections: (token: string, orders: { id: string; order: number }[]) =>
    request<{ success: boolean }>('/api/admin/subsections/reorder', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orders }),
    }),

  adminPublishToWebsite: (token: string) =>
    request<{ success: boolean; message: string }>('/api/admin/publish', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetEmployees: (token: string) =>
    request<Employee[]>('/api/admin/employees', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdateEmployeeProfile: (token: string, id: string, data: Partial<Employee>) =>
    request<{ success: boolean; employee: Employee }>(`/api/admin/employees/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  adminDeleteEmployee: (token: string, id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/employees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdateEmployeeStatus: (token: string, id: string, status: string) =>
    request<{ success: boolean; employee: Employee }>(`/api/admin/employees/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),

  adminUpdateEmployeeCommission: (token: string, id: string, customCommissionRate: number | null) =>
    request<{ success: boolean; customCommissionRate?: number }>(`/api/admin/employees/${id}/commission`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ customCommissionRate }),
    }),

  adminUpdateResellerMargin: (token: string, id: string, margin: number) =>
    request<{ success: boolean; employee: Employee; message: string }>(`/api/admin/employees/${id}/margin`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ margin }),
    }),

  adminGetResellerStores: (token: string) =>
    request<{ success: boolean; stores: Employee[] }>('/api/admin/reseller-stores', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdateResellerStoreStatus: (token: string, employeeId: string, storeStatus: string) =>
    request<{ success: boolean; storeStatus: string }>(`/api/admin/reseller-stores/${employeeId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ storeStatus }),
    }),

  adminUpdateResellerSubscription: (
    token: string,
    employeeId: string,
    payload: {
      action?: string;
      addDays?: number;
      planDuration?: string;
      customExpiryDate?: string;
      storeStatus?: string;
      subscriptionStatus?: string;
      durationDays?: number;
      extendTrialDays?: number;
      subscriptionPaymentStatus?: string;
    }
  ) =>
    request<{ success: boolean; employee: Employee; subscriptionInfo: any; message?: string }>(
      `/api/admin/reseller-stores/${employeeId}/subscription`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  adminGetSubscriptionPayments: (token: string) =>
    request<{ success: boolean; payments: SubscriptionPayment[] }>(
      '/api/admin/subscription-payments',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  adminReviewSubscriptionPayment: (
    token: string,
    paymentId: string,
    payload: { action: 'APPROVE' | 'REJECT'; durationDays?: number; adminNote?: string }
  ) =>
    request<{ success: boolean; payment: SubscriptionPayment; employee: Employee; message?: string }>(
      `/api/admin/subscription-payments/${paymentId}/review`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  adminGetSales: (token: string) =>
    request<Sale[]>('/api/admin/sales', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetTransactions: (token: string) =>
    request<Transaction[]>('/api/admin/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetWithdrawals: (token: string) =>
    request<Withdrawal[]>('/api/admin/withdrawals', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminConfirmSale: (token: string, saleId: string) =>
    request<{ success: boolean; message: string; updatedCount: number }>(
      `/api/admin/sales/${saleId}/confirm`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  adminApproveSale: (token: string, saleId: string) =>
    request<{ success: boolean; message: string; updatedCount: number }>(
      `/api/admin/sales/${saleId}/approve`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  adminRejectSale: (token: string, saleId: string, payload?: { deductDeliveryCharge?: boolean; penaltyAmount?: number }) =>
    request<{ success: boolean; message: string }>(
      `/api/admin/sales/${saleId}/reject`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload || {}),
      }
    ),

  adminDeleteSale: (token: string, saleId: string) =>
    request<{ success: boolean; message: string }>(
      `/api/admin/sales/${saleId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  adminUpdateSaleCourier: (token: string, saleId: string, payload: {
    courierPartner?: string;
    trackingCode?: string;
    trackingUrl?: string;
    deliveryStatus?: string;
  }) =>
    request<{ success: boolean; message: string; courierPartner?: string; trackingCode?: string; courierTrackingUrl?: string }>(
      `/api/admin/sales/${saleId}/courier`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  adminProcessWithdrawal: (token: string, id: string, payload: { action: 'APPROVE' | 'REJECT'; adminNote?: string }) =>
    request<{ success: boolean; withdrawal: Withdrawal; employeeWallet: Employee['wallet'] }>(
      `/api/admin/withdrawals/${id}/process`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  adminGetBalanceTopupRequests: (token: string) =>
    request<{ success: boolean; requests: BalanceTopupRequest[] }>(
      '/api/admin/balance-requests',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  adminReviewBalanceTopup: (token: string, id: string, payload: { action: 'APPROVE' | 'REJECT'; approvedAmount?: number }) =>
    request<{ success: boolean; message: string }>(
      `/api/admin/balance-requests/${id}/action`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    ),

  adminForceSync: (token: string) =>
    request<{ success: boolean; message: string; quotaReached?: boolean; syncedAt?: string; stats?: any }>('/api/admin/force-sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminPurgeResellers: (token: string) =>
    request<{ success: boolean; message?: string }>('/api/admin/purge-resellers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetTrainingVideos: (token: string) =>
    request<any[]>('/api/admin/training-videos', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminCreateTrainingVideo: (token: string, video: any) =>
    request<{ success: boolean; video: any }>('/api/admin/training-videos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(video),
    }),

  adminUpdateTrainingVideo: (token: string, id: string, video: any) =>
    request<{ success: boolean; video: any }>(`/api/admin/training-videos/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(video),
    }),

  adminDeleteTrainingVideo: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/admin/training-videos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminReorderTrainingVideos: (token: string, orders: { id: string; order: number }[]) =>
    request<{ success: boolean }>('/api/admin/training-videos/reorder', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orders }),
    }),

  adminGetBranding: (token: string) =>
    request<BrandSettings>('/api/admin/branding', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdateBranding: (token: string, settings: Partial<BrandSettings>) =>
    request<{ success: boolean; brandSettings: BrandSettings }>('/api/admin/branding', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    }),

  getAppVersion: () =>
    request<{
      version: string;
      publishedAt: number;
      releaseNotes: string;
      forceUpdate: boolean;
      iconVersion: string;
    }>('/api/public/app-version'),

  adminPublishAppUpdate: (
    token: string,
    payload: { version: string; releaseNotes: string; forceUpdate?: boolean }
  ) =>
    request<{
      success: boolean;
      message: string;
      version: string;
      publishedAt: number;
    }>('/api/admin/publish-app-update', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  adminGetPayments: (token: string) =>
    request<PaymentSetting[]>('/api/admin/payments', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminUpdatePayments: (token: string, paymentSettings: PaymentSetting[]) =>
    request<{ success: boolean; paymentSettings: PaymentSetting[] }>('/api/admin/payments', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentSettings }),
    }),

  adminGetAuditLogs: (token: string) =>
    request<AuditLogItem[]>('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetNotifications: (token: string) =>
    request<NotificationItem[]>('/api/admin/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminGetAllNotifications: (token: string) =>
    request<NotificationItem[]>('/api/admin/notifications/all', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminSendNotification: (
    token: string,
    payload: {
      recipientRole: 'PUBLIC' | 'EMPLOYEE' | 'ALL';
      titleBn: string;
      titleEn?: string;
      messageBn: string;
      messageEn?: string;
      type?: string;
    }
  ) =>
    request<{ success: boolean; notifications: NotificationItem[] }>('/api/admin/notifications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  adminMarkAllNotificationsRead: (token: string) =>
    request<{ success: boolean; count: number }>('/api/admin/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminDeleteNotification: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminMarkNotificationRead: (token: string, id: string) =>
    request<{ success: boolean }>(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),

  adminResetEmployeePassword: (token: string, employeeId: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/employees/${employeeId}/reset-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newPassword }),
    }),

  // Customer History & Delivery Analytics
  getCustomerHistory: (phone: string) =>
    request<{
      phone: string;
      totalOrders: number;
      deliveredOrders: number;
      rejectedOrders: number;
      pendingOrders: number;
      totalAmountSpent: number;
      successRate: number;
      courierNetwork: {
        totalParcels: number;
        deliveredParcels: number;
        returnedParcels: number;
        successRate: number;
        riskStatus: 'GREEN' | 'YELLOW' | 'RED';
        riskTextBn: string;
        riskTextEn: string;
        dataSources: string;
      };
      salesHistory: Array<{
        id: string;
        productName: string;
        productCode?: string;
        quantity: number;
        totalAmount: number;
        status: string;
        createdAt: string;
        customerName?: string;
        customerAddress?: string;
      }>;
    }>(`/api/common/customer-history?phone=${encodeURIComponent(phone)}`),

  getCourierTracking: (params: { code?: string; orderCode?: string; orderId?: string }) => {
    const q = new URLSearchParams();
    if (params.code) q.set('code', params.code);
    if (params.orderCode) q.set('orderCode', params.orderCode);
    if (params.orderId) q.set('orderId', params.orderId);
    return request<{
      success: boolean;
      partner: string;
      trackingCode: string;
      trackingUrl: string;
      deliveryStatus: string;
      statusLabelBn: string;
      statusLabelEn: string;
      lastUpdated: string;
      stageLevel?: number;
      facts?: Record<string, string> | null;
      timeline: Array<{
        id: string;
        step: number;
        titleBn: string;
        titleEn: string;
        location?: string;
        descriptionBn?: string;
        descriptionEn?: string;
        timestamp?: string;
        status: 'completed' | 'active' | 'pending';
      }>;
      consignment?: any;
    }>(`/api/common/courier-track?${q.toString()}`);
  },
};
