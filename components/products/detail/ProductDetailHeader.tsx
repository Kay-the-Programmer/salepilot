import React from 'react';
import { Product } from '@/types.ts';
import ArrowLeftIcon from '@/components/icons/ArrowLeftIcon';

interface ProductDetailHeaderProps {
    product: Product;
    onBack?: () => void;
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
    product,
    onBack
}) => {
    return (
        <header className="px-4 sm:px-6 py-3 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border-b border-white/20 dark:border-white/5 flex items-center justify-between sticky top-0 z-30 w-full transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200 md:hidden active:scale-90 shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                )}
                <div className="min-w-0">
                    <h1 className="text-[16px] md:text-xl font-semibold text-brand-text tracking-tight leading-tight">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 font-medium text-[11px] text-brand-text-muted">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-tight">SKU</span>
                        <span className="tracking-wide">{product.sku || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ProductDetailHeader;
