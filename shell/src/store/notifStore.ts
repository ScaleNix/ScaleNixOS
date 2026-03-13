import { create } from 'zustand';
import { useAudioStore, playSound } from './audioStore';

export type NotifCategory = 'mail' | 'chat' | 'file' | 'system' | 'calendar';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  appId?: string;
  category?: NotifCategory;
  onClick?: () => void;
}

export interface NotifHistoryItem {
  id: string;
  type: Notification['type'];
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  appId?: string;
  category?: NotifCategory;
  onClick?: () => void;
}

const MAX_HISTORY = 50;

interface NotifStore {
  notifications: Notification[];
  history: NotifHistoryItem[];
  dnd: boolean;
  push: (notif: Omit<Notification, 'id'>) => void;
  dismiss: (id: string) => void;
  toggleDnd: () => void;
  clearHistory: () => void;
  dismissHistoryItem: (id: string) => void;
  markAllRead: () => void;
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifications: [],
  history: [],
  dnd: false,

  push: (notif) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const duration = notif.duration ?? 4000;

    // Always add to history
    const historyItem: NotifHistoryItem = {
      id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: Date.now(),
      read: false,
      appId: notif.appId,
      category: notif.category,
      onClick: notif.onClick,
    };

    set((s) => {
      const nextHistory = [historyItem, ...s.history].slice(0, MAX_HISTORY);

      // Only show toast if DND is off
      if (s.dnd) {
        return { history: nextHistory };
      }

      const next = [...s.notifications, { ...notif, id }];
      return {
        notifications: next.slice(-4),
        history: nextHistory,
      };
    });

    // Play notification sound if enabled
    if (useAudioStore.getState().notificationSound) {
      playSound('notification');
    }

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  dismiss: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  toggleDnd: () => set((s) => ({ dnd: !s.dnd })),

  clearHistory: () => set({ history: [] }),

  dismissHistoryItem: (id) =>
    set((s) => ({
      history: s.history.filter((h) => h.id !== id),
    })),

  markAllRead: () =>
    set((s) => ({
      history: s.history.map((h) => (h.read ? h : { ...h, read: true })),
    })),
}));
