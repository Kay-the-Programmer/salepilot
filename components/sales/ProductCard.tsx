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
import PosIcon from './PosIcon';

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

// ─── Grid Variant (salepilot_web_v2 .prodcard) ─────────────────────────────────
const GridCard: React.FC<ProductCardProps> = ({ product, cartItem, storeSettings, addToCart, onLowStockAlert }) => {
    const numericStock = parseFloat(String((product as any).stock)) || 0;
    const isSoldOut = numericStock === 0;
    const isLowStock = numericStock > 0 && numericStock <= (product.reorderPoint || storeSettings.lowStockThreshold);
    const img = product.imageUrls?.[0];

    return (
        <button
            type="button"
            onClick={() => !isSoldOut && addToCart(product)}
            disabled={isSoldOut}
            className={`prodcard${cartItem ? ' prodcard--incart' : ''}${isSoldOut ? ' prodcard--soldout' : ''}`}
        >
            <div className="prodcard__art">
                {img
                    ? <img src={buildAssetUrl(img)} alt={product.name} />
                    : <PosIcon name="inventory_2" size={40} />}
                <span className="prodcard__price tnum">{formatCurrency(product.price, storeSettings)}</span>
                {isSoldOut ? (
                    <span className="prodcard__tag prodcard__tag--soldout">Sold Out</span>
                ) : isLowStock ? (
                    <span
                        className="prodcard__tag prodcard__tag--low"
                        role="button"
                        title="Alert about low stock"
                        onClick={(e) => { e.stopPropagation(); onLowStockAlert(product); }}
                    >
                        <PosIcon name="notifications_active" size={12} fill={1} /> {numericStock} left
                    </span>
                ) : null}
            </div>

            <div className="prodcard__body">
                <h3>{product.name}</h3>
                {product.sku && <p>{product.sku}</p>}
            </div>

            {cartItem ? (
                <span className="prodcard__qty tnum">{cartItem.quantity}</span>
            ) : (
                <span className="prodcard__add">
                    <PosIcon name="add" size={20} weight={700} />
                </span>
            )}
        </button>
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
                    ? 'bg-success-muted/80 dark:bg-primary/10 border-primary dark:border-primary/50 shadow-[0_0_0_1px_rgba(0, 43, 107,0.2)]'
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
                <p className={`text-sm font-semibold truncate leading-tight ${cartItem ? 'text-primary dark:text-primary' : 'text-slate-900 dark:text-white'}`}>
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
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 group-hover:bg-primary dark:group-hover:bg-primary text-slate-500 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm">
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
                ${isTapping ? 'scale-[0.94] border-primary shadow-lg' : cartItem ? 'border-primary dark:border-primary shadow-md ring-1 ring-primary/20' : 'border-slate-200/50 dark:border-white/5 shadow-sm'}
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
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-1 ring-white dark:ring-slate-800 tabular-nums">
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
