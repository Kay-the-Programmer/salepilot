
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

    // Premium glassmorphism + gradient backgrounds per type
    const typeStyles = {
        success: {
            container: 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white',
            progress: 'bg-white/40',
            iconBg: 'bg-white/20',
            closeHover: 'hover:bg-white/20',
        },
        error: {
            container: 'bg-gradient-to-r from-rose-500/90 to-red-500/90 text-white',
            progress: 'bg-white/40',
            iconBg: 'bg-white/20',
            closeHover: 'hover:bg-white/20',
        },
        info: {
            container: 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white',
            progress: 'bg-white/40',
            iconBg: 'bg-white/20',
            closeHover: 'hover:bg-white/20',
        },
        warning: {
            container: 'bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white',
            progress: 'bg-white/40',
            iconBg: 'bg-white/20',
            closeHover: 'hover:bg-white/20',
        },
        sync: {
            container: 'bg-gradient-to-r from-slate-600/90 to-slate-700/90 text-white',
            progress: 'bg-white/40',
            iconBg: 'bg-white/20',
            closeHover: 'hover:bg-white/20',
        },
    };

    const Icon = {
        success: <CheckCircleIcon className="h-5 w-5 text-white snackbar-icon-animated" />,
        error: <XCircleIcon className="h-5 w-5 text-white snackbar-icon-animated" />,
        info: <InformationCircleIcon className="h-5 w-5 text-white snackbar-icon-animated" />,
        warning: <ExclamationTriangleIcon className="h-5 w-5 text-white snackbar-icon-animated" />,
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
                rounded-2xl
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
            <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Icon with subtle background */}
                <div className={`flex-shrink-0 p-2 rounded-xl ${styles.iconBg}`}>
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
                        p-2 rounded-xl
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-white/50
                        ${styles.closeHover}
                        active:scale-90
                    `}
                    aria-label="Dismiss"
                >
                    <span className="sr-only">Dismiss</span>
                    <XMarkIcon className="h-4 w-4 text-white/80" />
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
