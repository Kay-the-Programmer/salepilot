import React, { useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '5xl';

const SIZE: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '5xl': 'max-w-5xl',
};

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: ModalSize;
    /** Extra classes for the card container. */
    className?: string;
    /** Optional standardized header (icon + title + close button). */
    title?: React.ReactNode;
    icon?: React.ReactNode;
    /** Hide the standardized header's close (X) button. */
    hideClose?: boolean;
    /** When true, backdrop/Esc close is blocked (e.g. while a request is in flight). */
    disabled?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    /** Tailwind z-index class for the overlay. */
    zIndexClass?: string;
}

/**
 * Shared modal shell for the warm "Modern Tactile" brand.
 *
 * Bakes in the previously-copied overlay scaffolding: dimmed backdrop, click-outside
 * and Esc to close, and — crucially — `stopPropagation` on the card so clicks inside
 * never bubble out and close it (the bug that kept dismissing the payment modal).
 * Pass `title` for a standardized header, or render your own header inside `children`.
 */
export function Modal({
    open,
    onClose,
    children,
    size = 'md',
    className = '',
    title,
    icon,
    hideClose = false,
    disabled = false,
    closeOnBackdrop = true,
    closeOnEsc = true,
    zIndexClass = 'z-50',
}: ModalProps) {
    useEffect(() => {
        if (!open || !closeOnEsc) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !disabled) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, closeOnEsc, disabled, onClose]);

    if (!open) return null;

    return (
        <div
            className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-warm-900/50 backdrop-blur-sm`}
            onClick={() => { if (closeOnBackdrop && !disabled) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`bg-surface border border-brand-border rounded-2xl shadow-xl w-full ${SIZE[size]} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title !== undefined && (
                    <div className="p-6 border-b border-brand-border flex items-center justify-between gap-3 shrink-0">
                        <h3 className="text-lg font-extrabold tracking-tight text-brand-text flex items-center gap-2 min-w-0">
                            {icon}
                            <span className="truncate">{title}</span>
                        </h3>
                        {!hideClose && (
                            <button
                                onClick={onClose}
                                disabled={disabled}
                                className="shrink-0 p-2 text-brand-text-muted hover:text-brand-text hover:bg-surface-variant rounded-lg transition-all disabled:opacity-50 active:scale-95"
                                aria-label="Close"
                            >
                                <span className="material-symbols-rounded text-[20px]">close</span>
                            </button>
                        )}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

export default Modal;
