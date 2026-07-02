import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnackbarType } from '../App';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XMarkIcon from './icons/XMarkIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

/**
 * The toast card. Purely presentational — positioning and stacking belong to
 * ToastContext's container. Minimal per DESIGN.md: a flat surface card with a
 * single tinted accent (icon chip + hairline progress), no glows or bounces.
 * Hovering pauses the auto-dismiss so long errors can be read.
 */
interface SnackbarProps {
    message: string;
    type: SnackbarType;
    onClose: () => void;
    /** Auto-dismiss after this many ms (default 4000). */
    duration?: number;
}

const EXIT_MS = 200;

const SyncIcon = () => (
    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Snackbar: React.FC<SnackbarProps> = ({ message, type, onClose, duration = 4000 }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const remainingRef = useRef(duration);
    const startedAtRef = useRef(Date.now());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(onClose, EXIT_MS);
    }, [onClose]);

    // Auto-dismiss with hover-pause: the timer runs on the remaining time and
    // is suspended while the pointer is over the toast.
    useEffect(() => {
        if (isPaused || isExiting) {
            if (timerRef.current) clearTimeout(timerRef.current);
            remainingRef.current -= Date.now() - startedAtRef.current;
            return;
        }
        startedAtRef.current = Date.now();
        timerRef.current = setTimeout(handleClose, Math.max(remainingRef.current, 400));
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isPaused, isExiting, handleClose]);

    const TYPE_STYLES: Record<SnackbarType, { chip: string; icon: string; progress: string }> = {
        success: { chip: 'bg-success-muted', icon: 'text-success', progress: 'bg-success' },
        error:   { chip: 'bg-danger-muted',  icon: 'text-danger',  progress: 'bg-danger' },
        info:    { chip: 'bg-surface-variant', icon: 'text-brand-text', progress: 'bg-brand-text-muted' },
        warning: { chip: 'bg-warning-muted', icon: 'text-warning', progress: 'bg-warning' },
        sync:    { chip: 'bg-surface-variant', icon: 'text-primary', progress: 'bg-primary' },
    };
    const s = TYPE_STYLES[type] ?? TYPE_STYLES.info;

    const Icon = {
        success: <CheckCircleIcon className={`h-4 w-4 ${s.icon}`} />,
        error: <XCircleIcon className={`h-4 w-4 ${s.icon}`} />,
        info: <InformationCircleIcon className={`h-4 w-4 ${s.icon}`} />,
        warning: <ExclamationTriangleIcon className={`h-4 w-4 ${s.icon}`} />,
        sync: <SyncIcon />,
    }[type];

    return (
        <div
            className={`snackbar-container relative w-full bg-surface border border-brand-border rounded-xl overflow-hidden shadow-[0_8px_24px_-8px_rgba(24,28,30,0.18)] ${isExiting ? 'snackbar-exit-anim' : 'snackbar-enter-anim'}`}
            role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="flex items-center gap-3 px-4 py-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${s.chip}`}>
                    {Icon}
                </div>
                <p className="flex-1 min-w-0 text-sm font-medium leading-snug text-brand-text">{message}</p>
                <button
                    type="button"
                    onClick={handleClose}
                    className="flex-shrink-0 p-1.5 rounded-lg text-brand-text-muted transition-colors hover:text-brand-text hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-brand-border active:scale-90"
                    aria-label="Dismiss"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Hairline auto-dismiss indicator; pauses with the timer on hover */}
            <div
                className={`snackbar-progress ${s.progress}`}
                style={{
                    animationDuration: `${duration}ms`,
                    animationPlayState: isPaused || isExiting ? 'paused' : 'running',
                }}
            />
        </div>
    );
};

export default Snackbar;
