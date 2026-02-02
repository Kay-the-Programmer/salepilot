import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Snackbar from '../components/Snackbar';

// Re-using the types from the original implementation if possible, or defining them here
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'sync';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 5;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => {
            // Limit visible toasts to prevent overwhelming the UI
            const newToasts = [...prev, { id, message, type }];
            if (newToasts.length > MAX_VISIBLE_TOASTS) {
                return newToasts.slice(-MAX_VISIBLE_TOASTS);
            }
            return newToasts;
        });
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Stacked Snackbar Container */}
            {toasts.length > 0 && (
                <div className="snackbar-stack fixed left-4 right-4 top-4 md:top-auto md:right-auto md:bottom-6 md:left-6 z-[200] md:max-w-md flex flex-col-reverse md:flex-col gap-3 pointer-events-none">
                    {toasts.map((toast, index) => (
                        <div
                            key={toast.id}
                            className="pointer-events-auto"
                            style={{
                                // Stagger animation delay for cascade effect
                                animationDelay: `${index * 50}ms`,
                                // Slight scale/opacity reduction for stacked items (older items)
                                opacity: 1 - (toasts.length - 1 - index) * 0.05,
                                transform: `scale(${1 - (toasts.length - 1 - index) * 0.02})`,
                            }}
                        >
                            <Snackbar
                                message={toast.message}
                                type={toast.type}
                                onClose={() => closeToast(toast.id)}
                                stackIndex={index}
                                totalInStack={toasts.length}
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
