import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, StoreSettings, User } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { asNumber, stockStatus } from './stockStatus';
import Logo from '../../assets/logo.png';

interface InventoryMobileShellProps {
    products: Product[]; // already filtered + sorted
    categories: Category[];
    storeSettings: StoreSettings;
    user: User;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    categoryFilter: string; // 'all' or category id (accepted for API parity)
    setCategoryFilter: (id: string) => void;
    sortOrder: 'asc' | 'desc';
    onToggleSort: () => void;
    onSelectProduct: (product: Product) => void;
    selectedProductId?: string | null;
    onAddProduct: () => void;
    onScan: () => void;
    canManage: boolean;
    isLoading: boolean;
    /** When rendered inside the standalone Inventory app (which already has a top
     *  bar), hide this shell's brand row so there's only one mobile header. */
    embedded?: boolean;
}

/**
 * Minimal Velocity product card (mobile). Flat surface, 1px hairline, navy
 * border when selected, one quiet status chip — mirrors the desktop list row.
 * Stock-health logic comes from the shared `stockStatus` helper.
 */
const ProductCard: React.FC<{
    product: Product;
    categoryName: string;
    storeSettings: StoreSettings;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ product, categoryName, storeSettings, isSelected, onSelect }) => {
    const stock = asNumber(product.stock);
    const status = stockStatus(product, storeSettings);
    const unit = product.unitOfMeasure === 'kg' ? 'kg' : 'units';

    const pill = status.key === 'out'
        ? 'bg-danger-muted text-danger'
        : status.key === 'low'
            ? 'bg-warning-muted text-warning'
            : 'bg-success-muted text-primary';
    const dot = status.key === 'out' ? 'bg-danger' : status.key === 'low' ? 'bg-warning' : 'bg-success';

    return (
        <article
            onClick={onSelect}
            className={`bg-surface rounded-lg p-4 cursor-pointer active:scale-[0.99] transition-transform ${isSelected ? 'border-2 border-primary' : 'border border-brand-border'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-base text-brand-text truncate">{product.name}</h3>
                    <p className="mt-0.5 text-xs text-brand-text-muted truncate">{categoryName} · {product.sku || 'N/A'}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {status.label}
                </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
                <p className="text-xs text-brand-text-muted tabular-nums">{stock} {unit} in stock</p>
                <p className="text-lg font-bold text-brand-text tabular-nums">{formatCurrency(product.price, storeSettings)}</p>
            </div>
        </article>
    );
};

export const InventoryMobileShell: React.FC<InventoryMobileShellProps> = ({
    products,
    categories,
    storeSettings,
    user,
    searchTerm,
    setSearchTerm,
    sortOrder,
    onToggleSort,
    onSelectProduct,
    selectedProductId,
    onAddProduct,
    onScan,
    canManage,
    isLoading,
    embedded = false,
}) => {
    const navigate = useNavigate();

    const categoryName = (id?: string) => (id ? (categories.find(c => c.id === id)?.name || 'Uncategorized') : 'Uncategorized');

    const initials = (user?.name || user?.email || 'U')
        .replace(/[^a-zA-Z ]/g, '').trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';

    return (
        <div className="md:hidden flex flex-col flex-1 min-h-0 bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-surface border-b border-brand-border px-4 py-3 flex flex-col gap-3">
                {!embedded && (
                    <div className="flex items-center justify-between">
                        <img src={Logo} alt="SalePilot" className="h-8 w-auto object-contain" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/notify')}
                                className="relative p-2 text-brand-text-muted rounded-full hover:bg-surface-variant active:scale-90 transition-transform"
                                aria-label="Notifications"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            </button>
                            <div className="w-8 h-8 rounded-full bg-success-muted text-primary flex items-center justify-center text-xs font-bold">
                                {initials}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search (with inline scan) + Add — mirrors the desktop toolbar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center h-11 px-3 rounded-lg bg-surface-variant border-2 border-transparent transition-colors focus-within:bg-surface focus-within:border-secondary">
                    <svg className="w-4 h-4 text-brand-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products or SKUs..."
                        aria-label="Search products"
                        className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm mx-2 text-brand-text placeholder:text-brand-text-muted"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-brand-text-muted active:scale-90 transition"
                            aria-label="Clear search"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                    <span className="shrink-0 w-px h-5 bg-brand-border mx-1" />
                    <button
                        type="button"
                        onClick={onScan}
                        className="shrink-0 -mr-1 w-7 h-7 flex items-center justify-center rounded-md text-brand-text-muted active:scale-90 transition"
                        aria-label="Scan barcode"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V6a2 2 0 0 1 2-2h2" /><path d="M17 4h2a2 2 0 0 1 2 2v2" /><path d="M21 16v2a2 2 0 0 1-2 2h-2" /><path d="M7 20H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg>
                        </button>
                    </div>
                    {canManage && (
                        <button
                            onClick={onAddProduct}
                            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-primary text-white active:scale-95 transition-transform"
                            aria-label="Add product"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        </button>
                    )}
                </div>
            </header>

            {/* List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">{products.length} {products.length === 1 ? 'item' : 'items'}</h2>
                    <button
                        onClick={onToggleSort}
                        className="p-1.5 text-brand-text-muted bg-surface border border-brand-border rounded-lg active:scale-95 transition-transform"
                        aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        title={`Sorted ${sortOrder === 'asc' ? 'A–Z' : 'Z–A'}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sortOrder === 'desc' ? 'rotate-180' : ''}><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
                    </button>
                </div>

                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-surface rounded-lg border border-brand-border h-[96px] animate-pulse" />
                    ))
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-brand-text-muted">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.27 6.96 8.73 5.05 8.73-5.05" /><path d="M12 22.08V12" /></svg>
                        <p className="text-sm font-semibold text-brand-text">No products found</p>
                        <p className="text-xs mt-1">{searchTerm ? `No match for “${searchTerm}”` : 'Add your first product to get started'}</p>
                    </div>
                ) : (
                    products.map(p => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            categoryName={categoryName(p.categoryId)}
                            storeSettings={storeSettings}
                            isSelected={selectedProductId === p.id}
                            onSelect={() => onSelectProduct(p)}
                        />
                    ))
                )}
            </main>

        </div>
    );
};

export default InventoryMobileShell;
