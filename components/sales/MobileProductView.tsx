import React from 'react';
import { Product, StoreSettings, CartItem } from '../../types';
import {
    GridIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    BellAlertIcon
} from '../icons';
import logo from '../../assets/logo.png';
import { ProductCard } from './ProductCard';

interface MobileProductViewProps {
    isOpen: boolean;
    products: Product[];
    cart: CartItem[];
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onOpenSidebar?: () => void;
    onTourStart: () => void;
}

export const MobileProductView: React.FC<MobileProductViewProps> = ({
    isOpen,
    products,
    cart,
    storeSettings,
    addToCart,
    searchTerm,
    setSearchTerm,
    onOpenSidebar,
    onTourStart
}) => {
    return (
        <div className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 overflow-y-auto bg-slate-50 dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Mobile Products Header */}
            <div className="sticky top-0 z-10">
                {/* Top Bar (Menu, Logo, Notification) */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 p-4 pb-2">
                    <div className="flex items-center justify-between">
                        <div id="pos-mobile-header" className="flex items-center gap-2">
                            {onOpenSidebar && (
                                <button
                                    onClick={onOpenSidebar}
                                    className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none active:scale-95 transition-all duration-300"
                                >
                                    <GridIcon className="w-6 h-6 text-slate-700 dark:text-gray-300" />
                                </button>
                            )}
                        </div>
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <img src={logo} alt="SalePilot" className="h-8" />
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                id="pos-mobile-help-btn"
                                onClick={onTourStart}
                                className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all duration-300"
                                title="Help Guide"
                            >
                                <QuestionMarkCircleIcon className="w-6 h-6 text-slate-700 dark:text-gray-300" />
                            </button>
                            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 relative active:scale-95 transition-all duration-300">
                                <BellAlertIcon className="w-6 h-6 text-slate-700 dark:text-gray-300" />
                                {/* Optional: Add notification badge here if needed */}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar (Sticky) */}
                <div id="pos-mobile-search-container" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5 px-4 pb-4 pt-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="pos-mobile-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-white/10 rounded-3xl bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
            </div>
            {/* Mobile Products Grid */}
            <div id="pos-mobile-product-list" className="p-4 pb-24">
                <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 30).map((product, index) => (
                        <div
                            key={product.id}
                            className="animate-staggered-fade-in flex flex-col"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <ProductCard
                                product={product}
                                cartItem={cart.find(item => item.productId === product.id)}
                                storeSettings={storeSettings}
                                addToCart={addToCart}
                                variant="mobile"
                                onLowStockAlert={() => { }} // Not used in mobile view currently
                            />
                        </div>
                    ))}
                </div>
                {products.length === 0 && (
                    <div className="text-center py-12">
                        <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-gray-400">No products found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
