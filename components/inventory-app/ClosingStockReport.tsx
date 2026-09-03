import React, { useMemo, useState } from 'react';
import { Product, Category, StoreSettings, User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney } from '../crm/crmModel';
import {
    buildClosingStockReport,
    buildClosingStockCsv,
    downloadClosingStockCsv,
} from './closingStockModel';
import { generateClosingStockPDF } from '../../utils/pdfExport';

interface ClosingStockReportProps {
    products: Product[];
    categories: Category[];
    storeSettings?: StoreSettings | null;
    user: User;
    onViewItems?: () => void;
    onNotify?: (msg: string) => void;
}

type SortField = 'costValue' | 'retailValue' | 'stock' | 'name' | 'margin';
type SortDirection = 'asc' | 'desc';

export const ClosingStockReport: React.FC<ClosingStockReportProps> = ({
    products,
    categories,
    storeSettings,
    user,
    onViewItems,
    onNotify,
}) => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [hideZeroStock, setHideZeroStock] = useState(false);
    const [sortBy, setSortBy] = useState<SortField>('costValue');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');
    const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(true);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Compute the master closing stock report data
    const summary = useMemo(
        () => buildClosingStockReport(products, categories, storeSettings),
        [products, categories, storeSettings]
    );

    // Filter and sort items for the interactive table
    const filteredItems = useMemo(() => {
        return summary.items.filter(item => {
            if (hideZeroStock && item.stock <= 0) return false;

            if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) {
                return false;
            }

            if (statusFilter !== 'all') {
                if (statusFilter === 'missing_cost') {
                    if (item.hasCostPrice) return false;
                } else if (item.status !== statusFilter) {
                    return false;
                }
            }

            if (search.trim()) {
                const q = search.toLowerCase().trim();
                const matchesName = item.name.toLowerCase().includes(q);
                const matchesSku = item.sku.toLowerCase().includes(q);
                const matchesBarcode = item.barcode?.toLowerCase().includes(q);
                const matchesCat = item.categoryName.toLowerCase().includes(q);
                if (!matchesName && !matchesSku && !matchesBarcode && !matchesCat) return false;
            }

            return true;
        }).sort((a, b) => {
            let res = 0;
            switch (sortBy) {
                case 'costValue':
                    res = a.totalCostValue - b.totalCostValue;
                    break;
                case 'retailValue':
                    res = a.totalRetailValue - b.totalRetailValue;
                    break;
                case 'stock':
                    res = a.stock - b.stock;
                    break;
                case 'margin':
                    res = a.marginPct - b.marginPct;
                    break;
                case 'name':
                    res = a.name.localeCompare(b.name);
                    break;
            }
            return sortDir === 'desc' ? -res : res;
        });
    }, [summary.items, hideZeroStock, categoryFilter, statusFilter, search, sortBy, sortDir]);

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const handleExportCsv = () => {
        const csvContent = buildClosingStockCsv(summary, storeSettings);
        const dateStamp = new Date().toISOString().slice(0, 10);
        downloadClosingStockCsv(`salepilot-closing-stock-${dateStamp}.csv`, csvContent);
        onNotify?.('Closing Stock CSV exported');
    };

    const handleExportPdf = async () => {
        if (isExportingPdf) return;
        setIsExportingPdf(true);
        try {
            await generateClosingStockPDF(summary, storeSettings || ({} as StoreSettings), user);
            onNotify?.('Closing Stock PDF generated');
        } catch (err: any) {
            console.error('Failed to generate closing stock PDF:', err);
            onNotify?.(err.message || 'Failed to generate PDF');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formattedDate = summary.generatedAt.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    const formattedTime = summary.generatedAt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <main className="crm-main crm-section-fade closing-stock-root">
            {/* Printable Report Header (only visible on print) */}
            <div className="closing-print-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#002b6b' }}>
                            {storeSettings?.name || 'SalePilot'} — Closing Stock Valuation Report
                        </h1>
                        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>
                            Generated on {formattedDate} at {formattedTime} by {user?.name} ({user?.role})
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#002b6b' }}>
                            Total Valuation: {formatMoney(summary.totalCostValue, storeSettings)}
                        </span>
                        <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>
                            {summary.totalUnits.toLocaleString()} units across {summary.totalSkus} SKUs
                        </p>
                    </div>
                </div>
            </div>

            {/* Interactive Page Head */}
            <div className="crm-pagehead closing-report-head" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, background: 'var(--c-primary-fixed)', color: 'var(--c-on-primary-fixed)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Valuation & Audit
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--c-outline)' }}>
                            As of {formattedDate}, {formattedTime}
                        </span>
                    </div>
                    <h2 className="crm-pagehead__title">Closing Stock Report</h2>
                    <p className="crm-pagehead__sub">
                        End-of-period inventory valuation, balance sheet asset totals, and physical audit breakdown.
                    </p>
                </div>

                <div className="closing-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="crm-btn crm-btn--outline"
                        onClick={handlePrint}
                        title="Print this closing stock report"
                    >
                        <Icon name="print" size={18} /> Print
                    </button>
                    <button
                        type="button"
                        className="crm-btn crm-btn--outline"
                        onClick={handleExportCsv}
                        title="Export spreadsheet CSV"
                    >
                        <Icon name="table_view" size={18} /> Export CSV
                    </button>
                    <button
                        type="button"
                        className="crm-btn crm-btn--primary"
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        title="Export official branded PDF with signatures"
                    >
                        <Icon name="picture_as_pdf" size={18} />
                        {isExportingPdf ? 'Exporting PDF…' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Bento Valuation Metrics */}
            <div className="inv-metrics closing-metrics">
                {/* Metric 1: Cost Valuation */}
                <div className="inv-metric" style={{ borderColor: 'rgba(0, 43, 107, 0.15)' }}>
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon inv-metric__icon--p">
                            <Icon name="account_balance_wallet" size={24} />
                        </span>
                        <span className="inv-metric__chip inv-metric__chip--p">
                            Balance Sheet Asset
                        </span>
                    </div>
                    <div>
                        <p className="inv-metric__label">Closing Stock Value (at Cost)</p>
                        <p className="inv-metric__value" style={{ color: 'var(--c-primary)' }}>
                            {formatMoney(summary.totalCostValue, storeSettings)}
                        </p>
                        <p className="inv-metric__sub">
                            Total inventory capital tied up on shelves
                        </p>
                    </div>
                </div>

                {/* Metric 2: Retail Valuation */}
                <div className="inv-metric">
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon inv-metric__icon--s">
                            <Icon name="storefront" size={24} />
                        </span>
                        <span className="inv-metric__chip inv-metric__chip--s">
                            Expected Sales
                        </span>
                    </div>
                    <div>
                        <p className="inv-metric__label">Expected Retail Turnover</p>
                        <p className="inv-metric__value">
                            {formatMoney(summary.totalRetailValue, storeSettings)}
                        </p>
                        <p className="inv-metric__sub">
                            Gross turnover if all stock sells at list price
                        </p>
                    </div>
                </div>

                {/* Metric 3: Potential Profit & Margin */}
                <div className="inv-metric">
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon" style={{ background: 'rgba(46, 125, 50, 0.12)', color: '#2e7d32' }}>
                            <Icon name="trending_up" size={24} />
                        </span>
                        <span className="inv-metric__chip" style={{ background: 'rgba(46, 125, 50, 0.16)', color: '#1b5e20' }}>
                            {summary.overallMarginPct.toFixed(1)}% Margin
                        </span>
                    </div>
                    <div>
                        <p className="inv-metric__label">Potential Gross Profit</p>
                        <p className="inv-metric__value" style={{ color: '#2e7d32' }}>
                            {formatMoney(summary.potentialProfit, storeSettings)}
                        </p>
                        <p className="inv-metric__sub">
                            Shelf margin ({summary.totalUnits.toLocaleString()} total units on hand)
                        </p>
                    </div>
                </div>
            </div>

            {/* Missing Cost Notice (if any) */}
            {summary.missingCostCount > 0 && (
                <div className="inv-pending" style={{ borderColor: '#f1c40f', background: 'rgba(255, 248, 225, 0.7)' }}>
                    <span style={{ color: '#b78103', display: 'inline-flex' }}>
                        <Icon name="warning_amber" size={22} fill={1} />
                    </span>
                    <p className="inv-pending__text" style={{ color: '#7a5200' }}>
                        <strong>{summary.missingCostCount}</strong> product{summary.missingCostCount === 1 ? '' : 's'} have no cost price recorded. They currently contribute 0 to the balance sheet valuation.
                    </p>
                    {onViewItems && (
                        <button
                            type="button"
                            className="crm-btn crm-btn--tonal"
                            style={{ padding: '4px 12px', fontSize: 12, height: 28 }}
                            onClick={onViewItems}
                        >
                            Set Cost Prices
                        </button>
                    )}
                </div>
            )}

            {/* Negative Stock Warning */}
            {summary.negativeStockCount > 0 && (
                <div className="inv-pending" style={{ borderColor: 'var(--c-error)', background: 'var(--c-error-container)' }}>
                    <span style={{ color: 'var(--c-error)', display: 'inline-flex' }}>
                        <Icon name="error_outline" size={22} fill={1} />
                    </span>
                    <p className="inv-pending__text" style={{ color: 'var(--c-on-error-container)' }}>
                        <strong>{summary.negativeStockCount}</strong> product{summary.negativeStockCount === 1 ? '' : 's'} have negative stock levels (oversold). Perform a stock count to reconcile.
                    </p>
                </div>
            )}

            {/* Category Breakdown (Collapsible) */}
            {summary.categories.length > 0 && (
                <div className="crm-panel closing-category-panel" style={{ marginBottom: 24 }}>
                    <div
                        className="crm-panel__head"
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="pie_chart" size={20} />
                            <h3 className="crm-panel__title" style={{ margin: 0 }}>Category Valuation Breakdown</h3>
                            <span style={{ fontSize: 12, color: 'var(--c-outline)' }}>
                                ({summary.categories.length} categories)
                            </span>
                        </div>
                        <button
                            type="button"
                            className="crm-btn crm-btn--ghost"
                            style={{ padding: 4, height: 28 }}
                            aria-label="Toggle Category Breakdown"
                        >
                            <Icon name={showCategoryBreakdown ? 'expand_less' : 'expand_more'} size={20} />
                        </button>
                    </div>

                    {showCategoryBreakdown && (
                        <div className="closing-cat-grid" style={{ padding: '0 20px 20px' }}>
                            <div className="closing-cat-table-wrap">
                                <table className="closing-table closing-table--compact">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th style={{ textAlign: 'center' }}>SKUs</th>
                                            <th style={{ textAlign: 'center' }}>Units</th>
                                            <th style={{ textAlign: 'right' }}>Cost Value</th>
                                            <th style={{ textAlign: 'right' }}>Retail Value</th>
                                            <th style={{ textAlign: 'right' }}>Margin</th>
                                            <th style={{ textAlign: 'right' }}>Share of Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.categories.map(cat => (
                                            <tr key={cat.id}>
                                                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                                <td style={{ textAlign: 'center' }}>{cat.skuCount}</td>
                                                <td style={{ textAlign: 'center' }}>{cat.totalUnits.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                    {formatMoney(cat.totalCostValue, storeSettings)}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {formatMoney(cat.totalRetailValue, storeSettings)}
                                                </td>
                                                <td style={{ textAlign: 'right', color: '#2e7d32' }}>
                                                    {formatMoney(cat.potentialProfit, storeSettings)}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 700 }}>{cat.costSharePct.toFixed(1)}%</span>
                                                        <div style={{ width: 44, height: 6, borderRadius: 999, background: 'var(--c-surface-variant)', overflow: 'hidden' }}>
                                                            <div style={{ width: `${Math.min(100, cat.costSharePct)}%`, height: '100%', background: 'var(--c-primary)', borderRadius: 999 }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Interactive Filters & Search */}
            <div className="crm-panel closing-filter-panel" style={{ marginBottom: 20, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Search box */}
                    <div className="closing-search-box" style={{ flex: '1 1 240px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-outline)', pointerEvents: 'none' }}>
                            <Icon name="search" size={18} />
                        </span>
                        <input
                            type="search"
                            className="closing-input"
                            style={{ paddingLeft: 36, width: '100%' }}
                            placeholder="Filter by product name, SKU or barcode…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div style={{ minWidth: 160 }}>
                        <select
                            className="closing-select"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div style={{ minWidth: 150 }}>
                        <select
                            className="closing-select"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Stock Statuses</option>
                            <option value="in_stock">In Stock ({summary.inStockCount})</option>
                            <option value="low_stock">Low Stock ({summary.lowStockCount})</option>
                            <option value="out_of_stock">Out of Stock ({summary.outOfStockCount})</option>
                            {summary.negativeStockCount > 0 && (
                                <option value="negative">Negative Stock ({summary.negativeStockCount})</option>
                            )}
                            {summary.missingCostCount > 0 && (
                                <option value="missing_cost">Missing Cost Price ({summary.missingCostCount})</option>
                            )}
                        </select>
                    </div>

                    {/* Hide Zero Stock Checkbox */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                            type="checkbox"
                            checked={hideZeroStock}
                            onChange={e => setHideZeroStock(e.target.checked)}
                            style={{ accentColor: 'var(--c-primary)' }}
                        />
                        Hide 0 Stock
                    </label>

                    {/* Active count badge */}
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--c-outline)', fontWeight: 600 }}>
                        Showing {filteredItems.length} of {summary.items.length} items
                    </div>
                </div>
            </div>

            {/* Itemized Closing Stock Table */}
            <div className="crm-panel closing-table-panel">
                <div className="crm-panel__head" style={{ borderBottom: '1px solid var(--c-outline-variant)' }}>
                    <div>
                        <h3 className="crm-panel__title" style={{ margin: 0 }}>Itemized Inventory Valuation</h3>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--c-on-surface-variant)' }}>
                            Click column headers to sort by Product, Cost Value, Stock Units, or Margin
                        </p>
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="crm-empty" style={{ padding: '56px 16px' }}>
                        <Icon name="inventory_2" size={44} />
                        <p className="crm-empty__title" style={{ marginTop: 8 }}>No matching items</p>
                        <p className="crm-empty__text">Adjust your search or filter options to display inventory items.</p>
                    </div>
                ) : (
                    <div className="closing-table-wrap">
                        <table className="closing-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('name')} className="is-sortable">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            Product {sortBy === 'name' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={14} />}
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('stock')} className="is-sortable" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            Closing Stock {sortBy === 'stock' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={14} />}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'right' }}>Unit Cost</th>
                                    <th onClick={() => handleSort('costValue')} className="is-sortable" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            Cost Value {sortBy === 'costValue' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={14} />}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'right' }}>Unit Retail</th>
                                    <th onClick={() => handleSort('margin')} className="is-sortable" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                            Gross Margin {sortBy === 'margin' && <Icon name={sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'} size={14} />}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.id} className={item.stock <= 0 ? 'is-empty-row' : ''}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span className="inv-thumb" style={{ width: 36, height: 36, borderRadius: 8 }}>
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} />
                                                    ) : (
                                                        <Icon name="inventory_2" size={18} />
                                                    )}
                                                </span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--c-on-bg)' }}>
                                                        {item.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                            {item.stock.toLocaleString()}{' '}
                                            <small style={{ fontWeight: 400, color: 'var(--c-outline)' }}>{item.unitOfMeasure}</small>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {item.hasCostPrice ? (
                                                formatMoney(item.costPrice, storeSettings)
                                            ) : (
                                                <span className="closing-missing-chip">Missing</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-primary)' }}>
                                            {formatMoney(item.totalCostValue, storeSettings)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {formatMoney(item.retailPrice, storeSettings)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600, color: item.potentialProfit >= 0 ? '#2e7d32' : 'var(--c-error)' }}>
                                                {formatMoney(item.potentialProfit, storeSettings)}
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--c-outline)' }}>
                                                {item.marginPct.toFixed(1)}%
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`inv-stock-pill ${
                                                item.status === 'in_stock'
                                                    ? 'closing-pill--in'
                                                    : item.status === 'low_stock'
                                                        ? 'inv-stock-pill--low'
                                                        : item.status === 'negative'
                                                            ? 'closing-pill--negative'
                                                            : 'inv-stock-pill--out'
                                            }`}>
                                                {item.status === 'in_stock'
                                                    ? 'In Stock'
                                                    : item.status === 'low_stock'
                                                        ? 'Low'
                                                        : item.status === 'negative'
                                                            ? 'Negative'
                                                            : 'Out'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Audit Verification & Manager Sign-Off Card */}
            <div className="crm-panel closing-audit-panel" style={{ marginTop: 24, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Icon name="verified_user" size={22} fill={1} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--c-on-bg)' }}>
                        Stock Count Verification & Management Sign-Off
                    </h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--c-on-surface-variant)', margin: '0 0 20px' }}>
                    This closing stock report constitutes a formal inventory count record. Verified physical stock counts can be submitted below for tax, auditor, and financial reconciliation.
                </p>

                <div className="closing-signatures-grid">
                    <div className="closing-signature-block">
                        <span className="closing-signature-label">Physical Count Verified By</span>
                        <div className="closing-signature-line" />
                        <div className="closing-signature-meta">
                            <span>Auditor / Inventory Specialist Name</span>
                            <span>Date: _______________</span>
                        </div>
                    </div>

                    <div className="closing-signature-block">
                        <span className="closing-signature-label">Store Manager / Owner Approval</span>
                        <div className="closing-signature-line" />
                        <div className="closing-signature-meta">
                            <span>{user?.name || 'Store Manager'} ({user?.role || 'Admin'})</span>
                            <span>Date: {formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ClosingStockReport;
