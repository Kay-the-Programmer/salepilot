import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';
import ChevronLeftIcon from '../../icons/ChevronLeftIcon';
import ChevronRightIcon from '../../icons/ChevronRightIcon';

export interface ProductSalesRow {
    productId: string;
    name: string;
    sku: string | null;
    categoryName: string;
    grossQuantity: number;
    returnedQuantity: number;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    transactionCount: number;
}

interface ProductSalesReportProps {
    storeSettings: StoreSettings;
    /** Page-level range, YYYY-MM-DD. */
    startDate: string;
    endDate: string;
}

type SortKey = 'quantity' | 'revenue' | 'profit' | 'name' | 'transactions';

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'name', label: 'Product', align: 'left' },
    { key: 'quantity', label: 'Units Sold', align: 'right' },
    { key: 'transactions', label: 'Sales', align: 'right' },
    { key: 'revenue', label: 'Revenue', align: 'right' },
    { key: 'profit', label: 'Profit', align: 'right' },
];

/** RFC-4180 quoting — product names routinely contain commas. */
const csvCell = (value: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const PAGE_SIZES = [10, 25, 50];

export const ProductSalesReport: React.FC<ProductSalesReportProps> = ({ storeSettings, startDate, endDate }) => {
    const [rows, setRows] = useState<ProductSalesRow[] | null>(null);
    const [totals, setTotals] = useState<{ products: number; quantity: number; revenue: number; profit: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('quantity');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Sorting and filtering are server-side so they cover the whole catalogue,
    // not just the rows currently paged into view.
    const [query, setQuery] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    const fetchRows = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ startDate, endDate, sortBy, sortOrder });
            if (query) qs.set('search', query);
            const res = await api.get<{ items: ProductSalesRow[]; totals: typeof totals }>(`/reports/product-sales?${qs.toString()}`);
            setRows(res?.items || []);
            setTotals(res?.totals || null);
        } catch (err: any) {
            setError(err?.message || 'Failed to load product sales.');
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, sortBy, sortOrder, query]);

    useEffect(() => { fetchRows(); }, [fetchRows]);
    useEffect(() => { setPage(1); }, [query, sortBy, sortOrder, startDate, endDate, pageSize]);

    const pageCount = rows ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
    const visible = useMemo(
        () => (rows || []).slice((page - 1) * pageSize, page * pageSize),
        [rows, page, pageSize]
    );

    const toggleSort = (key: SortKey) => {
        if (key === sortBy) {
            setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
        } else {
            setSortBy(key);
            setSortOrder(key === 'name' ? 'asc' : 'desc');
        }
    };

    const exportCsv = () => {
        if (!rows || rows.length === 0) return;
        const headers = ['Product', 'SKU', 'Category', 'Units Sold', 'Units Returned', 'Sales', 'Revenue', 'Cost', 'Profit'];
        const body = rows.map(r => [
            r.name, r.sku || '', r.categoryName, r.quantity, r.returnedQuantity,
            r.transactionCount, r.revenue.toFixed(2), r.cost.toFixed(2), r.profit.toFixed(2),
        ]);
        const csv = [headers, ...body].map(line => line.map(csvCell).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `product_sales_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-brand-text tracking-tight">Units Sold by Product</h3>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                        {totals
                            ? `${totals.quantity.toLocaleString()} units across ${totals.products} product${totals.products === 1 ? '' : 's'} · ${formatCurrency(totals.revenue, storeSettings)}`
                            : 'Quantities are net of returns'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search product or SKU"
                        aria-label="Search products"
                        className="text-sm bg-surface text-brand-text border border-brand-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all"
                    />
                    <select
                        className="text-sm bg-surface text-brand-text border border-brand-border rounded-lg px-3 py-2 font-medium outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all cursor-pointer"
                        value={pageSize}
                        onChange={e => setPageSize(parseInt(e.target.value))}
                        aria-label="Rows per page"
                    >
                        {PAGE_SIZES.map(n => <option key={n} value={n}>{n} rows</option>)}
                    </select>
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={!rows || rows.length === 0}
                        className="text-sm font-semibold px-3 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-surface-variant/60 animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-10">
                    <p className="text-sm text-brand-text-muted mb-3">{error}</p>
                    <button type="button" onClick={fetchRows} className="text-sm font-semibold px-3 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-surface-variant transition-colors">
                        Try again
                    </button>
                </div>
            ) : !rows || rows.length === 0 ? (
                <p className="text-sm text-brand-text-muted text-center py-10">
                    {query ? `No products match “${query}” in this period.` : 'No products were sold in this period.'}
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-brand-border">
                                    {COLUMNS.map(col => (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            className={`py-2 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-text-muted ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                                            aria-sort={sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(col.key)}
                                                className="inline-flex items-center gap-1 hover:text-brand-text transition-colors"
                                            >
                                                {col.label}
                                                {sortBy === col.key && <span aria-hidden="true">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(r => (
                                    <tr key={r.productId} className="border-b border-brand-border/60 last:border-0">
                                        <td className="py-2.5 px-3">
                                            <div className="font-semibold text-brand-text truncate max-w-[280px]">{r.name}</div>
                                            <div className="text-[11px] text-brand-text-muted truncate max-w-[280px]">
                                                {r.sku || '—'} · {r.categoryName}
                                                {r.returnedQuantity > 0 && ` · ${r.returnedQuantity} returned`}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-brand-text tnum">{r.quantity.toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-right text-brand-text-muted tnum">{r.transactionCount.toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-right text-brand-text tnum">{formatCurrency(r.revenue, storeSettings)}</td>
                                        <td className="py-2.5 px-3 text-right tnum">
                                            <span className={r.profit < 0 ? 'text-red-600 dark:text-red-400' : 'text-brand-text'}>
                                                {formatCurrency(r.profit, storeSettings)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {totals && (
                                <tfoot>
                                    <tr className="border-t-2 border-brand-border">
                                        <td className="py-2.5 px-3 font-bold text-brand-text">Total</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-brand-text tnum">{totals.quantity.toLocaleString()}</td>
                                        <td className="py-2.5 px-3" />
                                        <td className="py-2.5 px-3 text-right font-bold text-brand-text tnum">{formatCurrency(totals.revenue, storeSettings)}</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-brand-text tnum">{formatCurrency(totals.profit, storeSettings)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {pageCount > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-variant text-brand-text-muted hover:bg-surface-variant/70 hover:text-brand-text transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-brand-text-muted tnum">{page} / {pageCount}</span>
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-variant text-brand-text-muted hover:bg-surface-variant/70 hover:text-brand-text transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                                disabled={page >= pageCount}
                                aria-label="Next page"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductSalesReport;
