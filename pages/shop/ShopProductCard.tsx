import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlinePhoto, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi2';
import { buildAssetUrl } from '../../services/api';
import { Product } from '../../types';

interface QuickAdd {
    /** Current quantity of this product in the cart (0 = not in cart). */
    qty: number;
    onAdd: () => void;
    onSetQty: (qty: number) => void;
}

interface ShopProductCardProps {
    product: Product & { storeName?: string };
    storeId: string;
    formatPrice: (price: number) => string;
    /** Marketplace cards show which store sells the item. */
    showStore?: boolean;
    /** When provided, the card gets a one-tap add button / inline stepper. */
    quickAdd?: QuickAdd;
}

/**
 * Velocity product tile: image on a subtle tint, price anchored bottom, and —
 * in storefront context — a one-tap add button that becomes a stepper once
 * the item is in the cart, so shoppers never have to leave the grid.
 */
const ShopProductCard: React.FC<ShopProductCardProps> = ({ product, storeId, formatPrice, showStore, quickAdd }) => {
    const outOfStock = product.stock <= 0;
    const lowStock = !outOfStock && product.stock > 0 && product.stock <= 5;
    const atMax = !!quickAdd && quickAdd.qty >= product.stock;

    // Keep taps on the quick-add controls from following the card link.
    const guard = (fn: () => void) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
    };

    return (
        <Link
            to={`/shop/${storeId}/product/${product.id}`}
            className="group flex flex-col bg-surface border border-brand-border rounded-lg overflow-hidden transition-all duration-200 hover:border-sp-navy hover:shadow-md active:scale-[0.99]"
        >
            {/* Image */}
            <div className="relative aspect-square w-full bg-warm-100 overflow-hidden">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                    <img
                        src={buildAssetUrl(product.imageUrls[0])}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-warm-400">
                        <HiOutlinePhoto className="w-10 h-10" />
                    </div>
                )}
                {outOfStock && (
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-danger/15 text-danger text-[11px] font-bold backdrop-blur-sm">
                        Out of stock
                    </span>
                )}
                {lowStock && (
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-warning/15 text-amber-700 text-[11px] font-bold backdrop-blur-sm">
                        Only {product.stock} left
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col p-3.5">
                {showStore && product.storeName && (
                    <p className="text-[11px] font-semibold text-sp-navy mb-0.5 truncate">{product.storeName}</p>
                )}
                <h3 className="text-sm font-semibold text-brand-text leading-snug line-clamp-2">{product.name}</h3>
                {product.brand && (
                    <p className="text-xs text-brand-text-muted mt-0.5 truncate">{product.brand}</p>
                )}

                {/* Price + quick add */}
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-sp-navy tracking-tight truncate">
                        {formatPrice(product.price)}
                    </span>

                    {quickAdd && !outOfStock && (
                        quickAdd.qty === 0 ? (
                            <button
                                onClick={guard(quickAdd.onAdd)}
                                aria-label={`Add ${product.name} to cart`}
                                className="w-11 h-11 flex-none rounded-full bg-sp-amber text-white flex items-center justify-center shadow-sm hover:brightness-95 transition-all active:scale-90"
                            >
                                <HiOutlinePlus className="w-5 h-5" />
                            </button>
                        ) : (
                            <span
                                className="flex-none flex items-center rounded-full bg-sp-navy text-white overflow-hidden"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                            >
                                <button
                                    onClick={guard(() => quickAdd.onSetQty(quickAdd.qty - 1))}
                                    aria-label={`Remove one ${product.name}`}
                                    className="w-10 h-11 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90"
                                >
                                    <HiOutlineMinus className="w-4 h-4" />
                                </button>
                                <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums" aria-live="polite">
                                    {quickAdd.qty}
                                </span>
                                <button
                                    onClick={guard(() => quickAdd.onSetQty(quickAdd.qty + 1))}
                                    disabled={atMax}
                                    aria-label={`Add one more ${product.name}`}
                                    className="w-10 h-11 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90 disabled:opacity-40"
                                >
                                    <HiOutlinePlus className="w-4 h-4" />
                                </button>
                            </span>
                        )
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ShopProductCard;
