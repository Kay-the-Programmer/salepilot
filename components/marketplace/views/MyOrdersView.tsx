import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineClipboardDocumentList, HiOutlineBuildingStorefront, HiOutlineArrowRight } from 'react-icons/hi2';
import { shopService, MyOrder } from '../../../services/shop.service';
import { getCurrentUser } from '../../../services/authService';
import { formatCurrency } from '../../../utils/currency';

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    fulfilled: 'bg-success/15 text-success',
    shipped: 'bg-sp-navy/10 text-sp-navy',
    cancelled: 'bg-danger/10 text-danger',
    paid: 'bg-success/15 text-success',
    unpaid: 'bg-amber-100 text-amber-800',
    partially_paid: 'bg-amber-100 text-amber-800',
};

const chip = (label: string) => (
    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[label] || 'bg-surface-variant text-brand-text-muted'}`}>
        {label.replace('_', ' ')}
    </span>
);

/**
 * B2B "My orders": every order the signed-in buyer has placed across all
 * suppliers, newest first. Guests get a sign-in nudge — order identity comes
 * from the session token, never from anything the client claims.
 */
const MyOrdersView: React.FC = () => {
    const navigate = useNavigate();
    const [user] = useState(() => getCurrentUser());
    const [orders, setOrders] = useState<MyOrder[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        shopService.getMyOrders()
            .then(setOrders)
            .catch(() => setError('Could not load your orders. Please try again.'));
    }, [user]);

    if (!user) {
        return (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-sp-navy/5 flex items-center justify-center mx-auto mb-4">
                    <HiOutlineClipboardDocumentList className="w-8 h-8 text-sp-navy" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-text mb-2">Track your orders</h1>
                <p className="text-brand-text-muted mb-8 max-w-md mx-auto">
                    Sign in to see every order you've placed with suppliers on the marketplace, in one place.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center h-12 px-7 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                >
                    Sign in
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-brand-text mb-1">My orders</h1>
            <p className="text-sm text-brand-text-muted mb-6">Everything you've ordered from marketplace suppliers.</p>

            {error && (
                <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm font-semibold text-danger mb-6" role="alert">{error}</div>
            )}

            {orders === null && !error ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-lg border border-brand-border bg-surface animate-pulse" />
                    ))}
                </div>
            ) : orders && orders.length === 0 ? (
                <div className="rounded-lg border border-brand-border bg-surface py-16 text-center px-6">
                    <p className="font-semibold text-brand-text mb-1">No orders yet</p>
                    <p className="text-sm text-brand-text-muted mb-5">Browse supplier catalogs and place your first stock order.</p>
                    <Link
                        to="/marketplace"
                        className="inline-flex items-center h-11 px-6 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                    >
                        Browse suppliers
                    </Link>
                </div>
            ) : (
                <ul className="space-y-3">
                    {(orders || []).map(order => (
                        <li key={order.transactionId} className="bg-surface border border-brand-border rounded-lg overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap border-b border-brand-border">
                                <div className="min-w-0">
                                    <Link
                                        to={`/shop/${order.storeId}`}
                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-text hover:text-sp-navy transition-colors"
                                    >
                                        <HiOutlineBuildingStorefront className="w-4 h-4 text-brand-text-muted" />
                                        {order.storeName}
                                        <HiOutlineArrowRight className="w-3.5 h-3.5 text-brand-text-muted" />
                                    </Link>
                                    <p className="text-[11px] text-brand-text-muted mt-0.5 font-mono">
                                        {order.transactionId} · {new Date(order.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {chip(order.fulfillmentStatus || 'pending')}
                                    {chip(order.paymentStatus || 'unpaid')}
                                </div>
                            </div>
                            {(order.items || []).length > 0 && (
                                <ul className="px-5 divide-y divide-brand-border">
                                    {order.items.slice(0, 4).map((item, i) => (
                                        <li key={i} className="py-2 flex justify-between gap-3 text-sm">
                                            <span className="text-brand-text min-w-0 truncate">
                                                <span className="font-bold text-sp-navy">{Number(item.quantity)}×</span> {item.name || 'Item'}
                                            </span>
                                        </li>
                                    ))}
                                    {order.items.length > 4 && (
                                        <li className="py-2 text-xs text-brand-text-muted">+ {order.items.length - 4} more items</li>
                                    )}
                                </ul>
                            )}
                            <div className="px-5 py-3 bg-warm-100/60 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-brand-text-muted">Total</span>
                                <span className="text-lg font-bold tracking-tight text-sp-navy">
                                    {formatCurrency(Number(order.total) || 0, { currency: order.storeCurrency || { code: 'ZMW', symbol: 'K', position: 'before' } } as any)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyOrdersView;
