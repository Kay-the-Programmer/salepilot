import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, StoreSettings, User } from '../../types';
import { formatCurrency } from '../../utils/currency';
import Logo from '../../assets/logo.png';

interface InventoryMobileShellProps {
    products: Product[]; // already filtered + sorted
    categories: Category[];
    storeSettings: StoreSettings;
    user: User;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    categoryFilter: string; // 'all' or category id
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

const asNumber = (val: any) => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : 0;
};

const tone = (product: Product, storeSettings: StoreSettings) => {
    const stock = asNumber(product.stock);
    const reorder = product.reorderPoint ?? storeSettings.lowStockThreshold;
    if (stock <= 0) return 'out' as const;
    if (stock <= reorder) return 'low' as const;
    return 'ok' as const;
};

const ProductCard: React.FC<{
    product: Product;
    categoryName: string;
    storeSettings: StoreSettings;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ product, categoryName, storeSettings, isSelected, onSelect }) => {
    const stock = asNumber(product.stock);
    const t = tone(product, storeSettings);
    const unit = product.unitOfMeasure === 'kg' ? 'kg' : 'Units';

    const badge = t === 'out'
        ? 'bg-danger-muted text-danger border-danger/20'
        : t === 'low'
            ? 'bg-warning-muted text-warning border-warning/20'
            : 'bg-success-muted text-primary border-primary/15';
    const dot = t === 'out' ? 'bg-danger' : t === 'low' ? 'bg-warning' : 'bg-primary';
    const statusColor = t === 'out' ? 'text-danger' : t === 'low' ? 'text-warning' : 'text-primary';
    const statusLabel = t === 'out' ? 'Out of Stock' : t === 'low' ? 'Low Stock' : 'Healthy';

    return (
        <article
            onClick={onSelect}
            className={`bg-white dark:bg-slate-900/60 rounded-2xl p-4 shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform ${isSelected ? 'border-2 border-primary' : 'border border-slate-200 dark:border-white/5'}`}
        >
            <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{product.name}</h3>
                    <p className="text-xs text-slate-400 uppercase font-medium truncate">{categoryName} • {product.sku || 'N/A'}</p>
                </div>
                <div className={`flex-none flex items-center gap-1.5 px-2 py-1 rounded-full border ${badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className="text-[10px] font-bold uppercase whitespace-nowrap tabular-nums">{stock} {unit}</span>
                </div>
            </div>
            <div className="flex items-end justify-between mt-4">
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Stock Status</div>
                    <div className={`flex items-center gap-1.5 font-semibold text-sm ${statusColor}`}>
                        {t === 'ok' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        )}
                        {statusLabel}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Retail Price</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(product.price, storeSettings)}</div>
                </div>
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
    categoryFilter,
    setCategoryFilter,
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

    const topCategories = useMemo(() => categories.filter(c => c.parentId === null || c.parentId === undefined), [categories]);
    const categoryName = (id?: string) => (id ? (categories.find(c => c.id === id)?.name || 'Uncategorized') : 'Uncategorized');

    const initials = (user?.name || user?.email || 'U')
        .replace(/[^a-zA-Z ]/g, '').trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';

    return (
        <div className="md:hidden flex flex-col flex-1 min-h-0 bg-surface">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5 px-4 py-3 flex flex-col gap-3">
                {!embedded && (
                    <div className="flex items-center justify-between">
                        <img src={Logo} alt="SalePilot" className="h-8 w-auto object-contain" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-transform"
                                aria-label="Notifications"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            </button>
                            <div className="w-8 h-8 rounded-full bg-success-muted text-primary flex items-center justify-center text-xs font-bold border border-primary/15">
                                {initials}
                            </div>
                        </div>
                    </div>
                )}
                {/* Search */}
                <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search products or SKUs..."
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary"
                    />
                </div>
            </header>

            {/* Category filters */}
            <section className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar flex-none">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                        All
                    </button>
                    {topCategories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setCategoryFilter(c.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === c.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Inventory List ({products.length})</h2>
                    <button
                        onClick={onToggleSort}
                        className="p-1.5 text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg active:scale-95 transition-transform"
                        aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        title={`Sorted ${sortOrder === 'asc' ? 'A–Z' : 'Z–A'}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={sortOrder === 'desc' ? 'rotate-180' : ''}><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></svg>
                    </button>
                </div>

                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 h-[116px] animate-pulse" />
                    ))
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.27 6.96 8.73 5.05 8.73-5.05" /><path d="M12 22.08V12" /></svg>
                        <p className="text-sm font-semibold text-slate-500">No products found</p>
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

            {/* Floating actions */}
            {canManage && (
                <div className="fixed bottom-24 right-6 z-40 flex flex-col items-center gap-3">
                    <button
                        onClick={onScan}
                        className="w-11 h-11 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg border border-slate-100 dark:border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Scan barcode"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg>
                    </button>
                    <button
                        onClick={onAddProduct}
                        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Add product"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>
            )}

        </div>
    );
};

export default InventoryMobileShell;
