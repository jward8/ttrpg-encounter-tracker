import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>(set => ({
  toasts: [],
  push: (message: string) => {
    const id = crypto.randomUUID();
    set(state => ({ toasts: [...state.toasts, { id, message }] }));
    // Auto-dismiss after 4s.
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },
  dismiss: (id: string) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));
