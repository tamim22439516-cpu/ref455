import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type {
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
  AdminSession,
  EmployeeSession,
  Subsection,
  ReferralSettings,
  SubscriptionPayment,
  BalanceTopupRequest,
} from '../src/types/index.ts';
import { firestore, testFirestoreConnection } from './firebase.ts';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const STORE_BACKUP_PATH = path.join(DATA_DIR, 'store.backup.json');
const SRC_STORE_PATH = path.join(__dirname, '..', 'src', 'data', 'store.json');

export function isFirestoreReadQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    msg.includes('free daily read units') ||
    (code.includes('resource-exhausted') && msg.includes('read'))
  );
}

export function isFirestoreWriteQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || '').toLowerCase();
  // Read quota exhaustion must NEVER prevent writing to Firestore!
  if (msg.includes('free daily read units')) return false;
  return (
    msg.includes('free daily write units') ||
    (code.includes('resource-exhausted') && !msg.includes('read units')) ||
    (code.includes('quota-exceeded') && !msg.includes('read units')) ||
    (msg.includes('quota limit exceeded') && !msg.includes('read units'))
  );
}

export function isFirestoreQuotaError(err: any): boolean {
  return isFirestoreReadQuotaError(err) || isFirestoreWriteQuotaError(err);
}

export function toEnglishDigits(str: string = ''): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return (str || '').toString().replace(/[০-৯]/g, d => String(bn.indexOf(d)));
}

export function normalizePhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = toEnglishDigits(phone).replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('01')) return digits;
  if (digits.length === 13 && digits.startsWith('8801')) return digits.slice(2);
  if (digits.length > 11 && digits.includes('01')) {
    const idx = digits.indexOf('01');
    const cand = digits.slice(idx, idx + 11);
    if (cand.length === 11) return cand;
  }
  return digits;
}

