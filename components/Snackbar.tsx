
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
    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

    // Minimal, warm "Modern Tactile" toast — a clean white/surface card with a
    // single tinted accent (the icon chip + a hairline progress bar). The body
    // stays neutral so messages read clearly in both light and dark themes.
    const typeStyles: Record<SnackbarType, { chip: string; icon: string; progress: string }> = {
        success: { chip: 'bg-success-muted', icon: 'text-success', progress: 'bg-success' },
        error:   { chip: 'bg-danger-muted',  icon: 'text-danger',  progress: 'bg-danger' },
        info:    { chip: 'bg-surface-variant', icon: 'text-brand-text', progress: 'bg-brand-text-muted' },
        warning: { chip: 'bg-warning-muted', icon: 'text-warning', progress: 'bg-warning' },
        sync:    { chip: 'bg-surface-variant', icon: 'text-primary', progress: 'bg-primary' },
    };

    const styles = typeStyles[type];

    const Icon = {
        success: <CheckCircleIcon className={`h-4 w-4 ${styles.icon} snackbar-icon-animated`} />,
        error: <XCircleIcon className={`h-4 w-4 ${styles.icon} snackbar-icon-animated`} />,
        info: <InformationCircleIcon className={`h-4 w-4 ${styles.icon} snackbar-icon-animated`} />,
        warning: <ExclamationTriangleIcon className={`h-4 w-4 ${styles.icon} snackbar-icon-animated`} />,
        sync: <SyncIcon />,
    }[type];

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
                    ? 'fixed left-4 right-4 top-4 md:top-auto md:right-auto md:bottom-6 md:left-6 z-[200] md:max-w-sm'
                    : 'relative w-full'
                }
                bg-surface
                border border-brand-border
                rounded-2xl
                overflow-hidden
                ${animationClass}
                ${isOlder ? 'snackbar-stacked' : ''}
            `}
            role="alert"
            style={{
                boxShadow: isOlder
                    ? '0 4px 14px -6px rgba(26, 26, 46, 0.12)'
                    : '0 8px 24px -8px rgba(26, 26, 46, 0.18)',
            }}
        >
            {/* Main content */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Tinted icon chip — the single splash of colour */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.chip}`}>
                    {Icon}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug text-brand-text">{message}</p>
                </div>

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex-shrink-0 p-1.5 rounded-lg text-brand-text-muted transition-colors duration-200 hover:text-brand-text hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-brand-border active:scale-90"
                    aria-label="Dismiss"
                >
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Hairline progress bar */}
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
