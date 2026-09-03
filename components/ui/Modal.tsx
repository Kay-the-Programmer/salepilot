import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

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

/**
 * Elements that can hold keyboard focus. Used for the focus trap and to pick
 * the element that receives focus when the dialog opens.
 */
const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusableWithin = (root: HTMLElement): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
        // `offsetParent === null` catches `display:none` ancestors; a dialog can
        // hold collapsed sections whose controls must not be tab stops.
        .filter(el => el.offsetParent !== null || el === document.activeElement);

/**
 * Body scroll lock, ref-counted so stacked dialogs behave. The POS opens a
 * manager-override dialog on top of the payment dialog — closing the inner one
 * must not unlock scrolling while the outer one is still up.
 */
let scrollLockCount = 0;
let scrollLockPrevOverflow = '';

const lockBodyScroll = (): void => {
    if (scrollLockCount === 0) {
        scrollLockPrevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    scrollLockCount += 1;
};

const unlockBodyScroll = (): void => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
        document.body.style.overflow = scrollLockPrevOverflow;
    }
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
    /**
     * Where the card sits. `top` suits a search-first surface (the command
     * palette), which reads better anchored near the top than jumping to the
     * middle of the screen as its result list grows and shrinks.
     */
    align?: 'center' | 'top';
    /**
     * Accessible name for dialogs that render their own header instead of
     * passing `title`. Ignored when `title` is provided (the header's heading
     * is wired up as the name in that case).
     */
    ariaLabel?: string;
}

/**
 * Shared modal shell for the warm "Modern Tactile" brand.
 *
 * Bakes in the previously-copied overlay scaffolding: dimmed backdrop, click-outside
 * and Esc to close, and — crucially — `stopPropagation` on the card so clicks inside
 * never bubble out and close it (the bug that kept dismissing the payment modal).
 * Pass `title` for a standardized header, or render your own header inside `children`.
 *
 * The dialog also owns the behaviour `role="dialog"` promises but that markup
 * alone does not provide: focus moves into the card on open and is restored to
 * whatever opened it on close, Tab is trapped inside while it is up, the page
 * behind it stops scrolling, and the header heading names the dialog.
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
    ariaLabel,
    align = 'center',
}: ModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    // The element that had focus before the dialog opened, so it can be given
    // focus back on close (otherwise focus falls to <body> and the next Tab
    // restarts from the top of the page).
    const restoreFocusRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!open || !closeOnEsc) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !disabled) onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, closeOnEsc, disabled, onClose]);

    // Freeze the page behind the dialog for as long as it is open.
    useEffect(() => {
        if (!open) return;
        lockBodyScroll();
        return unlockBodyScroll;
    }, [open]);

    // Move focus into the dialog on open, and put it back on close.
    useEffect(() => {
        if (!open) return;
        restoreFocusRef.current = document.activeElement as HTMLElement | null;

        // Defer a frame so children rendered by this same commit are mounted.
        const raf = requestAnimationFrame(() => {
            const card = cardRef.current;
            if (!card) return;
            const preferred = card.querySelector<HTMLElement>('[data-autofocus]');
            const target = preferred || focusableWithin(card)[0] || card;
            target.focus();
        });

        return () => {
            cancelAnimationFrame(raf);
            const prev = restoreFocusRef.current;
            // Only restore if the trigger is still in the document — it may have
            // been unmounted by the very action that closed the dialog.
            if (prev && document.contains(prev)) prev.focus();
        };
    }, [open]);

    // Trap Tab inside the dialog. Without this, tabbing walks out of the card
    // and into the page behind it, which `aria-modal` claims cannot happen.
    const onKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Tab') return;
        const card = cardRef.current;
        if (!card) return;

        const items = focusableWithin(card);
        if (items.length === 0) {
            // Nothing focusable inside — keep focus on the card itself.
            e.preventDefault();
            card.focus();
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey && (active === first || active === card)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    };

    if (!open || typeof document === 'undefined') return null;

    // Render into a portal at <body> so the fixed overlay can never be clipped or
    // mis-positioned by an ancestor with `transform` / `filter` / `overflow` (the
    // classic "modal doesn't show / appears off-screen" bug).
    return createPortal(
        <div
            className={`fixed inset-0 ${zIndexClass} flex justify-center p-4 bg-warm-900/50 backdrop-blur-sm ${align === 'top' ? 'items-start pt-[10vh]' : 'items-center'}`}
            onClick={() => { if (closeOnBackdrop && !disabled) onClose(); }}
        >
            <div
                ref={cardRef}
                role="dialog"
                aria-modal="true"
                // A dialog needs a name. Prefer the standardized header's
                // heading; fall back to an explicit label for callers that
                // render their own header inside `children`.
                aria-labelledby={title !== undefined ? titleId : undefined}
                aria-label={title === undefined ? ariaLabel : undefined}
                tabIndex={-1}
                onKeyDownCapture={onKeyDownCapture}
                className={`bg-surface border border-brand-border rounded-2xl shadow-xl w-full ${SIZE[size]} max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 outline-none ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {title !== undefined && (
                    <div className="p-6 border-b border-brand-border flex items-center justify-between gap-3 shrink-0">
                        <h3 className="text-lg font-extrabold tracking-tight text-brand-text flex items-center gap-2 min-w-0">
                            {/* Hidden from the a11y tree: these are Material Symbols
                                spans whose text content is the ligature name, which
                                would otherwise be read out as part of the dialog's
                                name ("warning Clear cart?"). */}
                            {icon !== undefined && <span aria-hidden="true" className="flex items-center shrink-0">{icon}</span>}
                            {/* The name is the title text alone, not the whole heading. */}
                            <span id={titleId} className="truncate">{title}</span>
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
        </div>,
        document.body
    );
}

export default Modal;