export function isEntityTerminal(colName: string, item: any): boolean {
  if (!item) return false;
  
  if (colName === 'sales') {
    const saleStatus = String(item.saleStatus || '').toUpperCase().trim();
    const deliveryStatus = String(item.deliveryStatus || '').toUpperCase().trim();
    const itemStatus = String(item.status || '').toUpperCase().trim();
    const paymentStatus = String(item.paymentStatus || '').toUpperCase().trim();

    const terminalStatuses = ['CONFIRMED', 'APPROVED', 'DELIVERED', 'REJECTED', 'CANCELLED', 'RETURNED', 'COMPLETED', 'SHIPPED', 'PROCESSING'];
    if (terminalStatuses.includes(saleStatus) || terminalStatuses.includes(deliveryStatus) || terminalStatuses.includes(itemStatus)) {
      return true;
    }
    if (['PAID', 'REFUNDED'].includes(paymentStatus)) {
      return true;
    }
    return false;
  }
  if (colName === 'withdrawals') {
    const status = String(item.status || '').toUpperCase().trim();
    return ['APPROVED', 'REJECTED', 'PAID', 'CANCELLED', 'COMPLETED'].includes(status);
  }
  if (colName === 'balance_topup_requests' || colName === 'balanceTopupRequests') {
    const status = String(item.status || '').toUpperCase().trim();
    return ['APPROVED', 'REJECTED'].includes(status);
  }
  if (colName === 'employees') {
    const status = String(item.status || '').toUpperCase().trim();
    return ['APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'ARCHIVED'].includes(status);
  }
  return false;
}

export function isEntityPending(colName: string, item: any): boolean {
  if (!item) return false;
  if (isEntityTerminal(colName, item)) return false;

  if (colName === 'sales') {
    // If order has courier tracking code or profit released, it is NEVER pending!
    if (item.trackingCode || item.courierTrackingUrl || item.profitReleased) {
      return false;
    }
    const saleStatus = String(item.saleStatus || '').toUpperCase().trim();
    const itemStatus = String(item.status || '').toUpperCase().trim();
    const deliveryStatus = String(item.deliveryStatus || '').toUpperCase().trim();
    return (
      (!saleStatus || saleStatus === 'PENDING' || saleStatus === 'PENDING VERIFICATION' || saleStatus === 'PENDING_VERIFICATION') &&
      (!itemStatus || itemStatus === 'PENDING' || itemStatus === 'ORDERED' || itemStatus === 'IN_REVIEW') &&
      (!deliveryStatus || deliveryStatus === 'PENDING')
    );
  }
  if (colName === 'withdrawals' || colName === 'balance_topup_requests' || colName === 'balanceTopupRequests') {
    const status = String(item.status || '').toUpperCase().trim();
    return status === 'PENDING' || !status;
  }
  if (colName === 'employees') {
    const status = String(item.status || '').toUpperCase().trim();
    return status === 'PENDING' || status === 'PENDING_APPROVAL' || !status;
  }
  return false;
}

export function getEntityProgressRank(colName: string, item: any): number {
  if (!item) return 0;
  if (colName === 'sales') {
    const s = String(item.saleStatus || item.status || '').toUpperCase().trim();
    const d = String(item.deliveryStatus || '').toUpperCase().trim();
    const p = String(item.paymentStatus || '').toUpperCase().trim();
    if (s === 'REJECTED' || s === 'CANCELLED' || d === 'CANCELLED') return 100;
    if (s === 'APPROVED' || p === 'PAID' || item.profitReleased) return 50;
    if (d === 'SHIPPED' || item.trackingCode || item.courierTrackingUrl) return 40;
    if (d === 'PROCESSING') return 30;
    if (s === 'CONFIRMED' || item.status === 'CONFIRMED') return 20;
    return 10; // Pending
  }
  if (colName === 'withdrawals' || colName === 'balance_topup_requests' || colName === 'balanceTopupRequests') {
    const st = String(item.status || '').toUpperCase().trim();
    if (['APPROVED', 'PAID', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(st)) return 50;
    return 10;
  }
  if (colName === 'employees') {
    const st = String(item.status || '').toUpperCase().trim();
    if (['APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED'].includes(st)) return 50;
    return 10;
  }
  return 0;
}

export function getItemTimestamp(item: any): number {
  if (!item) return 0;
  const raw = item.updatedAt || item.reviewedAt || item.processedDate || item.confirmedAt || item.approvedAt || item.registeredAt || item.saleDate || item.createdAt || item.timestamp;
  return raw ? new Date(raw).getTime() : 0;
}

export interface OutboxItem {
  id: string;
  colName: string;
  payload: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface IdempotencyRecord {
  key: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'QUEUED';
  responsePayload?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseState {
  brandSettings: BrandSettings;
  categories: Category[];
  products: Product[];
  publishedCategories: Category[];
  publishedProducts: Product[];
  subsections?: Subsection[];
  publishedSubsections?: Subsection[];
  employees: (Employee & { passwordHash: string })[];
  sales: Sale[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  paymentSettings: PaymentSetting[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  adminSessions: AdminSession[];
  employeeSessions: EmployeeSession[];
  trainingVideos?: any[];
  referralSettings?: ReferralSettings;
  subscriptionPayments?: SubscriptionPayment[];
  balanceTopupRequests?: BalanceTopupRequest[];
  deletedProductIds?: string[];
  deletedItemIds?: Record<string, string[]>;
  syncOutboxQueue?: OutboxItem[];
  idempotencyKeys?: Record<string, IdempotencyRecord>;
  adminOtpState: {
    email: string;
    otp: string;
    expiresAt: number;
    attempts: number;
    lastRequestedAt: number;
  } | null;
}

export const CORE_PRACTICE_EMPLOYEES: (Employee & { passwordHash: string })[] = [];

const INITIAL_DATA: DatabaseState = {
  brandSettings: {
    appName: "TAWZOON NEXUS",
    logoUrl: "", 
    faviconUrl: "",
    brandDescriptionBn: "প্রিমিয়াম প্রোডাক্ট মার্কেটিং ও অনুমোদিত রিসেলার নেটওয়ার্ক প্ল্যাটফর্ম। সাশ্রয়ী ও মানসম্পন্ন পণ্য সবার দোড়গোড়ায়।",
    brandDescriptionEn: "Premium dynamic product marketing & authorized reseller distribution network. Quality products delivered with excellence.",
    heroHeadlineBn: "আধুনিক জীবনের প্রিমিয়াম পণ্য ও স্মার্ট মার্কেটিং",
    heroHeadlineEn: "Curated Premium Products & Empowered Commerce",
    heroSubheadBn: "ফ্যাশন, অত্যাধুনিক গ্যাজেট ও লাইফস্টাইল পণ্য সংগ্রহ করুন সহজে। রিসেলার ও মার্কেটারদের জন্য নির্ভরযোগ্য প্ল্যাটফর্ম।",
    heroSubheadEn: "Explore refined collections across fashion, cutting-edge gadgets, and lifestyle essentials with authentic guarantees.",
    heroBannerImage: "/images/hero_tawzoon_nexus_1790244695106.jpg",
    promoBannerActive: true,
    promoBannerTextBn: "বিশেষ অফার: নতুন সিজনের ট্রেন্ডিং গ্যাজেট ও ফ্যাশন কালেকশনে আকর্ষণীয় রিওয়ার্ড!",
    promoBannerTextEn: "Exclusive: Explore new trending gadgets and seasonal fashion with authorized affiliate rewards!",
    promoBannerLink: "#shop",
    mandatoryReserveBalance: 120,
    sendMoneyFee: 5
  },
  categories: [],
  publishedCategories: [],
  products: [],
  publishedProducts: [],
  deletedProductIds: [],
  subsections: [],
  publishedSubsections: [],
  employees: [],
  sales: [],
  withdrawals: [],
  transactions: [],
  balanceTopupRequests: [],
  paymentSettings: [
    {
      id: "pay-bkash",
      name: "bKash",
      isEnabled: true,
      accountType: "Merchant",
      accountNumber: "01700000000",
      instructionBn: "বিকাশ অ্যাপ থেকে 'Send Money' অথবা 'Merchant Pay' অপশন ব্যবহার করুন।",
      instructionEn: "Use bKash Send Money or Merchant Pay with reference."
    },
    {
      id: "pay-nagad",
      name: "Nagad",
      isEnabled: true,
      accountType: "Merchant",
      accountNumber: "01800000000",
      instructionBn: "নগদ অ্যাপ অথবা ইউএসএসডি কোডের মাধ্যমে পেমেন্ট সম্পন্ন করুন।",
      instructionEn: "Complete your transfer using Nagad App or USSD code."
    }
  ],
  notifications: [],
  auditLogs: [],
  adminSessions: [],
  employeeSessions: [],
  trainingVideos: [],
  referralSettings: {
    defaultRatePercent: 10,
    defaultMaxCap: 10,
    nonOfficialMarkup: 10,
    officialReferralCode: 'TAWZOON9516'
  },
  syncOutboxQueue: [],
  idempotencyKeys: {},
  adminOtpState: null
};

class Database {
  private state: DatabaseState;
  private isCloudSynced: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;
  private lastSyncedHashes = new Map<string, string>();
  private isReadQuotaExhausted: boolean = false;
  private readQuotaExhaustedUntil: number = 0;
  private isWriteQuotaExhausted: boolean = false;
  private writeQuotaExhaustedUntil: number = 0;
  private employeeByIdIndex = new Map<string, Employee & { passwordHash: string }>();
  private employeeByCodeIndex = new Map<string, Employee & { passwordHash: string }>();
  private employeeByPhoneIndex = new Map<string, Employee & { passwordHash: string }>();
  private employeesByReferralIndex = new Map<string, (Employee & { passwordHash: string })[]>();
  public ready: Promise<void>;

  constructor() {
    this.state = this.load();
    if (!this.state.syncOutboxQueue) this.state.syncOutboxQueue = [];
    if (!this.state.idempotencyKeys) this.state.idempotencyKeys = {};
    if (!this.state.subscriptionPayments) this.state.subscriptionPayments = [];
    if (!this.state.balanceTopupRequests) this.state.balanceTopupRequests = [];
    this.ensureCoreData();
    this.deduplicateEmployees();
    this.consolidateSalesByOrderCode();
    this.rebuildIndices();
    this.ensureTransactionLedgerConsistency();
    this.reconcileAllWallets();
    this.ready = this.initCloudSync();

    // Schedule background durable outbox queue worker every 30 seconds
    setInterval(() => {
      this.processSyncOutbox().catch(() => {});
    }, 30000);
  }

  private createBackupSnapshot() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const json = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(STORE_BACKUP_PATH, json, 'utf-8');
      const presyncPath = path.join(DATA_DIR, 'store.presync.json');
      fs.writeFileSync(presyncPath, json, 'utf-8');
    } catch (err) {
      console.warn('[Database] Backup snapshot creation note:', err);
    }
  }

  public async forcePullFromCloud() {
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    console.log('[Firebase] Explicitly triggered live cloud synchronization pull...');
    const isConnected = await testFirestoreConnection();
    if (!isConnected) {
      this.isReadQuotaExhausted = true;
      this.readQuotaExhaustedUntil = Date.now() + 60 * 60 * 1000;
      console.warn('[Firebase] Cloud Firestore connection not ready or quota reached. Serving from local store.');
      return {
        success: true,
        localOnly: true,
        quotaReached: true,
        syncedAt: new Date().toISOString(),
        stats: {
          products: this.state.products.length,
          employees: this.state.employees.length,
          sales: this.state.sales.length,
          transactions: this.state.transactions.length,
          categories: this.state.categories.length,
        }
      };
    }

    // 0. Take a safe pre-sync snapshot of local state so no data is ever lost
    this.createBackupSnapshot();

    let quotaHit = false;

    // 1. Pull Brand Settings safely
    try {
      const brandDoc = await getDoc(doc(firestore, 'brand_settings', 'default'));
      if (brandDoc.exists()) {
        const brandData = brandDoc.data() as BrandSettings;
        const localUpdated = Number(this.state.brandSettings.updatedAt || 0);
        const cloudUpdated = Number(brandData.updatedAt || 0);
        if (cloudUpdated >= localUpdated) {
          this.state.brandSettings = { ...this.state.brandSettings, ...brandData };
          this.lastSyncedHashes.set('brand_settings/default', JSON.stringify(this.state.brandSettings));
          console.log('[Firebase] Live brand settings synced from cloud');
        } else {
          // Local is newer, upload to cloud
          await this.syncBrandSettingsDirect(this.state.brandSettings);
        }
      } else {
        // Not yet in cloud, persist to cloud
        await this.syncBrandSettingsDirect(this.state.brandSettings);
      }
    } catch (err: any) {
      if (isFirestoreQuotaError(err)) {
        this.isReadQuotaExhausted = true;
        this.readQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
        quotaHit = true;
        console.warn('[Firebase-Quota] Daily read quota reached during brand settings sync. Preserving local brand settings.');
      } else {
        console.warn('[Firebase] Warning reading brand settings during force sync:', err);
      }
    }

    // Pull tombstones / recorded deletions from Firestore first so we never resurrect deleted products/categories
    try {
      const delSnap = await getDocs(query(collection(firestore!, '_deletions')));
      for (const d of delSnap.docs) {
        const data = d.data();
        if (data && data.colName && data.id) {
          this.markDeleted(data.colName, data.id);
        }
      }
    } catch (e) {
      console.warn('[Firebase-Sync] Note checking _deletions:', e);
    }

    // 2. Safe Two-Way Bidirectional Pull for all authoritative collections
    const pullCollection = async (colName: string, stateKey: keyof DatabaseState) => {
      try {
        const snap = await getDocs(query(collection(firestore!, colName)));
        const cloudItems = snap.docs.map(doc => doc.data());
        const localItems = Array.isArray(this.state[stateKey]) ? (this.state[stateKey] as any[]) : [];
        
        const mergedMap = new Map<string, any>();
        const itemsToPushToCloud: any[] = [];
        
        // Step A: Load all existing local items first (excluding any marked as deleted)
        for (const item of localItems) {
          if (item && item.id && !this.isDeleted(colName, item.id)) {
            const existsInCloud = cloudItems.some(c => c && c.id === item.id);
            if (cloudItems.length > 0 && !existsInCloud) {
              console.log(`[Firebase-Sync] Item ${colName}/${item.id} does not exist in Cloud yet. Preserving local and queueing upload.`);
              itemsToPushToCloud.push(item);
            }
            mergedMap.set(item.id, item);
          }
        }
        
        // Step B: Merge with cloud items based on timestamps & completeness
        for (const cloudItem of cloudItems) {
          if (!cloudItem || !cloudItem.id) continue;

          // If item was permanently deleted, purge from cloud and do NOT bring it back!
          if (this.isDeleted(colName, cloudItem.id)) {
            console.log(`[Firebase-Sync] Pruning deleted item ${colName}/${cloudItem.id} from cloud Firestore`);
            this.deleteFromCloud(colName, cloudItem.id).catch(() => {});
            continue;
          }
          
          const localItem = mergedMap.get(cloudItem.id);
          if (localItem) {
            // Both exist: compare terminal states and timestamps
            const isTermLocal = isEntityTerminal(colName, localItem);
            const isTermCloud = isEntityTerminal(colName, cloudItem);
            const isPendLocal = isEntityPending(colName, localItem);
            const isPendCloud = isEntityPending(colName, cloudItem);

            const localTime = getItemTimestamp(localItem);
            const cloudTime = getItemTimestamp(cloudItem);
            
            // For employee accounts, preserve passwordHash if cloud item does not have it
            const preservedPassword = (stateKey === 'employees' && localItem.passwordHash && !cloudItem.passwordHash)
              ? localItem.passwordHash
              : undefined;

            const localW = localItem.wallet || { availableBalance: 0, pendingWithdrawal: 0, totalEarnings: 0, totalWithdrawn: 0 };
            const cloudW = cloudItem.wallet || { availableBalance: 0, pendingWithdrawal: 0, totalEarnings: 0, totalWithdrawn: 0 };
            const mergedWallet = (stateKey === 'employees')
              ? {
                  ...cloudW,
                  availableBalance: localTime >= cloudTime ? (Number(localW.availableBalance) ?? 0) : (Number(cloudW.availableBalance) ?? 0),
                  totalEarnings: Math.max(Number(localW.totalEarnings) || 0, Number(cloudW.totalEarnings) || 0),
                  pendingWithdrawal: Math.max(Number(localW.pendingWithdrawal) || 0, Number(cloudW.pendingWithdrawal) || 0),
                  totalWithdrawn: Math.max(Number(localW.totalWithdrawn) || 0, Number(cloudW.totalWithdrawn) || 0)
                }
              : (cloudItem.wallet || localItem.wallet);

            // Priority 1: Progress rank comparison (Confirmed/Approved/Shipped/Delivered always overrides Pending!)
            const localRank = getEntityProgressRank(colName, localItem);
            const cloudRank = getEntityProgressRank(colName, cloudItem);

            if (localRank > cloudRank) {
              console.log(`[Firebase-Sync] Preserving advanced LOCAL state for ${colName}/${cloudItem.id} (rank ${localRank} > ${cloudRank}) over pending cloud record.`);
              const merged = {
                ...cloudItem,
                ...localItem,
                ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
              };
              mergedMap.set(cloudItem.id, merged);
              itemsToPushToCloud.push(merged);
            } else if (cloudRank > localRank) {
              console.log(`[Firebase-Sync] Adopting advanced CLOUD state for ${colName}/${cloudItem.id} (rank ${cloudRank} > ${localRank}) over pending local record.`);
              const merged = {
                ...localItem,
                ...cloudItem,
                ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
              };
              mergedMap.set(cloudItem.id, merged);
            } else if (cloudTime > localTime) {
              mergedMap.set(cloudItem.id, {
                ...localItem,
                ...cloudItem,
                ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
              });
            } else if (localTime > cloudTime) {
              // Local is strictly newer: keep local and upload to cloud
              const merged = {
                ...cloudItem,
                ...localItem,
                ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
              };
              mergedMap.set(cloudItem.id, merged);
              itemsToPushToCloud.push(merged);
            } else {
              // Timestamps & rank equal: keep local data, do not let stale cloud overwrite local
              mergedMap.set(cloudItem.id, {
                ...cloudItem,
                ...localItem,
                ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
              });
            }
          } else {
            // Brand new item from cloud (e.g. from live website or external registration): add to local
            mergedMap.set(cloudItem.id, cloudItem);
          }
        }
        
        // Step C: Ensure ALL local items (including practice and registered resellers) are fully preserved and pushed to cloud
        const cloudIds = new Set(cloudItems.map(item => item.id));
        for (const localItem of localItems) {
          if (
            localItem &&
            localItem.id &&
            !cloudIds.has(localItem.id) &&
            !this.isDeleted(colName, localItem.id)
          ) {
            itemsToPushToCloud.push(localItem);
            mergedMap.set(localItem.id, localItem);
          }
        }

        const finalMerged = Array.from(mergedMap.values());
        (this.state[stateKey] as any) = finalMerged;
        if (stateKey === 'employees' || stateKey === 'withdrawals' || stateKey === 'sales' || stateKey === 'transactions') {
          this.rebuildIndices();
          this.reconcileAllWallets();
        }
        
        for (const item of finalMerged) {
          this.lastSyncedHashes.set(`${colName}/${item.id}`, JSON.stringify(item));
        }
        
        console.log(`[Firebase-Sync] Safe two-way sync for "${colName}": ${cloudItems.length} cloud, ${localItems.length} local -> ${finalMerged.length} preserved.`);
        
        // Upload any items that Cloud was missing to Firestore in the background
        if (itemsToPushToCloud.length > 0) {
          this.syncCollectionDirect(colName, itemsToPushToCloud).catch(e =>
            console.warn(`[Firebase-Sync] Background upload of missing items for "${colName}" error:`, e)
          );
        }
      } catch (err: any) {
        if (isFirestoreQuotaError(err)) {
          this.isReadQuotaExhausted = true;
          this.readQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
          quotaHit = true;
          console.warn(`[Firebase-Quota] Daily read quota reached for collection "${colName}". Preserving local items safely.`);
        } else {
          console.error(`[Firebase-Sync] Error pulling collection "${colName}":`, err);
        }
      }
    };

    await Promise.all([
      pullCollection('categories', 'categories'),
      pullCollection('products', 'products'),
      pullCollection('employees', 'employees'),
      pullCollection('sales', 'sales'),
      pullCollection('withdrawals', 'withdrawals'),
      pullCollection('transactions', 'transactions'),
      pullCollection('payment_settings', 'paymentSettings'),
      pullCollection('balance_topup_requests', 'balanceTopupRequests' as any),
      pullCollection('notifications', 'notifications'),
      pullCollection('audit_logs', 'auditLogs'),
      pullCollection('subsections', 'subsections'),
      pullCollection('training_videos', 'trainingVideos'),
    ]);

    this.ensureCoreData();
    this.deduplicateEmployees();
    this.consolidateSalesByOrderCode();
    this.isCloudSynced = true;
    this.saveDirect(this.state);

    const stats = {
      products: this.state.products.length,
      categories: this.state.categories.length,
      employees: this.state.employees.length,
      sales: this.state.sales.length,
      withdrawals: this.state.withdrawals.length,
      transactions: this.state.transactions.length,
      subsections: (this.state.subsections || []).length,
      trainingVideos: (this.state.trainingVideos || []).length,
    };

    console.log('[Firebase] Force sync complete. Stats:', JSON.stringify(stats));

    return {
      success: true,
      quotaReached: quotaHit,
      syncedAt: new Date().toISOString(),
      stats
    };
  }

  private async initCloudSync() {
    if (!firestore) return;
    try {
      const isConnected = await testFirestoreConnection();
      if (!isConnected) {
        this.isReadQuotaExhausted = true;
        this.readQuotaExhaustedUntil = Date.now() + 60 * 60 * 1000;
        console.warn('[Firebase] Cloud Firestore connection not ready or quota reached. Immediate fallback: Serving data from local store.');
        return;
      }
      console.log('[Firebase] Initializing granular cloud synchronization...');

      let isFirestoreInitialized = false;

      // 1. Load Brand Settings safely with timestamp check
      try {
        const brandDoc = await getDoc(doc(firestore, 'brand_settings', 'default'));
        isFirestoreInitialized = brandDoc.exists();
        if (isFirestoreInitialized) {
          const brandData = brandDoc.data() as BrandSettings;
          const localUpdated = Number(this.state.brandSettings.updatedAt || 0);
          const cloudUpdated = Number(brandData.updatedAt || 0);
          
          if (cloudUpdated >= localUpdated) {
            this.state.brandSettings = { ...this.state.brandSettings, ...brandData };
            this.lastSyncedHashes.set('brand_settings/default', JSON.stringify(brandData));
            console.log('[Firebase] Brand settings loaded from cloud (Cloud version newer or equal)');
          } else {
            console.log('[Firebase] Local brand settings are newer than cloud, preserving local settings and scheduling cloud update');
            this.syncToCloudDebounced();
          }
        }
      } catch (err: any) {
        if (isFirestoreQuotaError(err)) {
          this.isReadQuotaExhausted = true;
          this.readQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
          console.warn('[Firebase-Quota] Quota exhausted during brand settings load. Falling back to local store.json settings.');
        } else {
          console.error('[Firebase] Failed to load brand settings:', err);
        }
      }

      // 2. Load Collections safely with robust bidirectional synchronization
      const loadCollection = async (colName: string, stateKey: keyof DatabaseState) => {
        try {
          const snap = await getDocs(query(collection(firestore!, colName)));
          const localItems = Array.isArray(this.state[stateKey]) ? (this.state[stateKey] as any[]) : [];
          
          // Map local items by ID for quick lookup and merge
          const localMap = new Map<string, any>();
          for (const item of localItems) {
            if (item && item.id && !this.isDeleted(colName, item.id)) {
              localMap.set(item.id, item);
            }
          }

          if (!snap.empty) {
            let cloudCount = 0;
            for (const docSnap of snap.docs) {
              const cloudItem = docSnap.data();
              if (cloudItem && cloudItem.id) {
                if (this.isDeleted(colName, cloudItem.id)) {
                  this.deleteFromCloud(colName, cloudItem.id).catch(() => {});
                  continue;
                }
                cloudCount++;
                const localItem = localMap.get(cloudItem.id);
                if (localItem) {
                  // Compare terminal states and timestamps
                  const isTermLocal = isEntityTerminal(colName, localItem);
                  const isTermCloud = isEntityTerminal(colName, cloudItem);
                  const isPendLocal = isEntityPending(colName, localItem);
                  const isPendCloud = isEntityPending(colName, cloudItem);

                  const localTime = getItemTimestamp(localItem);
                  const cloudTime = getItemTimestamp(cloudItem);

                  const preservedPassword = (stateKey === 'employees' && localItem.passwordHash && !cloudItem.passwordHash)
                    ? localItem.passwordHash
                    : undefined;

                  const localW = localItem.wallet || { availableBalance: 0, pendingWithdrawal: 0, totalEarnings: 0, totalWithdrawn: 0 };
                  const cloudW = cloudItem.wallet || { availableBalance: 0, pendingWithdrawal: 0, totalEarnings: 0, totalWithdrawn: 0 };
                  const mergedWallet = (stateKey === 'employees')
                    ? {
                        ...cloudW,
                        availableBalance: localTime >= cloudTime ? (Number(localW.availableBalance) ?? 0) : (Number(cloudW.availableBalance) ?? 0),
                        totalEarnings: Math.max(Number(localW.totalEarnings) || 0, Number(cloudW.totalEarnings) || 0),
                        pendingWithdrawal: Math.max(Number(localW.pendingWithdrawal) || 0, Number(cloudW.pendingWithdrawal) || 0),
                        totalWithdrawn: Math.max(Number(localW.totalWithdrawn) || 0, Number(cloudW.totalWithdrawn) || 0)
                      }
                    : (cloudItem.wallet || localItem.wallet);

                  const localRank = getEntityProgressRank(colName, localItem);
                  const cloudRank = getEntityProgressRank(colName, cloudItem);

                  if (localRank > cloudRank) {
                    console.log(`[Firebase-Init] Preserving advanced LOCAL state for ${colName}/${cloudItem.id} (rank ${localRank} > ${cloudRank}) over pending cloud.`);
                    localMap.set(cloudItem.id, {
                      ...cloudItem,
                      ...localItem,
                      ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
                    });
                    this.lastSyncedHashes.delete(`${colName}/${cloudItem.id}`); // queue push to cloud
                  } else if (cloudRank > localRank) {
                    console.log(`[Firebase-Init] Adopting advanced CLOUD state for ${colName}/${cloudItem.id} (rank ${cloudRank} > ${localRank}) over pending local.`);
                    localMap.set(cloudItem.id, {
                      ...localItem,
                      ...cloudItem,
                      ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                      ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
                    });
                  } else if (cloudTime > localTime) {
                    localMap.set(cloudItem.id, {
                      ...localItem,
                      ...cloudItem,
                      ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                      ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
                    });
                  } else if (localTime > cloudTime) {
                    localMap.set(cloudItem.id, {
                      ...cloudItem,
                      ...localItem,
                      ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                      ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
                    });
                    this.lastSyncedHashes.delete(`${colName}/${cloudItem.id}`);
                  } else {
                    // Equal rank and timestamp: LOCAL WINS, do not overwrite local with stale cloud
                    localMap.set(cloudItem.id, {
                      ...cloudItem,
                      ...localItem,
                      ...(preservedPassword ? { passwordHash: preservedPassword } : {}),
                      ...(stateKey === 'employees' ? { wallet: mergedWallet } : {})
                    });
                  }
                } else {
                  // Not in local, add it
                  localMap.set(cloudItem.id, cloudItem);
                }
                // Update synced hash for this item
                this.lastSyncedHashes.set(`${colName}/${cloudItem.id}`, JSON.stringify(localMap.get(cloudItem.id)));
              }
            }

            const mergedItems = Array.from(localMap.values());
            (this.state[stateKey] as any) = mergedItems;
            console.log(`[Firebase] Merged Cloud and Local for "${colName}". Cloud count: ${cloudCount}, Total after merge: ${mergedItems.length}`);
            
            // Queue sync to make sure any local-only or newer items are uploaded to Firestore
            this.syncToCloudDebounced();
          } else {
            console.log(`[Firebase] Cloud collection "${colName}" is empty, preserving local items and queuing sync`);
            for (const item of localItems) {
              if (item && item.id) {
                this.lastSyncedHashes.set(`${colName}/${item.id}`, JSON.stringify(item));
              }
            }
            if (localItems.length > 0) {
              this.syncToCloudDebounced();
            }
          }
        } catch (err: any) {
          if (isFirestoreQuotaError(err)) {
            this.isReadQuotaExhausted = true;
            this.readQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
            console.warn(`[Firebase-Quota] Quota exhausted while loading collection "${colName}". Preserving local file data safely.`);
          } else {
            console.error(`[Firebase] Error loading collection "${colName}":`, err);
          }
        }
      };

      await Promise.all([
        loadCollection('categories', 'categories'),
        loadCollection('products', 'products'),
        loadCollection('employees', 'employees'),
        loadCollection('sales', 'sales'),
        loadCollection('withdrawals', 'withdrawals'),
        loadCollection('transactions', 'transactions'),
        loadCollection('payment_settings', 'paymentSettings'),
        loadCollection('balance_topup_requests', 'balanceTopupRequests' as any),
        loadCollection('notifications', 'notifications'),
        loadCollection('audit_logs', 'auditLogs'),
        loadCollection('subsections', 'subsections'),
        loadCollection('training_videos', 'trainingVideos'),
      ]);

      // Always keep published versions in sync with current active products/categories
      this.state.publishedProducts = (this.state.products || []).filter(p => !p.isArchived && p.isActive !== false);
      this.state.publishedCategories = (this.state.categories || []).filter(c => c.isActive !== false);
      if (this.state.subsections) {
        this.state.publishedSubsections = (this.state.subsections || []).filter(s => s.isActive !== false);
      }

      // Ensure standard core categories and products are available and synced
      this.ensureCoreData();
      this.deduplicateEmployees();
      this.consolidateSalesByOrderCode();

      this.isCloudSynced = true;
      this.saveDirect(this.state);
      console.log('[Firebase] Granular cloud sync complete.');
    } catch (err) {
      console.error('[Firebase] Cloud sync error:', err);
    }
  }

  private ensureCoreData() {
    // Keep published versions in sync with current state
    this.state.publishedProducts = (this.state.products || []).filter(p => !p.isArchived && p.isActive !== false);
    this.state.publishedCategories = (this.state.categories || []).filter(c => c.isActive !== false);
    if (!this.state.subsections) {
      this.state.subsections = [];
    }
    const hasGadgetParent = (this.state.subsections || []).some(
      s => s.parentSlug === 'gadgets' && (!s.parentSub || s.parentSub === '')
    );
    if (!hasGadgetParent) {
      this.state.subsections.push(
        {
          id: 'sub-gadgets-parent',
          name: 'গ্যাজেট কালেকশন',
          parentSlug: 'gadgets',
          description: 'স্মার্ট ওয়াচ, বাটন ফোন, হেডফোন ও প্রিমিয়াম গ্যাজেটস কালেকশন।',
          imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
          order: 2,
          isActive: true
        },
        {
          id: 'sub-gadgets-phone',
          name: 'বাটন ফোন',
          parentSlug: 'gadgets',
          parentSub: 'গ্যাজেট কালেকশন',
          description: 'প্রিমিয়াম ফিচার ও বাটন ফোন কালেকশন',
          imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
          order: 1,
          isActive: true
        },
        {
          id: 'sub-gadgets-watch',
          name: 'স্মার্ট ওয়াচ',
          parentSlug: 'gadgets',
          parentSub: 'গ্যাজেট কালেকশন',
          description: 'লেটেস্ট স্মার্ট ওয়াচ ও ফিটনেস ট্র্যাকার',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
          order: 2,
          isActive: true
        },
        {
          id: 'sub-gadgets-headphone',
          name: 'হেডফোন ও এয়ারবাডস',
          parentSlug: 'gadgets',
          parentSub: 'গ্যাজেট কালেকশন',
          description: 'ওয়্যারলেস ইয়ারবাডস ও সাউন্ড হেডসেট',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
          order: 3,
          isActive: true
        },
        {
          id: 'sub-gadgets-powerbank',
          name: 'পাওয়ার ব্যাংক',
          parentSlug: 'gadgets',
          parentSub: 'গ্যাজেট কালেকশন',
          description: 'ফাস্ট চার্জিং পাওয়ার ব্যাংক কালেকশন',
          imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=80',
          order: 4,
          isActive: true
        },
        {
          id: 'sub-gadgets-accessories',
          name: 'স্মার্ট এক্সেসরিজ',
          parentSlug: 'gadgets',
          parentSub: 'গ্যাজেট কালেকশন',
          description: 'কেব্‌ল, চার্জার ও প্রয়োজনীয় গ্যাজেট এক্সেসরিজ',
          imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
          order: 5,
          isActive: true
        }
      );
    }
    this.state.publishedSubsections = (this.state.subsections || []).filter(s => s.isActive !== false);
    if (!this.state.referralSettings) {
      this.state.referralSettings = {
        defaultRatePercent: 10,
        defaultMaxCap: 10,
        nonOfficialMarkup: 10,
        officialReferralCode: 'TAWZOON9516'
      };
    }
    if (!Array.isArray(this.state.employees)) {
      this.state.employees = [];
    }

    // Auto-prune expired sessions, stale idempotency keys, and bloat
    const now = Date.now();
    if (Array.isArray(this.state.adminSessions)) {
      this.state.adminSessions = this.state.adminSessions.filter(s => s && s.expiresAt && s.expiresAt > now);
    }
    if (Array.isArray(this.state.employeeSessions)) {
      this.state.employeeSessions = this.state.employeeSessions.filter(s => s && s.expiresAt && s.expiresAt > now);
    }
    if (this.state.idempotencyKeys) {
      for (const [k, v] of Object.entries(this.state.idempotencyKeys)) {
        if (k.startsWith('idemp_test_') || (v && v.createdAt && (now - new Date(v.createdAt).getTime() > 7 * 24 * 3600 * 1000))) {
          delete this.state.idempotencyKeys[k];
        }
      }
    }
    if (Array.isArray(this.state.auditLogs) && this.state.auditLogs.length > 100) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 100);
    }

    this.rebuildIndices();
  }

  private load(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      let raw: string | null = null;
      if (fs.existsSync(STORE_PATH)) {
        raw = fs.readFileSync(STORE_PATH, 'utf-8');
      } else if (fs.existsSync(STORE_BACKUP_PATH)) {
        console.log('[Database] Restoring from store.backup.json');
        raw = fs.readFileSync(STORE_BACKUP_PATH, 'utf-8');
      }

      if (raw) {
        let parsed = JSON.parse(raw);
        // Guard against accidental product or employee loss by checking backup sources
        if ((!parsed.products || parsed.products.length === 0) && fs.existsSync(STORE_BACKUP_PATH)) {
          try {
            const b = JSON.parse(fs.readFileSync(STORE_BACKUP_PATH, 'utf-8'));
            if (b.products && b.products.length > 0) {
              console.log(`[Database] Recovered ${b.products.length} products from store.backup.json`);
              parsed.products = b.products;
              if ((!parsed.categories || parsed.categories.length === 0) && b.categories) {
                parsed.categories = b.categories;
              }
            }
          } catch (e) {}
        }

        // Filter out any products marked as deleted
        if (Array.isArray(parsed.products)) {
          const deletedIds = new Set(parsed.deletedProductIds || (parsed.deletedItemIds && parsed.deletedItemIds['products']) || []);
          parsed.products = parsed.products.filter((p: any) => p && p.id && !deletedIds.has(p.id));
        }

        // Filter out any employees marked as deleted
        let loadedEmployees = Array.isArray(parsed.employees) ? parsed.employees : [];
        if (parsed.deletedItemIds && Array.isArray(parsed.deletedItemIds['employees'])) {
          const deletedEmpIds = new Set(parsed.deletedItemIds['employees']);
          loadedEmployees = loadedEmployees.filter((e: any) => e && e.id && !deletedEmpIds.has(e.id));
        }

        // Filter out any sales marked as deleted
        let loadedSales = Array.isArray(parsed.sales) ? parsed.sales : [];
        if (parsed.deletedItemIds && Array.isArray(parsed.deletedItemIds['sales'])) {
          const deletedSaleIds = new Set(parsed.deletedItemIds['sales']);
          loadedSales = loadedSales.filter((s: any) => s && s.id && !deletedSaleIds.has(s.id) && !deletedSaleIds.has(s.orderCode));
        }

        return {
          ...INITIAL_DATA,
          ...parsed,
          categories: parsed.categories || [],
          products: parsed.products || [],
          employees: loadedEmployees,
          sales: loadedSales,
          publishedCategories: parsed.publishedCategories || [],
          publishedProducts: parsed.publishedProducts || [],
          adminSessions: parsed.adminSessions || [],
          employeeSessions: parsed.employeeSessions || [],
        };
      }
    } catch (err) {
      console.error('Error loading database store, checking backup:', err);
      try {
        if (fs.existsSync(STORE_BACKUP_PATH)) {
          const rawBackup = fs.readFileSync(STORE_BACKUP_PATH, 'utf-8');
          const parsed = JSON.parse(rawBackup);
          return {
            ...INITIAL_DATA,
            ...parsed,
            categories: parsed.categories || [],
            products: parsed.products || [],
            publishedCategories: parsed.publishedCategories || [],
            publishedProducts: parsed.publishedProducts || [],
          };
        }
      } catch (backupErr) {
        console.error('Backup load failed too:', backupErr);
      }
    }
    this.saveDirect(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private saveDirect(data: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const json = JSON.stringify(data);
      fs.writeFile(STORE_PATH, json, 'utf-8', () => {});
      fs.writeFile(STORE_BACKUP_PATH, json, 'utf-8', () => {});

      // Also ensure src/data/store.json is kept up-to-date
      try {
        const srcDir = path.dirname(SRC_STORE_PATH);
        if (fs.existsSync(srcDir)) {
          fs.writeFile(SRC_STORE_PATH, json, 'utf-8', () => {});
        }
      } catch (srcErr) {}
      this.rebuildIndices();
    } catch (err) {
      console.error('Failed to write database store:', err);
    }
  }

  public save() {
    this.saveDirect(this.state);
    this.syncToCloudDebounced();
  }

  private syncToCloudDebounced() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.syncToCloudDirect();
    }, 1000); // 1 second debounce for granular sync
  }

  public async syncToCloudDirect() {
    if (!firestore) return;
    if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) {
      return; // Skip cloud writes while write quota is in cooldown; local store is 100% up-to-date
    }

    try {
      // 1. Sync Brand Settings with hash check to save quota
      const brandSettingsJson = JSON.stringify(this.state.brandSettings);
      if (this.lastSyncedHashes.get('brand_settings/default') !== brandSettingsJson) {
        try {
          await setDoc(doc(firestore, 'brand_settings', 'default'), JSON.parse(brandSettingsJson), { merge: true });
          this.lastSyncedHashes.set('brand_settings/default', brandSettingsJson);
        } catch (e: any) {
          if (e.message?.includes('RESOURCE_EXHAUSTED') || e.code === 'resource-exhausted') {
            this.isWriteQuotaExhausted = true;
            this.writeQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
            console.warn('[Firebase-Quota] Daily write quota exceeded. Changes safely saved in local store.json.');
            return;
          }
        }
      }

      // 2. Granular Delta Sync Helper (Batched in concurrent chunks of 10 to eliminate sequential write bottleneck)
      const syncCollection = async (items: any[], colName: string) => {
        if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) return;

        const modifiedItems: Array<{ item: any; hashKey: string; json: string }> = [];
        for (const item of items) {
          if (!item.id || (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil)) continue;
          const hashKey = `${colName}/${item.id}`;
          const currentJson = JSON.stringify(item);

          // Skip if already synced and unchanged
          if (this.lastSyncedHashes.get(hashKey) === currentJson) {
            continue;
          }
          modifiedItems.push({ item, hashKey, json: currentJson });
        }
        if (modifiedItems.length === 0) return;

        // Concurrently write modified documents in chunks of 10 to optimize Cloud Firestore write throughput
        const CHUNK_SIZE = 10;
        for (let i = 0; i < modifiedItems.length; i += CHUNK_SIZE) {
          if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) return;
          const chunk = modifiedItems.slice(i, i + CHUNK_SIZE);
          await Promise.all(
            chunk.map(async ({ item, hashKey, json }) => {
              try {
                await setDoc(doc(firestore!, colName, item.id), JSON.parse(json), { merge: true });
                this.lastSyncedHashes.set(hashKey, json);
              } catch (e: any) {
                if (e.message?.includes('RESOURCE_EXHAUSTED') || e.code === 'resource-exhausted') {
                  this.isWriteQuotaExhausted = true;
                  this.writeQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
                  console.warn(`[Firebase-Quota] Write quota reached for "${hashKey}". Preserved in local store.json cache.`);
                }
              }
            })
          );
        }
      };

      // Sync critical entities
      await Promise.all([
        syncCollection(this.state.categories, 'categories'),
        syncCollection(this.state.products, 'products'),
        syncCollection(this.state.employees, 'employees'),
        syncCollection(this.state.sales, 'sales'),
        syncCollection(this.state.withdrawals, 'withdrawals'),
        syncCollection(this.state.transactions || [], 'transactions'),
        syncCollection(this.state.paymentSettings, 'payment_settings'),
        syncCollection(this.state.balanceTopupRequests || [], 'balance_topup_requests'),
        syncCollection(this.state.subsections || [], 'subsections'),
        syncCollection(this.state.trainingVideos || [], 'training_videos'),
      ]);

      // Sync recent logs/notifications
      if (!this.isWriteQuotaExhausted) {
        await syncCollection(this.state.notifications.slice(0, 50), 'notifications');
        await syncCollection(this.state.auditLogs.slice(0, 50), 'audit_logs');
      }

      if (!this.isWriteQuotaExhausted) {
        console.log('[Firebase] Granular delta-sync completed successfully.');
      }
    } catch (err: any) {
      if (err.message?.includes('RESOURCE_EXHAUSTED') || err.code === 'resource-exhausted') {
        this.isWriteQuotaExhausted = true;
        this.writeQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
      }
    }
  }

  public deduplicateEmployees() {
    if (!Array.isArray(this.state.employees)) return;
    const phoneMap = new Map<string, Employee & { passwordHash: string }>();
    const uniqueEmployees: (Employee & { passwordHash: string })[] = [];
    let hasDupes = false;

    // Prioritize APPROVED over PENDING, earlier registeredAt over later
    const sorted = [...this.state.employees].sort((a, b) => {
      if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
      if (b.status === 'APPROVED' && a.status !== 'APPROVED') return 1;
      return (a.registeredAt || '').localeCompare(b.registeredAt || '');
    });

    for (const emp of sorted) {
      const cleanPhone = normalizePhoneNumber(emp.phone);
      if (!cleanPhone) {
        uniqueEmployees.push(emp);
        continue;
      }
      const existing = phoneMap.get(cleanPhone);
      if (existing) {
        hasDupes = true;
        console.warn(`[Database] Auto-pruning duplicate employee account ${emp.id} (${emp.name}, ${cleanPhone}) in favor of primary account ${existing.id}`);
        this.markDeleted('employees', emp.id);
        this.deleteFromCloud('employees', emp.id).catch(() => {});
      } else {
        phoneMap.set(cleanPhone, emp);
        uniqueEmployees.push(emp);
      }
    }

    if (hasDupes) {
      this.state.employees = uniqueEmployees;
      this.rebuildIndices();
      this.saveDirect(this.state);
      this.createBackupSnapshot();
    }
  }

  public consolidateSalesByOrderCode() {
    if (!Array.isArray(this.state.sales)) return;
    const orderMap = new Map<string, { primary: any; items: any[] }>();
    const dupIds: string[] = [];

    for (const s of this.state.sales) {
      if (!s) continue;
      const code = s.orderCode || s.id;
      if (!orderMap.has(code)) {
        orderMap.set(code, {
          primary: { ...s },
          items: Array.isArray(s.items) && s.items.length > 0 ? [...s.items] : []
        });
      }

      const group = orderMap.get(code)!;
      const itemData = {
        productId: s.productId,
        productName: s.productName,
        productCode: s.productCode,
        quantity: s.quantity || 1,
        size: s.size,
        unitPrice: s.actualSalePrice || s.sellingPrice || 0,
        sellingPrice: s.sellingPrice || s.actualSalePrice || 0,
        basePrice: s.basePrice || 0,
        totalAmount: s.totalAmount || ((s.sellingPrice || s.actualSalePrice || 0) * (s.quantity || 1)),
        commissionAmount: s.commissionAmount || 0,
      };

      if (group.primary.id === s.id) {
        if (group.items.length === 0) {
          group.items.push(itemData);
        }
      } else {
        dupIds.push(s.id);
        group.items.push(itemData);
        group.primary.totalAmount = (group.primary.totalAmount || 0) + itemData.totalAmount;
        group.primary.commissionAmount = (group.primary.commissionAmount || 0) + itemData.commissionAmount;
        group.primary.quantity = (group.primary.quantity || 1) + itemData.quantity;
      }
    }

    if (dupIds.length > 0) {
      const consolidated: any[] = [];
      for (const [_, group] of orderMap.entries()) {
        const primary = group.primary;
        primary.items = group.items;
        if (group.items.length > 1) {
          primary.productName = group.items.map(i => i.productName + (i.quantity > 1 ? ` (${i.quantity}x)` : '')).join(', ');
        }
        consolidated.push(primary);
      }

      this.state.sales = consolidated;
      for (const id of dupIds) {
        this.markDeleted('sales', id);
        this.deleteFromCloud('sales', id).catch(() => {});
      }
      this.saveDirect(this.state);
      this.createBackupSnapshot();
      console.log(`[Database] Auto-consolidated ${dupIds.length} fragmented sales records into single orders.`);
    }
  }

  public rebuildIndices() {
    this.employeeByIdIndex.clear();
    this.employeeByCodeIndex.clear();
    this.employeeByPhoneIndex.clear();
    this.employeesByReferralIndex.clear();

    const emps = this.state.employees || [];
    for (const emp of emps) {
      if (emp.id) this.employeeByIdIndex.set(emp.id, emp);
      if (emp.referenceCode) {
        this.employeeByCodeIndex.set(emp.referenceCode.trim().toUpperCase(), emp);
      }
      if (emp.phone) {
        const cleanPhone = normalizePhoneNumber(emp.phone);
        if (cleanPhone) this.employeeByPhoneIndex.set(cleanPhone, emp);
      }
      const ref = (emp.referredBy || emp.reference || '').trim().toUpperCase();
      if (ref) {
        let list = this.employeesByReferralIndex.get(ref);
        if (!list) {
          list = [];
          this.employeesByReferralIndex.set(ref, list);
        }
        list.push(emp);
      }
    }
  }

  public getEmployeeById(id: string): (Employee & { passwordHash: string }) | undefined {
    return this.employeeByIdIndex.get(id);
  }

  public getEmployeeByCode(code: string): (Employee & { passwordHash: string }) | undefined {
    if (!code) return undefined;
    return this.employeeByCodeIndex.get(code.trim().toUpperCase());
  }

  public getEmployeeByPhone(phone: string): (Employee & { passwordHash: string }) | undefined {
    if (!phone) return undefined;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.employeeByPhoneIndex.get(cleanPhone);
  }

  public getDownlineEmployees(referralCode: string): (Employee & { passwordHash: string })[] {
    if (!referralCode) return [];
    return this.employeesByReferralIndex.get(referralCode.trim().toUpperCase()) || [];
  }

  /**
   * Reconciles an employee's wallet mathematically with their authoritative withdrawal & transaction ledger.
   * Guarantees that pending payouts, total withdrawals, and available balances always balance exactly.
   * Every single Taka in wallet.availableBalance MUST be backed by a Transaction ledger entry.
   */
  public reconcileEmployeeWallet(employeeId: string): void {
    const employee = this.state.employees.find(e => e.id === employeeId);
    if (!employee) return;

    if (!employee.wallet) {
      employee.wallet = { availableBalance: 0, pendingWithdrawal: 0, totalEarnings: 0, totalWithdrawn: 0 };
    }

    const empWithdrawals = (this.state.withdrawals || []).filter(w => w.employeeId === employeeId);
    
    // Sum of all currently PENDING withdrawals
    const pendingWithdrawal = empWithdrawals
      .filter(w => (w.status || '').toUpperCase() === 'PENDING')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Sum of all APPROVED/PAID withdrawals
    const totalWithdrawn = empWithdrawals
      .filter(w => (w.status || '').toUpperCase() === 'APPROVED' || (w.status || '').toUpperCase() === 'PAID')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Sum of all credited earnings STRICTLY from completed transactions in the ledger
    const empTrx = (this.state.transactions || []).filter(
      t => t.employeeId === employeeId && ((t as any).status === 'COMPLETED' || !(t as any).status || (t as any).status === 'APPROVED')
    );
    const earningsFromTrx = empTrx
      .filter(t => ['COMMISSION', 'REFERRAL_BONUS', 'COMMISSION_EARNED', 'BONUS', 'BALANCE_TOPUP', 'ADJUSTMENT'].includes((t.type || '').toUpperCase()))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const computedEarnings = Math.max(0, empTrx
      .filter(t => ['COMMISSION', 'REFERRAL_BONUS', 'COMMISSION_EARNED', 'BONUS'].includes((t.type || '').toUpperCase()) && Number(t.amount) > 0)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0));

    employee.wallet.totalEarnings = computedEarnings;
    employee.wallet.pendingWithdrawal = pendingWithdrawal;
    employee.wallet.totalWithdrawn = totalWithdrawn;
    
    // Available Balance = earningsFromTrx (including negative penalty adjustments & topups) - totalWithdrawn - pendingWithdrawal
    const computedAvailable = earningsFromTrx - totalWithdrawn - pendingWithdrawal;
    employee.wallet.availableBalance = computedAvailable;
    employee.updatedAt = new Date().toISOString();
  }

  public ensureTransactionLedgerConsistency(): void {
    const sales = this.state.sales || [];
    if (!this.state.transactions) this.state.transactions = [];

    for (const sale of sales) {
      if (!sale.employeeId || sale.employeeId === 'OFFICIAL' || !sale.commissionAmount || sale.commissionAmount <= 0) continue;

      // Confirmed/Shipped sales are waiting for admin profit release: do not credit commission until explicitly approved
      if (sale.saleStatus === 'Confirmed' || (sale as any).status === 'CONFIRMED' || sale.deliveryStatus === 'shipped') {
        continue;
      }

      // Fix stale automatic paymentStatus = 'PAID' on unapproved pending sales, unless advance paid or profit explicitly released
      if (sale.saleStatus === 'Pending Verification' || sale.saleStatus === 'pending' || !sale.saleStatus) {
        if (sale.paymentStatus === 'PAID' && !(sale as any).isAdvancePaid && !sale.notes?.includes('অগ্রিম পরিশোধিত') && !sale.profitReleased) {
          sale.paymentStatus = 'PENDING';
        }
        continue;
      }

      // CRITICAL: Commission is ONLY valid if profit was explicitly released by Admin, NEVER from automated courier preview
      const isApproved = Boolean(sale.profitReleased || (sale.saleStatus === 'Approved' && sale.paymentStatus === 'PAID'));
      if (!isApproved) continue;

      // Check if transaction already exists for this order/sale (idempotency guard)
      const existing = this.state.transactions.find(
        t => t.employeeId === sale.employeeId &&
        (t.reference === sale.orderCode || t.reference === sale.id) &&
        ['COMMISSION_EARNED', 'COMMISSION'].includes((t.type || '').toUpperCase()) &&
        !t.description.includes('রেফারেল')
      );

      if (!existing) {
        const emp = this.state.employees.find(e => e.id === sale.employeeId);
        const balanceAfter = emp ? emp.wallet.availableBalance + sale.commissionAmount : sale.commissionAmount;
        const newTrx: Transaction = {
          id: 'trx-auto-' + crypto.randomUUID().slice(0, 8),
          employeeId: sale.employeeId,
          type: 'COMMISSION_EARNED',
          amount: sale.commissionAmount,
          balanceAfter: balanceAfter,
          status: 'COMPLETED',
          reference: sale.orderCode || sale.id,
          description: `পণ্য বিক্রয় কমিশন: অর্ডার #${sale.orderCode || sale.id} (${sale.productName || 'পণ্য'} x ${sale.quantity || 1})`,
          timestamp: sale.saleDate || sale.updatedAt || new Date().toISOString()
        };
        this.state.transactions.unshift(newTrx);
      }
    }

    this.reconcileAllWallets();
  }

  public reconcileAllWallets(): void {
    for (const emp of this.state.employees) {
      this.reconcileEmployeeWallet(emp.id);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  /**
   * Immediately persist an entity to Cloud Firestore without waiting for debounce.
   * Crucial for Cloud Run environments where CPU throttles after request completion.
   */
  public async syncEntityDirect(colName: string, item: any, throwOnError: boolean = false): Promise<void> {
    if (!firestore || !item || !item.id) return;
    const hashKey = `${colName}/${item.id}`;
    let payload = JSON.parse(JSON.stringify(item));
    let jsonStr = JSON.stringify(payload);

    // If payload exceeds 850KB, preserve documents safely within Firestore's 1MB limit without corrupting strings
    if (jsonStr.length > 850 * 1024 && Array.isArray(payload.images) && payload.images.length > 5) {
      console.warn(`[Firebase] Document ${colName}/${item.id} is large (${Math.round(jsonStr.length/1024)}KB). Retaining first 8 high-priority images to fit Firestore 1MB quota safely.`);
      payload = {
        ...payload,
        images: payload.images.slice(0, 8)
      };
      jsonStr = JSON.stringify(payload);
    }

    // If daily write quota was previously hit, buffer directly into durable outbox without spamming gRPC
    if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) {
      this.enqueueOutbox(colName, payload, 'Daily write quota reached. Buffered locally.');
      return;
    }

    if (!payload.updatedAt) {
      payload.updatedAt = new Date().toISOString();
      jsonStr = JSON.stringify(payload);
    }

    try {
      await Promise.race([
        setDoc(doc(firestore, colName, item.id), JSON.parse(jsonStr), { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 10000))
      ]);
      this.lastSyncedHashes.set(hashKey, jsonStr);
      this.isWriteQuotaExhausted = false;
      console.log(`[Firebase-Live] Immediately persisted ${colName}/${item.id} to Cloud Firestore`);
    } catch (err: any) {
      if (isFirestoreWriteQuotaError(err)) {
        this.isWriteQuotaExhausted = true;
        this.writeQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
        console.warn(`[Firebase-Quota] Write limit reached for ${colName}/${item.id}. Enqueuing in durable outbox queue.`);
      } else {
        console.warn(`[Firebase] Immediate write note for ${colName}/${item.id}:`, err?.message || err);
      }

      // Auto-enqueue into durable outbox queue when Cloud write fails!
      this.enqueueOutbox(colName, payload, err?.message || String(err));

      if (throwOnError) {
        throw err;
      }
    }
  }

  public enqueueOutbox(colName: string, payload: any, errorMsg?: string) {
    if (!this.state.syncOutboxQueue) {
      this.state.syncOutboxQueue = [];
    }
    if (!payload || !payload.id) return;

    // Deduplicate existing pending outbox item for same entity
    const existingIdx = this.state.syncOutboxQueue.findIndex(q => q.colName === colName && q.payload?.id === payload.id);
    const item: OutboxItem = {
      id: 'outbox-' + crypto.randomUUID().slice(0, 8),
      colName,
      payload: JSON.parse(JSON.stringify(payload)),
      createdAt: new Date().toISOString(),
      retryCount: existingIdx >= 0 ? (this.state.syncOutboxQueue[existingIdx].retryCount || 0) + 1 : 0,
      lastError: errorMsg
    };

    if (existingIdx >= 0) {
      this.state.syncOutboxQueue[existingIdx] = item;
    } else {
      this.state.syncOutboxQueue.push(item);
    }
    this.save();
  }

  public async processSyncOutbox(): Promise<{ processed: number; failed: number }> {
    if (!firestore || !this.state.syncOutboxQueue || this.state.syncOutboxQueue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;
    const remainingQueue: OutboxItem[] = [];

    for (const item of [...this.state.syncOutboxQueue]) {
      try {
        const cleanPayload = JSON.parse(JSON.stringify(item.payload));
        const jsonStr = JSON.stringify(cleanPayload);
        await Promise.race([
          setDoc(doc(firestore, item.colName, item.payload.id), JSON.parse(jsonStr), { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Outbox write timeout')), 2500))
        ]);
        this.lastSyncedHashes.set(`${item.colName}/${item.payload.id}`, jsonStr);
        processed++;
        console.log(`[Outbox-Worker] Successfully synced queued entity ${item.colName}/${item.payload.id} to Cloud Firestore`);
      } catch (err: any) {
        failed++;
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = err?.message || String(err);
        if (isFirestoreQuotaError(err) || err.message?.includes('timeout')) {
          this.isWriteQuotaExhausted = true;
          this.writeQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
          console.warn('[Firebase-Quota] Outbox worker paused due to daily write quota or timeout.');
          remainingQueue.push(item);
          break; // Stop trying subsequent items in this run
        }
        if (item.retryCount < 50) {
          remainingQueue.push(item);
        } else {
          console.error(`[Outbox-Worker] Dropped outbox item ${item.colName}/${item.payload.id} after 50 failed attempts:`, err);
        }
      }
    }

    this.state.syncOutboxQueue = remainingQueue;
    this.save();
    return { processed, failed };
  }

  public getIdempotencyRecord(key: string): IdempotencyRecord | null {
    if (!key) return null;
    const records = this.state.idempotencyKeys || {};
    return records[key] || null;
  }

  public async setIdempotencyRecord(key: string, record: { status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'QUEUED'; responsePayload?: any }): Promise<IdempotencyRecord> {
    if (!key) throw new Error('Idempotency key is required');
    if (!this.state.idempotencyKeys) {
      this.state.idempotencyKeys = {};
    }
    const existing = this.state.idempotencyKeys[key];
    const now = new Date().toISOString();
    const rawRecord: IdempotencyRecord = {
      key,
      status: record.status,
      responsePayload: record.responsePayload ?? existing?.responsePayload,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    const fullRecord: IdempotencyRecord = JSON.parse(JSON.stringify(rawRecord));

    this.state.idempotencyKeys[key] = fullRecord;
    this.save();

    if (firestore && (!this.isWriteQuotaExhausted || Date.now() >= this.writeQuotaExhaustedUntil)) {
      Promise.race([
        setDoc(doc(firestore, '_idempotency_keys', key.replace(/[^a-zA-Z0-9_\-]/g, '_')), fullRecord, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Idempotency cloud sync timeout')), 2500))
      ]).catch((e: any) => {
        if (isFirestoreQuotaError(e) || e.message?.includes('timeout')) {
          this.isWriteQuotaExhausted = true;
          this.writeQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
        }
        console.warn(`[Firebase] Idempotency key cloud persist note for ${key}:`, e.message || e);
      });
    }

    return fullRecord;
  }

  /**
   * Immediately persist brand settings to Cloud Firestore.
   */
  public async syncBrandSettingsDirect(settings: BrandSettings): Promise<void> {
    if (!firestore || !settings) return;
    if (this.isWriteQuotaExhausted && Date.now() < this.writeQuotaExhaustedUntil) {
      return;
    }
    try {
      const jsonStr = JSON.stringify(settings);
      await Promise.race([
        setDoc(doc(firestore, 'brand_settings', 'default'), JSON.parse(jsonStr), { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Brand settings cloud sync timeout')), 2500))
      ]);
      this.lastSyncedHashes.set('brand_settings/default', jsonStr);
      console.log('[Firebase-Live] Immediately persisted brand_settings/default to Cloud Firestore');
    } catch (err: any) {
      if (isFirestoreQuotaError(err) || err.message?.includes('timeout')) {
        this.isWriteQuotaExhausted = true;
        this.writeQuotaExhaustedUntil = Date.now() + 15 * 60 * 1000;
      }
      console.warn('[Firebase] Immediate write for brand settings note:', err?.message || err);
    }
  }

  /**
   * Immediately persist a list of items to Cloud Firestore.
   */
  public async syncCollectionDirect(colName: string, items: any[]): Promise<void> {
    if (!firestore || !Array.isArray(items)) return;
    for (const item of items) {
      if (item && item.id) {
        await this.syncEntityDirect(colName, item);
      }
    }
  }

  public markDeleted(colName: string, id: string) {
    if (!this.state.deletedItemIds) this.state.deletedItemIds = {};
    if (!this.state.deletedItemIds[colName]) this.state.deletedItemIds[colName] = [];
    if (!this.state.deletedItemIds[colName].includes(id)) {
      this.state.deletedItemIds[colName].push(id);
    }
    if (colName === 'products') {
      if (!this.state.deletedProductIds) this.state.deletedProductIds = [];
      if (!this.state.deletedProductIds.includes(id)) {
        this.state.deletedProductIds.push(id);
      }
      this.state.products = (this.state.products || []).filter(p => p.id !== id);
      this.state.publishedProducts = (this.state.publishedProducts || []).filter(p => p.id !== id);
    } else if (colName === 'categories') {
      this.state.categories = (this.state.categories || []).filter(c => c.id !== id);
      this.state.publishedCategories = (this.state.publishedCategories || []).filter(c => c.id !== id);
    } else if (colName === 'employees') {
      this.state.employees = (this.state.employees || []).filter(e => e.id !== id);
      this.employeeByIdIndex.delete(id);
    } else if (colName === 'sales') {
      this.state.sales = (this.state.sales || []).filter(s => s.id !== id && s.orderCode !== id);
    }
    this.lastSyncedHashes.delete(`${colName}/${id}`);
    this.saveDirect(this.state);
    this.createBackupSnapshot();
  }

  public delete(colName: string, id: string) {
    this.markDeleted(colName, id);
    this.deleteFromCloud(colName, id).catch(() => {});
  }

  public isDeleted(colName: string, id: string): boolean {
    if (this.state.deletedItemIds && this.state.deletedItemIds[colName]) {
      if (this.state.deletedItemIds[colName].includes(id)) return true;
    }
    if (colName === 'products' && this.state.deletedProductIds) {
      if (this.state.deletedProductIds.includes(id)) return true;
    }
    return false;
  }

  public async purgeAllResellers() {
    const empIds = (this.state.employees || []).map(e => e.id);
    const saleIds = (this.state.sales || []).filter(s => s.employeeId && s.employeeId !== 'OFFICIAL').map(s => s.id);
    const wIds = (this.state.withdrawals || []).map(w => w.id);
    const tIds = (this.state.transactions || []).map(t => t.id);
    const notifIds = (this.state.notifications || []).filter(n => n.recipientRole === 'EMPLOYEE' && n.employeeId && n.employeeId !== 'OFFICIAL').map(n => n.id);
    const topupIds = (this.state.balanceTopupRequests || []).map(b => b.id);
    const subPayIds = (this.state.subscriptionPayments || []).map(sp => sp.id);

    // Also scan Firestore directly to ensure ALL accounts & records created in other instances are wiped
    if (firestore) {
      try {
        const empSnap = await getDocs(collection(firestore, 'employees'));
        for (const d of empSnap.docs) {
          if (!empIds.includes(d.id)) empIds.push(d.id);
        }
        const saleSnap = await getDocs(collection(firestore, 'sales'));
        for (const d of saleSnap.docs) {
          const sData = d.data();
          if (sData && sData.employeeId && sData.employeeId !== 'OFFICIAL') {
            if (!saleIds.includes(d.id)) saleIds.push(d.id);
          }
        }
        const wSnap = await getDocs(collection(firestore, 'withdrawals'));
        for (const d of wSnap.docs) {
          if (!wIds.includes(d.id)) wIds.push(d.id);
        }
        const tSnap = await getDocs(collection(firestore, 'transactions'));
        for (const d of tSnap.docs) {
          if (!tIds.includes(d.id)) tIds.push(d.id);
        }
        const notifSnap = await getDocs(collection(firestore, 'notifications'));
        for (const d of notifSnap.docs) {
          const nData = d.data();
          if (nData && (nData.recipientRole === 'EMPLOYEE' || nData.employeeId)) {
            if (!notifIds.includes(d.id)) notifIds.push(d.id);
          }
        }
        const topupSnap1 = await getDocs(collection(firestore, 'balance_topup_requests'));
        for (const d of topupSnap1.docs) {
          if (!topupIds.includes(d.id)) topupIds.push(d.id);
        }
        const topupSnap2 = await getDocs(collection(firestore, 'balanceTopupRequests'));
        for (const d of topupSnap2.docs) {
          if (!topupIds.includes(d.id)) topupIds.push(d.id);
        }
      } catch (e) {
        console.warn('[Database] Purge scan notice:', e);
      }
    }

    for (const id of empIds) {
      if (id) {
        this.markDeleted('employees', id);
        await this.deleteFromCloud('employees', id).catch(() => {});
      }
    }
    for (const id of saleIds) {
      if (id) {
        this.markDeleted('sales', id);
        await this.deleteFromCloud('sales', id).catch(() => {});
      }
    }
    for (const id of wIds) {
      if (id) {
        this.markDeleted('withdrawals', id);
        await this.deleteFromCloud('withdrawals', id).catch(() => {});
      }
    }
    for (const id of tIds) {
      if (id) {
        this.markDeleted('transactions', id);
        await this.deleteFromCloud('transactions', id).catch(() => {});
      }
    }
    for (const id of notifIds) {
      if (id) {
        await this.deleteFromCloud('notifications', id).catch(() => {});
      }
    }
    for (const id of topupIds) {
      if (id) {
        this.markDeleted('balance_topup_requests', id);
        await this.deleteFromCloud('balance_topup_requests', id).catch(() => {});
        await this.deleteFromCloud('balanceTopupRequests', id).catch(() => {});
      }
    }
    for (const id of subPayIds) {
      if (id) {
        this.markDeleted('subscriptionPayments', id);
        await this.deleteFromCloud('subscriptionPayments', id).catch(() => {});
      }
    }

    // Completely wipe reseller test accounts and orders, preserving official orders
    this.state.employees = [];
    this.state.employeeSessions = [];
    this.state.sales = (this.state.sales || []).filter(s => !s.employeeId || s.employeeId === 'OFFICIAL');
    this.state.withdrawals = [];
    this.state.transactions = [];
    this.state.notifications = (this.state.notifications || []).filter(n => n.recipientRole !== 'EMPLOYEE' || n.employeeId === 'OFFICIAL');
    this.state.balanceTopupRequests = [];
    this.state.subscriptionPayments = [];
    this.state.syncOutboxQueue = [];
    this.state.idempotencyKeys = {};
    this.rebuildIndices();
    this.saveDirect(this.state);

    // Mirror to backup and src files
    try {
      const cleanJson = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(STORE_BACKUP_PATH, cleanJson, 'utf-8');
      fs.writeFileSync(SRC_STORE_PATH, cleanJson, 'utf-8');
      const presyncPath = path.join(DATA_DIR, 'store.presync.json');
      if (fs.existsSync(presyncPath)) fs.unlinkSync(presyncPath);
    } catch (err) {
      console.warn('[Database] Backup files sync note:', err);
    }

    console.log('[Database] Purged all test reseller accounts, orders, withdrawals, topups, and transactions.');
  }

  public async deleteFromCloud(colName: string, id: string): Promise<boolean> {
    if (!firestore) return false;
    const hashKey = `${colName}/${id}`;
    this.lastSyncedHashes.delete(hashKey);
    try {
      await Promise.race([
        deleteDoc(doc(firestore, colName, id)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore delete timeout')), 12000))
      ]);
      console.log(`[Firebase] Permanently deleted document ${id} from ${colName} in Cloud Firestore`);
      
      // Also record permanent tombstone in Firestore so it never resurrects across backups or syncs
      try {
        await setDoc(doc(firestore, '_deletions', `${colName}_${id}`), {
          colName,
          id,
          deletedAt: Date.now()
        }, { merge: true });
      } catch (tombErr) {}

      return true;
    } catch (err: any) {
      if (err.message?.includes('RESOURCE_EXHAUSTED') || err.code === 'resource-exhausted') {
        console.warn(`[Firebase-Quota] Write limit reached. Document ${id} deleted from local store safely.`);
      } else {
        console.error(`[Firebase] Failed to delete document ${id} from ${colName}:`, err?.message || err);
      }
      return false;
    }
  }

  public logAudit(action: string, actor: string, target: string, previousValue?: string, newValue?: string, ip?: string) {
    const entry: AuditLogItem = {
      id: 'audit-' + crypto.randomUUID().slice(0, 8),
      action,
      actor,
      target,
      previousValue,
      newValue,
      ip,
      timestamp: new Date().toISOString()
    };
    this.state.auditLogs.unshift(entry);
    // Keep max 100 logs to maintain fast performance and prevent bloat
    if (this.state.auditLogs.length > 100) {
      this.state.auditLogs.length = 100;
    }
    this.save();
    return entry;
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>) {
    const notif: NotificationItem = {
      ...item,
      id: 'notif-' + crypto.randomUUID().slice(0, 8),
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.state.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public addSubscriptionPayment(payment: Omit<SubscriptionPayment, 'id' | 'createdAt' | 'status'> & { id?: string; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    if (!this.state.subscriptionPayments) {
      this.state.subscriptionPayments = [];
    }
    const item: SubscriptionPayment = {
      ...payment,
      id: payment.id || 'sub-pay-' + crypto.randomUUID().slice(0, 8),
      status: payment.status || 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.state.subscriptionPayments.unshift(item);
    this.save();
    return item;
  }

  public getSubscriptionPayments(): SubscriptionPayment[] {
    return this.state.subscriptionPayments || [];
  }
}

export const db = new Database();
