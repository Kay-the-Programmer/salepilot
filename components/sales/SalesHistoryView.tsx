import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Sale, Customer, StoreSettings, Return } from '../../types';
import { api } from '../../services/api';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import SaleDetailContent from './SaleDetailContent';
import ReceiptModal from './ReceiptModal';
import PosIcon from './PosIcon';
import { SnackbarType } from '../../App';

interface SalesHistoryViewProps {
    storeSettings: StoreSettings;
    customers: Customer[];
    onProcessReturn: (returnInfo: Return) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    /** First-run CTA: jump back to the register to make the first sale. */
    onStartSelling?: () => void;
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

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ storeSettings, customers, onProcessReturn, showSnackbar, onStartSelling }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [refundMode, setRefundMode] = useState(false);
    const [receiptOpen, setReceiptOpen] = useState(false);

    const [itemsToReturn, setItemsToReturn] = useState<{ [productId: string]: ReturnLine }>({});
    const [refundMethod, setRefundMethod] = useState('original_method');

    const taxRate = storeSettings.taxRate / 100;

    const fetchSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get<{ items: Sale[] }>(`/sales?page=1&limit=50&sortBy=date&sortOrder=desc`);
            setSales(res?.items || []);
        } catch (err: any) {
            try {
                const all = await dbService.getAll<Sale>('sales');
                all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setSales(all.slice(0, 50));
            } catch {
                setError(err?.message || 'Failed to load sales.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSales(); }, [fetchSales]);

    // Reset refund builder when switching sale
    useEffect(() => {
        setItemsToReturn({});
        setRefundMethod('original_method');
        setRefundMode(false);
    }, [selectedSale]);

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
            (s.customerName || '').toLowerCase().includes(t)
        );
    }, [enriched, search]);

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
                    <h2>Sales History</h2>
                    <div className="sale__search" style={{ maxWidth: 'none' }}>
                        <PosIcon name="search" size={20} className="sale__search-icon" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by transaction ID or customer"
                            aria-label="Search sales"
                        />
                        {search && (
                            <button type="button" className="sale__search-clear" aria-label="Clear" onClick={() => setSearch('')}>
                                <PosIcon name="close" size={16} />
                            </button>
                        )}
                    </div>
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
                        <p>{search ? `No sales match “${search}”.` : 'No sales recorded yet.'}</p>
                        {!search && onStartSelling && (
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
                                        <span className="histcard__id">{sale.transactionId}</span>
                                        <span className="histcard__meta">
                                            {new Date(sale.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            {' · '}{new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' · '}{sale.customerName || 'Walk-in'}
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
                            <SaleDetailContent sale={selectedSale} storeSettings={storeSettings} />
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
