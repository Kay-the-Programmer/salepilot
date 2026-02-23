import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
    HiOutlineTrash,
    HiOutlinePlus,
    HiOutlineMinus,
    HiOutlineShoppingBag,
    HiOutlineArrowLeft,
    HiOutlineShieldCheck,
    HiOutlineTruck,
    HiOutlineCreditCard
} from 'react-icons/hi2';
import { buildAssetUrl } from '../../services/api';
import { ShopInfo, shopService } from '../../services/shop.service';
import { formatCurrency } from '../../utils/currency';
import { getCurrentUser } from '../../services/authService';
import { logEvent } from '../../src/utils/analytics';

const CartPage: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { shopInfo } = useOutletContext<{ shopInfo: ShopInfo }>();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const navigate = useNavigate();

    // Checkout State
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!storeId) return;
        loadCart();

        // Pre-fill user details if logged in
        const user = getCurrentUser();
        if (user) {
            setCustomerDetails(prev => ({
                ...prev,
                name: user.name,
                email: user.email,
                phone: user.phone || '',
                address: '' // User object might not have address in basic profile, but if it does, add it here
            }));
        }

        window.addEventListener('cart-updated', loadCart);
        return () => window.removeEventListener('cart-updated', loadCart);
    }, [storeId]);

    const loadCart = () => {
        const savedCart = localStorage.getItem(`cart_${storeId}`);
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch {
                setCartItems([]);
            }
        }
    };

    const updateQuantity = (index: number, newQty: number) => {
        const updated = [...cartItems];
        if (newQty <= 0) {
            removeItem(index);
            return;
        }
        updated[index].quantity = newQty;
        setCartItems(updated);
        saveCart(updated);
    };

    const removeItem = (index: number) => {
        const updated = cartItems.filter((_, i) => i !== index);
        setCartItems(updated);
        saveCart(updated);
    };

    const saveCart = (items: any[]) => {
        localStorage.setItem(`cart_${storeId}`, JSON.stringify(items));
        window.dispatchEvent(new Event('cart-updated'));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!storeId) return;

        try {
            const user = getCurrentUser();
            const payload: any = {
                cart: cartItems.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                customerDetails
            };

            if (user) {
                payload.customerId = user.id;
                payload.userId = user.id; // Send both to ensure backend linkage
            }

            const response = await shopService.createOrder(storeId, payload);
            logEvent('Shop', 'Begin Checkout', `Items: ${cartItems.length}`);

            setOrderData(response);
            setOrderComplete(true);
            logEvent('Shop', 'Purchase', `Order ID: ${(response as any).orderId}`);
            localStorage.removeItem(`cart_${storeId}`);
            window.dispatchEvent(new Event('cart-updated'));
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return formatCurrency(price, shopInfo.settings as any);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const taxRate = shopInfo.settings?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    if (orderComplete) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="liquid-glass-card rounded-[2rem] max-w-2xl w-full rounded-[40px] -indigo-100 border border-slate-100 p-8 sm:p-16 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Order Confirmed!</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
                        Thank you for shopping with <span className="text-indigo-600 font-bold">{shopInfo.settings.name || shopInfo.name}</span>.
                        Your order has been placed successfully.
                    </p>

                    {orderData?.orderId && (
                        <div className="bg-slate-50 rounded-2xl p-4 mb-8 inline-block px-8">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Order Reference</p>
                            <p className="text-xl font-mono font-bold text-slate-900">{orderData.orderId}</p>
                        </div>
                    )}

                    {shopInfo.settings.receiptMessage && (
                        <div className="mb-10 p-6 bg-indigo-50/50 rounded-[32px] text-indigo-700 text-sm font-medium leading-relaxed italic border border-indigo-100">
                            "{shopInfo.settings.receiptMessage}"
                        </div>
                    )}

                    <button
                        onClick={() => navigate(`/shop/${storeId}/products`)}
                        className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        Continue Shopping
                    </button>

                    <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Confirmation sent to {customerDetails.email}
                    </p>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <div className="w-32 h-32 bg-slate-100 rounded-[40px] flex items-center justify-center mx-auto mb-8 relative">
                    <HiOutlineShoppingBag className="w-16 h-16 text-slate-300" />
                    <div className="liquid-glass-card rounded-[2rem] absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
                        <span className="text-xs font-black text-slate-400">0</span>
                    </div>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Your cart is empty</h2>
                <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto text-lg leading-relaxed">
                    Looks like you haven't added anything to your cart yet. Let's find some amazing products!
                </p>
                <Link
                    to={`/shop/${storeId}/products`}
                    className="inline-flex items-center px-10 py-5 bg-[#0A2E5C] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-900 transition-all active:scale-95 shadow-xl shadow-indigo-100"
                >
                    Explore Products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-xs uppercase tracking-widest mb-4"
                    >
                        <HiOutlineArrowLeft className="w-4 h-4" />
                        Back to Store
                    </button>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Checkout</h1>
                </div>
                <div className="liquid-glass-card rounded-[2rem] px-6 py-4 rounded-[24px] border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <HiOutlineShoppingBag className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Items in Cart</p>
                        <p className="text-xl font-black text-slate-900 leading-none">{cartItems.reduce((a, b) => a + b.quantity, 0)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
                {/* Cart Items Section */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="liquid-glass-card rounded-[2rem] rounded-[40px] border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                            <h2 className="text-lg font-black text-slate-900">Review Items</h2>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to clear your cart?')) {
                                        setCartItems([]);
                                        saveCart([]);
                                    }
                                }}
                                className="text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                            >
                                Clear All
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-50">
                            {cartItems.map((item, index) => (
                                <li key={`${item.id}-${index}`} className="flex flex-col sm:flex-row py-8 px-6 sm:px-8 hover:bg-slate-50/30 transition-colors gap-6 group active:scale-95 transition-all duration-300">
                                    <div className="h-32 w-full sm:w-32 flex-shrink-0 overflow-hidden rounded-[24px] bg-slate-100 border border-slate-200/50">
                                        {item.image ? (
                                            <img
                                                src={buildAssetUrl(item.image)}
                                                alt={item.name}
                                                className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=No+Image' }}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                <HiOutlineShoppingBag className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <p className="mt-1 text-sm font-bold text-slate-400">
                                                    {formatPrice(item.price)} each
                                                </p>
                                            </div>
                                            <p className="text-xl font-black text-slate-900 whitespace-nowrap">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
                                            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95 transition-all duration-300"
                                                >
                                                    <HiOutlineMinus className="w-4 h-4" />
                                                </button>
                                                <div className="px-4 font-black text-slate-900 min-w-[3rem] text-center">{item.quantity}</div>
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95 transition-all duration-300"
                                                >
                                                    <HiOutlinePlus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest bg-slate-100 hover:bg-rose-50 px-4 py-3 rounded-2xl active:scale-95 transition-all duration-300"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Features/Trust Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                                <HiOutlineShieldCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500">Secure <br /> Payment</span>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                                <HiOutlineTruck className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500">Fast <br /> Delivery</span>
                        </div>
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 text-purple-600">
                                <HiOutlineCreditCard className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-500">Genuine <br /> Products</span>
                        </div>
                    </div>
                </div>

                {/* Checkout Column */}
                <div className="lg:col-span-5 sticky top-28 space-y-6">
                    <div className="liquid-glass-card rounded-[2rem] rounded-[40px] -slate-200 border border-slate-100 overflow-hidden">
                        <div className="p-8 sm:p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-8">Order Summary</h2>

                            <div className="space-y-6 mb-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Subtotal</span>
                                    <span className="text-slate-900 font-black text-lg">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 font-bold">Estimated Tax (10%)</span>
                                    <span className="text-slate-900 font-black text-lg">{formatPrice(tax)}</span>
                                </div>
                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xl font-black text-slate-900">Total</span>
                                    <span className="text-3xl font-black text-indigo-600">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Details</h3>
                                <form onSubmit={handleCheckout} className="space-y-5">
                                    {error && (
                                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-black">!</div>
                                            <p className="text-sm font-bold text-rose-700">{error}</p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-5 top-3.5 z-10 transition-all group-focus-within:text-indigo-600 group-focus-within:top-2.5">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={customerDetails.name}
                                                onChange={handleInputChange}
                                                className="w-full pl-5 pr-5 pt-8 pb-3 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900"
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-5 top-3.5 z-10 transition-all group-focus-within:text-indigo-600 group-focus-within:top-2.5">Email</label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    required
                                                    value={customerDetails.email}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-5 pr-5 pt-8 pb-3 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                            <div className="relative group">
                                                <label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-5 top-3.5 z-10 transition-all group-focus-within:text-indigo-600 group-focus-within:top-2.5">Phone</label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={customerDetails.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-5 pr-5 pt-8 pb-3 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <label htmlFor="address" className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute left-5 top-3.5 z-10 transition-all group-focus-within:text-indigo-600 group-focus-within:top-2.5">Delivery Address</label>
                                            <textarea
                                                id="address"
                                                name="address"
                                                rows={3}
                                                value={customerDetails.address}
                                                onChange={handleInputChange}
                                                className="w-full pl-5 pr-5 pt-8 pb-3 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-900 resize-none"
                                                placeholder="Street, City, Zip Code"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full flex justify-center py-6 px-4 bg-[#FF7F27] text-white rounded-[24px] shadow-xl shadow-orange-100 text-sm font-black uppercase tracking-[0.2em] hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all active:scale-95 disabled:opacity-75 disabled:active:scale-100 disabled:cursor-not-allowed mt-4`}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing...</span>
                                            </div>
                                        ) : 'Complete Purchase'}
                                    </button>

                                    <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest mt-6">
                                        Safe and encrypted transaction
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar for Price (Only on mobile) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50 lg:hidden flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                    <p className="text-2xl font-black text-indigo-600 leading-none">{formatPrice(total)}</p>
                </div>
                <button
                    onClick={() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                    }}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                >
                    Place Order
                </button>
            </div>
        </div>
    );
};

export default CartPage;
