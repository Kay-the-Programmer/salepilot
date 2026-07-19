import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineBanknotes, HiOutlineLockClosed, HiOutlineTruck, HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { shopService } from '../../services/shop.service';
import { getCurrentUser } from '../../services/authService';
import { logEvent } from '../../src/utils/analytics';
import { CartItem, cartSubtotal, clearCart, getCart, subscribeToCart } from './cartStore';
import type { ShopOutletContext } from './ShopLayout';

type FulfillmentChoice = 'delivery' | 'pickup';

const inputClass =
    'w-full h-14 px-4 rounded-lg bg-surface border border-brand-border text-[15px] font-medium text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-b-2 focus:border-sp-amber transition-colors';

/**
 * Checkout: contact + delivery details, payment method, order summary.
 * Orders are placed as unpaid ("pay on delivery / pickup") — the model the
 * backend already runs; the store settles payment at handover.
 */
const CheckoutPage: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { shopInfo, formatPrice } = useOutletContext<ShopOutletContext>();
    const navigate = useNavigate();

    const [items, setItems] = useState<CartItem[]>([]);
    const [fulfillment, setFulfillment] = useState<FulfillmentChoice>('delivery');
    const [details, setDetails] = useState({ name: '', email: '', phone: '', address: '', note: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);

    // Bring validation problems into view — on mobile the message can sit
    // outside the viewport when a field far above is what needs fixing.
    // Direct + instant on purpose: effects already run after layout, and both
    // rAF and smooth scrolling stall in backgrounded/occluded renderers.
    useEffect(() => {
        if (error) errorRef.current?.scrollIntoView({ block: 'center' });
    }, [error]);

    useEffect(() => {
        if (!storeId) return;
        const refresh = () => setItems(getCart(storeId));
        refresh();

        const user = getCurrentUser();
        if (user) {
            setDetails(prev => ({ ...prev, name: user.name || '', email: user.email || '', phone: user.phone || '' }));
        }
        return subscribeToCart(refresh);
    }, [storeId]);

    if (!storeId) return null;

    const subtotal = cartSubtotal(items);
    const taxRate = Number(shopInfo.settings?.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const placeOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!details.name.trim()) { setError('Please enter your full name.'); return; }
        if (!details.email.trim() && !details.phone.trim()) {
            setError('Enter an email or phone number so the store can reach you.');
            return;
        }
        if (fulfillment === 'delivery' && !details.address.trim()) {
            setError('Please enter a delivery address, or switch to pickup.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                cart: items.map(item => ({ id: item.id, quantity: item.quantity })),
                customerDetails: {
                    name: details.name.trim(),
                    email: details.email.trim() || undefined,
                    phone: details.phone.trim() || undefined,
                    address: fulfillment === 'delivery' ? details.address.trim() : `PICKUP at ${shopInfo.settings.name || shopInfo.name}`,
                    note: details.note.trim() || undefined,
                },
            };
            const response: any = await shopService.createOrder(storeId, payload);
            logEvent('Shop', 'Purchase', `Order ID: ${response?.orderId}`);
            clearCart(storeId);
            navigate(`/shop/${storeId}/order/${response.orderId}`, {
                state: {
                    order: response,
                    contactEmail: details.email.trim() || undefined,
                    contactPhone: details.phone.trim() || undefined,
                },
                replace: true,
            });
        } catch (err: any) {
            // 409 INSUFFICIENT_STOCK carries a human-readable message from the server.
            setError(err?.message || 'Failed to place order. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="py-20 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-brand-text mb-2">Nothing to check out</h1>
                <p className="text-brand-text-muted mb-8">Your cart is empty.</p>
                <Link
                    to={`/shop/${storeId}/products`}
                    className="inline-flex items-center h-12 px-7 rounded-lg bg-sp-navy text-white font-semibold text-sm hover:bg-sp-navy-light transition-colors"
                >
                    Browse products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <button
                onClick={() => navigate(`/shop/${storeId}/cart`)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text-muted hover:text-sp-navy transition-colors mb-2"
            >
                <HiOutlineArrowLeft className="w-4 h-4" /> Back to cart
            </button>
            <h1 className="text-2xl sm:text-[32px] sm:leading-10 font-semibold tracking-tight text-brand-text mb-4">Checkout</h1>

            {/* Step indicator — shoppers always know where they are */}
            <ol className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-wider">
                {[
                    { n: 1, label: 'Cart', state: 'done' },
                    { n: 2, label: 'Details', state: 'active' },
                    { n: 3, label: 'Confirm', state: 'next' },
                ].map((step, i) => (
                    <React.Fragment key={step.n}>
                        {i > 0 && <span className="w-8 sm:w-12 h-px bg-brand-border" aria-hidden />}
                        <li className="flex items-center gap-1.5">
                            <span className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center ${step.state === 'done' ? 'bg-success text-white' : step.state === 'active' ? 'bg-sp-navy text-white' : 'bg-surface-variant text-brand-text-muted'}`}>
                                {step.state === 'done' ? '✓' : step.n}
                            </span>
                            <span className={step.state === 'next' ? 'text-brand-text-muted' : 'text-brand-text'}>{step.label}</span>
                        </li>
                    </React.Fragment>
                ))}
            </ol>

            <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── Left: details ── */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Contact */}
                    <section className="bg-surface border border-brand-border rounded-lg p-6">
                        <h2 className="text-base font-bold text-brand-text mb-4">Contact details</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="co-name" className="block text-sm font-semibold text-brand-text mb-1.5">Full name *</label>
                                <input id="co-name" name="name" type="text" required value={details.name} onChange={handleChange} placeholder="Jane Banda" className={inputClass} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="co-email" className="block text-sm font-semibold text-brand-text mb-1.5">Email</label>
                                    <input id="co-email" name="email" type="email" value={details.email} onChange={handleChange} placeholder="jane@example.com" className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="co-phone" className="block text-sm font-semibold text-brand-text mb-1.5">Phone</label>
                                    <input id="co-phone" name="phone" type="tel" value={details.phone} onChange={handleChange} placeholder="+260 97 000 0000" className={inputClass} />
                                </div>
                            </div>
                            <p className="text-xs text-brand-text-muted">Provide at least one — it's how the store confirms your order and how you track it.</p>
                        </div>
                    </section>

                    {/* Fulfillment */}
                    <section className="bg-surface border border-brand-border rounded-lg p-6">
                        <h2 className="text-base font-bold text-brand-text mb-4">How will you get your order?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {([
                                { id: 'delivery' as const, icon: HiOutlineTruck, title: 'Delivery', body: 'The store delivers to your address' },
                                { id: 'pickup' as const, icon: HiOutlineBuildingStorefront, title: 'Pickup', body: shopInfo.settings.address || 'Collect from the store' },
                            ]).map(({ id, icon: Icon, title, body }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setFulfillment(id)}
                                    aria-pressed={fulfillment === id}
                                    className={`flex items-start gap-3 p-4 rounded-lg text-left transition-all ${fulfillment === id ? 'border-2 border-sp-navy bg-sp-navy/5' : 'border border-brand-border hover:border-warm-400'}`}
                                >
                                    <Icon className={`w-5 h-5 mt-0.5 flex-none ${fulfillment === id ? 'text-sp-navy' : 'text-brand-text-muted'}`} />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-bold text-brand-text">{title}</span>
                                        <span className="block text-xs text-brand-text-muted truncate">{body}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                        {fulfillment === 'delivery' && (
                            <div>
                                <label htmlFor="co-address" className="block text-sm font-semibold text-brand-text mb-1.5">Delivery address *</label>
                                <textarea
                                    id="co-address" name="address" rows={3} value={details.address} onChange={handleChange}
                                    placeholder="Street, area, city"
                                    className="w-full px-4 py-3.5 rounded-lg bg-surface border border-brand-border text-[15px] font-medium text-brand-text placeholder:text-brand-text-muted/60 focus:outline-none focus:border-b-2 focus:border-sp-amber transition-colors resize-none"
                                />
                            </div>
                        )}
                        <div className="mt-4">
                            <label htmlFor="co-note" className="block text-sm font-semibold text-brand-text mb-1.5">Order note <span className="font-normal text-brand-text-muted">(optional)</span></label>
                            <input id="co-note" name="note" type="text" value={details.note} onChange={handleChange} placeholder="Anything the store should know" className={inputClass} />
                        </div>
                    </section>

                    {/* Payment */}
                    <section className="bg-surface border border-brand-border rounded-lg p-6">
                        <h2 className="text-base font-bold text-brand-text mb-4">Payment</h2>
                        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-sp-navy bg-sp-navy/5">
                            <HiOutlineBanknotes className="w-5 h-5 mt-0.5 flex-none text-sp-navy" />
                            <div>
                                <p className="text-sm font-bold text-brand-text">Pay on {fulfillment === 'delivery' ? 'delivery' : 'pickup'}</p>
                                <p className="text-xs text-brand-text-muted mt-0.5">
                                    Pay cash or mobile money when you receive your order. The store confirms your order first.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Right: summary ── */}
                <div className="lg:col-span-5 lg:sticky lg:top-36 bg-surface border border-brand-border rounded-lg overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-brand-text mb-4">Order summary</h2>
                        <ul className="divide-y divide-brand-border mb-4 max-h-64 overflow-y-auto">
                            {items.map(item => (
                                <li key={item.id} className="py-2.5 flex justify-between gap-3 text-sm">
                                    <span className="text-brand-text min-w-0 truncate">
                                        <span className="font-bold text-sp-navy">{item.quantity}×</span> {item.name}
                                    </span>
                                    <span className="font-semibold text-brand-text whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="space-y-2.5 text-sm border-t border-brand-border pt-4">
                            <div className="flex justify-between">
                                <dt className="text-brand-text-muted">Subtotal</dt>
                                <dd className="font-semibold text-brand-text">{formatPrice(subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-brand-text-muted">Tax{taxRate > 0 ? ` (${taxRate}%)` : ''}</dt>
                                <dd className="font-semibold text-brand-text">{formatPrice(tax)}</dd>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <dt className="font-bold text-brand-text">Total due</dt>
                                <dd className="text-3xl font-bold tracking-tight text-sp-navy">{formatPrice(total)}</dd>
                            </div>
                        </dl>

                        {error && (
                            <div ref={errorRef} className="mt-4 p-3.5 rounded-lg bg-danger/10 border border-danger/20" role="alert">
                                <p className="text-sm font-semibold text-danger">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-5 w-full h-14 rounded-lg bg-sp-amber text-white font-bold text-sm uppercase tracking-wide hover:brightness-95 transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Placing order…
                                </>
                            ) : (
                                <>Place order — {formatPrice(total)}</>
                            )}
                        </button>
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-brand-text-muted">
                            <HiOutlineLockClosed className="w-3.5 h-3.5" /> Your details go only to this store.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;
