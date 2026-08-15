import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Sale, Customer, StoreSettings, Return, User } from '../../types';
import { api } from '../../services/api';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import SaleDetailContent from './SaleDetailContent';
import ReceiptModal from './ReceiptModal';
import PosIcon from './PosIcon';
import { SnackbarType } from '../../App';
import { invalidateDashboardCache } from '../reports/reportsData';
import PeriodPicker from '../dash-app/PeriodPicker';
import { DashRange, presetRange, rangeDates, rangeDaysOf, rangeLabel, windowFor } from '../dash-app/dashboardModel';
import {
    createPdf, drawPdfHeader, drawPdfTable, drawPdfFooterAsync, savePdf,
    pdfMoney, pdfNumber, pdfFileName, loadStoreLogo, PDF_NAVY,
} from '../../utils/pdfDocument';

interface SalesHistoryViewProps {
    storeSettings: StoreSettings;
    customers: Customer[];
    onProcessReturn: (returnInfo: Return) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    /** First-run CTA: jump back to the register to make the first sale. */
    onStartSelling?: () => void;
    /** Correcting a sale's date rewrites history, so it is admin-only. */
    userRole?: User['role'];
    /** Refetch app-wide data after a sale moves between days. */
    onSaleChanged?: () => void;
}

const REASONS = ['Defective / Damaged', 'Wrong Item', 'Changed Mind', 'Other'];
const REFUND_METHODS = [
    { value: 'original_method', label: 'Original Method' },
    { value: 'cash', label: 'Cash' },
    { value: 'store_credit', label: 'Store Credit' },
];

const statusBadge = (sale: Sale): { cls: string; label: string } => {
    const rs = sale.refundStatus;
    if (rs === 'fully_refunded' || rs === 'returned') return { cls: 'refunded', label: 'Refunded' };
    if (rs === 'partially_refunded' || rs === 'partially_returned') return { cls: 'refunded', label: 'Part. Refund' };
    if (sale.paymentStatus === 'paid') return { cls: 'paid', label: 'Paid' };
    if (sale.paymentStatus === 'partially_paid') return { cls: 'partial', label: 'Part. Paid' };
    return { cls: 'unpaid', label: 'Unpaid' };
};

type ReturnLine = { quantity: number; reason: string; addToStock: boolean; name: string; price: number };

/**
 * Card title: what was sold, so the list is scannable at a glance. When a search
 * is active the matching line leads, otherwise the first line does; the rest
 * collapse into "+N more". Falls back to the transaction id for an empty cart.
 */
