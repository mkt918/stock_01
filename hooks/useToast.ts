import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type) => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },
    removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Store の外から呼び出せるシングルトン関数 */
export const toast = {
    success: (message: string) => useToastStore.getState().addToast(message, 'success'),
    error: (message: string) => useToastStore.getState().addToast(message, 'error'),
    warning: (message: string) => useToastStore.getState().addToast(message, 'warning'),
    info: (message: string) => useToastStore.getState().addToast(message, 'info'),
};
