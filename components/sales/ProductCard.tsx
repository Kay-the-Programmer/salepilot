import React from 'react';
import { Product, CartItem, StoreSettings } from '../../types';
import { buildAssetUrl } from '@/services/api';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    BellAlertIcon,
    PlusIcon
} from '../icons';

interface ProductCardProps {
    product: Product;
    cartItem?: CartItem;
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    updateQuantity?: (productId: string, quantity: number) => void;
    onLowStockAlert: (product: Product) => void;
    variant: 'grid' | 'list' | 'mobile';
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    cartItem,
    storeSettings,
    addToCart,
    updateQuantity,
    onLowStockAlert,
    variant
}) => {
    const numericStock = typeof (product as any).stock === 'number'
        ? (product as any).stock
        : (parseFloat(String((product as any).stock)) || 0);
    const isSoldOut = numericStock === 0;
    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
    const isLowStock = numericStock > 0 && numericStock <= lowStockThreshold;

    const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

    const handleUpdateQuantity = (delta: number) => {
        if (updateQuantity && cartItem) {
            updateQuantity(product.id, cartItem.quantity + delta);
        }
    };

    if (variant === 'grid') {
        return (
            <div
                onClick={() => !isSoldOut && addToCart(product)}
                className={`
                    group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10
                    transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden cursor-pointer
                    ${isSoldOut ? 'opacity-60 grayscale' : ''}
                    ${cartItem ? 'ring-2 ring-blue-500 border-transparent' : ''}
                `}
            >
                {/* Image Container */}
                <div className="aspect-square bg-white dark:bg-slate-800 relative overflow-hidden">
                    {product.imageUrls?.[0] ? (
                        <img
                            src={buildAssetUrl(product.imageUrls[0])}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <ShoppingCartIcon className="w-12 h-12 opacity-20" />
                        </div>
                    )}

                    {/* Diagonal Strikethrough for Sold Out */}
                    {isSoldOut && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-1 bg-slate-400/70 transform rotate-[-20deg] shadow-md"></div>
                        </div>
                    )}

                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        {isSoldOut ? (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                Sold Out
                            </div>
                        ) : isLowStock ? (
                            <>
                                <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                    {numericStock} left
                                </div>
                                {/* Low Stock Alert Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLowStockAlert(product);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                                    title="Alert admin about low stock"
                                >
                                    <BellAlertIcon className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : null}
                    </div>

                    {/* Quick Add Overlay */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${cartItem ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110">
                            {cartItem ? (
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{cartItem.quantity}</span>
                            ) : (
                                <PlusIcon className="w-6 h-6 text-slate-900 dark:text-white" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Details */}
                <div className="p-3">
                    <h3 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 h-10 mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.name}
                    </h3>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white text-base">
                                {formatCurrency(product.price, storeSettings)}
                            </div>
                        </div>

                        {/* Quantity Controls Overlay (only visible if in cart) */}
                        {cartItem && (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => handleUpdateQuantity(-getStepFor(product.unitOfMeasure))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-400 transition-colors"
                                >
                                    -
                                </button>
                                <button
                                    onClick={() => handleUpdateQuantity(getStepFor(product.unitOfMeasure))}
                                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-400 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'list') {
        return (
            <div
                onClick={() => !isSoldOut && addToCart(product)}
                className={`
                    group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-3
                    transition-all duration-200 hover:shadow-md cursor-pointer flex items-center gap-4
                    ${isSoldOut ? 'opacity-60 grayscale' : ''}
                    ${cartItem ? 'ring-2 ring-blue-500 border-transparent' : ''}
                `}
            >
                {/* Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden relative">
                    {product.imageUrls?.[0] ? (
                        <img
                            src={buildAssetUrl(product.imageUrls[0])}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <ShoppingCartIcon className="w-8 h-8 opacity-20" />
                        </div>
                    )}

                    {/* Diagonal Strikethrough for Sold Out */}
                    {isSoldOut && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-0.5 bg-slate-400/70 transform rotate-[-20deg] shadow-sm"></div>
                        </div>
                    )}

                    {cartItem && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{cartItem.quantity}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        {isSoldOut ? (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                Sold Out
                            </span>
                        ) : isLowStock ? (
                            <>
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                    {numericStock} left
                                </span>
                                {/* Low Stock Alert Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onLowStockAlert(product);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md transition-all hover:scale-110 active:scale-95"
                                    title="Alert admin about low stock"
                                >
                                    <BellAlertIcon className="w-3 h-3" />
                                </button>
                            </>
                        ) : (
                            <span className="text-xs text-slate-500 dark:text-gray-500">
                                {numericStock} in stock
                            </span>
                        )}
                    </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white text-lg">
                            {formatCurrency(product.price, storeSettings)}
                        </div>
                    </div>
                    {cartItem && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => handleUpdateQuantity(-getStepFor(product.unitOfMeasure))}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-400 transition-colors"
                            >
                                -
                            </button>
                            <button
                                onClick={() => handleUpdateQuantity(getStepFor(product.unitOfMeasure))}
                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-gray-400 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'mobile') {
        const [isTapping, setIsTapping] = React.useState(false);

        const handleAddToCart = () => {
            if (isSoldOut) return;
            setIsTapping(true);
            addToCart(product);
            setTimeout(() => setIsTapping(false), 200);
        };

        return (
            <button
                onClick={handleAddToCart}
                className={`
                    bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-1 text-left relative
                    transition-all duration-200 active:scale-95 h-full flex flex-col
                    ${isTapping ? 'animate-card-tap ring-2 ring-blue-500 border-transparent shadow-lg shadow-blue-500/20' : ''}
                    ${cartItem ? 'ring-1 ring-blue-200 dark:ring-blue-500/30' : ''}
                `}
            >
                <div className="aspect-square bg-slate-100 dark:bg-white/5 rounded-lg mb-2 overflow-hidden relative">
                    {product.imageUrls?.[0] ? (
                        <img
                            src={buildAssetUrl(product.imageUrls[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <ShoppingCartIcon className="w-8 h-8" />
                        </div>
                    )}

                    {/* Quantity Badge for Mobile */}
                    {cartItem && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-cart-item">
                            {cartItem.quantity}
                        </div>
                    )}

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                            <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">SOLD OUT</span>
                        </div>
                    )}
                </div>
                <div className="px-1 pb-1">
                    <h3 className="font-medium text-xs text-slate-800 dark:text-gray-200 line-clamp-1 leading-tight">
                        {product.name}
                    </h3>
                    <div className="mt-1 font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurrency(product.price, storeSettings)}
                    </div>
                </div>
            </button>
        );
    }

    return null;
};
