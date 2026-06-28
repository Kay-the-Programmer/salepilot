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
        <header className="flex-none px-4 sm:px-6 h-16 bg-surface border-b border-brand-border flex items-center gap-3 sticky top-0 z-30 w-full">
            {onBack && (
                <button
                    onClick={onBack}
                    className="md:hidden shrink-0 w-9 h-9 -ml-1 flex items-center justify-center rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
            )}
            <div className="min-w-0">
                <h1 className="text-base md:text-lg font-bold text-brand-text truncate leading-tight">
                    {product.name}
                </h1>
                <p className="text-[11px] text-brand-text-muted truncate">SKU: {product.sku || 'N/A'}</p>
            </div>
        </header>
    );
};

export default ProductDetailHeader;
