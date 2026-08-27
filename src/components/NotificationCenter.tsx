import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import {
  getStoredNotifications,
  saveNotifications,
  requestBrowserNotificationPermission
} from '../utils/notificationService';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Clock,
  Sparkles,
  Timer,
  AlertCircle,
  BellRing
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onNotificationCountChange?: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  onNotificationCountChange
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [browserPermitted, setBrowserPermitted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    const list = getStoredNotifications();
    setNotifications(list);
    const unread = list.filter(n => !n.read).length;
    if (onNotificationCountChange) onNotificationCountChange(unread);

    const handleNewNotif = (e: CustomEvent<AppNotification>) => {
      setNotifications(prev => {
        const updated = [e.detail, ...prev.filter(n => n.id !== e.detail.id)];
        saveNotifications(updated);
        const count = updated.filter(n => !n.read).length;
        if (onNotificationCountChange) onNotificationCountChange(count);
        return updated;
      });
    };

    window.addEventListener('rakan_new_notification' as never, handleNewNotif as never);
    return () => {
      window.removeEventListener('rakan_new_notification' as never, handleNewNotif as never);
    };
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    if (onNotificationCountChange) onNotificationCountChange(0);
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
    if (onNotificationCountChange) onNotificationCountChange(0);
  };

  const handleRequestPush = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPermitted(granted);
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'pomodoro':
        return <Timer className="w-4 h-4 text-amber-400" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      case 'success':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full sm:w-96 sm:rounded-2xl border shadow-2xl h-full sm:h-[80vh] flex flex-col transition-all overflow-hidden ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">مرکز اعلانات و یادآوری‌ها</h3>
              <p className="text-[11px] text-slate-400">پیام‌ها، تایمرها و هشدارهای تحصیلی راکان</p>
            </div>
          </div>
          <button
            id="close-notifications-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Permission Banner if not granted */}
        {!browserPermitted && (
          <div className={`p-3 border-b text-xs flex items-center justify-between gap-2 ${
            isDark ? 'bg-indigo-950/40 border-indigo-900/40 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>دریافت اعلان‌های مرورگر برای پایان پومودورو</span>
            </div>
            <button
              onClick={handleRequestPush}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold whitespace-nowrap shadow-xs"
            >
              فعال‌سازی
            </button>
          </div>
        )}

        {/* Actions bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>علامت‌گذاری همه به عنوان خوانده‌شده</span>
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-500 mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold mb-1">هیچ اعلانی وجود ندارد</p>
              <p className="text-xs text-slate-500">یادآوری‌های پومودورو، پیام‌های مشاور و نکات طلایی اینجا نمایش داده می‌شوند.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  item.read
                    ? isDark
                      ? 'bg-slate-950/40 border-slate-800/50 text-slate-400'
                      : 'bg-slate-50/70 border-slate-200/60 text-slate-600'
                    : isDark
                    ? 'bg-slate-800/80 border-emerald-500/30 text-white shadow-sm'
                    : 'bg-emerald-50/70 border-emerald-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`text-xs font-bold truncate ${item.read ? 'text-slate-300' : 'text-emerald-400'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                        {item.persianTime}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed break-words">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
