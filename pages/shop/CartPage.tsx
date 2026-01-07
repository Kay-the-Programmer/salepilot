import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi2';
import { buildAssetUrl } from '../../services/api';
import { ShopInfo, shopService } from '../../services/shop.service';

const CartPage: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const { shopInfo } = useOutletContext<{ shopInfo: ShopInfo }>();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderData, setOrderData] = useState<any>(null); // To store response like orderId

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
            const response = await shopService.createOrder(storeId, {
                cart: cartItems.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                customerDetails
            });

            setOrderData(response);
            setOrderComplete(true);
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
        const currency = shopInfo.settings?.currency?.code || 'USD';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.10; // Estimated 10%
    const total = subtotal + tax;

    if (orderComplete) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center bg-white rounded-lg shadow-sm border border-gray-100 my-12">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl text-green-600">Order Confirmed!</h1>
                <p className="mt-4 text-base text-gray-500">
                    Thank you for shopping with {shopInfo.settings.name || shopInfo.name}. Your order has been placed successfully.
                </p>
                {orderData?.orderId && (
                    <p className="mt-2 text-lg font-medium text-gray-700">
                        Order ID: <span className="font-mono">{orderData.orderId}</span>
                    </p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                    We'll contact you at {customerDetails.email} with updates.
                </p>
                <div className="mt-10">
                    <Link
                        to={`/shop/${storeId}/products`}
                        className="inline-block bg-indigo-600 border border-transparent rounded-md py-3 px-8 font-medium text-white hover:bg-indigo-700 shadow"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
                    <HiOutlineTrash className="w-10 h-10 text-gray-400" />
                    {/* Using Trash icon as placeholder for generic empty cart icon if unavailable */}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't added any items to the cart yet. Explore our products to find something you like.</p>
                <Link
                    to={`/shop/${storeId}/products`}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Shopping Cart</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                <section className="lg:col-span-7">
                    <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
                        <ul className="divide-y divide-gray-200">
                            {cartItems.map((item, index) => (
                                <li key={`${item.id}-${index}`} className="flex py-6 px-4 sm:px-6">
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                                        {item.image ? (
                                            <img
                                                src={buildAssetUrl(item.image)}
                                                alt={item.name}
                                                className="h-full w-full object-cover object-center"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100?text=No+Image' }}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between text-base font-medium text-gray-900">
                                                <h3>
                                                    <Link to={`/shop/${storeId}/product/${item.id}`} className="hover:underline">{item.name}</Link>
                                                </h3>
                                                <p className="ml-4 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">{formatPrice(item.price)} each</p>
                                        </div>
                                        <div className="flex flex-1 items-end justify-between text-sm mt-4">
                                            <div className="flex items-center border border-gray-300 rounded-md">
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    <HiOutlineMinus className="w-4 h-4" />
                                                </button>
                                                <div className="px-2 py-1 min-w-[2rem] text-center font-medium text-gray-900">{item.quantity}</div>
                                                <button
                                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                                    className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                                                >
                                                    <HiOutlinePlus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="font-medium text-red-600 hover:text-red-500 flex items-center transition-colors"
                                            >
                                                <HiOutlineTrash className="w-4 h-4 mr-1" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="lg:col-span-5 mt-16 lg:mt-0">
                    <div className="bg-white shadow sm:rounded-lg border border-gray-200 p-6 sm:p-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
                        <dl className="space-y-4">
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-gray-600">Subtotal</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatPrice(subtotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-sm text-gray-600">Estimated Tax (10%)</dt>
                                <dd className="text-sm font-medium text-gray-900">{formatPrice(tax)}</dd>
                            </div>
                            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                                <dt className="text-base font-bold text-gray-900">Total</dt>
                                <dd className="text-base font-bold text-indigo-600">{formatPrice(total)}</dd>
                            </div>
                        </dl>

                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
                            <form onSubmit={handleCheckout} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={customerDetails.name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={customerDetails.email}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={customerDetails.phone}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Delivery Address</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows={3}
                                        value={customerDetails.address}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="123 Main St, City, State"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Processing...' : 'Place Order'}
                                </button>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    By placing this order, you agree to our Terms and Conditions.
                                </p>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CartPage;