const cartTitle = (sale: Sale, term: string): string => {
    const cart = sale.cart || [];
    if (cart.length === 0) return sale.transactionId;
    const t = term.toLowerCase().trim();
    const idx = t ? cart.findIndex(i => (i.name || '').toLowerCase().includes(t)) : -1;
    const lead = cart[idx >= 0 ? idx : 0];
    const label = `${lead.quantity > 1 ? `${lead.quantity}× ` : ''}${lead.name || 'Item'}`;
    return cart.length > 1 ? `${label} +${cart.length - 1} more` : label;
};

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ storeSettings, customers, onProcessReturn, showSnackbar, onStartSelling, userRole, onSaleChanged }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [refundMode, setRefundMode] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Reporting period — the SAME control and window definition the Business
    // Dashboard uses, so "This Month" means one thing across the whole product.
    // Defaults to All Time, which is what this list showed before it could be
    // filtered at all.
    const [range, setRange] = useState<DashRange>(presetRange('all'));
    // Pinned instant the period resolves against; open-ended presets run to
    // "now", and re-reading the clock each render would refetch in a loop.
    const [now, setNow] = useState(() => Date.now());
    const firstRange = useRef(true);
    useEffect(() => {
        if (firstRange.current) { firstRange.current = false; return; }
        setNow(Date.now());
    }, [range]);
    const { startDate, endDate } = useMemo(() => rangeDates(range, now), [range, now]);

    const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: ReturnLine }>({});
    const [refundMethod, setRefundMethod] = useState('original_method');

    // Date correction (admin only). `dateDraft` is a YYYY-MM-DD string; null
    // means the editor is closed.
    const canEditDate = userRole === 'admin' || userRole === 'superadmin';
    const [dateDraft, setDateDraft] = useState<string | null>(null);
    const [savingDate, setSavingDate] = useState(false);

    const taxRate = storeSettings.taxRate / 100;

    // Debounced term actually sent to the server. Searching server-side is what
    // lets a product match reach past the 50 rows this view holds.
    const [query, setQuery] = useState('');
    useEffect(() => {
        const t = setTimeout(() => setQuery(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    /** The period as query params — one place, shared by the list and the export. */
    const periodQuery = useCallback(
        (extra = '') =>
            `startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` +
            `${query ? `&search=${encodeURIComponent(query)}` : ''}${extra}`,
        [startDate, endDate, query],
    );

    const [total, setTotal] = useState(0);

    const fetchSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<{ items: Sale[]; total: number }>(
                `/sales?page=1&limit=50&sortBy=date&sortOrder=desc&${periodQuery()}`,
            );
            setSales(res?.items || []);
            setTotal(Number(res?.total) || (res?.items || []).length);
        } catch (err: any) {
            try {
                // Offline: the cached rows are filtered to the same window, so
                // the list never claims to show a period it isn't showing.
                const w = windowFor(range, now);
                const all = (await dbService.getAll<Sale>('sales')).filter(s => {
                    const t = new Date(s.timestamp).getTime();
                    return !Number.isNaN(t) && t >= w.start && t < w.end;
                });
                all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setSales(all.slice(0, 50));
                setTotal(all.length);
            } catch {
                setError(err?.message || 'Failed to load sales.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [periodQuery, range, now]);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    // Reset refund builder when switching sale
    useEffect(() => {
        setItemsToReturn({});
        setRefundMethod('original_method');
        setRefundMode(false);
        setDateDraft(null);
    }, [selectedSale]);

    const toDateInput = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    /**
     * Move a sale to a different day. The sale keeps its time of day, so a
     * receipt reprint still reads sensibly; only the date changes. The server
     * moves the payment rows and the journal entry with it, so every report
     * agrees — which is why the whole list is refetched afterwards rather than
     * patched in place.
     */
    const saveDate = async () => {
        if (!selectedSale || !dateDraft || savingDate) return;
        const original = new Date(selectedSale.timestamp);
        const [y, m, d] = dateDraft.split('-').map(Number);
        const next = new Date(original);
        next.setFullYear(y, m - 1, d);

        setSavingDate(true);
        try {
            const updated = await api.patch<Sale>(`/sales/${selectedSale.transactionId}/date`, {
                timestamp: next.toISOString(),
            });
            setSelectedSale(prev => (prev ? { ...prev, timestamp: updated?.timestamp || next.toISOString() } : prev));
            setDateDraft(null);
            showSnackbar(
                `Sale moved to ${next.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`,
                'success',
            );
            // The sale now belongs to a different day, so anything holding
            // per-period figures is stale: the reports cards cache ranges for a
            // minute, and the Business Dashboard computes from the app-wide
            // sales list. Refresh all three rather than only this list.
            invalidateDashboardCache();
            onSaleChanged?.();
            fetchSales();
        } catch (err: any) {
            showSnackbar(err?.message || 'Could not change the sale date.', 'error');
        } finally {
            setSavingDate(false);
        }
    };

    const enriched = useMemo(() => sales.map(s => {
        if (s.customerName || !s.customerId) return s;
        const c = customers.find(c => c.id === s.customerId);
        return c ? { ...s, customerName: c.name } : s;
    }), [sales, customers]);

    const filtered = useMemo(() => {
        const t = search.toLowerCase().trim();
        if (!t) return enriched;
        return enriched.filter(s =>
            s.transactionId.toLowerCase().includes(t) ||
            (s.customerName || '').toLowerCase().includes(t) ||
            (s.cart || []).some(i => (i.name || '').toLowerCase().includes(t))
        );
    }, [enriched, search]);

    /**
     * The period's sales as a printable PDF — what a store hands to an owner or
     * files for the day.
     *
     * The list on screen holds the newest 50 rows; an export that quietly
     * printed only those would read as a complete period statement while
     * omitting most of it, so the whole window is paged in first. Very large
     * periods stop at a stated ceiling and the header says so rather than
     * truncating in silence.
     */
    const EXPORT_LIMIT = 2000;
    const exportPdf = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const PAGE = 200;
            const rows: Sale[] = [];
            let page = 1;
            let reported = 0;
            for (;;) {
                const res = await api.get<{ items: Sale[]; total: number }>(
                    `/sales?page=${page}&limit=${PAGE}&sortBy=date&sortOrder=desc&${periodQuery()}`,
                );
                const items = res?.items || [];
                reported = Number(res?.total) || reported;
                rows.push(...items);
                if (items.length < PAGE || rows.length >= Math.min(reported || Infinity, EXPORT_LIMIT)) break;
                page++;
            }
            if (rows.length === 0) {
                showSnackbar(`No sales in ${rangeLabel(range).toLowerCase()} to export.`, 'info');
                return;
            }

            const w = windowFor(range, now);
            const { startDay, endDay } = rangeDaysOf(w.start, w.end);
            const longDate = (d: string) =>
                new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

            // Refunded sales still belong on the statement — they are part of
            // what happened — so the total is the net of what was actually kept.
            const net = rows.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

            const meta = [
                startDay === endDay ? longDate(startDay) : `${longDate(startDay)} — ${longDate(endDay)}`,
                `${pdfNumber(rows.length)} transaction${rows.length === 1 ? '' : 's'} · ${pdfMoney(net, storeSettings)}`,
            ];
            if (query) meta.push(`Filtered by "${query}"`);
            if (reported > rows.length) meta.push(`Showing the newest ${pdfNumber(rows.length)} of ${pdfNumber(reported)} transactions`);

            const doc = createPdf();
            const startY = drawPdfHeader(doc, {
                title: 'Sales History',
                settings: storeSettings,
                logo: await loadStoreLogo(storeSettings),
                meta,
            });

            drawPdfTable(doc, {
                startY,
                head: [['Date', 'Transaction', 'Customer', 'Items', 'Status', 'Total']],
                body: rows.map(s => [
                    new Date(s.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    s.transactionId,
                    s.customerName || 'Walk-in',
                    pdfNumber((s.cart || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0)),
                    statusBadge(s).label,
                    pdfMoney(s.total, storeSettings),
                ]),
                foot: [['Total', '', '', '', '', pdfMoney(net, storeSettings)]],
                columnStyles: {
                    0: { cellWidth: 84 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 92 },
                    3: { cellWidth: 44, halign: 'right' },
                    4: { cellWidth: 64 },
                    5: { cellWidth: 78, halign: 'right' },
                },
                footStyles: {
                    fontStyle: 'bold',
                    fillColor: false,
                    textColor: PDF_NAVY,
                    lineWidth: { top: 1 },
                    lineColor: PDF_NAVY,
                },
            });

            await drawPdfFooterAsync(doc, storeSettings);
            savePdf(doc, pdfFileName(
                'Sales History',
                storeSettings,
                startDay === endDay ? startDay : `${startDay}_to_${endDay}`,
            ));
        } catch (err: any) {
            showSnackbar(err?.message || 'Could not export the sales history.', 'error');
        } finally {
            setExporting(false);
        }
    };

    const openSale = (sale: Sale) => {
        setSelectedSale(sale);
        setMobileDetailOpen(true);
    };

    const setQty = (item: Sale['cart'][0], next: number) => {
        const max = item.quantity - (item.returnedQuantity || 0);
        const q = Math.max(0, Math.min(next, max));
        setItemsToReturn(prev => {
            const updated = { ...prev };
            if (q > 0) {
                updated[item.productId] = {
                    quantity: q,
                    reason: updated[item.productId]?.reason || REASONS[0],
                    addToStock: updated[item.productId]?.addToStock ?? true,
                    name: item.name,
                    price: item.price,
                };
            } else {
                delete updated[item.productId];
            }
            return updated;
        });
    };

    const setLine = (productId: string, field: 'reason' | 'addToStock', value: string | boolean) => {
        setItemsToReturn(prev => prev[productId] ? { ...prev, [productId]: { ...prev[productId], [field]: value } } : prev);
    };

    const { refundSubtotal, refundDiscount, refundTax, refundTotal } = useMemo(() => {
        if (!selectedSale || Object.keys(itemsToReturn).length === 0) {
            return { refundSubtotal: 0, refundDiscount: 0, refundTax: 0, refundTotal: 0 };
        }
        const refundSubtotal = Object.values(itemsToReturn).reduce((a, i) => a + i.price * i.quantity, 0);
        const originalSubtotal = selectedSale.cart.reduce((a, i) => a + i.price * i.quantity, 0);
        const proportion = originalSubtotal > 0 ? refundSubtotal / originalSubtotal : 0;
        const refundDiscount = (selectedSale.discount || 0) * proportion;
        const taxable = Math.max(0, refundSubtotal - refundDiscount);
        const refundTax = taxable * taxRate;
        return { refundSubtotal, refundDiscount, refundTax, refundTotal: taxable + refundTax };
    }, [itemsToReturn, selectedSale, taxRate]);

    const processRefund = () => {
        if (!selectedSale || refundTotal <= 0) return;
        const returnInfo: Return = {
            id: `RET-${Date.now()}`,
            originalSaleId: selectedSale.transactionId,
            timestamp: new Date().toISOString(),
            returnedItems: Object.entries(itemsToReturn).map(([productId, item]) => ({
                productId,
                productName: item.name,
                quantity: item.quantity,
                reason: item.reason || 'Other',
                addToStock: item.addToStock || false,
            })),
            refundAmount: refundTotal,
            subtotalAmount: refundSubtotal,
            taxAmount: refundTax,
            refundMethod,
        };
        onProcessReturn(returnInfo);
        showSnackbar(`Refund of ${formatCurrency(refundTotal, storeSettings)} processed`, 'success');
        setRefundMode(false);
        setSelectedSale(null);
        setMobileDetailOpen(false);
        // Pick up server-side changes (returnedQuantity / refundStatus).
        setTimeout(fetchSales, 700);
    };

    const returnableCount = selectedSale
        ? selectedSale.cart.reduce((a, i) => a + (i.quantity - (i.returnedQuantity || 0)), 0)
        : 0;
    const canRefund = !!selectedSale && selectedSale.refundStatus !== 'fully_refunded' && returnableCount > 0;

    return (
        <div className="sale__body">
            {/* List */}
            <main className="sale__browse">
                <div className="sale__browse-head">
                    <div className="hist__head-row">
                        <h2>Sales History</h2>
                        <div className="hist__head-tools">
                            <PeriodPicker range={range} onRange={setRange} />
                            <button
                                type="button"
                                className="v2-btn v2-btn--secondary hist__export"
                                onClick={exportPdf}
                                disabled={exporting || isLoading || filtered.length === 0}
                                title={`Export ${rangeLabel(range).toLowerCase()} as a PDF`}
                            >
                                <PosIcon name={exporting ? 'hourglass_top' : 'picture_as_pdf'} size={18} />
                                {exporting ? 'Preparing…' : 'PDF'}
                            </button>
                        </div>
                    </div>
                    <div className="sale__search" style={{ maxWidth: 'none' }}>
                        <PosIcon name="search" size={20} className="sale__search-icon" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by product, transaction ID or customer"
                            aria-label="Search sales"
                        />
                        {search && (
                            <button type="button" className="sale__search-clear" aria-label="Clear" onClick={() => setSearch('')}>
                                <PosIcon name="close" size={16} />
                            </button>
                        )}
                    </div>
                    {/* The list holds the newest 50; saying so keeps a partial
                        view from reading as the whole period. The PDF export
                        covers the full period regardless. */}
                    {!isLoading && !error && total > 0 && (
                        <p className="hist__count">
                            {total.toLocaleString()} transaction{total === 1 ? '' : 's'} in {rangeLabel(range).toLowerCase()}
                            {total > filtered.length && ` · showing the newest ${filtered.length}`}
                        </p>
                    )}
                </div>

                {isLoading ? (
                    <div className="hist__list">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="histcard" style={{ height: 64, opacity: 0.4, pointerEvents: 'none' }} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="sale__empty">
                        <PosIcon name="error" size={40} />
                        <p>{error}</p>
                        <button type="button" className="v2-btn v2-btn--secondary" onClick={fetchSales}>Try again</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="sale__empty">
                        <PosIcon name="receipt_long" size={40} />
                        <p>
                            {search
                                ? `No sales match “${search}” in ${rangeLabel(range).toLowerCase()}.`
                                : range.kind === 'preset' && range.preset === 'all'
                                    ? 'No sales recorded yet.'
                                    : `No sales in ${rangeLabel(range).toLowerCase()}.`}
                        </p>
                        {/* "Make your first sale" is only true when there are no
                            sales AT ALL — not when a chosen period happens to be
                            empty. */}
                        {!search && range.kind === 'preset' && range.preset === 'all' && onStartSelling && (
                            <button
                                type="button"
                                className="v2-btn v2-btn--primary"
                                style={{ marginTop: 12, minHeight: 48 }}
                                onClick={onStartSelling}
                            >
                                <PosIcon name="point_of_sale" size={20} /> Make your first sale
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="hist__list">
                        {filtered.map(sale => {
                            const badge = statusBadge(sale);
                            return (
                                <button
                                    key={sale.transactionId}
                                    type="button"
                                    className={`histcard${selectedSale?.transactionId === sale.transactionId ? ' histcard--active' : ''}`}
                                    onClick={() => openSale(sale)}
                                >
                                    <div className="histcard__main">
                                        <span className="histcard__id">{cartTitle(sale, search)}</span>
                                        <span className="histcard__meta">
                                            {new Date(sale.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            {' · '}{new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' · '}{sale.customerName || 'Walk-in'}
                                            {' · '}{sale.transactionId}
                                        </span>
                                    </div>
                                    <div className="histcard__right">
                                        <span className="histcard__amount tnum">{formatCurrency(sale.total, storeSettings)}</span>
                                        <span className={`hist-status hist-status--${badge.cls}`}>{badge.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Detail / Refund */}
            <aside className={`cart${mobileDetailOpen ? ' cart--open' : ''}`} aria-label="Sale details">
                {!selectedSale ? (
                    <div className="cart__lines">
                        <div className="cart__empty">
                            <PosIcon name="receipt_long" size={34} />
                            <p>Select a sale</p>
                            <span>Tap a transaction to view details and process a refund.</span>
                        </div>
                    </div>
                ) : refundMode ? (
                    <div className="pay">
                        <div className="pay__head">
                            <button type="button" className="pay__back" onClick={() => setRefundMode(false)}>
                                <PosIcon name="arrow_back" size={20} /> Back to Sale
                            </button>
                            <button type="button" className="cart__close" aria-label="Close" onClick={() => setMobileDetailOpen(false)}>
                                <PosIcon name="close" size={20} />
                            </button>
                        </div>
                        <div className="pay__body">
                            <p className="confirm__lead">Choose items and quantities to refund.</p>
                            {selectedSale.cart.map(item => {
                                const max = item.quantity - (item.returnedQuantity || 0);
                                const line = itemsToReturn[item.productId];
                                const qty = line?.quantity || 0;
                                if (max <= 0) {
                                    return (
                                        <div key={item.productId} className="refunditem refunditem--done">
                                            <div className="refunditem__top">
                                                <span className="refunditem__name">{item.name}</span>
                                                <span className="refunditem__max">Fully returned</span>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={item.productId} className="refunditem">
                                        <div className="refunditem__top">
                                            <span className="refunditem__name">{item.name}</span>
                                            <span className="refunditem__max">{formatCurrency(item.price, storeSettings)} · max {max}</span>
                                        </div>
                                        <div className="refunditem__controls">
                                            <div className="cart__stepper">
                                                <button type="button" className="v2-iconbtn v2-iconbtn--sm" aria-label="Decrease" onClick={() => setQty(item, qty - 1)}>
                                                    <PosIcon name="remove" size={18} />
                                                </button>
                                                <span className="cart__qty tnum">{qty}</span>
                                                <button type="button" className="v2-iconbtn v2-iconbtn--sm" aria-label="Increase" onClick={() => setQty(item, qty + 1)}>
                                                    <PosIcon name="add" size={18} />
                                                </button>
                                            </div>
                                            {qty > 0 && (
                                                <>
                                                    <select
                                                        className="refunditem__select"
                                                        value={line?.reason}
                                                        onChange={e => setLine(item.productId, 'reason', e.target.value)}
                                                        aria-label="Return reason"
                                                    >
                                                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                    <label className="refunditem__restock">
                                                        <input
                                                            type="checkbox"
                                                            checked={line?.addToStock ?? true}
                                                            onChange={e => setLine(item.productId, 'addToStock', e.target.checked)}
                                                        />
                                                        Restock
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="cart__field" style={{ marginTop: 'var(--v2-space-2)' }}>
                                <span className="cart__field-label">Refund method</span>
                                <select
                                    className="refunditem__select"
                                    style={{ flex: 'unset', width: '100%' }}
                                    value={refundMethod}
                                    onChange={e => setRefundMethod(e.target.value)}
                                >
                                    {REFUND_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>

                            <dl className="cart__totals">
                                <div><dt>Subtotal</dt><dd className="tnum">{formatCurrency(refundSubtotal, storeSettings)}</dd></div>
                                {refundDiscount > 0 && (
                                    <div className="cart__discount-row"><dt>Discount</dt><dd className="tnum">−{formatCurrency(refundDiscount, storeSettings)}</dd></div>
                                )}
                                <div><dt>Tax</dt><dd className="tnum">{formatCurrency(refundTax, storeSettings)}</dd></div>
                            </dl>
                        </div>
                        <div className="pay__foot">
                            <button
                                type="button"
                                className="cart__charge cart__charge--danger"
                                disabled={refundTotal <= 0}
                                onClick={processRefund}
                            >
                                <span className="cart__charge-label">
                                    <PosIcon name="undo" size={22} fill={1} /> Process Refund
                                </span>
                                <span className="cart__charge-total tnum">{formatCurrency(refundTotal, storeSettings)}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="cart__head">
                            <div>
                                <h2>Sale Details</h2>
                                <p className="cart__meta">{selectedSale.transactionId}</p>
                            </div>
                            <div className="cart__head-actions">
                                <button type="button" className="cart__close" aria-label="Close" onClick={() => setMobileDetailOpen(false)}>
                                    <PosIcon name="close" size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="hist__detail-body">
                            {dateDraft !== null && (
                                <div className="hist__datefix">
                                    <label htmlFor="hist-date-input">Move this sale to</label>
                                    <input
                                        id="hist-date-input"
                                        type="date"
                                        value={dateDraft}
                                        max={toDateInput(new Date().toISOString())}
                                        onChange={e => setDateDraft(e.target.value)}
                                    />
                                    <p className="hist__datefix-note">
                                        It will leave today's sales and count towards that day's totals and reports everywhere.
                                    </p>
                                    <div className="hist__datefix-actions">
                                        <button type="button" className="v2-btn v2-btn--secondary" onClick={() => setDateDraft(null)} disabled={savingDate}>
                                            Cancel
                                        </button>
                                        <button type="button" className="v2-btn v2-btn--primary" onClick={saveDate} disabled={savingDate || !dateDraft}>
                                            {savingDate ? 'Saving…' : 'Save date'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <SaleDetailContent
                                sale={selectedSale}
                                storeSettings={storeSettings}
                                onEditDate={canEditDate && dateDraft === null
                                    ? () => setDateDraft(toDateInput(selectedSale.timestamp))
                                    : undefined}
                            />
                        </div>
                        <div className="pay__foot">
                            <div className="cart__secondary">
                                <button type="button" className="v2-btn v2-btn--secondary" onClick={() => setReceiptOpen(true)}>
                                    <PosIcon name="receipt_long" size={18} /> Receipt
                                </button>
                                <button
                                    type="button"
                                    className="v2-btn v2-btn--secondary"
                                    disabled={!canRefund}
                                    onClick={() => setRefundMode(true)}
                                    style={!canRefund ? undefined : { borderColor: 'var(--v2-color-danger)', color: 'var(--v2-color-danger)' }}
                                >
                                    <PosIcon name="undo" size={18} /> {selectedSale.refundStatus === 'fully_refunded' ? 'Refunded' : 'Refund'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </aside>

            {receiptOpen && selectedSale && (
                <ReceiptModal
                    isOpen={receiptOpen}
                    onClose={() => setReceiptOpen(false)}
                    saleData={selectedSale}
                    storeSettings={storeSettings}
                    showSnackbar={showSnackbar}
                />
            )}
        </div>
    );
};

export default SalesHistoryView;
