import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Bell,
  CheckCircle,
  Tag,
  DollarSign,
  Clock,
  CheckCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents.js';

import { playNotificationSound, playLoginSuccessSound, playSuccessActionSound } from '../../utils/soundEffects.js';

// Format friendly relative or local time
function formatNotifTime(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return lang === 'bn' ? `গতকাল ${timeStr}` : `Yesterday ${timeStr}`;
    }

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}, ${timeStr}`;
  } catch {
    return '';
  }
}

// Card theme helper: gives each card a distinct, visible light pastel background & thin border
function getCardTheme(item: NotificationItem) {
  const title = ((item.titleBn || '') + ' ' + (item.titleEn || '')).toLowerCase();
  const message = ((item.messageBn || '') + ' ' + (item.messageEn || '')).toLowerCase();

  // 1. Commission / Financial Earnings
  if (
    item.type === 'COMMISSION' ||
    title.includes('কমিশন') ||
    title.includes('টাকা') ||
    title.includes('উইথড্র') ||
    title.includes('balance') ||
    title.includes('commission')
  ) {
    return {
      readBg: 'bg-emerald-50/70',
      readBorder: 'border-emerald-200',
      unreadBg: 'bg-emerald-100/60',
      unreadBorder: 'border-emerald-300 ring-1 ring-emerald-300/40',
      iconBg: 'bg-emerald-100 text-emerald-700',
      accentDot: 'bg-emerald-600',
      Icon: DollarSign,
    };
  }

  // 2. Orders, Courier & Tracking
  if (
    item.type === 'SALE' ||
    title.includes('কুরিয়ার') ||
    title.includes('ট্র্যাকিং') ||
    title.includes('অর্ডার') ||
    title.includes('courier') ||
    title.includes('tracking') ||
    message.includes('steadfast')
  ) {
    return {
      readBg: 'bg-sky-50/70',
      readBorder: 'border-sky-200',
      unreadBg: 'bg-sky-100/60',
      unreadBorder: 'border-sky-300 ring-1 ring-sky-300/40',
      iconBg: 'bg-sky-100 text-sky-700',
      accentDot: 'bg-sky-600',
      Icon: Tag,
    };
  }

  // 3. Team Member / Referral
  if (
    title.includes('টিম মেম্বার') ||
    title.includes('রেফারেল') ||
    title.includes('রেজিস্ট্রেশন') ||
    title.includes('referral') ||
    title.includes('member')
  ) {
    return {
      readBg: 'bg-violet-50/70',
      readBorder: 'border-violet-200',
      unreadBg: 'bg-violet-100/60',
      unreadBorder: 'border-violet-300 ring-1 ring-violet-300/40',
      iconBg: 'bg-violet-100 text-violet-700',
      accentDot: 'bg-violet-600',
      Icon: Users,
    };
  }

  // 4. Account Approval / Status Success
  if (
    title.includes('অনুমোদিত') ||
    title.includes('approved') ||
    title.includes('স্বাগতম') ||
    title.includes('welcome')
  ) {
    return {
      readBg: 'bg-teal-50/70',
      readBorder: 'border-teal-200',
      unreadBg: 'bg-teal-100/60',
      unreadBorder: 'border-teal-300 ring-1 ring-teal-300/40',
      iconBg: 'bg-teal-100 text-teal-700',
      accentDot: 'bg-teal-600',
      Icon: CheckCircle,
    };
  }

  // 5. General System Notices & Announcements
  return {
    readBg: 'bg-slate-100/80',
    readBorder: 'border-slate-200',
    unreadBg: 'bg-amber-50/80',
    unreadBorder: 'border-amber-300 ring-1 ring-amber-300/40',
    iconBg: 'bg-amber-100/80 text-amber-800',
    accentDot: 'bg-amber-600',
    Icon: Bell,
  };
}

// Swipeable notification card with Facebook-style swipe-to-dismiss
interface SwipeableCardProps {
  item: NotificationItem;
  lang: string;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onClickNotification?: (item: NotificationItem) => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  item,
  lang,
  onDismiss,
  onMarkAsRead,
  onClickNotification,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isVerticalScrollRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const theme = getCardTheme(item);
  const Icon = theme.Icon;

  // Touch and Pointer Event Handlers
  const handleStart = (clientX: number, clientY: number) => {
    isPointerDownRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isVerticalScrollRef.current = false;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isPointerDownRef.current || isDismissing) return;
    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    // Check if vertical scrolling dominates
    if (!isSwiping && Math.abs(diffY) > 8 && Math.abs(diffY) > Math.abs(diffX)) {
      isVerticalScrollRef.current = true;
      return;
    }

    if (isVerticalScrollRef.current) return;

    // Start horizontal swipe
    if (Math.abs(diffX) > 6) {
      setIsSwiping(true);
      setDragX(diffX);
    }
  };

  const handleEnd = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (isVerticalScrollRef.current) {
      setDragX(0);
      setIsSwiping(false);
      return;
    }

    // Swipe threshold to dismiss: 80 pixels
    if (Math.abs(dragX) > 80) {
      setIsDismissing(true);
      // Animate card smoothly out in the swipe direction
      const exitDirection = dragX > 0 ? 500 : -500;
      setDragX(exitDirection);
      setTimeout(() => {
        onDismiss(item.id);
      }, 220);
    } else {
      // Tap/Click (without drag) -> mark as read AND trigger open/navigation!
      if (Math.abs(dragX) < 6) {
        onMarkAsRead(item.id);
        if (onClickNotification) {
          onClickNotification(item);
        }
      }
      setDragX(0);
      setIsSwiping(false);
    }
  };

  const timeFormatted = formatNotifTime(item.createdAt, lang);
  const messageText = (lang === 'bn' ? item.messageBn : item.messageEn || '').normalize('NFC');
  const titleText = (lang === 'bn' ? item.titleBn : item.titleEn || '').normalize('NFC');

  // Calculate dismissal opacity during drag
  const currentOpacity = isDismissing ? 0 : Math.max(0.4, 1 - Math.abs(dragX) / 320);

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-2xl select-none">
      {/* Background container revealed when swiping */}
      <div className="absolute inset-0 rounded-2xl bg-slate-100/80 border border-dashed border-slate-200 flex items-center justify-between px-6 pointer-events-none transition-colors" />

      {/* Main card body with hardware-accelerated transform */}
      <div
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          opacity: currentOpacity,
          transition: isSwiping ? 'none' : 'transform 220ms ease-out, opacity 220ms ease-out',
        }}
        className={`relative z-10 w-full max-w-full overflow-hidden p-3.5 sm:p-4 rounded-2xl border ${
          item.isRead ? `${theme.readBg} ${theme.readBorder}` : `${theme.unreadBg} ${theme.unreadBorder} shadow-xs`
        } flex items-start gap-3 sm:gap-3.5 cursor-grab active:cursor-grabbing touch-pan-y transition-colors`}
      >
        {/* Leading notification icon */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Content column: strictly prevents mobile horizontal overflow */}
        <div className="space-y-1 flex-1 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-1.5 w-full">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 break-words leading-snug flex-1 min-w-0">
              {titleText}
            </h4>
            {timeFormatted && (
              <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                {timeFormatted}
              </span>
            )}
          </div>

          {/* Long URLs or unbroken words wrap cleanly without escaping the card */}
          <p className="text-xs text-slate-700 leading-relaxed break-words break-all [overflow-wrap:anywhere]">
            {messageText}
          </p>
        </div>

        {/* Unread indicator dot */}
        {!item.isRead && (
          <span
            className={`w-2 h-2 rounded-full ${theme.accentDot} shrink-0 mt-2 ring-2 ring-white`}
            title={lang === 'bn' ? 'অপঠিত' : 'Unread'}
          />
        )}
      </div>
    </div>
  );
};

export const ResellerNotificationsTab: React.FC = () => {
  const { lang, employeeToken, employee, setResellerTab, showToast } = useApp();
  const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle clicking notification card to navigate to target section
  const handleNotificationClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id);

    const title = ((item.titleBn || '') + ' ' + (item.titleEn || '')).toLowerCase();
    const message = ((item.messageBn || '') + ' ' + (item.messageEn || '')).toLowerCase();
    const fullText = `${item.titleBn || ''} ${item.messageBn || ''} ${item.titleEn || ''} ${item.messageEn || ''}`;

    // Extract Order Code if present (e.g. ORD-592490 or #ORD-592490)
    const orderMatch = fullText.match(/ORD-[A-Z0-9]+/i) || fullText.match(/#([A-Z0-9-]+)/i);
    const orderCode = orderMatch ? orderMatch[0].replace('#', '').trim() : null;

    // 1. Order / Courier / Tracking
    if (
      item.type === 'SALE' ||
      title.includes('কুরিয়ার') ||
      title.includes('ট্র্যাকিং') ||
      title.includes('অর্ডার') ||
      title.includes('courier') ||
      title.includes('tracking') ||
      message.includes('steadfast') ||
      orderCode
    ) {
      setResellerTab('orders');
      if (orderCode) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('tawzoon_select_order', {
              detail: { orderCode }
            })
          );
        }, 100);
      }
      return;
    }

    // 2. Financial / Balance Top-Up / Commission
    if (
      item.type === 'COMMISSION' ||
      title.includes('ব্যালেন্স') ||
      title.includes('টপআপ') ||
      title.includes('টপ-আপ') ||
      title.includes('কমিশন') ||
      title.includes('প্রফিট') ||
      title.includes('টাকা') ||
      title.includes('উইথড্র') ||
      title.includes('balance') ||
      title.includes('topup') ||
      title.includes('commission') ||
      title.includes('withdraw')
    ) {
      if (title.includes('উইথড্র') || title.includes('withdraw')) {
        setResellerTab('withdrawal');
      } else {
        setResellerTab('earnings');
      }
      return;
    }

    // 3. Referral / Team
    if (
      title.includes('টিম মেম্বার') ||
      title.includes('রেফারেল') ||
      title.includes('রেজিস্ট্রেশন') ||
      title.includes('referral') ||
      title.includes('member')
    ) {
      setResellerTab('earnings');
      return;
    }

    // Default
    setResellerTab('dashboard');
  };

  // Dismissed notification IDs stored in localStorage to persist swipe-to-dismiss
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      if (typeof window !== 'undefined' && employee?.id) {
        const saved = localStorage.getItem(`tawzoon_dismissed_notifs_${employee.id}`);
        if (saved) return new Set(JSON.parse(saved));
      }
    } catch {}
    return new Set<string>();
  });

  // Notification retention setting: default 7 days (cleanly selectable to 15 days)
  const [retentionDays, setRetentionDays] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tawzoon_notif_retention_days');
        return saved ? parseInt(saved, 10) : 7;
      }
    } catch {}
    return 7;
  });

  // Track known notification IDs to ensure sound plays ONLY for genuine newly arriving notifications
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Audio Context unlocker on first user interaction for browser autoplay compliance
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const dummyCtx = new AudioContextClass();
          dummyCtx.resume().then(() => {
            dummyCtx.close().catch(() => {});
          }).catch(() => {});
        }
      } catch {}
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Fetch notifications from server
  const fetchNotifs = useCallback(async (isRealtimeEvent = false) => {
    if (!employeeToken) return;
    setLoading(true);
    try {
      const data = await api.employeeGetNotifications(employeeToken);
      const list = Array.isArray(data) ? data : [];
      setRawNotifications(list);

      // On initial load: silently register existing notification IDs without playing sound
      if (isInitialLoadRef.current) {
        list.forEach((item) => knownNotificationIdsRef.current.add(item.id));
        isInitialLoadRef.current = false;
        return;
      }

      // On live real-time events or polling: detect genuine new incoming items
      let hasBrandNew = false;
      for (const item of list) {
        if (!knownNotificationIdsRef.current.has(item.id)) {
          knownNotificationIdsRef.current.add(item.id);
          hasBrandNew = true;
        }
      }

      // Play chime sound only when a new notification arrives live
      if (hasBrandNew && isRealtimeEvent) {
        playNotificationSound();
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.message.includes('Session expired'))) {
        // Handled automatically by auth storage cleaner
      } else {
        console.warn('Failed to load notifications:', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, [employeeToken]);

  useEffect(() => {
    fetchNotifs(false);
  }, [fetchNotifs]);

  // Real-time synchronization
  useRealtimeEvents((event) => {
    if (
      event.type === 'NEW_NOTIFICATION' ||
      event.type === 'NOTIFICATION_ADDED' ||
      event.type === 'BRANDING_UPDATED' ||
      (event.type === 'STATE_UPDATED' &&
        (event.data?.type === 'NOTIFICATION_ADDED' || event.data?.type === 'BRANDING_UPDATED'))
    ) {
      fetchNotifs(true);
    }
  });

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    if (!employeeToken) return;
    try {
      await api.employeeMarkNotificationRead(employeeToken, id);
      setRawNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!employeeToken) return;
    try {
      await api.employeeMarkAllNotificationsRead(employeeToken);
      setRawNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Swipe-to-dismiss handler: persist dismissal state so it never reappears
  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        if (employee?.id) {
          localStorage.setItem(
            `tawzoon_dismissed_notifs_${employee.id}`,
            JSON.stringify(Array.from(next))
          );
        }
      } catch {}
      return next;
    });

    // Mark as read in background so badge count updates accurately
    handleMarkAsRead(id);
  };

  // Retention setting change
  const handleRetentionChange = (days: number) => {
    setRetentionDays(days);
    try {
      localStorage.setItem('tawzoon_notif_retention_days', String(days));
    } catch {}
  };

  // Filter notifications: auto-clean older than retentionDays, hide dismissed ones, and strictly deduplicate
  const filteredNotifications = useMemo(() => {
    const nowMs = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    const seenIds = new Set<string>();
    const seenContent = new Set<string>();

    return rawNotifications
      .filter((n) => {
        if (!n || !n.id) return false;
        if (dismissedIds.has(n.id)) return false;
        if (seenIds.has(n.id)) return false;
        seenIds.add(n.id);

        const contentKey = `${(n.titleBn || '').trim()}|${(n.messageBn || '').trim()}`;
        if (seenContent.has(contentKey)) return false;
        seenContent.add(contentKey);

        if (!n.createdAt) return true;
        const createdMs = new Date(n.createdAt).getTime();
        if (isNaN(createdMs)) return true;
        return nowMs - createdMs <= maxAgeMs;
      });
  }, [rawNotifications, dismissedIds, retentionDays]);

  const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 max-w-full overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              {lang === 'bn' ? 'রিসেলার নোটিফিকেশন' : 'Reseller Notifications'}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">
              {lang === 'bn' ? 'সরাসরি আপডেট ও লেনদেন তথ্য' : 'Live updates & sales alerts'}
            </p>
          </div>
        </div>

        {/* Controls: Auto-clean retention selector & Mark all as read */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-clean policy selector (7 days default / 15 days) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 font-semibold">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'অটো-ক্লিন:' : 'Auto-clean:'}</span>
            <select
              value={retentionDays}
              onChange={(e) => handleRetentionChange(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer py-0.5"
              title={lang === 'bn' ? 'নোটিফিকেশন সংরক্ষণের সময়সীমা' : 'Notification retention limit'}
            >
              <option value={7}>{lang === 'bn' ? '৭ দিন' : '7 Days'}</option>
              <option value={15}>{lang === 'bn' ? '১৫ দিন' : '15 Days'}</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold shrink-0">
              {unreadCount} {lang === 'bn' ? 'নতুন' : 'new'}
            </span>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Swipe instruction hint */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
          <div className="flex items-center gap-1">
            <ChevronLeft className="w-3 h-3 text-slate-300" />
            <span>{lang === 'bn' ? 'মুছে ফেলতে কার্ডটি পাশে সোয়াইপ করুন' : 'Swipe card to dismiss'}</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </div>
          <span>
            {filteredNotifications.length} {lang === 'bn' ? 'টি নোটিফিকেশন' : 'items'}
          </span>
        </div>
      )}

      {/* Notification Card List */}
      {loading && filteredNotifications.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading notifications...'}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-14 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            {lang === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'আপনার জন্য বর্তমানে কোনো নতুন নোটিফিকেশন নেই। নতুন কোনো আপডেট বা কমিশন যোগ হলে এখানে দেখতে পাবেন।'
              : 'You have no active notifications at the moment. New updates and commissions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 w-full max-w-full overflow-hidden">
          {filteredNotifications.map((item) => (
            <SwipeableCard
              key={item.id}
              item={item}
              lang={lang}
              onDismiss={handleDismiss}
              onMarkAsRead={handleMarkAsRead}
              onClickNotification={handleNotificationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
