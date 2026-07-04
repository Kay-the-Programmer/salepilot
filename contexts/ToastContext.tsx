import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import Snackbar from '../components/Snackbar';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'sync';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 2;

/** Errors and warnings stay long enough to read; confirmations get out of the way. */
const DURATION_BY_TYPE: Record<ToastType, number> = {
    success: 3500,
    info: 3500,
    sync: 3500,
    warning: 6000,
    error: 6000,
};

let toastSeq = 0;

/**
 * The app's single toast engine. Mounted once in App.tsx above every route,
 * so `showToast` (and everything delegating to it, e.g. Dashboard's
 * `showSnackbar`) surfaces on every page — main shell, standalone apps and
 * the public storefront alike.
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        setToasts(prev => {
            // Dedupe: an identical message already on screen isn't shown twice
            // (rapid-fire errors from list operations would otherwise stack up).
            if (prev.some(t => t.message === message && t.type === type)) {
                return prev;
            }
            const next = [...prev, { id: `toast-${++toastSeq}`, message, type, duration: DURATION_BY_TYPE[type] }];
            return next.length > MAX_VISIBLE_TOASTS ? next.slice(-MAX_VISIBLE_TOASTS) : next;
        });
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Stable identity so useToast consumers don't re-render on every toast change.
    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toasts.length > 0 && (
                <div
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm flex flex-col gap-2 pointer-events-none"
                    aria-live="polite"
                >
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Snackbar
                                message={toast.message}
                                type={toast.type}
                                duration={toast.duration}
                                onClose={() => closeToast(toast.id)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
