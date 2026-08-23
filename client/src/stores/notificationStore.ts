import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'APPOINTMENT' | 'EMERGENCY' | 'REMINDER' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationState {
  notifications: AppNotification[];
  toasts: AppNotification[];
  addToast: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  toasts: [],

  addToast: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      read: false,
    };

    set((state) => ({
      toasts: [newNotif, ...state.toasts].slice(0, 5),
      notifications: [newNotif, ...state.notifications].slice(0, 30),
    }));

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== newNotif.id),
      }));
    }, 6000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearAll: () => set({ notifications: [], toasts: [] }),
}));

export default useNotificationStore;
