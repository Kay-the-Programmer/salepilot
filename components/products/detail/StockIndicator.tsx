import React from 'react';
import { Product, StoreSettings } from '@/types.ts';

interface StockIndicatorProps {
    product: Product;
    storeSettings: StoreSettings;
}

const StockIndicator: React.FC<StockIndicatorProps> = ({ product, storeSettings }) => {
    const lowStockThreshold = product.reorderPoint || storeSettings.lowStockThreshold;
    const isLowStock = product.stock <= lowStockThreshold;
    const isOutOfStock = product.stock === 0;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {product.stock} <span className="text-base sm:text-lg text-slate-500 dark:text-slate-400">{product.unitOfMeasure || 'units'}</span>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Available stock</div>
                </div>
                {isLowStock && (
                    <span className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg self-start sm:self-auto ${isOutOfStock ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {isOutOfStock ? 'Out of stock' : 'Low stock'}
                    </span>
                )}
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{
                            width: `${Math.min(100, (product.stock / (Math.max(lowStockThreshold * 2, product.stock || 1))) * 100)}%`
                        }}
                    />
                </div>
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>Reorder: {lowStockThreshold}</span>
                    <span>Safety: {product.safetyStock || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default StockIndicator;
