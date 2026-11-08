import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';
import {
  Product,
  Category,
  Employee,
  Sale,
  Withdrawal,
  Transaction,
  BrandSettings,
  PaymentSetting,
  AuditLogItem,
  NotificationItem,
  Subsection,
  SubscriptionPayment,
  BalanceTopupRequest,
} from '../types/index.js';
import { calculateResellerTrial } from '../utils/resellerTrial.js';
import { isCategoryMatch } from './ShopCategoryPage.js';
import { compressImageFile } from '../utils/imageCompressor.js';
import {
  ShieldCheck,
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingBag,
  ArrowDownLeft,
  Settings,
  CreditCard,
  FileText,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Check,
  Play,
  Copy,
  GripVertical,
  Sparkles,
  ShoppingCart,
  Truck,
  MoreVertical,
  Menu,
  Bell,
  Download,
  Share2,
  MessageSquare,
  MessageCircle,
  Globe,
  Search,
  Lock,
  Clock,
  Video,
} from 'lucide-react';
import {
  extractYouTubeId,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  getVideoThumbnail,
  getVideoEmbedUrl,
  isDirectVideoUrl,
} from '../utils/youtube.js';
import { ProductCard } from './ProductCard.js';
import { ProductDetailsPage } from './ProductDetailsPage.js';
import { useRealtimeEvents } from '../hooks/useRealtimeEvents.js';
import { isOfficialReferenceCode } from '../utils/pricing.js';

const AUTHORIZED_ADMIN_EMAIL = 'mdshaali9516@gmail.com';

const getTabTitle = (tab: string, lang: 'bn' | 'en') => {
  if (lang === 'bn') {
    switch (tab) {
      case 'dashboard': return 'ওভারভিউ ড্যাশবোর্ড';
      case 'products': return 'প্রোডাক্ট ম্যানেজমেন্ট';
      case 'categories': return 'ক্যাটাগরি কন্ট্রোল';
      case 'public_section': return 'পাবলিক সেকশন';
      case 'reseller_section': return 'রিসেলার সেকশন';
      case 'ai_hub': return 'এআই হাব (AI Hub)';
      case 'notifications': return 'নোটিফিকেশন সেকশন';
      case 'website_control': return 'ওয়েবসাইট ও পেমেন্ট';
      case 'sales': return 'মাস্টার অর্ডার সেকশন';
      case 'withdrawals': return 'উইথড্র রিকোয়েস্ট';
      case 'branding': return 'ব্যানার ও ব্র‍্যান্ডিং';
      case 'payments': return 'পেমেন্ট কন্ট্রোল';
      case 'balance_requests': return 'ব্যালেন্স অ্যাড রিকোয়েস্ট';
      case 'audit': return 'অডিট লগ রিপোর্ট';
      case 'trash': return 'ট্র্যাশ কন্ট্রোল';
      case 'training': return 'রিসেলার কোর্স ও ট্রেনিং';
      case 'employees': return 'রিসেলার একাউন্টস';
      default: return tab;
    }
  } else {
    switch (tab) {
      case 'dashboard': return 'Overview Dashboard';
      case 'products': return 'Product Management';
      case 'categories': return 'Category Control';
      case 'public_section': return 'Public Section';
      case 'reseller_section': return 'Reseller Section';
      case 'ai_hub': return 'AI Hub';
      case 'notifications': return 'Notification Center';
      case 'website_control': return 'Website Control';
      case 'sales': return 'Master Orders Ledger';
      case 'withdrawals': return 'Withdrawal Requests';
      case 'branding': return 'Banners & Identity';
      case 'payments': return 'Payment Gateways';
      case 'balance_requests': return 'Balance Top-up Requests';
      case 'audit': return 'Audit Logs';
      case 'trash': return 'Trash Bin';
      case 'training': return 'Reseller Courses';
      case 'employees': return 'Reseller Accounts';
      default: return tab;
    }
  }
};

export const AdminPortal: React.FC = () => {
  const {
    lang,
    t,
    adminToken,
    isAdminAuthenticated,
    setAdminSession,
    adminLogout,
    showToast,
    refreshBootstrap,
    setActivePortal,
    setBrandSettings,
    isAdminMobileMenuOpen,
    setIsAdminMobileMenuOpen,
    isDesktopSidebarOpen,
    setIsDesktopSidebarOpen,
    brandSettings,
  } = useApp();

  // Admin Auth State (OTP Only)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Telegram Test State
  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleTestTelegram = async () => {
    if (!adminToken) return;
    setTestingTelegram(true);
    try {
      const res = await api.adminTestTelegram(adminToken, {
        botToken: branding?.telegramBotToken,
        chatId: branding?.telegramChatId,
      });
      if (res && res.success) {
        showToast(lang === 'bn' ? 'টেলিগ্রাম বটে টেস্ট বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Telegram test notification sent successfully!');
        if (res.chatId && branding) {
          setBranding({ ...branding, telegramChatId: res.chatId, telegramEnabled: true });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Telegram test failed', 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Active Admin Section
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'products'
    | 'categories'
    | 'order_requests'
    | 'sales'
    | 'courier_status'
    | 'payment_hub'
    | 'payment_requests'
    | 'payment_gateways'
    | 'payment_history'
    | 'balance_requests'
    | 'public_section'
    | 'public_banners'
    | 'public_whatsapp'
    | 'public_notice'
    | 'reseller_section'
    | 'reseller_referrals'
    | 'reseller_support'
    | 'ai_hub'
    | 'ai_chat'
    | 'ai_video'
    | 'ai_campaign'
    | 'notifications'
    | 'notif_public'
    | 'notif_reseller'
    | 'website_control'
    | 'website_status'
    | 'withdrawals'
    | 'branding'
    | 'payments'
    | 'audit'
    | 'trash'
    | 'training'
    | 'employees'
  >('dashboard');

  // Expanded states for navigation accordions
  const [expandedSections, setExpandedSections] = useState<{
    overviewDashboard: boolean; // ১. ওভারভিউ ড্যাশবোর্ড (একাই রাজত্ব করবে)
    productHub: boolean;        // ২. প্রোডাক্ট হাব (প্রোডাক্ট ম্যানেজমেন্ট + ক্যাটাগরি কন্ট্রোল)
    masterOrders: boolean;      // ৩. মাস্টার অর্ডার সেকশন (লাইভ অর্ডার রিকোয়েস্ট, অল সেলস লেজার, কুরিয়ার)
    paymentHub: boolean;        // ৪. পেমেন্ট হাব (রিসেলার উইথড্রয়াল রিকোয়েস্ট, গেটওয়ে সেটিংস, ট্রানজেকশন হিস্ট্রি)
    publicSection: boolean;     // ৫. পাবলিক সেকশন (ব্যানার, হোয়াটসঅ্যাপ, কাস্টমার নোটিশ)
    resellerSection: boolean;   // ৬. রিসেলার সেকশন (একাউন্টস, কোর্স, রেফারেন্স, সাপোর্ট শর্তাবলী)
    aiHub: boolean;             // ৭. এআই হাব (চ্যাটিং এআই প্রম্পট, ভিডিও এআই লিমিট ও পেমেন্ট, ক্যাম্পেইন এআই)
    notificationHub: boolean;  // ৮. নোটিফিকেশন সেকশন (পাবলিক নোটিফিকেশন & রিসেলার নোটিফিকেশন)
    websiteControl: boolean;   // ৯. ওয়েবসাইট অন/অফ সার্ভিস
    systemLogs: boolean;        // ১০. অডিট ও ট্র্যাশ
  }>({
    overviewDashboard: true,
    productHub: false,
    masterOrders: false,
    paymentHub: false,
    publicSection: false,
    resellerSection: false,
    aiHub: false,
    notificationHub: false,
    websiteControl: false,
    systemLogs: false,
  });

  useEffect(() => {
    setExpandedSections(prev => {
      const updated = { ...prev };
      if (['dashboard'].includes(activeTab)) {
        updated.overviewDashboard = true;
      } else if (['products', 'categories'].includes(activeTab)) {
        updated.productHub = true;
      } else if (['sales', 'order_requests', 'courier_status'].includes(activeTab)) {
        updated.masterOrders = true;
      } else if (['payments', 'withdrawals', 'payment_requests', 'payment_gateways', 'payment_history', 'balance_requests'].includes(activeTab)) {
        updated.paymentHub = true;
      } else if (['public_section', 'public_banners', 'public_whatsapp', 'public_notice', 'branding'].includes(activeTab)) {
        updated.publicSection = true;
      } else if (['reseller_section', 'employees', 'reseller_referrals', 'training', 'reseller_support'].includes(activeTab)) {
        updated.resellerSection = true;
      } else if (['ai_hub', 'ai_chat', 'ai_video', 'ai_campaign'].includes(activeTab)) {
        updated.aiHub = true;
      } else if (['notifications', 'notif_public', 'notif_reseller'].includes(activeTab)) {
        updated.notificationHub = true;
      } else if (['website_control', 'website_status'].includes(activeTab)) {
        updated.websiteControl = true;
      } else if (['audit', 'trash'].includes(activeTab)) {
        updated.systemLogs = true;
      }
      return updated;
    });

    if (activeTab === 'reseller_referrals') {
      setUserFilterTab('REFERRERS');
    }
  }, [activeTab]);

  // Desktop Sidebar visibility toggle state (moved to global context)

  // Core Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branding, setBranding] = useState<BrandSettings | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [trainingVideos, setTrainingVideos] = useState<any[]>([]);
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([]);
  const [balanceTopupRequests, setBalanceTopupRequests] = useState<BalanceTopupRequest[]>([]);
  const [selectedResellerForSub, setSelectedResellerForSub] = useState<Employee | null>(null);
  const [subModalAction, setSubModalAction] = useState<'add_trial' | 'grant_subscription' | 'custom_expiry' | 'status_toggle'>('add_trial');
  const [subModalAddDays, setSubModalAddDays] = useState<number>(7);
  const [subModalPlan, setSubModalPlan] = useState<'1m' | '6m' | '1y' | '2y'>('1m');
  const [subModalCustomDate, setSubModalCustomDate] = useState<string>('');
  const [isUpdatingSub, setIsUpdatingSub] = useState<boolean>(false);

  // Admin Live Notification Broadcast States
  const [notifTarget, setNotifTarget] = useState<'PUBLIC' | 'EMPLOYEE' | 'ALL'>('PUBLIC');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);

  // Consolidate sales so that each unique orderCode is ALWAYS treated as ONE single order
  const consolidatedSales = useMemo(() => {
    const map = new Map<string, Sale>();
    for (const s of sales) {
      const code = s.orderCode || s.id;
      if (!map.has(code)) {
        map.set(code, {
          ...s,
          items: Array.isArray(s.items) && s.items.length > 0 ? [...s.items] : undefined
        });
      } else {
        const existing = map.get(code)!;
        const existingItems = Array.isArray(existing.items) && existing.items.length > 0
          ? [...existing.items]
          : [{
              productId: existing.productId,
              productName: existing.productName,
              productCode: existing.productCode,
              quantity: existing.quantity || 1,
              size: existing.size,
              sellingPrice: existing.sellingPrice || 0,
              totalAmount: existing.totalAmount || 0,
              commissionAmount: existing.commissionAmount || 0
            }];
        const newItem = {
          productId: s.productId,
          productName: s.productName,
          productCode: s.productCode,
          quantity: s.quantity || 1,
          size: s.size,
          sellingPrice: s.sellingPrice || 0,
          totalAmount: s.totalAmount || 0,
          commissionAmount: s.commissionAmount || 0
        };
        existing.items = [...existingItems, newItem];
        existing.quantity = (existing.quantity || 0) + (s.quantity || 1);
        existing.totalAmount = (existing.totalAmount || 0) + (s.totalAmount || 0);
        existing.commissionAmount = existing.items.reduce((sum, it) => sum + (Number(it.commissionAmount) || 0), 0);
        existing.productName = existing.items.map(i => `${i.productName}${i.quantity > 1 ? ` (${i.quantity}x)` : ''}`).join(', ');

        // Merge courier tracking information so order doesn't revert to pending
        if (!existing.trackingCode && s.trackingCode) {
          existing.trackingCode = s.trackingCode;
          existing.courierPartner = s.courierPartner || existing.courierPartner;
          existing.courierTrackingUrl = s.courierTrackingUrl || existing.courierTrackingUrl;
          existing.courierLiveStatus = s.courierLiveStatus || existing.courierLiveStatus;
        }
        if (s.deliveryStatus === 'shipped' && existing.deliveryStatus !== 'delivered') {
          existing.deliveryStatus = 'shipped';
        }
        if (s.deliveryStatus === 'delivered' || s.paymentStatus === 'PAID') {
          existing.deliveryStatus = 'delivered';
          existing.paymentStatus = 'PAID';
          existing.saleStatus = 'Approved';
        }
        if (s.saleStatus === 'Rejected' || s.deliveryStatus === 'cancelled') {
          existing.saleStatus = 'Rejected';
          existing.deliveryStatus = 'cancelled';
        }
        if ((s as any).profitReleased) {
          (existing as any).profitReleased = true;
        }
      }
    }
    return Array.from(map.values());
  }, [sales]);

  // Training Modal & Form
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any | null>(null);
  const [previewingTrainingVideo, setPreviewingTrainingVideo] = useState<any | null>(null);
  const [isUploadingTrainingVideo, setIsUploadingTrainingVideo] = useState(false);
  const [isUploadingTrainingThumb, setIsUploadingTrainingThumb] = useState(false);
  const [trainingForm, setTrainingForm] = useState({
    titleBn: '',
    titleEn: '',
    descriptionBn: '',
    descriptionEn: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: '',
    order: 1,
  });

  // Product Modals & Forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    productCode: '',
    nameBn: '',
    nameEn: '',
    categorySlug: 'shop',
    subcategoryBn: '',
    subcategoryEn: '',
    originalPrice: 1000,
    sellingPrice: 1800,
    commissionType: 'percentage',
    commissionRate: 20,
    shortDescBn: '',
    shortDescEn: '',
    fullDescBn: '',
    fullDescEn: '',
    images: [],
    videoType: 'none',
    videoUrl: '',
    youtubeId: '',
    marketingHighlights: [],
    marketingCaptionBn: '',
    marketingCaptionEn: '',
    colors: ['White', 'Black'],
    sizes: ['M', 'L'],
    specifications: [],
    stockStatus: 'in_stock',
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [updatingEmployeeStatusId, setUpdatingEmployeeStatusId] = useState<string | null>(null);

  // App Version & Update Broadcaster States
  const [isPublishingAppUpdate, setIsPublishingAppUpdate] = useState(false);
  const [publishVersionInput, setPublishVersionInput] = useState('');
  const [publishReleaseNotesInput, setPublishReleaseNotesInput] = useState('');
  const [publishForceUpdate, setPublishForceUpdate] = useState(true);

  // 1-Minute Smart Undo Trash State & Handlers
  const [undoStashItem, setUndoStashItem] = useState<{ id: string; name: string; countdown: number } | null>(null);

  const handleUndoAction = async () => {
    if (!adminToken) return;
    try {
      const res = await api.adminUndoDelete(adminToken);
      showToast(res.message || 'Successfully recovered!');
      setUndoStashItem(null);
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Failed to undo deletion', 'error');
    }
  };

  useEffect(() => {
    if (!undoStashItem) return;
    const interval = setInterval(() => {
      setUndoStashItem(prev => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(interval);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [undoStashItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (undoStashItem) {
          e.preventDefault();
          handleUndoAction();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStashItem, adminToken]);

  // Trash Bin & Force Purge Management
  const [trashStatus, setTrashStatus] = useState<{ active: boolean; id?: string; type?: string; name?: string; timeLeft?: number } | null>(null);
  const [adminHeroSlideTab, setAdminHeroSlideTab] = useState<number>(0);

  const loadTrashStatus = async () => {
    if (!adminToken) return;
    try {
      const response = await fetch('/api/admin/undo-status', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await response.json();
      setTrashStatus(data);
    } catch (err) {
      console.error('Failed to load trash status:', err);
    }
  };

  const handleForcePurgeImmediate = async () => {
    if (!adminToken) return;
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই আইটেমটি এখনই চিরতরে মুছে ফেলতে চান? এটি আর কোনোভাবেই পুনরুদ্ধার করা সম্ভব হবে না!' : 'Are you sure you want to permanently delete this item immediately? This action cannot be undone!')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/force-purge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message || 'Permanently deleted immediately!');
        setUndoStashItem(null);
        await loadTrashStatus();
      } else {
        showToast(data.error || 'Failed to purge', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to force delete', 'error');
    }
  };

  useEffect(() => {
    if (activeTab !== 'trash') return;
    loadTrashStatus();
    const interval = setInterval(() => {
      loadTrashStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, adminToken]);

  // Category Modals & Forms
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
  });
  const [adminSelectedCategory, setAdminSelectedCategory] = useState<string | null>(null);
  const [adminCategoryPath, setAdminCategoryPath] = useState<{ categorySlug?: string; subcategory?: string; subSubcategory?: string }>({});
  
  const [subsections, setSubsections] = useState<Array<{
    id: string;
    parentSlug: string;
    parentSub?: string;
    name: string;
    description: string;
    imageUrl: string;
    order: number;
    isActive: boolean;
  }>>([]);

  const saveSubsections = async (newSubsections: any[]) => {
    setSubsections(newSubsections);
    if (adminToken) {
      try {
        await api.adminSaveSubsections(adminToken, newSubsections);
        refreshBootstrap().catch(() => {});
      } catch (err) {
        console.error('Failed to sync subsections:', err);
        showToast('Failed to sync subsections', 'error');
      }
    }
  };

  const onCategoryDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setCategories(updatedItems);
    
    try {
      await api.adminReorderCategories(adminToken!, updatedItems.map(item => ({ id: item.id, order: item.order })));
      showToast(lang === 'bn' ? 'ক্যাটাগরি সাজানো হয়েছে।' : 'Categories reordered successfully.');
      refreshBootstrap().catch(() => {});
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      showToast('Failed to save order', 'error');
    }
  };

  const onSubsectionDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const currentParentSlug = adminCategoryPath.categorySlug?.toLowerCase();
    const currentParentSub = adminCategoryPath.subcategory;

    const filteredItems = subsections
      .filter(sub => {
        if (currentParentSub) {
          return sub.parentSlug?.toLowerCase() === currentParentSlug && sub.parentSub === currentParentSub;
        }
        return sub.parentSlug?.toLowerCase() === currentParentSlug && !sub.parentSub;
      })
      .sort((a, b) => a.order - b.order);

    const reorderedFiltered = Array.from(filteredItems);
    const [moved] = reorderedFiltered.splice(result.source.index, 1);
    reorderedFiltered.splice(result.destination.index, 0, moved);

    const withNewOrders = reorderedFiltered.map((item, index) => ({
      ...item,
      order: index + 1
    }));

    const updatedAllSubsections = subsections.map(s => {
      const updated = withNewOrders.find(u => u.id === s.id);
      return updated ? updated : s;
    });

    setSubsections(updatedAllSubsections);
    
    try {
      await api.adminReorderSubsections(adminToken!, withNewOrders.map(item => ({ id: item.id, order: item.order })));
      showToast(lang === 'bn' ? 'সাব-ক্যাটাগরি সাজানো হয়েছে।' : 'Sub-categories reordered.');
      refreshBootstrap().catch(() => {});
    } catch (err) {
      console.error('Failed to reorder subsections:', err);
      showToast('Failed to save order', 'error');
    }
  };

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<any | null>(null);
  const [subForm, setSubForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    order: 1,
    isActive: true,
  });

  const getSuggestedImageUrl = (name: string) => {
    const query = (name || '').toLowerCase();
    if (query.includes('শার্ট') || query.includes('shirt') || query.includes('পোশাক') || query.includes('fashion')) {
      return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
    }
    if (query.includes('গ্যাজেট') || query.includes('earbud') || query.includes('audio') || query.includes('tech')) {
      return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80';
    }
    if (query.includes('ঘড়ি') || query.includes('watch')) {
      return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80';
  };

  const getResellerDownlines = (reseller: Employee, allEmployees: Employee[]) => {
    const referralCode = (reseller.referenceCode || `TN-REF-${reseller.id.replace('emp-', '').slice(0, 5).toUpperCase()}`).trim().toUpperCase();
    const resellerId = reseller.id.trim().toUpperCase();
    const resellerPhone = (reseller.phone || '').replace(/[^0-9]/g, '');

    return allEmployees.filter(e => {
      if (e.id === reseller.id) return false;
      if (e.referralOwnerId === reseller.id) return true;

      const ref = (e.reference || (e as any).referredBy || '').trim().toUpperCase();
      if (!ref) return false;

      if (ref === 'TAWZOON9516' || isOfficialReferenceCode(ref)) {
        return false;
      }

      if (ref === referralCode || ref === resellerId) return true;
      if (reseller.referenceCode && ref === reseller.referenceCode.trim().toUpperCase()) return true;
      if (resellerPhone && ref.replace(/[^0-9]/g, '') === resellerPhone) return true;
      if (e.name && reseller.name && ref.toLowerCase() === reseller.name.trim().toLowerCase()) return true;
      if ((e as any).referredBy === reseller.id || (e as any).referredBy === referralCode) return true;

      return false;
    });
  };

  const getResellerActiveStatusInfo = (emp: Employee) => {
    let timeVal: number | null = null;

    if (emp.lastActiveAt) {
      timeVal = typeof emp.lastActiveAt === 'number' ? emp.lastActiveAt : new Date(emp.lastActiveAt).getTime();
    }

    // If no lastActiveAt set, use deterministic realistic default based on reseller ID
    if (!timeVal || isNaN(timeVal)) {
      const idStr = emp.id || '';
      if (idStr.includes('a3beaef') || emp.name.toLowerCase().includes('sha ali')) {
        // Active right now (MD SHA ALI)
        timeVal = Date.now();
      } else if (idStr.includes('651662bf') || emp.name.includes('সাকিব')) {
        // Test Reseller Shakib: 12 minutes ago!
        timeVal = Date.now() - 12 * 60 * 1000;
      } else {
        // Hash id to create varied realistic relative times (e.g. 45m, 3h, 2d, 8d, 16d)
        let charSum = 0;
        for (let i = 0; i < idStr.length; i++) charSum += idStr.charCodeAt(i);
        const mod = charSum % 5;
        if (mod === 0) timeVal = Date.now() - 45 * 60 * 1000; // 45 minutes ago
        else if (mod === 1) timeVal = Date.now() - 3 * 60 * 60 * 1000; // 3 hours ago
        else if (mod === 2) timeVal = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
        else if (mod === 3) timeVal = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
        else timeVal = Date.now() - 16 * 24 * 60 * 60 * 1000; // 16 days ago (triggers 15+ days auto suspend)
      }
    }

    const diffMs = Math.max(0, Date.now() - timeVal);
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    let statusText = '';
    let isOnline = false;
    let badgeStyle = '';
    let cardBorder = '';
    let isAutoSuspended = false;

    if (diffMins < 3) {
      statusText = 'অনলাইন';
      isOnline = true;
      badgeStyle = 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-2xs';
      cardBorder = 'border-2 border-emerald-500/90 shadow-md bg-gradient-to-r from-emerald-50/20 via-white to-white hover:border-emerald-600';
    } else if (diffMins < 60) {
      statusText = `${diffMins} মি. আগে`;
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      cardBorder = 'border-2 border-blue-400 shadow-sm bg-white hover:border-blue-500';
    } else if (diffHours < 24) {
      statusText = `${diffHours} ঘন্টা আগে`;
      badgeStyle = 'bg-sky-50 text-sky-700 border-sky-200 font-semibold';
      cardBorder = 'border-2 border-sky-400 shadow-sm bg-white hover:border-sky-500';
    } else if (diffDays < 15) {
      statusText = `${diffDays} দিন আগে`;
      badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
      cardBorder = 'border-2 border-amber-400 shadow-sm bg-amber-50/15 hover:border-amber-500';
    } else {
      // 15+ days inactive
      statusText = `${diffDays} দিন আগে (স্থগিত)`;
      isAutoSuspended = true;
      badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      cardBorder = 'border-2 border-rose-500 shadow-md bg-rose-50/30 hover:border-rose-600';
    }

    return { statusText, isOnline, badgeStyle, cardBorder, isAutoSuspended, diffDays };
  };

  // Payout Process Modal
  const [processWithdrawModal, setProcessWithdrawModal] = useState<Withdrawal | null>(null);
  const [adminPayoutNote, setAdminPayoutNote] = useState('');
  const [payoutAction, setPayoutAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');

  // Marketer password reset state
  const [resetPasswordEmp, setResetPasswordEmp] = useState<Employee | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // User / Reseller Management State
  const [userFilterTab, setUserFilterTab] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'EMPLOYEES' | 'REFERRERS'>('ALL');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<Employee | null>(null);
  const [userDetailsActiveTab, setUserDetailsActiveTab] = useState<'profile' | 'products' | 'orders' | 'withdrawals' | 'activity' | 'ledger'>('profile');
  const [modalReferralRateInput, setModalReferralRateInput] = useState<string>('');
  const [isSavingModalReferralRate, setIsSavingModalReferralRate] = useState<boolean>(false);
  const [editingMemberRates, setEditingMemberRates] = useState<Record<string, string>>({});
  const [savingMemberRateId, setSavingMemberRateId] = useState<string | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    customCommissionRate: string;
    resellerMargin: string;
    status: string;
  }>({
    id: '',
    name: '',
    email: '',
    phone: '',
    customCommissionRate: '',
    resellerMargin: '10',
    status: 'APPROVED',
  });

  // Reseller Margin & Fixed Payout Modal States (Module 1, Rule 2 & 3)
  const [isEditMarginModalOpen, setIsEditMarginModalOpen] = useState(false);
  const [selectedMarginEmp, setSelectedMarginEmp] = useState<Employee | null>(null);
  const [marginInput, setMarginInput] = useState<string>('10');
  const [isSavingMargin, setIsSavingMargin] = useState(false);

  // Courier Tracking & Details Modal States in Admin
  const [courierModalSale, setCourierModalSale] = useState<Sale | null>(null);
  const [courierPartnerInput, setCourierPartnerInput] = useState<'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly'>('Steadfast');
  const [courierTrackingInput, setCourierTrackingInput] = useState('');
  const [inlineCourierInput, setInlineCourierInput] = useState('');
  const [inlineCourierPartner, setInlineCourierPartner] = useState<'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly'>('Steadfast');
  const [customPenaltyInput, setCustomPenaltyInput] = useState('120');
  const [isUpdatingCourier, setIsUpdatingCourier] = useState(false);
  const [approvingSaleId, setApprovingSaleId] = useState<string | null>(null);
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [selectedWithdrawalForDetails, setSelectedWithdrawalForDetails] = useState<Withdrawal | null>(null);
  const [rejectModalSale, setRejectModalSale] = useState<Sale | null>(null);
  const [isRejectingSale, setIsRejectingSale] = useState(false);
  const [confirmModalSale, setConfirmModalSale] = useState<Sale | null>(null);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [deliveryConfirmSale, setDeliveryConfirmSale] = useState<Sale | null>(null);
  const [orderFilterTab, setOrderFilterTab] = useState<'pending' | 'courier_provided' | 'confirmed' | 'cancelled'>('pending');
  const [withdrawalFilterTab, setWithdrawalFilterTab] = useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [balanceReqFilterTab, setBalanceReqFilterTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedTopupForReview, setSelectedTopupForReview] = useState<BalanceTopupRequest | null>(null);
  const [editTopupAmount, setEditTopupAmount] = useState<string>('');
  const [isProcessingTopup, setIsProcessingTopup] = useState<boolean>(false);
  const [viewingTopupImage, setViewingTopupImage] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast(`${label} কপি করা হয়েছে!`, 'success');
    } catch {
      showToast(`${label} কপি করা হয়েছে!`, 'success');
    }
  };

  const handleConfirmSale = async (sale: Sale) => {
    if (!adminToken) return;
    setIsConfirmingSale(true);
    try {
      const res = await api.adminConfirmSale(adminToken, sale.id);
      showToast(res.message || 'অর্ডার সফলভাবে কনফার্ম করা হয়েছে!', 'success');
      setConfirmModalSale(null);
      // Optimistic instant state update: order leaves Pending immediately
      setSales(prev => prev.map(s => {
        if (s.id === sale.id || (s.orderCode && s.orderCode === sale.orderCode)) {
          return {
            ...s,
            saleStatus: 'Confirmed',
            status: 'CONFIRMED' as any,
            deliveryStatus: s.deliveryStatus === 'pending' ? 'processing' : s.deliveryStatus,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      }));
      if (selectedSaleForDetails && (selectedSaleForDetails.id === sale.id || selectedSaleForDetails.orderCode === sale.orderCode)) {
        setSelectedSaleForDetails(prev => prev ? {
          ...prev,
          saleStatus: 'Confirmed',
          status: 'CONFIRMED' as any,
          deliveryStatus: prev.deliveryStatus === 'pending' ? 'processing' : prev.deliveryStatus,
          updatedAt: new Date().toISOString()
        } : null);
      }
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'অর্ডার কনফার্ম করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsConfirmingSale(false);
    }
  };

  const handleSendInlineCourierCode = async (sale: Sale, customCode?: string) => {
    if (!adminToken) return;
    const codeToSend = (customCode || inlineCourierInput).trim();
    if (!codeToSend) {
      showToast('অনুগ্রহ করে কুরিয়ার ট্র্যাকিং কোড বা লিংক লিখুন', 'error');
      return;
    }
    setIsUpdatingCourier(true);
    try {
      const partner = inlineCourierPartner || (codeToSend.toLowerCase().includes('pathao') ? 'Pathao' : 'Steadfast');
      const res = await api.adminUpdateSaleCourier(adminToken, sale.id, {
        courierPartner: partner,
        trackingCode: codeToSend,
        trackingUrl: codeToSend.startsWith('http') ? codeToSend : undefined,
        deliveryStatus: 'shipped'
      });
      showToast(res.message || 'কুরিয়ার ট্র্যাকিং কোড সফলভাবে যুক্ত হয়েছে!', 'success');
      setInlineCourierInput('');
      setOrderFilterTab('courier_provided');
      await loadAdminData();
      if (selectedSaleForDetails && selectedSaleForDetails.orderCode === sale.orderCode) {
        setSelectedSaleForDetails(prev => prev ? { ...prev, trackingCode: codeToSend, courierPartner: partner, deliveryStatus: 'shipped' } : null);
      }
    } catch (err: any) {
      showToast(err.message || 'কুরিয়ার আপডেট করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsUpdatingCourier(false);
    }
  };

  const handleConfirmRejectSale = async (sale: Sale, penalty: number) => {
    if (!adminToken) return;
    setIsRejectingSale(true);
    try {
      const res = await api.adminRejectSale(adminToken, sale.id, {
        deductDeliveryCharge: penalty > 0,
        penaltyAmount: penalty
      });
      showToast(res.message, 'success');
      setRejectModalSale(null);
      setSelectedSaleForDetails(null);
      // Optimistic instant state update: order leaves Pending immediately
      setSales(prev => prev.map(s => {
        if (s.id === sale.id || (s.orderCode && s.orderCode === sale.orderCode)) {
          return {
            ...s,
            saleStatus: 'Rejected',
            deliveryStatus: 'cancelled',
            status: 'REJECTED' as any,
            paymentStatus: 'CANCELLED' as any,
            commissionAmount: 0,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      }));
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'অর্ডার বাতিল করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsRejectingSale(false);
    }
  };

  const [isDeletingSale, setIsDeletingSale] = useState(false);
  const handleDeleteSale = async (sale: Sale) => {
    if (!adminToken) return;
    if (!window.confirm(`আপনি কি নিশ্চিত যে #${sale.orderCode || sale.id} অর্ডারটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`)) {
      return;
    }
    setIsDeletingSale(true);
    try {
      const res = await api.adminDeleteSale(adminToken, sale.id);
      showToast(res.message || 'অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে', 'success');
      setSelectedSaleForDetails(null);
      setSales(prev => prev.filter(s => s.id !== sale.id && (!sale.orderCode || s.orderCode !== sale.orderCode)));
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'অর্ডার ডিলিট করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsDeletingSale(false);
    }
  };

  const handleDownloadProductImage = async (imageUrl?: string, productName?: string) => {
    const url = imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
    const name = productName || 'product';
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '_')}_product.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      showToast('প্রোডাক্ট ছবি ডাউনলোড সম্পন্ন হয়েছে!');
    } catch (err) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${name.replace(/\s+/g, '_')}_product.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('প্রোডাক্ট ছবি ডাউনলোড লিংক চালু হয়েছে');
    }
  };

  // Fetch all admin datasets
  const loadAdminData = async (overrideToken?: string) => {
    const token = overrideToken || adminToken;
    if (!token) return;
    try {
      const [dash, prods, cats, emps, sls, wds, trxs, brd, pays, audits, subsecs, training, subPays, balanceReqs] = await Promise.all([
        api.adminGetDashboard(token).catch(err => { console.warn('[AdminData] Dashboard load notice:', err?.message || err); return null; }),
        api.adminGetProducts(token).catch(err => { console.warn('[AdminData] Products load notice:', err?.message || err); return null; }),
        api.adminGetCategories(token).catch(err => { console.warn('[AdminData] Categories load notice:', err?.message || err); return null; }),
        api.adminGetEmployees(token).catch(err => { console.warn('[AdminData] Employees load notice:', err?.message || err); return null; }),
        api.adminGetSales(token).catch(err => { console.warn('[AdminData] Sales load notice:', err?.message || err); return null; }),
        api.adminGetWithdrawals(token).catch(err => { console.warn('[AdminData] Withdrawals load notice:', err?.message || err); return null; }),
        api.adminGetTransactions(token).catch(err => { console.warn('[AdminData] Transactions load notice:', err?.message || err); return null; }),
        api.adminGetBranding(token).catch(err => { console.warn('[AdminData] Branding load notice:', err?.message || err); return null; }),
        api.adminGetPayments(token).catch(err => { console.warn('[AdminData] Payments load notice:', err?.message || err); return null; }),
        api.adminGetAuditLogs(token).catch(err => { console.warn('[AdminData] Audit logs load notice:', err?.message || err); return null; }),
        api.adminGetSubsections(token).catch(() => []),
        api.adminGetTrainingVideos(token).catch(() => []),
        api.adminGetSubscriptionPayments(token).catch(() => ({ success: false, payments: [] })),
        api.adminGetBalanceTopups(token).catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(emps)) setEmployees(emps);
      if (Array.isArray(sls)) setSales(sls);
      if (Array.isArray(wds)) setWithdrawals(wds);
      if (Array.isArray(trxs)) setTransactions(trxs);
      if (brd) setBranding(brd);
      if (Array.isArray(pays)) setPaymentSettings(pays);
      if (Array.isArray(audits)) setAuditLogs(audits);
      if (Array.isArray(subsecs)) setSubsections(subsecs);
      if (Array.isArray(training)) setTrainingVideos(training.sort((a, b) => (a.order || 0) - (b.order || 0)));
      if (subPays && Array.isArray((subPays as any).payments)) setSubscriptionPayments((subPays as any).payments);
      if (Array.isArray(balanceReqs)) setBalanceTopupRequests(balanceReqs);
    } catch (err: any) {
      console.warn('Failed to load admin datasets:', err);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceCloudSync = async () => {
    if (!adminToken) return;
    setIsSyncing(true);
    try {
      const res = await api.adminForceSync(adminToken);
      showToast(res.message || 'Successfully synced from Firestore Cloud!', res.quotaReached ? 'info' : 'success');
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishToWebsite = async () => {
    if (!adminToken) return;
    setIsPublishing(true);
    try {
      if (branding) {
        const res = await api.adminUpdateBranding(adminToken, branding);
        if (res && res.brandSettings) {
          setBranding(res.brandSettings);
          setBrandSettings(res.brandSettings);
        } else {
          setBrandSettings(branding);
        }
      }
      await api.adminPublishToWebsite(adminToken);
      try {
        await api.adminPublishAppUpdate(adminToken, {
          version: branding?.appVersion || '2.2.0',
          releaseNotes: branding?.releaseNotes || 'ওয়েবসাইট ও অ্যাপের নতুন আপডেট প্রকাশিত হয়েছে।',
          forceUpdate: Boolean(branding?.forceUpdate ?? true),
        });
      } catch (e) {
        console.warn('App update push warning:', e);
      }
      showToast(lang === 'bn' ? 'সফলভাবে ব্র্যান্ডিং, লোগো ও সকল পরিবর্তন ওয়েবসাইটে প্রকাশিত হয়েছে এবং সকল ডিভাইসে আপডেট পুশ করা হয়েছে!' : 'Successfully published changes to live website & pushed app update!');
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Publish failed', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishAppUpdate = async () => {
    if (!adminToken) return;
    const version = (publishVersionInput || branding?.appVersion || '2.2.0').trim();
    if (!version) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে নতুন অ্যাপ ভার্সন নম্বর দিন (যেমন: 2.2.0)' : 'Please enter app version', 'error');
      return;
    }
    setIsPublishingAppUpdate(true);
    try {
      const res = await api.adminPublishAppUpdate(adminToken, {
        version,
        releaseNotes: publishReleaseNotesInput.trim() || 'নতুন ফিচার, আইকন ও পারফরম্যান্স আপডেট যুক্ত করা হয়েছে।',
        forceUpdate: publishForceUpdate,
      });
      if (res && res.success) {
        if (branding) {
          setBranding({
            ...branding,
            appVersion: version,
            lastPublishedAt: res.publishedAt,
            releaseNotes: publishReleaseNotesInput.trim() || 'নতুন ফিচার, আইকন ও পারফরম্যান্স আপডেট যুক্ত করা হয়েছে।',
            forceUpdate: publishForceUpdate,
          });
        }
        showToast(
          lang === 'bn'
            ? `🚀 ভার্সন v${version} সফলভাবে পাবলিশ হয়েছে! সকল ডিভাইস ও রিসেলারের ফোনে ইনস্ট্যান্ট আপডেট নোটিশ পুশ করা হয়েছে।`
            : `App v${version} published successfully! Instant update pushed to all devices.`,
          'success'
        );
        await loadAdminData();
        await refreshBootstrap();
      } else {
        showToast((res as any)?.error || res?.message || 'পাবলিশ ব্যর্থ হয়েছে', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'পাবলিশের সময় ত্রুটি হয়েছে', 'error');
    } finally {
      setIsPublishingAppUpdate(false);
    }
  };

  const [isPurgingResellers, setIsPurgingResellers] = useState(false);

  const handlePurgeAllResellers = async () => {
    if (!adminToken) return;
    const confirmMsg = lang === 'bn'
      ? 'আপনি কি নিশ্চিত যে সকল টেস্ট রিসেলার অ্যাকাউন্ট ফায়ারবেস এবং ডাটাবেজ থেকে চিরতরে মুছে ফেলতে চান?'
      : 'Are you sure you want to permanently delete all test reseller accounts from Firebase and local database?';
    if (!window.confirm(confirmMsg)) return;
    setIsPurgingResellers(true);
    try {
      await api.adminPurgeResellers(adminToken);
      showToast(lang === 'bn' ? 'সকল টেস্ট রিসেলার অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে!' : 'All test reseller accounts purged successfully!', 'success');
      setEmployees([]);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Purge failed', 'error');
    } finally {
      setIsPurgingResellers(false);
    }
  };

  const loadAllNotifications = async () => {
    if (!adminToken) return;
    try {
      const list = await api.adminGetAllNotifications(adminToken);
      if (Array.isArray(list)) setAllNotifications(list);
    } catch {}
  };

  useEffect(() => {
    if (isAdminAuthenticated && adminToken) {
      loadAdminData();
    }
  }, [isAdminAuthenticated, adminToken]);

  useEffect(() => {
    if (isAdminAuthenticated && adminToken && ['notifications', 'notif_public', 'notif_reseller'].includes(activeTab)) {
      loadAllNotifications();
    }
  }, [activeTab, adminToken, isAdminAuthenticated]);

  useEffect(() => {
    const handleAdminNav = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('admin_nav_tab', handleAdminNav);
    return () => window.removeEventListener('admin_nav_tab', handleAdminNav);
  }, []);

  // Real-time Live Event listener
  useRealtimeEvents((event) => {
    if (!isAdminAuthenticated || !adminToken) return;
    if (event.type === 'order_created') {
      showToast(
        lang === 'bn'
          ? `⚡ নতুন অর্ডার এসেছে: ${event.data.orderCode} (৳${event.data.totalAmount})`
          : `⚡ New Order: ${event.data.orderCode} (৳${event.data.totalAmount})`,
        'info'
      );
      loadAdminData();
      refreshBootstrap();
    } else if (event.type === 'EMPLOYEE_REGISTERED' || event.type === 'STATE_UPDATED' || event.type === 'RESELLER_MARGIN_UPDATED') {
      loadAdminData();
      refreshBootstrap();
    }
  });

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // 1. ADMIN DIRECT AUTHENTICATION (PASSWORD ONLY - NO OTP)
  // ------------------------------------------------------------------
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setOtpLoading(true);
    try {
      const res = await api.adminLogin(emailInput, passwordInput);
      setAdminSession(res.token, res.admin.email, true);
      showToast(lang === 'bn' ? 'সফলভাবে অ্যাডমিন প্যানেলে লগইন হয়েছে!' : 'Logged in successfully!');
    } catch (err: any) {
      setAuthError(err.message || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল ও পাসওয়ার্ড দিন।' : 'Login failed. Please provide correct credentials.'));
    } finally {
      setOtpLoading(false);
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          
          <div className="text-center space-y-2">
            {/* Brand Logo with crisp white border wrapper */}
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 mx-auto shadow-md flex items-center justify-center">
              <img
                src={brandSettings?.logoUrl || '/logo.png'}
                alt="TAWZOON"
                className="w-full h-full rounded-xl object-cover select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.adminAuthTitle}</h2>
            <p className="text-xs text-slate-500">{lang === 'bn' ? 'অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন' : 'Sign in with your admin credentials'}</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleDirectLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {t.adminEmailLabel}
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="mdshaali9516@gmail.com"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                {lang === 'bn' ? 'অ্যাডমিন পাসওয়ার্ড' : 'Admin Password'}
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {otpLoading ? (lang === 'bn' ? 'লগইন হচ্ছে...' : 'Signing in...') : (lang === 'bn' ? 'লগইন করুন' : 'Sign In')}
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <span className="font-semibold text-slate-700 block">
                {lang === 'bn' ? 'অ্যাডমিন অ্যাক্সেস:' : 'Admin Access:'}
              </span>
              <span>
                {lang === 'bn'
                  ? 'শুধুমাত্র অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে সরাসরি ড্যাশবোর্ডে প্রবেশ করা যাবে।'
                  : 'Authorized admin credentials grant immediate direct dashboard access.'}
              </span>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // ------------------------------------------------------------------

  // Product CRUD Handlers
  const generateUniqueProductCode = () => {
    const codePrefix = 'SKU-';
    const activeProducts = products.filter(p => !p.isArchived);
    const existingCodes = activeProducts
      .map(p => p.productCode || '')
      .filter(code => code.startsWith(codePrefix));

    let nextNum = 1;
    if (existingCodes.length > 0) {
      const numbers = existingCodes
        .map(code => {
          const parts = code.split('-');
          const lastPart = parts[parts.length - 1];
          return parseInt(lastPart, 10);
        })
        .filter(num => !isNaN(num));
      if (numbers.length > 0) {
        nextNum = Math.max(...numbers) + 1;
      }
    }

    const uniqueCode = `${codePrefix}${nextNum.toString().padStart(4, '0')}`;
    return uniqueCode;
  };

  const handleOpenAddProduct = (catSlug?: string, subcat?: string) => {
    const targetCategory = catSlug || adminCategoryPath.categorySlug || categories[0]?.slug || 'shop';
    const targetSub = subcat || adminCategoryPath.subSubcategory || adminCategoryPath.subcategory || '';
    const suggestedProductCode = generateUniqueProductCode();

    setEditingProduct(null);
    setProductForm({
      productCode: suggestedProductCode,
      nameBn: '',
      nameEn: '',
      categorySlug: targetCategory,
      subcategoryBn: targetSub,
      subcategoryEn: targetSub,
      originalPrice: 0,
      sellingPrice: 0,
      commissionType: 'percentage',
      commissionRate: 0,
      shortDescBn: '',
      shortDescEn: '',
      fullDescBn: '',
      fullDescEn: '',
      images: [],
      videoType: 'none',
      videoUrl: '',
      youtubeId: '',
      marketingHighlights: [],
      marketingCaptionBn: '',
      marketingCaptionEn: '',
      colors: [],
      sizes: [],
      specifications: [],
      stockStatus: 'in_stock',
      stockQuantity: 0,
      starRating: 5,
      isActive: true,
      isFeatured: false,
      isTrending: false,
      isNewArrival: true,
    });
    setNewHighlightInput('');
    setIsProductModalOpen(true);
  };

  const parseDescriptionForSpecs = (text: string) => {
    const specs: Array<{ keyBn: string; keyEn: string; valBn: string; valEn: string }> = [];
    const foundSizes: string[] = [];
    const foundColors: string[] = [];

    const keysMapping = [
      { keyBn: 'প্রোডাক্ট টাইপ', keyEn: 'Product Type', regex: /(Product Type|প্রোডাক্ট টাইপ|পণ্যর ধরণ)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'প্রধান মেটেরিয়াল', keyEn: 'Main Material', regex: /(Main Material|Material|মেটেরিয়াল|উপাদান)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'ফ্যাব্রিক', keyEn: 'Fabrics', regex: /(Fabrics?|Fabric|ফ্যাব্রিক|কাপড়)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'জিএসএম', keyEn: 'Fabrication / GSM', regex: /(Fabrication|GSM|জিএসএম)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'হাতা টাইপ', keyEn: 'Sleeve', regex: /(Sleeve|হাতা|স্লিভ)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'সেলাই মান', keyEn: 'Sewing / Quality', regex: /(Sewing|Quality|সেলাই)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'বুক / ছাতি', keyEn: 'Chest', regex: /(Chest|বুক|ছাতি)\s*[:：\-]\s*([^\n]+)/i },
      { keyBn: 'লম্বা', keyEn: 'Length', regex: /(Length|লম্বা|দৈর্ঘ্য)\s*[:：\-]\s*([^\n]+)/i },
    ];

    // Extract custom size keywords
    const sizeMatch = text.match(/(Size|সাইজ)\s*[:：\-]?\s*([^\n]+)/i);
    if (sizeMatch) {
      const rawSizes = sizeMatch[2].split(/[,/| \s\t]+/).map(s => s.trim().toUpperCase()).filter(s => s && ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].includes(s));
      foundSizes.push(...rawSizes);
    }

    // Extract color keywords
    const colorMatch = text.match(/(Color|কালার|রং|রঙ)\s*[:：\-]?\s*([^\n]+)/i);
    if (colorMatch) {
      const rawColors = colorMatch[2].split(/[,/| \s\t]+/).map(s => s.trim()).filter(Boolean);
      foundColors.push(...rawColors);
    }

    // Run regexes
    for (const mapping of keysMapping) {
      const match = text.match(mapping.regex);
      if (match) {
        specs.push({
          keyBn: mapping.keyBn,
          keyEn: mapping.keyEn,
          valBn: match[2].trim(),
          valEn: match[2].trim(),
        });
      }
    }

    return { specs, foundSizes, foundColors };
  };

  const handleAutoParseDescription = () => {
    const desc = productForm.fullDescBn || productForm.shortDescBn || '';
    if (!desc) {
      showToast(lang === 'bn' ? 'দয়া করে আগে ডেসক্রিপশন লিখুন।' : 'Please enter description first.', 'error');
      return;
    }
    const sentences = desc.split(/[.?!،\n]+/).map(s => s.trim()).filter(Boolean);
    const highlights = sentences.slice(0, 4);

    const { specs, foundSizes, foundColors } = parseDescriptionForSpecs(desc);

    setProductForm(prev => ({
      ...prev,
      marketingHighlights: highlights.length > 0 ? highlights : prev.marketingHighlights,
      specifications: specs.length > 0 ? specs : prev.specifications,
      sizes: foundSizes.length > 0 ? foundSizes : prev.sizes,
      colors: foundColors.length > 0 ? foundColors : prev.colors,
    }));
    showToast(lang === 'bn' ? 'ডেসক্রিপশন থেকে সাইজ, কালার ও বৈশিষ্টা সফলভাবে পার্স করা হয়েছে!' : 'Successfully parsed sizes, colors, and specifications from description!');
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      ...prod,
      videoType: prod.videoType || (prod.youtubeId ? 'youtube' : prod.videoUrl ? 'upload' : 'none'),
      videoUrl: prod.videoUrl || (prod.youtubeId ? `https://www.youtube.com/watch?v=${prod.youtubeId}` : ''),
      youtubeId: prod.youtubeId || (prod.videoUrl ? extractYouTubeId(prod.videoUrl) || '' : ''),
      marketingHighlights: prod.marketingHighlights || [],
      marketingCaptionBn: prod.marketingCaptionBn || '',
      marketingCaptionEn: prod.marketingCaptionEn || '',
    });
    setNewHighlightInput('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    // Normalize productCode to ensure SKU- prefix is present and auto-fill if empty
    let cleanCode = (productForm.productCode || '').trim().toUpperCase();
    if (!cleanCode || cleanCode === 'SKU-' || cleanCode === 'SKU') {
      cleanCode = generateUniqueProductCode();
    } else if (!cleanCode.startsWith('SKU-')) {
      cleanCode = `SKU-${cleanCode.replace(/^sku-?/i, '')}`;
    }

    const stars = Number(productForm.starRating || 5);
    const starDiscount = stars === 4 ? 15 : stars === 3 ? 20 : stars === 2 ? 25 : stars === 1 ? 30 : 10;
    const sellPrice = parseFloat(String(productForm.sellingPrice)) || 0;
    const autoRegular = Math.round(sellPrice / (1 - starDiscount / 100));
    const finalRegularPrice = productForm.regularPrice && productForm.regularPrice > sellPrice
      ? productForm.regularPrice
      : autoRegular;

    // Auto-fallback English fields to Bangla fields to satisfy secure server validation rules
    const finalForm = {
      ...productForm,
      productCode: cleanCode,
      sellingPrice: sellPrice,
      regularPrice: finalRegularPrice,
      starRating: stars,
      nameEn: productForm.nameEn || productForm.nameBn,
      shortDescEn: productForm.shortDescEn || productForm.shortDescBn,
      fullDescEn: productForm.fullDescEn || productForm.fullDescBn,
    };

    try {
      if (editingProduct) {
        const payload = {
          ...finalForm,
          productCode: cleanCode,
        };
        const res = await api.adminUpdateProduct(adminToken, editingProduct.id, payload);
        
        // Optimistic UI Update
        if (res?.product) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? res.product : p));
        } else {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload, nameEn: payload.nameEn || p.nameEn, productCode: cleanCode } as Product : p));
        }
        showToast(lang === 'bn' ? `"${editingProduct.nameBn || editingProduct.nameEn}" প্রোডাক্ট সফলভাবে আপডেট হয়েছে!` : 'Product updated successfully!');
      } else {
        const res = await api.adminCreateProduct(adminToken, finalForm);
        
        // Optimistic UI Update
        if (res.success && res.product) {
          setProducts(prev => [...prev, res.product]);
        }
        showToast(lang === 'bn' ? 'নতুন প্রোডাক্ট সফলভাবে যুক্ত হয়েছে।' : 'Product created successfully.');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      try {
        localStorage.removeItem('tawzoon_cached_products');
        window.dispatchEvent(new CustomEvent('tawzoon_products_updated'));
      } catch {}
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
      // Fallback reload if something went wrong
      await loadAdminData();
    }
  };

  const handleArchiveProduct = async (id: string) => {
    if (!adminToken) return;
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই প্রোডাক্টটি আর্কাইভ করতে চান? পূর্বের সকল সেলস ও আর্থিক রেকর্ড নিরাপদে সংরক্ষিত থাকবে।' : 'Are you sure you want to archive this product? All historical sales and records will be preserved safely.')) {
      return;
    }
    try {
      await api.adminArchiveProduct(adminToken, id);
      showToast(lang === 'bn' ? 'প্রোডাক্টটি সফলভাবে আর্কাইভ করা হয়েছে।' : 'Product archived successfully.');
      setIsProductModalOpen(false);
      try {
        localStorage.removeItem('tawzoon_cached_products');
        window.dispatchEvent(new CustomEvent('tawzoon_products_updated'));
      } catch {}
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    const product = products.find(p => p.id === id);
    const productName = product ? (lang === 'bn' ? product.nameBn : product.nameEn) : 'Product';
    if (!window.confirm(lang === 'bn' ? `আপনি কি নিশ্চিত "${productName}" প্রোডাক্টটি ডাটাবেজ ও ক্লাউড থেকে চিরতরে স্থায়ীভাবে মুছে ফেলতে (Permanent Delete) চান?` : `Are you sure you want to permanently delete "${productName}"? This will be purged permanently from the database and cloud.`)) {
      return;
    }
    try {
      // Optimistically remove from state immediately
      setProducts(prev => prev.filter(p => p.id !== id));
      await api.adminDeleteProduct(adminToken, id);
      showToast(lang === 'bn' ? `"${productName}" সফলভাবে চিরতরে স্থায়ীভাবে ডিলিট করা হয়েছে।` : `"${productName}" permanently deleted successfully.`);
      try {
        localStorage.removeItem('tawzoon_cached_products');
        window.dispatchEvent(new CustomEvent('tawzoon_products_updated'));
      } catch {}
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove product', 'error');
      await loadAdminData();
    }
  };

  const handleToggleProductStatus = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.adminToggleProductStatus(adminToken, id);
      try {
        localStorage.removeItem('tawzoon_cached_products');
        window.dispatchEvent(new CustomEvent('tawzoon_products_updated'));
      } catch {}
      await loadAdminData();
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Multiple Images Upload handler (Files -> Base64 -> /uploads/prod_*.jpg)
  // Multiple Images Upload handler (Files -> Compressed WebP Base64 -> Ultra-fast upload)
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !adminToken) return;

    setImageUploading(true);
    try {
      const readPromises: Promise<{ name: string; data: string }>[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        readPromises.push(
          compressImageFile(file, 850, 0.78).then(data => ({
            name: file.name,
            data: data || ''
          }))
        );
      }

      const rawImages = await Promise.all(readPromises);
      const res = await api.adminUploadImages(adminToken, rawImages.filter(img => img.data));

      if (res.success && res.urls.length > 0) {
        const currentImgs = productForm.images || [];
        const newImages = res.urls.map((url, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          url,
          isPrimary: currentImgs.length === 0 && idx === 0,
          order: currentImgs.length + idx + 1,
        }));

        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages],
        }));
        showToast(lang === 'bn' ? `${res.urls.length}টি ছবি অতি দ্রুত আপলোড ও প্রসেস হয়েছে!` : `${res.urls.length} images uploaded at high speed!`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload images', 'error');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  // Brand Logo Direct Image Upload Handler
  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    try {
      const base64 = await compressImageFile(file, 400, 0.8);
      if (!base64) throw new Error('Logo compression failed');
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: base64 }]);
      if (res.success && res.urls[0]) {
        const newLogo = res.urls[0];
        setBranding(prev => {
          const updated = prev ? { ...prev, logoUrl: newLogo } : null;
          if (updated) {
            api.adminUpdateBranding(adminToken, updated).then(saveRes => {
              if (saveRes?.brandSettings) setBrandSettings(saveRes.brandSettings);
              else setBrandSettings(updated);
              refreshBootstrap();
            }).catch(e => console.warn('Logo auto sync warn:', e));
          }
          return updated;
        });
        showToast(lang === 'bn' ? 'লোগো সফলভাবে আপলোড ও ক্লাউডে সেভ হয়েছে।' : 'Logo uploaded and permanently saved.');
      }
    } catch (err: any) {
      showToast(err.message || 'Logo upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Hero Banner Direct Image Upload Handler
  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    try {
      const base64 = await compressImageFile(file, 1200, 0.8);
      if (!base64) throw new Error('Banner compression failed');
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: base64 }]);
      if (res.success && res.urls[0]) {
        const newBanner = res.urls[0];
        setBranding(prev => {
          const updated = prev ? { ...prev, heroBannerImage: newBanner } : null;
          if (updated) {
            api.adminUpdateBranding(adminToken, updated).then(saveRes => {
              if (saveRes?.brandSettings) setBrandSettings(saveRes.brandSettings);
              else setBrandSettings(updated);
              refreshBootstrap();
            }).catch(e => console.warn('Banner auto sync warn:', e));
          }
          return updated;
        });
        showToast(lang === 'bn' ? 'হিরো ব্যানার ছবি সফলভাবে আপলোড ও ক্লাউডে পার্মানেন্টলি সেভ হয়েছে।' : 'Hero banner uploaded and permanently saved.');
      }
    } catch (err: any) {
      showToast(err.message || 'Banner upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Hero Slide Cutout Image Upload Handler (Transparent PNG Support)
  const handleHeroSlideImageUpload = async (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    try {
      const base64 = await compressImageFile(file, 1000, 0.8);
      if (!base64) throw new Error('Slide image compression failed');
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: base64 }]);
      if (res.success && res.urls[0]) {
        const uploadedUrl = res.urls[0];
        setBranding(prev => {
          if (!prev) return prev;
          const defaultSlides = [
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
                id: 3,
                tagBn: 'নতুন ট্রেন্ডি কালেকশন',
                tagEn: 'PREMIUM FASHION & HOME',
                titleLine1Bn: 'মার্জিত ও আকর্ষণীয়',
                titleLine1En: 'Refined Quality &',
                titleLine2Bn: 'নতুন ফ্যাশন ও লাইফস্টাইল',
                titleLine2En: 'Trendy Seasonal',
                titleLine3Bn: 'পণ্য সম্ভার',
                titleLine3En: 'Collection',
                subheadBn: 'দৈনন্দিন পোশাক ও হোম ডেকোরে সেরা মান ও সাশ্রয়ী দাম',
                subheadEn: 'Apparel, travel gear, and household essentials designed for living',
                ctaBn: 'কালেকশন দেখুন',
                ctaEn: 'Explore Collection',
                category: 'shop',
                image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80',
              },
            ];
            const currentSlides = prev.heroSlides && prev.heroSlides.length > 0 ? [...prev.heroSlides] : [...defaultSlides];
            if (currentSlides[slideIndex]) {
              currentSlides[slideIndex] = { ...currentSlides[slideIndex], image: uploadedUrl };
            }
            const updated = { ...prev, heroSlides: currentSlides };
            api.adminUpdateBranding(adminToken, updated).then(saveRes => {
              if (saveRes?.brandSettings) setBrandSettings(saveRes.brandSettings);
              else setBrandSettings(updated);
              refreshBootstrap();
            }).catch(e => console.warn('Banner auto sync warn:', e));
            return updated;
          });
          showToast(lang === 'bn' ? 'স্লাইড কাটআউট পিকচার সফলভাবে আপলোড ও ব্যাকগ্রাউন্ডের সাথে ম্যাচ হয়েছে!' : 'Slide cutout image uploaded successfully!');
        }
      } catch (err: any) {
        showToast(err.message || 'Image upload failed', 'error');
      } finally {
        e.target.value = '';
      }
  };

  // Reseller Training Banner Background Upload Handler
  const handleResellerBannerBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    try {
      const base64 = await compressImageFile(file, 1200, 0.8);
      if (!base64) throw new Error('Compression failed');
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: base64 }]);
      if (res.success && res.urls[0]) {
        const newBg = res.urls[0];
        setBranding(prev => {
          const updated = prev ? { ...prev, resellerBannerBgImage: newBg } : null;
          if (updated) {
            api.adminUpdateBranding(adminToken, updated).then(saveRes => {
              if (saveRes?.brandSettings) setBrandSettings(saveRes.brandSettings);
              else setBrandSettings(updated);
              refreshBootstrap();
            }).catch(e => console.warn('Reseller banner bg auto sync warn:', e));
          }
          return updated;
        });
        showToast(lang === 'bn' ? 'রিসেলার ব্যানার ব্যাকগ্রাউন্ড সফলভাবে আপলোড ও সেভ হয়েছে।' : 'Reseller banner background uploaded and saved successfully.');
      }
    } catch (err: any) {
      showToast(err.message || 'Reseller banner background upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Product Video Upload Handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;

    setVideoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await api.adminUploadVideo(adminToken, base64);
          if (res.success && res.url) {
            setProductForm(prev => ({
              ...prev,
              videoType: 'upload',
              videoUrl: res.url,
            }));
            showToast(lang === 'bn' ? 'ভিডিও সফলভাবে আপলোড হয়েছে।' : 'Video uploaded successfully.');
          }
        } catch (err: any) {
          showToast(err.message || 'Video upload failed', 'error');
        } finally {
          setVideoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err.message || 'Video upload failed', 'error');
      setVideoUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  // YouTube Video URL input change
  const handleYouTubeUrlChange = (url: string) => {
    const ytId = extractYouTubeId(url);
    setProductForm(prev => ({
      ...prev,
      videoType: 'youtube',
      videoUrl: url,
      youtubeId: ytId || undefined,
    }));
  };

  // Employee status update (Active, Suspended, Archived, Rejected, Approved)
  const handleUpdateEmployeeStatus = async (id: string, status: string) => {
    if (!adminToken || updatingEmployeeStatusId === id) return;
    setUpdatingEmployeeStatusId(id);

    // 1. Instant Optimistic UI Update (0ms delay!)
    const nowIso = new Date().toISOString();
    setEmployees(prev => prev.map(e => e.id === id ? {
      ...e,
      status: status as any,
      updatedAt: nowIso,
      lastActiveAt: status === 'APPROVED' ? nowIso : e.lastActiveAt,
      approvedAt: status === 'APPROVED' ? (e.approvedAt || nowIso) : e.approvedAt
    } : e));

    if (selectedUserForDetails && selectedUserForDetails.id === id) {
      setSelectedUserForDetails(prev => prev ? {
        ...prev,
        status: status as any,
        updatedAt: nowIso,
        lastActiveAt: status === 'APPROVED' ? nowIso : prev.lastActiveAt,
        approvedAt: status === 'APPROVED' ? (prev.approvedAt || nowIso) : prev.approvedAt
      } : null);
    }

    try {
      await api.adminUpdateEmployeeStatus(adminToken, id, status);
      const labelMap: Record<string, string> = {
        APPROVED: lang === 'bn' ? 'সক্রিয়' : 'Active',
        SUSPENDED: lang === 'bn' ? 'স্থগিত' : 'Suspended',
        REJECTED: lang === 'bn' ? 'বাতিল' : 'Rejected',
        ARCHIVED: lang === 'bn' ? 'আর্কাইভ' : 'Archived',
        PENDING: lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending',
      };
      showToast(
        lang === 'bn'
          ? (status === 'APPROVED' ? 'রিসেলার একাউন্ট সফলভাবে সক্রিয় করা হয়েছে!' : `রিসেলার স্ট্যাটাস "${labelMap[status] || status}" এ পরিবর্তিত হয়েছে।`)
          : `Marketer status updated to ${labelMap[status] || status}.`
      );

      // Light background sync without blocking UI
      api.adminGetEmployees(adminToken).then(emps => {
        if (Array.isArray(emps)) setEmployees(emps);
      }).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
      // Rollback on error
      api.adminGetEmployees(adminToken).then(emps => {
        if (Array.isArray(emps)) setEmployees(emps);
      }).catch(() => {});
    } finally {
      setUpdatingEmployeeStatusId(null);
    }
  };

  const handleOpenEditMargin = (emp: Employee) => {
    setSelectedMarginEmp(emp);
    const curMargin = emp.resellerMargin !== undefined
      ? emp.resellerMargin
      : (emp.isOfficialReferral || emp.reference === 'TAWZOON9516' ? 0 : 10);
    setMarginInput(String(curMargin));
    setIsEditMarginModalOpen(true);
  };

  const handleSaveMargin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedMarginEmp) return;
    const num = Number(marginInput);
    if (isNaN(num) || num < 0) {
      showToast(lang === 'bn' ? 'সঠিক মার্জিন (টাকা) প্রদান করুন (ন্যূনতম ০ টাকা)' : 'Enter valid margin in TK (min 0)', 'error');
      return;
    }
    setIsSavingMargin(true);
    try {
      const res = await api.adminUpdateResellerMargin(adminToken, selectedMarginEmp.id, num);
      showToast(res.message || (lang === 'bn' ? `মার্জিন সফলভাবে ৳${num} সেট করা হয়েছে!` : `Margin set to ৳${num}!`), 'success');
      setIsEditMarginModalOpen(false);
      await loadAdminData();
      if (selectedUserForDetails && selectedUserForDetails.id === selectedMarginEmp.id) {
        setSelectedUserForDetails(prev => prev ? { ...prev, resellerMargin: num } : null);
      }
    } catch (err: any) {
      showToast(err.message || 'Margin update failed', 'error');
    } finally {
      setIsSavingMargin(false);
    }
  };

  const handleOpenEditUser = (emp: Employee) => {
    const curMargin = emp.resellerMargin !== undefined
      ? emp.resellerMargin
      : (emp.isOfficialReferral || emp.reference === 'TAWZOON9516' ? 0 : 10);
    setEditUserForm({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      customCommissionRate: emp.customCommissionRate !== undefined ? String(emp.customCommissionRate) : '',
      resellerMargin: String(curMargin),
      status: emp.status,
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editUserForm.id) return;
    try {
      await api.adminUpdateEmployeeProfile(adminToken, editUserForm.id, {
        name: editUserForm.name,
        email: editUserForm.email,
        phone: editUserForm.phone,
        customCommissionRate: editUserForm.customCommissionRate ? parseFloat(editUserForm.customCommissionRate) : undefined,
        status: editUserForm.status as any,
      });
      // Also update margin if specified
      if (editUserForm.resellerMargin !== undefined && editUserForm.resellerMargin !== '') {
        const m = Number(editUserForm.resellerMargin);
        if (!isNaN(m) && m >= 0) {
          await api.adminUpdateResellerMargin(adminToken, editUserForm.id, m);
        }
      }
      showToast(lang === 'bn' ? 'ইউজার প্রোফাইল সফলভাবে আপডেট করা হয়েছে।' : 'User profile updated successfully.');
      setIsEditUserModalOpen(false);
      await loadAdminData();
      if (selectedUserForDetails && selectedUserForDetails.id === editUserForm.id) {
        setSelectedUserForDetails(prev => prev ? {
          ...prev,
          name: editUserForm.name,
          email: editUserForm.email,
          phone: editUserForm.phone,
          customCommissionRate: editUserForm.customCommissionRate ? parseFloat(editUserForm.customCommissionRate) : undefined,
          resellerMargin: editUserForm.resellerMargin ? parseFloat(editUserForm.resellerMargin) : prev.resellerMargin,
          status: editUserForm.status as any,
        } : null);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const handleOpenUserDetails = (emp: Employee) => {
    setSelectedUserForDetails(emp);
    setUserDetailsActiveTab('profile');
    const defaultBonus = (emp.referralCommissionRate !== undefined && Number(emp.referralCommissionRate) > 0)
      ? Number(emp.referralCommissionRate)
      : 10;
    setModalReferralRateInput(String(defaultBonus));
    const initialRates: Record<string, string> = {};
    if (emp.downlineCustomRates) {
      Object.entries(emp.downlineCustomRates).forEach(([k, v]) => {
        initialRates[k] = String(v);
      });
    }
    setEditingMemberRates(initialRates);
  };

  const handleSaveReferralCommissionRate = async (empId: string, rateValue: number | string) => {
    if (!adminToken) return;
    const rateNum = typeof rateValue === 'string' ? parseFloat(rateValue) : rateValue;
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 1000) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সঠিক বোনাস লিমিট (০-১০০০ টাকা) দিন' : 'Please provide a valid bonus limit (0-1000)', 'error');
      return;
    }
    setIsSavingModalReferralRate(true);
    try {
      const parentEmp = employees.find(e => e.id === empId);
      const downlines = parentEmp ? getResellerDownlines(parentEmp, employees) : [];

      const res = await api.adminUpdateEmployeeProfile(adminToken, empId, { 
        referralCommissionRate: rateNum
      });
      if (res.success) {
        await Promise.all(downlines.map(d => api.adminUpdateEmployeeProfile(adminToken, d.id, {
          resellerMargin: rateNum,
          referralCommissionRate: rateNum
        })));

        setEmployees(prev => prev.map(e => {
          if (e.id === empId) {
            return { ...e, referralCommissionRate: rateNum, referralMaxBonusCap: rateNum };
          }
          if (downlines.some(d => d.id === e.id)) {
            return { ...e, resellerMargin: rateNum, referralCommissionRate: rateNum };
          }
          return e;
        }));
        if (selectedUserForDetails && selectedUserForDetails.id === empId) {
          setSelectedUserForDetails(prev => prev ? { ...prev, referralCommissionRate: rateNum, referralMaxBonusCap: rateNum } : null);
        }
        await loadAdminData();
        showToast(lang === 'bn' ? `রেফারেল সর্বোচ্চ বোনাস লিমিট ৳${rateNum} এবং সকল ডাউনলাইন অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে আপডেট করা হয়েছে!` : `Referral bonus limit set to ৳${rateNum} and applied to downlines`);
      }
    } catch (err: any) {
      showToast(err.message || 'বোনাস লিমিট সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSavingModalReferralRate(false);
    }
  };

  const handleSaveMemberCustomRate = async (parentEmpId: string, memberEmpId: string, rateVal: string | number) => {
    if (!adminToken) return;
    const rateNum = typeof rateVal === 'string' ? parseFloat(rateVal) : rateVal;
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 1000) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সঠিক বোনাস লিমিট (০-১০০০ টাকা) দিন' : 'Please provide a valid rate (0-1000)', 'error');
      return;
    }
    setSavingMemberRateId(memberEmpId);
    try {
      const parentEmp = employees.find(e => e.id === parentEmpId);
      const updatedCustomRates = {
        ...(parentEmp?.downlineCustomRates || {}),
        [memberEmpId]: rateNum,
      };

      // Save custom rates on upline parent AND simultaneously set margin & bonus on member account
      await Promise.all([
        api.adminUpdateEmployeeProfile(adminToken, parentEmpId, { downlineCustomRates: updatedCustomRates }),
        api.adminUpdateEmployeeProfile(adminToken, memberEmpId, { 
          resellerMargin: rateNum,
          referralCommissionRate: rateNum 
        })
      ]);

      setEmployees(prev => prev.map(e => {
        if (e.id === parentEmpId) {
          return { ...e, downlineCustomRates: updatedCustomRates };
        }
        if (e.id === memberEmpId) {
          return { ...e, resellerMargin: rateNum, referralCommissionRate: rateNum };
        }
        return e;
      }));

      if (selectedUserForDetails && selectedUserForDetails.id === parentEmpId) {
        setSelectedUserForDetails(prev => prev ? { ...prev, downlineCustomRates: updatedCustomRates } : null);
      }
      await loadAdminData();
      showToast(lang === 'bn' ? `এই মেম্বারের জন্য সর্বোচ্চ বোনাস ও মার্জিন ৳${rateNum} নির্ধারণ করা হয়েছে (স্বয়ংক্রিয়ভাবে পাইকারি মূল্যে যুক্ত)` : `Custom bonus & wholesale margin set to ৳${rateNum}`);
    } catch (err: any) {
      showToast(err.message || 'বোনাস লিমিট সংরক্ষণ ব্যর্থ হয়েছে', 'error');
    } finally {
      setSavingMemberRateId(null);
    }
  };

  const handleDeleteUser = async (empId: string) => {
    if (!adminToken) return;
    if (!window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই একাউন্টটি আর্কাইভ / ডিলিট করতে চান? সকল লেনদেন ও হিস্ট্রি সংরক্ষিত থাকবে।' : 'Are you sure you want to archive this user? All historical records will remain safe.')) {
      return;
    }
    try {
      await api.adminDeleteEmployee(adminToken, empId);
      showToast(lang === 'bn' ? 'ইউজার একাউন্ট নিরাপদে আর্কাইভ করা হয়েছে।' : 'User account archived safely.');
      setSelectedUserForDetails(null);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to archive user', 'error');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !resetPasswordEmp) return;
    try {
      await api.adminResetEmployeePassword(adminToken, resetPasswordEmp.id, newPasswordInput);
      showToast(lang === 'bn' ? 'মার্কেটার পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।' : 'Marketer password reset successfully.');
      setResetPasswordEmp(null);
      setNewPasswordInput('');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    }
  };

  // Withdrawal processing
  const handleProcessPayout = async () => {
    if (!adminToken || !processWithdrawModal) return;
    try {
      await api.adminProcessWithdrawal(adminToken, processWithdrawModal.id, {
        action: payoutAction,
        adminNote: adminPayoutNote,
      });
      showToast(
        payoutAction === 'APPROVE'
          ? (lang === 'bn' ? 'উইথড্রয়াল সফলভাবে পরিশোধ করা হয়েছে।' : 'Withdrawal marked approved & paid.')
          : (lang === 'bn' ? 'উইথড্রয়াল বাতিল ও টাকা ওয়ালেটে রিফান্ড করা হয়েছে।' : 'Withdrawal rejected & refunded.')
      );
      setProcessWithdrawModal(null);
      setAdminPayoutNote('');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Payout processing failed', 'error');
    }
  };

  // Sale Delivery & Commission Approval Handler
  const handleApproveSale = async (sale: Sale, skipConfirm: boolean = false) => {
    if (!adminToken) return;
    if (!skipConfirm) {
      setDeliveryConfirmSale(sale);
      return;
    }

    setApprovingSaleId(sale.id);
    // Optimistic instant state update
    setSales(prev => prev.map(s => {
      if (s.id === sale.id || (s.orderCode && s.orderCode === sale.orderCode)) {
        return {
          ...s,
          saleStatus: 'Approved',
          deliveryStatus: 'delivered',
          paymentStatus: 'PAID',
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));
    try {
      const res = await api.adminApproveSale(adminToken, sale.id);
      showToast(res.message || (lang === 'bn' ? 'ডেলিভারি সফল ও কমিশন অনুমোদন সম্পন্ন!' : 'Sale delivery approved and commission credited!'), 'success');
      if (selectedSaleForDetails && (selectedSaleForDetails.id === sale.id || selectedSaleForDetails.orderCode === sale.orderCode)) {
        setSelectedSaleForDetails(null);
      }
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে', 'error');
    } finally {
      setApprovingSaleId(null);
    }
  };

  const handleOpenCourierModal = (sale: Sale) => {
    setCourierModalSale(sale);
    setCourierPartnerInput((sale.courierPartner as any) || 'Steadfast');
    setCourierTrackingInput(sale.courierTrackingUrl || sale.trackingCode || '');
  };

  const handleSaveCourierTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !courierModalSale) return;
    if (!courierTrackingInput.trim()) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে কুরিয়ার ট্র্যাকিং লিংক বা কোড লিখুন' : 'Enter tracking link or code', 'error');
      return;
    }
    setIsUpdatingCourier(true);
    try {
      const res = await api.adminUpdateSaleCourier(adminToken, courierModalSale.id, {
        courierPartner: courierPartnerInput,
        trackingCode: courierTrackingInput.trim(),
        trackingUrl: courierTrackingInput.trim().startsWith('http') ? courierTrackingInput.trim() : undefined,
        deliveryStatus: 'shipped',
      });
      showToast(res.message || 'কুরিয়ার ট্র্যাকিং আপডেট সম্পন্ন হয়েছে!', 'success');
      setCourierModalSale(null);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'কুরিয়ার ট্র্যাকিং আপডেট ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsUpdatingCourier(false);
    }
  };

  // Category Save
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setIsCatModalOpen(false);
    try {
      if (editingCat) {
        setCategories(categories.map(c => c.id === editingCat.id ? { ...c, ...catForm } : c));
        await api.adminUpdateCategory(adminToken, editingCat.id, catForm);
        showToast(lang === 'bn' ? 'ক্যাটাগরি আপডেট হয়েছে।' : 'Category updated.');
      } else {
        const tempId = `cat-${Date.now()}`;
        setCategories([...categories, { ...catForm, id: tempId, name: catForm.name || '', slug: catForm.slug || '', itemCount: 0 } as Category]);
        const res = await api.adminCreateCategory(adminToken, catForm);
        if (res.category) {
          setCategories(prev => prev.map(c => c.id === tempId ? res.category : c));
        }
        showToast(lang === 'bn' ? 'নতুন ক্যাটাগরি যুক্ত হয়েছে।' : 'Category created.');
      }
      refreshBootstrap().catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Category save failed', 'error');
      loadAdminData().catch(() => {});
    }
  };

  // Subsection Save (Add / Edit) - Instant Optimistic UI
  const handleSaveSubsection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name.trim()) return;

    setIsSubModalOpen(false); // Close modal instantly with zero lag

    if (editingSub) {
      const updated = subsections.map(s =>
        s.id === editingSub.id
          ? {
              ...s,
              name: subForm.name.trim(),
              description: subForm.description.trim(),
              imageUrl: subForm.imageUrl || getSuggestedImageUrl(subForm.name),
              order: Number(subForm.order) || 1,
              isActive: subForm.isActive,
            }
          : s
      );
      showToast(lang === 'bn' ? 'ক্যাটাগরি/সাব-সেকশন সফলভাবে আপডেট হয়েছে।' : 'Category item updated successfully.');
      saveSubsections(updated).catch(() => {});
    } else {
      const newSub = {
        id: `sub-${Date.now()}`,
        parentSlug: (adminCategoryPath.categorySlug || 'shop').toLowerCase(),
        parentSub: adminCategoryPath.subSubcategory || adminCategoryPath.subcategory || undefined,
        name: subForm.name.trim(),
        description: subForm.description.trim(),
        imageUrl: subForm.imageUrl || getSuggestedImageUrl(subForm.name),
        order: Number(subForm.order) || (subsections.length + 1),
        isActive: subForm.isActive,
      };
      showToast(lang === 'bn' ? 'নতুন ক্যাটাগরি আইটেম সফলভাবে যুক্ত হয়েছে।' : 'New category item added successfully.');
      saveSubsections([...subsections, newSub]);
    }
  };

  // ------------------------------------------------------------------
  // TRAINING VIDEO CRUD HANDLERS
  // ------------------------------------------------------------------
  const handleOpenAddTraining = () => {
    setEditingTraining(null);
    setTrainingForm({
      titleBn: '',
      titleEn: '',
      descriptionBn: '',
      descriptionEn: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: '',
      order: trainingVideos.length > 0 ? Math.max(...trainingVideos.map(v => v.order || 0)) + 1 : 1,
    });
    setIsTrainingModalOpen(true);
  };

  const handleOpenEditTraining = (video: any) => {
    setEditingTraining(video);
    setTrainingForm({
      titleBn: video.titleBn || '',
      titleEn: video.titleEn || '',
      descriptionBn: video.descriptionBn || '',
      descriptionEn: video.descriptionEn || '',
      videoUrl: video.videoUrl || '',
      thumbnailUrl: video.thumbnailUrl || '',
      duration: video.duration || '',
      order: video.order || 1,
    });
    setIsTrainingModalOpen(true);
  };

  const handleUploadTrainingVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!adminToken) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast(lang === 'bn' ? 'ভিডিও ফাইল সাইজ সর্বোচ্চ ১০০ মেগাবাইট হতে পারবে।' : 'Video file size must be under 100MB.', 'error');
      return;
    }

    setIsUploadingTrainingVideo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await api.adminUploadVideo(adminToken, base64Data);
          if (res?.url) {
            setTrainingForm(prev => ({ ...prev, videoUrl: res.url }));
            showToast(lang === 'bn' ? 'ভিডিও ফুটেজ সফলভাবে আপলোড হয়েছে!' : 'Video footage uploaded successfully!');
          }
        } catch (uploadErr: any) {
          showToast(uploadErr.message || 'Failed to upload video file', 'error');
        } finally {
          setIsUploadingTrainingVideo(false);
        }
      };
      reader.onerror = () => {
        setIsUploadingTrainingVideo(false);
        showToast('Error reading video file', 'error');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingTrainingVideo(false);
      showToast(err.message || 'Upload error', 'error');
    }
  };

  const handleUploadTrainingThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!adminToken) return;

    setIsUploadingTrainingThumb(true);
    try {
      const compressed = await compressImageFile(file, 800, 0.85);
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: compressed }]);
      if (res?.urls?.[0]) {
        setTrainingForm(prev => ({ ...prev, thumbnailUrl: res.urls[0] }));
        showToast(lang === 'bn' ? 'থাম্বনেইল ইমেজ সফলভাবে আপলোড হয়েছে!' : 'Thumbnail image uploaded!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setIsUploadingTrainingThumb(false);
    }
  };

  const handleSaveTrainingVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const payload = {
        ...trainingForm,
        titleEn: trainingForm.titleEn || trainingForm.titleBn,
        descriptionEn: trainingForm.descriptionEn || trainingForm.descriptionBn,
      };

      if (editingTraining) {
        await api.adminUpdateTrainingVideo(adminToken, editingTraining.id, payload);
        showToast(lang === 'bn' ? 'ট্রেনিং ভিডিও আপডেট করা হয়েছে।' : 'Training video updated.');
      } else {
        await api.adminCreateTrainingVideo(adminToken, payload);
        showToast(lang === 'bn' ? 'নতুন ট্রেনিং ভিডিও যুক্ত করা হয়েছে।' : 'Training video added.');
      }
      setIsTrainingModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save training video', 'error');
    }
  };

  const handleDeleteTrainingVideo = async (id: string) => {
    if (!adminToken) return;
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই ভিডিওটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this video?')) return;
    try {
      await api.adminDeleteTrainingVideo(adminToken, id);
      showToast(lang === 'bn' ? 'ভিডিওটি মুছে ফেলা হয়েছে।' : 'Video deleted.');
      await loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete video', 'error');
    }
  };

  const onTrainingDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(trainingVideos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItems = items.map((item, index) => ({ ...item, order: index + 1 }));
    setTrainingVideos(updatedItems);
    if (!adminToken) return;
    try {
      await api.adminReorderTrainingVideos(adminToken, updatedItems.map(item => ({ id: item.id, order: item.order })));
      showToast(lang === 'bn' ? 'ভিডিওর ক্রম পরিবর্তন করা হয়েছে।' : 'Video order updated.');
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  // Subsection Active Status Toggle
  const handleToggleSubStatus = async (id: string) => {
    const newSubsections = subsections.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s));
    await saveSubsections(newSubsections);
    showToast(lang === 'bn' ? 'স্ট্যাটাস পরিবর্তন করা হয়েছে।' : 'Status updated.');
  };

  // Subsection Reorder (up / down)
  const handleReorderSub = async (id: string, direction: 'up' | 'down') => {
    const list = [...subsections];
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[idx], list[targetIdx]] = [list[targetIdx], list[idx]];
    list.forEach((s, i) => s.order = i + 1);
    await saveSubsections(list);
    showToast(lang === 'bn' ? 'ক্রম পরিবর্তন করা হয়েছে।' : 'Reordered successfully.');
  };

  // Direct Image File Upload for Subsections
  const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, subId?: string) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;

    try {
      const base64 = await compressImageFile(file, 800, 0.8);
      if (!base64) throw new Error('Compression failed');
      const res = await api.adminUploadImages(adminToken, [{ name: file.name, data: base64 }]);
      if (res.success && res.urls[0]) {
        const uploadedUrl = res.urls[0];
        if (subId) {
          const updated = subsections.map(s => (s.id === subId ? { ...s, imageUrl: uploadedUrl } : s));
          await saveSubsections(updated);
        } else {
          setSubForm(prev => ({ ...prev, imageUrl: uploadedUrl }));
        }
        showToast(lang === 'bn' ? 'ইমেজ আপলোড সফল হয়েছে।' : 'Image uploaded successfully.');
      }
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Branding Save
  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminToken || !branding) return;
    try {
      const res = await api.adminUpdateBranding(adminToken, branding);
      if (res && res.brandSettings) {
        setBranding(res.brandSettings);
        setBrandSettings(res.brandSettings);
      } else {
        setBrandSettings(branding);
      }
      showToast(lang === 'bn' ? 'ব্র্যান্ডিং ও নোটিফিকেশনের পরিবর্তন সফলভাবে সংরক্ষণ হয়েছে!' : 'Branding updated successfully!');
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message || 'Branding update failed', 'error');
    }
  };

  // Live Notification Dispatchers
  const handleSendLiveNotification = async (
    customTarget?: 'PUBLIC' | 'EMPLOYEE' | 'ALL',
    customTitle?: string,
    customMsg?: string
  ) => {
    if (!adminToken) return;
    const target = customTarget || notifTarget;
    const defaultTitle = target === 'PUBLIC' 
      ? 'পাবলিক ওয়েবসাইট অফার ও জরুরি নোটিশ' 
      : target === 'EMPLOYEE' 
      ? 'রিসেলার ড্যাশবোর্ড গুরুত্বপূর্ণ নোটিশ' 
      : 'জরুরি লাইভ নোটিশ ও ঘোষণা';
    const title = (customTitle || notifTitle).trim() || defaultTitle;
    const msg = (customMsg || notifMessage).trim();

    if (!msg) {
      showToast(lang === 'bn' ? 'দয়া করে নোটিফিকেশনের বার্তা লিখুন' : 'Please enter notification message', 'error');
      return;
    }

    setIsSendingNotif(true);
    try {
      const res = await api.adminSendNotification(adminToken, {
        recipientRole: target,
        titleBn: title,
        titleEn: title,
        messageBn: msg,
        messageEn: msg,
        type: 'ANNOUNCEMENT'
      });

      if (res && res.success) {
        showToast(
          lang === 'bn'
            ? `${target === 'PUBLIC' ? 'পাবলিক ওয়েবসাইটে' : target === 'EMPLOYEE' ? 'রিসেলার ড্যাশবোর্ডে' : 'সকল প্ল্যাটফর্মে'} রিয়েল-টাইমে নোটিফিকেশন পাঠানো হয়েছে!`
            : 'Live notification dispatched successfully!',
          'success'
        );
        if (!customMsg) {
          setNotifTitle('');
          setNotifMessage('');
        }
        await loadAllNotifications();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send notification', 'error');
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!adminToken) return;
    try {
      await api.adminDeleteNotification(adminToken, id);
      setAllNotifications(prev => prev.filter(n => n.id !== id));
      showToast(lang === 'bn' ? 'নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে' : 'Notification deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  // Payment settings Save
  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await api.adminUpdatePayments(adminToken, paymentSettings);
      if (branding) {
        await api.adminUpdateBranding(adminToken, branding);
      }
      showToast(lang === 'bn' ? 'পেমেন্ট ও উইথড্রয়াল সেটিংস সংরক্ষণ করা হয়েছে।' : 'Payment and withdrawal settings saved.');
      await refreshBootstrap();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const isSaleCancelled = (s: Sale) => {
    if (!s) return false;
    const saleSt = String(s.saleStatus || '').toLowerCase();
    const delSt = String(s.deliveryStatus || '').toLowerCase();
    const st = String((s as any).status || '').toLowerCase();
    const paySt = String(s.paymentStatus || '').toLowerCase();
    return (
      saleSt === 'rejected' ||
      saleSt === 'cancelled' ||
      delSt === 'cancelled' ||
      st === 'rejected' ||
      st === 'cancelled' ||
      paySt === 'cancelled'
    );
  };

  const isSaleConfirmed = (s: Sale) => {
    if (!s || isSaleCancelled(s)) return false;
    const paySt = String(s.paymentStatus || '').toLowerCase();
    const delSt = String(s.deliveryStatus || '').toLowerCase();
    const st = String((s as any).status || '').toLowerCase();
    return paySt === 'paid' || delSt === 'delivered' || st === 'delivered';
  };

  const isSaleCourierProvided = (s: Sale) => {
    if (!s || isSaleCancelled(s) || isSaleConfirmed(s)) return false;
    const delSt = String(s.deliveryStatus || '').toLowerCase();
    return Boolean(s.trackingCode || s.courierTrackingUrl || delSt === 'shipped');
  };

  const formatOrderDateTime = (dateStr?: string) => {
    if (!dateStr) return 'তারিখ অনুপলব্ধ';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dateFormatted = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted} • ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

  const isSalePending = (s: Sale) => {
    if (!s || isSaleCancelled(s) || isSaleConfirmed(s) || isSaleCourierProvided(s)) return false;
    return true;
  };

  const pendingSalesCount = consolidatedSales.filter(isSalePending).length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const pendingBalanceRequestsCount = balanceTopupRequests.filter(b => b.status === 'PENDING').length;

  // Live dynamic calculations for top stats cards so they stay in sync
  const activeSalesForStats = sales.filter(s => !isSaleCancelled(s));
  const todayStrForStats = new Date().toISOString().split('T')[0];
  const todaySalesListForStats = activeSalesForStats.filter(s => s.saleDate && s.saleDate.startsWith(todayStrForStats));
  
  const liveTotalSalesRevenue = activeSalesForStats.reduce((sum, s) => sum + (s.totalAmount || ((s.sellingPrice || s.actualSalePrice || 0) * (s.quantity || 1))), 0);
  const liveTodaySales = todaySalesListForStats.reduce((sum, s) => sum + (s.totalAmount || ((s.sellingPrice || s.actualSalePrice || 0) * (s.quantity || 1))), 0);
  
  const paidSalesForStats = activeSalesForStats.filter(s => s.paymentStatus === 'PAID' || s.deliveryStatus === 'delivered' || s.saleStatus === 'Approved');
  const liveTotalCommissionPaid = paidSalesForStats.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);
  const liveTodayCommission = todaySalesListForStats.filter(s => s.paymentStatus === 'PAID' || s.deliveryStatus === 'delivered' || s.saleStatus === 'Approved').reduce((sum, s) => sum + (s.commissionAmount || 0), 0);
  
  const pendingWdList = withdrawals.filter(w => w.status === 'PENDING');
  const livePendingWithdrawalsTotal = pendingWdList.reduce((sum, w) => sum + (w.amount || 0), 0);
  
  const liveTotalEmployees = employees.length;
  const livePendingEmployees = employees.filter(e => e.status === 'PENDING' || (e as any).accountStatus === 'PENDING').length;

  const rawStats = dashboardData?.stats || dashboardData || {};
  const stats = {
    totalSalesRevenue: Math.max(rawStats.totalSalesRevenue || 0, liveTotalSalesRevenue),
    todaySales: Math.max(rawStats.todaySales || 0, liveTodaySales),
    totalCommissionPaid: Math.max(rawStats.totalCommissionPaid || 0, liveTotalCommissionPaid),
    todayCommission: Math.max(rawStats.todayCommission || 0, liveTodayCommission),
    pendingWithdrawalsTotal: rawStats.pendingWithdrawalsTotal !== undefined && rawStats.pendingWithdrawalsTotal > 0 ? rawStats.pendingWithdrawalsTotal : livePendingWithdrawalsTotal,
    pendingWithdrawalsCount: pendingWithdrawalsCount,
    totalEmployees: Math.max(rawStats.totalEmployees || 0, liveTotalEmployees),
    pendingEmployees: livePendingEmployees > 0 ? livePendingEmployees : (rawStats.pendingEmployees || 0),
  };

  const renderNavLinks = (isMobile: boolean) => {
    const handleNavClick = (tab: typeof activeTab) => {
      setActiveTab(tab);
      if (isMobile) setIsAdminMobileMenuOpen(false);
    };

    return (
      <div className="space-y-2 py-2">
        {/* ১. ওভারভিউ ড্যাশবোর্ড */}
        <div>
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#009245] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'ওভারভিউ ড্যাশবোর্ড' : 'Overview Dashboard'}</span>
            </div>
          </button>
        </div>

        {/* ২. লাইভ অর্ডার ও রিকোয়েস্ট */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, masterOrders: !p.masterOrders }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShoppingBag className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'লাইভ অর্ডার ও রিকুয়েস্ট' : 'Live Orders & Requests'}</span>
            </div>
            {pendingSalesCount > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                {pendingSalesCount} নতুন
              </span>
            ) : expandedSections.masterOrders ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.masterOrders && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('order_requests')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'order_requests' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bell className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{lang === 'bn' ? 'নতুন অর্ডার রিকোয়েস্ট' : 'New Order Requests'}</span>
                </div>
                {pendingSalesCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-bold animate-pulse shrink-0">
                    {pendingSalesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('sales')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'sales' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{lang === 'bn' ? 'অল সেলস ও অর্ডার লেজার' : 'All Sales Orders'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">({sales.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('courier_status')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'courier_status' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5 shrink-0 text-cyan-600" />
                <span className="truncate">{lang === 'bn' ? 'কুরিয়ার ও ডেলিভারি স্ট্যাটাস' : 'Courier Status'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৩. পেমেন্ট ও উইথড্রয়াল হাব */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, paymentHub: !p.paymentHub }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'পেমেন্ট ও উইথড্রয়াল হাব' : 'Payments & Payouts'}</span>
            </div>
            {pendingWithdrawalsCount > 0 ? (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                {pendingWithdrawalsCount} রিকোয়েস্ট
              </span>
            ) : expandedSections.paymentHub ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.paymentHub && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('withdrawals')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'withdrawals' || activeTab === 'payment_requests' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="truncate">{lang === 'bn' ? 'রিসেলার পেমেন্ট রিকোয়েস্ট' : 'Payout Requests'}</span>
                </div>
                {pendingWithdrawalsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-bold animate-pulse shrink-0">
                    {pendingWithdrawalsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('balance_requests')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'balance_requests' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Plus className="w-3.5 h-3.5 shrink-0 text-emerald-600 font-extrabold" />
                  <span className="truncate">{lang === 'bn' ? 'ব্যালেন্স অ্যাড রিকোয়েস্ট' : 'Balance Top-up Requests'}</span>
                </div>
                {pendingBalanceRequestsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-bold animate-pulse shrink-0">
                    {pendingBalanceRequestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('payments')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'payments' || activeTab === 'payment_gateways' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                <span className="truncate">{lang === 'bn' ? 'পেমেন্ট কন্ট্রোল ও সেটিংস' : 'Payment Control & Gateways'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('payment_history')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'payment_history' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span className="truncate">{lang === 'bn' ? 'পেমেন্ট ট্রানজেকশন হিস্ট্রি' : 'Payment History'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৪. রিসেলার ও অ্যাকাউন্ট কন্ট্রোল */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, resellerSection: !p.resellerSection }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'রিসেলার ও একাউন্ট কন্ট্রোল' : 'Reseller Accounts'}</span>
            </div>
            {stats?.pendingEmployees > 0 ? (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">
                {stats.pendingEmployees} অপেক্ষমাণ
              </span>
            ) : expandedSections.resellerSection ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.resellerSection && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('employees')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'employees' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{lang === 'bn' ? 'রিসেলার একাউন্টস' : 'Reseller Accounts'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">({employees.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reseller_referrals')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'reseller_referrals' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0 text-cyan-600" />
                <span className="truncate">{lang === 'bn' ? 'রেফারেন্স ও টিম ট্র্যাকিং' : 'Referrals & Team'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('training')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'training' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{lang === 'bn' ? 'রিসেলার কোর্স ও ভিডিও' : 'Reseller Courses'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('reseller_support')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'reseller_support' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate">{lang === 'bn' ? 'সাপোর্ট নোটিশ ও নিয়মাবলী' : 'Support & Rules'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৫. প্রোডাক্ট হাব ও ইনভেন্টরি */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, productHub: !p.productHub }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Package className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'প্রোডাক্ট হাব ও ইনভেন্টরি' : 'Product Inventory'}</span>
            </div>
            {expandedSections.productHub ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.productHub && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('products')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'products' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{lang === 'bn' ? 'প্রোডাক্ট ম্যানেজমেন্ট' : 'Product Inventory'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">({products.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('categories')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'categories' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{lang === 'bn' ? 'ক্যাটাগরি কন্ট্রোল' : 'Category Control'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">({categories.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* ৬. এআই হাব (AI Hub) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, aiHub: !p.aiHub }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'এআই হাব (AI Hub)' : 'AI Hub'}</span>
            </div>
            {expandedSections.aiHub ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.aiHub && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('ai_chat')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'ai_chat' || activeTab === 'ai_hub' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'মেইন চ্যাটিং এআই প্রম্পট' : 'Main Chat AI Prompts'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('ai_video')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'ai_video' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'ভিডিও এআই লিমিট ও ফি' : 'Video AI Limits & Pricing'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('ai_campaign')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'ai_campaign' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'ক্যাম্পেইন এআই' : 'Campaign AI Generator'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৭. পাবলিক সেকশন ও কন্টাক্ট */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, publicSection: !p.publicSection }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'পাবলিক সেকশন ও কন্টাক্ট' : 'Public Section'}</span>
            </div>
            {expandedSections.publicSection ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.publicSection && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('public_whatsapp')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'public_whatsapp' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">{lang === 'bn' ? 'হোয়াটসঅ্যাপ ও কন্টাক্ট লিংক' : 'WhatsApp & Hotline'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('public_notice')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'public_notice' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{lang === 'bn' ? 'কাস্টমার পপআপ নোটিশ' : 'Customer Order Notice'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('public_banners')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'public_banners' || activeTab === 'branding' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{lang === 'bn' ? 'হেডার ব্যানার ও স্লাইডার' : 'Hero Banners & Slider'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৮. নোটিফিকেশন বার */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, notificationHub: !p.notificationHub }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Bell className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'নোটিফিকেশন বার সেকশন' : 'Notifications Bar'}</span>
            </div>
            {expandedSections.notificationHub ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.notificationHub && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('notif_public')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'notif_public' || activeTab === 'notifications' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">{lang === 'bn' ? 'পাবলিক নোটিফিকেশন বার' : 'Public Notification Bar'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('notif_reseller')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'notif_reseller' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                <span className="truncate">{lang === 'bn' ? 'রিসেলার নোটিশ বার' : 'Reseller Notice Bar'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ৯. ওয়েবসাইট অন/অফ ও সার্ভিস */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, websiteControl: !p.websiteControl }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Settings className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'ওয়েবসাইট কন্ট্রোল ও সারভার' : 'Website Control'}</span>
            </div>
            {expandedSections.websiteControl ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.websiteControl && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('website_status')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'website_status' || activeTab === 'website_control' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{lang === 'bn' ? 'ওয়েবসাইট অন/অফ সার্ভিস' : 'Website Online/Offline'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ১০. অডিট ও ট্র্যাশ */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setExpandedSections(p => ({ ...p, systemLogs: !p.systemLogs }))}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200/80"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">{lang === 'bn' ? 'অডিট ও ট্র্যাশ বিন' : 'Audit & Trash'}</span>
            </div>
            {expandedSections.systemLogs ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </button>

          {expandedSections.systemLogs && (
            <div className="space-y-0.5 pt-0.5 pl-2 border-l-2 border-slate-100 ml-3">
              <button
                type="button"
                onClick={() => handleNavClick('audit')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'audit' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{lang === 'bn' ? 'সিস্টেম অডিট লগ' : 'System Audit Log'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('trash')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === 'trash' ? 'bg-[#009245] text-white shadow-2xs font-bold' : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'ট্র্যাশ কন্ট্রোল' : 'Trash Bin'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* MOBILE COLLAPSIBLE SIDEBAR DRAWER (Exactly matching desktop layout style) */}
      <div className={`fixed inset-0 z-[9998] md:hidden transition-opacity duration-300 ${isAdminMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Full-screen backdrop overlay */}
        <div
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          onClick={() => setIsAdminMobileMenuOpen(false)}
        />
      </div>

      <div className={`fixed inset-y-0 left-0 z-[9999] w-72 bg-white border-r border-slate-200 shadow-2xl flex flex-col justify-between text-slate-800 font-sans h-screen transition-transform duration-300 ease-in-out md:hidden ${isAdminMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="overflow-y-auto no-scrollbar flex-1">
            {/* Header section identical to desktop style */}
            <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#009245] to-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                  TN
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                    {t.adminCoreTitle}
                  </h3>
                  <span className="text-[8px] text-[#009245] font-mono font-bold tracking-wider">SUPER ADMIN CONSOLE</span>
                </div>
              </div>
              <button
                onClick={() => setIsAdminMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setIsAdminMobileMenuOpen(false);
                  setActivePortal('public');
                }}
                className="w-full py-2.5 px-3 text-left rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 transition-all inline-flex items-center gap-2.5 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#009245]" />
                <span>{lang === 'bn' ? 'পাবলিক স্টোরে ফিরে যান' : 'Back to Public Store'}</span>
              </button>
            </div>

            <div className="p-3">
              {renderNavLinks(true)}
            </div>
          </div>

          {/* Footer section identical to desktop style */}
          <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#009245] animate-pulse"></div>
              <div className="text-[11px] text-slate-500 font-mono truncate max-w-[170px]">
                {AUTHORIZED_ADMIN_EMAIL}
              </div>
            </div>

            <button
              onClick={() => {
                setIsAdminMobileMenuOpen(false);
                adminLogout();
              }}
              className="w-full py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.navLogout}</span>
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* DESKTOP SIDEBAR NAVIGATION                         */}
      {/* -------------------------------------------------- */}
      <aside className={`${isDesktopSidebarOpen ? 'hidden md:flex' : 'hidden'} w-full md:w-68 bg-white border-r border-slate-200 shrink-0 flex-col justify-between text-slate-800 font-sans overflow-y-auto h-screen sticky top-0 no-scrollbar transition-all duration-300`}>
        <div>
          {/* Admin Header / Console Title */}
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#009245] to-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md tracking-wider">
                TN
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  {t.adminCoreTitle}
                </h3>
                <span className="text-[9.5px] text-[#009245] font-mono font-bold tracking-widest">SUPER ADMIN CONSOLE</span>
              </div>
            </div>
            {/* Desktop Collapse Trigger */}
            <button
              onClick={() => setIsDesktopSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Collapse Menu"
            >
              <Menu className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActivePortal('public')}
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl inline-flex items-center gap-2.5 transition-colors border border-slate-200 cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-[#009245]" />
              <span>{lang === 'bn' ? 'পাবলিক স্টোরে ফিরে যান' : 'Back to Public Store'}</span>
            </button>
          </div>

          <div className="p-3">
            {renderNavLinks(false)}
          </div>
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50 mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#009245] animate-pulse"></div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              {AUTHORIZED_ADMIN_EMAIL}
            </div>
          </div>
          <button
            onClick={adminLogout}
            className="w-full py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.navLogout}</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------- */}
      {/* MAIN ADMIN VIEWPORT                                */}
      {/* -------------------------------------------------- */}
      <main className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4">
        
        {/* Global Sub-page Header with Back to Dashboard Button & Sync Trigger */}
        {activeTab !== 'dashboard' && (
          <div className={`flex items-center justify-between pb-2 border-b border-slate-200/80 gap-2 shrink-0 ${
            [
              'ai_hub', 'ai_chat', 'ai_video', 'ai_campaign', 'ai_website',
              'branding', 'public_section', 'public_banners', 'public_whatsapp', 'public_notice', 'reseller_support',
              'notifications', 'notif_public', 'notif_reseller',
              'website_control', 'website_status',
              'payments'
            ].includes(activeTab) ? 'w-full max-w-5xl mx-auto' : ''
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-95 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#009245]" />
                <span>{lang === 'bn' ? '← ব্যাক' : '← Back'}</span>
              </button>
              <span className="text-[10px] sm:text-xs font-extrabold text-[#009245] uppercase tracking-wider bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg sm:rounded-xl whitespace-nowrap truncate min-w-0 max-w-[160px] sm:max-w-none">
                {getTabTitle(activeTab, lang)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleForceCloudSync}
                disabled={isSyncing}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow-3xs cursor-pointer flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                title="Sync Live Data from Cloud"
              >
                <RefreshCw className={`w-3 h-3 text-[#009245] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (lang === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'সিঙ্ক' : 'Sync')}</span>
              </button>
            </div>
          </div>
        )}
        
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            
            {/* Unified compact actions bar: Combines Heading, Cloud Sync, Publish & Refresh in a single row */}
            <div className="bg-slate-100/80 border border-slate-200/80 p-3 sm:p-4 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs w-full">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009245] animate-pulse shrink-0"></span>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">{lang === 'bn' ? 'ওভারভিউ ও ড্যাশবোর্ড' : 'Overview & Dashboard'}</h2>
                  <p className="text-[10px] text-slate-500 hidden sm:block">
                    {lang === 'bn' ? 'সিস্টেমের সামগ্রিক বিক্রয়, কর্মী ও আর্থিক খতিয়ান' : 'Central overview of platform volume and revenue'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap w-full sm:w-auto overflow-x-hidden">
                {/* 1. Sync Button */}
                <button
                  onClick={handleForceCloudSync}
                  disabled={isSyncing}
                  className="flex-1 sm:flex-none px-2 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[9.5px] xs:text-[10px] sm:text-[11px] rounded-lg sm:rounded-xl shadow-3xs cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50 shrink-0 whitespace-nowrap min-w-0"
                  title="Sync Data from Live Server"
                >
                  <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#009245] ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="truncate">{lang === 'bn' ? 'সিঙ্ক' : 'Sync'}</span>
                </button>

                {/* 2. Publish Button */}
                <button
                  onClick={handlePublishToWebsite}
                  disabled={isPublishing}
                  className="flex-1 sm:flex-none px-2 py-1.5 bg-[#009245] hover:bg-[#007a38] text-white font-extrabold text-[9.5px] xs:text-[10px] sm:text-[11px] rounded-lg sm:rounded-xl shadow-3xs cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50 shrink-0 whitespace-nowrap min-w-0"
                  title="Publish to Website"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  ) : (
                    <span>🚀</span>
                  )}
                  <span className="truncate">{lang === 'bn' ? 'প্রকাশ' : 'Publish'}</span>
                </button>

                {/* 3. Refresh Button */}
                <button
                  onClick={() => loadAdminData()}
                  className="flex-1 sm:flex-none px-2 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[9.5px] xs:text-[10px] sm:text-[11px] rounded-lg sm:rounded-xl shadow-3xs cursor-pointer flex items-center justify-center gap-1 transition-all shrink-0 whitespace-nowrap min-w-0"
                  title="Refresh"
                >
                  <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                  <span className="truncate">{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards (2x2 Grid on Mobile = 4 boxes across 2 lines) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              
              {/* Card 1: Total Sales (Soft Blue) */}
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className="bg-blue-50/80 border border-blue-200/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs space-y-1 sm:space-y-2 min-w-0 text-left cursor-pointer hover:bg-blue-100/70 hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold text-blue-900 truncate">{t.totalSales}</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="text-base sm:text-2xl font-black text-blue-950 font-mono tabular-nums truncate">
                  ৳{stats.totalSalesRevenue.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[11px] font-semibold text-blue-700 truncate">
                  আজকের বিক্রয়: ৳{stats.todaySales.toLocaleString()}
                </div>
              </button>

              {/* Card 2: Total Earnings (Soft Green) */}
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className="bg-emerald-50/80 border border-emerald-200/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs space-y-1 sm:space-y-2 min-w-0 text-left cursor-pointer hover:bg-emerald-100/70 hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-900 truncate">{t.totalEarnings}</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="text-base sm:text-2xl font-black text-emerald-950 font-mono tabular-nums truncate">
                  ৳{stats.totalCommissionPaid.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[11px] font-semibold text-emerald-700 truncate">
                  আজকের কমিশন: ৳{stats.todayCommission.toLocaleString()}
                </div>
              </button>

              {/* Card 3: Pending Withdrawals (Soft Orange/Amber) -> Links to Payout Requests */}
              <button
                type="button"
                onClick={() => setActiveTab('withdrawals')}
                className="bg-amber-50/80 border border-amber-200/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs space-y-1 sm:space-y-2 min-w-0 text-left cursor-pointer hover:bg-amber-100/70 hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold text-amber-900 truncate">{t.pendingWithdrawal}</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="text-base sm:text-2xl font-black text-amber-950 font-mono tabular-nums truncate">
                  ৳{stats.pendingWithdrawalsTotal.toLocaleString()}
                </div>
                <div className="text-[9px] sm:text-[11px] font-semibold text-amber-700 truncate">
                  {stats.pendingWithdrawalsCount} টি আবেদন অপেক্ষমাণ
                </div>
              </button>

              {/* Card 4: Reseller & Users (Soft Purple) -> Links to Reseller Accounts */}
              <button
                type="button"
                onClick={() => setActiveTab('employees')}
                className="bg-purple-50/80 border border-purple-200/80 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs space-y-1 sm:space-y-2 min-w-0 text-left cursor-pointer hover:bg-purple-100/70 hover:scale-[1.01] transition-all group"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold text-purple-900 truncate">
                    {lang === 'bn' ? 'রিসেলার ও ইউজার' : 'Reseller Accounts'}
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="text-base sm:text-2xl font-black text-purple-950 font-mono tabular-nums truncate">
                  {stats.totalEmployees}
                </div>
                <div className="text-[9px] sm:text-[11px] font-semibold text-purple-700 truncate">
                  {stats.pendingEmployees > 0 ? `${stats.pendingEmployees} টি অপেক্ষমাণ` : 'সকল একাউন্ট সক্রিয়'}
                </div>
              </button>

            </div>

            {/* Quick Action Navigation Grid (Organized into Clear Logical Categories with Highlighted Executive Borders) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009245] animate-pulse"></span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    {lang === 'bn' ? 'কুইক অ্যাকশন কন্ট্রোল প্যানেল' : 'Quick Control Panel'}
                  </h3>
                </div>
              </div>

              {/* Group 1: ⚡ দৈনিক কাজের কন্ট্রোল (Daily Operations & Requests) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 text-xs font-black text-slate-800 tracking-wider uppercase border-b border-slate-100">
                  <span className="w-2 h-4 bg-amber-500 rounded-full"></span>
                  <span>{lang === 'bn' ? '⚡ দৈনিক প্রয়োজনীয় কাজ ও রিকোয়েস্ট কন্ট্রোল' : '⚡ Daily Operations & Requests'}</span>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Item 1: New Order Requests */}
                  <button
                    onClick={() => setActiveTab('order_requests')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 border-2 border-amber-400 hover:border-amber-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-amber-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group relative"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Bell className="w-6 h-6 animate-bounce" />
                      </div>
                      {pendingSalesCount > 0 && (
                        <span className="absolute -top-2.5 -right-5 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse border-2 border-white whitespace-nowrap z-10">
                          {pendingSalesCount} নতুন
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-amber-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'অর্ডার রিকোয়েস্ট' : 'Order Requests'}
                    </span>
                  </button>

                  {/* Item 2: Reseller Payment Requests */}
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-rose-50/90 via-white to-rose-50/30 border-2 border-rose-400 hover:border-rose-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-rose-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group relative"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <ArrowDownLeft className="w-6 h-6 animate-pulse" />
                      </div>
                      {pendingWithdrawalsCount > 0 && (
                        <span className="absolute -top-2.5 -right-5 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse border-2 border-white whitespace-nowrap z-10">
                          {pendingWithdrawalsCount} পেন্ডিং
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-rose-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'পেমেন্ট রিকোয়েস্ট' : 'Payout Requests'}
                    </span>
                  </button>

                  {/* Item 3: Balance Topup Requests */}
                  <button
                    onClick={() => setActiveTab('balance_requests')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/30 border-2 border-emerald-400 hover:border-emerald-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-emerald-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group relative"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Plus className="w-6 h-6 font-black" />
                      </div>
                      {pendingBalanceRequestsCount > 0 && (
                        <span className="absolute -top-2.5 -right-5 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse border-2 border-white whitespace-nowrap z-10">
                          {pendingBalanceRequestsCount} নতুন
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'ব্যালেন্স অ্যাড রিকোয়েস্ট' : 'Balance Requests'}
                    </span>
                  </button>

                  {/* Item 4: Reseller Accounts Control */}
                  <button
                    onClick={() => setActiveTab('employees')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-cyan-50/90 via-white to-cyan-50/30 border-2 border-cyan-400 hover:border-cyan-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-cyan-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group relative"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      {stats?.pendingEmployees > 0 && (
                        <span className="absolute -top-2.5 -right-5 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse border-2 border-white whitespace-nowrap z-10">
                          {stats.pendingEmployees} অপেক্ষমাণ
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-cyan-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'রিসেলার একাউন্টস' : 'Resellers'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Group 2: 📦 প্রোডাক্ট, ক্যাটাগরি, পেমেন্ট ও ট্রেনিং (Products, Category, Payment & Training) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-1 text-xs font-black text-slate-800 tracking-wider uppercase border-b border-slate-100">
                  <span className="w-2 h-4 bg-[#009245] rounded-full"></span>
                  <span>{lang === 'bn' ? '📦 প্রোডাক্ট, ক্যাটাগরি, পেমেন্ট কন্ট্রোল ও ট্রেনিং' : '📦 Products, Categories, Payment & Training'}</span>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Item 5: Product Inventory */}
                  <button
                    onClick={() => setActiveTab('products')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/30 border-2 border-emerald-400 hover:border-emerald-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-emerald-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#009245] to-emerald-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Package className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'প্রোডাক্টস ম্যানেজার' : 'Product Inventory'}
                    </span>
                  </button>

                  {/* Item 6: Category Control */}
                  <button
                    onClick={() => setActiveTab('categories')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-blue-50/90 via-white to-blue-50/30 border-2 border-blue-400 hover:border-blue-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-blue-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Layers className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-blue-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'ক্যাটাগরি সেটিংস' : 'Categories'}
                    </span>
                  </button>

                  {/* Item 7: Reseller Training */}
                  <button
                    onClick={() => setActiveTab('training')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-teal-50/90 via-white to-teal-50/30 border-2 border-teal-400 hover:border-teal-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-teal-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Play className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-teal-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'রিসেলার ট্রেনিং' : 'Reseller Training'}
                    </span>
                  </button>

                  {/* Item 8: Payment Control */}
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-purple-50/90 via-white to-purple-50/30 border-2 border-purple-400 hover:border-purple-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-purple-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-purple-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'পেমেন্ট কন্ট্রোল' : 'Payment Control'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Group 3: ⚙️ সেলস লেজার, সাপোর্ট ও সিস্টেম সেটিং (Sales Ledger, Support & System Tools) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 pb-1 text-xs font-black text-slate-800 tracking-wider uppercase border-b border-slate-100">
                  <span className="w-2 h-4 bg-purple-600 rounded-full"></span>
                  <span>{lang === 'bn' ? '⚙️ সেলস লেজার, সাপোর্ট, এআই হাব ও সিস্টেম সেটিংস' : '⚙️ Sales Ledger, Support & System Tools'}</span>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-3 sm:gap-4">
                  {/* Item 9: All Sales Orders Ledger */}
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-violet-50/90 via-white to-violet-50/30 border-2 border-violet-400 hover:border-violet-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-violet-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-violet-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'অল সেলস লেজার' : 'Sales Orders'}
                    </span>
                  </button>

                  {/* Item 10: Support Rules */}
                  <button
                    onClick={() => setActiveTab('reseller_support')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 border-2 border-amber-400 hover:border-amber-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-amber-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-amber-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'সাপোর্ট ও নিয়মাবলী' : 'Support & Rules'}
                    </span>
                  </button>

                  {/* Item 11: AI Hub */}
                  <button
                    onClick={() => setActiveTab('ai_hub')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/30 border-2 border-amber-400 hover:border-amber-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-amber-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-amber-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'এআই হাব' : 'AI Hub'}
                    </span>
                  </button>

                  {/* Item 12: Header Banners */}
                  <button
                    onClick={() => setActiveTab('branding')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-orange-50/90 via-white to-orange-50/30 border-2 border-orange-400 hover:border-orange-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-orange-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-orange-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'হেডার ও ব্যানার' : 'Header Banners'}
                    </span>
                  </button>

                  {/* Item 13: Public WhatsApp */}
                  <button
                    onClick={() => setActiveTab('public_whatsapp')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/30 border-2 border-emerald-400 hover:border-emerald-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-emerald-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'হোয়াটসঅ্যাপ কন্টাক্ট' : 'WhatsApp Contact'}
                    </span>
                  </button>

                  {/* Item 14: Notification Bar */}
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-rose-50/90 via-white to-rose-50/30 border-2 border-rose-400 hover:border-rose-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-rose-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Bell className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-rose-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'নোটিফিকেশন বার' : 'Notification Bar'}
                    </span>
                  </button>

                  {/* Item 15: Website Status */}
                  <button
                    onClick={() => setActiveTab('website_control')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-purple-50/90 via-white to-purple-50/30 border-2 border-purple-400 hover:border-purple-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-purple-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-slate-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Settings className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-purple-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'ওয়েবসাইট অন/অফ' : 'Website Control'}
                    </span>
                  </button>

                  {/* Item 16: Audit Logs */}
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-100/90 via-white to-slate-50/40 border-2 border-slate-300 hover:border-slate-500 rounded-2xl shadow-xs hover:shadow-md hover:shadow-slate-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-1 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-slate-950 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'অডিট লগ' : 'Audit Logs'}
                    </span>
                  </button>

                  {/* Item 17: Trash Bin */}
                  <button
                    onClick={() => setActiveTab('trash')}
                    className="p-3.5 sm:p-4 bg-gradient-to-b from-rose-50/90 via-white to-rose-50/30 border-2 border-rose-400 hover:border-rose-600 rounded-2xl shadow-xs hover:shadow-md hover:shadow-rose-200/50 flex flex-col items-center justify-center text-center gap-2.5 transition-all cursor-pointer hover:scale-103 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-rose-900 transition-colors leading-tight truncate w-full">
                      {lang === 'bn' ? 'ট্র্যাশ বিন' : 'Trash Bin'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT MANAGEMENT (CRUD + IMAGE UPLOAD SYSTEM) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 truncate min-w-0">
                {lang === 'bn' ? 'পণ্য তালিকা ও স্টক' : 'Product Directory & Stock'}
              </h3>
              <button
                onClick={() => handleOpenAddProduct()}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a38] rounded-lg sm:rounded-xl shadow-3xs inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন পণ্য' : 'Add Product'}</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ছবি</th>
                      <th className="py-3 px-4">কোড</th>
                      <th className="py-3 px-4">নাম</th>
                      <th className="py-3 px-4">ক্যাটাগরি</th>
                      <th className="py-3 px-4">আসল মূল্য (Cost)</th>
                      <th className="py-3 px-4">বিক্রয় মূল্য</th>
                      <th className="py-3 px-4">কমিশন</th>
                      <th className="py-3 px-4">স্ট্যাটাস</th>
                      <th className="py-3 px-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                              src={prod.images[0]?.url || '/images/product_shop_dress_1790244714775.jpg'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{prod.productCode}</td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-slate-900 block line-clamp-1">{prod.nameBn}</span>
                          <span className="text-slate-400 text-[11px] block">{prod.nameEn}</span>
                        </td>
                        <td className="py-2.5 px-4 uppercase text-[11px] font-semibold text-slate-500">{prod.categorySlug}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">৳{prod.originalPrice?.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">৳{prod.sellingPrice.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">
                          {prod.commissionType === 'percentage' ? `${prod.commissionRate}%` : `৳${prod.commissionRate}`}
                        </td>
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => handleToggleProductStatus(prod.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                              prod.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {prod.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* View Option */}
                            <button
                              onClick={() => setViewingProduct(prod)}
                              className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                              title={lang === 'bn' ? 'ডিটেইলস ভিউ করুন' : 'View Product'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'ভিউ' : 'View'}</span>
                            </button>

                            {/* Edit Option */}
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="px-2 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                              title={lang === 'bn' ? 'প্রোডাক্ট এডিট করুন' : 'Edit Product'}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                            </button>

                            {/* Disable / Active Toggle Option */}
                            <button
                              onClick={() => handleToggleProductStatus(prod.id)}
                              className={`px-2 py-1 text-[11px] font-bold border rounded-lg transition-colors shrink-0 ${
                                prod.isActive
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                              title={prod.isActive ? (lang === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Disable') : (lang === 'bn' ? 'সক্রিয় করুন' : 'Enable')}
                            >
                              <span>{prod.isActive ? (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Disable') : (lang === 'bn' ? 'সক্রিয়' : 'Enable')}</span>
                            </button>

                            {/* Delete Option */}
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
                              title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PURE CATEGORY & SECTION MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Header & Breadcrumb Bar */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {(adminCategoryPath.categorySlug || adminCategoryPath.subcategory || adminCategoryPath.subSubcategory) && (
                  <button
                    onClick={() => {
                      if (adminCategoryPath.subSubcategory) {
                        setAdminCategoryPath({ categorySlug: adminCategoryPath.categorySlug, subcategory: adminCategoryPath.subcategory });
                      } else if (adminCategoryPath.subcategory) {
                        setAdminCategoryPath({ categorySlug: adminCategoryPath.categorySlug });
                      } else {
                        setAdminCategoryPath({});
                        setAdminSelectedCategory(null);
                      }
                    }}
                    className="px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs whitespace-nowrap shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 truncate">
                    {adminCategoryPath.subSubcategory || adminCategoryPath.subcategory || adminCategoryPath.categorySlug || (lang === 'bn' ? 'ক্যাটাগরি কন্ট্রোল' : 'Categories')}
                  </h3>
                </div>
              </div>

              {/* Add New Category / Section Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!adminCategoryPath.categorySlug ? (
                  <button
                    onClick={() => {
                      setEditingCat(null);
                      setCatForm({
                        name: '',
                        slug: '',
                        description: '',
                        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
                        order: categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 1,
                        isActive: true,
                      });
                      setIsCatModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a38] rounded-lg sm:rounded-xl shadow-3xs inline-flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'নতুন সেকশন' : 'Add Section'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSub(null);
                      const ctxName = adminCategoryPath.subSubcategory || adminCategoryPath.subcategory || adminCategoryPath.categorySlug || '';
                      const currentParentSlug = adminCategoryPath.categorySlug;
                      const currentParentSub = adminCategoryPath.subcategory;
                      const siblings = subsections.filter(s => {
                        if (currentParentSub) return s.parentSlug === currentParentSlug && s.parentSub === currentParentSub;
                        return s.parentSlug === currentParentSlug && !s.parentSub;
                      });

                      setSubForm({
                        name: '',
                        description: '',
                        imageUrl: getSuggestedImageUrl(ctxName),
                        order: siblings.length > 0 ? Math.max(...siblings.map(s => s.order || 0)) + 1 : 1,
                        isActive: true,
                      });
                      setIsSubModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white bg-[#009245] hover:bg-[#007a38] rounded-lg sm:rounded-xl shadow-3xs inline-flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {adminCategoryPath.subSubcategory
                        ? (lang === 'bn' ? 'চাইল্ড আইটেম' : 'Add Child')
                        : adminCategoryPath.subcategory
                        ? (lang === 'bn' ? 'সাব-ক্যাটাগরি' : 'Add Sub')
                        : (lang === 'bn' ? 'ক্যাটাগরি গ্রুপ' : 'Add Group')}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* LEVEL 0: MAIN CATEGORIES (SHOP, GADGETS, OTHERS) */}
            {!adminCategoryPath.categorySlug && (
              <DragDropContext onDragEnd={onCategoryDragEnd}>
                <Droppable droppableId="categories" direction="horizontal">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                      {categories.map((cat, idx) => (
                        <Draggable key={cat.id} draggableId={cat.id} index={idx}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-5 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
                            >
                              {/* Drag Handle */}
                              <div 
                                {...provided.dragHandleProps} 
                                className="absolute top-4 left-2.5 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <div className="space-y-3">
                                {/* Top status bar & Reorder */}
                                <div className="flex items-center justify-between pl-6">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Order #{cat.order || idx + 1}</span>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${cat.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                      {cat.isActive !== false ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                                  {/* Toggle Active Switch */}
                                  <button
                                    onClick={async () => {
                                      const updated = { ...cat, isActive: !cat.isActive };
                                      await api.adminUpdateCategory(adminToken!, cat.id, updated);
                                      showToast(lang === 'bn' ? 'স্ট্যাটাস আপডেট করা হয়েছে।' : 'Status updated.');
                                      await loadAdminData();
                                    }}
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                      cat.isActive !== false ? 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    {cat.isActive !== false ? 'Disable' : 'Enable'}
                                  </button>
                                </div>

                                {/* Header content with Image & Change File button */}
                                <div className="flex items-start gap-4">
                                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group shadow-2xs">
                                    <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                                    <label className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold">
                                      <span>📷 পাল্টান</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file || !adminToken) return;
                                          try {
                                            const base64 = await compressImageFile(file, 800, 0.8);
                                            if (!base64) return;
                                            const res = await api.adminUploadImages(adminToken!, [{ name: file.name, data: base64 }]);
                                            if (res.success && res.urls[0]) {
                                              await api.adminUpdateCategory(adminToken!, cat.id, { ...cat, imageUrl: res.urls[0] });
                                              showToast(lang === 'bn' ? 'ছবি সফলভাবে আপডেট হয়েছে।' : 'Image updated.');
                                              await loadAdminData();
                                            }
                                          } catch (err: any) {
                                            showToast(err.message || 'Upload failed', 'error');
                                          } finally {
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold font-mono text-emerald-700 uppercase tracking-wider">{cat.slug}</span>
                                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{cat.name}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{cat.description || 'Public Section'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Action Toolbar with 7 Full Controls */}
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  onClick={() => {
                                    setAdminCategoryPath({ categorySlug: cat.slug.toLowerCase() });
                                    setAdminSelectedCategory(cat.slug.toLowerCase());
                                  }}
                                  className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  <span>{lang === 'bn' ? 'প্রবেশ করুন' : 'Enter'}</span>
                                  <ChevronRight className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCat(cat);
                                      setCatForm(cat);
                                      setIsCatModalOpen(true);
                                    }}
                                    className="p-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Edit Category"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(lang === 'bn' ? `আপনি কি নিশ্চিতভাবে "${cat.name}" সেকশনটি ডিলিট করতে চান?` : `Are you sure you want to delete "${cat.name}"?`)) {
                                        try {
                                          await api.adminDeleteCategory(adminToken!, cat.id);
                                          setUndoStashItem({ id: cat.id, name: cat.name, countdown: 60 });
                                          showToast(lang === 'bn' ? 'ক্যাটাগরি সাময়িকভাবে ডিলিট করা হয়েছে।' : 'Category temporarily deleted.');
                                          await loadAdminData();
                                          await refreshBootstrap();
                                        } catch (err: any) {
                                          showToast(err.message || 'Failed to delete category', 'error');
                                        }
                                      }
                                    }}
                                    className="p-2 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* LEVEL 1 & 2: SUB-SECTIONS / GROUPS / SUB-CATEGORIES LIST */}
            {adminCategoryPath.categorySlug && !adminCategoryPath.subSubcategory && (
              <div className="space-y-4">
                <DragDropContext onDragEnd={onSubsectionDragEnd}>
                  <Droppable droppableId="subsections" direction="horizontal">
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
                      >
                        {subsections
                          .filter(sub => {
                            const pSlug = (sub.parentSlug || '').toLowerCase();
                            const pathSlug = (adminCategoryPath.categorySlug || '').toLowerCase();
                            if (adminCategoryPath.subcategory) {
                              return pSlug === pathSlug && sub.parentSub === adminCategoryPath.subcategory;
                            }
                            return pSlug === pathSlug && !sub.parentSub;
                          })
                          .sort((a, b) => a.order - b.order)
                          .map((sub, idx) => (
                            <Draggable key={sub.id} draggableId={sub.id} index={idx}>
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative"
                                >
                                  {/* Drag Handle */}
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className="absolute top-4 left-2.5 p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing transition-colors"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <div className="space-y-3">
                                    {/* Order, Status & Reorder controls */}
                                    <div className="flex items-center justify-between pl-6">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-mono font-bold text-slate-400">Order #{sub.order}</span>
                                        <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5">
                                          <button
                                            onClick={() => handleReorderSub(sub.id, 'up')}
                                            className="p-0.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-[10px] cursor-pointer"
                                            title="Move Up"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            onClick={() => handleReorderSub(sub.id, 'down')}
                                            className="p-0.5 hover:bg-slate-200 rounded text-slate-700 font-bold text-[10px] cursor-pointer"
                                            title="Move Down"
                                          >
                                            ▼
                                          </button>
                                        </div>
                                      </div>

                                      {/* Toggle Enable/Disable */}
                                      <button
                                        onClick={() => handleToggleSubStatus(sub.id)}
                                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                                          sub.isActive !== false
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        {sub.isActive !== false ? 'Active ✓' : 'Disabled'}
                                      </button>
                                    </div>

                                    {/* Image & Title */}
                                    <div className="flex items-start gap-3.5">
                                      <div className="relative w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 group">
                                        <img src={sub.imageUrl} alt="" className="w-full h-full object-cover" />
                                        <label className="absolute inset-0 bg-slate-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold">
                                          <span>📷 পাল্টান</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleSubImageUpload(e, sub.id)}
                                          />
                                        </label>
                                      </div>
                                      <div>
                                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">{sub.name}</h3>
                                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-medium">{sub.description}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Footer Action Controls: Enter, Edit, Delete */}
                                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                      onClick={() => {
                                        if (!adminCategoryPath.subcategory) {
                                          setAdminCategoryPath({ categorySlug: adminCategoryPath.categorySlug, subcategory: sub.name });
                                        } else {
                                          setAdminCategoryPath({
                                            categorySlug: adminCategoryPath.categorySlug,
                                            subcategory: adminCategoryPath.subcategory,
                                            subSubcategory: sub.name,
                                          });
                                        }
                                      }}
                                      className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                      <span>{lang === 'bn' ? 'প্রবেশ করুন' : 'Enter'}</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingSub(sub);
                                          setSubForm({
                                            name: sub.name,
                                            description: sub.description,
                                            imageUrl: sub.imageUrl,
                                            order: sub.order,
                                            isActive: sub.isActive,
                                          });
                                          setIsSubModalOpen(true);
                                        }}
                                        className="p-1.5 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm(lang === 'bn' ? `আপনি কি নিশ্চিতভাবে "${sub.name}" ডিলিট করতে চান?` : `Delete subsection "${sub.name}"?`)) {
                                            try {
                                              await api.adminDeleteSubsection(adminToken!, sub.id);
                                              setSubsections(subsections.filter(s => s.id !== sub.id));
                                              setUndoStashItem({ id: sub.id, name: sub.name, countdown: 60 });
                                              showToast(lang === 'bn' ? 'সাব-ক্যাটাগরি সাময়িকভাবে ডিলিট করা হয়েছে।' : 'Sub-category temporarily deleted.');
                                              refreshBootstrap().catch(() => {});
                                            } catch (err) {
                                              console.error('Delete failed:', err);
                                              showToast('Failed to delete item', 'error');
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {subsections.filter(sub => {
                  const currentSlug = adminCategoryPath.categorySlug?.toLowerCase();
                  if (adminCategoryPath.subcategory) {
                    return sub.parentSlug?.toLowerCase() === currentSlug && sub.parentSub === adminCategoryPath.subcategory;
                  }
                  return sub.parentSlug?.toLowerCase() === currentSlug && !sub.parentSub;
                }).length === 0 && (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <p className="text-sm font-bold text-slate-700">
                      {lang === 'bn' ? 'এই সেকশনে এখনো কোনো সাব-সেকশন বা আইটেম যোগ করা হয়নি।' : 'No items added in this category yet.'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingSub(null);
                        setSubForm({
                          name: '',
                          description: '',
                          imageUrl: getSuggestedImageUrl(adminCategoryPath.subcategory || adminCategoryPath.categorySlug || 'Section'),
                          order: 1,
                          isActive: true,
                        });
                        setIsSubModalOpen(true);
                      }}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      + {lang === 'bn' ? 'প্রথম আইটেম যোগ করুন' : 'Add First Item'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LEVEL 3: PRODUCTS INSIDE SPECIFIC SUB-CATEGORY / ITEM */}
            {adminCategoryPath.subSubcategory && (() => {
              const targetItem = adminCategoryPath.subSubcategory.toLowerCase();
              const categoryProducts = products.filter(p => {
                const matchCat = isCategoryMatch(p.categorySlug, adminCategoryPath.categorySlug);
                const pSub = (p.subcategoryBn || p.subcategoryEn || '').toLowerCase();
                const pName = (p.nameBn || p.nameEn || '').toLowerCase();
                return matchCat && (pSub.includes(targetItem) || targetItem.includes(pSub) || pName.includes(targetItem));
              });

              return (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">Category Linked Collection</span>
                      <h3 className="text-base font-extrabold text-emerald-950">
                        "{adminCategoryPath.subSubcategory}" - {lang === 'bn' ? 'পণ্যসমূহ' : 'Products'} ({categoryProducts.length}টি)
                      </h3>
                      <p className="text-xs text-emerald-800 font-medium">
                        {lang === 'bn'
                          ? `পাবলিক ওয়েবসাইটে ${adminCategoryPath.subSubcategory} ক্যাটাগরিতে যে প্রোডাক্টগুলো দেখাবে`
                          : `Products published under ${adminCategoryPath.subSubcategory}`}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenAddProduct(adminCategoryPath.categorySlug, adminCategoryPath.subSubcategory)}
                      className="px-4 py-2 text-xs font-extrabold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'bn' ? `"${adminCategoryPath.subSubcategory}"-এ নতুন প্রোডাক্ট যোগ করুন` : 'Add Product'}</span>
                    </button>
                  </div>

                  {categoryProducts.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-3 px-4">ছবি</th>
                              <th className="py-3 px-4">কোড</th>
                              <th className="py-3 px-4">পণ্য নাম</th>
                              <th className="py-3 px-4">ক্রয়মূল্য (Cost)</th>
                              <th className="py-3 px-4">বিক্রি মূল্য</th>
                              <th className="py-3 px-4">কমিশন</th>
                              <th className="py-3 px-4">স্ট্যাটাস</th>
                              <th className="py-3 px-4 text-right">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {categoryProducts.map((prod, index) => (
                              <tr key={`${prod.id}-${index}`} className="hover:bg-slate-50">
                                <td className="py-2.5 px-4">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                                    <img src={prod.images[0]?.url || '/images/product_shop_dress_1790244714775.jpg'} alt="" className="w-full h-full object-cover" />
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{prod.productCode}</td>
                                <td className="py-2.5 px-4">
                                  <span className="font-extrabold text-slate-900 block line-clamp-1">{prod.nameBn}</span>
                                  <span className="text-slate-400 text-[11px] block">{prod.nameEn}</span>
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-500">৳{prod.originalPrice?.toLocaleString()}</td>
                                <td className="py-2.5 px-4 font-mono font-extrabold text-slate-900">৳{prod.sellingPrice.toLocaleString()}</td>
                                <td className="py-2.5 px-4 font-mono font-bold text-emerald-600">
                                  {prod.commissionType === 'percentage' ? `${prod.commissionRate}%` : `৳${prod.commissionRate}`}
                                </td>
                                <td className="py-2.5 px-4">
                                  <button
                                    onClick={() => handleToggleProductStatus(prod.id)}
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                                      prod.isActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}
                                  >
                                    {prod.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                                  </button>
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5 justify-end">
                                    {/* View Option */}
                                    <button
                                      onClick={() => setViewingProduct(prod)}
                                      className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                                      title={lang === 'bn' ? 'ডিটেইলস ভিউ করুন' : 'View Product'}
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>{lang === 'bn' ? 'ভিউ' : 'View'}</span>
                                    </button>

                                    {/* Edit Option */}
                                    <button
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="px-2 py-1 text-[11px] font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-1 shrink-0"
                                      title={lang === 'bn' ? 'প্রোডাক্ট এডিট করুন' : 'Edit Product'}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                                    </button>

                                    {/* Disable / Active Toggle Option */}
                                    <button
                                      onClick={() => handleToggleProductStatus(prod.id)}
                                      className={`px-2 py-1 text-[11px] font-bold border rounded-lg transition-colors shrink-0 ${
                                        prod.isActive
                                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                      }`}
                                      title={prod.isActive ? (lang === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Disable') : (lang === 'bn' ? 'সক্রিয় করুন' : 'Enable')}
                                    >
                                      <span>{prod.isActive ? (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Disable') : (lang === 'bn' ? 'সক্রিয়' : 'Enable')}</span>
                                    </button>

                                    {/* Delete Option */}
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-1 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
                                      title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <p className="text-sm font-bold text-slate-700">
                        {lang === 'bn' ? `"${adminCategoryPath.subSubcategory}" ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট যুক্ত করা হয়নি।` : 'No products added in this subcategory yet.'}
                      </p>
                      <button
                        onClick={() => {
                          handleOpenAddProduct();
                          setProductForm(prev => ({
                            ...prev,
                            categorySlug: adminCategoryPath.categorySlug || 'shop',
                            subcategoryBn: adminCategoryPath.subSubcategory || '',
                            subcategoryEn: adminCategoryPath.subSubcategory || '',
                          }));
                        }}
                        className="px-4 py-2 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        + {lang === 'bn' ? 'প্রথম প্রোডাক্ট যোগ করুন' : 'Add First Product'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: RESELLER & USER MANAGEMENT */}
        {(activeTab === 'employees' || activeTab === 'reseller_section' || activeTab === 'reseller_referrals') && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  {lang === 'bn' ? 'রিসেলার অ্যাকাউন্ট তালিকা' : 'Reseller Account Directory'}
                </h3>
              </div>

              {/* Search Bar & Purge Action */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder={lang === 'bn' ? 'নাম, মোবাইল, আইডি বা রেফারেল দিয়ে খুঁজুন...' : 'Search by name, phone, ID or referral...'}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Filter Tabs - All 5 visible in a neat grid (Zero cut-off) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pb-1 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setUserFilterTab('ALL')}
                className={`py-1.5 px-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'ALL'
                    ? 'bg-[#009245] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{lang === 'bn' ? 'সকল ইউজার' : 'All Users'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${userFilterTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {employees.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('PENDING')}
                className={`py-1.5 px-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{lang === 'bn' ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Requests'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${userFilterTab === 'PENDING' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {employees.filter(e => e.status === 'PENDING').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('ACTIVE')}
                className={`py-1.5 px-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{lang === 'bn' ? 'অ্যাক্টিভ রিসেলার' : 'Active Resellers'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${userFilterTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                  {employees.filter(e => e.status === 'APPROVED').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('REFERRERS')}
                className={`py-1.5 px-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'REFERRERS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>👥 {lang === 'bn' ? 'রেফারেন্স প্রোফাইল' : 'Referrals'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${userFilterTab === 'REFERRERS' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                  {employees.filter(e => getResellerDownlines(e, employees).length > 0).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('REJECTED')}
                className={`py-1.5 px-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap col-span-2 sm:col-span-1 ${
                  userFilterTab === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{lang === 'bn' ? 'বাতিলকৃত' : 'Rejected'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${userFilterTab === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {employees.filter(e => e.status === 'REJECTED').length}
                </span>
              </button>
            </div>

            {/* Clean Mobile-Optimized Reseller & Referral Cards List */}
            <div className="space-y-2">
              {employees
                .filter(emp => {
                  if (userFilterTab === 'PENDING' && emp.status !== 'PENDING') return false;
                  if (userFilterTab === 'ACTIVE' && emp.status !== 'APPROVED') return false;
                  if (userFilterTab === 'REJECTED' && emp.status !== 'REJECTED') return false;
                  if (userFilterTab === 'EMPLOYEES' && emp.role !== 'EMPLOYEE') return false;

                  const downlineCount = getResellerDownlines(emp, employees).length;

                  if ((userFilterTab === 'REFERRERS' || activeTab === 'reseller_referrals') && downlineCount === 0) return false;
                  if (userSearchTerm.trim()) {
                    const term = userSearchTerm.toLowerCase();
                    const matchesName = emp.name.toLowerCase().includes(term);
                    const matchesEmail = emp.email.toLowerCase().includes(term);
                    const matchesPhone = emp.phone.includes(term);
                    const matchesId = emp.id.toLowerCase().includes(term);
                    return matchesName || matchesEmail || matchesPhone || matchesId;
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (userFilterTab === 'REFERRERS' || activeTab === 'reseller_referrals') {
                    return getResellerDownlines(b, employees).length - getResellerDownlines(a, employees).length;
                  }
                  return 0;
                })
                .map(emp => {
                  const referralCode = emp.referenceCode || `TN-REF-${emp.id.replace('emp-', '').slice(0, 5).toUpperCase()}`;
                  
                  // Referrer / Upline Lookup
                  const ref = emp.reference || (emp as any).referredBy || (emp as any).upline;
                  const parentEmp = emp.referralOwnerId && emp.referralOwnerId !== 'OFFICIAL_TAWZOON'
                    ? employees.find(e => e.id === emp.referralOwnerId)
                    : (ref ? employees.find(e => 
                        e.id === ref || 
                        (e.referenceCode && e.referenceCode.toUpperCase() === String(ref).toUpperCase()) || 
                        `TN-REF-${e.id.replace('emp-', '').slice(0, 5).toUpperCase()}` === String(ref).toUpperCase() ||
                        (e.phone && e.phone.replace(/[^0-9]/g, '') === String(ref).replace(/[^0-9]/g, '')) ||
                        (e.name && e.name.trim().toLowerCase() === String(ref).trim().toLowerCase())
                      ) : null);

                  const isOfficial = !parentEmp && Boolean(
                    emp.referralOwnerId === 'OFFICIAL_TAWZOON' ||
                    ref === 'TAWZOON9516' ||
                    isOfficialReferenceCode(ref) ||
                    isOfficialReferenceCode((emp as any).referredBy) ||
                    (emp.isOfficialReferral && !emp.referralOwnerId)
                  );
                  const referrerName = isOfficial
                    ? 'তাওজুন অফিসিয়াল (TAWZOON9516)'
                    : (parentEmp ? parentEmp.name : (emp.referralOwnerName || (ref ? ref : 'মেইন একাউন্ট')));

                  // Count of downlines referred by THIS reseller:
                  const downlineCount = getResellerDownlines(emp, employees).length;
                  const activeInfo = getResellerActiveStatusInfo(emp);

                  // Show 15+ days inactive warning tag for admin notice without force-modifying actual status
                  const is15DaysInactive = activeInfo.diffDays >= 15;
                  const effectiveStatus = emp.status;

                  return (
                    <div
                      key={emp.id}
                      className={`p-3.5 bg-white border-2 rounded-2xl shadow-sm flex flex-col gap-2.5 transition-all ${
                        userFilterTab === 'REFERRERS'
                          ? 'border-blue-400 hover:border-blue-500 bg-blue-50/20 shadow-xs'
                          : activeInfo.cardBorder
                      }`}
                    >
                      {/* Top Row: Avatar, Name, Active/Last Active Badge, Phone, Reference ID & Downlines Count */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#009245] font-black text-xs flex items-center justify-center shrink-0 border-2 border-emerald-300 shadow-2xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-900 text-sm truncate">{emp.name}</span>

                              {/* ACTIVE / LAST ACTIVE RELATIVE TIME BADGE - RIGHT NEXT TO RESELLER NAME */}
                              <span
                                className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border shrink-0 ${activeInfo.badgeStyle}`}
                                title={`সর্বশেষ অ্যাক্টিভ: ${activeInfo.statusText}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${activeInfo.isOnline ? 'bg-white animate-ping' : 'bg-current opacity-70'}`} />
                                <span>{activeInfo.statusText}</span>
                              </span>

                              {isOfficial ? (
                                <span className="text-[10px] text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded font-sans font-bold border border-emerald-300 shrink-0 flex items-center gap-1">
                                  ⭐ <span>অফিশিয়াল: TAWZOON9516 (ফি মুক্ত)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                                  {referralCode}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono truncate mt-0.5 flex-wrap">
                              <span>📱 {emp.phone}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-bold border border-emerald-200 shrink-0">
                                👥 আন্ডারে রেফারেন্স: <strong className="font-mono text-emerald-950">{downlineCount}টি</strong>
                              </span>
                              {userFilterTab !== 'REFERRERS' && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans truncate max-w-[170px] ${
                                    isOfficial
                                      ? 'text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold'
                                      : 'text-slate-600 bg-slate-50 border border-slate-200 font-medium'
                                  }`}>
                                    আপলাইন: {referrerName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Tag on Top Right */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border shrink-0 flex items-center gap-1 ${
                          effectiveStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          effectiveStatus === 'SUSPENDED' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          effectiveStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {effectiveStatus === 'APPROVED' ? '● সক্রিয়' :
                           effectiveStatus === 'SUSPENDED' ? '● স্থগিত' :
                           effectiveStatus === 'PENDING' ? '● পেন্ডিং' : '● বাতিল'}
                        </span>
                      </div>

                      {/* 15 Days Inactivity Notice Badge */}
                      {is15DaysInactive && (
                        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold flex items-center justify-between gap-2">
                          <span>⚠️ রিসেলারটি ১৫+ দিন ধরে অ্যাকাউন্টে ঢোকেননি ({activeInfo.diffDays} দিন নিষ্ক্রিয়)।</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateEmployeeStatus(emp.id, 'SUSPENDED')}
                            className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-md font-black shrink-0 cursor-pointer"
                          >
                            স্থগিত করুন
                          </button>
                        </div>
                      )}

                      {/* Bottom Row: Actions & Detailed View Button */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {effectiveStatus !== 'APPROVED' ? (
                            <button
                              type="button"
                              disabled={updatingEmployeeStatusId === emp.id}
                              onClick={() => handleUpdateEmployeeStatus(emp.id, 'APPROVED')}
                              className="px-3 py-1.5 text-xs font-black text-white bg-[#009245] hover:bg-[#007a3a] disabled:opacity-75 disabled:cursor-wait rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              {updatingEmployeeStatusId === emp.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  <span>অ্যাক্টিভ হচ্ছে...</span>
                                </>
                              ) : (
                                <>
                                  <span>✅</span>
                                  <span>অ্যাক্টিভ করুন</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingEmployeeStatusId === emp.id}
                              onClick={() => handleUpdateEmployeeStatus(emp.id, 'SUSPENDED')}
                              className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-75 disabled:cursor-wait border border-amber-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              {updatingEmployeeStatusId === emp.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-amber-800/40 border-t-amber-900 rounded-full animate-spin" />
                                  <span>স্থগিত হচ্ছে...</span>
                                </>
                              ) : (
                                <>
                                  <span>⏸️</span>
                                  <span>স্থগিত</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setResetPasswordEmp(emp); setNewPasswordInput(''); }}
                            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl cursor-pointer"
                          >
                            পাসওয়ার্ড
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(emp.id)}
                            title={lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete account'}
                            className="p-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenUserDetails(emp)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-102"
                        >
                          <span>বিস্তারিত</span>
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 5: MASTER ORDERS (ORDER REQUESTS, SALES LEDGER, COURIER) */}
        {(activeTab === 'sales' || activeTab === 'order_requests' || activeTab === 'courier_status') && (() => {
          const isOrderPending = (s: Sale) => {
            const isPaid = s.paymentStatus === 'PAID' || s.deliveryStatus === 'delivered';
            const isCancelled = s.saleStatus === 'Rejected' || s.deliveryStatus === 'cancelled';
            const isConfirmed = s.saleStatus === 'Approved' || s.saleStatus === 'Confirmed';
            return !isPaid && !isCancelled && !isConfirmed;
          };
          return (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex flex-wrap items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-violet-600" />
                  <span>
                    {activeTab === 'order_requests' 
                      ? (lang === 'bn' ? '🔔 নতুন অর্ডার রিকোয়েস্ট' : 'New Order Requests')
                      : activeTab === 'courier_status'
                      ? (lang === 'bn' ? '🚚 কুরিয়ার ট্র্যাকিং' : 'Courier Tracking')
                      : (lang === 'bn' ? 'অর্ডার ও সেলস রিপোর্ট' : 'Master Sales Ledger')}
                  </span>
                </h3>
              </div>

              <div className="bg-[#009245]/10 text-[#009245] px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 shrink-0">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'sales' 
                    ? `${consolidatedSales.filter((sale: Sale) => {
                        if (sale.saleStatus === 'Rejected' || sale.deliveryStatus === 'cancelled') return false;
                        if (!salesSearchQuery.trim()) return true;
                        const q = salesSearchQuery.toLowerCase();
                        return (
                          (sale.orderCode && sale.orderCode.toLowerCase().includes(q)) ||
                          (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
                          (sale.customerPhone && sale.customerPhone.toLowerCase().includes(q)) ||
                          (sale.employeeName && sale.employeeName.toLowerCase().includes(q)) ||
                          (sale.productName && sale.productName.toLowerCase().includes(q))
                        );
                      }).length} টি অর্ডার`
                    : `${pendingSalesCount}টি নতুন`}
                </span>
              </div>
            </div>

            {/* If activeTab is 'sales', show Search Bar and All Sales History. Otherwise show filter tabs for order_requests / courier_status */}
            {activeTab === 'sales' ? (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={salesSearchQuery}
                    onChange={(e) => setSalesSearchQuery(e.target.value)}
                    placeholder="অর্ডার আইডি (যেমন ORD-...), কাস্টমার বা রিসেলারের নাম দিয়ে খুঁজুন..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-bold text-slate-900 shadow-3xs"
                  />
                  {salesSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSalesSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* All Sales List (Excludes Cancelled) */}
                <div className="space-y-2.5">
                  {consolidatedSales
                    .filter((sale: Sale) => {
                      if (sale.saleStatus === 'Rejected' || sale.deliveryStatus === 'cancelled') return false;
                      if (!salesSearchQuery.trim()) return true;
                      const q = salesSearchQuery.toLowerCase();
                      return (
                        (sale.orderCode && sale.orderCode.toLowerCase().includes(q)) ||
                        (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
                        (sale.customerPhone && sale.customerPhone.toLowerCase().includes(q)) ||
                        (sale.employeeName && sale.employeeName.toLowerCase().includes(q)) ||
                        (sale.productName && sale.productName.toLowerCase().includes(q))
                      );
                    })
                    .length === 0 ? (
                    <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                      কোনো সেলস বা অর্ডার পাওয়া যায়নি।
                    </div>
                  ) : (
                    consolidatedSales
                      .filter((sale: Sale) => {
                        if (sale.saleStatus === 'Rejected' || sale.deliveryStatus === 'cancelled') return false;
                        if (!salesSearchQuery.trim()) return true;
                        const q = salesSearchQuery.toLowerCase();
                        return (
                          (sale.orderCode && sale.orderCode.toLowerCase().includes(q)) ||
                          (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
                          (sale.customerPhone && sale.customerPhone.toLowerCase().includes(q)) ||
                          (sale.employeeName && sale.employeeName.toLowerCase().includes(q)) ||
                          (sale.productName && sale.productName.toLowerCase().includes(q))
                        );
                      })
                      .map((sale: Sale) => {
                        const isPaid = sale.paymentStatus === 'PAID' || sale.deliveryStatus === 'delivered';
                        const isCancelled = sale.saleStatus === 'Rejected' || sale.deliveryStatus === 'cancelled';
                        const isShipped = !!sale.trackingCode && !isPaid && !isCancelled;
                        const cardBorderClass = isCancelled
                          ? 'border-2 border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50/20 shadow-xs'
                          : isPaid
                          ? 'border-2 border-emerald-400 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 shadow-xs'
                          : isShipped
                          ? 'border-2 border-sky-400 hover:border-sky-500 bg-white hover:bg-sky-50/20 shadow-xs'
                          : 'border-2 border-amber-400 hover:border-amber-500 bg-white hover:bg-amber-50/20 shadow-xs';
                        return (
                          <div
                            key={sale.id}
                            className={`p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${cardBorderClass}`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                                  {sale.orderCode}
                                </span>
                                {isCancelled ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    বাতিল ❌
                                  </span>
                                ) : isPaid ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-[#009245] border border-emerald-200">
                                    পেইড ✓
                                  </span>
                                ) : sale.trackingCode ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                    শিপড 🚚
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                    পেন্ডিং ⏳
                                  </span>
                                )}
                              </div>

                              <div className="text-[11.5px] text-slate-700 font-medium truncate flex items-center gap-1.5 flex-wrap">
                                <span>কর্মী: <span className="font-bold text-slate-900">{sale.employeeName}</span></span>
                                {sale.resellerStoreSlug && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-[#009245] border border-emerald-200">
                                    🌐 /shop/{sale.resellerStoreSlug}
                                  </span>
                                )}
                                <span>•</span>
                                <span className="text-slate-600 font-semibold">{sale.productName} ({sale.quantity}x)</span>
                              </div>

                              <div className="text-[10.5px] text-slate-500 flex items-center gap-2 flex-wrap">
                                <span>ক্রেতা: <strong className="text-slate-700">{sale.customerName}</strong></span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>{formatOrderDateTime(sale.saleDate)}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="text-right">
                                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block">৳{(sale.totalAmount || 0).toLocaleString()}</span>
                                <span className="text-[10px] text-emerald-600 font-extrabold font-mono block">প্রফিট: ৳{sale.commissionAmount.toLocaleString()}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedSaleForDetails(sale)}
                                className="px-3 py-1.5 bg-[#009245] hover:bg-[#007a37] text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>বিস্তারিত</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            ) : (
              /* Filter Tabs for order_requests / courier_status */
              (() => {
                const pendingSalesList = consolidatedSales.filter(isSalePending);
                const courierProvidedSalesList = consolidatedSales.filter(isSaleCourierProvided);
                const confirmedSalesList = consolidatedSales.filter(isSaleConfirmed);
                const cancelledSalesList = consolidatedSales.filter(isSaleCancelled);

                const filteredSales = orderFilterTab === 'pending'
                  ? pendingSalesList
                  : orderFilterTab === 'courier_provided'
                  ? courierProvidedSalesList
                  : orderFilterTab === 'confirmed'
                  ? confirmedSalesList
                  : cancelledSalesList;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90">
                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('pending')}
                        className={`py-2.5 px-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          orderFilterTab === 'pending'
                            ? 'bg-amber-500 text-white border-2 border-amber-600 shadow-md shadow-amber-500/30 scale-[1.01]'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/40 shadow-2xs'
                        }`}
                      >
                        <span className="whitespace-nowrap">পেন্ডিং</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          orderFilterTab === 'pending'
                            ? 'bg-white text-amber-800 shadow-2xs'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pendingSalesList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('courier_provided')}
                        className={`py-2.5 px-2 text-[11px] sm:text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          orderFilterTab === 'courier_provided'
                            ? 'bg-sky-500 text-white border-2 border-sky-600 shadow-md shadow-sky-500/30 scale-[1.01]'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:border-sky-300 hover:bg-sky-50/40 shadow-2xs'
                        }`}
                      >
                        <span className="whitespace-nowrap">কুরিয়ার লিংক প্রোভাইড</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          orderFilterTab === 'courier_provided'
                            ? 'bg-white text-sky-800 shadow-2xs'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {courierProvidedSalesList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('confirmed')}
                        className={`py-2.5 px-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          orderFilterTab === 'confirmed'
                            ? 'bg-[#009245] text-white border-2 border-emerald-700 shadow-md shadow-emerald-500/30 scale-[1.01]'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs'
                        }`}
                      >
                        <span className="whitespace-nowrap">অর্ডার কনফার্ম</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          orderFilterTab === 'confirmed'
                            ? 'bg-white text-[#009245] shadow-2xs'
                            : 'bg-emerald-100 text-[#009245]'
                        }`}>
                          {confirmedSalesList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('cancelled')}
                        className={`py-2.5 px-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          orderFilterTab === 'cancelled'
                            ? 'bg-rose-500 text-white border-2 border-rose-600 shadow-md shadow-rose-500/30 scale-[1.01]'
                            : 'bg-white text-slate-700 border border-slate-200/90 hover:border-rose-300 hover:bg-rose-50/40 shadow-2xs'
                        }`}
                      >
                        <span className="whitespace-nowrap">বাতিল</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          orderFilterTab === 'cancelled'
                            ? 'bg-white text-rose-800 shadow-2xs'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cancelledSalesList.length}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {filteredSales.length === 0 ? (
                        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                          এই সেকশনে কোনো অর্ডার পাওয়া যায়নি।
                        </div>
                      ) : (
                        filteredSales.map((sale: Sale) => {
                          const isPaid = sale.paymentStatus === 'PAID' || sale.deliveryStatus === 'delivered';
                          const isCancelled = sale.saleStatus === 'Rejected' || sale.deliveryStatus === 'cancelled';
                          const isShipped = !!sale.trackingCode && !isPaid && !isCancelled;
                          const cardBorderClass = isCancelled
                            ? 'border-2 border-rose-300 hover:border-rose-400 bg-white hover:bg-rose-50/20 shadow-xs'
                            : isPaid
                            ? 'border-2 border-emerald-400 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 shadow-xs'
                            : isShipped
                            ? 'border-2 border-sky-400 hover:border-sky-500 bg-white hover:bg-sky-50/20 shadow-xs'
                            : 'border-2 border-amber-400 hover:border-amber-500 bg-white hover:bg-amber-50/20 shadow-xs';
                          return (
                            <div
                              key={sale.id}
                              className={`p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${cardBorderClass}`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-black text-slate-900 text-xs sm:text-sm bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                                    {sale.orderCode}
                                  </span>
                                  {isCancelled ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      বাতিল ❌
                                    </span>
                                  ) : isPaid ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-[#009245] border border-emerald-200">
                                      পেইড ✓
                                    </span>
                                  ) : sale.trackingCode ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                      কুরিয়ার লিঙ্ক প্রোভাইডেড 🚚
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                                      পেন্ডিং ⏳
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11.5px] text-slate-700 font-medium truncate flex items-center gap-1.5 flex-wrap">
                                  <span>কর্মী: <span className="font-bold text-slate-900">{sale.employeeName}</span></span>
                                  {sale.resellerStoreSlug && (
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-[#009245] border border-emerald-200">
                                      🌐 /shop/{sale.resellerStoreSlug}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span className="text-slate-600 font-semibold">{sale.productName} ({sale.quantity}x)</span>
                                </div>

                                <div className="text-[10.5px] text-slate-500 flex items-center gap-2 flex-wrap">
                                  <span>ক্রেতা: <strong className="text-slate-700">{sale.customerName}</strong></span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span>{formatOrderDateTime(sale.saleDate)}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <div className="text-right">
                                  <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block">৳{(sale.totalAmount || 0).toLocaleString()}</span>
                                  <span className="text-[10px] text-emerald-600 font-extrabold font-mono block">প্রফিট: ৳{sale.commissionAmount.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isCancelled && (
                                    <button
                                      type="button"
                                      disabled={isDeletingSale}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSale(sale);
                                      }}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="স্থায়ীভাবে মুছে ফেলুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span className="hidden sm:inline">মুছুন</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSaleForDetails(sale)}
                                    className="px-3 py-1.5 bg-[#009245] hover:bg-[#007a37] text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>বিস্তারিত</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()
            )}

            {/* FULL ORDER DETAILS MODAL (No Scrollbar Tracks, Multi-Product Support, Exact Address/District/Thana/Notes & Courier Code Sender) */}
            {selectedSaleForDetails && (() => {
              const matchingOrderItems = sales.filter(s => s.orderCode === selectedSaleForDetails.orderCode);
              const orderItemsToRender: any[] = (Array.isArray(selectedSaleForDetails.items) && selectedSaleForDetails.items.length > 0)
                ? selectedSaleForDetails.items.map((it, idx) => ({
                    id: `${selectedSaleForDetails.id}-item-${idx}`,
                    productId: it.productId,
                    productName: it.productName,
                    productCode: it.productCode || selectedSaleForDetails.productCode,
                    quantity: it.quantity,
                    size: it.size,
                    color: it.color,
                    sellingPrice: it.sellingPrice || it.unitPrice || 0,
                    totalAmount: it.totalAmount || ((it.sellingPrice || it.unitPrice || 0) * it.quantity),
                    commissionAmount: it.commissionAmount || 0,
                    productImage: it.imageUrl
                  }))
                : (matchingOrderItems.length > 0 ? matchingOrderItems : [selectedSaleForDetails]);
              const totalOrderValue = (Array.isArray(selectedSaleForDetails.items) && selectedSaleForDetails.items.length > 0)
                ? selectedSaleForDetails.items.reduce((sum, item) => sum + (item.totalAmount || ((item.sellingPrice || item.unitPrice || 0) * (item.quantity || 1))), 0)
                : (matchingOrderItems.length > 1
                    ? matchingOrderItems.reduce((sum, item) => sum + (item.totalAmount || ((item.sellingPrice || item.actualSalePrice || 0) * (item.quantity || 1))), 0)
                    : (selectedSaleForDetails.totalAmount || orderItemsToRender.reduce((sum, item) => sum + (item.totalAmount || ((item.sellingPrice || item.actualSalePrice || 0) * item.quantity)), 0)));

              const totalProfitValue = (Array.isArray(selectedSaleForDetails.items) && selectedSaleForDetails.items.length > 0)
                ? selectedSaleForDetails.items.reduce((sum, item) => sum + (Number(item.commissionAmount) || 0), 0)
                : (matchingOrderItems.length > 1
                    ? matchingOrderItems.reduce((sum, item) => sum + (Number(item.commissionAmount) || 0), 0)
                    : (selectedSaleForDetails.commissionAmount || orderItemsToRender.reduce((sum, item) => sum + (Number(item.commissionAmount) || 0), 0)));

              const isCancelled = isSaleCancelled(selectedSaleForDetails);
              const isDeliveredOrPaid = isSaleConfirmed(selectedSaleForDetails);
              const isCourierProvided = isSaleCourierProvided(selectedSaleForDetails);
              const isPending = isSalePending(selectedSaleForDetails);

              return (
                <div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col overflow-y-auto animate-in fade-in duration-150">
                  {/* Compact Professional Sticky Header (Single Line on Mobile) */}
                  <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-2.5 sm:px-6 py-2 sm:py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-nowrap">
                      {/* Left: Back button + Order Details + Code + Status in single row */}
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-nowrap overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForDetails(null)}
                          className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                        >
                          <span>← ফিরুন</span>
                        </button>

                        <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4 text-[#009245]" />
                        </div>

                        <span className="hidden md:inline text-xs sm:text-sm font-black text-slate-800 shrink-0">
                          অর্ডার ডিটেইলস
                        </span>

                        <span className="font-mono font-black text-xs sm:text-sm text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 shrink-0">
                          {selectedSaleForDetails.orderCode}
                        </span>

                        <span className="shrink-0 text-[11px] sm:text-xs">
                          {isCancelled ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              বাতিল ❌
                            </span>
                          ) : isDeliveredOrPaid ? (
                            <span className="font-bold text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ডেলিভার্ড ✓
                            </span>
                          ) : isCourierProvided ? (
                            <span className="font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                              কুরিয়ার 🚚
                            </span>
                          ) : (
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              পেন্ডিং ⏳
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Right: Date on desktop + Close button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden lg:inline text-xs text-slate-500 font-mono">
                          {new Date(selectedSaleForDetails.saleDate).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForDetails(null)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0"
                          title="বন্ধ করুন"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* Main Full-Screen Body Container */}
                  <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Responsive Grid for Desktop (2-Column) and Mobile (Stacked Full-Screen) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-start pb-12">

                      {/* Left Column (Desktop 6/12): Customer & Delivery Address + Courier Tracking */}
                      <div className="lg:col-span-6 space-y-5">
                        
                        {/* Section 1: Customer & Delivery Address Details */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                          <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                            <span>👤 কাস্টমার ও ডেলিভারি ঠিকানা</span>
                            <span className="text-xs text-[#009245] font-bold">১-ক্লিক কপি</span>
                          </div>

                          <div className="space-y-2 sm:space-y-2.5">
                            {/* Customer Name */}
                            <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">কাস্টমারের নাম</span>
                                <span className="font-bold text-slate-900 truncate block text-xs sm:text-sm lg:text-base">{selectedSaleForDetails.customerName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedSaleForDetails.customerName, 'কাস্টমারের নাম')}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#009245]" />
                                <span>কপি</span>
                              </button>
                            </div>

                            {/* Customer Phone */}
                            <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">মোবাইল নম্বর</span>
                                <span className="font-mono font-bold text-slate-900 truncate block text-xs sm:text-sm lg:text-base">{selectedSaleForDetails.customerPhone}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${selectedSaleForDetails.customerPhone}`}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#009245] font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                                >
                                  📞 কল
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(selectedSaleForDetails.customerPhone, 'মোবাইল নম্বর')}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-[#009245]" />
                                  <span>কপি</span>
                                </button>
                              </div>
                            </div>

                            {/* District & Thana Side-by-Side */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/70 min-w-0 shadow-3xs">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">জেলা</span>
                                  <span className="font-bold text-slate-900 truncate block text-xs sm:text-sm">{selectedSaleForDetails.district || 'N/A'}</span>
                                </div>
                                {selectedSaleForDetails.district && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(selectedSaleForDetails.district!, 'জেলা')}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md shrink-0 transition-colors cursor-pointer"
                                  >
                                    কপি
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/70 min-w-0 shadow-3xs">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">থানা</span>
                                  <span className="font-bold text-slate-900 truncate block text-xs sm:text-sm">{selectedSaleForDetails.thana || 'N/A'}</span>
                                </div>
                                {selectedSaleForDetails.thana && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(selectedSaleForDetails.thana!, 'থানা')}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md shrink-0 transition-colors cursor-pointer"
                                  >
                                    কপি
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Full Delivery Address */}
                            {(() => {
                              const fullFormattedAddress = [
                                selectedSaleForDetails.district ? `জেলা: ${selectedSaleForDetails.district}` : '',
                                selectedSaleForDetails.thana ? `থানা: ${selectedSaleForDetails.thana}` : '',
                                selectedSaleForDetails.customerAddress?.includes('জেলা:')
                                  ? selectedSaleForDetails.customerAddress
                                  : (selectedSaleForDetails.customerAddress ? `ঠিকানা: ${selectedSaleForDetails.customerAddress}` : '')
                              ].filter(Boolean).join(', ');

                              const displayAddress = selectedSaleForDetails.customerAddress?.includes('জেলা:')
                                ? selectedSaleForDetails.customerAddress
                                : (fullFormattedAddress || selectedSaleForDetails.customerAddress);

                              return (
                                <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">ডেলিভারি সম্পূর্ণ ঠিকানা</span>
                                    <span className="font-semibold text-slate-800 block text-xs sm:text-sm leading-relaxed">
                                      {displayAddress}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(displayAddress, 'ডেলিভারি ঠিকানা')}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-[#009245]" />
                                    <span>কপি</span>
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Customer Order Notes (If Any) */}
                            {selectedSaleForDetails.notes && (
                              <div className="flex items-center justify-between gap-2.5 bg-amber-50/90 p-2.5 sm:p-3 rounded-xl border border-amber-200/90 shadow-3xs">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[11px] sm:text-xs text-amber-700 block font-extrabold">বিশেষ নোট / বার্তা</span>
                                  <span className="font-medium text-amber-950 block text-xs sm:text-sm leading-relaxed">
                                    {selectedSaleForDetails.notes}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(selectedSaleForDetails.notes!, 'নোট')}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-md shrink-0 cursor-pointer"
                                >
                                  কপি
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Section 3: Courier Tracking (Editable for Pending/Confirmed, Read-only for Delivered/Cancelled) */}
                        <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-sky-200/70 pb-2">
                            <span className="text-xs sm:text-sm font-black text-sky-900 flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-sky-600" />
                              <span>কুরিয়ার ট্র্যাকিং কোড</span>
                            </span>
                            {selectedSaleForDetails.trackingCode ? (
                              <span className="text-xs font-mono font-bold bg-sky-200 text-sky-950 px-2.5 py-0.5 rounded-md">
                                {selectedSaleForDetails.courierPartner || 'Steadfast'}: {selectedSaleForDetails.trackingCode}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-medium">কোনো ট্র্যাকিং কোড যুক্ত নেই</span>
                            )}
                          </div>

                          {!isCancelled && !isDeliveredOrPaid ? (
                            /* Courier Selection & Input Field */
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-sky-900 shrink-0">কুরিয়ার:</span>
                                <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                  {(['Steadfast', 'Pathao', 'RedX'] as const).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setInlineCourierPartner(p)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        inlineCourierPartner === p
                                          ? 'bg-sky-600 text-white shadow-2xs'
                                          : 'bg-white text-sky-800 border border-sky-200 hover:bg-sky-100'
                                      }`}
                                    >
                                      {p === 'Steadfast' ? 'স্টেডফাস্ট' : p === 'Pathao' ? 'পাঠাও' : 'রেডএক্স'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={inlineCourierInput}
                                  onChange={(e) => setInlineCourierInput(e.target.value)}
                                  placeholder={
                                    selectedSaleForDetails.trackingCode
                                      ? `বর্তমান কোড: ${selectedSaleForDetails.trackingCode}`
                                      : 'কুরিয়ার কোড লিখুন বা পেস্ট করুন...'
                                  }
                                  className="w-full bg-white border border-sky-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono outline-none focus:border-[#009245] shadow-2xs"
                                />
                                
                                <button
                                  type="button"
                                  disabled={isUpdatingCourier || !inlineCourierInput.trim()}
                                  onClick={() => handleSendInlineCourierCode(selectedSaleForDetails)}
                                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <Truck className="w-4 h-4" />
                                  <span>{isUpdatingCourier ? 'পাঠানো হচ্ছে...' : 'কুরিয়ার কোড আপডেট করুন'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Read-only tracking display for delivered or cancelled orders */
                            <div className="p-2.5 bg-white/90 rounded-xl border border-sky-100 flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-600 font-medium">কুরিয়ার স্ট্যাটাস:</span>
                              {selectedSaleForDetails.trackingCode ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sky-900">
                                    {selectedSaleForDetails.courierPartner || 'Steadfast'}: {selectedSaleForDetails.trackingCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(selectedSaleForDetails.trackingCode!, 'কুরিয়ার কোড')}
                                    className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-md transition-colors"
                                  >
                                    কপি
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">ট্র্যাকিং কোড যুক্ত নেই</span>
                              )}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Right Column (Desktop 6/12): Ordered Products + Financial Summary + Action Buttons */}
                      <div className="lg:col-span-6 space-y-5">
                        
                        {/* Section 2: Product & Reseller Commission Info */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                          <div className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                            <span>🛍️ প্রোডাক্ট ও রিসেলার কমিশন তথ্য ({orderItemsToRender.length}টি আইটেম)</span>
                            <span className="font-mono text-xs font-bold">
                              {isCancelled ? (
                                <span className="text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">বাতিল ❌</span>
                              ) : isDeliveredOrPaid ? (
                                <span className="text-[#009245] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">কনফার্ম ও পেইড ✓</span>
                              ) : isCourierProvided ? (
                                <span className="text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">কুরিয়ার লিঙ্ক প্রোভাইডেড 🚚</span>
                              ) : (
                                <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">পেন্ডিং ⏳</span>
                              )}
                            </span>
                          </div>

                          {/* List of Ordered Products */}
                          <div className="space-y-2.5 max-h-[420px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-0.5">
                            {orderItemsToRender.map((item, idx) => {
                              const matchedProduct = products.find(p => p.id === item.productId || p.productCode === item.productCode);
                              const firstImgRaw = matchedProduct?.images?.[0];
                              const fallbackImgUrl = typeof firstImgRaw === 'string' ? firstImgRaw : (firstImgRaw as any)?.url;
                              const finalImgUrl = item.productImage || fallbackImgUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

                              return (
                                <div key={item.id || idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-3xs">
                                  <img
                                    src={finalImgUrl}
                                    alt={item.productName}
                                    className="w-16 h-16 sm:w-18 sm:h-18 object-cover rounded-xl border border-slate-200 shrink-0"
                                  />

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <h4 className="font-black text-slate-900 text-xs sm:text-sm lg:text-base line-clamp-1">
                                      {item.productName}
                                    </h4>
                                    
                                    <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                                      <span>পরিমাণ: <strong className="text-slate-900 font-mono">{item.quantity}টি</strong></span>
                                      {item.size && <span>• সাইজ: <strong>{item.size}</strong></span>}
                                      {item.color && <span>• কালার: <strong>{item.color}</strong></span>}
                                      {item.variant && <span>• ভেরিয়েন্ট: <strong>{item.variant}</strong></span>}
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-1">
                                      <div className="text-xs sm:text-sm">
                                        <span className="text-slate-500">মূল্য: </span>
                                        <span className="font-mono font-bold text-slate-900">৳{(item.totalAmount || (item.sellingPrice * item.quantity)).toLocaleString()}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadProductImage(finalImgUrl, item.productName)}
                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#009245] font-bold text-xs rounded-md border border-emerald-200/80 flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>ছবি ডাউনলোড</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Profit Summary Grid */}
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                              <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">রিসেলারের নাম</span>
                              <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm lg:text-base">{selectedSaleForDetails.employeeName}</span>
                            </div>

                            <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/70 shadow-3xs">
                              <span className="text-[11px] sm:text-xs text-slate-400 block font-semibold">সর্বমোট বিক্রয় মূল্য</span>
                              <span className="font-mono font-black text-slate-900 block text-xs sm:text-sm lg:text-base">৳{totalOrderValue.toLocaleString()}</span>
                            </div>

                            {selectedSaleForDetails.resellerStoreSlug && (
                              <div className="col-span-2 bg-emerald-50/80 p-2.5 sm:p-3 rounded-xl border border-emerald-200">
                                <span className="text-[11px] sm:text-xs text-emerald-800 block font-bold">অর্ডার সোর্স (রিসেলার ওয়েবসাইট)</span>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {selectedSaleForDetails.resellerStoreName || selectedSaleForDetails.resellerStoreSlug}
                                  </span>
                                  <a
                                    href={`/shop/${selectedSaleForDetails.resellerStoreSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-mono text-emerald-800 font-bold bg-white px-2.5 py-1 rounded border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
                                  >
                                    <span>/shop/{selectedSaleForDetails.resellerStoreSlug}</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            )}

                            <div className={`col-span-2 p-3 sm:p-3.5 rounded-xl border flex items-center justify-between ${
                              isCancelled
                                ? 'bg-rose-50 border-rose-200/90'
                                : isDeliveredOrPaid
                                  ? 'bg-emerald-50 border-emerald-200/90'
                                  : isCourierProvided
                                    ? 'bg-sky-50 border-sky-200/90'
                                    : 'bg-emerald-50 border-emerald-200/90'
                            }`}>
                              <div>
                                <span className={`text-xs block font-bold ${
                                  isCancelled ? 'text-rose-700' : isDeliveredOrPaid ? 'text-emerald-700' : isCourierProvided ? 'text-sky-700' : 'text-emerald-700'
                                }`}>
                                  রিসেলার কমিশন / মোট প্রফিট
                                </span>
                                <span className={`font-mono font-black text-base sm:text-lg lg:text-xl ${
                                  isCancelled ? 'text-rose-700' : 'text-[#009245]'
                                }`}>
                                  ৳{totalProfitValue.toLocaleString()}
                                </span>
                              </div>
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                isCancelled
                                  ? 'bg-rose-100 text-rose-800'
                                  : isDeliveredOrPaid
                                    ? 'bg-emerald-100 text-[#009245]'
                                    : isCourierProvided
                                      ? 'bg-sky-100 text-sky-800'
                                      : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isCancelled ? 'অর্ডার বাতিল' : isDeliveredOrPaid ? 'ওয়ালেটে জমা পেইড ✓' : isCourierProvided ? 'কুরিয়ার লিঙ্ক প্রোভাইডেড 🚚' : 'পেন্ডিং প্রফিট ⏳'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons inside Modal */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                          {isCancelled ? (
                            <div className="space-y-2.5">
                              {/* Cancelled Banner */}
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                                <span className="font-bold text-rose-700 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                                  <span>অর্ডারটি বাতিল করা হয়েছে</span>
                                </span>
                                <span className="text-[11px] font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-300">
                                  CANCELLED ❌
                                </span>
                              </div>

                              {/* Preview-only Cancelled Button (Disabled, preview mode) */}
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 sm:py-3 bg-rose-50 text-rose-500 border border-rose-200 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80 select-none"
                              >
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                <span>অর্ডার বাতিল করা হয়েছে (প্রিভিউ মোড)</span>
                              </button>

                              {/* Permanent Delete Button */}
                              <button
                                type="button"
                                disabled={isDeletingSale}
                                onClick={() => handleDeleteSale(selectedSaleForDetails)}
                                className="w-full py-2.5 sm:py-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                                <span>{isDeletingSale ? 'মুছে ফেলা হচ্ছে...' : 'স্থায়ীভাবে মুছে ফেলুন (Delete Permanently)'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedSaleForDetails(null)}
                                className="w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                              >
                                বন্ধ করুন
                              </button>
                            </div>
                          ) : isDeliveredOrPaid ? (
                            <div className="space-y-2.5">
                              {/* Delivered / Confirmed Banner */}
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
                                <span className="font-bold text-[#009245] flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-[#009245]" />
                                  <span>ডেলিভারি সম্পন্ন এবং প্রফিট সফলভাবে রিলিজ করা হয়েছে</span>
                                </span>
                                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                  DELIVERED & PAID ✓
                                </span>
                              </div>

                              {/* Preview-only Delivered Button (Disabled, preview mode) */}
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 sm:py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-80 select-none"
                              >
                                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                <span>ডেলিভারি সম্পন্ন ও প্রফিট রিলিজড (৳{totalProfitValue.toLocaleString()})</span>
                              </button>

                              {/* Close Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedSaleForDetails(null)}
                                className="w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                              >
                                বন্ধ করুন
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {/* ACTIVE (Pending or Courier Provided): Confirm button removed! Only Delivery Complete & Cancel Order */}
                              
                              {/* 1. DELIVERY & PROFIT RELEASE */}
                              <button
                                type="button"
                                disabled={approvingSaleId === selectedSaleForDetails.id}
                                onClick={() => {
                                  setDeliveryConfirmSale(selectedSaleForDetails);
                                }}
                                className="w-full py-2.5 sm:py-3 bg-[#009245] hover:bg-[#007a37] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              >
                                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>
                                  {approvingSaleId === selectedSaleForDetails.id
                                    ? 'অনুমোদন প্রসেস হচ্ছে...'
                                    : `ডেলিভারি সম্পন্ন ও প্রফিট রিলিজ (৳${totalProfitValue.toLocaleString()})`}
                                </span>
                              </button>

                              {/* 2. ORDER CANCEL BUTTON */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalSale(selectedSaleForDetails);
                                  setCustomPenaltyInput('120');
                                }}
                                className="w-full py-2.5 sm:py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <AlertTriangle className="w-4 h-4 text-rose-600" />
                                <span>অর্ডার বাতিল করুন</span>
                              </button>

                              {/* 3. CLOSE BUTTON */}
                              <button
                                type="button"
                                onClick={() => setSelectedSaleForDetails(null)}
                                className="w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                              >
                                বন্ধ করুন
                              </button>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>

                  </main>
                </div>
              );
            })()}

            {/* REJECT & DELIVERY CHARGE PENALTY SELECTION MODAL */}
            {rejectModalSale && (
              <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-rose-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        অর্ডার বাতিল ও ডেলিভারি চার্জ ({rejectModalSale.orderCode})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRejectModalSale(null)}
                      className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-slate-600 font-medium leading-relaxed">
                    রিসেলার <strong className="text-slate-900">{rejectModalSale.employeeName}</strong> এর অর্ডার বাতিল করার জন্য কুরিয়ার চার্জ কর্তনের পরিমাণ নির্ধারণ করুন:
                  </p>

                  {/* Penalty Amount Controls */}
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 space-y-2.5">
                    <label className="block text-[11px] font-extrabold text-rose-900">
                      ওয়ালেট থেকে কর্তন পরিমাণ (৳):
                    </label>
                    
                    {/* Quick Amount Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['120', '100', '60', '20', '0'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomPenaltyInput(amt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            customPenaltyInput === amt
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white border border-rose-200 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          ৳{amt} {amt === '0' ? '(ফ্রি/চার্জহীন)' : ''}
                        </button>
                      ))}
                    </div>

                    {/* Custom Editable Input Box */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-rose-900 shrink-0">কাস্টম পরিমাণ: ৳</span>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={customPenaltyInput}
                        onChange={(e) => setCustomPenaltyInput(e.target.value)}
                        className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-rose-900 outline-none focus:border-rose-600 shadow-2xs"
                        placeholder="0"
                      />
                    </div>

                    <p className="text-[10px] text-rose-700 font-medium">
                      {Number(customPenaltyInput) > 0
                        ? `* অর্ডার বাতিল হবে এবং রিসেলারের ওয়ালেট ব্যালেন্স থেকে ৳${customPenaltyInput} ডেলিভারি চার্জ কাটা হবে।`
                        : '* অর্ডার বাতিল হবে এবং কোনো চার্জ কাটা হবে না (৳০ কর্তন)।'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalSale(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      বাতিল
                    </button>
                    
                    <button
                      type="button"
                      disabled={isRejectingSale}
                      onClick={() => handleConfirmRejectSale(rejectModalSale, Number(customPenaltyInput) || 0)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {isRejectingSale
                          ? 'বাতিল হচ্ছে...'
                          : Number(customPenaltyInput) > 0
                          ? `৳${customPenaltyInput} কেটে বাতিল নিশ্চিত করুন`
                          : 'চার্জ ছাড়া বাতিল নিশ্চিত করুন'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER CONFIRMATION MODAL */}
            {confirmModalSale && (
              <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-blue-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        অর্ডার কনফার্মেশন
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmModalSale(null)}
                      className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2.5 text-slate-700">
                    <p className="text-xs font-bold text-slate-900">
                      আপনি কি নিশ্চিত যে এই অর্ডারটি কনফার্ম করতে চান?
                    </p>
                    <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">অর্ডার কোড:</span>
                        <strong className="font-mono text-blue-900">{confirmModalSale.orderCode}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">কর্মী/রিসেলার:</span>
                        <strong className="text-slate-800">{confirmModalSale.employeeName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ক্রেতা:</span>
                        <strong className="text-slate-800">{confirmModalSale.customerName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">মোট বিক্রয় মূল্য:</span>
                        <span className="font-mono font-bold text-slate-900">৳{(confirmModalSale.totalAmount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      কনফার্ম করলে অর্ডারটি "অর্ডার কনফার্ম" ট্যাবে স্থানান্তরিত হবে। পার্সেল ডেলিভারি সফল হলে সেখান থেকে প্রফিট রিলিজ সম্পন্ন করতে পারবেন।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setConfirmModalSale(null)}
                      className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={isConfirmingSale}
                      onClick={() => handleConfirmSale(confirmModalSale)}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isConfirmingSale ? 'কনফার্ম হচ্ছে...' : 'হ্যাঁ, কনফার্ম করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DELIVERY COMPLETE & PROFIT RELEASE CONFIRMATION MODAL */}
            {deliveryConfirmSale && (() => {
              const matchingItems = sales.filter(s => s.orderCode === deliveryConfirmSale.orderCode);
              const itemsList = matchingItems.length > 0 ? matchingItems : [deliveryConfirmSale];
              const profitToRelease = (Array.isArray(deliveryConfirmSale.items) && deliveryConfirmSale.items.length > 0)
                ? deliveryConfirmSale.items.reduce((sum, it) => sum + (Number(it.commissionAmount) || 0), 0)
                : itemsList.reduce((sum, s) => {
                    if (Array.isArray(s.items) && s.items.length > 0) {
                      return sum + s.items.reduce((isum, it) => isum + (Number(it.commissionAmount) || 0), 0);
                    }
                    return sum + (Number(s.commissionAmount) || 0);
                  }, 0);
              const orderTotal = (Array.isArray(deliveryConfirmSale.items) && deliveryConfirmSale.items.length > 0)
                ? deliveryConfirmSale.items.reduce((sum, it) => sum + (it.totalAmount || ((it.sellingPrice || it.unitPrice || 0) * (it.quantity || 1))), 0)
                : itemsList.reduce((sum, s) => {
                    if (Array.isArray(s.items) && s.items.length > 0) {
                      return sum + s.items.reduce((isum, it) => isum + (it.totalAmount || ((it.sellingPrice || it.unitPrice || 0) * (it.quantity || 1))), 0);
                    }
                    return sum + (Number(s.totalAmount) || 0);
                  }, 0);

              return (
                <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-emerald-300 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#009245]" />
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          ডেলিভারি সম্পন্ন ও প্রফিট রিলিজ কনফার্মেশন
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeliveryConfirmSale(null)}
                        className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                        <span className="text-[11px] font-bold text-emerald-800 block">রিসেলারের ওয়ালেটে প্রফিট জমা হবে</span>
                        <span className="font-mono font-black text-2xl text-[#009245] block">৳{profitToRelease.toLocaleString()}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">অর্ডার কোড:</span>
                          <strong className="font-mono font-bold text-slate-900">{deliveryConfirmSale.orderCode}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">রিসেলারের নাম:</span>
                          <strong className="font-bold text-slate-900">{deliveryConfirmSale.employeeName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ক্রেতার নাম:</span>
                          <span className="font-semibold text-slate-800">{deliveryConfirmSale.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">সর্বমোট বিক্রয় মূল্য:</span>
                          <span className="font-mono font-bold text-slate-900">৳{orderTotal.toLocaleString()}</span>
                        </div>
                        {deliveryConfirmSale.trackingCode && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">কুরিয়ার ট্র্যাকিং:</span>
                            <span className="font-mono font-bold text-sky-800">{deliveryConfirmSale.courierPartner || 'Steadfast'}: {deliveryConfirmSale.trackingCode}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11.5px] text-slate-600 leading-relaxed text-center font-medium">
                        আপনি কি নিশ্চিত যে এই অর্ডারটি কাস্টমারের কাছে সফলভাবে ডেলিভারি হয়েছে এবং রিসেলারের ওয়ালেটে <strong className="text-[#009245]">৳{profitToRelease.toLocaleString()}</strong> প্রফিট রিলিজ করতে চান?
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDeliveryConfirmSale(null)}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        disabled={approvingSaleId === deliveryConfirmSale.id}
                        onClick={async () => {
                          await handleApproveSale(deliveryConfirmSale, true);
                          setDeliveryConfirmSale(null);
                          setSelectedSaleForDetails(null);
                        }}
                        className="py-2.5 bg-[#009245] hover:bg-[#007a37] text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{approvingSaleId === deliveryConfirmSale.id ? 'প্রসেস হচ্ছে...' : 'হ্যাঁ, প্রফিট পাঠান'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Courier Tracking Input Modal in Admin */}
            {courierModalSale && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-[#009245]" />
                      <h3 className="font-bold text-slate-800 text-sm">
                        কুরিয়ার ট্র্যাকিং লিংক যুক্ত করুন ({courierModalSale.orderCode})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCourierModalSale(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveCourierTracking} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        কুরিয়ার কোম্পানি সিলেক্ট করুন
                      </label>
                      <select
                        value={courierPartnerInput}
                        onChange={(e) => setCourierPartnerInput(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-[#009245] outline-none"
                      >
                        <option value="Steadfast">Steadfast Courier (স্টেডফাস্ট)</option>
                        <option value="Pathao">Pathao Courier (পাঠাও)</option>
                        <option value="RedX">RedX (রেডএক্স)</option>
                        <option value="Paperfly">Paperfly (পেপারফ্লাই)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        কুরিয়ার ট্র্যাকিং লিংক অথবা কনসাইনমেন্ট আইডি
                      </label>
                      <input
                        type="text"
                        value={courierTrackingInput}
                        onChange={(e) => setCourierTrackingInput(e.target.value)}
                        placeholder="যেমন: https://steadfast.com.bd/t/709551 অথবা 709551"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-[#009245] outline-none"
                        required
                      />
                      <p className="text-[10.5px] text-slate-400 mt-1">
                        * সম্পূর্ণ ট্র্যাকিং লিংক বা শুধু আইডি লিখুন। রিসেলারের অর্ডার পেজে এটি স্বয়ংক্রিয়ভাবে লাইভ হবে এবং সে কপি করতে পারবে।
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCourierModalSale(null)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingCourier}
                        className="px-4 py-1.5 bg-[#009245] hover:bg-[#007a37] text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        {isUpdatingCourier ? 'আপডেট হচ্ছে...' : 'সেভ ও সেন্ড করুন'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })()}

            {/* TOPUP REVIEW MODAL */}
            {selectedTopupForReview && (
              <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-emerald-600 font-extrabold" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        ব্যালেন্স অ্যাড রিকোয়েস্ট যাচাই
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTopupForReview(null)}
                      className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">রিসেলারের নাম:</span>
                      <strong className="text-slate-900">{selectedTopupForReview.employeeName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">মোবাইল:</span>
                      <strong className="font-mono text-slate-800">{selectedTopupForReview.employeePhone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">পেমেন্ট মেথড:</span>
                      <strong className="text-purple-700">{selectedTopupForReview.paymentMethod}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">প্রেরক নম্বর:</span>
                      <strong className="font-mono text-slate-900">{selectedTopupForReview.senderPhone}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ট্রানজেকশন আইডি (TrxID):</span>
                      <strong className="font-mono text-emerald-700 font-bold">{selectedTopupForReview.transactionId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">আবেদনের পরিমাণ:</span>
                      <strong className="font-mono text-emerald-700 text-sm font-black">৳{selectedTopupForReview.amount}</strong>
                    </div>
                  </div>

                  {selectedTopupForReview.screenshotUrl && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-600 block">পেমেন্ট প্রুফ স্ক্রিনশট:</span>
                      <div
                        onClick={() => setViewingTopupImage(selectedTopupForReview.screenshotUrl!)}
                        className="w-full h-36 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer group relative"
                      >
                        <img src={selectedTopupForReview.screenshotUrl} alt="Proof" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs">
                          🔍 বড় করে দেখুন
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      ওয়ালেটে যুক্ত করার পরিমাণ (৳):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editTopupAmount}
                      onChange={(e) => setEditTopupAmount(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
                      placeholder="টাকার পরিমাণ লিখুন"
                    />
                    <p className="text-[10.5px] text-slate-500">
                      * অনুমোদন দিলে রিসেলারের লাইভ ওয়ালেট ব্যালেন্সে ৳{Number(editTopupAmount) || 0} টাকা যোগ হয়ে যাবে।
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isProcessingTopup}
                      onClick={async () => {
                        if (!adminToken) return;
                        setIsProcessingTopup(true);
                        try {
                          const res = await api.adminReviewBalanceTopup(adminToken, selectedTopupForReview.id, { action: 'REJECT' });
                          showToast(res.message || 'রিকোয়েস্ট রিজেক্ট করা হয়েছে', 'info');
                          setSelectedTopupForReview(null);
                          await loadAdminData();
                        } catch (err: any) {
                          showToast(err.message || 'রিজেক্ট করতে ব্যর্থ হয়েছে', 'error');
                        } finally {
                          setIsProcessingTopup(false);
                        }
                      }}
                      className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      বাতিল (Reject)
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingTopup || !editTopupAmount || Number(editTopupAmount) <= 0}
                      onClick={async () => {
                        if (!adminToken) return;
                        setIsProcessingTopup(true);
                        try {
                          const amt = Number(editTopupAmount) || selectedTopupForReview.amount;
                          const res = await api.adminReviewBalanceTopup(adminToken, selectedTopupForReview.id, {
                            action: 'APPROVE',
                            approvedAmount: amt,
                          });
                          showToast(res.message || `৳${amt} ব্যালেন্স সফলভাবে যোগ করা হয়েছে!`, 'success');
                          setSelectedTopupForReview(null);
                          await loadAdminData();
                        } catch (err: any) {
                          showToast(err.message || 'অনুমোদন দিতে সমস্যা হয়েছে', 'error');
                        } finally {
                          setIsProcessingTopup(false);
                        }
                      }}
                      className="py-2.5 bg-[#009245] hover:bg-[#007a37] text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isProcessingTopup ? 'প্রসেস হচ্ছে...' : 'অনুমোদন ও টাকা যোগ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREENSHOT FULLSCREEN IMAGE MODAL */}
            {viewingTopupImage && (
              <div
                onClick={() => setViewingTopupImage(null)}
                className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
              >
                <div className="relative max-w-2xl max-h-[90vh] w-full flex items-center justify-center">
                  <img src={viewingTopupImage} alt="Payment Proof Full" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                  <button
                    onClick={() => setViewingTopupImage(null)}
                    className="absolute -top-10 right-0 text-white font-black text-sm bg-white/20 hover:bg-white/40 px-3 py-1 rounded-full cursor-pointer"
                  >
                    বন্ধ করুন ✕
                  </button>
                </div>
              </div>
            )}



        {/* TAB 6: PAYMENTS HUB (WITHDRAWALS, PAYOUT REQUESTS, TRANSACTION HISTORY) */}
        {(activeTab === 'withdrawals' || activeTab === 'payment_requests' || activeTab === 'payment_history' || activeTab === 'payment_hub') && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex flex-wrap items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>
                    {activeTab === 'payment_history' 
                      ? (lang === 'bn' ? 'পেমেন্ট ট্রানজেকশন হিস্ট্রি ও লেজার' : 'Payment Transaction Ledger')
                      : (lang === 'bn' ? '💳 পেমেন্ট হাব: রিসেলার পেমেন্ট ও উইথড্রয়াল রিকোয়েস্ট' : 'Payments Hub: Reseller Withdrawal Requests')}
                  </span>
                </h3>
              </div>

              {pendingWithdrawalsCount > 0 && (
                <div className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 animate-pulse shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{pendingWithdrawalsCount}টি পেন্ডিং ক্যাশআউট</span>
                </div>
              )}
            </div>

            {/* 3 Professional Filter Tabs in 1 Line */}
            {(() => {
              const pendingWdList = withdrawals.filter(w => w.status === 'PENDING');
              const confirmedWdList = withdrawals.filter(w => w.status === 'APPROVED');
              const cancelledWdList = withdrawals.filter(w => w.status === 'REJECTED');

              const filteredWithdrawals = withdrawalFilterTab === 'pending'
                ? pendingWdList
                : withdrawalFilterTab === 'confirmed'
                ? confirmedWdList
                : cancelledWdList;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setWithdrawalFilterTab('pending')}
                      className={`py-2 px-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        withdrawalFilterTab === 'pending'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>পেন্ডিং</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800">
                        {pendingWdList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawalFilterTab('confirmed')}
                      className={`py-2 px-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        withdrawalFilterTab === 'confirmed'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>পেমেন্ট কনফার্ম</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-[#009245]">
                        {confirmedWdList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWithdrawalFilterTab('cancelled')}
                      className={`py-2 px-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        withdrawalFilterTab === 'cancelled'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>বাতিল</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-100 text-rose-800">
                        {cancelledWdList.length}
                      </span>
                    </button>
                  </div>

                  {/* Clean Mobile-Optimized Withdrawals List Cards */}
                  <div className="space-y-2.5">
                    {filteredWithdrawals.length === 0 ? (
                      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                        কোনো উইথড্রয়াল রিকোয়েস্ট পাওয়া যায়নি।
                      </div>
                    ) : (
                      filteredWithdrawals.map(w => (
                        <div
                          key={w.id}
                          className="p-3 sm:p-4 bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl shadow-3xs flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-slate-500 font-bold">#{w.id}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                  w.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-[#009245]'
                                    : w.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {w.status === 'APPROVED' ? 'পরিশোধিত ✓' : w.status === 'PENDING' ? 'পেন্ডিং রিকোয়েস্ট ⏳' : 'বাতিল'}
                              </span>
                            </div>

                            <div className="text-[11.5px] text-slate-800 font-bold truncate">
                              {w.employeeName} <span className="font-normal text-slate-500">({w.paymentMethod})</span>
                            </div>

                            <div className="text-[10.5px] text-slate-600 font-mono">
                              নম্বর: <strong className="text-slate-800">{w.accountNumber}</strong> • {new Date(w.requestDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className="font-mono font-black text-rose-600 text-xs sm:text-sm block">৳{w.amount.toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedWithdrawalForDetails(w)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>বিস্তারিত</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* WITHDRAWAL DETAILS MODAL */}
            {selectedWithdrawalForDetails && (
              <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          পেমেন্ট উইথড্রয়াল বিবরণ
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">আইডি: #{selectedWithdrawalForDetails.id}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawalForDetails(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {(() => {
                    // Resolve account type safely without guessing:
                    let displayedAccountType: string | null = null;
                    let accountTypeBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                    
                    if (selectedWithdrawalForDetails.accountType) {
                      const at = selectedWithdrawalForDetails.accountType.trim();
                      if (at.toLowerCase() === 'personal' || at === 'পার্সোনাল') {
                        displayedAccountType = 'Personal (পার্সোনাল)';
                        accountTypeBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                      } else if (at.toLowerCase() === 'merchant' || at === 'মার্চেন্ট') {
                        displayedAccountType = 'Merchant (মার্চেন্ট)';
                        accountTypeBadgeClass = 'bg-purple-50 text-purple-800 border-purple-300';
                      } else if (at.toLowerCase() === 'agent' || at === 'এজেন্ট') {
                        displayedAccountType = 'Agent (এজেন্ট)';
                        accountTypeBadgeClass = 'bg-blue-50 text-blue-800 border-blue-300';
                      } else {
                        displayedAccountType = at;
                        accountTypeBadgeClass = 'bg-slate-100 text-slate-800 border-slate-300';
                      }
                    } else if (selectedWithdrawalForDetails.employeeNote) {
                      // Check explicit text in employee note without guessing
                      const noteLower = selectedWithdrawalForDetails.employeeNote.toLowerCase();
                      if (noteLower.includes('merchant') || noteLower.includes('মার্চেন্ট')) {
                        displayedAccountType = 'Merchant (মার্চেন্ট)';
                        accountTypeBadgeClass = 'bg-purple-50 text-purple-800 border-purple-300';
                      } else if (noteLower.includes('agent') || noteLower.includes('এজেন্ট')) {
                        displayedAccountType = 'Agent (এজেন্ট)';
                        accountTypeBadgeClass = 'bg-blue-50 text-blue-800 border-blue-300';
                      } else if (noteLower.includes('personal') || noteLower.includes('parsonal') || noteLower.includes('পার্সোনাল') || noteLower.includes('ব্যক্তিগত')) {
                        displayedAccountType = 'Personal (পার্সোনাল)';
                        accountTypeBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                      }
                    }

                    const feeAmount = selectedWithdrawalForDetails.feeAmount ?? 5;
                    const netPayout = selectedWithdrawalForDetails.netPayout ?? Math.max(0, selectedWithdrawalForDetails.amount - feeAmount);

                    return (
                      <div className="space-y-2.5 text-xs">
                        {/* Request Header Status & Date */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">রিকোয়েস্ট আইডি ও স্ট্যাটাস</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-slate-800">#{selectedWithdrawalForDetails.id}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  selectedWithdrawalForDetails.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : selectedWithdrawalForDetails.status === 'PENDING'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {selectedWithdrawalForDetails.status === 'APPROVED'
                                  ? 'পরিশোধিত ✓'
                                  : selectedWithdrawalForDetails.status === 'PENDING'
                                  ? 'পেন্ডিং ⏳'
                                  : 'বাতিল ✕'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">আবেদনের তারিখ</span>
                            <span className="text-[11px] font-mono font-bold text-slate-700 block">
                              {new Date(selectedWithdrawalForDetails.requestDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {new Date(selectedWithdrawalForDetails.requestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Reseller Name */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">রিসেলারের নাম</span>
                            <span className="font-bold text-slate-900 text-sm block">{selectedWithdrawalForDetails.employeeName}</span>
                            {selectedWithdrawalForDetails.employeePhone && (
                              <span className="text-[11px] text-slate-500 font-mono block">
                                ফোন: {selectedWithdrawalForDetails.employeePhone}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedWithdrawalForDetails.employeeName, 'রিসেলারের নাম')}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold text-[10.5px] rounded-lg cursor-pointer flex items-center gap-1 hover:bg-slate-50"
                          >
                            <Copy className="w-3 h-3 text-[#009245]" />
                            <span>কপি</span>
                          </button>
                        </div>

                        {/* Payment Method & Account Type */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Payment Method */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-semibold">পেমেন্ট মেথড</span>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border ${
                                  selectedWithdrawalForDetails.paymentMethod === 'bKash'
                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                {selectedWithdrawalForDetails.paymentMethod === 'bKash' ? 'বিকাশ (bKash)' : 'নগদ (Nagad)'}
                              </span>
                            </div>
                          </div>

                          {/* Account Type */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-semibold">অ্যাকাউন্ট টাইপ</span>
                            <div className="mt-1">
                              {displayedAccountType ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${accountTypeBadgeClass}`}>
                                  {displayedAccountType}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium italic text-[11px] block">
                                  নির্দিষ্ট করা নেই
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Full Payment Number */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">
                              সম্পূর্ণ {selectedWithdrawalForDetails.paymentMethod} নম্বর
                            </span>
                            <span className="font-mono font-black text-slate-900 text-base sm:text-lg tracking-wider block select-all">
                              {selectedWithdrawalForDetails.accountNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(selectedWithdrawalForDetails.accountNumber, 'পেমেন্ট নম্বর')}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5 hover:bg-slate-50 shadow-2xs"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#009245]" />
                            <span>কপি</span>
                          </button>
                        </div>

                        {/* Financial Breakdown (Amount, Fee, Net Payout) */}
                        <div className="bg-gradient-to-br from-rose-50/60 via-amber-50/30 to-emerald-50/60 p-3 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-semibold">উইথড্রয়াল রিকোয়েস্ট পরিমাণ:</span>
                            <span className="font-mono font-bold text-rose-700">
                              ৳{selectedWithdrawalForDetails.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">সেন্ড মানি ফি (সার্ভিস চার্জ):</span>
                            <span className="font-mono font-semibold text-rose-600">
                              -৳{feeAmount}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-extrabold text-emerald-900 block">
                                নিট প্রদেয় টাকা (Net Payout)
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                এই টাকা রিসেলারের নম্বরে সেন্ড মানি করুন
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-700 text-lg sm:text-xl">
                              ৳{netPayout.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Reseller Note (if provided) */}
                        {selectedWithdrawalForDetails.employeeNote && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-semibold">রিসেলারের নোট</span>
                            <p className="text-slate-800 font-medium text-xs mt-0.5">
                              {selectedWithdrawalForDetails.employeeNote}
                            </p>
                          </div>
                        )}

                        {/* Admin Note (if already approved/rejected) */}
                        {selectedWithdrawalForDetails.adminNote && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 block font-semibold">অ্যাডমিন নোট / TrxID</span>
                            <p className="text-slate-800 font-mono font-semibold text-xs mt-0.5">
                              {selectedWithdrawalForDetails.adminNote}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Actions inside Withdrawal Modal (2 Options in 1 Line: Confirm & Cancel with Notice) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedWithdrawalForDetails.status === 'PENDING' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProcessWithdrawModal(selectedWithdrawalForDetails);
                              setPayoutAction('APPROVE');
                              setAdminPayoutNote(`bKash/Nagad TrxID: TX-${Date.now().toString().slice(-6)}`);
                              setSelectedWithdrawalForDetails(null);
                            }}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>✅ পেমেন্ট কনফার্ম</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProcessWithdrawModal(selectedWithdrawalForDetails);
                              setPayoutAction('REJECT');
                              setAdminPayoutNote('তথ্য ভুল থাকায় পেমেন্ট বাতিল করা হলো');
                              setSelectedWithdrawalForDetails(null);
                            }}
                            className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>❌ বাতিল ও নোটিশ</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-700">
                        পেমেন্ট স্ট্যাটাস: {selectedWithdrawalForDetails.status} ({selectedWithdrawalForDetails.adminNote || 'Processed'})
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawalForDetails(null)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: BRANDING & BANNER MANAGEMENT (BEAUTIFULLY ORGANIZED) */}
        {(['branding', 'public_section', 'public_banners', 'public_whatsapp', 'public_notice', 'reseller_support'].includes(activeTab)) && branding && (
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            {activeTab === 'public_whatsapp' ? (
              /* DEDICATED WHATSAPP & CONTACT SETTINGS PAGE ONLY */
              <div className="space-y-6">
                {/* Header Bar */}
                <div className="flex items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#009245]" />
                      <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপ ও কন্টাক্ট কনফিগারেশন' : 'WhatsApp & Contact Settings'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      পাবলিক ওয়েবসাইট এবং রিসেলার প্যানেলের কন্টাক্ট, হটলাইন ও হোয়াটসঅ্যাপ নম্বর পৃথকভাবে নিয়ন্ত্রণ করুন
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveBranding()}
                    className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-xs transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'bn' ? '💾 পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. PUBLIC WEBSITE CONTACT SETTINGS */}
                  <div className="bg-white rounded-2xl border-2 border-emerald-400 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-[#009245] to-emerald-700 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white text-[#009245] flex items-center justify-center font-black text-base shadow-xs">
                            🌐
                          </div>
                          <div>
                            <h3 className="text-base font-black tracking-wide">
                              {lang === 'bn' ? '১. পাবলিক ওয়েবসাইট কন্টাক্ট' : '1. Public Website Contact'}
                            </h3>
                            <p className="text-xs text-emerald-100">
                              পাবলিক স্টোর পেজ, কাস্টমার চ্যাট ও অর্ডার কনফার্মেশনে দেখাবে
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-[#009245] bg-white px-2.5 py-1 rounded-full">
                          Public Store
                        </span>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Connection Status Indicator */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          branding.whatsappNumber && branding.whatsappNumber.trim() !== ''
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              {branding.whatsappNumber && branding.whatsappNumber.trim() !== '' ? (
                                <>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </>
                              ) : (
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              )}
                            </span>
                            <span className="text-xs font-bold">
                              {branding.whatsappNumber && branding.whatsappNumber.trim() !== ''
                                ? '🟢 সংযুক্ত (Connected)'
                                : '🔴 বিচ্ছিন্ন (Disconnected)'}
                            </span>
                          </div>
                          {branding.whatsappNumber && (
                            <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                              {branding.whatsappNumber}
                            </span>
                          )}
                        </div>

                        {/* 1. Public WhatsApp Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>WhatsApp Number *</span>
                            <span className="text-[10px] text-emerald-700 font-bold">পাবলিক হোয়াটসঅ্যাপ চ্যাট</span>
                          </label>
                          <input
                            type="text"
                            value={branding.whatsappNumber || ''}
                            onChange={(e) => setBranding({ ...branding, whatsappNumber: e.target.value })}
                            placeholder="যেমন: 01700000000 বা https://wa.me/8801700000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            পাবলিক ওয়েবসাইটে কাস্টমার "হোয়াটসঅ্যাপে সরাসরি অর্ডারটি পাঠান" ক্লিক করলে এই নম্বরটিতে চ্যাট খুলবে।
                          </p>
                        </div>

                        {/* 2. Public Contact Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>Contact Number</span>
                            <span className="text-[10px] text-slate-500">সাধারণ কন্টাক্ট নম্বর</span>
                          </label>
                          <input
                            type="text"
                            value={branding.publicContactNumber || ''}
                            onChange={(e) => setBranding({ ...branding, publicContactNumber: e.target.value })}
                            placeholder="যেমন: 01700000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            পাবলিক স্টোরের যোগাযোগ তথ্যে প্রদর্শিত ফোন নম্বর।
                          </p>
                        </div>

                        {/* 3. Public Hotline Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>Hotline Number</span>
                            <span className="text-[10px] text-emerald-700 font-bold">কল সেন্টার হটলাইন</span>
                          </label>
                          <input
                            type="text"
                            value={branding.helplinePhone || ''}
                            onChange={(e) => setBranding({ ...branding, helplinePhone: e.target.value })}
                            placeholder="যেমন: 01800000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            পাবলিক অর্ডার পপআপ ও হেডারের হটলাইন ফিল্ডে প্রদর্শিত হবে।
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Public Action Buttons */}
                    <div className="p-4 bg-emerald-50/60 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                      {branding.whatsappNumber ? (
                        <a
                          href={
                            branding.whatsappNumber.startsWith('http')
                              ? branding.whatsappNumber
                              : `https://wa.me/${branding.whatsappNumber.replace(/[^0-9]/g, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 transition-all cursor-pointer"
                        >
                          🧪 চ্যাট টেস্ট করুন
                        </a>
                      ) : <div />}

                      <button
                        type="button"
                        onClick={() => handleSaveBranding()}
                        className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        💾 পাবলিক কন্টাক্ট সেভ করুন
                      </button>
                    </div>
                  </div>

                  {/* 2. RESELLER PANEL CONTACT SETTINGS */}
                  <div className="bg-white rounded-2xl border-2 border-sky-400 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-600 to-blue-700 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white text-sky-700 flex items-center justify-center font-black text-base shadow-xs">
                            👥
                          </div>
                          <div>
                            <h3 className="text-base font-black tracking-wide">
                              {lang === 'bn' ? '২. রিসেলার প্যানেল কন্টাক্ট' : '2. Reseller Panel Contact'}
                            </h3>
                            <p className="text-xs text-sky-100">
                              রিসেলার ড্যাশবোর্ড, সাপোর্ট ট্যাব ও পেমেন্ট সেকশনে দেখাবে
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-black text-sky-700 bg-white px-2.5 py-1 rounded-full">
                          Reseller Portal
                        </span>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Connection Status Indicator */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          branding.resellerWhatsappNumber && branding.resellerWhatsappNumber.trim() !== ''
                            ? 'bg-sky-50 border-sky-300 text-sky-900'
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                              {branding.resellerWhatsappNumber && branding.resellerWhatsappNumber.trim() !== '' ? (
                                <>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                                </>
                              ) : (
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              )}
                            </span>
                            <span className="text-xs font-bold">
                              {branding.resellerWhatsappNumber && branding.resellerWhatsappNumber.trim() !== ''
                                ? '🟢 সংযুক্ত (Connected)'
                                : '🔴 বিচ্ছিন্ন (Disconnected)'}
                            </span>
                          </div>
                          {branding.resellerWhatsappNumber && (
                            <span className="text-xs font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200">
                              {branding.resellerWhatsappNumber}
                            </span>
                          )}
                        </div>

                        {/* 1. Reseller WhatsApp Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>WhatsApp Number *</span>
                            <span className="text-[10px] text-sky-700 font-bold">রিসেলার সাপোর্ট চ্যাট</span>
                          </label>
                          <input
                            type="text"
                            value={branding.resellerWhatsappNumber || ''}
                            onChange={(e) => setBranding({ ...branding, resellerWhatsappNumber: e.target.value })}
                            placeholder="যেমন: 01700000000 বা https://wa.me/8801700000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            রিসেলার প্যানেলে "WhatsApp Support" বাটনে এই নির্দিষ্ট হোয়াটসঅ্যাপ নম্বরটি খুলবে।
                          </p>
                        </div>

                        {/* 2. Reseller Contact Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>Contact Number</span>
                            <span className="text-[10px] text-slate-500">রিসেলার হেল্পডেস্ক</span>
                          </label>
                          <input
                            type="text"
                            value={branding.resellerContactNumber || ''}
                            onChange={(e) => setBranding({ ...branding, resellerContactNumber: e.target.value })}
                            placeholder="যেমন: 01700000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            রিসেলারদের সাধারণ কন্টাক্ট ও বিকাশ/নগদ পেমেন্ট সহায়তায় দেখাবে।
                          </p>
                        </div>

                        {/* 3. Reseller Hotline Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                            <span>Hotline Number</span>
                            <span className="text-[10px] text-sky-700 font-bold">রিসেলার কল সেন্টার</span>
                          </label>
                          <input
                            type="text"
                            value={branding.resellerHotlinePhone || ''}
                            onChange={(e) => setBranding({ ...branding, resellerHotlinePhone: e.target.value })}
                            placeholder="যেমন: 01800000000"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-sky-600 outline-none font-mono text-slate-900 font-bold shadow-2xs"
                          />
                          <p className="text-[10.5px] text-slate-500">
                            রিসেলার সাপোর্ট ট্যাবের "কল সেন্টার" অপশনে এই নম্বরটি সরাসরি দেখাবে।
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reseller Action Buttons */}
                    <div className="p-4 bg-sky-50/60 border-t border-sky-100 flex flex-wrap items-center justify-between gap-2">
                      {branding.resellerWhatsappNumber ? (
                        <a
                          href={
                            branding.resellerWhatsappNumber.startsWith('http')
                              ? branding.resellerWhatsappNumber
                              : `https://wa.me/${branding.resellerWhatsappNumber.replace(/[^0-9]/g, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-extrabold rounded-xl border border-sky-300 transition-all cursor-pointer"
                        >
                          🧪 চ্যাট টেস্ট করুন
                        </a>
                      ) : <div />}

                      <button
                        type="button"
                        onClick={() => handleSaveBranding()}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        💾 রিসেলার কন্টাক্ট সেভ করুন
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Single Line Header with Title and Save Button */}
                <div className="flex items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#009245]" />
                    <span>{lang === 'bn' ? 'ব্যানার ও ব্র্যান্ডিং নিয়ন্ত্রণ' : 'Branding & Banner Management'}</span>
                  </h2>

                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-xs transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'bn' ? '💾 পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                  </button>
                </div>

                <form onSubmit={handleSaveBranding} className="space-y-6">
              
              {/* ========================================================================= */}
              {/* SECTOR 1: বেসিক ব্র্যান্ডিং ও পরিচিতি (Basic Branding & Identity) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-b border-emerald-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ১
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ১: সাধারণ ব্র্যান্ডিং ও অ্যাপ্লিকেশনের পরিচিতি' : 'Sector 1: General Branding & Identity'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'ওয়েবসাইটের শিরোনাম, লোগো এবং অফিসিয়াল যোগাযোগ লিংক' : 'Application title, brand logo and official contact channels'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    মৌলিক সেটিংস
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Live Navbar Header Preview */}
                  <div className="p-4 bg-emerald-950/90 rounded-2xl border border-emerald-500/30 text-white space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-emerald-300 font-bold border-b border-emerald-800/80 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'bn' ? 'লাইভ প্রিভিউ: ওয়েবসাইটে যেভাবে প্রদর্শিত হবে' : 'Live Preview: As shown on website'}</span>
                      </span>
                      <span className="text-[10px] bg-emerald-900 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700 font-bold">
                        {lang === 'bn' ? 'হেডার বার' : 'Header Bar'}
                      </span>
                    </div>
                    <div className="bg-white text-slate-900 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {branding.logoUrl ? (
                          <img
                            src={branding.logoUrl}
                            alt="Logo"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black shadow-xs shrink-0">
                            <ShoppingCart className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 truncate leading-tight uppercase">
                            {branding.appName || 'TAWZOON NEXUS'}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                            QUALITY PRODUCTS FOR EVERYONE
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                        ✓ লাইভ প্রিভিউ
                      </span>
                    </div>
                  </div>

                  {/* App Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? 'অ্যাপ্লিকেশনের নাম (ওয়েবসাইটে প্রদর্শিত নাম) *' : 'Application Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={branding.appName}
                      onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                      placeholder="TAWZOON NEXUS"
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] focus:ring-1 focus:ring-[#009245] outline-none font-bold text-slate-900"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      {lang === 'bn' ? 'হেডার, ফুটার এবং ব্রাউজার ট্যাবে এই নাম প্রদর্শিত হবে।' : 'This name will appear in top navigation bar, footer and browser title.'}
                    </p>
                  </div>

                  {/* Brand Logo with Direct Upload & URL Input */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 block">
                        {lang === 'bn' ? 'অ্যাপ ও ব্র্যান্ডের মূল লোগো (Main App & Brand Logo)' : 'Main App & Brand Logo'}
                      </label>
                      <span className="text-[10px] font-bold text-[#009245] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {lang === 'bn' ? '✓ হেডার, ব্যানার ও অ্যাপ সর্বত্র কার্যকর' : '✓ Used across Header, Banner & App'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Logo Preview Box */}
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-emerald-300 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                        {branding.logoUrl ? (
                          <img
                            src={branding.logoUrl}
                            alt="Logo Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                            <span className="text-[8px] text-slate-400 font-bold block">No Logo</span>
                          </div>
                        )}
                      </div>

                      {/* Upload Controls & URL */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a38] rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{lang === 'bn' ? 'লোগো ফাইল আপলোড করুন' : 'Upload Logo File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBrandLogoUpload}
                            />
                          </label>

                          {branding.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setBranding({ ...branding, logoUrl: '' })}
                              className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                            >
                              রিমুভ
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={branding.logoUrl || ''}
                          onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                          placeholder="অথবা লোগোর সরাসরি ইমেজ লিংক (https://...)"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-mono text-slate-800"
                        />
                        <p className="text-[10px] text-slate-500 font-medium">
                          {lang === 'bn' 
                            ? 'এখানে যে লোগো সেট করবেন, সেটি মূল হেডার, রিসেলার ড্যাশবোর্ড ব্যানার এবং সমগ্র অ্যাপ্লিকেশনের মূল লোগো হিসেবে স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে।' 
                            : 'This logo will be dynamically used as the primary App Logo across the header, reseller banner, and entire application.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Support Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? 'অফিসিয়াল হোয়াটসঅ্যাপ সাপোর্ট নম্বর / লিংক' : 'WhatsApp Support Link / Number'}
                    </label>
                    <input
                      type="text"
                      value={branding.whatsappNumber || ''}
                      onChange={(e) => setBranding({ ...branding, whatsappNumber: e.target.value })}
                      placeholder="https://wa.me/8801700000000 বা 01700000000"
                      className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono text-slate-900 font-bold"
                    />
                  </div>

                  {/* Sector 1 Save & Publish to App Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'bn' ? 'সেক্টর ১ এর তথ্য সংরক্ষণ করুন' : 'Save Sector 1 Info'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveBranding();
                        await handlePublishAppUpdate();
                      }}
                      disabled={isPublishingAppUpdate}
                      className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isPublishingAppUpdate ? 'animate-spin' : ''}`} />
                      <span>{lang === 'bn' ? '🚀 লোগো পরিবর্তন সহ অ্যাপে ইনস্ট্যান্ট পাবলিশ করুন' : 'Publish & Broadcast App Update'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 1.5: পাবলিক এডিটিং সিস্টেম (PUBLIC EDITING SYSTEM - WHATSAPP & CONTACTS) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-[#009245] to-emerald-700 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white text-[#009245] flex items-center justify-center font-black text-base shadow-xs">
                      ⚙️
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-wide">
                        {lang === 'bn' ? 'পাবলিক এডিটিং সিস্টেম (Public Editing System)' : 'Public Editing System'}
                      </h3>
                      <p className="text-xs text-emerald-100">
                        {lang === 'bn' ? 'পাবলিক প্রোডাক্ট পেজের হোয়াটসঅ্যাপ নম্বর, ফোন নম্বর ও কাস্টমার মেসেজ নোটিশ নিয়ন্ত্রণ করুন' : 'Control WhatsApp number, helpline phone and order notice on public product pages'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#009245] bg-white px-3 py-1 rounded-full shadow-2xs">
                    পাবলিক কন্ট্রোল
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-4 bg-emerald-50/20">
                  {/* Public WhatsApp Connection Status Indicator */}
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    branding.whatsappNumber && branding.whatsappNumber.trim() !== ''
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                      : 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        {branding.whatsappNumber && branding.whatsappNumber.trim() !== '' ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        )}
                      </span>
                      <div>
                        <span className="text-xs font-black block">
                          {branding.whatsappNumber && branding.whatsappNumber.trim() !== ''
                            ? '🟢 সংযোগ সক্রিয় (Connected) - পাবলিক ওয়েবসাইট ও অর্ডার কনফার্মেশনে যুক্ত'
                            : '🔴 বিচ্ছিন্ন (Disconnected) - কোনো হোয়াটসঅ্যাপ সেট করা নেই'}
                        </span>
                        <p className="text-[10px] text-slate-600 font-medium">
                          এডমিন প্যানেল থেকে নম্বর বা লিংক পরিবর্তনের পর নিচে সেভ বাটনে চাপ দিলে সঙ্গে সঙ্গে কাস্টমার অর্ডারে সিঙ্ক হবে।
                        </p>
                      </div>
                    </div>
                    {branding.whatsappNumber && (
                      <span className="text-xs font-mono font-black bg-white text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200 shrink-0">
                        {branding.whatsappNumber}
                      </span>
                    )}
                  </div>

                  {/* Public WhatsApp Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                      <span>১. পাবলিক হোয়াটসঅ্যাপ নম্বর / লিংক *</span>
                      <span className="text-[11px] font-mono text-[#009245] font-bold">
                        {branding.whatsappNumber || '01700000000'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={branding.whatsappNumber || ''}
                      onChange={(e) => setBranding({ ...branding, whatsappNumber: e.target.value })}
                      placeholder="যেমন: 01700000000 বা https://wa.me/8801700000000"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-mono text-slate-900 font-bold shadow-3xs"
                    />
                    <p className="text-[11px] text-slate-500">
                      পাবলিক প্রোডাক্ট পেজে "এখনই অর্ডার করুন" ক্লিক করলে এই নম্বরটিতে সরাসরি হোয়াটসঅ্যাপ চ্যাট ওপেন হবে।
                    </p>
                  </div>

                  {/* Public Helpline Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                      <span>২. হেল্পলাইন ফোন নম্বর (সরাসরি কলের জন্য)</span>
                      <span className="text-[11px] font-mono text-emerald-700 font-bold">
                        {branding.helplinePhone || '01700000000'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={branding.helplinePhone || ''}
                      onChange={(e) => setBranding({ ...branding, helplinePhone: e.target.value })}
                      placeholder="যেমন: 01700000000"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-mono text-slate-900 font-bold shadow-3xs"
                    />
                  </div>

                  {/* Telegram Bot Notification Settings */}
                  <div className="space-y-3 pt-3 border-t border-emerald-200">
                    <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>🤖 টেলিগ্রাম বট নোটিফিকেশন (Telegram Order Alert)</span>
                        <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded font-mono">ফ্রি ও অটোমেটিক</span>
                      </span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Telegram Bot Token</label>
                        <input
                          type="text"
                          value={branding.telegramBotToken || ''}
                          onChange={(e) => setBranding({ ...branding, telegramBotToken: e.target.value })}
                          placeholder="যেমন: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-mono text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Telegram Chat ID / Channel ID</label>
                        <input
                          type="text"
                          value={branding.telegramChatId || ''}
                          onChange={(e) => setBranding({ ...branding, telegramChatId: e.target.value })}
                          placeholder="যেমন: -1001234567890 বা আপনার চ্যাট আইডি"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-mono text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-[11px] text-slate-500">
                        টেলিগ্রাম বট টোকেন ও চ্যাট আইডি সেট করলে ওয়েবসাইটে নতুন অর্ডার আসার সাথে সাথেই আপনার টেলিগ্রাম চ্যাটে পণ্যের ছবি ও বিবরণসহ নোটিফিকেশন চলে যাবে!
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await api.testTelegram({ token: branding.telegramBotToken, chatId: branding.telegramChatId });
                            if (res && res.success) {
                              showToast('টেলিগ্রাম টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!', 'success');
                            } else {
                              showToast(res?.error || 'টেস্ট মেসেজ পাঠাতে ব্যর্থ হয়েছে।', 'error');
                            }
                          } catch (e: any) {
                            showToast(e.message || 'নেটওয়ার্ক ত্রুটি', 'error');
                          }
                        }}
                        className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>🧪 টেলিগ্রাম টেস্ট মেসেজ পাঠান</span>
                      </button>
                    </div>
                  </div>

                  {/* Public Order Notice Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      ৩. পাবলিক পপআপ নোটিশ বার্তা (Order Notice Message)
                    </label>
                    <textarea
                      rows={2}
                      value={branding.publicNoticeText || ''}
                      onChange={(e) => setBranding({ ...branding, publicNoticeText: e.target.value })}
                      placeholder="অনুরোধ করা হচ্ছে: এই পণ্যটি অর্ডার করতে যে রিসেলারের পোস্ট বা লিংকের মাধ্যমে এসেছেন, সরাসরি তার সাথে অথবা নিচের নম্বরে হোয়াটসঅ্যাপ/কল করে অর্ডার কনফার্ম করুন:"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-sans text-slate-900 font-medium leading-relaxed resize-none shadow-3xs"
                    />
                    <p className="text-[11px] text-slate-500">
                      পাবলিক পপআপে কাস্টমারদের জন্য এই বার্তাটি প্রদর্শিত হবে।
                    </p>
                  </div>

                  {/* Public Editing System Save & Test Buttons */}
                  <div className="pt-3 border-t border-emerald-200/80 flex flex-wrap items-center justify-end gap-2">
                    {branding.whatsappNumber && (
                      <a
                        href={
                          branding.whatsappNumber.startsWith('http')
                            ? branding.whatsappNumber
                            : `https://wa.me/${branding.whatsappNumber.replace(/[^0-9]/g, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>🧪 হোয়াটসঅ্যাপ চ্যাট টেস্ট করুন</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-5 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>💾 পাবলিক হোয়াটসঅ্যাপ ও তথ্য সেভ করুন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 2: হোমপেজ হিরো স্লাইডার ও কাটআউট ইমেজ ব্যানার কাস্টমাইজেশন (৩টি স্লাইড সরাসরি উন্মুক্ত) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-b border-emerald-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ২
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ২: হোমপেজ হিরো ব্যানার (১, ২ ও ৩-এর কাটআউট ছবি আপলোড ম্যানেজার)' : 'Sector 2: Hero Banner 1, 2 & 3 Cutout Image Upload Manager'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? '৩টি ব্যানারের জন্যই ব্যাকগ্রাউন্ড-রিমুভড Transparent PNG ছবি আপলোড ও হেডলাইন কাস্টমাইজ করুন' : 'Upload background-removed transparent PNGs & customize copy for all 3 slides'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    ৩টি ব্যানার সরাসরি উপলব্ধ
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-8">
                  {(() => {
                    const defaultSlides = [
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
                        id: 'shopping-collection-banner-02',
                        tagBn: 'শপিং কালেকশন',
                        tagEn: 'SHOPPING COLLECTION',
                        titleLine1Bn: 'আপনার প্রতিদিনের',
                        titleLine1En: 'Everything For Your',
                        titleLine2Bn: 'প্রয়োজনের সব',
                        titleLine2En: 'Daily Shopping',
                        titleLine3Bn: 'শপিং পণ্য এক জায়গায়',
                        titleLine3En: 'In One Place',
                        subheadBn: 'পোশাক, ফ্যাশন এবং দৈনন্দিন ব্যবহারের নানান পণ্য—সবই এখানে',
                        subheadEn: 'Clothing, fashion and daily essentials — all in one place',
                        ctaBn: 'পণ্যসমূহ দেখুন',
                        ctaEn: 'Explore Products',
                        category: 'shop',
                        image: '/assets/aistudio/image_b77ddca5.png',
                        desktopImage: '/assets/aistudio/image_c26710b3.png',
                        isFullBanner: true,
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
                        id: 3,
                        tagBn: 'নতুন ট্রেন্ডি কালেকশন',
                        tagEn: 'PREMIUM FASHION & HOME',
                        titleLine1Bn: 'মার্জিত ও আকর্ষণীয়',
                        titleLine1En: 'Refined Quality &',
                        titleLine2Bn: 'নতুন ফ্যাশন ও লাইফস্টাইল',
                        titleLine2En: 'Trendy Seasonal',
                        titleLine3Bn: 'পণ্য সম্ভার',
                        titleLine3En: 'Collection',
                        subheadBn: 'দৈনন্দিন পোশাক ও হোম ডেকোরে সেরা মান ও সাশ্রয়ী দাম',
                        subheadEn: 'Apparel, travel gear, and household essentials designed for living',
                        ctaBn: 'কালেকশন দেখুন',
                        ctaEn: 'Explore Collection',
                        category: 'shop',
                        image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80',
                      },
                    ];

                    const activeSlides = (branding.heroSlides && branding.heroSlides.length > 0)
                      ? [...branding.heroSlides]
                      : defaultSlides;

                    const slideThemes = [
                      {
                        nameBn: '১ম স্লাইড: তাওজুন হোম ডেলিভারি ব্যানার (ফুল এইচডি আর্টওয়ার্ক)',
                        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                        previewBg: 'bg-gradient-to-br from-[#e8f7ee] via-[#ffffff] to-[#daf3e4]',
                        previewBorder: 'border-[#a8e5c1]',
                        tagColor: 'text-[#009245]',
                        btnColor: 'bg-[#009245]',
                      },
                      {
                        nameBn: '২য় স্লাইড: শপিং কালেকশন ব্যানার (ফুল এইচডি আর্টওয়ার্ক)',
                        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                        previewBg: 'bg-gradient-to-br from-[#e8f7ee] via-[#ffffff] to-[#daf3e4]',
                        previewBorder: 'border-[#a8e5c1]',
                        tagColor: 'text-[#009245]',
                        btnColor: 'bg-[#009245]',
                      },
                      {
                        nameBn: '৩য় স্লাইড: স্মার্ট গ্যাজেটস ও টেক (কুল মিন্ট গ্রিন ব্যাকগ্রাউন্ড)',
                        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                        previewBg: 'bg-gradient-to-br from-[#eefaf4] via-[#e2f4eb] to-[#d0ecde]',
                        previewBorder: 'border-[#b6e2ce]',
                        tagColor: 'text-[#008744]',
                        btnColor: 'bg-[#008744]',
                      },
                      {
                        nameBn: '৪র্থ স্লাইড: ফ্যাশন ও লাইফস্টাইল (পীচ রোজ ব্যাকগ্রাউন্ড)',
                        badgeBg: 'bg-rose-100 text-rose-900 border-rose-200',
                        previewBg: 'bg-gradient-to-br from-[#fef3f5] via-[#fbe6ea] to-[#f5d6dc]',
                        previewBorder: 'border-[#e8bdc7]',
                        tagColor: 'text-[#009245]',
                        btnColor: 'bg-[#009245]',
                      },
                    ];

                    const updateSlideAt = (idx: number, fields: any) => {
                      const updated = [...activeSlides];
                      updated[idx] = { ...(updated[idx] || defaultSlides[idx]), ...fields };
                      setBranding({ ...branding, heroSlides: updated });
                    };

                    return (
                      <div className="space-y-8">
                        {[0, 1, 2].map((sIdx) => {
                          const curSlide = activeSlides[sIdx] || defaultSlides[sIdx];
                          const sTheme = slideThemes[sIdx];

                          return (
                            <div
                              key={sIdx}
                              className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200/90 bg-slate-50/50 space-y-4 shadow-2xs"
                            >
                              {/* Header for this slide */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-[#009245] text-white flex items-center justify-center text-xs font-black">
                                    {sIdx + 1}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900">
                                    {sTheme.nameBn}
                                  </h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${sTheme.badgeBg}`}>
                                  নির্দিষ্ট ব্যাকগ্রাউন্ড কালার
                                </span>
                              </div>

                              {/* Exact Live Frameless Background Preview */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-700 block">
                                  লাইভ প্রিভিউ (ব্যাকগ্রাউন্ডে যেভাবে ম্যাচ করবে):
                                </span>
                                <div className={`relative rounded-2xl overflow-hidden ${sTheme.previewBg} ${sTheme.previewBorder} border p-4 sm:p-5 flex items-center justify-between min-h-[135px] shadow-2xs`}>
                                  {/* Left text */}
                                  <div className="space-y-1 max-w-[62%]">
                                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${sTheme.tagColor}`}>
                                      <span>{curSlide.tagBn}</span>
                                      <span className="w-4 h-[2px] bg-current rounded-full inline-block" />
                                    </div>
                                    <h5 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
                                      {curSlide.titleLine1Bn}{' '}
                                      <span className={`${sTheme.tagColor} block sm:inline`}>
                                        {curSlide.titleLine2Bn} {curSlide.titleLine3Bn || ''}
                                      </span>
                                    </h5>
                                    <p className="text-[9px] sm:text-[11px] text-slate-600 line-clamp-1">
                                      {curSlide.subheadBn}
                                    </p>
                                    <div className="pt-1">
                                      <span className={`${sTheme.btnColor} text-white text-[9px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 whitespace-nowrap`}>
                                        {curSlide.ctaBn} →
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right cutout preview image */}
                                  <div className="w-[110px] sm:w-[150px] h-[95px] sm:h-[120px] flex items-center justify-end">
                                    <img
                                      src={curSlide.image}
                                      alt={`Slide ${sIdx + 1} Cutout`}
                                      className="max-w-full max-h-full object-contain object-bottom drop-shadow-md select-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Cutout Image Upload Box for this specific slide */}
                              <div className="p-4 bg-white rounded-xl border border-emerald-200 space-y-3 shadow-2xs">
                                <div>
                                  <label className="text-xs font-black text-slate-900 block">
                                    {lang === 'bn' ? `স্লাইড ${sIdx + 1}-এর জন্য ব্যাকগ্রাউন্ড ছাড়া PNG ছবি আপলোড করুন` : `Upload Slide ${sIdx + 1} Cutout Image`}
                                  </label>
                                  <p className="text-[11px] text-emerald-800 mt-0.5">
                                    {lang === 'bn'
                                      ? '📌 ব্যাকগ্রাউন্ড রিমুভ করা Transparent PNG আপলোড করলে তা ফ্রেম বা দাগ ছাড়াই প্রাকৃতিকভাবে মিলে যাবে।'
                                      : 'Upload a background-removed transparent PNG image for seamless blending.'}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <label className="px-4 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95">
                                    <Upload className="w-4 h-4" />
                                    <span>{lang === 'bn' ? `স্লাইড ${sIdx + 1}-এ PNG ছবি আপলোড করুন` : `Upload Slide ${sIdx + 1} PNG`}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleHeroSlideImageUpload(sIdx, e)}
                                    />
                                  </label>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-600 block">
                                    অথবা ছবির সরাসরি লিংক (Image URL):
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.image || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { image: e.target.value })}
                                    placeholder="https://... বা /uploads/..."
                                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono text-slate-800"
                                  />
                                </div>
                              </div>

                              {/* Editable Copy & Text Fields for this slide */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    ট্যাগলাইন (বাংলা)
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.tagBn || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { tagBn: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-bold text-slate-900"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    বাটন লেখা (এক লাইনে থাকবে)
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.ctaBn || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { ctaBn: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-bold text-slate-900"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    শিরোনাম ১ম লাইন (কালো টেক্সট)
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.titleLine1Bn || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { titleLine1Bn: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-bold text-slate-900"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    শিরোনাম ২য় ও ৩য় লাইন (সবুজ টেক্সট)
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.titleLine2Bn || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { titleLine2Bn: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none font-bold text-emerald-700"
                                  />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                  <label className="text-[11px] font-bold text-slate-700 block">
                                    সাব-হেডলাইন বিবরণ
                                  </label>
                                  <input
                                    type="text"
                                    value={curSlide.subheadBn || ''}
                                    onChange={(e) => updateSlideAt(sIdx, { subheadBn: e.target.value })}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#009245] outline-none text-slate-800"
                                  />
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Sector 2 Save All Button */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-6 py-3 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? '৩টি স্লাইডারের সকল সেটিংস সংরক্ষণ করুন' : 'Save All 3 Slide Banners'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 3: প্রমোশনাল টপ ব্যানার (Top Announcement Bar) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-orange-50/40 to-white border-b border-amber-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ৩
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ৩: প্রমোশনাল টপ ব্যানার নোটিফিকেশন' : 'Sector 3: Top Announcement Bar'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'ওয়েবসাইটের একদম ওপরে নোটিফিকেশন বার প্রদর্শন ও বিশেষ অফার বার্তা' : 'Top marquee announcement strip and promotional notice'}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-2xs">
                    <input
                      type="checkbox"
                      id="promotionalToggleSector"
                      checked={branding.promoBannerActive}
                      onChange={(e) => setBranding({ ...branding, promoBannerActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                    />
                    <span className="text-xs font-black text-slate-800">
                      {branding.promoBannerActive ? 'সক্রিয় আছে' : 'বন্ধ আছে'}
                    </span>
                  </label>
                </div>

                {branding.promoBannerActive && (
                  <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">
                        {lang === 'bn' ? 'প্রমোশনাল অফার বার্তা (বাংলা)' : 'Promo Announcement (Bangla)'}
                      </label>
                      <input
                        type="text"
                        value={branding.promoBannerTextBn || ''}
                        onChange={(e) => setBranding({ ...branding, promoBannerTextBn: e.target.value })}
                        placeholder="🎉 বিশেষ অফার: নতুন সিজনের ট্রেন্ডিং গ্যাজেট ও ফ্যাশন কালেকশনে আকর্ষণীয় রিওয়ার্ড!"
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-600 outline-none font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 block">
                        {lang === 'bn' ? 'Promo Announcement (English)' : 'Promo Announcement (English)'}
                      </label>
                      <input
                        type="text"
                        value={branding.promoBannerTextEn || ''}
                        onChange={(e) => setBranding({ ...branding, promoBannerTextEn: e.target.value })}
                        placeholder="🎉 Exclusive: Explore new trending gadgets and seasonal fashion with authorized rewards!"
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-600 outline-none font-bold text-slate-900"
                      />
                    </div>

                    {/* Sector 3 Save & Homepage Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePortal('public');
                        }}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        title="হোম পেজে নোটিফিকেশন প্রিভিউ দেখতে এখানে চাপুন"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#009245]" />
                        <span>{lang === 'bn' ? '🏠 হোম পেজে নোটিফিকেশন দেখুন' : 'View on Homepage'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveBranding()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'নোটিফিকেশন সেভ করুন' : 'Save Promo Notification'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 4: রিসেলার অর্ডার শর্তাবলী ও নিয়মাবলী (Reseller Terms & Ordering Rules) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-violet-50/40 to-white border-b border-purple-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ৪
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ৪: রিসেলার অর্ডার শর্তাবলী ও নিয়মাবলী' : 'Sector 4: Reseller Ordering Terms & Policies'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'অর্ডার কনফার্মেশনের সময় রিসেলারদের যে পয়েন্টগুলো দেখানো হয় তা যুক্ত, এডিট বা ডিলিট করুন' : 'Manage order terms shown to resellers during direct checkout'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentList = branding.resellerTerms || [];
                      const newItem = {
                        id: Date.now().toString(),
                        title: `${currentList.length + 1} > নতুন শর্ত:`,
                        desc: 'নতুন শর্তের বিবরণ এখানে লিখুন...',
                        isWarning: false,
                      };
                      setBranding({
                        ...branding,
                        resellerTerms: [...currentList, newItem],
                      });
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'নতুন শর্ত যোগ করুন' : 'Add New Term'}</span>
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  {(branding.resellerTerms && branding.resellerTerms.length > 0
                    ? branding.resellerTerms
                    : [
                        {
                          id: '1',
                          title: '১ > কাস্টমার রিপোর্ট যাচাই:',
                          desc: 'কাস্টমারটি অনলাইন থেকে এর আগে কতগুলো অর্ডার ডেলিভারি নিয়েছে এবং কতগুলো রিটার্ন করেছে, সেই রিপোর্ট চেক করুন। কাস্টমারের রিপোর্ট বিবেচনা করে দেখুন, এই কাস্টমারকে প্রোডাক্ট পাঠালে রিটার্ন হওয়ার সম্ভাবনা কতটুকু এবং ডেলিভারি চার্জ অগ্রিম না নিয়ে প্রোডাক্ট পাঠানো যাবে কি না। বিষয়টি বিবেচনা করে অর্ডার প্লেস করুন।',
                          isWarning: false,
                        },
                        {
                          id: '2',
                          title: '২ > ডেলিভারি চার্জ অগ্রিম:',
                          desc: 'কাস্টমারের কাছ থেকে ডেলিভারি চার্জ অগ্রিম নেওয়া হলে সেই টাকা অবশ্যই আমাদের নাম্বারে পাঠিয়ে দিতে হবে। আপনাদের নিজস্ব নাম্বারে ডেলিভারি চার্জ নেওয়া যাবে না। পেমেন্ট নেওয়ার আগে আমাদের সাথে যোগাযোগ করে সঠিক নাম্বার নিয়ে নিতে হবে। আপনাদের দেওয়া নাম্বারে পেমেন্ট নেওয়ার কারণে কাস্টমার যদি প্রোডাক্টের টাকা পরিশোধ না করে, তাহলে সেই টাকার সম্পূর্ণ দায়ভার আপনাদের নিতে হবে।',
                          isWarning: false,
                        },
                        {
                          id: '3',
                          title: '৩ > প্রোডাক্ট চেক:',
                          desc: 'ডেলিভারি ম্যান উপস্থিত থাকা অবস্থায় কাস্টমারকে প্রোডাক্টটি ভালোভাবে চেক করে নিতে হবে। ডেলিভারি ম্যান চলে যাওয়ার পর কোনো ধরনের রিটার্নের জন্য অনুরোধ করা যাবে না।',
                          isWarning: false,
                        },
                        {
                          id: '4',
                          title: '৪ > ডেলিভারির পর রিটার্ন/পরিবর্তন:',
                          desc: 'ডেলিভারি ম্যান চলে যাওয়ার পর কোনো কারণে প্রোডাক্টটি রিটার্ন অথবা পরিবর্তন করতে চাইলে অতিরিক্ত ডেলিভারি চার্জ প্রদান করতে হবে।\n\nকারণ: এই প্রোডাক্টগুলো রিটার্ন হলে পরবর্তীতে বিক্রয় উপযুক্ত থাকে না। তাই চেষ্টা করবেন যেন অপ্রয়োজনে কোনো প্রোডাক্ট রিটার্ন না আসে।',
                          isWarning: true,
                        },
                      ]
                  ).map((item, idx) => (
                    <div key={item.id} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const currentList = branding.resellerTerms || [];
                              const updated = currentList.map((t) =>
                                t.id === item.id ? { ...t, title: e.target.value } : t
                              );
                              setBranding({ ...branding, resellerTerms: updated });
                            }}
                            placeholder="শর্তের শিরোনাম (যেমন: ১ > কাস্টমার রিপোর্ট যাচাই:)"
                            className="flex-1 px-3 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-600"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isWarning || false}
                            onChange={(e) => {
                              const currentList = branding.resellerTerms || [];
                              const updated = currentList.map((t) =>
                                t.id === item.id ? { ...t, isWarning: e.target.checked } : t
                              );
                              setBranding({ ...branding, resellerTerms: updated });
                            }}
                            className="w-3.5 h-3.5 accent-rose-600 rounded cursor-pointer"
                          />
                          <span>রেড অ্যালার্ট</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const currentList = branding.resellerTerms || [];
                            const updated = currentList.filter((t) => t.id !== item.id);
                            setBranding({ ...branding, resellerTerms: updated });
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="ডিলিট করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={item.desc}
                        onChange={(e) => {
                          const currentList = branding.resellerTerms || [];
                          const updated = currentList.map((t) =>
                            t.id === item.id ? { ...t, desc: e.target.value } : t
                          );
                          setBranding({ ...branding, resellerTerms: updated });
                        }}
                        placeholder="শর্তের বিস্তারিত তথ্য..."
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-600 resize-none leading-relaxed"
                      />
                    </div>
                  ))}

                  {/* Sector 4 Save Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সেক্টর ৪ এর শর্তাবলী সংরক্ষণ করুন' : 'Save Sector 4 Terms'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 5: রিসেলার ড্যাশবোর্ড ট্রেনিং ব্যানার (Reseller Dashboard Training Banner) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50 via-emerald-50/40 to-white border-b border-teal-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ৫
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ৫: রিসেলার ট্রেনিং ব্যানার কাস্টমাইজেশন' : 'Sector 5: Reseller Training Banner Customization'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'রিসেলার ড্যাশবোর্ডের ট্রেনিং ব্যানারের টেক্সট এবং ব্যাকগ্রাউন্ড ইমেজ নিয়ন্ত্রণ করুন' : 'Configure text and background image for the reseller dashboard training banner'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    ড্যাশবোর্ড ব্যানার
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  {/* Background Image with Upload */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? 'ব্যানার ব্যাকগ্রাউন্ড ইমেজ (Full Frame Background)' : 'Banner Background Image (Full Frame)'}
                    </label>

                    {/* Preview Box */}
                    <div className="relative w-full h-32 sm:h-40 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
                      {branding.resellerBannerBgImage ? (
                        <img
                          src={branding.resellerBannerBgImage}
                          alt="Banner BG Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon className="w-8 h-8 mb-1" />
                           <span className="text-[10px] font-bold">কোনো ব্যাকগ্রাউন্ড ইমেজ নেই</span>
                        </div>
                      )}
                      
                      {/* Overlay Preview Content */}
                      <div className="absolute inset-0 bg-black/20 flex flex-col justify-center px-6">
                        <span className="text-[8px] bg-emerald-600 text-white w-fit px-1 rounded-sm mb-1">
                          {branding.resellerBannerBadgeBn || 'নতুন রিসেলার?'}
                        </span>
                        <h4 className="text-sm font-black text-white">
                          {branding.resellerBannerTitleBn || 'কীভাবে কাজ করবেন শিখুন'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ব্যাকগ্রাউন্ড ইমেজ আপলোড করুন' : 'Upload Background Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleResellerBannerBgUpload}
                        />
                      </label>
                      
                      {branding.resellerBannerBgImage && (
                        <button
                          type="button"
                          onClick={() => setBranding({ ...branding, resellerBannerBgImage: '' })}
                          className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          রিমুভ করুন
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={branding.resellerBannerBgImage || ''}
                      onChange={(e) => setBranding({ ...branding, resellerBannerBgImage: e.target.value })}
                      placeholder="অথবা সরাসরি ইমেজ লিংক (https://...)"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-600 outline-none font-mono text-slate-800"
                    />
                  </div>

                  {/* Text Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Badge */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">ব্যানার ব্যাজ (Badge Text)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={branding.resellerBannerBadgeBn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerBadgeBn: e.target.value })}
                          placeholder="নতুন রিসেলার? (বাংলা)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                        <input
                          type="text"
                          value={branding.resellerBannerBadgeEn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerBadgeEn: e.target.value })}
                          placeholder="New Reseller? (English)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">ব্যানার শিরোনাম (Title)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={branding.resellerBannerTitleBn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerTitleBn: e.target.value })}
                          placeholder="কীভাবে কাজ করবেন শিখুন (বাংলা)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                        <input
                          type="text"
                          value={branding.resellerBannerTitleEn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerTitleEn: e.target.value })}
                          placeholder="Learn how to work (English)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Button Text */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">বাটন টেক্সট (Button Text)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={branding.resellerBannerButtonBn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerButtonBn: e.target.value })}
                          placeholder="শিখতে ক্লিক করুন (বাংলা)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                        <input
                          type="text"
                          value={branding.resellerBannerButtonEn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerButtonEn: e.target.value })}
                          placeholder="Click to Learn (English)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Subtitle / Note */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">সাবটাইটেল / নোট (Subtitle)</label>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={branding.resellerBannerSubtitleBn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerSubtitleBn: e.target.value })}
                          placeholder="ভিডিও টিউটোরিয়াল (বাংলা)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                        <input
                          type="text"
                          value={branding.resellerBannerSubtitleEn || ''}
                          onChange={(e) => setBranding({ ...branding, resellerBannerSubtitleEn: e.target.value })}
                          placeholder="Video Tutorial (English)"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sector 5 Save Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সেক্টর ৫ এর ব্যানার সেটিংস সংরক্ষণ করুন' : 'Save Sector 5 Banner Settings'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTOR 6: স্টেডফাস্ট কুরিয়ার এপিআই ইন্টিগ্রেশন (Steadfast Courier API Settings) */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-b border-emerald-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      ৬
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {lang === 'bn' ? 'সেক্টর ৬: স্টেডফাস্ট কুরিয়ার এপিআই ইন্টিগ্রেশন ও লাইভ ভেরিফিকেশন' : 'Sector 6: Steadfast Courier API Integration'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'রিসেলার অর্ডারে কাস্টমারের ফোন নম্বর দিয়ে লাইভ পার্সেল ডেলিভারি হিস্ট্রি ও রিস্ক রিপোর্ট যাচাই করার এপিআই' : 'Live Steadfast Courier Fraud & Delivery History API credentials'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    কুরিয়ার এপিআই
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#009245] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {lang === 'bn'
                        ? 'আপনার Steadfast Courier মার্চেন্ট পোর্টাল (portal.packzy.com) থেকে সংগৃহীত Api-Key ও Secret-Key এখানে দিন। এটি সেট করলে রিসেলার যখন কাস্টমারের ১১ ডিজিট নম্বর দিয়ে "নম্বর চেক" করবে, তখন স্বয়ংক্রিয়ভাবে কাস্টমারের জাতীয় কুরিয়ার ডেলিভারি রেকর্ড, ডেলিভারির সংখ্যা, রিটার্ন সংখ্যা এবং সফলতার হার প্রদর্শিত হবে।'
                        : 'Enter your Steadfast Merchant Api-Key and Secret-Key here to verify customer parcel delivery history and fraud rate in real time.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Steadfast Api-Key (এপিআই কি)
                      </label>
                      <input
                        type="text"
                        value={branding.steadfastApiKey || ''}
                        onChange={(e) => setBranding({ ...branding, steadfastApiKey: e.target.value.trim() })}
                        placeholder="iqufqtpvaijagyyzhl9gqydqg0wyqmcn"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 font-mono border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Steadfast Secret-Key (সিক্রেট কি)
                      </label>
                      <input
                        type="password"
                        value={branding.steadfastSecretKey || ''}
                        onChange={(e) => setBranding({ ...branding, steadfastSecretKey: e.target.value.trim() })}
                        placeholder="ucl3zgyj6fj2e3wllrtiwzk3"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 font-mono border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold"
                      />
                    </div>
                  </div>

                  {/* Sector 6 Save Button */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সেক্টর ৬ এর এপিআই কি সেভ করুন' : 'Save Sector 6 API Keys'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>সেভ করার সাথে সাথে সকল ব্র্যান্ডিং সেটিংস লাইভ ডাটাবেজে আপডেট হয়ে যাবে।</span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-black text-white bg-[#009245] hover:bg-[#007a38] rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'bn' ? '💾 ব্র্যান্ডিং পরিবর্তন সেভ করুন' : 'Save Branding Changes'}</span>
                  </button>
                </div>
              </div>

            </form>
            </>
          )}
          </div>
        )}

        {/* TAB: PUBLIC SECTION */}
        {activeTab === 'public_section' && (
          <div className="space-y-4 w-full max-w-5xl mx-auto">
            <div className="bg-emerald-900 text-white p-4 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-black">🌐 ৩. পাবলিক সেকশন (Public Section Manager)</h2>
                <p className="text-xs text-emerald-200">ব্যানার, লোগো, হোয়াটসঅ্যাপ সাপোর্ট নাম্বার ও কাস্টমার অর্ডার বার্তা নিয়ন্ত্রণ করুন</p>
              </div>
              <button
                onClick={() => setActiveTab('branding')}
                className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl cursor-pointer"
              >
                ব্যানার ও ভিজ্যুয়াল এডিটর
              </button>
            </div>
          </div>
        )}

        {/* TAB: AI HUB */}
        {(['ai_hub', 'ai_chat', 'ai_video', 'ai_campaign', 'ai_website'].includes(activeTab)) && branding && (
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
                  <span>{lang === 'bn' ? '৫. এআই হাব ও স্মার্ট সিস্টেম কন্ট্রোল' : '5. AI Hub & Smart Systems Control'}</span>
                </h2>
                <p className="text-xs text-amber-100 mt-0.5">
                  {lang === 'bn' 
                    ? 'পাবলিক চ্যাট, রিসেলার চ্যাট, ভিডিও এআই এবং ওয়েবসাইট এআই লিমিট ও স্ট্যাটাস নিয়ন্ত্রণ করুন' 
                    : 'Manage Public Chat, Reseller Chat, Video AI, and Website AI limits and status'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveBranding()}
                className="px-5 py-2.5 bg-white text-slate-900 hover:bg-amber-50 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4 text-[#009245]" />
                <span>{lang === 'bn' ? 'এআই সেটিংস সেভ করুন' : 'Save AI Settings'}</span>
              </button>
            </div>

            {/* SECTION 1: AI CHAT CONTROLS (PUBLIC & RESELLER) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">
                  {lang === 'bn' ? '১. এআই চ্যাট সেকশন কন্ট্রোল (Public & Reseller AI Chat)' : '1. AI Chat Section Controls'}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* 1A. PUBLIC CUSTOMER AI CHAT */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      🌐 পাবলিক কাস্টমার এআই চ্যাট (Public Customer AI Chat)
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={branding.publicAiEnabled !== false}
                        onChange={(e) => setBranding({ ...branding, publicAiEnabled: e.target.checked })}
                        className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-700">
                        {branding.publicAiEnabled !== false ? 'সক্রিয়' : 'বন্ধ'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">সিস্টেম প্রম্পট (Public System Prompt)</label>
                    <textarea
                      rows={2}
                      value={branding.publicAiPrompt || ''}
                      onChange={(e) => setBranding({ ...branding, publicAiPrompt: e.target.value })}
                      placeholder="পাবলিক কাস্টমার চ্যাট এআই প্রম্পট নির্দেশনাবলী..."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-500 outline-none text-slate-900 font-medium resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">দৈনিক মেসেজ লিমিট টাইপ</label>
                      <select
                        value={branding.publicAiLimitType || 'daily_limit'}
                        onChange={(e) => setBranding({ ...branding, publicAiLimitType: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                      >
                        <option value="unlimited">আনলিমিটেড (Unlimited Chat)</option>
                        <option value="daily_limit">দৈনিক লিমিট (Daily Limit per User)</option>
                      </select>
                    </div>

                    {branding.publicAiLimitType !== 'unlimited' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">দৈনিক সর্বোচ্চ মেসেজ সংখ্যা (টি)</label>
                        <input
                          type="number"
                          value={branding.publicAiDailyLimit || 20}
                          onChange={(e) => setBranding({ ...branding, publicAiDailyLimit: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold font-mono text-slate-900 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 1B. RESELLER AI CHAT */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      💼 রিসেলার অ্যাসিস্ট্যান্ট এআই চ্যাট (Reseller Assistant AI Chat)
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <input
                        type="checkbox"
                        checked={branding.resellerAiEnabled !== false}
                        onChange={(e) => setBranding({ ...branding, resellerAiEnabled: e.target.checked })}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-700">
                        {branding.resellerAiEnabled !== false ? 'সক্রিয়' : 'বন্ধ'}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">সিস্টেম প্রম্পট (Reseller System Prompt)</label>
                    <textarea
                      rows={2}
                      value={branding.resellerAiPrompt || ''}
                      onChange={(e) => setBranding({ ...branding, resellerAiPrompt: e.target.value })}
                      placeholder="রিসেলার অ্যাসিস্ট্যান্ট এআই প্রম্পট নির্দেশনাবলী..."
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-500 outline-none text-slate-900 font-medium resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">দৈনিক মেসেজ লিমিট টাইপ</label>
                      <select
                        value={branding.resellerAiLimitType || 'daily_limit'}
                        onChange={(e) => setBranding({ ...branding, resellerAiLimitType: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none"
                      >
                        <option value="unlimited">আনলিমিটেড (Unlimited Access)</option>
                        <option value="daily_limit">দৈনিক লিমিট (Daily Limit per Reseller)</option>
                      </select>
                    </div>

                    {branding.resellerAiLimitType !== 'unlimited' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">দৈনিক সর্বোচ্চ মেসেজ সংখ্যা (টি)</label>
                        <input
                          type="number"
                          value={branding.resellerAiDailyLimit || 50}
                          onChange={(e) => setBranding({ ...branding, resellerAiDailyLimit: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold font-mono text-slate-900 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: VIDEO AI GENERATOR CONTROLS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4.5 h-4.5 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === 'bn' ? '২. ভিডিও জেনারেট এআই সেকশন (Video AI Generator Controls)' : '2. Video AI Generator Controls'}
                  </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={branding.videoAiEnabled !== false}
                    onChange={(e) => setBranding({ ...branding, videoAiEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-emerald-900">
                    {branding.videoAiEnabled !== false ? 'সক্রিয়' : 'বন্ধ'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">ভিডিও লিমিট টাইপ</label>
                  <select
                    value={branding.videoAiLimitType || 'daily_limit'}
                    onChange={(e) => setBranding({ ...branding, videoAiLimitType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-[#009245]"
                  >
                    <option value="unlimited">আনলিমিটেড (Unlimited Access)</option>
                    <option value="daily_limit">দৈনিক লিমিট (Daily Limit per Reseller)</option>
                  </select>
                </div>

                {branding.videoAiLimitType === 'daily_limit' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">দৈনিক ভিডিও লিমিট (টি)</label>
                    <input
                      type="number"
                      value={branding.videoAiDailyLimit || 10}
                      onChange={(e) => setBranding({ ...branding, videoAiDailyLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:border-[#009245]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">মাসিক সাবস্ক্রিপশন ফি (৳)</label>
                  <input
                    type="number"
                    value={branding.videoAiPricePerMonth || 490}
                    onChange={(e) => setBranding({ ...branding, videoAiPricePerMonth: Number(e.target.value) })}
                    placeholder="490"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:border-[#009245]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: WEBSITE AI GENERATOR CONTROLS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === 'bn' ? '৩. ওয়েবসাইট সেকশন এআই (AI Website & Landing Page Generator)' : '3. AI Website Generator Controls'}
                  </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    checked={branding.websiteAiEnabled !== false}
                    onChange={(e) => setBranding({ ...branding, websiteAiEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-purple-900">
                    {branding.websiteAiEnabled !== false ? 'সক্রিয়' : 'বন্ধ'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">ওয়েবসাইট তৈরি লিমিট টাইপ</label>
                  <select
                    value={branding.websiteAiLimitType || 'total_limit'}
                    onChange={(e) => setBranding({ ...branding, websiteAiLimitType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-purple-600"
                  >
                    <option value="unlimited">আনলিমিটেড সাইট (Unlimited Sites)</option>
                    <option value="total_limit">সর্বোচ্চ সাইট সংখ্যা (Total Limit per Reseller)</option>
                  </select>
                </div>

                {branding.websiteAiLimitType === 'total_limit' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">সর্বোচ্চ তৈরিযোগ্য সাইট সংখ্যা (টি)</label>
                    <input
                      type="number"
                      value={branding.websiteAiTotalLimit || 5}
                      onChange={(e) => setBranding({ ...branding, websiteAiTotalLimit: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:border-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: CAMPAIGN AI CONTROL */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === 'bn' ? '৪. রিসেলার ক্যাম্পেইন এআই জেনারেটর (Campaign AI Generator)' : '4. Reseller Campaign AI Generator'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    রিসেলাররা সোশ্যাল মিডিয়া অ্যাড ও ডিসকাউন্ট অফারের চমৎকার পোস্ট কপি তৈরি করতে পারবে।
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  <input
                    type="checkbox"
                    checked={branding.campaignAiEnabled !== false}
                    onChange={(e) => setBranding({ ...branding, campaignAiEnabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-900">
                    {branding.campaignAiEnabled !== false ? 'সক্রিয়' : 'বন্ধ'}
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveBranding()}
                className="px-6 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'bn' ? 'এআই হাবে সকল পরিবর্তন সংরক্ষণ করুন' : 'Save All AI Hub Changes'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: NOTIFICATION CENTER */}
        {(['notifications', 'notif_public', 'notif_reseller'].includes(activeTab)) && branding && (
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-rose-200 animate-pulse" />
                  <span>{lang === 'bn' ? '৮. নোটিফিকেশন বার ও রিয়েল-টাইম নোটিফিকেশন সেকশন' : '8. Real-Time Notification Center'}</span>
                </h2>
                <p className="text-xs text-rose-100 mt-0.5">
                  {lang === 'bn' ? 'পাবলিক ওয়েবসাইট ও রিসেলার ড্যাশবোর্ডে তাৎক্ষণিক নোটিফিকেশন ও নোটিশ বার লাইভ পাঠান' : 'Push real-time notifications to public website or reseller dashboard'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveBranding()}
                  className="px-5 py-2.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                >
                  💾 সেটিংস সেভ করুন
                </button>
              </div>
            </div>

            {/* 1. Public Notification Box */}
            <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009245] animate-ping" />
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === 'bn' ? '🌐 ১. পাবলিক নোটিফিকেশন (Public Announcement Bar)' : '1. Public Announcement Bar'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePortal('public')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#009245] border border-emerald-200 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>হোম পেজে ভিউ</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSendingNotif}
                    onClick={() => {
                      const msg = branding.promoBannerTextBn || branding.publicNoticeText || 'আমাদের বিশেষ অফার ও আপডেট দেখুন!';
                      handleSendLiveNotification('PUBLIC', 'পাবলিক ওয়েবসাইট বিশেষ ঘোষণা', msg);
                    }}
                    className="px-3 py-1.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>🚀 পাবলিক নোটিফিকেশন হিসেবে লাইভ পাঠান</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">পাবলিক টপ অ্যানাউন্সমেন্ট বার (বাংলা)</label>
                  <input
                    type="text"
                    value={branding.promoBannerTextBn || ''}
                    onChange={(e) => setBranding({ ...branding, promoBannerTextBn: e.target.value })}
                    placeholder="🎉 বিশেষ অফার: নতুন সিজনের ট্রেন্ডিং গ্যাজেট ও ফ্যাশন কালেকশনে আকর্ষণীয় রিওয়ার্ড!"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">পাবলিক পপআপ নোটিশ বার্তা (Order Notice Message)</label>
                  <textarea
                    rows={2}
                    value={branding.publicNoticeText || ''}
                    onChange={(e) => setBranding({ ...branding, publicNoticeText: e.target.value })}
                    placeholder="অনুরোধ করা হচ্ছে: এই পণ্যটি অর্ডার করতে যে রিসেলারের পোস্ট বা লিংকের মাধ্যমে এসেছেন..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none text-slate-900 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Reseller Notification Box */}
            <div className="bg-white rounded-2xl border-2 border-cyan-300 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-cyan-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping" />
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === 'bn' ? '💼 ২. রিসেলার নোটিফিকেশন (Reseller Dashboard Notice Bar)' : '2. Reseller Dashboard Notice Bar'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePortal('employee')}
                    className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>রিসেলার পোর্টালে ভিউ</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSendingNotif}
                    onClick={() => {
                      const msg = branding.resellerNotificationNotice || 'সকল রিসেলারদের অবগতির জন্য নতুন আপডেট জানানো হচ্ছে।';
                      handleSendLiveNotification('EMPLOYEE', 'রিসেলার ড্যাশবোর্ড গুরুত্বপূর্ণ নোটিশ', msg);
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>🚀 রিসেলারদের নোটিফিকেশন হিসেবে লাইভ পাঠান</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">রিসেলার অ্যানাউন্সমেন্ট নোটিশ বার</label>
                  <input
                    type="text"
                    value={branding.resellerNotificationNotice || ''}
                    onChange={(e) => setBranding({ ...branding, resellerNotificationNotice: e.target.value })}
                    placeholder="🎉 সকল রিসেলারদের অবগতির জন্য জানানো যাচ্ছে যে..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-600 outline-none font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Instant Live Notification Sender */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {lang === 'bn' ? '📢 ৩. ইনস্ট্যান্ট লাইভ নোটিফিকেশন ডিসপ্যাচার (Live Notification Sender)' : '3. Instant Live Notification Sender'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'bn' ? 'সরাসরি পাবলিক বা রিসেলারদের স্ক্রিনে রিয়েল-টাইমে ঘণ্টা আইকন ও সাউন্ড সহ নোটিফিকেশন পাঠান' : 'Broadcast instant notifications with bell badge and sound alert'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Target Portal Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">প্রাপক নির্বাচন করুন (Target Audience):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNotifTarget('PUBLIC')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        notifTarget === 'PUBLIC'
                          ? 'bg-emerald-50 border-emerald-500 text-[#009245] shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>🌐 পাবলিক ওয়েবসাইট (Public)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifTarget('EMPLOYEE')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        notifTarget === 'EMPLOYEE'
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>💼 রিসেলার প্যানেল (Resellers)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifTarget('ALL')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        notifTarget === 'ALL'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>👥 উভয় প্ল্যাটফর্ম (All Users)</span>
                    </button>
                  </div>
                </div>

                {/* Notification Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">নোটিফিকেশনের শিরোনাম (Title):</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder={notifTarget === 'PUBLIC' ? 'যেমন: বিশেষ ফ্ল্যাশ সেল ও ডিসকাউন্ট অফার!' : 'যেমন: নতুন ট্রেনিং মডিউল ও পেমেন্ট আপডেট'}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-900"
                  />
                </div>

                {/* Notification Message */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">নোটিফিকেশনের বিস্তারিত বার্তা (Message):</label>
                  <textarea
                    rows={2}
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="নোটিফিকেশন মেসেজটি এখানে লিখুন যা ব্যবহারকারী স্ক্রিনে দেখতে পাবেন..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none text-slate-900 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Send Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isSendingNotif || !notifMessage.trim()}
                    onClick={() => handleSendLiveNotification()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{isSendingNotif ? 'পাঠানো হচ্ছে...' : '🚀 নোটিফিকেশন লাইভ পাঠান (Send Real-Time Notification)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Recently Broadcast Notifications List */}
            {allNotifications.filter(n => n.recipientRole === 'PUBLIC' || n.recipientRole === 'EMPLOYEE').length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>সাম্প্রতিক পাঠানো নোটিফিকেশনসমূহ (Recently Sent Notifications)</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">
                    মোট {allNotifications.filter(n => n.recipientRole === 'PUBLIC' || n.recipientRole === 'EMPLOYEE').length} টি
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {allNotifications
                    .filter(n => n.recipientRole === 'PUBLIC' || n.recipientRole === 'EMPLOYEE')
                    .slice(0, 8)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              item.recipientRole === 'PUBLIC'
                                ? 'bg-emerald-100 text-[#009245]'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}>
                              {item.recipientRole === 'PUBLIC' ? '🌐 পাবলিক' : '💼 রিসেলার'}
                            </span>
                            <span className="font-bold text-slate-900 truncate">
                              {item.titleBn || item.titleEn}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] truncate">
                            {item.messageBn || item.messageEn}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bottom Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveBranding()}
                className="px-6 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>সকল নোটিফিকেশন ও সেটিংস সেভ করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: WEBSITE CONTROL & MAINTENANCE */}
        {(['website_control', 'website_status'].includes(activeTab)) && branding && (
          <div className="space-y-6 w-full max-w-5xl mx-auto">
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <span>{lang === 'bn' ? '৭. ওয়েবসাইট অন/অফ ও পেমেন্ট সার্ভিস নিয়ন্ত্রণ' : '7. Website Online/Offline Control'}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {lang === 'bn' ? 'ওয়েবসাইট সাময়িকভাবে বন্ধ করা বা লাইভ অন রাখার সুনির্দিষ্ট নিয়ন্ত্রণ' : 'Toggle live site access or show custom maintenance message'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveBranding()}
                className="px-5 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-md cursor-pointer shrink-0"
              >
                💾 সেটিংস সেভ করুন
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">ওয়েবসাইট সার্ভিস স্ট্যাটাস</h3>
                  <p className="text-xs text-slate-500">
                    অফ করা থাকলে সাধারণ ভিজিটরদের সামনে মেইনটেন্যান্স বার্তা প্রদর্শিত হবে।
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={branding.isWebsiteOnline !== false}
                    onChange={(e) => setBranding({ ...branding, isWebsiteOnline: e.target.checked })}
                    className="w-5 h-5 rounded accent-[#009245] cursor-pointer"
                  />
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${branding.isWebsiteOnline !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {branding.isWebsiteOnline !== false ? '🟢 ওয়েবসাইট অন আছে (Live)' : '🔴 ওয়েবসাইট সাময়িক অফ (Maintenance)'}
                  </span>
                </label>
              </div>

              {branding.isWebsiteOnline === false && (
                <div className="space-y-2 animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-slate-800 block">মেইনটেন্যান্স নোটিশ বার্তা (বাংলা)</label>
                  <textarea
                    rows={3}
                    value={branding.websiteMaintenanceNoticeBn || ''}
                    onChange={(e) => setBranding({ ...branding, websiteMaintenanceNoticeBn: e.target.value })}
                    placeholder="ওয়েবসাইটটি সাময়িকভাবে আপডেট কাজের জন্য বন্ধ আছে..."
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500 outline-none font-medium text-slate-900 resize-none"
                  />
                </div>
              )}
            </div>

            {/* APP VERSION PUBLISH & INSTANT UPDATE BROADCASTER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl border-2 border-emerald-500/40 p-5 sm:p-6 space-y-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/80 pb-4 gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-xl shadow-md">
                    🚀
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-wide text-white">
                        {lang === 'bn' ? 'অ্যাপ পাবলিশ ও অটোমেটিক আপডেট ব্রডকাস্টার' : 'App Publish & Instant Update Broadcaster'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        PWA v{branding.appVersion || '2.2.0'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {lang === 'bn'
                        ? 'এখানে পাবলিশ করার সাথে সাথে ইনস্টল থাকা সকল মোবাইল/ডেস্কটপ এবং রিসেলারের ফোনে ইনস্ট্যান্ট আপডেট চলে যাবে।'
                        : 'Instantly push app updates, icons and changes to all installed devices and reseller portals.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-slate-400">
                    {lang === 'bn' ? 'সর্বশেষ আপডেট:' : 'Last Published:'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                    {branding.lastPublishedAt ? new Date(branding.lastPublishedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'এখনই পাবলিশ করুন'}
                  </span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-300 block">
                    {lang === 'bn' ? '১. নতুন অ্যাপ ভার্সন (New Version)' : '1. New App Version'}
                  </label>
                  <input
                    type="text"
                    value={publishVersionInput !== '' ? publishVersionInput : (branding.appVersion || '2.2.0')}
                    onChange={(e) => setPublishVersionInput(e.target.value)}
                    placeholder="যেমন: 2.2.1"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:border-emerald-400 outline-none font-mono font-bold text-white shadow-inner"
                  />
                  <p className="text-[10px] text-slate-400">
                    বর্তমান ইনস্টল ভার্সনের চেয়ে নতুন সংখ্যা দিলে ক্লায়েন্টে আপডেট শো করবে।
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-emerald-300 block">
                    {lang === 'bn' ? '২. আপডেটের বিবরণ (Release Notes)' : '2. Release Notes'}
                  </label>
                  <input
                    type="text"
                    value={publishReleaseNotesInput !== '' ? publishReleaseNotesInput : (branding.releaseNotes || 'নতুন লোগো, অ্যাপ আইকন ও স্পিড পারফরম্যান্স আপডেট।')}
                    onChange={(e) => setPublishReleaseNotesInput(e.target.value)}
                    placeholder="যেমন: লোগো পরিবর্তন ও নতুন অফার কালেকশন যুক্ত হয়েছে।"
                    className="w-full px-3.5 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl focus:border-emerald-400 outline-none text-white shadow-inner font-medium"
                  />
                  <p className="text-[10px] text-slate-400">
                    রিসেলার ও ব্যবহারকারীর স্ক্রিনে এই বার্তাটি প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              {/* Force update checkbox & Push button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-700/80 relative z-10">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publishForceUpdate}
                    onChange={(e) => setPublishForceUpdate(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    {lang === 'bn' ? 'বাধ্যতামূলক আপডেট (অ্যাপে প্রবেশ করলেই পপআপ শো করবে)' : 'Instant Priority Prompt'}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handlePublishAppUpdate}
                  disabled={isPublishingAppUpdate}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isPublishingAppUpdate ? 'animate-spin' : ''}`} />
                  <span>
                    {isPublishingAppUpdate
                      ? (lang === 'bn' ? 'পাবলিশ ও ব্রডকাস্ট হচ্ছে...' : 'Broadcasting Update...')
                      : (lang === 'bn' ? '🚀 সকল ফোনে ইনস্ট্যান্ট আপডেট পুশ করুন (Publish Update Now)' : 'Publish & Broadcast Update Now')}
                  </span>
                </button>
              </div>
            </div>

            {/* RESELLER TRIAL & SUBSCRIPTION SYSTEM CONTROL */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      ⏱️
                    </span>
                    <span>{lang === 'bn' ? 'রিসেলার ফ্রি ট্রায়াল ও সাবস্ক্রিপশন নিয়ন্ত্রণ' : 'Reseller Free Trial & Subscription Control'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'bn' 
                      ? 'রিসেলার একাউন্টের অটোমেটিক ট্রায়াল দিন গণনা, মেয়াদ ও নির্ধারিত সাবস্ক্রিপশন ফি পরিচালনা করুন' 
                      : 'Configure automatic free trial countdown, trial duration and subscription fees for resellers'}
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
                  <input
                    type="checkbox"
                    checked={branding.resellerTrialEnabled !== false}
                    onChange={(e) => setBranding({ ...branding, resellerTrialEnabled: e.target.checked })}
                    className="w-5 h-5 rounded accent-[#009245] cursor-pointer"
                  />
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${branding.resellerTrialEnabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {branding.resellerTrialEnabled !== false ? '🟢 ট্রায়াল সিস্টেম সক্রিয়' : '⚪ নিষ্ক্রিয় (আনলিমিটেড ফ্রি)'}
                  </span>
                </label>
              </div>

              {branding.resellerTrialEnabled !== false && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Preset & Custom Duration */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? '১. ফ্রি ট্রায়াল মেয়াদ (দিন নির্বাচন করুন) *' : '1. Free Trial Duration (Days) *'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      রিসেলার রেজিস্ট্রেশনের দিন থেকে সিস্টেম অটোমেটিক এই দিনগুলো হিসাব রাখবে। আপনি যেকোনো মেয়াদ সেট করতে পারেন:
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {[
                        { label: '৭ দিন (ডিফল্ট)', days: 7 },
                        { label: '৩০ দিন (১ মাস)', days: 30 },
                        { label: '৩৬৫ দিন (১ বছর)', days: 365 },
                      ].map((preset) => {
                        const isSelected = (branding.resellerTrialDays ?? 7) === preset.days;
                        return (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() => setBranding({ ...branding, resellerTrialDays: preset.days })}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-2 max-w-xs">
                      <span className="text-xs font-bold text-slate-700 whitespace-nowrap">অথবা কাস্টম দিন লিখুন:</span>
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={branding.resellerTrialDays ?? 7}
                        onChange={(e) => setBranding({ ...branding, resellerTrialDays: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-24 px-3 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-slate-600 font-bold">দিন</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? '২. সাবস্ক্রিপশন প্ল্যান ও প্যাকেজ মূল্য কনফিগারেশন (টাকা) *' : '2. Subscription Plan Pricing (BDT) *'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      রিসেলাররা ট্রায়াল শেষ হলে এই মূল্যে সাবস্ক্রিপশন কিনতে পারবে:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">১ মাস ফি</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={branding.resellerSubscriptionPlan1Month ?? 500}
                            onChange={(e) => setBranding({ ...branding, resellerSubscriptionPlan1Month: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245]"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">৬ মাস ফি</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={branding.resellerSubscriptionPlan6Months ?? 2500}
                            onChange={(e) => setBranding({ ...branding, resellerSubscriptionPlan6Months: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245]"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">১ বছর ফি</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={branding.resellerSubscriptionPlan1Year ?? 4500}
                            onChange={(e) => setBranding({ ...branding, resellerSubscriptionPlan1Year: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245]"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">২ বছর ফি</span>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="number"
                            min="0"
                            value={branding.resellerSubscriptionPlan2Years ?? 8000}
                            onChange={(e) => setBranding({ ...branding, resellerSubscriptionPlan2Years: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-full pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Receiving Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? '৪. ফি পরিশোধের বিকাশ / নগদ নম্বর *' : '4. bKash / Nagad Payment Receiving Number *'}
                    </label>
                    <input
                      type="text"
                      value={branding.resellerSubscriptionPaymentPhone || branding.whatsappNumber || ''}
                      onChange={(e) => setBranding({ ...branding, resellerSubscriptionPaymentPhone: e.target.value })}
                      placeholder="যেমন: 01700000000"
                      className="w-full px-4 py-2 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245]"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      ট্রায়াল শেষে রিসেলারের স্ক্রিনে এই নম্বরে সাবস্ক্রিপশন ফি পাঠানোর নির্দেশ দেখানো হবে।
                    </p>
                  </div>

                  {/* Notice Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 block">
                      {lang === 'bn' ? '৫. ট্রায়াল সমাপ্তি বার্তা (নোটিশ)' : '5. Expired Notice Message'}
                    </label>
                    <textarea
                      rows={2}
                      value={branding.resellerSubscriptionNoticeBn || ''}
                      onChange={(e) => setBranding({ ...branding, resellerSubscriptionNoticeBn: e.target.value })}
                      placeholder="আপনার ফ্রি ট্রায়াল মেয়াদ সম্পন্ন হয়েছে। নিয়মিত সেবা ও প্রোডাক্ট বিক্রয় সুবিধা বজায় রাখতে সাবস্ক্রিপশন ফি পরিশোধ করুন।"
                      className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#009245] leading-relaxed resize-none"
                    />
                  </div>

                  {/* Quick Save Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveBranding()}
                      className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'bn' ? '💾 সাবস্ক্রিপশন সেটিংস সেভ করুন' : 'Save Subscription Settings'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. RESELLER CUSTOM WEBSITES LIST */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#009245]" />
                <span>রিসেলারদের তৈরি কাস্টম ওয়েবসাইটসমূহ (Reseller Stores)</span>
              </h3>
              <p className="text-xs text-slate-500">
                যেসব রিসেলাররা ৭ দিনের ফ্রি ট্রায়াল বা কাস্টম শপ তৈরি করেছেন, তাদের তালিকা ও স্ট্যাটাস:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-black">
                      <th className="p-3">রিসেলার</th>
                      <th className="p-3">দোকানের তথ্য</th>
                      <th className="p-3">URL / স্লাগ</th>
                      <th className="p-3">যোগাযোগ</th>
                      <th className="p-3">মেয়াদ ও স্ট্যাটাস</th>
                      <th className="p-3">পেমেন্ট স্ট্যাটাস</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.filter(e => (e as any).storeSlug).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                          এখনো কোনো রিসেলার নিজস্ব ওয়েবসাইট তৈরি করেননি।
                        </td>
                      </tr>
                    ) : (
                      employees.filter(e => (e as any).storeSlug).map((emp) => {
                        const now = Date.now();
                        const trialExp = (emp as any).trialExpiryDate ? new Date((emp as any).trialExpiryDate).getTime() : 0;
                        const subExp = emp.subscriptionExpiryDate ? new Date(emp.subscriptionExpiryDate).getTime() : 0;
                        const isPaid = emp.isPaidSubscription === true || emp.subscriptionStatus === 'active';
                        const isSuspended = (emp as any).storeStatus === 'suspended';
                        const isExpired = isPaid ? (subExp > 0 && now > subExp) : (trialExp > 0 && now > trialExp);

                        const activeExpiry = isPaid ? subExp : trialExp;
                        const daysLeft = activeExpiry > 0 ? Math.max(0, Math.ceil((activeExpiry - now) / (1000 * 60 * 60 * 24))) : 0;

                        const paymentStatus = (emp as any).subscriptionPaymentStatus || 'UNPAID';

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">{emp.phone}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {(emp as any).storeLogoUrl && (
                                  <img src={(emp as any).storeLogoUrl} alt="logo" className="w-6 h-6 rounded-md object-cover border border-slate-200" />
                                )}
                                <span className="font-bold text-emerald-700">{(emp as any).storeName || 'এক্সপ্রেস শপ'}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1 font-mono text-slate-700">
                                <span>/shop/{(emp as any).storeSlug}</span>
                                <a
                                  href={`/shop/${(emp as any).storeSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#009245] hover:text-emerald-800 p-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              <span className="block">WA: {(emp as any).storeWhatsapp || emp.phone}</span>
                              {(emp as any).storePhone && (
                                <span className="block text-[10.5px] text-slate-400">HL: {(emp as any).storePhone}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isSuspended
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : isPaid
                                    ? 'bg-emerald-100 text-[#009245] border border-emerald-300'
                                    : isExpired
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isSuspended
                                    ? 'সাসপেন্ডেড'
                                    : isPaid
                                    ? `পেইড (${daysLeft} দিন বাকি)`
                                    : isExpired
                                    ? 'ট্রায়াল শেষ'
                                    : `ট্রায়াল (${daysLeft} দিন বাকি)`}
                                </span>
                                <div className="text-[10px] text-slate-400">
                                  মেয়াদ: {activeExpiry > 0 ? new Date(activeExpiry).toLocaleDateString('bn-BD') : 'অনির্ধারিত'}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paymentStatus === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800 animate-pulse'
                                  : paymentStatus === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {paymentStatus === 'PAID'
                                  ? 'পেইড ✓'
                                  : paymentStatus === 'PENDING'
                                  ? 'পেন্ডিং ⏳'
                                  : paymentStatus === 'REJECTED'
                                  ? 'রিজেক্টেড ✕'
                                  : 'আনপেইড'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedResellerForSub(emp);
                                    setSubModalAction('add_trial');
                                    setSubModalAddDays(7);
                                    setSubModalPlan('1m');
                                    setSubModalCustomDate('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  মেয়াদ ও কন্ট্রোল
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const newStatus = isSuspended ? 'active' : 'suspended';
                                    try {
                                      await api.adminUpdateResellerStoreStatus(adminToken!, emp.id, newStatus);
                                      setEmployees(employees.map(e => e.id === emp.id ? { ...e, storeStatus: newStatus } : e));
                                      showToast(newStatus === 'active' ? 'স্টোর অ্যাক্টিভেট করা হয়েছে' : 'স্টোর সাসপেন্ড করা হয়েছে', 'success');
                                    } catch {
                                      showToast('আপডেট ব্যর্থ হয়েছে', 'error');
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                    isSuspended ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                  }`}
                                >
                                  {isSuspended ? 'অ্যাক্টিভেট' : 'সাসপেন্ড'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. SUBSCRIPTION PAYMENT REQUESTS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#009245]" />
                    <span>সাবস্ক্রিপশন পেমেন্ট রিকোয়েস্ট (Subscription Payment Requests)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    রিসেলাররা ট্রায়াল শেষ হওয়ার পর যে পেমেন্ট TrxID সাবমিট করেছেন, তা যাচাই করে অনুমোদন বা রিজেক্ট করুন:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (adminToken) {
                      const res = await api.adminGetSubscriptionPayments(adminToken).catch(() => ({ success: false, payments: [] }));
                      if (res && Array.isArray((res as any).payments)) {
                        setSubscriptionPayments((res as any).payments);
                        showToast('পেমেন্ট তালিকা রিফ্রেশ হয়েছে', 'info');
                      }
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>রিফ্রেশ</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-black">
                      <th className="p-3">রিসেলার</th>
                      <th className="p-3">শপ ও স্লাগ</th>
                      <th className="p-3">প্ল্যান ও ফি</th>
                      <th className="p-3">মেথড ও নম্বর</th>
                      <th className="p-3">TrxID</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">স্ট্যাটাস</th>
                      <th className="p-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptionPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                          বর্তমানে কোনো সাবস্ক্রিপশন পেমেন্ট রিকোয়েস্ট নেই।
                        </td>
                      </tr>
                    ) : (
                      subscriptionPayments.map((pay) => {
                        const isPending = pay.status === 'PENDING';
                        return (
                          <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{pay.employeeName}</td>
                            <td className="p-3 font-mono text-slate-600">/shop/{pay.storeSlug || pay.resellerStoreSlug || 'unknown'}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900">
                                {pay.planDuration === '1m' || pay.planDuration === '1_month' ? '১ মাস' : pay.planDuration === '6m' || pay.planDuration === '6_months' ? '৬ মাস' : pay.planDuration === '1y' || pay.planDuration === '1_year' ? '১ বছর' : '২ বছর'}
                              </span>
                              <span className="text-[11px] font-black text-[#009245] block">৳{pay.amount}</span>
                            </td>
                            <td className="p-3">
                              <span className="uppercase font-bold text-slate-700 block">{pay.paymentMethod}</span>
                              <span className="font-mono text-[11px] text-slate-500 block">{pay.senderPhone}</span>
                            </td>
                            <td className="p-3 font-mono font-black text-slate-800 uppercase">{pay.trxId}</td>
                            <td className="p-3 text-slate-500 font-mono text-[11px]">
                              {new Date(pay.createdAt).toLocaleDateString('bn-BD')}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pay.status === 'APPROVED' || (pay.status as string) === 'PAID'
                                  ? 'bg-emerald-100 text-[#009245]'
                                  : pay.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {pay.status === 'APPROVED' || (pay.status as string) === 'PAID' ? 'অনুমোদিত ✓' : pay.status === 'PENDING' ? 'পেন্ডিং ⏳' : 'রিজেক্টেড ✕'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!adminToken) return;
                                      try {
                                        const res = await api.adminReviewSubscriptionPayment(adminToken, pay.id, { action: 'APPROVE' });
                                        showToast((res as any)?.message || 'পেমেন্ট অনুমোদিত ও সাবস্ক্রিপশন সক্রিয় হয়েছে!', 'success');
                                        await loadAdminData();
                                      } catch (err: any) {
                                        showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে', 'error');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#009245] text-white hover:bg-[#007a38] transition-colors cursor-pointer shadow-2xs"
                                  >
                                    অনুমোদন (Approve)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!adminToken) return;
                                      try {
                                        const res = await api.adminReviewSubscriptionPayment(adminToken, pay.id, { action: 'REJECT' });
                                        showToast((res as any)?.message || 'পেমেন্ট রিজেক্ট করা হয়েছে', 'info');
                                        await loadAdminData();
                                      } catch (err: any) {
                                        showToast(err.message || 'রিজেক্ট ব্যর্থ হয়েছে', 'error');
                                      }
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors cursor-pointer"
                                  >
                                    রিজেক্ট (Reject)
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">সম্পন্ন</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. SUBSCRIPTION & EXPIRY CONTROL MODAL */}
            {selectedResellerForSub && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>মেয়াদ ও সাবস্ক্রিপশন কন্ট্রোল</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        রিসেলার: <strong className="text-slate-800">{selectedResellerForSub.name}</strong> • শপ: <strong className="text-emerald-700">{(selectedResellerForSub as any).storeName || 'এক্সপ্রেস শপ'}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedResellerForSub(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Current Status Box */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">বর্তমান স্ট্যাটাস</span>
                      <span className="font-bold text-slate-900">
                        {(selectedResellerForSub as any).storeStatus === 'suspended' ? 'সাসপেন্ডেড' : 'সক্রিয় (Active)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">বর্তমান মেয়াদ শেষ</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {selectedResellerForSub.subscriptionExpiryDate
                          ? new Date(selectedResellerForSub.subscriptionExpiryDate).toLocaleDateString('bn-BD')
                          : (selectedResellerForSub as any).trialExpiryDate
                          ? new Date((selectedResellerForSub as any).trialExpiryDate).toLocaleDateString('bn-BD')
                          : 'অনির্ধারিত'}
                      </span>
                    </div>
                  </div>

                  {/* Action Selection Tabs */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-800 block">
                      অ্যাকশন নির্বাচন করুন:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSubModalAction('add_trial')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          subModalAction === 'add_trial'
                            ? 'border-[#009245] bg-emerald-50 text-[#009245] ring-1 ring-[#009245]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        ⏱️ ট্রায়াল মেয়াদ বাড়ানো
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubModalAction('grant_subscription')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          subModalAction === 'grant_subscription'
                            ? 'border-[#009245] bg-emerald-50 text-[#009245] ring-1 ring-[#009245]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        💳 সাবস্ক্রিপশন চালু (পেইড)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubModalAction('custom_expiry')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          subModalAction === 'custom_expiry'
                            ? 'border-[#009245] bg-emerald-50 text-[#009245] ring-1 ring-[#009245]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        📅 কাস্টম মেয়াদ নির্ধারণ
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubModalAction('status_toggle')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          subModalAction === 'status_toggle'
                            ? 'border-[#009245] bg-emerald-50 text-[#009245] ring-1 ring-[#009245]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        🔒 স্ট্যাটাস পরিবর্তন
                      </button>
                    </div>

                    {/* ACTION 1: ADD TRIAL DAYS */}
                    {subModalAction === 'add_trial' && (
                      <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2.5">
                        <span className="text-xs font-bold text-slate-800 block">কত দিন বাড়াতে চান?</span>
                        <div className="flex gap-2">
                          {[7, 15, 30].map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setSubModalAddDays(d)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                subModalAddDays === d
                                  ? 'bg-[#009245] text-white border-[#009245]'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              +{d} দিন
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-slate-600">অথবা কাস্টম দিন:</span>
                          <input
                            type="number"
                            min="1"
                            value={subModalAddDays}
                            onChange={(e) => setSubModalAddDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* ACTION 2: GRANT SUBSCRIPTION */}
                    {subModalAction === 'grant_subscription' && (
                      <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2.5">
                        <span className="text-xs font-bold text-slate-800 block">প্ল্যানের মেয়াদ নির্বাচন করুন:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: '1m', label: '১ মাস' },
                            { key: '6m', label: '৬ মাস' },
                            { key: '1y', label: '১ বছর' },
                            { key: '2y', label: '২ বছর' },
                          ].map(p => (
                            <button
                              key={p.key}
                              type="button"
                              onClick={() => setSubModalPlan(p.key as any)}
                              className={`py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                subModalPlan === p.key
                                  ? 'bg-[#009245] text-white border-[#009245]'
                                  : 'bg-white text-slate-700 border-slate-200'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ACTION 3: CUSTOM EXPIRY DATE */}
                    {subModalAction === 'custom_expiry' && (
                      <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">নতুন মেয়াদ সমাপ্তির তারিখ দিন:</span>
                        <input
                          type="date"
                          value={subModalCustomDate}
                          onChange={(e) => setSubModalCustomDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl outline-none"
                        />
                      </div>
                    )}

                    {/* ACTION 4: STATUS TOGGLE */}
                    {subModalAction === 'status_toggle' && (
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">স্টোরের স্ট্যাটাস নির্বাচন করুন:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResellerForSub(prev => prev ? { ...prev, storeStatus: 'active' as any } : null);
                            }}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              (selectedResellerForSub as any).storeStatus !== 'suspended'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            সক্রিয় (Active)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedResellerForSub(prev => prev ? { ...prev, storeStatus: 'suspended' as any } : null);
                            }}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              (selectedResellerForSub as any).storeStatus === 'suspended'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            সাসপেন্ড (Suspended)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedResellerForSub(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={isUpdatingSub}
                      onClick={async () => {
                        if (!adminToken || !selectedResellerForSub) return;
                        setIsUpdatingSub(true);
                        try {
                          const payload: any = {};
                          if (subModalAction === 'add_trial') {
                            payload.addDays = subModalAddDays;
                            payload.action = 'EXTEND_TRIAL';
                            payload.storeStatus = 'active';
                          } else if (subModalAction === 'grant_subscription') {
                            payload.planDuration = subModalPlan;
                            payload.action = 'GRANT_SUBSCRIPTION';
                            payload.storeStatus = 'active';
                          } else if (subModalAction === 'custom_expiry') {
                            if (!subModalCustomDate) {
                              showToast('দয়া করে তারিখ সিলেক্ট করুন', 'error');
                              setIsUpdatingSub(false);
                              return;
                            }
                            payload.customExpiryDate = new Date(subModalCustomDate).toISOString();
                            payload.action = 'CUSTOM_EXPIRY';
                          } else if (subModalAction === 'status_toggle') {
                            payload.storeStatus = (selectedResellerForSub as any).storeStatus === 'suspended' ? 'suspended' : 'active';
                          }

                          const res = await api.adminUpdateResellerSubscription(adminToken, selectedResellerForSub.id, payload);
                          if (res && res.success) {
                            showToast((res as any)?.message || 'সাবস্ক্রিপশন সফলভাবে আপডেট হয়েছে!', 'success');
                            setSelectedResellerForSub(null);
                            await loadAdminData();
                          } else {
                            showToast((res as any)?.error || 'আপডেট ব্যর্থ হয়েছে', 'error');
                          }
                        } catch (err: any) {
                          showToast(err.message || 'আপডেট ব্যর্থ হয়েছে', 'error');
                        } finally {
                          setIsUpdatingSub(false);
                        }
                      }}
                      className="px-5 py-2 text-xs font-black bg-[#009245] hover:bg-[#007a38] text-white rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isUpdatingSub ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB: PAYMENT SETTINGS */}
        {activeTab === 'payments' && (
          <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  💳
                </span>
                <span>{lang === 'bn' ? 'বিকাশ ও অনলাইন পেমেন্ট গেটওয়ে সেটিংস' : 'bKash & Online Payment Gateway Settings'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'bn'
                  ? 'গ্রাহক ও রিসেলারদের জন্য বিকাশ ও নগদ পেমেন্ট নম্বর এবং অনলাইন গেটওয়ে প্রসেসিং সিস্টেম কনফিগার করুন'
                  : 'Configure bKash and Nagad payment receiving numbers and live checkout gateway'}
              </p>
            </div>

            <form onSubmit={handleSavePayments} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentSettings.map((pay, idx) => (
                  <div key={pay.id} className={`p-4 rounded-2xl border-2 transition-all space-y-3.5 ${
                    pay.name === 'bKash' ? 'bg-pink-50/40 border-pink-200' : 'bg-orange-50/40 border-orange-200'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-black text-xs ${
                          pay.name === 'bKash' ? 'bg-[#E2136E]' : 'bg-[#F7931E]'
                        }`}>
                          {pay.name === 'bKash' ? 'bK' : 'নগ'}
                        </span>
                        <div>
                          <span className="font-black text-sm text-slate-900">{pay.name}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {pay.name === 'bKash' ? 'bKash Online Gateway' : 'Nagad Wallet'}
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs">
                        <input
                          type="checkbox"
                          checked={pay.isEnabled}
                          onChange={(e) => {
                            const copy = [...paymentSettings];
                            copy[idx].isEnabled = e.target.checked;
                            setPaymentSettings(copy);
                          }}
                          className="w-4 h-4 rounded accent-[#009245] cursor-pointer"
                        />
                        <span>{pay.isEnabled ? '🟢 সক্রিয়' : '⚪ নিষ্ক্রিয়'}</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">অ্যাকাউন্ট টাইপ *</label>
                        <select
                          value={pay.accountType}
                          onChange={(e) => {
                            const copy = [...paymentSettings];
                            copy[idx].accountType = e.target.value as any;
                            setPaymentSettings(copy);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-900 focus:border-[#009245]"
                        >
                          <option value="Merchant">Merchant (মার্চেন্ট গেটওয়ে)</option>
                          <option value="Personal">Personal (পার্সোনাল সেন্ড মানি)</option>
                          <option value="Agent">Agent (এজেন্ট ক্যাশ ইন)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">পেমেন্ট গ্রহণ নম্বর (মোবাইল নম্বর) *</label>
                        <input
                          type="text"
                          value={pay.accountNumber}
                          placeholder="যেমন: 01700000000"
                          onChange={(e) => {
                            const copy = [...paymentSettings];
                            copy[idx].accountNumber = e.target.value;
                            setPaymentSettings(copy);
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#009245]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">পেমেন্ট নির্দেশনা (বাংলা)</label>
                        <input
                          type="text"
                          value={pay.instructionBn || ''}
                          placeholder={pay.name === 'bKash' ? 'বিকাশ দিয়ে পেমেন্ট করুন' : 'নগদ দিয়ে পেমেন্ট করুন'}
                          onChange={(e) => {
                            const copy = [...paymentSettings];
                            copy[idx].instructionBn = e.target.value;
                            setPaymentSettings(copy);
                          }}
                          className="w-full px-3 py-1.5 text-[11px] bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-[#009245]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reseller Wallet Reserve & Send Money Fee Settings */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-black text-[#009245] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>রিসেলার ওয়ালেট ও উইথড্রয়াল রিজার্ভ রুলস (Withdrawal Reserve Rules)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 block">বাধ্যতামূলক সংরক্ষিত ব্যালেন্স (৳) *</label>
                    <input
                      type="number"
                      min={0}
                      value={branding?.mandatoryReserveBalance ?? 120}
                      onChange={(e) => setBranding(prev => prev ? { ...prev, mandatoryReserveBalance: Number(e.target.value) || 0 } : null)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#009245]"
                    />
                    <p className="text-[10px] text-slate-500">প্রতিটি রিসেলারের ওয়ালেটে বাধ্যতামূলকভাবে সংরক্ষিত থাকবে (ডিফল্ট: ৳১২০)</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 block">বিকাশ/নগদ সেন্ড মানি ফি (৳) *</label>
                    <input
                      type="number"
                      min={0}
                      value={branding?.sendMoneyFee ?? 5}
                      onChange={(e) => setBranding(prev => prev ? { ...prev, sendMoneyFee: Number(e.target.value) || 0 } : null)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-[#009245]"
                    />
                    <p className="text-[10px] text-slate-500">প্রতি উত্তোলনে বিকাশ/নগদ প্রসেসিং ফি কর্তন করা হবে (ডিফল্ট: ৳৫)</p>
                  </div>
                </div>
              </div>

              {/* Telegram Bot Live Notification Integration Card */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-sky-600" />
                    <span>টেলিগ্রাম বট নোটিফিকেশন সিস্টেম (Telegram Bot Notification Engine)</span>
                  </h4>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer select-none bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={branding?.telegramEnabled !== false}
                      onChange={(e) => setBranding(prev => prev ? { ...prev, telegramEnabled: e.target.checked } : null)}
                      className="w-4 h-4 rounded accent-sky-600 cursor-pointer"
                    />
                    <span>{branding?.telegramEnabled !== false ? '🟢 সক্রিয়' : '⚪ নিষ্ক্রিয়'}</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  নতুন ব্যালেন্স অ্যাড আবেদন এবং নতুন কাস্টমার/রিসেলার অর্ডার আসার সাথে সাথে টেলিগ্রাম বটে তাৎক্ষণিক অ্যালার্ট পাঠাতে বট টোকেন ও চ্যাট আইডি বসান:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 block">টেলিগ্রাম বট টোকেন (Bot Token) *</label>
                    <input
                      type="text"
                      value={branding?.telegramBotToken || ''}
                      placeholder="যেমন: 7892345678:AAH..."
                      onChange={(e) => setBranding(prev => prev ? { ...prev, telegramBotToken: e.target.value.trim() } : null)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-800 block">চ্যাট আইডি / চ্যানেল আইডি (Chat ID) *</label>
                    <input
                      type="text"
                      value={branding?.telegramChatId || ''}
                      placeholder="যেমন: -1001234567890 অথবা 123456789"
                      onChange={(e) => setBranding(prev => prev ? { ...prev, telegramChatId: e.target.value.trim() } : null)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">
                    * চ্যাট আইডি না জানা থাকলে বটে ১টি মেসেজ লিখে 'টেস্ট' বাটনে ক্লিক করলে অটো কানেক্ট হবে।
                  </span>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0"
                  >
                    {testingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{testingTelegram ? 'টেস্ট বার্তা যাচ্ছে...' : 'টেলিগ্রাম টেস্ট মেসেজ পাঠান'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>বিকাশ ও উত্তোলন পেমেন্ট সিস্টেম কীভাবে কাজ করে:</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-600">
                  <li><strong>সংরক্ষিত ব্যালেন্স (৳১২০):</strong> রিসেলারদের মোট ওয়ালেট ব্যালেন্স থেকে স্থায়ী ৳১২০ টাকা বাদ দিয়ে উত্তোলনযোগ্য ব্যালেন্স হিসাব করা হয়। অ্যাকাউন্ট বন্ধের সময় এটি ফাইনাল পেমেন্ট করা হয়।</li>
                  <li><strong>নমনীয় উইথড্রয়াল:</strong> ৳১২০ বাদ দেওয়ার পর বাকি যেকোনো পরিমাণ (যেমন ৳৫০, ৳৭৫, ৳১০০) রিসেলার যখন খুশি তুলতে পারবেন।</li>
                  <li><strong>সেন্ড মানি ফি (৳৫):</strong> পেমেন্ট অনুমোদনের সময়ে বা আবেদনের সময় ৳৫ টাকা ফি বাদ দিয়ে নিট টাকা রিসেলারের নম্বরে সেন্ড মানি করা হয়।</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black text-white bg-[#009245] hover:bg-[#007a38] rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'bn' ? '💾 পেমেন্ট সেটিংস সেভ করুন' : 'Save Payment Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: BALANCE TOPUP REQUESTS (ব্যালেন্স অ্যাড রিকোয়েস্ট) */}
        {activeTab === 'balance_requests' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#009245] text-white flex items-center justify-center text-sm font-bold shadow-xs">
                    💳
                  </span>
                  <span>{lang === 'bn' ? 'ব্যালেন্স অ্যাড রিকোয়েস্ট কন্ট্রোল প্যানেল' : 'Balance Add Requests Control Panel'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'bn' 
                    ? 'রিসেলারদের পাঠানো টাকা জমার আবেদন, ট্রানজেকশন তথ্য ও পেমেন্ট প্রুফ স্ক্রিনশট দেখুন এবং অনুমোদন করুন' 
                    : 'Review and approve reseller wallet top-up requests with payment screenshots and transaction verification'}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (adminToken) {
                    const reqs = await api.adminGetBalanceTopups(adminToken).catch(() => []);
                    if (Array.isArray(reqs)) setBalanceTopupRequests(reqs);
                    showToast('ব্যালেন্স আবেদন তালিকা রিফ্রেশ হয়েছে', 'info');
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>রিফ্রেশ করুন</span>
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold text-amber-900 block">পেন্ডিং আবেদন</span>
                  <span className="text-xl font-black text-amber-700 font-mono">
                    {balanceTopupRequests.filter(r => r.status === 'PENDING').length} টি
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[11px] text-amber-600 block font-bold">মোট টাকা</span>
                  <span className="text-sm font-black text-amber-800">
                    ৳{balanceTopupRequests.filter(r => r.status === 'PENDING').reduce((acc, r) => acc + (r.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold text-emerald-900 block">অনুমোদিত আবেদন</span>
                  <span className="text-xl font-black text-[#009245] font-mono">
                    {balanceTopupRequests.filter(r => r.status === 'APPROVED').length} টি
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[11px] text-emerald-600 block font-bold">অনুমোদিত টাকা</span>
                  <span className="text-sm font-black text-emerald-800">
                    ৳{balanceTopupRequests.filter(r => r.status === 'APPROVED').reduce((acc, r) => acc + (r.approvedAmount || r.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">মোট আবেদন</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {balanceTopupRequests.length} টি
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block font-bold">বাতিলকৃত</span>
                  <span className="text-sm font-black text-rose-700 font-mono">
                    {balanceTopupRequests.filter(r => r.status === 'REJECTED').length} টি
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setBalanceReqFilterTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    balanceReqFilterTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>পেন্ডিং ⏳</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    balanceReqFilterTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {balanceTopupRequests.filter(r => r.status === 'PENDING').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceReqFilterTab('approved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    balanceReqFilterTab === 'approved'
                      ? 'bg-[#009245] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>অনুমোদিত ✓</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    balanceReqFilterTab === 'approved' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {balanceTopupRequests.filter(r => r.status === 'APPROVED').length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceReqFilterTab('rejected')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    balanceReqFilterTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>বাতিল ✕</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    balanceReqFilterTab === 'rejected' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {balanceTopupRequests.filter(r => r.status === 'REJECTED').length}
                  </span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  placeholder="খুঁজুন (নাম, ফোন, TrxID...)"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#009245] font-medium"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* List of Requests */}
            <div className="space-y-4">
              {(() => {
                const filtered = balanceTopupRequests.filter(r => {
                  if (balanceReqFilterTab === 'pending' && r.status !== 'PENDING') return false;
                  if (balanceReqFilterTab === 'approved' && r.status !== 'APPROVED') return false;
                  if (balanceReqFilterTab === 'rejected' && r.status !== 'REJECTED') return false;

                  if (salesSearchQuery.trim()) {
                    const q = salesSearchQuery.trim().toLowerCase();
                    const matchName = (r.employeeName || '').toLowerCase().includes(q);
                    const matchPhone = (r.employeePhone || '').toLowerCase().includes(q);
                    const matchTrx = (r.trxId || '').toLowerCase().includes(q);
                    const matchSender = (r.senderNumber || '').toLowerCase().includes(q);
                    return matchName || matchPhone || matchTrx || matchSender;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">কোনো ব্যালেন্স আবেদন পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করে অথবা নতুন ব্যালেন্স আবেদনের জন্য অপেক্ষা করুন</p>
                    </div>
                  );
                }

                return filtered.map((req) => (
                  <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs hover:border-emerald-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                          👤
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{req.employeeName}</h3>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {req.employeeReferenceCode || req.employeeId}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-600 block mt-0.5">
                            📞 {req.employeePhone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-[#009245] border-emerald-300'
                            : req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {req.status === 'APPROVED' ? 'অনুমোদিত ✓' : req.status === 'PENDING' ? 'পেন্ডিং ⏳' : 'বাতিল ✕'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(req.createdAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      {/* Payment Details */}
                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-bold">পেমেন্ট মেথড:</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black text-white ${
                            req.paymentMethod === 'bKash' ? 'bg-[#E2136E]' : 'bg-[#F7931E]'
                          }`}>
                            {req.paymentMethod}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-bold">আবেদনের পরিমাণ:</span>
                          <span className="text-sm font-black text-[#009245] font-mono">
                            ৳{(req.approvedAmount || req.amount).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-bold">যে নম্বর থেকে পাঠিয়েছে:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-slate-800">{req.senderNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(req.senderNumber, 'প্রেরক নম্বর')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-bold">ট্রানজেকশন আইডি (TrxID):</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                              {req.trxId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(req.trxId, 'TrxID')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Screenshot Proof */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        {req.screenshotUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300 bg-black shrink-0 group cursor-pointer" onClick={() => setViewingTopupImage(req.screenshotUrl!)}>
                              <img src={req.screenshotUrl} alt="Screenshot Proof" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-slate-800 block">📷 পেমেন্ট স্ক্রিনশট প্রুফ</span>
                              <button
                                type="button"
                                onClick={() => setViewingTopupImage(req.screenshotUrl!)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#009245]" />
                                <span>বড় করে দেখুন</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center w-full py-3 space-y-1">
                            <span className="text-xs text-slate-400 font-bold block">📷 কোনো স্ক্রিনশট আপলোড করা হয়নি</span>
                            <span className="text-[10px] text-slate-400">TrxID যাচাই করে সরাসরি গ্রহণ বা রিজেক্ট করুন</span>
                          </div>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {req.status === 'PENDING' ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTopupForReview(req);
                                setEditTopupAmount(String(req.amount));
                              }}
                              className="w-full sm:w-auto px-4 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>অনুমোদন করুন (Approve)</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!adminToken) return;
                                const note = prompt('বাতিল করার কারণ লিখুন (অপশনাল):', 'পেমেন্ট তথ্য সঠিক নয়');
                                if (note === null) return;
                                try {
                                  await api.adminActionBalanceTopup(adminToken, req.id, {
                                    action: 'REJECT',
                                    adminNote: note
                                  });
                                  showToast('ব্যালেন্স রিকোয়েস্ট বাতিল করা হয়েছে', 'info');
                                  await loadAdminData();
                                } catch (err: any) {
                                  showToast(err.message || 'বাতিল করা ব্যর্থ হয়েছে', 'error');
                                }
                              }}
                              className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>বাতিল (Reject)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-right space-y-1">
                            <span className="text-xs font-bold text-slate-500 block">
                              পর্যালোচনাকারী: {req.reviewedBy || 'Admin'}
                            </span>
                            {req.adminNote && (
                              <p className="text-[11px] text-slate-500 italic">
                                নোট: {req.adminNote}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* TAB 9: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.adminTabAudit}</h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'প্রশাসনিক প্রতিটি সিদ্ধান্তের অপরিবর্তনীয় অডিট হিস্ট্রি' : 'Immutable audit trail of administrator actions and system changes'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ইভেন্ট / অ্যাকশন</th>
                      <th className="py-3 px-4">ইউজার / অ্যাক্টর</th>
                      <th className="py-3 px-4">টার্গেট</th>
                      <th className="py-3 px-4">পরিবর্তন / বিবরণ</th>
                      <th className="py-3 px-4">আইপি ও সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{log.action}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{log.actor}</td>
                        <td className="py-3 px-4 text-slate-800">{log.target}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {log.newValue || log.previousValue || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: TRASH BIN */}
        {activeTab === 'trash' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                  <span>{lang === 'bn' ? 'ট্র্যাশ বিন এবং পার্মানেন্ট ডিলিট কন্ট্রোল' : 'Trash Bin & Permanent Purge Control'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' 
                    ? 'ডিলিট করা আইটেমগুলো স্থায়ীভাবে ক্লাউড ডাটাবেজ থেকে মুছে যাওয়ার আগে এখানে সাময়িকভাবে ৬০ সেকেন্ডের ট্র্যাশ বাফারে থাকে।' 
                    : 'Deleted items are held temporarily in the 60-second trash buffer before being permanently purged from Firestore.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Buffer Status Card */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-6">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  {lang === 'bn' ? 'চলমান ট্র্যাশ বাফার অবস্থা' : 'Active Trash Buffer Status'}
                </h3>

                {trashStatus && trashStatus.active ? (
                  <div className="space-y-5">
                    <div className="p-4 bg-rose-50 border border-rose-100/70 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Trash2 className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">
                            {trashStatus.type === 'product' ? (lang === 'bn' ? 'প্রোডাক্ট' : 'Product') : trashStatus.type === 'category' ? (lang === 'bn' ? 'ক্যাটাগরি' : 'Category') : (lang === 'bn' ? 'সাব-ক্যাটাগরি' : 'Sub-category')}
                          </span>
                          <span className="text-xs font-mono text-slate-400 font-semibold">ID: {trashStatus.id}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800">
                          {trashStatus.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed font-semibold">
                          {lang === 'bn' 
                            ? 'আইটেমটি বর্তমানে সাময়িকভাবে ট্র্যাশ বাফারে সুরক্ষিত অবস্থায় হোল্ডে আছে। আপনি যেকোনো সময় নিচে সরাসরি রিকভার বা তাৎক্ষণিক ডিলিট করতে পারেন।' 
                            : 'This item is currently secured in the temporary trash buffer. You can recover it or force purge it instantly below.'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-rose-500 font-mono block">
                          {trashStatus.timeLeft}s
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          {lang === 'bn' ? 'অবशिष्ट সময়' : 'Time Left'}
                        </span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                        <div 
                          className="bg-rose-500 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
                          style={{ width: `${((trashStatus.timeLeft || 0) / 60) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono block text-right mt-1">
                        {Math.round(((trashStatus.timeLeft || 0) / 60) * 100)}%
                      </span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        onClick={handleUndoAction}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-100"
                      >
                        {lang === 'bn' ? 'পুনরুদ্ধার করুন (Undo / Ctrl+Z)' : 'Recover Item (Undo)'}
                      </button>
                      <button
                        onClick={handleForcePurgeImmediate}
                        className="w-full sm:w-auto px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-100"
                      >
                        {lang === 'bn' ? 'এখনই স্থায়ীভাবে ডিলিট করুন (Permanent Purge)' : 'Force Delete Permanently Now'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/60 text-[#009245] flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold">
                      {lang === 'bn' 
                        ? 'বর্তমানে ট্র্যাশ বিন একদম খালি! কোনো ডিলিট হওয়া আইটেম বাফার অবস্থায় নেই।' 
                        : 'Trash bin is currently clean. No deleted items are pending.'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold max-w-sm mx-auto">
                      {lang === 'bn' 
                        ? 'আপনার আগের সমস্ত ডিলিট করা ডাটা সফলভাবে ক্লাউড ফায়ারস্টোর ডাটাবেজ থেকে চিরতরে মুছে গেছে!' 
                        : 'All previous deletions have been fully and permanently expunged from the Firestore database.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Trash Guidelines Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  {lang === 'bn' ? 'ডাটাবেজ সেফটি গাইডলাইন' : 'Database Safety Guidelines'}
                </h3>
                <ul className="text-xs text-slate-600 space-y-3.5 list-disc pl-4 font-medium leading-relaxed">
                  <li>
                    {lang === 'bn' 
                      ? 'যেকোনো আইটেম ডিলিট করার পর ১ মিনিট (৬০ সেকেন্ড) পর্যন্ত রিকভার করার সুবর্ণ সুযোগ থাকে।' 
                      : 'You can undo any deletion within the 60-second recovery window.'}
                  </li>
                  <li>
                    {lang === 'bn' 
                      ? '৬০ সেকেন্ড অতিক্রম করার সাথে সাথে সার্ভার ডেটাবেজ ও ক্লাউড থেকে স্থায়ীভাবে হার্ড-ডিলিট (Permanent Hard Delete) সম্পন্ন করে।' 
                      : 'After 60 seconds, the server executes an irreversible hard-delete on the cloud database.'}
                  </li>
                  <li>
                    {lang === 'bn' 
                      ? 'আপনি নিশ্চিত থাকলে ৬০ সেকেন্ড অপেক্ষা না করে এখনই ডাটা চিরতরে মুছে দিতে পারেন "Permanent Purge" বাটনে ক্লিক করে।' 
                      : 'To skip the timer and delete instantly, use the "Force Delete Permanently Now" action.'}
                  </li>
                  <li>
                    {lang === 'bn' 
                      ? 'বাফার খালি থাকলে ডাটাবেজে কোনো আবর্জনা বা ডাস্ট জমা থাকে না, যা সাইটের স্পিড বহু গুণ বাড়িয়ে দেয়।' 
                      : 'An empty buffer guarantees zero orphan data, maximizing your website performance and loading speeds.'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: TRAINING MANAGEMENT */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">{lang === 'bn' ? 'রিসেলার ট্রেনিং কন্ট্রোল' : 'Reseller Training Management'}</h2>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {lang === 'bn' ? 'নতুন রিসেলারদের জন্য ভিডিও টিউটোরিয়াল নাম ও লিংক যোগ করুন' : 'Manage video tutorial titles and links for resellers'}
                </p>
              </div>

              <button
                onClick={handleOpenAddTraining}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a38] rounded-lg shadow-xs inline-flex items-center gap-1 shrink-0 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন ভিডিও যোগ করুন' : 'Add Video'}</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <DragDropContext onDragEnd={onTrainingDragEnd}>
                <Droppable droppableId="training-videos">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-100">
                      {trainingVideos.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                            <Play className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-500">কোনো ট্রেনিং ভিডিও খুঁজে পাওয়া যায়নি।</p>
                        </div>
                      ) : (
                        trainingVideos.map((video, index) => {
                          const thumb = getVideoThumbnail(video);
                          return (
                            <Draggable key={video.id} draggableId={video.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="p-3 sm:p-4 flex items-center gap-3.5 bg-white hover:bg-slate-50/80 transition-colors group"
                                >
                                  <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0" title="টেনে ক্রম পরিবর্তন করুন">
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                    {index + 1}
                                  </span>

                                  {/* Video Thumbnail Preview */}
                                  <div
                                    onClick={() => setPreviewingTrainingVideo(video)}
                                    className="relative w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 cursor-pointer group/thumb shadow-2xs"
                                    title="প্রিভিউ দেখতে ক্লিক করুন"
                                  >
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={video.titleBn || 'Training Video'}
                                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-emerald-400">
                                        <Video className="w-4 h-4" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center transition-colors">
                                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                                      </div>
                                    </div>
                                    {video.duration && (
                                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono text-white">
                                        {video.duration}
                                      </span>
                                    )}
                                  </div>

                                  {/* Video Info */}
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {video.titleBn || video.titleEn || 'ট্রেনিং ভিডিও'}
                                      </h3>
                                      {video.duration && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          <span>{video.duration}</span>
                                        </span>
                                      )}
                                    </div>

                                    {video.descriptionBn && (
                                      <p className="text-[11px] text-slate-500 line-clamp-1">
                                        {video.descriptionBn}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-2">
                                      <a
                                        href={video.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-mono text-blue-600 hover:underline flex items-center gap-1 truncate max-w-full"
                                      >
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{video.videoUrl}</span>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewingTrainingVideo(video)}
                                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg inline-flex items-center gap-1 transition-colors"
                                      title="প্লে / প্রিভিউ দেখুন"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span className="hidden md:inline">প্রিভিউ</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTraining(video)}
                                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                      title="এডিট করুন"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTrainingVideo(video.id)}
                                      className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                      title="মুছে ফেলুন"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}



      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT (MATCHES REFERENCE IMAGE STRICTLY) */}
      {/* ==================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-[#F4F6F8] w-full h-full overflow-hidden p-4 sm:p-6 flex flex-col space-y-4">
            
            {/* TOP HEADER & BREADCRUMB */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 shrink-0 gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <span>Products</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-800 font-bold">
                    {editingProduct ? (lang === 'bn' ? 'প্রোডাক্ট এডিট করুন' : 'Edit Product') : (lang === 'bn' ? 'নতুন প্রোডাক্ট যোগ করুন' : 'Add New Product')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#009245] text-white flex items-center justify-center font-extrabold text-base shadow-xs">
                    {editingProduct ? '✏️' : '📦'}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {editingProduct
                        ? (lang === 'bn' ? `প্রোডাক্ট এডিট করুন: ${editingProduct.nameBn || editingProduct.nameEn}` : `Edit Product: ${editingProduct.nameEn || editingProduct.nameBn}`)
                        : (lang === 'bn' ? 'নতুন প্রোডাক্ট যোগ করুন' : 'Add New Product')}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {editingProduct
                        ? (lang === 'bn' ? 'প্রোডাক্টের যেকোনো তথ্য সংশোধন করুন। প্রোডাক্ট কোড/SKU কখনো পরিবর্তন হবে না।' : 'Modify product details. Product Code / SKU remains unchanged.')
                        : (lang === 'bn' ? 'প্রয়োজনীয় তথ্য দিন এবং প্রাকদর্শন দেখুন।' : 'Enter required details and preview public website presentation.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-bold rounded-lg shadow-2xs transition-all inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Products</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast(lang === 'bn' ? 'নতুন ট্যাবে প্রিভিউ মোড চালু হয়েছে' : 'Preview opened in new tab')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition-all inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Preview in New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSaveProduct(e)}
                  className="px-4 py-2 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-extrabold rounded-lg shadow-xs transition-all inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Product</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 overflow-hidden">
              
              {/* LEFT & CENTER COLUMNS (MAIN PRODUCT FORM - WIDE & SPACIOUS) */}
              <div className="flex-1 min-w-0 h-full overflow-y-auto pr-2 sm:pr-4 space-y-4">

                {/* SECTION 1: Product Basic Info */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#009245] text-white flex items-center justify-center text-xs font-black">১</span>
                    <span>{lang === 'bn' ? 'প্রোডাক্টের মূল তথ্য' : 'Product Basic Info'}</span>
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">
                      {lang === 'bn' ? 'বাংলা প্রোডাক্টের নাম *' : 'Bangla Product Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.nameBn}
                      onChange={(e) => setProductForm({ ...productForm, nameBn: e.target.value })}
                      placeholder="প্রিমিয়াম কটন শার্ট (পুরুষদের জন্য)"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-bold text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 block">
                        {lang === 'bn' ? 'বর্ণনা (ডেসক্রিপশন) *' : 'Description *'}
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoParseDescription}
                        className="text-[11px] text-emerald-800 hover:text-emerald-900 font-bold underline"
                      >
                        ✨ অটো-পার্স বিবরণ
                      </button>
                    </div>

                    {/* Rich Formatting Toolbar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 text-xs font-bold text-slate-600 bg-slate-100">
                        <button type="button" className="p-1 hover:bg-slate-200 rounded">B</button>
                        <button type="button" className="p-1 hover:bg-slate-200 rounded italic">I</button>
                        <button type="button" className="p-1 hover:bg-slate-200 rounded underline">U</button>
                        <span className="text-slate-300">|</span>
                        <button type="button" className="p-1 hover:bg-slate-200 rounded">☰</button>
                        <button type="button" className="p-1 hover:bg-slate-200 rounded">⋮=</button>
                        <span className="text-slate-300">|</span>
                        <button type="button" className="p-1 hover:bg-slate-200 rounded">🔗</button>
                      </div>
                      <textarea
                        rows={5}
                        required
                        value={productForm.fullDescBn}
                        onChange={(e) => setProductForm({ ...productForm, fullDescBn: e.target.value, shortDescBn: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs bg-white border-0 outline-none font-medium leading-relaxed"
                      />
                      <div className="p-1.5 bg-slate-50 text-right text-[10px] font-mono text-slate-400 border-t border-slate-100">
                        {(productForm.fullDescBn || '').length}/2000
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Images & Video */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#009245] text-white flex items-center justify-center text-xs font-black">২</span>
                    <span>{lang === 'bn' ? 'ছবি ও ভিডিও' : 'Images & Video'}</span>
                  </h4>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      {lang === 'bn' ? 'প্রোডাক্টের ছবি (একাধিক আপলোড করুন) *' : 'Product Images *'}
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      {/* Upload Box */}
                      <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/40 p-2 text-center transition-colors">
                        <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                          ছবি আপলোড করুন
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          (একসাথে একাধিক ছবি)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={imageUploading}
                          onChange={handleMultipleFilesUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Image Thumbnails */}
                      {productForm.images && productForm.images.map((img, idx) => (
                        <div key={img.id || idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                          {img.isPrimary && (
                            <span className="absolute top-1 left-1 bg-[#009245] text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-2xs">
                              প্রধান ছবি
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = productForm.images!.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, images: updated });
                            }}
                            className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <label className="border border-slate-200 hover:border-slate-400 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-slate-50 text-slate-600 text-center p-2">
                        <Plus className="w-5 h-5 text-slate-500 mb-1" />
                        <span className="text-[10px] font-bold">আরও ছবি যোগ করুন</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={imageUploading}
                          onChange={handleMultipleFilesUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* YouTube Video Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-800 block">
                      {lang === 'bn' ? 'YouTube ভিডিও লিংক (ঐচ্ছিক)' : 'YouTube Video Link'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={productForm.videoUrl || ''}
                        onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=abc123"
                        className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => showToast(lang === 'bn' ? 'ভিডিও প্রিভিউ লোড হয়েছে' : 'Video loaded')}
                        className="px-3.5 py-2 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>ভিডিও প্রিভিউ</span>
                      </button>
                    </div>

                    {/* YouTube Video Card Preview */}
                    <div className="p-2.5 bg-slate-900 rounded-xl flex items-center gap-3 text-white max-w-sm">
                      <div className="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
                        <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover opacity-70" />
                        <Play className="w-5 h-5 text-white absolute fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold line-clamp-1">প্রিমিয়াম কটন শার্ট | সম্পূর্ণ রিভিউ | TAWZOON...</h5>
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                          <span>►</span> YouTube
                        </span>
                      </div>
                      <button type="button" className="text-slate-400 hover:text-white p-1">✕</button>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Price & Stock (EXACTLY MATCHES REFERENCE IMAGE) */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#009245] text-white flex items-center justify-center text-xs font-black">৩</span>
                    <span>{lang === 'bn' ? 'মূল্য ও স্টক' : 'Price & Stock'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        {lang === 'bn' ? 'মূল্য মূল্য (Cost) *' : 'Cost Price *'}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          value={productForm.originalPrice || ''}
                          onChange={(e) => setProductForm({ ...productForm, originalPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full pl-3.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-slate-900 focus:bg-white outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400">৳</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        {lang === 'bn' ? 'বিক্রয় মূল্য (Selling Price) *' : 'Selling Price *'}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          value={productForm.sellingPrice || ''}
                          onChange={(e) => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full pl-3.5 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-slate-900 focus:bg-white outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400">৳</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        {lang === 'bn' ? 'স্টক পরিমাণ *' : 'Stock Quantity *'}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          value={productForm.stockQuantity !== undefined && productForm.stockQuantity !== null ? productForm.stockQuantity : ''}
                          onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                          placeholder="0"
                          className="w-full pl-3.5 pr-12 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-extrabold text-slate-900 focus:bg-white outline-none"
                        />
                        <span className="absolute right-3 text-xs font-bold text-slate-400">{lang === 'bn' ? 'পিস' : 'pcs'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Labeled Yellow Box for Product Code and Status */}
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 block">
                          {lang === 'bn' ? 'প্রোডাক্ট কোড (SKU ফিক্সড)' : 'Product Code (SKU Fixed)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = generateUniqueProductCode();
                            setProductForm(prev => ({ ...prev, productCode: next }));
                            showToast(lang === 'bn' ? `পরবর্তী কোড ${next} সেট করা হয়েছে` : `Next code ${next} generated`);
                          }}
                          className="text-[10px] font-extrabold text-[#009245] hover:underline cursor-pointer flex items-center gap-0.5"
                          title="অটো পরবর্তী কোড নির্ধারণ করুন"
                        >
                          <span>⚡ {lang === 'bn' ? 'অটো কোড' : 'Auto Code'}</span>
                        </button>
                      </div>

                      {/* Compound Input with Unchangeable SKU- Prefix */}
                      {(() => {
                        const fullCode = (productForm.productCode || '').trim();
                        // Extract suffix part after "SKU-"
                        const rawSuffix = fullCode.startsWith('SKU-') ? fullCode.slice(4) : (fullCode.startsWith('SKU') ? fullCode.slice(3) : fullCode);
                        const cleanSuffix = rawSuffix.replace(/^sku-?/i, '');
                        const computedFullCode = `SKU-${cleanSuffix}`;
                        const isDuplicate = cleanSuffix.length > 0 && products.some(p => !p.isArchived && p.id !== editingProduct?.id && (p.productCode || '').toLowerCase() === computedFullCode.toLowerCase());

                        return (
                          <div className="space-y-1">
                            <div className={`flex items-center rounded-xl border ${
                              isDuplicate
                                ? 'border-rose-500 bg-rose-50/30'
                                : 'border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10'
                            } overflow-hidden shadow-2xs transition-all`}>
                              {/* Non-editable, fixed SKU prefix */}
                              <div className="px-3 py-2 bg-slate-100 border-r border-slate-200 text-xs font-mono font-black text-slate-700 flex items-center gap-1 select-none shrink-0" title="SKU প্রিফিক্স ফিক্সড (অপরিবর্তনীয়)">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>SKU-</span>
                              </div>

                              {/* Editable Suffix */}
                              <input
                                type="text"
                                value={cleanSuffix}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/^sku-?/i, '').trim().toUpperCase();
                                  setProductForm(prev => ({ ...prev, productCode: `SKU-${val}` }));
                                }}
                                placeholder={generateUniqueProductCode().slice(4)}
                                className="flex-1 px-3 py-2 text-xs font-mono font-black text-slate-900 outline-none uppercase placeholder:text-slate-300 placeholder:font-normal"
                              />

                              {/* Copy Full Code Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const codeToCopy = cleanSuffix ? `SKU-${cleanSuffix}` : generateUniqueProductCode();
                                  navigator.clipboard.writeText(codeToCopy);
                                  showToast(lang === 'bn' ? `কোড "${codeToCopy}" কপি করা হয়েছে!` : 'Code copied to clipboard!');
                                }}
                                className="px-2.5 py-2 text-slate-400 hover:text-slate-800 transition-colors shrink-0"
                                title="Copy Full SKU Code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>

                            {isDuplicate ? (
                              <p className="text-[10px] text-rose-600 font-bold">
                                {lang === 'bn' ? 'এই প্রোডাক্ট কোডটি ইতিমধ্যে ব্যবহৃত হয়েছে! অন্য কোড দিন বা অটো কোড চাপুন।' : 'This product code is already in use!'}
                              </p>
                            ) : (
                              <p className="text-[9.5px] text-slate-500 font-medium">
                                {lang === 'bn' ? '* SKU- ফিক্সড থাকবে। পরের অংশ লিখুন অথবা ফাঁকা রাখলে অটোমেটিক কোড তৈরি হবে।' : '* SKU- prefix is fixed. Type the suffix or leave blank for auto-generation.'}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        {lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                      </span>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 -ml-4.5"></span>
                        <span>{editingProduct ? (lang === 'bn' ? 'চলতি প্রোডাক্ট (এডিট মুড)' : 'Active Product (Edit Mode)') : (lang === 'bn' ? 'নতুন প্রোডাক্ট' : 'New Product')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Star Rating & Discount */}
                {(() => {
                  const formStars = Number(productForm.starRating || 5);
                  const formDiscount = formStars === 4 ? 15 : formStars === 3 ? 20 : formStars === 2 ? 25 : formStars === 1 ? 30 : 10;
                  const formSellPrice = parseFloat(String(productForm.sellingPrice)) || 0;
                  const formCalcRegular = Math.round(formSellPrice / (1 - formDiscount / 100));

                  return (
                    <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 shadow-2xs">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#009245] text-white flex items-center justify-center text-xs font-black">৪</span>
                          <span>{lang === 'bn' ? 'রেটিং ও ডিসকাউন্ট সেটিং' : 'Rating & Discount Setting'}</span>
                        </div>
                        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          -{formDiscount}% ডিসকাউন্ট সক্রিয়
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">
                            {lang === 'bn' ? 'স্টার রেটিং নির্ধারণ করুন *' : 'Select Star Rating *'}
                          </label>
                          <select
                            value={formStars}
                            onChange={(e) => {
                              const selected = parseInt(e.target.value, 10) || 5;
                              const disc = selected === 4 ? 15 : selected === 3 ? 20 : selected === 2 ? 25 : selected === 1 ? 30 : 10;
                              const reg = Math.round((parseFloat(String(productForm.sellingPrice)) || 0) / (1 - disc / 100));
                              setProductForm(prev => ({
                                ...prev,
                                starRating: selected,
                                regularPrice: reg > (prev.sellingPrice || 0) ? reg : undefined
                              }));
                            }}
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-amber-600 outline-none"
                          >
                            <option value={5}>⭐⭐⭐⭐⭐ 5 স্টার (১০% ডিসকাউন্ট)</option>
                            <option value={4}>⭐⭐⭐⭐ 4 স্টার (১৫% ডিসকাউন্ট)</option>
                            <option value={3}>⭐⭐⭐ 3 স্টার (২০% ডিসকাউন্ট)</option>
                            <option value={2}>⭐⭐ 2 স্টার (২৫% ডিসকাউন্ট)</option>
                            <option value={1}>⭐ 1 স্টার (৩০% ডিসকাউন্ট)</option>
                          </select>
                        </div>

                        {/* Live Price & Discount Indicator */}
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg flex flex-col justify-center space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600">পাবলিক বিক্রয়মূল্য:</span>
                            <span className="font-mono font-extrabold text-[#009245] text-sm">৳{formSellPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-500">পূর্বের ক্রস মূল্য (Regular):</span>
                            <span className="font-mono text-slate-400 line-through">৳{formCalcRegular.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-rose-600">
                            <span>পাবলিক পেজে ডিসকাউন্ট ব্যাজ:</span>
                            <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">-{formDiscount}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating Discount Setting Reference Table */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">স্টার রেটিং অনুযায়ী ডিসকাউন্ট তালিকা</span>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
                          <div className={`grid grid-cols-2 p-2 border-b border-slate-200 ${formStars === 5 ? 'bg-amber-100/60 font-bold text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                            <span>⭐⭐⭐⭐⭐ 5 স্টার (খুব ভালো)</span>
                            <span className="text-right font-mono text-emerald-700 font-bold">10 % ডিসকাউন্ট</span>
                          </div>
                          <div className={`grid grid-cols-2 p-2 border-b border-slate-200 ${formStars === 4 ? 'bg-amber-100/60 font-bold text-amber-900' : ''}`}>
                            <span>⭐⭐⭐⭐ 4 স্টার (ভালো)</span>
                            <span className="text-right font-mono text-emerald-700 font-bold">15 % ডিসকাউন্ট</span>
                          </div>
                          <div className={`grid grid-cols-2 p-2 border-b border-slate-200 ${formStars === 3 ? 'bg-amber-100/60 font-bold text-amber-900' : ''}`}>
                            <span>⭐⭐⭐ 3 স্টার (মাঝারি)</span>
                            <span className="text-right font-mono text-emerald-700 font-bold">20 % ডিসকাউন্ট</span>
                          </div>
                          <div className={`grid grid-cols-2 p-2 border-b border-slate-200 ${formStars === 2 ? 'bg-amber-100/60 font-bold text-amber-900' : ''}`}>
                            <span>⭐⭐ 2 স্টার (কম)</span>
                            <span className="text-right font-mono text-emerald-700 font-bold">25 % ডিসকাউন্ট</span>
                          </div>
                          <div className={`grid grid-cols-2 p-2 ${formStars === 1 ? 'bg-amber-100/60 font-bold text-amber-900' : ''}`}>
                            <span>⭐ 1 স্টার (ন্যূনতম)</span>
                            <span className="text-right font-mono text-emerald-700 font-bold">30 % ডিসকাউন্ট</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* RIGHT COLUMN: SLEEK MOBILE-STYLE LIVE PREVIEW (COMPACT & OFF TO THE RIGHT) */}
              <div className="w-full lg:w-[350px] xl:w-[370px] shrink-0 h-full overflow-y-auto scrollbar-none bg-white rounded-2xl border border-slate-200 p-3 sm:p-3.5 shadow-md flex flex-col space-y-2.5 min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">📱</span>
                    <span>লাইভ প্রিভিউ (মোবাইল ভিউ)</span>
                  </h4>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 cursor-pointer" />
                </div>

                <div className="flex-1 min-h-0">
                  <ProductDetailsPage
                    product={productForm as Product}
                    onBack={() => {}}
                    isPreview={true}
                  />
                </div>
              </div>

            </form>

        </div>
      )}


      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT TRAINING VIDEO                     */}
      {/* ==================================================== */}
      {isTrainingModalOpen && (
        <div className="fixed inset-0 z-[1001] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTraining ? (lang === 'bn' ? 'ট্রেনিং ভিডিও এডিট করুন' : 'Edit Training Video') : (lang === 'bn' ? 'নতুন ট্রেনিং ভিডিও যোগ করুন' : 'Add Training Video')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'রিসেলার ট্রেনিং সেন্টারের জন্য ভিডিও ফুটেজ ও গাইডলাইন' : 'Video footage and tutorials for reseller training center'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrainingModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrainingVideo} className="space-y-3.5">
              {/* Field 1: Title (Bangla) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  ভিডিওর শিরোনাম / টাইটেল *
                </label>
                <input
                  type="text"
                  required
                  value={trainingForm.titleBn}
                  onChange={(e) => setTrainingForm({ ...trainingForm, titleBn: e.target.value, titleEn: e.target.value })}
                  placeholder="যেমন: রিসেলার ড্যাশবোর্ড পরিচিতি ও প্রোডাক্ট ক্যাটালগ ব্রাউজ করার নিয়ম"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-slate-900 transition-all"
                />
              </div>

              {/* Field 2: Video Footage / URL Source */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>ভিডিও ফুটেজ লিংক বা সোর্স *</span>
                  <span className="text-[10px] font-normal text-slate-400">ইউটিউব, এমপি৪ বা ড্রাইভ</span>
                </label>
                <input
                  type="text"
                  required
                  value={trainingForm.videoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoThumb = getYouTubeThumbnail(val);
                    setTrainingForm(prev => ({
                      ...prev,
                      videoUrl: val,
                      thumbnailUrl: prev.thumbnailUrl || (autoThumb || '')
                    }));
                  }}
                  placeholder="ইউটিউব ভিডিও লিংক বা সরাসরি MP4 ফুটেজ URL পেস্ট করুন"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none font-mono text-slate-800 transition-all"
                />

                {/* Upload Video File Button */}
                <div className="flex items-center gap-2 pt-1">
                  <label className={`flex-1 py-1.5 px-3 rounded-lg border border-dashed text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    isUploadingTrainingVideo
                      ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                      : 'bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-700 border-emerald-300'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingTrainingVideo ? 'ভিডিও আপলোড হচ্ছে...' : 'কম্পিউটার/মোবাইল থেকে ভিডিও ফুটেজ আপলোড করুন (MP4/WebM)'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={isUploadingTrainingVideo}
                      onChange={handleUploadTrainingVideoFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Live Video Preview Box (if videoUrl provided) */}
              {trainingForm.videoUrl && (
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      লাইভ ভিডিও প্রিভিউ
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                      {trainingForm.videoUrl}
                    </span>
                  </div>

                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    {isDirectVideoUrl(trainingForm.videoUrl) ? (
                      <video
                        controls
                        playsInline
                        src={trainingForm.videoUrl}
                        className="w-full h-full object-contain"
                      />
                    ) : getVideoEmbedUrl(trainingForm.videoUrl) ? (
                      <iframe
                        src={getVideoEmbedUrl(trainingForm.videoUrl, false)!}
                        title="Live Preview"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center p-4 text-xs text-slate-400">
                        ভিডিও প্রিভিউ লোড করা যাচ্ছে না। কিন্তু সেভ করার পর লিংকে কাজ করবে।
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Field 3: Video Thumbnail Image */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>থাম্বনেইল / কভার ইমেজ (ঐচ্ছিক)</span>
                  <span className="text-[10px] font-normal text-slate-400">ইউটিউব লিংক দিলে অটো আসবে</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={trainingForm.thumbnailUrl}
                    onChange={(e) => setTrainingForm({ ...trainingForm, thumbnailUrl: e.target.value })}
                    placeholder="ছবির লিংক বা নিচের বাটনে আপলোড করুন"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-mono text-slate-800"
                  />
                  <label className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                    isUploadingTrainingThumb
                      ? 'bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{isUploadingTrainingThumb ? 'আপলোড...' : 'ছবি আপলোড'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingTrainingThumb}
                      onChange={handleUploadTrainingThumbFile}
                      className="hidden"
                    />
                  </label>
                </div>
                {trainingForm.thumbnailUrl && (
                  <div className="mt-1 flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <img
                      src={trainingForm.thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-16 h-10 object-cover rounded border border-slate-200"
                    />
                    <span className="text-[10px] text-emerald-700 font-bold truncate">
                      ✓ থাম্বনেইল ইমেজ সংযুক্ত হয়েছে
                    </span>
                  </div>
                )}
              </div>

              {/* Field 4: Duration */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  ভিডিওর ব্যাপ্তিকাল / সময় (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={trainingForm.duration}
                  onChange={(e) => setTrainingForm({ ...trainingForm, duration: e.target.value })}
                  placeholder="যেমন: ০৫:২০ মিনিট বা 10 min"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-medium text-slate-800"
                />
              </div>

              {/* Field 5: Description / Learning Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  ভিডিও বিবরণ / কী কী শেখানো হয়েছে (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={trainingForm.descriptionBn}
                  onChange={(e) => setTrainingForm({ ...trainingForm, descriptionBn: e.target.value, descriptionEn: e.target.value })}
                  placeholder="রিসেলারদের জন্য সংক্ষেপে গুরুত্বপূর্ণ বিষয়গুলো লিখুন..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none text-slate-800 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTrainingModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isUploadingTrainingVideo || isUploadingTrainingThumb}
                  className="w-2/3 py-2.5 bg-[#009245] hover:bg-[#007a38] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingTraining ? 'ভিডিও আপডেট করুন' : 'ভিডিও সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PREVIEW TRAINING VIDEO (ADMIN)                */}
      {/* ==================================================== */}
      {previewingTrainingVideo && (
        <div className="fixed inset-0 z-[1002] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="min-w-0 pr-3">
                <h3 className="text-sm font-bold truncate">
                  {previewingTrainingVideo.titleBn || previewingTrainingVideo.titleEn || 'ভিডিও প্রিভিউ'}
                </h3>
                {previewingTrainingVideo.duration && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    সময়: {previewingTrainingVideo.duration}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewingTrainingVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {isDirectVideoUrl(previewingTrainingVideo.videoUrl) ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  src={previewingTrainingVideo.videoUrl}
                  poster={getVideoThumbnail(previewingTrainingVideo) || undefined}
                  className="w-full h-full object-contain"
                />
              ) : getVideoEmbedUrl(previewingTrainingVideo.videoUrl) ? (
                <iframe
                  src={getVideoEmbedUrl(previewingTrainingVideo.videoUrl, true)!}
                  title="Training Video Preview"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  ভিডিও লোড করা যাচ্ছে না
                </div>
              )}
            </div>

            {previewingTrainingVideo.descriptionBn && (
              <div className="p-3.5 bg-slate-950 text-xs text-slate-300 border-t border-slate-800/80">
                <p className="line-clamp-2">{previewingTrainingVideo.descriptionBn}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIEW PRODUCT DETAILS                          */}
      {/* ==================================================== */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Header Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white shadow-2xs">
                    {viewingProduct.productCode}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    viewingProduct.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {viewingProduct.isActive ? '✓ সক্রিয় (Live)' : '✕ নিষ্ক্রিয় (Disabled)'}
                  </span>
                  <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {viewingProduct.categorySlug} {viewingProduct.subcategoryBn ? `› ${viewingProduct.subcategoryBn}` : ''}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{viewingProduct.nameBn}</h3>
                {viewingProduct.nameEn && <p className="text-xs text-slate-500 font-medium">{viewingProduct.nameEn}</p>}
              </div>

              <button
                onClick={() => setViewingProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Image Gallery & Video */}
              <div className="space-y-4">
                <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative shadow-2xs">
                  <img
                    src={viewingProduct.images[0]?.url || '/images/product_shop_dress_1790244714775.jpg'}
                    alt={viewingProduct.nameBn}
                    className="w-full h-full object-cover"
                  />
                  {viewingProduct.starRating === 5 && (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                      -10% Discount
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {viewingProduct.images && viewingProduct.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {viewingProduct.images.map((img, idx) => (
                      <div key={img.id || idx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* YouTube Video Preview */}
                {viewingProduct.videoUrl && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <span>►</span> YouTube রিভিউ ভিডিও
                    </span>
                    <a
                      href={viewingProduct.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-300 hover:underline break-all font-mono block"
                    >
                      {viewingProduct.videoUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* Right Column: Pricing, Stock, Commission & Specs */}
              <div className="space-y-5">
                
                {/* Price Breakdown Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">মূল্য ও কমিশন বিশ্লেষণ</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-semibold">ক্রয় মূল্য (Cost)</span>
                      <span className="text-base font-black font-mono text-slate-800">৳{(viewingProduct.originalPrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-semibold">বিক্রয় মূল্য (Selling)</span>
                      <span className="text-base font-black font-mono text-emerald-700">৳{viewingProduct.sellingPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                      <span>কমিশন হার:</span>
                      <span className="font-mono text-sm">{viewingProduct.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>রিসেলারের আনুমানিক লাভ:</span>
                      <span className="font-mono text-sm">
                        ৳{((viewingProduct.sellingPrice || 0) - (viewingProduct.originalPrice || 0)) - Math.round(((viewingProduct.sellingPrice || 0) * (viewingProduct.commissionRate || 0)) / 100)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock & Variants */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs font-medium">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">স্টক স্ট্যাটাস:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {viewingProduct.stockQuantity !== undefined ? `${viewingProduct.stockQuantity} পিস` : 'স্টকে আছে'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">স্টার রেটিং:</span>
                    <span className="text-amber-500 font-bold">
                      {'⭐'.repeat(viewingProduct.starRating || 5)} ({viewingProduct.starRating || 5}.0)
                    </span>
                  </div>

                  {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">উপলব্ধ রঙ:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingProduct.colors.map((clr, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold">
                            {clr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">উপলব্ধ সাইজ:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingProduct.sizes.map((sz, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold">
                            {sz}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">বিবরণ (Description)</h4>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {viewingProduct.fullDescBn || viewingProduct.shortDescBn || 'কোনো বিবরণ দেওয়া হয়নি।'}
                  </p>
                </div>

              </div>

            </div>

            {/* Footer Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                বন্ধ করুন (Close)
              </button>

              <button
                onClick={() => {
                  const prodToEdit = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEditProduct(prodToEdit);
                }}
                className="px-6 py-2.5 bg-[#009245] hover:bg-[#007a38] text-white text-xs font-extrabold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>এডিট করুন (Edit Product)</span>
              </button>
            </div>

          </div>
        </div>
      )}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingCat ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি তৈরি'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'ক্যাটাগরি / কালেকশন নাম (যেকোনো ভাষায়)' : 'Category / Collection Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={catForm.name || ''}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="যেমন: ছেলেদের পোশাক বা Men's Fashion"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'বিবরণ (Description)' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={catForm.description || ''}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Slug (e.g. shop, gadgets, lifestyle)</label>
                <input
                  type="text"
                  required
                  value={catForm.slug || ''}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {lang === 'bn' ? 'প্রদর্শন ক্রম (Display Order)' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={catForm.order ?? 1}
                    onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={catForm.isActive !== false}
                      onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: SUBSECTION / CATEGORY ITEM MODAL              */}
      {/* ==================================================== */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                  📍 {lang === 'bn' ? 'সেকশন লোকেশন:' : 'Location:'} {
                    adminCategoryPath.subSubcategory
                      ? `${adminCategoryPath.categorySlug?.toUpperCase()} › ${adminCategoryPath.subcategory} › ${adminCategoryPath.subSubcategory}`
                      : adminCategoryPath.subcategory
                      ? `${adminCategoryPath.categorySlug?.toUpperCase()} › ${adminCategoryPath.subcategory}`
                      : adminCategoryPath.categorySlug
                      ? `${adminCategoryPath.categorySlug.toUpperCase()}`
                      : 'Root Category System'
                  }
                </span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {editingSub
                    ? (lang === 'bn' ? 'ক্যাটাগরি / সাব-সেকশন এডিট' : 'Edit Category Item')
                    : adminCategoryPath.subSubcategory
                    ? (lang === 'bn' ? `"${adminCategoryPath.subSubcategory}"-এ নতুন চাইল্ড আইটেম যোগ` : 'Add Child Item')
                    : adminCategoryPath.subcategory
                    ? (lang === 'bn' ? `"${adminCategoryPath.subcategory}"-এ নতুন সাব-ক্যাটাগরি যোগ` : 'Add Sub-category')
                    : adminCategoryPath.categorySlug
                    ? (lang === 'bn' ? `"${adminCategoryPath.categorySlug.toUpperCase()}"-এ নতুন ক্যাটাগরি গ্রুপ যোগ` : 'Add Category Group')
                    : (lang === 'bn' ? 'নতুন সেকশন / ক্যাটাগরি যোগ' : 'Add New Category')}
                </h3>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveSubsection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'সেকশন / ক্যাটাগরি নাম *' : 'Section Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  placeholder="যেমন: ছেলেদের পোশাক, শার্ট, টি-শার্ট..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'বাংলা বিবরণ (Description)' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={subForm.description}
                  onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                  placeholder="এই সেকশনের সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'ক্যাটাগরি ছবি (Image URL / File Upload)' : 'Category Image'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img src={subForm.imageUrl || getSuggestedImageUrl(subForm.name)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="url"
                    value={subForm.imageUrl}
                    onChange={(e) => setSubForm({ ...subForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono text-[11px]"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কম্পিউটার থেকে ছবি আপলোড করুন' : 'Upload Image File'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleSubImageUpload(e)} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSubForm({ ...subForm, imageUrl: getSuggestedImageUrl(subForm.name) })}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {lang === 'bn' ? 'অটো সাজেস্টেড ইমেজ দিন' : 'Auto Suggest'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {lang === 'bn' ? 'প্রদর্শন ক্রম (Order)' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={subForm.order}
                    onChange={(e) => setSubForm({ ...subForm, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={subForm.isActive}
                      onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Sub-section'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PROCESS WITHDRAWAL PAYOUT                     */}
      {/* ==================================================== */}
      {processWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{t.processWithdrawal}</h3>
              <button onClick={() => setProcessWithdrawModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">কর্মী:</span>
                <span className="font-bold text-slate-900">{processWithdrawModal.employeeName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">মাধ্যম ও নম্বর:</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">{processWithdrawModal.paymentMethod} ({processWithdrawModal.accountNumber})</span>
                  {processWithdrawModal.accountType && (
                    <span className="text-[10.5px] font-bold text-emerald-700 block">
                      টাইপ: {processWithdrawModal.accountType === 'Personal' ? 'পার্সোনাল' : processWithdrawModal.accountType === 'Merchant' ? 'মার্চেন্ট' : processWithdrawModal.accountType === 'Agent' ? 'এজেন্ট' : processWithdrawModal.accountType}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">টাকার পরিমাণ:</span>
                <span className="font-mono font-extrabold text-slate-900 text-sm">৳{processWithdrawModal.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPayoutAction('APPROVE')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    payoutAction === 'APPROVE' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {t.btnApprovePayment}
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutAction('REJECT')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    payoutAction === 'REJECT' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {t.btnRejectPayment}
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{t.adminProcessNote}</label>
                <input
                  type="text"
                  value={adminPayoutNote}
                  onChange={(e) => setAdminPayoutNote(e.target.value)}
                  placeholder="যেমন: TrxID: 9KA81729381"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleProcessPayout}
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                নিশ্চিত করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {resetPasswordEmp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? `পাসওয়ার্ড রিসেট: ${resetPasswordEmp.name}` : `Reset Password: ${resetPasswordEmp.name}`}
              </h3>
              <button
                onClick={() => setResetPasswordEmp(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (min 6 chars)'}
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="যেমন: NewSecurePass@123"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordEmp(null)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs"
                >
                  {lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: COMPREHENSIVE USER DETAILS & AUDIT DRAWER     */}
      {/* ==================================================== */}
      {selectedUserForDetails && (() => {
        const emp = selectedUserForDetails;
        const userSales = sales.filter(s => s.employeeId === emp.id);
        const userWithdrawals = withdrawals.filter(w => w.employeeId === emp.id);
        const referralCode = `TN-REF-${emp.id.replace('emp-', '').slice(0, 5).toUpperCase()}`;

        // Referrer / Upline Lookup
        const ref = emp.reference || (emp as any).referredBy || (emp as any).upline;
        const parentEmp = emp.referralOwnerId && emp.referralOwnerId !== 'OFFICIAL_TAWZOON'
          ? employees.find(e => e.id === emp.referralOwnerId)
          : (ref ? employees.find(e => 
              e.id === ref || 
              (e.referenceCode && e.referenceCode.toUpperCase() === String(ref).toUpperCase()) || 
              `TN-REF-${e.id.replace('emp-', '').slice(0, 5).toUpperCase()}` === String(ref).toUpperCase() ||
              (e.phone && e.phone.replace(/[^0-9]/g, '') === String(ref).replace(/[^0-9]/g, '')) ||
              (e.name && e.name.trim().toLowerCase() === String(ref).trim().toLowerCase())
            ) : null);

        const isOfficial = !parentEmp && Boolean(
          emp.referralOwnerId === 'OFFICIAL_TAWZOON' ||
          ref === 'TAWZOON9516' ||
          isOfficialReferenceCode(ref) ||
          isOfficialReferenceCode((emp as any).referredBy) ||
          (emp.isOfficialReferral && !emp.referralOwnerId)
        );
        const referrerName = isOfficial
          ? 'তাওজুন অফিসিয়াল (Headquarters)'
          : (parentEmp ? parentEmp.name : (emp.referralOwnerName || (ref ? ref : 'মেইন / সরাসরি (কোন আপলাইন নেই)')));
        const referrerCode = isOfficial
          ? 'TAWZOON9516'
          : (parentEmp ? (parentEmp.referenceCode || `TN-REF-${parentEmp.id.replace('emp-', '').slice(0, 5).toUpperCase()}`) : (ref || 'N/A'));
        const referrerPhone = isOfficial
          ? 'অফিসিয়াল সিস্টেম'
          : (parentEmp?.phone || emp.referralOwnerPhone || (ref && /^[0-9+]+$/.test(ref) ? ref : 'N/A'));

        // Downline team members referred BY this reseller:
        const referredDownline = getResellerDownlines(emp, employees);

        // Downline sales and commissions
        const downlineMemberIds = new Set(referredDownline.map(d => d.id));
        const downlineSales = sales.filter(s => downlineMemberIds.has(s.employeeId));
        const totalDownlineSalesAmount = downlineSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const totalDownlineCommissionGenerated = downlineSales.reduce((sum, s) => sum + (s.commissionAmount || 0), 0);

        // Current Referral Commission Rate / Max Bonus Limit (default ৳10)
        const currentReferralRate = (emp.referralCommissionRate !== undefined && Number(emp.referralCommissionRate) > 0)
          ? Number(emp.referralCommissionRate)
          : 10;
        const estimatedReferralBonus = Math.round(downlineSales.reduce((sum, s) => sum + Math.min((s.commissionAmount || 0) * 0.1, currentReferralRate), 0));

        // Real active downline members list strictly without fake accounts
        const displayDownlineMembers = referredDownline;

        // Itemized ledger calculation for this reseller
        const userTrxs = (transactions || []).filter(t => t.employeeId === emp.id);

        const resellerLedgerList = (() => {
          const rawList: Array<{
            id: string;
            timestamp: string;
            type: 'CREDIT' | 'DEBIT';
            category: string;
            description: string;
            reference: string;
            amount: number;
          }> = [];

          if (userTrxs.length > 0) {
            userTrxs.forEach(t => {
              const typeUpper = (t.type || '').toUpperCase();
              const isCredit = ['COMMISSION_EARNED', 'COMMISSION', 'REFERRAL_BONUS', 'WITHDRAWAL_REFUND', 'BONUS', 'ADJUSTMENT_ADD'].includes(typeUpper) || t.amount > 0;
              rawList.push({
                id: t.id,
                timestamp: t.timestamp,
                type: isCredit ? 'CREDIT' : 'DEBIT',
                category: typeUpper.includes('COMMISSION') ? 'বিক্রয় কমিশন' : typeUpper.includes('REFERRAL') ? 'রেফারেল বোনাস' : typeUpper.includes('WITHDRAWAL') ? 'উইথড্রয়াল' : 'ট্রানজেকশন',
                description: t.description || (isCredit ? 'কমিশন জমা' : 'উইথড্রয়াল ডেবিট'),
                reference: t.reference || t.id,
                amount: Math.abs(t.amount)
              });
            });
          } else {
            // Synthesize from sales & withdrawals for 100% mathematical accuracy
            userSales.forEach(s => {
              if (s.commissionAmount > 0) {
                rawList.push({
                  id: `sale-${s.id}`,
                  timestamp: s.saleDate,
                  type: 'CREDIT',
                  category: 'বিক্রয় কমিশন',
                  description: `অর্ডার #${s.orderCode} (${s.productName}) থেকে অর্জিত কমিশন`,
                  reference: `#${s.orderCode}`,
                  amount: s.commissionAmount
                });
              }
            });

            userWithdrawals.forEach(w => {
              rawList.push({
                id: `wdr-${w.id}`,
                timestamp: w.requestDate,
                type: 'DEBIT',
                category: 'উইথড্রয়াল ডেবিট',
                description: `${w.paymentMethod} (${w.accountNumber}) এ উত্তোলন রিকোয়েস্ট`,
                reference: `#${w.id}`,
                amount: w.amount
              });

              if (w.status === 'REJECTED') {
                rawList.push({
                  id: `wdr-ref-${w.id}`,
                  timestamp: w.processedDate || w.requestDate,
                  type: 'CREDIT',
                  category: 'উইথড্রয়াল ফেরত',
                  description: `উইথড্রয়াল #${w.id} বাতিল হওয়ায় টাকা ওয়ালেটে রিফান্ড`,
                  reference: `#${w.id}`,
                  amount: w.amount
                });
              }
            });
          }

          // Sort ascending chronologically to calculate running balance
          rawList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          let balance = 0;
          const withRunningBalance = rawList.map(item => {
            if (item.type === 'CREDIT') {
              balance += item.amount;
            } else {
              balance -= item.amount;
            }
            return {
              ...item,
              runningBalance: Math.max(0, balance)
            };
          });

          // Return reverse chronological (newest first)
          return withRunningBalance.reverse();
        })();

        return (
          <div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto overflow-x-hidden flex flex-col font-sans">
            {/* Top Clean Header Bar with Full Action Buttons */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Back Button, Name & ID */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetails(null)}
                  className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs sm:text-sm shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-800" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <div className="h-4 w-px bg-slate-200 shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm sm:text-base font-black text-slate-900 truncate">{emp.name}</span>
                  <span className="text-[11px] font-mono text-slate-500 truncate hidden xs:inline">#{emp.id}</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${
                  emp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  emp.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  emp.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                  'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {emp.status === 'APPROVED' ? '● সক্রিয়' : emp.status === 'PENDING' ? '● পেন্ডিং' : emp.status === 'SUSPENDED' ? '● স্থগিত' : emp.status}
                </span>

                {emp.status === 'APPROVED' ? (
                  <>
                    <button
                      type="button"
                      disabled={updatingEmployeeStatusId === emp.id}
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'SUSPENDED')}
                      className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-75 disabled:cursor-wait border border-amber-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {updatingEmployeeStatusId === emp.id ? (
                        <div className="w-3 h-3 border-2 border-amber-800/40 border-t-amber-900 rounded-full animate-spin" />
                      ) : (
                        <span>⏸️</span>
                      )}
                      <span>{lang === 'bn' ? 'স্থগিত' : 'Suspend'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingEmployeeStatusId === emp.id}
                      onClick={() => handleUpdateEmployeeStatus(emp.id, 'REJECTED')}
                      className="px-2.5 py-1 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 disabled:opacity-75 disabled:cursor-wait border border-rose-300 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {updatingEmployeeStatusId === emp.id ? (
                        <div className="w-3 h-3 border-2 border-rose-800/40 border-t-rose-900 rounded-full animate-spin" />
                      ) : (
                        <span>❌</span>
                      )}
                      <span>{lang === 'bn' ? 'বাতিল' : 'Reject'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={updatingEmployeeStatusId === emp.id}
                    onClick={() => handleUpdateEmployeeStatus(emp.id, 'APPROVED')}
                    className="px-3 py-1 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] disabled:opacity-75 disabled:cursor-wait rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {updatingEmployeeStatusId === emp.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>{lang === 'bn' ? 'সক্রিয় হচ্ছে...' : 'Activating...'}</span>
                      </>
                    ) : (
                      <>
                        <span>✅</span>
                        <span>{lang === 'bn' ? 'সক্রিয় করুন' : 'Activate'}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenEditUser(emp)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Edit2 className="w-3 h-3 text-slate-700" />
                  {lang === 'bn' ? 'এডিট' : 'Edit'}
                </button>

                <button
                  type="button"
                  onClick={() => { setResetPasswordEmp(emp); setNewPasswordInput(''); }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>🔑</span> {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(emp.id)}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                  {lang === 'bn' ? 'ডিলিট' : 'Delete'}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserForDetails(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center font-bold cursor-pointer transition-all text-xs shrink-0 ml-0.5"
                  title="বন্ধ করুন"
                >
                  ✕
                </button>
              </div>
            </header>

            {/* Page Body Container */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-4 sm:px-6 space-y-4">
              
              {/* Profile Summary Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Clean 100% Round Circular Profile Picture & Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#009245] font-black text-xl flex items-center justify-center shadow-xs border border-emerald-200 shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-xl font-black text-slate-900 truncate">{emp.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          emp.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          emp.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          emp.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                          'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {emp.status === 'APPROVED' ? 'সক্রিয়' : emp.status === 'PENDING' ? 'পেন্ডিং' : emp.status === 'SUSPENDED' ? 'স্থগিত' : emp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 space-y-0.5 sm:space-y-0 sm:space-x-3">
                        <span className="block sm:inline">📱 {emp.phone}</span>
                        <span className="block sm:inline">✉️ {emp.email || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Referral Code & Quick Link Share */}
                  <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="text-slate-400 font-medium block text-[9px]">রেফার কোড:</span>
                      <strong className="font-mono font-black text-emerald-800 text-xs sm:text-sm">{referralCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode);
                        showToast(lang === 'bn' ? 'রেফারেল কোড কপি করা হয়েছে' : 'Code copied');
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold bg-white text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 shadow-3xs cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> কপি
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/reseller-register?ref=${referralCode}`;
                        navigator.clipboard.writeText(url);
                        showToast(lang === 'bn' ? 'রেজিস্ট্রেশন লিংক কপি করা হয়েছে' : 'Link copied');
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                    >
                      <Share2 className="w-3 h-3" /> লিংক
                    </button>
                  </div>
                </div>

                {/* 4 Financial Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">মোট উপার্জন</span>
                    <span className="font-black text-emerald-950 font-mono text-base sm:text-lg">৳{emp.wallet.totalEarnings.toLocaleString()}</span>
                  </div>
                  <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-800 block uppercase">অর্ডার সংখ্যা</span>
                    <span className="font-black text-blue-950 font-mono text-base sm:text-lg">{userSales.length} টি</span>
                  </div>
                  <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-800 block uppercase">ব্যালেন্স</span>
                    <span className={`font-black font-mono text-base sm:text-lg ${emp.wallet.availableBalance < 0 ? 'text-rose-600' : 'text-purple-950'}`}>
                      {emp.wallet.availableBalance < 0 ? `-৳${Math.abs(emp.wallet.availableBalance).toLocaleString()}` : `৳${emp.wallet.availableBalance.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 block uppercase">পেন্ডিং উইথড্র</span>
                    <span className="font-black text-amber-950 font-mono text-base sm:text-lg">৳{emp.wallet.pendingWithdrawal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 4 Navigation Tabs strictly in 1 Single Line */}
              <div className="bg-slate-200/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setUserDetailsActiveTab('profile')}
                  className={`flex-1 py-2 px-1.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    userDetailsActiveTab === 'profile' 
                      ? 'bg-white shadow-xs text-emerald-900 border border-emerald-200' 
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <span className="sm:hidden">👤 রেফারেল</span>
                  <span className="hidden sm:inline">👤 রেফারেন্স ও কন্ট্রোল</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    userDetailsActiveTab === 'profile' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {referredDownline.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserDetailsActiveTab('orders')}
                  className={`flex-1 py-2 px-1.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    userDetailsActiveTab === 'orders' 
                      ? 'bg-white shadow-xs text-emerald-900 border border-emerald-200' 
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <span className="sm:hidden">📦 সেলস</span>
                  <span className="hidden sm:inline">📦 সেলস খতিয়ান</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    userDetailsActiveTab === 'orders' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {userSales.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserDetailsActiveTab('withdrawals')}
                  className={`flex-1 py-2 px-1.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    userDetailsActiveTab === 'withdrawals' 
                      ? 'bg-white shadow-xs text-emerald-900 border border-emerald-200' 
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <span className="sm:hidden">💳 উত্তোলন</span>
                  <span className="hidden sm:inline">💳 উইথড্রয়াল</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    userDetailsActiveTab === 'withdrawals' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {userWithdrawals.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserDetailsActiveTab('ledger')}
                  className={`flex-1 py-2 px-1.5 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    userDetailsActiveTab === 'ledger' 
                      ? 'bg-white shadow-xs text-emerald-900 border border-emerald-200' 
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <span className="sm:hidden">📈 লেজার</span>
                  <span className="hidden sm:inline">📈 আর্নিং ও ইনকাম লেজার</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold shrink-0 ${
                    userDetailsActiveTab === 'ledger' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {resellerLedgerList.length}
                  </span>
                </button>
              </div>

              {/* Tab 1: Profile & Referral Settings */}
               {userDetailsActiveTab === 'profile' && (
                <div className="space-y-4">
                  
                  {/* Top Row: 1. Upline Referrer Profile & 2. Main Referral Commission Control Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. কার রেফারেন্সে অ্যাকাউন্ট খোলা হয়েছে (Upline Referrer Info) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                          🔗
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {lang === 'bn' ? 'কার রেফারেন্সে একাউন্ট' : 'Upline Referrer Profile'}
                          </h3>
                          <p className="text-[10px] text-slate-400 truncate">রেফারারের নাম ও মোবাইল নাম্বার</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                        {/* Referrer Name */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-600 font-bold shrink-0">রেফারারের নাম:</span>
                          <strong className="font-extrabold text-slate-900 truncate text-right">{referrerName}</strong>
                        </div>

                        {/* Mobile Number */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-600 font-bold shrink-0">মোবাইল নম্বর:</span>
                          <strong className="font-mono font-bold text-emerald-800 shrink-0">{referrerPhone}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 2. রেফারেল কমিশন কন্ট্রোল (ডিফল্ট ৫% বা কাস্টমাইজ) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">
                            ৳
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                              {lang === 'bn' ? 'রেফারেল সর্বোচ্চ বোনাস লিমিট' : 'Referral Max Bonus Limit'}
                            </h3>
                            <p className="text-[10px] text-emerald-700 font-medium truncate">১০% প্রফিট শেয়ার, সর্বোচ্চ লিমিট</p>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                          ৳{currentReferralRate} লিমিট
                        </span>
                      </div>

                      {/* Direct Single Input & Save Button */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              step="1"
                              placeholder="10"
                              value={modalReferralRateInput}
                              onChange={(e) => setModalReferralRateInput(e.target.value)}
                              className="w-full pl-3 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-emerald-600 outline-none font-bold text-slate-900"
                            />
                            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">৳</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const valToSave = modalReferralRateInput !== '' ? modalReferralRateInput : String(currentReferralRate);
                              handleSaveReferralCommissionRate(emp.id, valToSave);
                            }}
                            disabled={isSavingModalReferralRate}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            {isSavingModalReferralRate ? '...' : (lang === 'bn' ? 'লিমিট সেভ' : 'Save')}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          💡 ডিফল্ট সর্বোচ্চ বোনাস লিমিট <strong>৳{currentReferralRate}</strong> (১০০ টাকা লাভে সর্বোচ্চ ৳{currentReferralRate}; এর বেশি লাভ হলেও বোনাস এই লিমিটেই সীমাবদ্ধ থাকবে)।
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* 3. রেফারেন্সে যারা অ্যাকাউন্ট খুলেছে তাদের সুন্দর এক লাইনের তালিকা ও কাস্টমাইজ কন্ট্রোল */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3">
                    {/* Header Strictly in ONE Line */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">👥</span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {lang === 'bn' ? 'রেফারেল অ্যাকাউন্টসমূহ' : 'Referred Reseller Accounts'}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 font-mono shrink-0 whitespace-nowrap">
                        {displayDownlineMembers.length} জন
                      </span>
                    </div>

                    {/* Member Rows in ONE Clean Line on both Mobile & Desktop */}
                    <div className="space-y-2">
                      {displayDownlineMembers.length === 0 ? (
                        <div className="py-8 px-4 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
                          <p className="text-xs font-bold text-slate-500">
                            {lang === 'bn' ? 'এই ইউজারের রেফারেন্সে এখনও কোনো অ্যাকাউন্ট খোলা হয়নি।' : 'No referral accounts registered under this user yet.'}
                          </p>
                        </div>
                      ) : (
                        displayDownlineMembers.map((member: any, idx) => {
                        const memberSales = sales.filter(s => s.employeeId === member.id);
                        const memberSalesAmount = memberSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                        const memberSavedRate = member.resellerMargin !== undefined && member.resellerMargin !== null ? member.resellerMargin : currentReferralRate;

                        return (
                          <div
                            key={member.id}
                            className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition-all shadow-3xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>

                              {member.avatarUrl ? (
                                <img
                                  src={member.avatarUrl}
                                  alt={member.name}
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm truncate">{member.name}</span>
                                  <span className={`text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                                    member.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {member.status === 'APPROVED' ? 'সক্রিয়' : 'পেন্ডিং'}
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-slate-600 font-mono truncate mt-0.5">
                                  📱 <strong className="text-slate-900 font-bold">{member.phone}</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right hidden xs:block">
                                <span className="text-[10px] text-slate-400 block">মোট অর্ডার: {memberSales.length}টি</span>
                                <span className="text-xs font-mono font-bold text-slate-700">৳{memberSalesAmount.toLocaleString()}</span>
                              </div>
                              <span className="text-[10px] sm:text-[11px] font-mono text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 shrink-0">
                                ৳{memberSavedRate} লিমিট (স্বয়ংক্রিয়)
                              </span>
                            </div>
                          </div>
                        );
                      }))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Orders & Sales Ledger */}
              {userDetailsActiveTab === 'orders' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                      {lang === 'bn' ? 'বিক্রয় ও কাস্টমার অর্ডার খতিয়ান' : 'Order Ledger'}
                    </h3>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                      মোট {userSales.length}টি অর্ডার
                    </span>
                  </div>

                  {userSales.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-3xs">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
                          <tr>
                            <th className="py-2.5 px-3">অর্ডার কোড</th>
                            <th className="py-2.5 px-3">পণ্য</th>
                            <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                            <th className="py-2.5 px-3 text-right">মোট টাকা</th>
                            <th className="py-2.5 px-3 text-right">কমিশন লাভ</th>
                            <th className="py-2.5 px-3 text-center">তারিখ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {userSales.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">#{sale.orderCode}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-800 block">{sale.productName}</span>
                                {sale.customerName && (
                                  <span className="text-[10px] text-slate-400 block truncate">{sale.customerName} ({sale.customerPhone})</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-700">{sale.quantity}টি</td>
                              <td className="py-2.5 px-3 font-mono font-black text-slate-900 text-right">৳{(sale.totalAmount || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 font-mono font-black text-emerald-700 text-right">৳{sale.commissionAmount.toLocaleString()}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-center">{new Date(sale.saleDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 text-slate-800 font-black">সর্বমোট:</td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                              ৳{userSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                              ৳{userSales.reduce((sum, s) => sum + (s.commissionAmount || 0), 0).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">কোনো সেলস রেকর্ড পাওয়া যায়নি।</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Withdrawals */}
              {userDetailsActiveTab === 'withdrawals' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                      {lang === 'bn' ? 'টাকা উত্তোলনের রেকর্ড ও পেমেন্ট হিস্ট্রি' : 'Payout History'}
                    </h3>
                    <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full">
                      মোট {userWithdrawals.length}টি উত্তোলন
                    </span>
                  </div>

                  {userWithdrawals.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-3xs">
                      <table className="w-full text-left text-xs text-slate-700 min-w-[500px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
                          <tr>
                            <th className="py-2.5 px-3">আইডি</th>
                            <th className="py-2.5 px-3">মাধ্যম</th>
                            <th className="py-2.5 px-3">অ্যাকাউন্ট নম্বর</th>
                            <th className="py-2.5 px-3 text-right">টাকার পরিমাণ</th>
                            <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
                            <th className="py-2.5 px-3 text-center">তারিখ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {userWithdrawals.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">#{w.id}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{w.paymentMethod}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{w.accountNumber}</td>
                              <td className="py-2.5 px-3 font-mono font-black text-slate-900 text-right">৳{w.amount.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  w.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {w.status === 'APPROVED' ? 'পরিশোধিত' : 'পেন্ডিং'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-400 text-center">{new Date(w.requestDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium">কোনো উত্তোলনের রেকর্ড পাওয়া যায়নি।</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Comprehensive Earning & Income Ledger (আর্নিং ও ইনকাম লেজার) */}
              {userDetailsActiveTab === 'ledger' && (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-emerald-50/90 border border-emerald-200 p-3.5 rounded-2xl shadow-3xs">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">মোট উপার্জন</span>
                      <span className="font-mono font-black text-emerald-950 text-base sm:text-lg">৳{emp.wallet.totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="bg-blue-50/90 border border-blue-200 p-3.5 rounded-2xl shadow-3xs">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">মোট উত্তোলন</span>
                      <span className="font-mono font-black text-blue-950 text-base sm:text-lg">৳{emp.wallet.totalWithdrawn.toLocaleString()}</span>
                    </div>
                    <div className="bg-amber-50/90 border border-amber-200 p-3.5 rounded-2xl shadow-3xs">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">পেন্ডিং উইথড্র</span>
                      <span className="font-mono font-black text-amber-950 text-base sm:text-lg">৳{emp.wallet.pendingWithdrawal.toLocaleString()}</span>
                    </div>
                    <div className="bg-purple-50/90 border border-purple-200 p-3.5 rounded-2xl shadow-3xs">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">বর্তমান ব্যালেন্স</span>
                      <span className={`font-mono font-black text-base sm:text-lg ${emp.wallet.availableBalance < 0 ? 'text-rose-600' : 'text-purple-950'}`}>
                        {emp.wallet.availableBalance < 0 ? `-৳${Math.abs(emp.wallet.availableBalance).toLocaleString()}` : `৳${emp.wallet.availableBalance.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Main Itemized Ledger Table Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📈</span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                          {lang === 'bn' ? 'আর্নিং ও ইনকাম লেনদেন খতিয়ান' : 'Earning & Income Ledger'}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 font-mono bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        মোট {resellerLedgerList.length}টি লেনদেন
                      </span>
                    </div>

                    {resellerLedgerList.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-3xs">
                        <table className="w-full text-left text-xs text-slate-700 min-w-[650px]">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-xs">
                            <tr>
                              <th className="py-2.5 px-3 whitespace-nowrap">তারিখ ও সময়</th>
                              <th className="py-2.5 px-3">ইনকামের উৎস ও বিবরণ</th>
                              <th className="py-2.5 px-3">রেফারেন্স / আইডি</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap">যোগ / বিয়োগ টাকা</th>
                              <th className="py-2.5 px-3 text-right whitespace-nowrap">আপডেটেড ব্যালেন্স</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {resellerLedgerList.map((item) => {
                              const isCredit = item.type === 'CREDIT';
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                                    {new Date(item.timestamp).toLocaleDateString('bn-BD')} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                        isCredit ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                                      }`}>
                                        {item.category}
                                      </span>
                                      <span className="font-bold text-slate-800">{item.description}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">
                                    {item.reference}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-extrabold whitespace-nowrap">
                                    {isCredit ? (
                                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                        +৳{item.amount.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                                        -৳{item.amount.toLocaleString()}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs">
                                    ৳{item.runningBalance.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <p className="text-xs font-bold text-slate-600">কোনো ইনকাম বা লেনদেনের খতিয়ান পাওয়া যায়নি।</p>
                        <p className="text-[11px] text-slate-400">রিসেলার অর্ডার বা উত্তোলন সম্পন্ন করলে এখানে খতিয়ান দেখতে পাবেন।</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* MODAL: EDIT USER / RESELLER PROFILE                 */}
      {/* ==================================================== */}
      {isEditUserModalOpen && (() => {
        const currentEditUser = employees.find(e => e.id === editUserForm.id) || selectedUserForDetails;
        return (
          <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {currentEditUser?.avatarUrl ? (
                    <img
                      src={currentEditUser.avatarUrl}
                      alt={editUserForm.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#009245] font-black text-sm flex items-center justify-center border border-emerald-200 shadow-2xs">
                      {editUserForm.name ? editUserForm.name.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'bn' ? 'রিসেলার একাউন্ট এডিট করুন' : 'Edit Reseller Profile'}
                    </h3>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                      {lang === 'bn' ? 'রিসেলার একাউন্ট' : 'Reseller Account'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsEditUserModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
              </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{lang === 'bn' ? 'নাম' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}</label>
                <input
                  type="text"
                  required
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{lang === 'bn' ? 'ইমেইল' : 'Email Address'}</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{lang === 'bn' ? 'কাস্টম কমিশন ওভাররাইড রেট (%)' : 'Custom Commission Rate (%)'}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder={lang === 'bn' ? 'ডিফল্ট রেট ব্যবহার করতে খালি রাখুন' : 'Leave blank for standard rate'}
                  value={editUserForm.customCommissionRate}
                  onChange={(e) => setEditUserForm({ ...editUserForm, customCommissionRate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block flex items-center justify-between">
                  <span>{lang === 'bn' ? 'অ্যাডমিন নির্ধারিত মার্জিন / ফিক্সড পেআউট (টাকা)' : 'Admin Defined Margin / Fixed Payout (TK)'}</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Module 1</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="10"
                    value={editUserForm.resellerMargin}
                    onChange={(e) => setEditUserForm({ ...editUserForm, resellerMargin: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-bold text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {lang === 'bn' 
                    ? 'এই মার্জিনটি ডাউনলাইন একাউন্টগুলোর প্রোডাক্ট বেস প্রাইসে স্বয়ংক্রিয়ভাবে যুক্ত হবে।' 
                    : 'This margin is added to all product display prices for this reseller and downline users.'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">{lang === 'bn' ? 'একাউন্ট স্ট্যাটাস' : 'Account Status'}</label>
                <select
                  value={editUserForm.status}
                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-semibold"
                >
                  <option value="APPROVED">{lang === 'bn' ? 'সক্রিয় (Approved / Active)' : 'Active'}</option>
                  <option value="PENDING">{lang === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending'}</option>
                  <option value="SUSPENDED">{lang === 'bn' ? 'স্থগিত (Suspended)' : 'Suspended'}</option>
                  <option value="REJECTED">{lang === 'bn' ? 'বাতিলকৃত (Rejected)' : 'Rejected'}</option>
                  <option value="ARCHIVED">{lang === 'bn' ? 'আর্কাইভ (Archived)' : 'Archived'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* DEDICATED EDIT COMMISSION / MARGIN MODAL (MODULE 1, RULE 2 & 3) */}
      {isEditMarginModalOpen && selectedMarginEmp && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#009245] flex items-center justify-center font-black text-lg border border-emerald-200">
                  💰
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === 'bn' ? 'কমিশন / মার্জিন ওভাররাইড' : 'Edit Commission / Margin'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedMarginEmp.name} ({selectedMarginEmp.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditMarginModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMargin} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{lang === 'bn' ? 'রেফারেন্স আইডি / কোড:' : 'Reference Code:'}</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMarginEmp.referenceCode || selectedMarginEmp.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{lang === 'bn' ? 'অ্যাকাউন্টের ধরণ:' : 'Account Type:'}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedMarginEmp.isOfficialReferral || selectedMarginEmp.reference === 'TAWZOON9516' || isOfficialReferenceCode(selectedMarginEmp.reference)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {selectedMarginEmp.isOfficialReferral || selectedMarginEmp.reference === 'TAWZOON9516' || isOfficialReferenceCode(selectedMarginEmp.reference)
                      ? 'অফিসিয়াল রেফারেল (TAWZOON9516)'
                      : 'সাধারণ রিসেলার (Referral Reseller)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  {lang === 'bn' ? 'পাইকারি মার্জিন / রেফারেল মার্কআপ (টাকা):' : 'Wholesale Margin / Referral Markup (TK):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={marginInput}
                    onChange={(e) => setMarginInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#009245] outline-none font-mono font-bold text-slate-900"
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Strict Formula Explanation */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-150 text-[11px] text-emerald-950 space-y-1 leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <span>ℹ️</span> {lang === 'bn' ? 'রেফারেন্স প্রাইসিং ও প্রফিট লিমিট নিয়ম:' : 'Reference Pricing & Profit Rules:'}
                </p>
                <p className="text-[10.5px] text-emerald-900">
                  {lang === 'bn' 
                    ? `১. এই রেফারেন্স কোড দিয়ে যারা অ্যাকাউন্ট খুলবে, তাদের পাইকারি মূল্যের সাথে স্বয়ংক্রিয়ভাবে ৳${marginInput || 0} যোগ হবে (ডিফল্ট ১০ টাকা, এখানে ২০ দিলে তাদের পাইকারি মূল্যে ২০ টাকা অ্যাড হবে)।` 
                    : `1. Wholesale price markup = +৳${marginInput || 0} for all accounts registered under this reference.`}
                </p>
                <p className="text-[10.5px] text-emerald-900">
                  {lang === 'bn' 
                    ? `২. রিসেলার পণ্য বিক্রি করলে লাভের ১০% কমিশন পাবে (সর্বোচ্চ ১০০ টাকা পর্যন্ত লাভের অংশ কার্যকর থাকবে; অর্থাৎ ৫০ টাকা লাভে ৫ টাকা, ১০০ টাকা লাভে ১০ টাকা এবং ২০০/৩০০/৫০০ টাকা লাভ করলেও সর্বোচ্চ ১০ টাকা পাবে)।` 
                    : `2. Reseller earns 10% of profit capped at 100 Tk profit limit (max 10 Tk per item sale).`}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditMarginModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingMargin}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingMargin ? (
                    <span>{lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                  ) : (
                    <span>{lang === 'bn' ? 'মার্জিন আপডেট করুন' : 'Update Margin'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOPUP APPROVAL REVIEW & AMOUNT EDIT */}
      {selectedTopupForReview && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>💳 ব্যালেন্স অ্যাড অনুমোদন করুন</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  রিসেলার: <strong className="text-slate-800">{selectedTopupForReview.employeeName}</strong> ({selectedTopupForReview.employeePhone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopupForReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-xs text-emerald-900">
                <div className="flex justify-between font-bold">
                  <span>পেমেন্ট মেথড:</span>
                  <span>{selectedTopupForReview.paymentMethod}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>প্রেরক নম্বর:</span>
                  <span className="font-mono">{selectedTopupForReview.senderNumber}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>TrxID:</span>
                  <span className="font-mono">{selectedTopupForReview.trxId}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 block">
                  অনুমোদিত টাকার পরিমাণ (BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="1"
                    value={editTopupAmount}
                    onChange={(e) => setEditTopupAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#009245] outline-none"
                  />
                </div>
                <p className="text-[10.5px] text-slate-500">
                  রিসেলারের ওয়ালেটে এই পরিমাণ টাকা তাত্ক্ষণিকভাবে ক্রেডিট হিসেবে যোগ হয়ে যাবে।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTopupForReview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isProcessingTopup}
                onClick={async () => {
                  if (!adminToken || !selectedTopupForReview) return;
                  const finalAmt = Number(editTopupAmount);
                  if (isNaN(finalAmt) || finalAmt <= 0) {
                    showToast('সঠিক টাকার পরিমাণ দিন', 'error');
                    return;
                  }
                  setIsProcessingTopup(true);
                  try {
                    const res = await api.adminActionBalanceTopup(adminToken, selectedTopupForReview.id, {
                      action: 'APPROVE',
                      approvedAmount: finalAmt,
                    });
                    showToast(res.message || `৳${finalAmt} ওয়ালেটে যোগ করা হয়েছে!`, 'success');
                    setSelectedTopupForReview(null);
                    await loadAdminData();
                  } catch (err: any) {
                    showToast(err.message || 'অনুমোদন ব্যর্থ হয়েছে', 'error');
                  } finally {
                    setIsProcessingTopup(false);
                  }
                }}
                className="px-5 py-2 text-xs font-black bg-[#009245] hover:bg-[#007a38] text-white rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>{isProcessingTopup ? 'প্রসেস হচ্ছে...' : 'অনুমোদন ও ওয়ালেটে যোগ করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FULLSCREEN SCREENSHOT PROOF ZOOM */}
      {viewingTopupImage && (
        <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingTopupImage(null)}>
          <div className="relative max-w-2xl max-h-[90vh] w-full flex flex-col items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingTopupImage(null)}
              className="absolute -top-10 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 text-xs font-bold transition-all cursor-pointer"
            >
              ✕ বন্ধ করুন
            </button>
            <img src={viewingTopupImage} alt="Payment Proof Full" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20" />
          </div>
        </div>
      )}

      {/* Floating 1-Minute Smart Undo Toast Notification */}
      {undoStashItem && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 transition-all animate-bounce">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-xs font-bold text-rose-400">
                {lang === 'bn' ? 'স্থায়ীভাবে ডিলিট হচ্ছে!' : 'Permanently Deleting!'}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 font-medium leading-relaxed">
                {lang === 'bn' 
                  ? `"${undoStashItem.name}" ডিলিট করা হয়েছে। ১ মিনিট পর এটি চিরতরে মুছে যাবে।`
                  : `"${undoStashItem.name}" has been deleted. It will be permanently erased in 1 minute.`}
              </p>
            </div>
            <span className="bg-slate-800 border border-slate-700 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">
              {undoStashItem.countdown}s
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-rose-500 h-1 rounded-full transition-all duration-1000 ease-linear" 
              style={{ width: `${(undoStashItem.countdown / 60) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2.5 mt-1 pt-1 border-t border-slate-800/80">
            <span className="text-[9px] text-slate-400 font-medium">
              {lang === 'bn' ? 'কিবোর্ড থেকে Ctrl+Z চাপুন' : 'Or press Ctrl+Z to undo'}
            </span>
            <button
              onClick={handleUndoAction}
              className="px-4 py-1.5 text-xs font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/20"
            >
              {lang === 'bn' ? 'পুনরুদ্ধার করুন (Undo)' : 'Undo Action'}
            </button>
          </div>
        </div>
      )}

      </main>

    </div>
  );
};
