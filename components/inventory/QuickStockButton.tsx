import React from 'react';

/**
 * "+ Stock" on a product row — opens the stock sheet straight from the list,
 * so a delivery is this tap, the amount, and Save. Stops the click short of
 * the row, which would otherwise open the product page.
 */
const QuickStockButton: React.FC<{
    productName: string;
    onClick: () => void;
    className?: string;
}> = ({ productName, onClick, className = '' }) => (
    <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
        aria-label={`Change stock for ${productName}`}
        title="Receive or adjust stock"
        className={`shrink-0 inline-flex items-center justify-center gap-1 h-9 min-w-[44px] px-2.5 rounded-lg border border-brand-border bg-surface text-xs font-bold text-primary hover:border-primary hover:bg-primary/5 active:scale-95 transition-all ${className}`}
    >
        <span aria-hidden className="text-base leading-none">+</span>
        Stock
    </button>
);

export default QuickStockButton;
