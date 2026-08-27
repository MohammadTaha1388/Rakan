import { AppNotification } from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'rakan_app_notifications';

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getUnreadNotificationsCount(): number {
  try {
    const list = getStoredNotifications();
    return list.filter(n => !n.read).length;
  } catch {
    return 0;
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  } catch (err) {
    console.error('Error saving notifications:', err);
  }
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export const requestNotificationPermission = requestBrowserNotificationPermission;

export function playNotificationTone(): void {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Ignore audio autoplay restrictions if not clicked yet
  }
}

export function dispatchAppNotification(
  title: string,
  message: string,
  type: AppNotification['type'] = 'info',
  enableBrowser = true
): AppNotification {
  const persianTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date());

  const newNotif: AppNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    persianTime,
    read: false
  };

  const existing = getStoredNotifications();
  saveNotifications([newNotif, ...existing]);

  // Audio chime
  playNotificationTone();

  // Browser notification if permitted
  if (enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`مدرسه راکان | ${title}`, {
        body: message,
        icon: '/favicon.ico',
        tag: newNotif.id
      });
    } catch (err) {
      console.warn('Native notification failed:', err);
    }
  }

  // Trigger custom window event for real-time reactivity in components
  window.dispatchEvent(new CustomEvent('rakan_new_notification', { detail: newNotif }));
  window.dispatchEvent(new CustomEvent('rakan_notifications_updated'));

  return newNotif;
}
