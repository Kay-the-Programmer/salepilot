import React from 'react';
import { Product, StoreSettings, CartItem } from '../../types';
import {
    MagnifyingGlassIcon,
} from '../icons';
import { ProductCard } from './ProductCard';

interface MobileProductViewProps {
    isOpen: boolean;
    products: Product[];
    cart: CartItem[];
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    updateQuantity?: (productId: string, quantity: number) => void;
    searchTerm: string;
    viewMode: 'grid' | 'list';
}

export const MobileProductView: React.FC<MobileProductViewProps> = ({
    isOpen,
    products,
    cart,
    storeSettings,
    addToCart,
    updateQuantity,
    searchTerm,
    viewMode,
}) => {

    return (
        <div className={`md:hidden fixed inset-x-0 bottom-0 top-16 z-50 transition-transform duration-300 ease-in-out flex flex-col bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-3xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* ── Product List/Grid ── */}
            <div id="pos-mobile-product-list" className="flex-1 overflow-y-auto p-3 pt-2 pb-32">
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
