import React from 'react';
import { Product, StoreSettings, CartItem } from '../../types';
import {
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    Bars3Icon,
} from '../icons';
import XMarkIcon from '../icons/XMarkIcon';
import ListGridToggle from '../ui/ListGridToggle';
import { ProductCard } from './ProductCard';

interface MobileProductViewProps {
    isOpen: boolean;
    products: Product[];
    cart: CartItem[];
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    updateQuantity?: (productId: string, quantity: number) => void;
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
    updateQuantity,
    searchTerm,
    setSearchTerm,
    onOpenSidebar,
    onTourStart,
}) => {
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

    return (
        <div className={`md:hidden fixed inset-0 z-50 transition-transform duration-300 ease-in-out flex flex-col bg-slate-100 dark:bg-slate-900 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* ── Sticky Header ── */}
            <div className="flex-none sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-white/8">
                <div className="flex items-center gap-2 px-3 py-3">
                    {/* Menu */}
                    {onOpenSidebar && (
                        <button
                            onClick={onOpenSidebar}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                        >
                            <Bars3Icon className="w-5 h-5" />
                        </button>
                    )}

                    {/* Search Bar — takes remaining space */}
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            id="pos-mobile-search"
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search products…"
                            className="w-full pl-9 pr-9 py-2.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 rounded-full text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center active:scale-90 transition-all"
                            >
                                <XMarkIcon className="w-3 h-3 text-slate-700 dark:text-white" />
                            </button>
                        )}
                    </div>

                    {/* Grid/List Toggle */}
                    <ListGridToggle
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        size="sm"
                    />

                    {/* Help */}
                    <button
                        id="pos-mobile-help-btn"
                        onClick={onTourStart}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all flex-shrink-0"
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* ── Product List/Grid ── */}
            <div id="pos-mobile-product-list" className="flex-1 overflow-y-auto p-3 pb-28">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
                            <MagnifyingGlassIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold">No products found</p>
                        {searchTerm && (
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                No results for "{searchTerm}"
                            </p>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {products.slice(0, 60).map((product, index) => (
                            <div
                                key={product.id}
                                className="animate-staggered-fade-in flex flex-col"
                                style={{ animationDelay: `${Math.min(index, 20) * 0.04}s` }}
                            >
                                <ProductCard
                                    product={product}
                                    cartItem={cart.find(item => item.productId === product.id)}
                                    storeSettings={storeSettings}
                                    addToCart={addToCart}
                                    updateQuantity={updateQuantity}
                                    variant="mobile"
                                    onLowStockAlert={() => { }}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {products.slice(0, 60).map((product, index) => (
                            <div
                                key={product.id}
                                className="animate-staggered-fade-in"
                                style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}
                            >
                                <ProductCard
                                    product={product}
                                    cartItem={cart.find(item => item.productId === product.id)}
                                    storeSettings={storeSettings}
                                    addToCart={addToCart}
                                    updateQuantity={updateQuantity}
                                    variant="list"
                                    onLowStockAlert={() => { }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
