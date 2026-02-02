
import React, { useEffect } from 'react';
import { SnackbarType } from '../App';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XMarkIcon from './icons/XMarkIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface SnackbarProps {
    message: string;
    type: SnackbarType;
    onClose: () => void;
    stackIndex?: number;
    totalInStack?: number;
}

const SyncIcon = () => (
    <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Snackbar: React.FC<SnackbarProps> = ({ message, type, onClose, stackIndex = 0, totalInStack = 1 }) => {
    const [isExiting, setIsExiting] = React.useState(false);
    const AUTO_CLOSE_DURATION = 5000;

    // Stagger auto-close timing for stacked toasts (newer ones stay longer)
    const adjustedDuration = AUTO_CLOSE_DURATION + (stackIndex * 500);

    const handleClose = React.useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 320); // Match exit animation duration
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, adjustedDuration);

        return () => {
            clearTimeout(timer);
        };
    }, [handleClose, adjustedDuration]);

    // Premium glassmorphism - translucent glassy backgrounds
    const typeStyles = {
        success: {
            container: 'bg-emerald-500/30 dark:bg-emerald-400/20 text-emerald-900 dark:text-emerald-100 border border-emerald-500/40',
            progress: 'bg-emerald-500/60',
            iconBg: 'bg-emerald-500/30',
            closeHover: 'hover:bg-emerald-500/30',
        },
        error: {
            container: 'bg-rose-500/30 dark:bg-rose-400/20 text-rose-900 dark:text-rose-100 border border-rose-500/40',
            progress: 'bg-rose-500/60',
            iconBg: 'bg-rose-500/30',
            closeHover: 'hover:bg-rose-500/30',
        },
        info: {
            container: 'bg-blue-500/30 dark:bg-blue-400/20 text-blue-900 dark:text-blue-100 border border-blue-500/40',
            progress: 'bg-blue-500/60',
            iconBg: 'bg-blue-500/30',
            closeHover: 'hover:bg-blue-500/30',
        },
        warning: {
            container: 'bg-amber-500/30 dark:bg-amber-400/20 text-amber-900 dark:text-amber-100 border border-amber-500/40',
            progress: 'bg-amber-500/60',
            iconBg: 'bg-amber-500/30',
            closeHover: 'hover:bg-amber-500/30',
        },
        sync: {
            container: 'bg-slate-500/30 dark:bg-slate-400/20 text-slate-900 dark:text-slate-100 border border-slate-500/40',
            progress: 'bg-slate-500/60',
            iconBg: 'bg-slate-500/30',
            closeHover: 'hover:bg-slate-500/30',
        },
    };

    const Icon = {
        success: <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-300 snackbar-icon-animated" />,
        error: <XCircleIcon className="h-5 w-5 text-rose-600 dark:text-rose-300 snackbar-icon-animated" />,
        info: <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-300 snackbar-icon-animated" />,
        warning: <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-300 snackbar-icon-animated" />,
        sync: <SyncIcon />,
    }[type];

    const styles = typeStyles[type];
    const animationClass = isExiting ? 'snackbar-exit-anim' : 'snackbar-responsive-anim';

    // Calculate visual depth for stacked appearance
    const isOlder = stackIndex < totalInStack - 1;

    // Determine if this snackbar is standalone or in a stack
    const isStandalone = totalInStack === 1;

    return (
        <div
            className={`
                snackbar-container
                ${isStandalone
                    ? 'fixed left-4 right-4 top-4 md:top-auto md:right-auto md:bottom-6 md:left-6 z-[200] md:max-w-md'
                    : 'relative w-full'
                }
                rounded-full
                shadow-2xl shadow-black/20
                backdrop-blur-xl
                overflow-hidden
                ${styles.container}
                ${animationClass}
                ${isOlder ? 'snackbar-stacked' : ''}
            `}
            role="alert"
            style={{
                boxShadow: isOlder
                    ? '0 10px 25px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
                    : '0 20px 40px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            }}
        >
            {/* Main content */}
            <div className="flex items-center gap-3 px-5 py-3">
                {/* Icon with subtle background */}
                <div className={`flex-shrink-0 p-2 rounded-full ${styles.iconBg}`}>
                    {Icon}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug pr-2">{message}</p>
                </div>

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className={`
                        flex-shrink-0
                        p-2 rounded-full
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-current/30
                        ${styles.closeHover}
                        active:scale-90
                    `}
                    aria-label="Dismiss"
                >
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-4 w-4 opacity-70" />
                </button>
            </div>

            {/* Animated progress bar */}
            <div
                className={`snackbar-progress ${styles.progress}`}
                style={{
                    animationDuration: `${adjustedDuration}ms`,
                    animationPlayState: isExiting ? 'paused' : 'running',
                }}
            />
        </div>
    );
};

export default Snackbar;
