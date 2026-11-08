import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  X,
  Sparkles,
  Bot,
  HelpCircle,
  ArrowRight,
  Globe,
  Paperclip,
  Camera,
  Image,
  HardDrive,
  UploadCloud,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  History,
  Clock,
  MessageSquare,
  PlusCircle,
  RotateCcw,
  Calendar,
  AlertCircle,
  MessageSquarePlus,
  ShoppingBag,
  ExternalLink,
  Layers,
  Video,
  Film,
  Wallet,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Product } from '../../types/index.js';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageAttachments?: string[];
  timestamp: Date;
}

interface StoredChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  imageAttachments?: string[];
  timestamp: string;
}

interface ChatSession {
  id: string;
  dateKey: string; // 'YYYY-MM-DD'
  dateLabelBn: string;
  dateLabelEn: string;
  timestamp: number;
  preview: string;
  messages: StoredChatMessage[];
}

const STORAGE_KEY = 'tawzoon_ai_chat_sessions_v2';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds (72 hours)

// Convert English digits to Bengali digits
const toBnDigits = (numOrStr: string | number): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(numOrStr).replace(/[0-9]/g, (digit) => bnDigits[+digit] || digit);
};

// Generate Date Key (YYYY-MM-DD)
const getDateKey = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate Bengali/English Date Label
const formatSessionDateLabel = (dateStr: string, lang: 'bn' | 'en'): { bn: string; en: string } => {
  const target = new Date(dateStr);
  const now = new Date();
  
  const targetKey = getDateKey(target);
  const todayKey = getDateKey(now);
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  const monthsBn = [
    'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
  ];

  const dayBn = toBnDigits(target.getDate().toString().padStart(2, '0'));
  const monthBn = monthsBn[target.getMonth()];
  const yearBn = toBnDigits(target.getFullYear());

  if (targetKey === todayKey) {
    return {
      bn: `আজ (${dayBn} ${monthBn})`,
      en: `Today (${target.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})`
    };
  }

  if (targetKey === yesterdayKey) {
    return {
      bn: `গতকাল (${dayBn} ${monthBn})`,
      en: `Yesterday (${target.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})`
    };
  }

  return {
    bn: `${dayBn} ${monthBn} ${yearBn}`,
    en: target.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  };
};

