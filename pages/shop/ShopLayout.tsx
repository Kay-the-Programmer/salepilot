import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import { shopService, ShopInfo } from '../../services/shop.service';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import LoadingSpinner from '../../components/LoadingSpinner';

const ShopLayout: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!storeId || storeId === 'undefined') {
            setLoading(false);
            return;
        }

        const loadShopInfo = async () => {
            try {
                const info = await shopService.getShopInfo(storeId);
                setShopInfo(info);
                document.title = info.settings.name || info.name || 'Online Store';
            } catch (error) {
                console.error("Failed to load shop info", error);
            } finally {
                setLoading(false);
            }
        };

        const updateCartCount = () => {
            const savedCart = localStorage.getItem(`cart_${storeId}`);
            if (savedCart) {
                try {
                    const items = JSON.parse(savedCart);
                    const count = Array.isArray(items) ? items.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) : 0;
                    setCartCount(count);
                } catch {
                    setCartCount(0);
                }
            } else {
                setCartCount(0);
            }
        };

        loadShopInfo();
        updateCartCount();

        window.addEventListener('cart-updated', updateCartCount);
        return () => window.removeEventListener('cart-updated', updateCartCount);

    }, [storeId]);

    if (loading) {
        return <LoadingSpinner text="Loading store..." />;
    }

    if (!shopInfo) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Store not found</div>;
    }

    // Check if store is enabled
    if (shopInfo.settings.isOnlineStoreEnabled === false) { // Explicit check as undefined should default to true or be handled safely
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                    <HiOutlineShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{shopInfo.settings.name || shopInfo.name} is currently offline</h1>
                <p className="text-gray-500 max-w-md">The store is currently undergoing maintenance or is temporarily closed. Please check back later.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to={`/shop/${storeId}`} className="flex items-center gap-2">
                        {/* Placeholder for Logo */}
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            {shopInfo.settings.name ? shopInfo.settings.name.charAt(0) : 'S'}
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
                            {shopInfo.settings.name || shopInfo.name}
                        </h1>
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link to={`/shop/${storeId}`} className="text-gray-600 hover:text-indigo-600 hidden sm:block">Home</Link>
                        <Link to={`/shop/${storeId}/products`} className="text-gray-600 hover:text-indigo-600 hidden sm:block">Catalog</Link>

                        <button
                            onClick={() => navigate(`/shop/${storeId}/cart`)}
                            className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                            <HiOutlineShoppingBag className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet context={{ shopInfo }} />
            </main>

            {/* Floating Cart Button (Mobile) */}
            <button
                onClick={() => navigate(`/shop/${storeId}/cart`)}
                className={`
                    md:hidden fixed bottom-6 right-6 z-50 
                    w-14 h-14 bg-indigo-600 text-white rounded-full 
                    shadow-lg shadow-indigo-500/30 
                    flex items-center justify-center 
                    transition-all duration-300 transform active:scale-95
                    ${cartCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
                `}
                aria-label="View Cart"
            >
                <div className="relative">
                    <HiOutlineShoppingBag className="w-6 h-6" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-indigo-600">
                            {cartCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-lg font-bold mb-4">{shopInfo.settings.name || shopInfo.name}</h3>
                        <p className="text-gray-400 text-sm">
                            {shopInfo.settings.address || 'Location not specified'}
                        </p>
                        <p className="text-gray-400 text-sm">
                            {shopInfo.settings.email}
                        </p>
                        <p className="text-gray-400 text-sm">
                            {shopInfo.settings.phone}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to={`/shop/${storeId}`} className="hover:text-white">Home</Link></li>
                            <li><Link to={`/shop/${storeId}/products`} className="hover:text-white">All Products</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-4">Powered by SalePilot</h3>
                        <p className="text-gray-400 text-sm">
                            Simple, powerful POS & Inventory Management.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ShopLayout;
