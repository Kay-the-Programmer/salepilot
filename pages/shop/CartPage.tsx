import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineMinus, HiOutlineShoppingBag, HiOutlineArrowLeft, HiOutlinePhoto } from 'react-icons/hi2';
import { buildAssetUrl } from '../../services/api';
import { useConfirm } from '../../components/ui/useConfirm';
import { CartItem, cartSubtotal, clearCart, getCart, removeFromCart, subscribeToCart, updateQuantity } from './cartStore';
import type { ShopOutletContext } from './ShopLayout';

/**
 * Cart review page: line items with steppers on the left, order summary with
 * the single conversion action (Proceed to checkout) on the right.
 */
const CartPage: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { shopInfo, formatPrice } = useOutletContext<ShopOutletContext>();
    const navigate = useNavigate();
    const { confirm, confirmDialog } = useConfirm();
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        if (!storeId) return;
        const refresh = () => setItems(getCart(storeId));
        refresh();
        return subscribeToCart(refresh);
    }, [storeId]);

    if (!storeId) return null;

    const subtotal = cartSubtotal(items);
    const taxRate = Number(shopInfo.settings?.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    if (items.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-20 h-20 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineShoppingBag className="w-10 h-10 text-warm-400" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-text mb-2">Your cart is empty</h1>
                <p className="text-brand-text-muted mb-8 max-w-sm mx-auto">
                    Browse the catalog and add products — they'll show up here.
                </p>
                <Link
                    to={`/shop/${storeId}/products`}
                    className="inline-flex items-center gap-2 h-12 px-7 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <button
                        onClick={() => navigate(`/shop/${storeId}/products`)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text-muted hover:text-sp-navy transition-colors mb-2"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" /> Continue shopping
                    </button>
                    <h1 className="text-2xl sm:text-[32px] sm:leading-10 font-semibold tracking-tight text-brand-text">
                        Your cart
                    </h1>
                </div>
                <button
                    onClick={async () => {
                        if (await confirm({ title: 'Clear cart?', message: 'This removes every item from your cart.', confirmLabel: 'Clear cart', danger: true })) {
                            clearCart(storeId);
                        }
                    }}
                    className="h-11 px-4 rounded-lg text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
                >
                    Clear cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── Items ── */}
                <div className="lg:col-span-8 bg-surface border border-brand-border rounded-lg overflow-hidden">
                    <ul className="divide-y divide-brand-border">
                        {items.map(item => (
                            <li key={item.id} className="flex gap-4 p-4 sm:p-5">
                                <Link
                                    to={`/shop/${storeId}/product/${item.id}`}
                                    className="w-20 h-20 sm:w-24 sm:h-24 flex-none rounded-lg bg-warm-100 border border-brand-border overflow-hidden flex items-center justify-center"
                                >
                                    {item.image ? (
                                        <img
                                            src={buildAssetUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <HiOutlinePhoto className="w-8 h-8 text-warm-400" />
                                    )}
                                </Link>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex items-start justify-between gap-3">
                                        <Link to={`/shop/${storeId}/product/${item.id}`} className="min-w-0">
                                            <p className="font-semibold text-brand-text leading-snug line-clamp-2 hover:text-sp-navy transition-colors">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-brand-text-muted mt-0.5">{formatPrice(item.price)} each</p>
                                        </Link>
                                        <p className="font-bold text-brand-text whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                    <div className="mt-auto pt-3 flex items-center justify-between">
                                        <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => updateQuantity(storeId, item.id, item.quantity - 1)}
                                                aria-label="Decrease quantity"
                                                className="w-11 h-11 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors"
                                            >
                                                <HiOutlineMinus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-brand-text">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(storeId, item.id, item.quantity + 1)}
                                                aria-label="Increase quantity"
                                                className="w-11 h-11 flex items-center justify-center text-brand-text-muted hover:bg-surface-variant transition-colors"
                                            >
                                                <HiOutlinePlus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(storeId, item.id)}
                                            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-semibold text-brand-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                        >
                                            <HiOutlineTrash className="w-4 h-4" /> Remove
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Summary ── */}
                <div className="lg:col-span-4 lg:sticky lg:top-36 bg-surface border border-brand-border rounded-lg p-6">
                    <h2 className="text-lg font-bold text-brand-text mb-5">Order summary</h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-brand-text-muted">Subtotal</dt>
                            <dd className="font-semibold text-brand-text">{formatPrice(subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-brand-text-muted">Tax{taxRate > 0 ? ` (${taxRate}%)` : ''}</dt>
                            <dd className="font-semibold text-brand-text">{formatPrice(tax)}</dd>
                        </div>
                        <div className="flex justify-between items-end border-t border-brand-border pt-4">
                            <dt className="font-bold text-brand-text">Total</dt>
                            <dd className="text-2xl font-bold tracking-tight text-sp-navy">{formatPrice(total)}</dd>
                        </div>
                    </dl>
                    <button
                        onClick={() => navigate(`/shop/${storeId}/checkout`)}
                        className="mt-6 w-full h-12 rounded-lg bg-sp-amber text-white font-bold text-sm uppercase tracking-wide hover:brightness-95 transition-all active:scale-[0.98]"
                    >
                        Proceed to checkout
                    </button>
                    <p className="mt-3 text-xs text-brand-text-muted text-center">
                        Stock is confirmed when you place the order.
                    </p>
                </div>
            </div>
            {confirmDialog}
        </div>
    );
};

export default CartPage;