// Interactive Product Card Component with Gallery Thumbnails support
const ChatProductItem: React.FC<{
  prod: Product;
  lang: string;
  onOrder: (p: Product) => void;
  onView: (p: Product) => void;
}> = ({ prod, lang, onOrder, onView }) => {
  const galleryUrls = useMemo(() => {
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      return prod.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean);
    }
    return prod.imageUrl ? [prod.imageUrl] : [];
  }, [prod]);

  const [activeImg, setActiveImg] = useState<string>(galleryUrls[0] || prod.imageUrl || '');

  return (
    <div className="bg-white border-2 border-emerald-500/80 rounded-xl p-2.5 shadow-sm space-y-2 text-left">
      <div className="flex items-center gap-2.5">
        <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative group">
          {activeImg ? (
            <img src={activeImg} alt="" className="w-full h-full object-cover transition" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[9px]">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[11px] font-black text-slate-900 truncate">
            {lang === 'bn' ? prod.nameBn : prod.nameEn}
          </h5>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-black text-rose-600 font-mono">৳{prod.sellingPrice?.toLocaleString()}</span>
            {prod.regularPrice && prod.regularPrice > prod.sellingPrice && (
              <span className="text-[10px] text-slate-400 line-through font-mono">৳{prod.regularPrice.toLocaleString()}</span>
            )}
            {prod.productCode && (
              <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-1 rounded">#{prod.productCode}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => onView(prod)}
              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-400/80 text-[10px] font-black rounded-lg shadow-2xs cursor-pointer active:scale-95 transition flex items-center gap-1"
              title={lang === 'bn' ? 'প্রোডাক্ট ওপেন করুন' : 'Open Product Details'}
            >
              <ExternalLink className="w-2.5 h-2.5 text-emerald-800" />
              <span>{lang === 'bn' ? 'ওপেন করুন 🔗' : 'Open'}</span>
            </button>
            <button
              type="button"
              onClick={() => onOrder(prod)}
              className="px-2.5 py-1 bg-[#009245] hover:bg-[#007a37] text-white text-[10px] font-black rounded-lg shadow-2xs cursor-pointer active:scale-95 transition flex items-center gap-1"
            >
              <ShoppingBag className="w-2.5 h-2.5" />
              <span>{lang === 'bn' ? 'অর্ডার করুন' : 'Order Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Gallery Thumbnails */}
      {galleryUrls.length > 1 && (
        <div className="pt-1.5 border-t border-slate-100">
          <div className="text-[9.5px] text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>{lang === 'bn' ? `গ্যালারি ছবি (${galleryUrls.length}টি)` : `Gallery Images (${galleryUrls.length})`}</span>
            <span className="text-[8.5px] text-emerald-700 font-normal">ক্লিক করে ছবি দেখুন</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {galleryUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImg(url)}
                className={`w-9 h-9 rounded-md overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                  activeImg === url ? 'border-[#009245] ring-2 ring-emerald-400/40' : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Gallery-${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AIChatWidget: React.FC = () => {
  const {
    lang,
    showToast,
    employee,
    employeeToken,
    isEmployeeAuthenticated,
    setResellerTab,
    setActivePortal,
    setSelectedProduct,
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'history'>('chat');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  // Fetch products for chat product recommendations
  useEffect(() => {
    const loadProducts = () => {
      fetch('/api/public/products')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.products)) {
            setCatalogProducts(data.products);
          }
        })
        .catch(() => {});
    };

    loadProducts();
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);
  
  // Active Storage Key per Reseller ID or Guest Mode
  const activeStorageKey = useMemo(() => {
    return isEmployeeAuthenticated && employee?.id
      ? `tawzoon_ai_chat_sessions_v2_emp_${employee.id}`
      : 'tawzoon_ai_chat_sessions_v2_guest';
  }, [isEmployeeAuthenticated, employee?.id]);

  // Default welcome message generator
  const getWelcomeMessage = (): ChatMessage => {
    if (isEmployeeAuthenticated && employee) {
      return {
        id: 'welcome',
        role: 'model',
        content: lang === 'bn' 
          ? `আসসালামু আলাইকুম ${employee.name || ''}! 🤖✨ আমি আপনার ব্যক্তিগত TAWZOON AI Assistant। আপনার ওয়ালেট ব্যালেন্স, সেলস রিপোর্ট, অর্ডার বা মার্কেটিং সংক্রান্ত তথ্য জানতে বলুন।`
          : `Assalamu Alaikum ${employee.name || ''}! 🤖✨ I am your personal TAWZOON AI Assistant. How can I assist with your store, wallet balance, orders, or marketing today?`,
        timestamp: new Date(),
      };
    }
    return {
      id: 'welcome',
      role: 'model',
      content: lang === 'bn' 
        ? 'হ্যালো! আমি TAWZOON AI Assistant 🤖। আপনাকে কীভাবে সাহায্য করতে পারি?'
        : 'Hello! I am TAWZOON AI Assistant 🤖. How can I assist you today?',
      timestamp: new Date(),
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isConfirmingOrder, setIsConfirmingOrder] = useState<boolean>(false);
  
  // Large Display Product Preview Modal State ("ওপেন করুন 🔗")
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewActiveImg, setPreviewActiveImg] = useState<string>('');

  // Interactive Quick Order Form Modal State
  const [showOrderFormModal, setShowOrderFormModal] = useState<boolean>(false);
  const [orderFormItems, setOrderFormItems] = useState<{ product: Product; quantity: number; variant?: string }[]>([]);
  const [orderFormCustomerName, setOrderFormCustomerName] = useState<string>('');
  const [orderFormCustomerPhone, setOrderFormCustomerPhone] = useState<string>('');
  const [orderFormCustomerAddress, setOrderFormCustomerAddress] = useState<string>('');
  const [orderFormDistrict, setOrderFormDistrict] = useState<'Dhaka' | 'Outside'>('Dhaka');

  // Add More Product Drawer State
  const [showAddProductDrawer, setShowAddProductDrawer] = useState<boolean>(false);
  const [addProductSearchQuery, setAddProductSearchQuery] = useState<string>('');
  
  // Attachments State - Multiple Images Supported
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Collapsible Chips State
  const [isChipsVisible, setIsChipsVisible] = useState(false);

  // Chat History Sessions (Auto-purged older than 3 days)
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper: Purge sessions older than 3 days
  const purgeExpiredSessions = (sessions: ChatSession[]): ChatSession[] => {
    const cutoffTime = Date.now() - THREE_DAYS_MS;
    return sessions.filter((s) => s.timestamp >= cutoffTime);
  };

  // Helper: Safe LocalStorage write with quota overflow protection
  const safeSaveSessionsToLocalStorage = (key: string, sessions: ChatSession[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (err) {
      console.warn('[LocalStorage Quota Exceeded] Stripping base64 images for history persistence:', err);
      try {
        // Strip heavy base64 Data URLs from saved sessions
        const lightweightSessions = sessions.map((s) => ({
          ...s,
          messages: s.messages.map((m) => ({
            ...m,
            imageAttachments: m.imageAttachments
              ? m.imageAttachments.map((img) => (img.length > 500 ? '[Photo]' : img))
              : undefined,
          })),
        }));
        localStorage.setItem(key, JSON.stringify(lightweightSessions));
      } catch {
        try {
          // Keep only newest 1 session if quota is still tight
          if (sessions.length > 0) {
            localStorage.setItem(key, JSON.stringify([sessions[0]]));
          }
        } catch {
          // Fallback gracefully without throwing
        }
      }
    }
  };

  // Load History from localStorage on mount or activeStorageKey change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(activeStorageKey);
      if (raw) {
        const parsed: ChatSession[] = JSON.parse(raw);
        const cleaned = purgeExpiredSessions(parsed);
        setHistorySessions(cleaned);
        if (cleaned.length !== parsed.length) {
          safeSaveSessionsToLocalStorage(activeStorageKey, cleaned);
        }
      } else {
        setHistorySessions([]);
      }
    } catch {
      setHistorySessions([]);
    }
    setMessages([getWelcomeMessage()]);
  }, [activeStorageKey]);

  // Save conversation automatically to today's session in history
  const persistCurrentChatToHistory = (updatedMessages: ChatMessage[]) => {
    try {
      // Filter out pure single welcome message
      const userOrRealMessages = updatedMessages.filter((m) => m.id !== 'welcome');
      if (userOrRealMessages.length === 0) return;

      const now = new Date();
      const todayKey = getDateKey(now);
      const labels = formatSessionDateLabel(todayKey, lang);

      // Extract first user query as preview
      const firstUserMsg = userOrRealMessages.find((m) => m.role === 'user');
      const previewText = firstUserMsg ? firstUserMsg.content.slice(0, 60) : 'চ্যাট কনভারসেশন';

      const serializedMsgs: StoredChatMessage[] = userOrRealMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        // Compress/strip huge Data URLs for history persistence to avoid localStorage quota errors
        imageAttachments: m.imageAttachments?.map((img) => (img.startsWith('data:image/') && img.length > 5000 ? 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&auto=format&fit=crop' : img)),
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
      }));

      setHistorySessions((prev) => {
        const cleaned = purgeExpiredSessions(prev);
        const existingIdx = cleaned.findIndex((s) => s.dateKey === todayKey);

        let newSessions: ChatSession[];
        if (existingIdx >= 0) {
          newSessions = cleaned.map((s, idx) =>
            idx === existingIdx
              ? {
                  ...s,
                  timestamp: now.getTime(),
                  preview: previewText,
                  messages: serializedMsgs,
                }
              : s
          );
        } else {
          const newSession: ChatSession = {
            id: `session-${todayKey}-${now.getTime()}`,
            dateKey: todayKey,
            dateLabelBn: labels.bn,
            dateLabelEn: labels.en,
            timestamp: now.getTime(),
            preview: previewText,
            messages: serializedMsgs,
          };
          newSessions = [newSession, ...cleaned];
        }

        newSessions.sort((a, b) => b.timestamp - a.timestamp);
        setTimeout(() => safeSaveSessionsToLocalStorage(activeStorageKey, newSessions), 0);
        return newSessions;
      });
    } catch (err) {
      console.error('[ChatHistory Persist Error]', err);
    }
  };

  // Load a historical session back into active view
  const handleLoadSession = (session: ChatSession) => {
    const deserializedMsgs: ChatMessage[] = [
      getWelcomeMessage(),
      ...session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        imageAttachments: m.imageAttachments,
        timestamp: new Date(m.timestamp),
      })),
    ];
    setMessages(deserializedMsgs);
    setCurrentView('chat');
    showToast(
      lang === 'bn'
        ? `✓ ${session.dateLabelBn}-এর চ্যাট হিস্ট্রি লোড হয়েছে!`
        : `✓ Loaded chat from ${session.dateLabelEn}!`,
      'success'
    );
  };

  // Delete a specific session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historySessions.filter((s) => s.id !== sessionId);
    setHistorySessions(updated);
    safeSaveSessionsToLocalStorage(activeStorageKey, updated);
    showToast(lang === 'bn' ? '✓ নির্দিষ্ট দিনের হিস্ট্রি ডিলিট করা হয়েছে' : '✓ Session deleted', 'success');
  };

  // Clear ALL chat history (makes chatbox 100% free and fresh)
  const handleClearAllHistory = () => {
    setHistorySessions([]);
    try {
      localStorage.removeItem(activeStorageKey);
    } catch {
      // Ignore
    }
    setMessages([getWelcomeMessage()]);
    setCurrentView('chat');
    showToast(
      lang === 'bn'
        ? '✓ চ্যাট হিস্ট্রি সম্পূর্ণরূপে মুছে চ্যাট বক্স ফ্রি করা হয়েছে!'
        : '✓ All chat history cleared!',
      'success'
    );
  };

  // Start a fresh new chat session
  const handleStartNewChat = () => {
    setMessages([getWelcomeMessage()]);
    setInputValue('');
    setSelectedImages([]);
    setCurrentView('chat');
    showToast(lang === 'bn' ? '✓ নতুন চ্যাট শুরু হয়েছে!' : '✓ Started new chat!');
  };

  // Auto-resize Textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current && currentView === 'chat') {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isChipsVisible, currentView]);

  // Dynamic mobile viewport height tracking for ultra-smooth on-screen keyboard sliding & positioning
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMobileViewportHeight(null);
      return;
    }

    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        if (window.innerWidth < 640) {
          const height = Math.round(window.visualViewport.height);
          setMobileViewportHeight(height);
          requestAnimationFrame(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          });
        } else {
          setMobileViewportHeight(null);
        }
      }
    };

    handleViewportChange();

    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (vv) {
      vv.addEventListener('resize', handleViewportChange);
      vv.addEventListener('scroll', handleViewportChange);
      return () => {
        vv.removeEventListener('resize', handleViewportChange);
        vv.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, [isOpen]);

  // In-App Action Navigation Handler
  const handleNavigateAction = (actionKey: string) => {
    const key = actionKey.toLowerCase();
    
    if (key === 'whatsapp' || key === 'contact' || key === 'support-call') {
      window.open('https://wa.me/8801722439516', '_blank');
      showToast(lang === 'bn' ? 'অফিশিয়াল হোয়াটসঅ্যাপ ওপেন হচ্ছে (01722439516)...' : 'Opening official WhatsApp (01722439516)...', 'success');
      return;
    }

    if (key === 'register' || key === 'join' || key === 'login') {
      setActivePortal('employee');
      setIsOpen(false);
      showToast(lang === 'bn' ? 'রিসেলার জয়েনিং পোর্টাল ওপেন হয়েছে 🚀' : 'Reseller portal opened 🚀', 'success');
      return;
    }

    const map: Record<string, 'training' | 'campaigns' | 'video-generator' | 'catalog' | 'orders' | 'withdrawal' | 'create-website' | 'referral' | 'support' | 'dashboard'> = {
      training: 'training',
      campaigns: 'campaigns',
      'video-generator': 'video-generator',
      video: 'video-generator',
      catalog: 'catalog',
      orders: 'orders',
      order: 'orders',
      withdrawal: 'withdrawal',
      wallet: 'withdrawal',
      'create-website': 'create-website',
      website: 'create-website',
      referral: 'referral',
      support: 'support',
      dashboard: 'dashboard',
    };

    const targetTab = map[key] || 'catalog';
    setActivePortal('employee');
    setResellerTab(targetTab);
    setIsOpen(false);
    showToast(lang === 'bn' ? 'সংশ্লিষ্ট পেজে নিয়ে যাওয়া হয়েছে 🚀' : 'Navigated to selected section 🚀', 'success');
  };

  // Direct Product Order in Chat -> Opens Interactive Quick Order Form Modal
  const handleOrderProduct = (prod: Product) => {
    setOrderFormItems([{ product: prod, quantity: 1, variant: '' }]);
    setShowOrderFormModal(true);
  };

  // Direct Product Details Large Preview Modal ("ওপেন করুন 🔗")
  const handleViewProduct = (prod: Product) => {
    const gallery = (prod.images && Array.isArray(prod.images) && prod.images.length > 0)
      ? prod.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean)
      : (prod.imageUrl ? [prod.imageUrl] : []);
    setPreviewActiveImg(gallery[0] || prod.imageUrl || '');
    setPreviewProduct(prod);
  };

  // Handle Interactive Quick Order Form Submission
  const handleFormSubmitOrder = () => {
    if (!orderFormCustomerPhone || orderFormCustomerPhone.trim().length < 11) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর দিন' : 'Please provide a valid 11-digit mobile number', 'error');
      return;
    }
    if (!orderFormCustomerAddress || !orderFormCustomerAddress.trim()) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা দিন' : 'Please provide full delivery address', 'error');
      return;
    }
    if (orderFormItems.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে একটি প্রোডাক্ট অর্ডারে যোগ করুন' : 'Please select at least one product', 'error');
      return;
    }

    const isDhaka = orderFormDistrict === 'Dhaka';
    const deliveryFee = isDhaka ? 70 : 120;
    const primaryProd = orderFormItems[0].product;
    const totalQty = orderFormItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = orderFormItems.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
    const grandTotal = subtotal + deliveryFee;

    const name = orderFormCustomerName.trim() || 'গ্রাহক';
    const phone = orderFormCustomerPhone.trim();
    const address = orderFormCustomerAddress.trim();

    const itemsSummaryStr = orderFormItems.map(i => `${i.product.nameBn || i.product.nameEn} (${i.quantity}টি)`).join(', ');

    const promptMessage = `অর্ডারের সকল তথ্য নিশ্চিত করা হয়েছে:
👤 কাস্টমার: ${name} (${phone})
📍 ঠিকানা: ${address} (${isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'})
📦 পণ্য: ${itemsSummaryStr}

[order_card:${primaryProd.id}|${totalQty}|${name}|${phone}|${address}|${isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'}|${deliveryFee}|${grandTotal}]`;

    setShowOrderFormModal(false);
    handleSendMessage(promptMessage);
  };

  // In-Chat Instant Order Execution Handler
  const handleExecuteAIOrder = async (orderParams: {
    productId: string;
    quantity: number;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    district?: string;
    deliveryCharge?: number;
    subtotal?: number;
    grandTotal?: number;
  }) => {
    setIsConfirmingOrder(true);
    try {
      const res = await fetch('/api/public/ai-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(employeeToken ? { Authorization: `Bearer ${employeeToken}` } : {})
        },
        body: JSON.stringify({
          productId: orderParams.productId,
          quantity: orderParams.quantity,
          customerName: orderParams.customerName,
          customerPhone: orderParams.customerPhone,
          customerAddress: orderParams.customerAddress,
          district: orderParams.district || 'ঢাকা',
          deliveryCharge: orderParams.deliveryCharge,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(lang === 'bn' ? 'অর্ডারটি সফলভাবে সম্পন্ন হয়েছে! 🎉' : 'Order placed successfully! 🎉', 'success');
        
        const confirmationMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'model',
          content: `🎉 আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!

📦 অর্ডার নম্বর: ${data.orderCode}
🛍️ পণ্য: ${data.productName}
🔢 পরিমাণ: ${data.quantity}টি
💵 পণ্যের মূল্য: ৳${data.subtotal?.toLocaleString()}
🚚 ডেলিভারি চার্জ: ৳${data.deliveryCharge} (${data.district || 'কুরিয়ার'})
💰 মোট প্রদেয় (ক্যাশ অন ডেলিভারি): ৳${data.grandTotal?.toLocaleString()}
${data.isReseller && data.profit ? `📈 প্রত্যাশিত প্রফিট: ৳${data.profit?.toLocaleString()}` : ''}
👤 কাস্টমার: ${data.customerName} (${data.customerPhone})
📍 ঠিকানা: ${data.customerAddress}
🚚 কুরিয়ার: Steadfast Courier (ট্র্যাকিং: ${data.trackingCode})

আমাদের টিম শীঘ্রই পার্সেলটি প্যাকেজিং সম্পন্ন করে পাঠিয়ে দেবে। ধন্যবাদ!`,
          timestamp: new Date(),
        };

        const next = [...messages, confirmationMsg];
        setMessages(next);
        persistCurrentChatToHistory(next);
      } else {
        showToast(data.error || (lang === 'bn' ? 'অর্ডার কনফার্ম করতে সমস্যা হয়েছে।' : 'Failed to confirm order.'), 'error');
      }
    } catch (err) {
      console.error('[AI Order Confirm Client Error]', err);
      showToast(lang === 'bn' ? 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' : 'Network error. Please try again.', 'error');
    } finally {
      setIsConfirmingOrder(false);
    }
  };

  // Trigger Local Image Selection
  const triggerImageUpload = () => {
    setIsAttachMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Support selecting and appending multiple images seamlessly
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImages((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Open Web Camera
  const openCamera = async () => {
    setIsAttachMenuOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setSelectedImages((prev) => [
        ...prev,
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      ]);
    }
  };

  // Capture Photo from Camera
  const captureCameraPhoto = () => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImages((prev) => [...prev, dataUrl]);
        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Handle Quick Helpers click
  const handleQuickHelper = (text: string) => {
    handleSendMessage(text);
    setIsChipsVisible(false);
  };

  // Send Message with Multiple Images support and Isolated Reseller Account Context
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text && selectedImages.length === 0) return;

    if (!textToSend) {
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }

    const currentImages = [...selectedImages];
    if (selectedImages.length > 0) {
      setSelectedImages([]);
    }

    // Add user message with multiple image attachments
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: text || (lang === 'bn' ? 'সংযুক্ত ছবি পাঠানো হয়েছে' : 'Attached photos sent'),
      imageAttachments: currentImages.length > 0 ? currentImages : undefined,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    persistCurrentChatToHistory(nextMessages);
    setIsLoading(true);

    // Strictly Isolated Authenticated Reseller Context (No cross-account leakage)
    const userContext = isEmployeeAuthenticated && employee ? {
      isReseller: true,
      resellerName: employee.name,
      phone: employee.phone,
      balance: employee.wallet?.availableBalance ?? 0,
      totalSales: 0,
      totalEarnings: employee.wallet?.totalEarnings ?? 0,
      referralCode: employee.referenceCode || '',
      referralCount: 0,
    } : {
      isReseller: false,
    };

    try {
      // API call to Express backend utilizing @google/genai SDK (gemini-2.5-flash)
      const response = await fetch('/api/public/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(employeeToken ? { Authorization: `Bearer ${employeeToken}` } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            imageAttachments: m.imageAttachments,
          })),
          userContext,
        }),
      });

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn('[AI Chat JSON Parse Warning]', jsonErr);
        }
      } else {
        console.warn('[AI Chat Unexpected Response]', response.status, contentType);
      }

      const botReply = data?.reply || (lang === 'bn'
        ? 'দুঃখিত, এই মুহূর্তে উত্তর তৈরি করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।'
        : 'Sorry, I could not generate a response right now. Please try again.');

      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        content: botReply,
        timestamp: new Date(),
      };

      const finalMessages = [...nextMessages, botMsg];
      setMessages(finalMessages);
      persistCurrentChatToHistory(finalMessages);
    } catch (error) {
      console.error('[AI Chat Error]', error);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        content: lang === 'bn'
          ? 'দুঃখিত, সার্ভারের সাথে সংযোগ করা যাচ্ছে না। দয়া করে আবার চেষ্টা করুন।'
          : 'Sorry, connection to the server failed. Please try again.',
        timestamp: new Date(),
      };
      const finalMessages = [...nextMessages, errorMsg];
      setMessages(finalMessages);
      persistCurrentChatToHistory(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // High-Fidelity Animated Vector SVG Robot Logo Component
  const RenderCuteRobotLogo = ({ size = 'w-16 h-16', isCompact = false }: { size?: string; isCompact?: boolean }) => {
    return (
      <div className={`relative ${size} transition-all duration-300 transform select-none group cursor-pointer`}>
        {/* Active Ambient Green/Cyan Aura Glow */}
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-[#00ff66]/30 via-[#00e5ff]/30 to-[#009245]/30 blur-md animate-[robotAura_3.5s_ease-in-out_infinite] pointer-events-none" />

        {/* Main Floating Robot Vector Container */}
        <div className="w-full h-full relative flex items-center justify-center animate-[robotFloat_3.5s_ease-in-out_infinite]">
          
          <svg
            viewBox="0 0 200 210"
            className="w-full h-full filter drop-shadow-[0_6px_16px_rgba(0,146,69,0.3)] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* High Contrast Dark Chrome Metallic Gradients */}
              <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <linearGradient id="robotHeadGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="40%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="visorBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#022c22" />
                <stop offset="60%" stopColor="#04090b" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>

              <linearGradient id="blueAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#0088ff" />
                <stop offset="100%" stopColor="#0044cc" />
              </linearGradient>

              <linearGradient id="greenAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ff66" />
                <stop offset="100%" stopColor="#00cc44" />
              </linearGradient>

              <linearGradient id="antennaRodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ff66" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="speechBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              {/* High Intensity Glow Filters */}
              <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ==================== 1. SYMMETRICAL DUAL ANTENNAS (NEON GREEN SIGNAL HORNS) ==================== */}
            {/* Left Antenna Horn */}
            <g className="antenna-group-left">
              {/* Radiating Radar Active Signal Wave Rings (Left) */}
              <circle cx="48" cy="18" r="14" fill="none" stroke="#00ff66" strokeWidth="2" className="animate-[signalWave_2.4s_ease-out_infinite_0.4s]" opacity="0.95" filter="url(#greenGlow)" />
              <circle cx="48" cy="18" r="22" fill="none" stroke="#00ff66" strokeWidth="1.5" className="animate-[signalWave_2.4s_ease-out_infinite_1.2s]" opacity="0.85" filter="url(#greenGlow)" />
              <circle cx="48" cy="18" r="30" fill="none" stroke="#00e5ff" strokeWidth="1.2" className="animate-[signalWave_2.4s_ease-out_infinite_2.0s]" opacity="0.6" />

              {/* Extended Tall Antenna Stem (Left) */}
              <path d="M 68 58 L 52 24" stroke="url(#antennaRodGrad)" strokeWidth="6" strokeLinecap="round" />
              <path d="M 68 58 L 52 24" stroke="#00ff66" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" filter="url(#greenGlow)" />

              {/* Antenna Joints / Ridges (Left) */}
              <rect x="59" y="48" width="6" height="3" rx="1.5" fill="#00ff66" transform="rotate(65 62 49.5)" />
              <rect x="53" y="32" width="5" height="3" rx="1.5" fill="#00ff66" transform="rotate(65 55.5 33.5)" />

              {/* Antenna Tip Glowing Orb (Left) */}
              <circle cx="48" cy="18" r="8.5" fill="url(#greenAccentGrad)" filter="url(#greenGlow)" />
              <circle cx="48" cy="18" r="4" fill="#ffffff" className="animate-[pulse_1.2s_ease-in-out_infinite_0.3s]" />
            </g>

            {/* Right Antenna Horn */}
            <g className="antenna-group-right">
              {/* Radiating Radar Active Signal Wave Rings (Right) */}
              <circle cx="152" cy="18" r="14" fill="none" stroke="#00ff66" strokeWidth="2" className="animate-[signalWave_2.4s_ease-out_infinite_0s]" opacity="0.95" filter="url(#greenGlow)" />
              <circle cx="152" cy="18" r="22" fill="none" stroke="#00ff66" strokeWidth="1.5" className="animate-[signalWave_2.4s_ease-out_infinite_0.8s]" opacity="0.85" filter="url(#greenGlow)" />
              <circle cx="152" cy="18" r="30" fill="none" stroke="#00e5ff" strokeWidth="1.2" className="animate-[signalWave_2.4s_ease-out_infinite_1.6s]" opacity="0.6" />

              {/* Extended Tall Antenna Stem (Right) */}
              <path d="M 132 58 L 148 24" stroke="url(#antennaRodGrad)" strokeWidth="6" strokeLinecap="round" />
              <path d="M 132 58 L 148 24" stroke="#00ff66" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" filter="url(#greenGlow)" />

              {/* Antenna Joints / Ridges (Right) */}
              <rect x="135" y="48" width="6" height="3" rx="1.5" fill="#00ff66" transform="rotate(-65 138 49.5)" />
              <rect x="142" y="32" width="5" height="3" rx="1.5" fill="#00ff66" transform="rotate(-65 144.5 33.5)" />

              {/* Antenna Tip Glowing Orb (Right) */}
              <circle cx="152" cy="18" r="8.5" fill="url(#greenAccentGrad)" filter="url(#greenGlow)" />
              <circle cx="152" cy="18" r="4" fill="#ffffff" className="animate-[pulse_1.2s_ease-in-out_infinite]" />
            </g>

            {/* ==================== 2. STREAMLINED ARMLESS CAPSULE BODY ==================== */}
            {/* Smooth Rounded Lower Body Pod */}
            <rect
              x="46"
              y="136"
              width="108"
              height="58"
              rx="28"
              fill="url(#robotBodyGrad)"
              stroke="#00e5ff"
              strokeWidth="2.5"
              filter="drop-shadow(0 6px 12px rgba(0,0,0,0.4))"
            />
            {/* Neon Green Metallic Bottom Rim Ring */}
            <path d="M 54 180 C 72 192, 128 192, 146 180" stroke="url(#greenAccentGrad)" strokeWidth="4" strokeLinecap="round" filter="url(#greenGlow)" />

            {/* ==================== 3. CHEST SHOPPING BAG WITH BOLD "TZ" LOGO ==================== */}
            <g className="chest-badge-group">
              {/* Bag Handle */}
              <path d="M 80 146 C 80 136, 110 136, 110 146" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
              {/* Crisp White Shopping Bag Badge for Maximum Pop */}
              <rect x="68" y="145" width="54" height="42" rx="8" fill="#ffffff" stroke="#00ff66" strokeWidth="2" filter="drop-shadow(0 4px 10px rgba(0,255,102,0.35))" />
              {/* Blue Side Trim on Bag */}
              <path d="M 115 145 L 122 145 C 122 145 120 180 118 187 L 115 187 Z" fill="url(#blueAccentGrad)" opacity="0.9" />

              {/* Ultra-Sharp "TZ" Brand Emblem */}
              {/* Bold Black 'T' */}
              <path d="M 74 153 L 91 153 L 91 157 L 85 157 L 85 178 L 80 178 L 80 157 L 74 157 Z" fill="#020617" />
              {/* Vibrant High-Clarity Emerald Green 'Z' with Dark Outline */}
              <path
                d="M 88 161 L 110 161 L 94 174 L 110 174 L 110 180 L 87 180 L 103 167 L 88 167 Z"
                fill="#00e65c"
                stroke="#0f172a"
                strokeWidth="1.2"
                strokeLinejoin="round"
                filter="url(#greenGlow)"
              />
            </g>

            {/* ==================== 4. PROFESSIONAL SUPPORT DESK HEADPHONES & HEADSET MIC ==================== */}
            {/* Head Base Outer Shell */}
            <rect x="42" y="46" width="106" height="88" rx="44" fill="url(#robotHeadGrad)" stroke="#00e5ff" strokeWidth="2.5" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))" />

            {/* Top Head Metallic Chrome Rim Arc */}
            <path d="M 52 58 C 70 46, 120 46, 138 58" stroke="url(#greenAccentGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round" filter="url(#greenGlow)" />

            {/* Left Over-Ear Headphone with Glowing Blue/Cyan LED Ring */}
            <g className="headphone-left">
              <rect x="30" y="66" width="15" height="42" rx="7.5" fill="url(#blueAccentGrad)" stroke="#00e5ff" strokeWidth="2" filter="url(#cyanGlow)" />
              <rect x="33" y="71" width="9" height="32" rx="4.5" fill="#0f172a" />
              <rect x="35" y="76" width="5" height="22" rx="2.5" fill="#00e5ff" opacity="0.8" className="animate-[pulse_2s_ease-in-out_infinite]" />
            </g>

            {/* Right Over-Ear Headphone with Glowing Blue/Cyan LED Ring */}
            <g className="headphone-right">
              <rect x="145" y="66" width="15" height="42" rx="7.5" fill="url(#blueAccentGrad)" stroke="#00e5ff" strokeWidth="2" filter="url(#cyanGlow)" />
              <rect x="148" y="71" width="9" height="32" rx="4.5" fill="#0f172a" />
              <rect x="150" y="76" width="5" height="22" rx="2.5" fill="#00e5ff" opacity="0.8" className="animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
            </g>

            {/* Support Helpdesk Headset Microphone Boom Arm */}
            <g className="headset-microphone">
              <path d="M 148 94 Q 138 114 122 110" fill="none" stroke="url(#blueAccentGrad)" strokeWidth="3.5" strokeLinecap="round" filter="url(#cyanGlow)" />
              <ellipse cx="120" cy="110" rx="5" ry="4" fill="#0f172a" stroke="#00e5ff" strokeWidth="1.5" />
              <circle cx="120" cy="110" r="2" fill="#00ff66" filter="url(#greenGlow)" className="animate-[pulse_1.2s_ease-in-out_infinite]" />
            </g>

            {/* ==================== 5. GLOSSARY VISOR & CRISP WHITE SMILING EYES ==================== */}
            {/* Dark Visor Mask */}
            <rect x="52" y="58" width="86" height="58" rx="28" fill="url(#visorBgGrad)" stroke="#00ff66" strokeWidth="2.5" filter="drop-shadow(0 0 8px rgba(0,255,102,0.4))" />

            {/* Visor Inner Neon Green Border Glow Arc */}
            <rect x="54" y="60" width="82" height="54" rx="26" fill="none" stroke="#00ff66" strokeWidth="1.2" opacity="0.8" filter="url(#greenGlow)" />

            {/* Smooth Blinking Visor Eye Group - CRISP BRIGHT WHITE */}
            <g className="visor-eyes animate-[eyeBlink_4.5s_ease-in-out_infinite]">
              {/* Left Smiling Arc Eye (CRISP WHITE) */}
              <path d="M 68 84 C 72 72, 82 72, 86 84" fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #00ff66)" />
              {/* Right Smiling Arc Eye (CRISP WHITE) */}
              <path d="M 104 84 C 108 72, 118 72, 122 84" fill="none" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" filter="drop-shadow(0 0 6px #00ff66)" />
              {/* Cute Smiling Mouth Curve (CRISP WHITE) */}
              <path d="M 91 96 C 93 100, 97 100, 99 96" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.95" filter="drop-shadow(0 0 4px #00ff66)" />
            </g>

            {/* Glossy Visor Reflection Highlight */}
            <path d="M 58 66 C 70 62, 100 62, 110 64 C 90 67, 70 70, 58 66 Z" fill="#ffffff" opacity="0.25" />
          </svg>

        </div>

        {/* CSS Keyframes */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes robotFloat {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-6px) scale(1.02); }
          }
          @keyframes robotAura {
            0%, 100% { opacity: 0.3; transform: scale(0.96); }
            50% { opacity: 0.85; transform: scale(1.08); }
          }
          @keyframes signalWave {
            0% { r: 6px; opacity: 0.9; stroke-width: 2px; }
            100% { r: 32px; opacity: 0; stroke-width: 0.5px; }
          }
          @keyframes eyeBlink {
            0%, 88%, 100% { transform: scaleY(1); opacity: 1; transform-origin: center; }
            92%, 96% { transform: scaleY(0.08); opacity: 0.3; transform-origin: center; }
          }
          @keyframes fingerPulse {
            0%, 100% { transform: scale(0.85); opacity: 0.3; }
            50% { transform: scale(1.4); opacity: 1; }
          }
          @keyframes dotBounce {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(-4px); opacity: 1; fill: #00ff66; }
          }
          @keyframes borderRotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </div>
    );
  };

  return (
    <>
      {/* Invisible HTML File input supporting multiple selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* 1. Floating Robot Button with Glowing Pulse Indicator */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setCurrentView('chat');
        }}
        className={`fixed bottom-26 right-4 sm:bottom-12 md:bottom-14 sm:right-8 md:right-10 z-50 p-0.5 rounded-full cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none scale-90 sm:scale-105 md:scale-110 ${
          isOpen ? '!scale-0 opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title={lang === 'bn' ? 'তাউজুন এআই চ্যাট' : 'Tawzoon AI Chat'}
      >
        <RenderCuteRobotLogo size="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18" />
      </button>

      {/* 2. Interactive Modal: Full-screen on Mobile, Bottom-Right Fixed on Desktop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none pointer-events-auto sm:pointer-events-none flex items-center justify-center p-0 sm:items-end sm:justify-end sm:p-5 md:p-6 transition-opacity duration-300"
          style={mobileViewportHeight ? { height: `${mobileViewportHeight}px`, bottom: 'auto' } : undefined}
        >
          <div 
            className="pointer-events-auto relative p-0 sm:p-[1.5px] bg-gradient-to-r from-emerald-600 via-cyan-400 to-emerald-600 bg-[length:200%_200%] animate-[borderRotate_4s_linear_infinite] w-full h-[100dvh] sm:w-[415px] md:w-[425px] sm:h-[calc(100vh-5.5rem)] sm:max-h-[820px] rounded-none sm:rounded-[20px] shadow-none sm:shadow-2xl sm:shadow-black/25 flex overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={mobileViewportHeight ? { height: `${mobileViewportHeight}px`, maxHeight: `${mobileViewportHeight}px` } : undefined}
          >
            {/* Inner Main Container */}
            <div className="bg-white w-full h-full rounded-none sm:rounded-[18.5px] overflow-hidden flex flex-col relative">
              
              {/* Header with History Icon & Clean Actions - Premium Green Neon + Glassmorphism */}
              <div className="bg-gradient-to-r from-[#012f17] via-[#024420] to-[#015227] p-2.5 sm:p-3.5 px-3 sm:px-4 text-white flex items-center justify-between shrink-0 relative rounded-none sm:rounded-t-[18.5px] border-b border-emerald-400/20 shadow-[0_4px_16px_rgba(0,30,15,0.4),inset_0_1px_0_rgba(0,230,118,0.25)] backdrop-blur-md z-10">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  {/* Floating robot logo */}
                  <div
                    className="relative shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 filter drop-shadow-[0_0_8px_rgba(0,230,118,0.4)]"
                    onClick={() => setCurrentView('chat')}
                    title={lang === 'bn' ? 'চ্যাটে ফিরুন' : 'Back to Chat'}
                  >
                    <RenderCuteRobotLogo size="w-10 h-10 sm:w-11 sm:h-11" isCompact />
                  </div>
                  
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {/* TAWZOON brand name: White & Neon Green */}
                      <span className="font-extrabold text-[15px] sm:text-[16.5px] tracking-tight leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0">
                        TAW<span className="text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.6)]">ZOON</span>
                      </span>

                      {/* AI ASSISTANT Badge: Modern Clean Outline Style */}
                      <span className="px-2 py-0.5 rounded-full border border-[#00e676]/90 bg-emerald-950/50 text-white font-extrabold text-[8.5px] sm:text-[9px] tracking-wider uppercase backdrop-blur-xs leading-none shadow-[0_0_8px_rgba(0,230,118,0.25)] shrink-0">
                        AI ASSISTANT
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[10px] sm:text-[10.5px] text-white/90 font-medium leading-tight mt-1 tracking-tight truncate drop-shadow-xs">
                      {lang === 'bn' ? '২৪/৭ অন-টাইম অনলাইন সাপোর্ট' : '24/7 Online Support'}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons: History, New Chat, Close - Same Size & Equal Spacing */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                  
                  {/* Chat History Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentView(currentView === 'history' ? 'chat' : 'history')}
                    className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl border flex items-center justify-center text-white transition-all duration-200 cursor-pointer relative active:scale-95 backdrop-blur-xs ${
                      currentView === 'history'
                        ? 'bg-emerald-700/80 border-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.4)]'
                        : 'bg-emerald-950/45 hover:bg-emerald-800/50 border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-[0_0_8px_rgba(0,230,118,0.25)]'
                    }`}
                    title={lang === 'bn' ? '৩ দিনের চ্যাট হিস্ট্রি' : '3-Day Chat History'}
                  >
                    <History className="w-4 h-4 text-white" />
                    {historySessions.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[8px] font-black flex items-center justify-center shadow-xs">
                        {historySessions.length}
                      </span>
                    )}
                  </button>

                  {/* New Chat Button */}
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-emerald-950/45 hover:bg-emerald-800/50 border border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-[0_0_8px_rgba(0,230,118,0.25)] active:scale-95 text-white flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-xs"
                    title={lang === 'bn' ? 'নতুন চ্যাট শুরু করুন' : 'Start New Chat'}
                  >
                    <MessageSquarePlus className="w-4 h-4 text-white" />
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-emerald-950/45 hover:bg-emerald-800/50 border border-emerald-400/30 hover:border-emerald-400/60 hover:shadow-[0_0_8px_rgba(0,230,118,0.25)] text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 backdrop-blur-xs"
                    title={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* VIEW 1: 3-DAY CHAT HISTORY VIEW (২৪ ঘণ্টার তারিখ অনুযায়ী হিস্ট্রি) */}
              {/* ========================================================= */}
              {currentView === 'history' ? (
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/90 flex flex-col justify-between animate-in fade-in duration-150">
                  <div className="space-y-2.5">
                    {/* History Banner Notice: 3-day Auto-Purge explanation */}
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                          <Clock className="w-3.5 h-3.5 text-[#009245]" />
                          <span>{lang === 'bn' ? 'চ্যাট হিস্ট্রি (সর্বোচ্চ ৩ দিন)' : 'Chat History (3 Days)'}</span>
                        </div>
                        <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {lang === 'bn' ? 'অটোমেটিক ডিলিট' : 'Auto Purge'}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-relaxed">
                        {lang === 'bn'
                          ? 'প্রতি ২৪ ঘণ্টার চ্যাট আলাদা তারিখে সংরক্ষিত থাকে। চ্যাট বক্স দ্রুত ও ফ্রি রাখতে ৩ দিন পর পুরনো হিস্ট্রি স্বয়ংক্রিয়ভাবে মুছে যায়।'
                          : 'Daily chats are saved by date. Conversations older than 3 days are automatically purged to keep the chat fast.'}
                      </p>
                    </div>

                    {/* Sessions List */}
                    {historySessions.length === 0 ? (
                      <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-2 my-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-700">
                          {lang === 'bn' ? 'কোনো সংরক্ষিত হিস্ট্রি নেই' : 'No chat history'}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 max-w-xs mx-auto">
                          {lang === 'bn'
                            ? 'আপনি চ্যাট করলে এখানে তারিখ অনুযায়ী ৩ দিনের হিস্ট্রি দেখতে পারবেন।'
                            : 'Your recent 3-day conversations will appear here grouped by day.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-black text-slate-700">
                            {lang === 'bn' ? `সংরক্ষিত দিন (${toBnDigits(historySessions.length)}টি)` : `Saved Days (${historySessions.length})`}
                          </span>
                          <button
                            type="button"
                            onClick={handleClearAllHistory}
                            className="text-[10.5px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'সব মুছুন' : 'Clear all'}</span>
                          </button>
                        </div>

                        {historySessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => handleLoadSession(session)}
                            className="p-3 bg-white border border-slate-200/90 rounded-xl hover:border-[#009245] hover:shadow-sm transition-all cursor-pointer group space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 group-hover:text-[#009245] transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-[#009245]" />
                                <span>{lang === 'bn' ? session.dateLabelBn : session.dateLabelEn}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {toBnDigits(session.messages.length)} {lang === 'bn' ? 'মেসেজ' : 'msgs'}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                  title={lang === 'bn' ? 'এই দিনের হিস্ট্রি মুছুন' : 'Delete this day'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1 truncate font-medium pl-5">
                              💬 {session.preview}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom History Footer Actions */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentView('chat')}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {lang === 'bn' ? '← চ্যাটে ফিরুন' : '← Back to Chat'}
                    </button>

                    <button
                      type="button"
                      onClick={handleStartNewChat}
                      className="px-3.5 py-1.5 bg-[#009245] hover:bg-[#007a3a] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'নতুন চ্যাট' : 'New Chat'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* VIEW 2: ACTIVE CHAT VIEW */
                /* ========================================================= */
                <>
                  {/* Scrollable Chat Area */}
                  <div className="flex-1 overflow-y-auto p-4 pt-4 space-y-4 bg-slate-50/70 scrollbar-hidden">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] sm:text-xs font-semibold sm:font-bold leading-relaxed shadow-xs ${
                            msg.role === 'user'
                              ? 'bg-emerald-50 text-slate-900 border border-emerald-200/65 rounded-br-none'
                              : 'bg-slate-100 text-slate-900 border border-slate-200/50 rounded-bl-none'
                          }`}
                        >
                          {/* Render Multiple Image Attachments in a gorgeous grid */}
                          {msg.imageAttachments && msg.imageAttachments.length > 0 && (
                            <div className={`grid gap-1 mb-2 ${msg.imageAttachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {msg.imageAttachments.map((imgUrl, i) => (
                                <div key={i} className="max-w-full rounded-lg overflow-hidden border border-slate-100/10">
                                  <img src={imgUrl} alt={`Attachment-${i}`} className="max-h-36 object-cover w-full" />
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Render Structured Message Text, Product Cards, and Action Buttons */}
                          <div className="space-y-2">
                            {(() => {
                              const content = msg.content || '';
                              
                              // Extract [product:id] tags
                              const productMatches = Array.from(content.matchAll(/\[product:([a-zA-Z0-9_-]+)\]/g));
                              const productIds = productMatches.map((m) => m[1]);
                              const matchedProducts = productIds
                                .map((id) => catalogProducts.find((p: Product) => p.id === id || p.productCode?.toLowerCase() === id.toLowerCase()))
                                .filter(Boolean) as Product[];

                              // Extract [action:key|label] tags
                              const actionMatches = Array.from(content.matchAll(/\[action:([a-zA-Z0-9_-]+)\|([^\]]+)\]/g));
                              const actionButtons = actionMatches.map((m) => ({
                                key: m[1],
                                label: m[2],
                              }));

                              // Extract [order_card:productId|qty|customerName|customerPhone|customerAddress|district|deliveryFee|grandTotal] tags
                              const orderCardMatches = Array.from(content.matchAll(/\[order_card:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g));
                              const orderCards = orderCardMatches.map((m) => {
                                const prodId = m[1].trim();
                                const qty = parseInt(m[2].trim(), 10) || 1;
                                const name = m[3].trim();
                                const phone = m[4].trim();
                                const address = m[5].trim();
                                const district = m[6].trim();
                                const deliveryFee = parseInt(m[7].trim(), 10) || 70;
                                const grandTotal = parseInt(m[8].trim(), 10) || 0;
                                const matchedProd = catalogProducts.find((p: Product) => p.id === prodId || p.productCode?.toLowerCase() === prodId.toLowerCase());
                                const unitPrice = matchedProd?.sellingPrice || 0;
                                const subtotal = unitPrice * qty;
                                const profit = ((matchedProd as any)?.resellerProfit || Math.round(unitPrice * 0.15)) * qty;

                                return {
                                  prodId,
                                  qty,
                                  name,
                                  phone,
                                  address,
                                  district,
                                  deliveryFee,
                                  grandTotal: grandTotal || (subtotal + deliveryFee),
                                  subtotal,
                                  profit,
                                  matchedProd,
                                };
                              });

                              // Clean text
                              const cleanText = content
                                .replace(/\[product:([a-zA-Z0-9_-]+)\]/g, '')
                                .replace(/\[action:([a-zA-Z0-9_-]+)\|([^\]]+)\]/g, '')
                                .replace(/\[order_card:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g, '')
                                .trim();

                              return (
                                <>
                                  {cleanText && (
                                    <div className="whitespace-pre-line text-[14px] sm:text-xs font-normal sm:font-medium leading-relaxed">
                                      {cleanText.split('\n').map((line, lineIdx) => {
                                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                        return (
                                          <div key={lineIdx} className={line.startsWith('#') || line.startsWith('🔥') || line.startsWith('💡') || line.startsWith('📦') || line.startsWith('🌐') ? 'font-bold mt-1' : ''}>
                                            {parts.map((part, partIdx) => {
                                              if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={partIdx} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
                                              }
                                              return part;
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Render Embedded Product Recommendation Cards */}
                                  {matchedProducts.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                      <span className="text-[10px] font-black uppercase text-[#009245] flex items-center gap-1">
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>{lang === 'bn' ? 'সরাসরি অর্ডার ও বিবরণ:' : 'Recommended Products:'}</span>
                                      </span>
                                      <div className="grid grid-cols-1 gap-2">
                                        {matchedProducts.map((prod) => (
                                          <ChatProductItem
                                            key={prod.id}
                                            prod={prod}
                                            lang={lang}
                                            onOrder={handleOrderProduct}
                                            onView={handleViewProduct}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Render Interactive In-Chat Order Confirmation Preview Cards */}
                                  {orderCards.length > 0 && (
                                    <div className="space-y-3 pt-1">
                                      {orderCards.map((card, idx) => {
                                        const prodImg = card.matchedProd?.imageUrl || (card.matchedProd?.images && card.matchedProd?.images[0]?.url) || '';
                                        return (
                                          <div
                                            key={idx}
                                            className="bg-white border-2 border-emerald-500 rounded-2xl p-3 shadow-md text-left space-y-2.5 animate-in fade-in duration-200"
                                          >
                                            {/* Card Header */}
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                              <span className="text-[11px] font-black uppercase text-[#009245] flex items-center gap-1.5">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                <span>{lang === 'bn' ? 'অর্ডার কনফার্মেশন প্রিভিউ' : 'Order Confirmation'}</span>
                                              </span>
                                              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                                                {card.district.includes('ঢাকা') ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}
                                              </span>
                                            </div>

                                            {/* Product Info Row */}
                                            <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                                              <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                                                {prodImg ? (
                                                  <img src={prodImg} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold">No Img</div>
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-black text-slate-900 truncate">
                                                  {card.matchedProd ? (lang === 'bn' ? card.matchedProd.nameBn : card.matchedProd.nameEn) : card.prodId}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                  পরিমাণ: <strong className="text-slate-800 font-mono font-bold">{card.qty}টি</strong> × ৳{card.matchedProd?.sellingPrice?.toLocaleString() || 0}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Customer Details Box */}
                                            <div className="bg-slate-50/80 rounded-xl p-2.5 text-[10.5px] space-y-1 border border-slate-200/50">
                                              <div className="flex items-center justify-between">
                                                <span className="text-slate-500">গ্রাহকের নাম:</span>
                                                <strong className="text-slate-800">{card.name}</strong>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <span className="text-slate-500">মোবাইল নম্বর:</span>
                                                <strong className="text-slate-800 font-mono">{card.phone}</strong>
                                              </div>
                                              <div className="flex items-start justify-between gap-2">
                                                <span className="text-slate-500 shrink-0">ঠিকানা:</span>
                                                <strong className="text-slate-800 text-right leading-tight break-words">{card.address}</strong>
                                              </div>
                                            </div>

                                            {/* Price Breakdown */}
                                            <div className="border-t border-slate-100 pt-1.5 space-y-1 text-[11px]">
                                              <div className="flex justify-between text-slate-600">
                                                <span>পণ্যের মূল্য:</span>
                                                <span className="font-mono font-bold">৳{card.subtotal.toLocaleString()}</span>
                                              </div>
                                              <div className="flex justify-between text-slate-600">
                                                <span>ডেলিভারি চার্জ ({card.district.includes('ঢাকা') ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}):</span>
                                                <span className="font-mono font-bold">৳{card.deliveryFee}</span>
                                              </div>
                                              <div className="flex justify-between items-center text-slate-900 font-black pt-1 border-t border-dashed border-slate-200">
                                                <span className="text-xs text-[#009245]">সর্বমোট প্রদেয় (COD):</span>
                                                <span className="text-sm font-mono text-rose-600">৳{card.grandTotal.toLocaleString()}</span>
                                              </div>
                                              {isEmployeeAuthenticated && employee && (
                                                <div className="flex justify-between text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                  <span>আপনার প্রত্যাশিত লাভ:</span>
                                                  <span className="font-mono">+৳{card.profit.toLocaleString()}</span>
                                                </div>
                                              )}
                                            </div>

                                            {/* Confirm Order Action Button */}
                                            <button
                                              type="button"
                                              disabled={isConfirmingOrder}
                                              onClick={() => handleExecuteAIOrder({
                                                productId: card.matchedProd?.id || card.prodId,
                                                quantity: card.qty,
                                                customerName: card.name,
                                                customerPhone: card.phone,
                                                customerAddress: card.address,
                                                district: card.district,
                                                deliveryCharge: card.deliveryFee,
                                                subtotal: card.subtotal,
                                                grandTotal: card.grandTotal,
                                              })}
                                              className="w-full py-2.5 bg-gradient-to-r from-[#009245] to-emerald-600 hover:from-[#007a37] hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                              {isConfirmingOrder ? (
                                                <>
                                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                  <span>অর্ডার কনফার্ম হচ্ছে...</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Check className="w-4 h-4 stroke-[3]" />
                                                  <span>{lang === 'bn' ? 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)' : 'Confirm Order (COD)'}</span>
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Render Embedded In-App Action Buttons */}
                                  {actionButtons.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/60">
                                      {actionButtons.map((btn, btnIdx) => (
                                        <button
                                          key={btnIdx}
                                          type="button"
                                          onClick={() => handleNavigateAction(btn.key)}
                                          className="px-2.5 py-1 bg-gradient-to-r from-[#009245] to-emerald-600 hover:from-[#007a37] hover:to-emerald-700 text-white text-[10px] font-black rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                                        >
                                          <span>{btn.label}</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <span
                            className="text-[8.5px] block mt-1 text-right font-medium text-slate-400 opacity-65"
                          >
                            {msg.timestamp instanceof Date
                              ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Loading Dots */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-3xs flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Simulated Live Camera Viewfinder Popup overlay inside Modal */}
                  {isCameraActive && (
                    <div className="absolute inset-0 bg-black/90 z-30 flex flex-col items-center justify-center p-4">
                      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 shadow-xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            onClick={closeCamera}
                            className="p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={captureCameraPhoto}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'ছবি তুলুন' : 'Capture'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={closeCamera}
                          className="px-5 py-2.5 bg-slate-700 text-white font-black text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                        >
                          {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Horizontal List of Multiple Image Previews before Sending */}
                  {selectedImages.length > 0 && (
                    <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-col gap-1 shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-extrabold">
                          {lang === 'bn' ? `${selectedImages.length}টি ছবি যুক্ত করা হয়েছে` : `${selectedImages.length} images attached`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedImages([])}
                          className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                        >
                          {lang === 'bn' ? 'সব মুছুন' : 'Clear all'}
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                        {selectedImages.map((imgSrc, idx) => (
                          <div key={idx} className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-300 shrink-0 group">
                            <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Prompt Helper Chips Drawer */}
                  {isChipsVisible && (
                    <div className="px-3 py-2 bg-slate-50/95 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0 animate-in slide-in-from-bottom-2 fade-in duration-200">
                      {(isEmployeeAuthenticated && employee ? [
                        { labelBn: 'মার্কেটিং গাইড 🚀', labelEn: 'Marketing Guide 🚀', prompt: 'কোথায় ও কীভাবে সোশ্যাল মিডিয়ায় বেশি পণ্য বিক্রি করব? ফেসবুক ও টিকটক মার্কেটিং গাইড দিন।' },
                        { labelBn: 'ছবি দিয়ে খুঁজুন 📸', labelEn: 'Search by Image 📸', prompt: 'আমি একটি পণ্যের ছবি পাঠাচ্ছি, এটি আপনার ক্যাটালগ থেকে খুঁজে দিন এবং অর্ডার করার ব্যবস্থা করুন।' },
                        { labelBn: 'আমার ইনকাম ও সেল 💰', labelEn: 'My Earnings 💰', prompt: 'আমার বর্তমান ওয়ালেট ব্যালেন্স, পেন্ডিং প্রফিট এবং সম্পন্ন হওয়া মোট অর্ডার বিবরণী দেখাও।' },
                        { labelBn: 'কে বানিয়েছে? 👤', labelEn: 'Who built this? 👤', prompt: 'এই এআই প্ল্যাটফর্ম ও তাউজুন নেক্সাস কে তৈরি করেছেন এবং উনার সাথে কীভাবে কথা বলব?' },
                      ] : [
                        { labelBn: 'কীভাবে ইনকাম হয়? 💰', labelEn: 'How to Earn? 💰', prompt: 'বিনা পুঁজিতে তাউজুনে রিসেলিং ব্যবসা করে কীভাবে ঘরে বসে ইনকাম করা সম্ভব?' },
                        { labelBn: 'ছবি দিয়ে খুঁজুন 📸', labelEn: 'Search by Image 📸', prompt: 'আমি একটি পণ্যের ছবি পাঠাচ্ছি, এটি আপনার ক্যাটালগ থেকে খুঁজে দিন এবং অর্ডার করার ব্যবস্থা করুন।' },
                        { labelBn: 'পণ্য অর্ডার করব 🛍️', labelEn: 'Order Products 🛍️', prompt: 'আমি আপনাদের ক্যাটালগ থেকে জনপ্রিয় পণ্য সরাসরি ক্যাশ অন ডেলিভারিতে অর্ডার করতে চাই।' },
                        { labelBn: 'কে বানিয়েছে? 👤', labelEn: 'Who built this? 👤', prompt: 'এই এআই প্ল্যাটফর্ম ও তাউজুন নেক্সাস কে তৈরি করেছেন এবং উনার সাথে কীভাবে কথা বলব?' },
                      ]).map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickHelper(chip.prompt)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-emerald-600 rounded-xl text-[10px] font-black text-slate-700 hover:text-emerald-700 shadow-3xs cursor-pointer transition-colors text-center truncate"
                        >
                          {lang === 'bn' ? chip.labelBn : chip.labelEn}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chat Input Footer */}
                  <div className="p-2.5 px-3.5 bg-white border-t border-slate-100 flex items-end gap-2 shrink-0 rounded-none sm:rounded-b-[18.5px] relative select-none">
                    
                    {/* Centered Toggle Arrow Button */}
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <button
                        type="button"
                        onClick={() => setIsChipsVisible(!isChipsVisible)}
                        className={`w-7 h-5 rounded-full border shadow-xs flex items-center justify-center cursor-pointer transition-all ${
                          isChipsVisible 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={lang === 'bn' ? (isChipsVisible ? 'হেল্পার অপশন লুকান' : 'হেল্পার অপশন দেখান') : (isChipsVisible ? 'Hide Helper Chips' : 'Show Helper Chips')}
                      >
                        {isChipsVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Input Container */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 min-h-[44px] flex items-center gap-2 shadow-sm focus-within:border-[#009245] transition-colors relative">
                      
                      {/* Plus/Attachment Button */}
                      <button
                        type="button"
                        onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                        className={`p-1.5 sm:p-1 rounded-full text-slate-400 hover:text-[#009245] hover:bg-slate-100 cursor-pointer transition-all shrink-0 ${
                          isAttachMenuOpen ? 'rotate-45 text-[#009245] bg-slate-100' : ''
                        }`}
                        title={lang === 'bn' ? 'সংযুক্ত ফাইল' : 'Attachments'}
                      >
                        <Plus className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                      </button>

                      {/* Textarea */}
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => {
                          setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                          }, 150);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={lang === 'bn' ? 'মেসেজ টাইপ করুন...' : 'Type a message...'}
                        style={{ textAlign: 'left' }}
                        className="flex-1 py-1 text-[15px] sm:text-xs bg-transparent outline-none font-semibold sm:font-bold text-slate-900 placeholder:text-slate-400 placeholder:text-[14px] sm:placeholder:text-xs resize-none overflow-y-auto scrollbar-hidden max-h-[100px] text-left leading-normal"
                      />

                      {/* Send Button */}
                      <button
                        onClick={() => handleSendMessage()}
                        disabled={(!inputValue.trim() && selectedImages.length === 0) || isLoading}
                        className="w-8 h-8 sm:w-7.5 sm:h-7.5 rounded-full bg-[#009245] hover:bg-[#007a37] text-white flex items-center justify-center shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white" />
                      </button>

                      {/* Popover Dropdown */}
                      {isAttachMenuOpen && (
                        <div className="absolute bottom-12 left-2 w-38 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-30 space-y-0.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                          
                          {/* 1. Picture */}
                          <button
                            type="button"
                            onClick={triggerImageUpload}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-[11px] font-black text-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="w-5.5 h-5.5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Image className="w-3.5 h-3.5" />
                            </div>
                            <span>{lang === 'bn' ? 'পিকচার' : 'Picture'}</span>
                          </button>

                          {/* 2. Camera */}
                          <button
                            type="button"
                            onClick={openCamera}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-[11px] font-black text-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="w-5.5 h-5.5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <span>{lang === 'bn' ? 'ক্যামেরা' : 'Camera'}</span>
                          </button>

                          {/* 3. Google Drive */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAttachMenuOpen(false);
                              setSelectedImages((prev) => [
                                ...prev,
                                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
                              ]);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-[11px] font-black text-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="w-5.5 h-5.5 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <HardDrive className="w-3.5 h-3.5" />
                            </div>
                            <span>{lang === 'bn' ? 'ড্রাইভ' : 'Drive'}</span>
                          </button>

                          {/* 4. Upload File */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAttachMenuOpen(false);
                              setSelectedImages((prev) => [
                                ...prev,
                                'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
                              ]);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-[11px] font-black text-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="w-5.5 h-5.5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <UploadCloud className="w-3.5 h-3.5" />
                            </div>
                            <span>{lang === 'bn' ? 'আপলোড' : 'Upload'}</span>
                          </button>

                        </div>
                      )}
                    </div>

                  </div>
                </>
              )}

              {/* ========================================================= */}
              {/* OVERLAY 1: LARGE DISPLAY PRODUCT PREVIEW MODAL ("ওপেন করুন 🔗") */}
              {/* ========================================================= */}
              {previewProduct && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex flex-col justify-end sm:justify-center p-3 animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl p-4 space-y-3 max-h-[92%] overflow-y-auto border border-emerald-500/50 shadow-2xl relative">
                    
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-[#009245]">
                        <Sparkles className="w-4 h-4 text-[#009245]" />
                        <span>প্রোডাক্ট লাার্জ ডিসপ্লে প্রিভিউ</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewProduct(null)}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Main Image Viewer */}
                    <div className="w-full h-52 sm:h-56 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative">
                      {(previewActiveImg || previewProduct.imageUrl) ? (
                        <img
                          src={previewActiveImg || previewProduct.imageUrl}
                          alt=""
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">No Image</div>
                      )}
                      {previewProduct.productCode && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 text-white font-mono text-[9.5px] font-bold rounded-md">
                          #{previewProduct.productCode}
                        </span>
                      )}
                    </div>

                    {/* Gallery Thumbnails Carousel */}
                    {(() => {
                      const gallery = (previewProduct.images && Array.isArray(previewProduct.images) && previewProduct.images.length > 0)
                        ? previewProduct.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean)
                        : (previewProduct.imageUrl ? [previewProduct.imageUrl] : []);

                      if (gallery.length <= 1) return null;
                      return (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-600">গ্যালারি ছবিসমূহ ({gallery.length}টি):</span>
                          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                            {gallery.map((url, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setPreviewActiveImg(url)}
                                className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                                  previewActiveImg === url ? 'border-[#009245] ring-2 ring-emerald-400/40 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Product Meta Details */}
                    <div className="space-y-1 text-left">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {lang === 'bn' ? previewProduct.nameBn : previewProduct.nameEn}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-rose-600 font-mono">৳{previewProduct.sellingPrice?.toLocaleString()}</span>
                        {previewProduct.regularPrice && previewProduct.regularPrice > previewProduct.sellingPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">৳{previewProduct.regularPrice.toLocaleString()}</span>
                        )}
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[9.5px] rounded-full">
                          স্টকে আছে (ইন-স্টক)
                        </span>
                      </div>
                      {(previewProduct.shortDescBn || previewProduct.fullDescBn) && (
                        <p className="text-[11px] text-slate-600 leading-relaxed pt-1 line-clamp-3">
                          {previewProduct.shortDescBn || previewProduct.fullDescBn}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = previewProduct;
                          setPreviewProduct(null);
                          handleOrderProduct(p);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-[#009245] to-emerald-600 hover:from-[#007a37] hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>সরাসরি অর্ডার করতে ফরম পূরণ করুন 🛒</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const p = previewProduct;
                            setOrderFormItems(prev => {
                              if (prev.some(i => i.product.id === p.id)) return prev;
                              return [...prev, { product: p, quantity: 1 }];
                            });
                            showToast('প্রোডাক্টটি অর্ডারে যুক্ত করা হয়েছে!', 'success');
                          }}
                          className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+ অর্ডারে যোগ করুন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProduct(previewProduct);
                            setPreviewProduct(null);
                            setIsOpen(false);
                          }}
                          className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[11px] rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ওয়েবসাইটে দেখুন 🌐</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* OVERLAY 2: INTERACTIVE IN-CHAT QUICK ORDER FORM MODAL */}
              {/* ========================================================= */}
              {showOrderFormModal && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-50 flex flex-col justify-end sm:justify-center p-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-white rounded-2xl p-4 space-y-3 max-h-[95%] overflow-y-auto border-2 border-emerald-500 shadow-2xl relative text-left">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-[#009245]">
                        <ShoppingBag className="w-4 h-4 text-[#009245]" />
                        <span>ইনস্ট্যান্ট কাস্টমার অর্ডার ফরম</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOrderFormModal(false)}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800">
                          নির্বাচিত পণ্যসমূহ ({orderFormItems.reduce((s, i) => s + i.quantity, 0)}টি):
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddProductDrawer(true)}
                          className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ আরও প্রোডাক্ট যোগ করুন</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                        {orderFormItems.map((item, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                            <div className="w-9 h-9 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {item.product.imageUrl ? (
                                <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">No Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10.5px] font-bold text-slate-900 truncate">
                                {item.product.nameBn || item.product.nameEn}
                              </div>
                              <div className="text-[9.5px] text-rose-600 font-mono font-bold">
                                ৳{(item.product.sellingPrice * item.quantity).toLocaleString()} (৳{item.product.sellingPrice})
                              </div>
                            </div>
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md shrink-0">
                              <button
                                type="button"
                                onClick={() => setOrderFormItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}
                                className="w-5 h-5 rounded bg-white font-black text-xs text-slate-700 flex items-center justify-center hover:bg-slate-200"
                              >-</button>
                              <span className="text-[10.5px] font-bold px-1 font-mono">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setOrderFormItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it))}
                                className="w-5 h-5 rounded bg-white font-black text-xs text-slate-700 flex items-center justify-center hover:bg-slate-200"
                              >+</button>
                            </div>
                            {orderFormItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setOrderFormItems(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info Form Fields */}
                    <div className="space-y-2 pt-1 text-[11px]">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">কাস্টমারের নাম:</label>
                        <input
                          type="text"
                          value={orderFormCustomerName}
                          onChange={(e) => setOrderFormCustomerName(e.target.value)}
                          placeholder="আপনার নাম লিখুন"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">১১ ডিজিটের মোবাইল নম্বর <span className="text-rose-600">*</span>:</label>
                        <input
                          type="tel"
                          value={orderFormCustomerPhone}
                          onChange={(e) => setOrderFormCustomerPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">সম্পূর্ণ ডেলিভারি ঠিকানা <span className="text-rose-600">*</span>:</label>
                        <textarea
                          rows={2}
                          value={orderFormCustomerAddress}
                          onChange={(e) => setOrderFormCustomerAddress(e.target.value)}
                          placeholder="বাসা নম্বর, রোড নম্বর, এলাকা, থানা ও জেলা"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:border-[#009245] outline-none font-medium text-xs resize-none"
                        />
                      </div>

                      {/* District Selection */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">ডেলিভারি এরিয়া:</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderFormDistrict('Dhaka')}
                            className={`py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold border cursor-pointer transition ${
                              orderFormDistrict === 'Dhaka'
                                ? 'bg-emerald-50 border-[#009245] text-[#009245]'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                             ঢাকার ভেতরে (৳৭০)
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderFormDistrict('Outside')}
                            className={`py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold border cursor-pointer transition ${
                              orderFormDistrict === 'Outside'
                                ? 'bg-emerald-50 border-[#009245] text-[#009245]'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                             ঢাকার বাইরে (৳১২০)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Order Price Breakdown Summary */}
                    {(() => {
                      const subtotal = orderFormItems.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
                      const deliveryFee = orderFormDistrict === 'Dhaka' ? 70 : 120;
                      const grandTotal = subtotal + deliveryFee;
                      return (
                        <div className="bg-slate-100/80 rounded-xl p-2.5 text-[11px] space-y-1 font-semibold border border-slate-200">
                          <div className="flex justify-between text-slate-600">
                            <span>পণ্যের সাবটোটাল:</span>
                            <span className="font-mono font-bold">৳{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>ডেলিভারি চার্জ ({orderFormDistrict === 'Dhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে'}):</span>
                            <span className="font-mono font-bold">৳{deliveryFee}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-900 font-black pt-1 border-t border-dashed border-slate-300">
                            <span className="text-[#009245]">সর্বমোট প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
                            <span className="text-sm font-mono text-rose-600">৳{grandTotal.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Submit Order Form Button */}
                    <button
                      type="button"
                      onClick={handleFormSubmitOrder}
                      className="w-full py-2.5 bg-gradient-to-r from-[#009245] to-emerald-600 hover:from-[#007a37] hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>অর্ডারের বিবরণ ও কনফার্মেশন বাটন পান ➔</span>
                    </button>

                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* OVERLAY 3: CATALOG PICKER DRAWER (MULTI-PRODUCT SELECTION) */}
              {/* ========================================================= */}
              {showAddProductDrawer && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-[60] flex flex-col justify-end p-3 animate-in slide-in-from-bottom-3 duration-200">
                  <div className="bg-white rounded-2xl p-3.5 space-y-3 max-h-[85%] overflow-y-auto border border-emerald-500 shadow-2xl relative text-left flex flex-col">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#009245]" />
                        <span>প্রোডাক্ট সিলেক্ট করুন</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddProductDrawer(false)}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={addProductSearchQuery}
                      onChange={(e) => setAddProductSearchQuery(e.target.value)}
                      placeholder="প্রোডাক্টের নাম বা কোড দিয়ে খুঁজুন..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#009245]"
                    />

                    <div className="flex-1 overflow-y-auto space-y-1.5 max-h-60 pr-1">
                      {catalogProducts
                        .filter(p => {
                          if (!addProductSearchQuery.trim()) return true;
                          const text = (p.nameBn + ' ' + p.nameEn + ' ' + p.productCode).toLowerCase();
                          return text.includes(addProductSearchQuery.toLowerCase().trim());
                        })
                        .map(prod => (
                          <div key={prod.id} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-[#009245] transition">
                            <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">No Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10.5px] font-bold text-slate-900 truncate">
                                {prod.nameBn || prod.nameEn}
                              </div>
                              <div className="text-[9.5px] font-mono text-rose-600 font-bold">
                                ৳{prod.sellingPrice?.toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderFormItems(prev => {
                                  const existing = prev.find(i => i.product.id === prod.id);
                                  if (existing) {
                                    return prev.map(i => i.product.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
                                  }
                                  return [...prev, { product: prod, quantity: 1 }];
                                });
                                showToast('প্রোডাক্ট যুক্ত হয়েছে!', 'success');
                                setShowAddProductDrawer(false);
                              }}
                              className="px-2.5 py-1 bg-[#009245] hover:bg-[#007a37] text-white font-black text-[10px] rounded-lg cursor-pointer"
                            >
                              + যোগ করুন
                            </button>
                          </div>
                        ))}
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
