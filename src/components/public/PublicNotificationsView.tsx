import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ChevronLeft, CheckCheck, Megaphone, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { NotificationItem } from '../../types/index.js';
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents.js';

export const PublicNotificationsView: React.FC = () => {
  const { lang, setPublicCategory } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const getStoredReadIds = (): string[] => {
    try {
      const raw = localStorage.getItem('tawzoon_read_public_notifs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [readIds, setReadIds] = useState<string[]>(getStoredReadIds);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.publicGetNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load public notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Listen to realtime SSE events
  useRealtimeEvents((event) => {
    if (
      event.type === 'NEW_NOTIFICATION' ||
      event.type === 'NOTIFICATION_ADDED' ||
      event.type === 'BRANDING_UPDATED' ||
      (event.type === 'STATE_UPDATED' && (event.data?.type === 'NOTIFICATION_ADDED' || event.data?.type === 'BRANDING_UPDATED'))
    ) {
      fetchNotifs();
    }
  });

  const handleMarkAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const nextReadIds = [...readIds, id];
    setReadIds(nextReadIds);
    try {
      localStorage.setItem('tawzoon_read_public_notifs', JSON.stringify(nextReadIds));
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch {}
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const combined = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(combined);
    try {
      localStorage.setItem('tawzoon_read_public_notifs', JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent('tawzoon_notifications_updated'));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead && !readIds.includes(n.id)).length;

  const formatNotificationTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
             date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 pb-24">
      <div className="max-w-[800px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-8 space-y-4">
        {/* Header Bar */}
        <div className="bg-white dark:bg-slate-900 py-3.5 px-4 rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                setPublicCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
            </button>
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#009245]" />
              <span>{lang === 'bn' ? 'নোটিফিকেশন সমূহ' : 'Notifications'}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#e31b23] border border-rose-200 text-xs font-bold">
                {unreadCount} {lang === 'bn' ? 'টি নতুন' : 'new'}
              </span>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#009245] border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সব পড়া হয়েছে' : 'Mark all read'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading notifications...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#009245] mx-auto flex items-center justify-center">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              {lang === 'bn' ? 'আপনার জন্য বর্তমানে কোনো নতুন নোটিফিকেশন বা আপডেট নেই।' : 'You have no new notifications or updates at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((item) => {
              const isItemRead = item.isRead || readIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isItemRead
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800 shadow-2xs'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                    isItemRead
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-[#009245] text-white'
                  }`}>
                    <Megaphone className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${
                        isItemRead ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white font-black'
                      }`}>
                        {lang === 'bn' ? item.titleBn : (item.titleEn || item.titleBn)}
                      </h4>
                      <span className="text-[10.5px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatNotificationTime(item.createdAt)}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${
                      isItemRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'
                    }`}>
                      {lang === 'bn' ? item.messageBn : (item.messageEn || item.messageBn)}
                    </p>
                  </div>

                  {!isItemRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#009245] shrink-0 mt-1.5 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
