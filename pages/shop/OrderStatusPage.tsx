import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineMagnifyingGlass, HiOutlineClipboardDocument } from 'react-icons/hi2';
import { shopService, ShopOrderStatus } from '../../services/shop.service';
import type { ShopOutletContext } from './ShopLayout';
import { useOutletContext } from 'react-router-dom';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Pending confirmation', cls: 'bg-warning/15 text-amber-700' },
    processing: { label: 'Being prepared', cls: 'bg-info/15 text-info' },
    fulfilled: { label: 'Fulfilled', cls: 'bg-success/15 text-success' },
    completed: { label: 'Completed', cls: 'bg-success/15 text-success' },
    cancelled: { label: 'Cancelled', cls: 'bg-danger/15 text-danger' },
    unpaid: { label: 'Pay on delivery/pickup', cls: 'bg-warning/15 text-amber-700' },
    paid: { label: 'Paid', cls: 'bg-success/15 text-success' },
};

const chip = (status: string) => {
    const s = STATUS_LABELS[status] || { label: status, cls: 'bg-surface-variant text-brand-text-muted' };
    return <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-bold ${s.cls}`}>{s.label}</span>;
};

/**
 * Order confirmation (fresh from checkout, via navigation state) and public
 * order-status lookup (order id + the email/phone used at checkout).
 */
const OrderStatusPage: React.FC = () => {
    const { storeId, orderId } = useParams<{ storeId: string; orderId: string }>();
    const location = useLocation();
    const { shopInfo, formatPrice } = useOutletContext<ShopOutletContext>();

    const freshOrder = (location.state as any)?.order;
    const stateEmail = (location.state as any)?.contactEmail as string | undefined;
    const statePhone = (location.state as any)?.contactPhone as string | undefined;

    const [status, setStatus] = useState<ShopOrderStatus | null>(null);
    const [lookupContact, setLookupContact] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Auto-fetch when we know the contact (fresh checkout hand-off).
    useEffect(() => {
        if (!storeId || !orderId || (!stateEmail && !statePhone)) return;
        shopService.getOrderStatus(storeId, orderId, { email: stateEmail, phone: statePhone })
            .then(setStatus)
            .catch(() => { /* fresh-order card still renders from state */ });
    }, [storeId, orderId, stateEmail, statePhone]);

    const lookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || !orderId) return;
        const value = lookupContact.trim();
        if (!value) return;
        setLoading(true);
        setError('');
        try {
            const isEmail = value.includes('@');
            const res = await shopService.getOrderStatus(storeId, orderId, isEmail ? { email: value } : { phone: value });
            setStatus(res);
        } catch (err: any) {
            setError('No order found for that reference and contact. Double-check both and try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyRef = () => {
        navigator.clipboard?.writeText(orderId || '').then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(() => { });
    };

    const summary = status || (freshOrder ? {
        orderId: freshOrder.orderId,
        timestamp: freshOrder.timestamp,
        total: freshOrder.total,
        subtotal: freshOrder.total,
        tax: 0,
        paymentStatus: 'unpaid',
        fulfillmentStatus: freshOrder.status || 'pending',
        customerName: freshOrder.customerName,
        items: [],
    } as ShopOrderStatus : null);

    // ── No data: lookup form ──
    if (!summary) {
        return (
            <div className="max-w-md mx-auto py-12">
                <div className="bg-surface border border-brand-border rounded-lg p-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-sp-navy-soft flex items-center justify-center mx-auto mb-5">
                        <HiOutlineMagnifyingGlass className="w-7 h-7 text-sp-navy" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-brand-text mb-2">Track your order</h1>
                    <p className="text-sm text-brand-text-muted mb-6">
                        Order <span className="font-mono font-bold text-brand-text">{orderId}</span> — enter the email or phone you used at checkout.
                    </p>
                    <form onSubmit={lookup} className="space-y-3">
                        <input
                            type="text"
                            value={lookupContact}
                            onChange={e => setLookupContact(e.target.value)}
                            placeholder="Email or phone"
                            className="w-full h-14 px-4 rounded-lg bg-surface border border-brand-border text-[15px] font-medium text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-b-2 focus:border-sp-amber transition-colors text-center"
                        />
                        {error && <p className="text-sm font-semibold text-danger">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading || !lookupContact.trim()}
                            className="w-full h-12 rounded-lg bg-sp-navy text-white font-bold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98] disabled:opacity-60"
                        >
                            {loading ? 'Looking up…' : 'View order status'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const isFresh = !!freshOrder && summary.orderId === freshOrder.orderId;

    return (
        <div className="max-w-2xl mx-auto py-6 space-y-6">
            {/* ── Confirmation hero ── */}
            {isFresh && (
                <div className="text-center py-6">
                    <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5">
                        <HiOutlineCheckCircle className="w-11 h-11 text-success" />
                    </div>
                    <h1 className="text-2xl sm:text-[32px] sm:leading-10 font-semibold tracking-tight text-brand-text mb-2">
                        Order placed!
                    </h1>
                    <p className="text-brand-text-muted max-w-md mx-auto">
                        Thanks{summary.customerName ? `, ${summary.customerName.split(' ')[0]}` : ''} — {shopInfo.settings.name || shopInfo.name} has received your order and will confirm it shortly.
                    </p>
                </div>
            )}

            {/* ── Order card ── */}
            <div className="bg-surface border border-brand-border rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-brand-border flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Order reference</p>
                        <button
                            onClick={copyRef}
                            className="inline-flex items-center gap-2 font-mono font-bold text-brand-text hover:text-sp-navy transition-colors"
                            title="Copy order reference"
                        >
                            {summary.orderId}
                            <HiOutlineClipboardDocument className="w-4 h-4" />
                            {copied && <span className="text-xs font-sans font-semibold text-success">Copied</span>}
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {chip(summary.fulfillmentStatus)}
                        {chip(summary.paymentStatus)}
                    </div>
                </div>

                {summary.items.length > 0 && (
                    <ul className="divide-y divide-brand-border px-6">
                        {summary.items.map((item, i) => (
                            <li key={i} className="py-3 flex justify-between gap-3 text-sm">
                                <span className="text-brand-text min-w-0 truncate">
                                    <span className="font-bold text-sp-navy">{item.quantity}×</span> {item.name}
                                </span>
                                <span className="font-semibold text-brand-text whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="px-6 py-5 bg-warm-100/60">
                    {Number(summary.deliveryFee) > 0 && (
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-brand-text-muted">Includes delivery fee</span>
                            <span className="font-semibold text-brand-text">{formatPrice(Number(summary.deliveryFee))}</span>
                        </div>
                    )}
                    <div className="flex items-end justify-between">
                        <span className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">Total due</span>
                        <span className="text-3xl font-bold tracking-tight text-sp-navy">{formatPrice(summary.total)}</span>
                    </div>
                </div>
            </div>

            {/* ── What happens next ── */}
            {isFresh && (
                <div className="bg-surface border border-brand-border rounded-lg p-6">
                    <h2 className="text-base font-bold text-brand-text mb-4">What happens next</h2>
                    <ol className="space-y-3">
                        {[
                            'The store confirms your order' + (stateEmail || statePhone ? ' and contacts you' : ''),
                            'Your items are prepared for delivery or pickup',
                            'You pay when you receive your order',
                        ].map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-brand-text">
                                <span className="w-6 h-6 flex-none rounded-full bg-sp-navy text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                    <p className="mt-4 text-xs text-brand-text-muted">
                        Save your order reference — you can return to this page anytime to check the status.
                    </p>
                </div>
            )}

            <div className="text-center">
                <Link
                    to={`/shop/${storeId}/products`}
                    className="inline-flex items-center h-12 px-8 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors active:scale-[0.98]"
                >
                    Continue shopping
                </Link>
            </div>
        </div>
    );
};

export default OrderStatusPage;
