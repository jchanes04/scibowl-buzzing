/**
 * Toast notification store
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

let _toasts = $state<Toast[]>([]);

export const toastStore = {
    get toasts() {
        return _toasts;
    },

    add(message: string, type: ToastType = 'info', duration: number = 3000) {
        const id = crypto.randomUUID();
        const toast: Toast = { id, message, type, duration };
        _toasts = [..._toasts, toast];

        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        return id;
    },

    remove(id: string) {
        _toasts = _toasts.filter(t => t.id !== id);
    },

    clear() {
        _toasts = [];
    }
};
