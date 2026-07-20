import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { HiOutlineXMark, HiOutlineShoppingBag, HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlinePhoto } from 'react-icons/hi2';
import { buildAssetUrl } from '../../services/api';
import { CartItem, cartSubtotal, removeFromCart, updateQuantity } from './cartStore';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    items: CartItem[];
    formatPrice: (price: number) => string;
}

/**
 * Slide-over mini cart (the pattern shoppers know from every major platform):
 * add to cart → drawer confirms it, shows the running order, and offers the
 * two next steps — keep shopping or check out.
 */
const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, storeId, items, formatPrice }) => {
    const navigate = useNavigate();
    const panelRef = useRef<HTMLDivElement>(null);

    // Escape closes; lock body scroll while open; move focus into the panel
    // so keyboard/screen-reader users land inside the dialog.
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const subtotal = cartSubtotal(items);

    return createPortal(
        <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-label="Shopping cart">
            {/* Backdrop (DESIGN.md overlays: dim + blur to focus the task) */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                tabIndex={-1}
                className="absolute right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 outline-none"
            >
                {/* Header */}
                <div className="flex-none flex items-center justify-between px-5 h-16 border-b border-brand-border">
                    <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                        <HiOutlineShoppingBag className="w-5 h-5 text-sp-navy" />
                        Your Cart
                        <span className="text-sm font-semibold text-brand-text-muted">
                            ({items.reduce((a, b) => a + b.quantity, 0)})
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close cart"
                        className="w-12 h-12 flex items-center justify-center rounded-lg text-brand-text-muted hover:bg-surface-variant hover:text-brand-text transition-colors active:scale-95"
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-warm-100 flex items-center justify-center mb-4">
                            <HiOutlineShoppingBag className="w-8 h-8 text-warm-400" />
                        </div>
                        <p className="font-semibold text-brand-text mb-1">Your cart is empty</p>
                        <p className="text-sm text-brand-text-muted mb-6">Browse the catalog to add products.</p>
                        <button
                            onClick={onClose}
                            className="px-6 h-12 rounded-lg bg-sp-navy text-white text-sm font-semibold hover:bg-sp-navy-light transition-colors active:scale-95"
                        >
                            Continue shopping
                        </button>
                    </div>
                ) : (
                    <>
                        <ul className="flex-1 overflow-y-auto divide-y divide-brand-border px-5">
                            {items.map(item => (
                                <li key={item.id} className="py-4 flex gap-3.5">
                                    <div className="w-16 h-16 flex-none rounded-lg bg-warm-100 border border-brand-border overflow-hidden flex items-center justify-center">
                                        {item.image ? (
                                            <img
                                                src={buildAssetUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <HiOutlinePhoto className="w-6 h-6 text-warm-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">{item.name}</p>
                                            <button
                                                onClick={() => removeFromCart(storeId, item.id)}
                                                aria-label={`Remove ${item.name}`}
                                                className="flex-none p-1.5 rounded-md text-brand-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => updateQuantity(storeId, item.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity"
                                                    className="w-8 h-8 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors"
                                                >
                                                    <HiOutlineMinus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-9 text-center text-sm font-bold text-brand-text">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(storeId, item.id, item.quantity + 1)}
                                                    disabled={item.stock > 0 && item.quantity >= item.stock}
                                                    aria-label="Increase quantity"
                                                    className="w-8 h-8 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors disabled:opacity-35"
                                                >
                                                    <HiOutlinePlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <span className="text-sm font-bold text-sp-navy">{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                        {item.stock > 0 && item.quantity >= item.stock && (
                                            <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
                                                Max available — only {item.stock} in stock
                                            </p>
                                        )}
                                        {(item.moq || 0) > 1 && (
                                            <p className="mt-1.5 text-[11px] font-semibold text-brand-text-muted">
                                                Minimum order {item.moq} — going below removes the item
                                            </p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Footer */}
                        <div className="flex-none border-t border-brand-border p-5 space-y-3 bg-surface">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-brand-text-muted">Subtotal</span>
                                <span className="text-xl font-bold text-brand-text tracking-tight">{formatPrice(subtotal)}</span>
                            </div>
                            <p className="text-xs text-brand-text-muted">Taxes calculated at checkout.</p>
                            <button
                                onClick={() => { onClose(); navigate(`/shop/${storeId}/checkout`); }}
                                className="w-full h-12 rounded-lg bg-sp-amber text-white font-bold text-sm uppercase tracking-wide hover:brightness-95 transition-all active:scale-[0.98]"
                            >
                                Checkout
                            </button>
                            <button
                                onClick={() => { onClose(); navigate(`/shop/${storeId}/cart`); }}
                                className="w-full h-12 rounded-lg border border-sp-navy text-sp-navy font-semibold text-sm hover:bg-sp-navy/5 transition-colors active:scale-[0.98]"
                            >
                                View cart
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CartDrawer;
