import React from 'react';
import { Product, CartItem, StoreSettings } from '../../types';
import { buildAssetUrl } from '@/services/api';
import { formatCurrency } from '../../utils/currency';
import {
    ShoppingCartIcon,
    BellAlertIcon,
    PlusIcon
} from '../icons';
import MinusIcon from '../icons/MinusIcon';

interface ProductCardProps {
    product: Product;
    cartItem?: CartItem;
    storeSettings: StoreSettings;
    addToCart: (product: Product) => void;
    updateQuantity?: (productId: string, quantity: number) => void;
    onLowStockAlert: (product: Product) => void;
    variant: 'grid' | 'list' | 'mobile';
}

// Shared helpers
const getStepFor = (uom?: 'unit' | 'kg') => (uom === 'kg' ? 0.1 : 1);

const StockBadge: React.FC<{
    isSoldOut: boolean;
    isLowStock: boolean;
    numericStock: number;
    onAlert: (e: React.MouseEvent) => void;
    size?: 'sm' | 'xs';
}> = ({ isSoldOut, isLowStock, numericStock, onAlert, size = 'sm' }) => {
    if (isSoldOut) return (
        <span className={`bg-red-500/90 text-white font-semibold rounded-full ${size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
            Sold Out
        </span>
    );
    if (isLowStock) return (
        <div className="flex items-center gap-1">
            <span className={`bg-amber-500/90 text-white font-semibold rounded-full ${size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
                {numericStock} left
            </span>
            <button
                onClick={onAlert}
                className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm"
                title="Alert about low stock"
            >
                <BellAlertIcon className="w-2.5 h-2.5" />
            </button>
        </div>
    );
    return null;
};

// ─── Grid Variant ─────────────────────────────────────────────────────────────
const GridCard: React.FC<ProductCardProps> = ({ product, cartItem, storeSettings, addToCart, updateQuantity, onLowStockAlert }) => {
    const numericStock = parseFloat(String((product as any).stock)) || 0;
    const isSoldOut = numericStock === 0;
    const isLowStock = numericStock > 0 && numericStock <= (product.reorderPoint || storeSettings.lowStockThreshold);
    const step = getStepFor(product.unitOfMeasure);

    return (
        <div
            onClick={() => !isSoldOut && addToCart(product)}
            className={`
                group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] overflow-hidden
                border transition-all duration-300 cursor-pointer select-none
                hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]
                hover:-translate-y-1 active:scale-[0.97]
                ${isSoldOut ? 'opacity-50 grayscale pointer-events-none' : ''}
                ${cartItem
                    ? 'border-indigo-500 dark:border-indigo-400 shadow-[0_0_0_2px_rgba(99,102,241,0.3)] dark:shadow-[0_0_0_2px_rgba(129,140,248,0.3)]'
                    : 'border-slate-200/50 dark:border-white/5'}
            `}
        >
            {/* Image */}
            <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900/60 relative overflow-hidden">
                {product.imageUrls?.[0] ? (
                    <img
                        src={buildAssetUrl(product.imageUrls[0])}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                            <ShoppingCartIcon className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                        </div>
                    </div>
                )}

                {/* Stock Badge */}
                <div className="absolute top-2 left-2">
                    <StockBadge isSoldOut={isSoldOut} isLowStock={isLowStock} numericStock={numericStock}
                        onAlert={(e) => { e.stopPropagation(); onLowStockAlert(product); }} size="xs" />
                </div>

                {/* Cart badge */}
                {cartItem && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-indigo-500/40 ring-2 ring-white dark:ring-slate-800 tabular-nums">
                        {cartItem.quantity}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2" style={{ minHeight: '2.5rem' }}>
                    {product.name}
                </h3>
                <div className="flex items-center justify-between">
                    <span className="text-base font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(product.price, storeSettings)}
                    </span>

                    {/* Stepper (only when in cart) */}
                    {cartItem && updateQuantity ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity - step)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-all"
                            >
                                <MinusIcon className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => updateQuantity(product.id, cartItem.quantity + step)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold flex items-center justify-center active:scale-90 transition-all"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 text-slate-500 dark:text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200">
                            <PlusIcon className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── List Variant ─────────────────────────────────────────────────────────────
const ListCard: React.FC<ProductCardProps> = ({ product, cartItem, storeSettings, addToCart, updateQuantity, onLowStockAlert }) => {
    const numericStock = parseFloat(String((product as any).stock)) || 0;
    const isSoldOut = numericStock === 0;
    const isLowStock = numericStock > 0 && numericStock <= (product.reorderPoint || storeSettings.lowStockThreshold);
    const step = getStepFor(product.unitOfMeasure);

    return (
        <div
            onClick={() => !isSoldOut && addToCart(product)}
            className={`
                group relative flex items-center gap-3 px-4 py-3 rounded-[20px] 
                border transition-all duration-300 cursor-pointer select-none
                hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] active:scale-[0.98] hover:-translate-y-0.5
                ${isSoldOut ? 'opacity-50 grayscale pointer-events-none' : ''}
                ${cartItem
                    ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                    : 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200/50 dark:border-white/5 hover:border-slate-300/80 dark:hover:border-white/10'}
            `}
        >
            {/* Thumbnail */}
            <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/60 relative">
                {product.imageUrls?.[0] ? (
                    <img src={buildAssetUrl(product.imageUrls[0])} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCartIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                    </div>
                )}
                {isSoldOut && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-red-400/70 rotate-[-25deg]" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate leading-tight ${cartItem ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                    {product.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {isSoldOut ? (
                        <span className="text-[10px] font-medium text-red-500">Sold Out</span>
                    ) : isLowStock ? (
                        <>
                            <span className="text-[10px] font-medium text-amber-600">{numericStock} left</span>
                            <button onClick={e => { e.stopPropagation(); onLowStockAlert(product); }}
                                className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <BellAlertIcon className="w-2 h-2" />
                            </button>
                        </>
                    ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{numericStock} in stock</span>
                    )}
                </div>
            </div>

            {/* Price + controls */}
            <div className="flex items-center gap-2 flex-shrink-0" onClick={e => cartItem && e.stopPropagation()}>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(product.price, storeSettings)}
                </span>
                {cartItem && updateQuantity ? (
                    <div className="flex items-center bg-slate-100 dark:bg-white/10 rounded-full p-0.5 gap-0.5">
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity - step)}
                            className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all shadow-sm">
                            <MinusIcon className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                            {cartItem.quantity}
                        </span>
                        <button onClick={() => updateQuantity(product.id, cartItem.quantity + step)}
                            className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-bold text-sm flex items-center justify-center active:scale-90 transition-all shadow-sm">
                            <PlusIcon className="w-2.5 h-2.5" />
                        </button>
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-600 text-slate-500 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm">
                        <PlusIcon className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Mobile Variant ───────────────────────────────────────────────────────────
const MobileCard: React.FC<ProductCardProps> = ({ product, cartItem, storeSettings, addToCart }) => {
    const numericStock = parseFloat(String((product as any).stock)) || 0;
    const isSoldOut = numericStock === 0;
    const [isTapping, setIsTapping] = React.useState(false);

    const handleTap = () => {
        if (isSoldOut) return;
        setIsTapping(true);
        addToCart(product);
        setTimeout(() => setIsTapping(false), 180);
    };

    return (
        <button
            onClick={handleTap}
            disabled={isSoldOut}
            className={`
                relative flex flex-col bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] border overflow-hidden text-left w-full h-full
                transition-transform duration-200 active:scale-[0.94]
                ${isSoldOut ? 'opacity-50 grayscale' : ''}
                ${isTapping ? 'scale-[0.94] border-indigo-500 shadow-lg' : cartItem ? 'border-indigo-500 dark:border-indigo-400 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200/50 dark:border-white/5 shadow-sm'}
            `}
        >
            <div className="aspect-square bg-slate-100 dark:bg-slate-900/60 relative overflow-hidden">
                {product.imageUrls?.[0] ? (
                    <img src={buildAssetUrl(product.imageUrls[0])} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCartIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    </div>
                )}
                {cartItem && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-1 ring-white dark:ring-slate-800 tabular-nums">
                        {cartItem.quantity}
                    </div>
                )}
                {isSoldOut && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center">
                        <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">SOLD</span>
                    </div>
                )}
            </div>
            <div className="p-2 flex-1 flex flex-col justify-between">
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                    {product.name}
                </p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                    {formatCurrency(product.price, storeSettings)}
                </p>
            </div>
        </button>
    );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export const ProductCard: React.FC<ProductCardProps> = (props) => {
    if (props.variant === 'grid') return <GridCard {...props} />;
    if (props.variant === 'list') return <ListCard {...props} />;
    if (props.variant === 'mobile') return <MobileCard {...props} />;
    return null;
};
