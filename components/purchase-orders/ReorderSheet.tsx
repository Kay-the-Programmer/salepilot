import React, { useEffect, useMemo, useState } from 'react';
import { Product, PurchaseOrder, StoreSettings, Supplier } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { api } from '../../services/api';
import { num, parseApiDate } from '../crm/crmModel';
import { reorderQty, thresholdFor } from './poModel';
import { placeOrders, PlacedOrder } from './placeOrders';
import SendOrderButtons from './SendOrderButtons';
import { XMarkIcon } from '../icons';

interface Props {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    products: Product[];
    storeSettings: StoreSettings;
    /** After the order is placed — reload orders (and the product, if its supplier was remembered). */
    onPlaced: () => void;
    /** Syncs the product into app state once its supplier is remembered. */
    onSaveProduct?: (product: Product) => Promise<unknown> | void;
}

const fmtQty = (q: number, kg: boolean) => (kg ? q.toFixed(2) : String(Math.round(q)));

/**
 * Reorder one product from its page: supplier already chosen, amount already
 * worked out — Place order, then send it. Two taps for the usual case.
 *
 * The supplier is the product's own; failing that, whoever it was last bought
 * from; failing that, the only supplier on file. A pick for a product with no
 * supplier is remembered on it.
 */
const ReorderSheet: React.FC<Props> = ({
    product, isOpen, onClose, suppliers, purchaseOrders, products, storeSettings, onPlaced, onSaveProduct,
}) => {
    const [supplierId, setSupplierId] = useState<string>('');
    const [qtyText, setQtyText] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [placed, setPlaced] = useState<PlacedOrder | null>(null);

    const isKg = product?.unitOfMeasure === 'kg';
    const carton = !isKg && num(product?.unitsPerCarton) > 1 ? num(product?.unitsPerCarton) : 1;

    const lastSupplierId = useMemo(() => {
        if (!product) return undefined;
        const past = purchaseOrders
            .filter(po => po.supplierId && (po.items || []).some(it => it.productId === product.id))
            .sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0));
        return past[0]?.supplierId;
    }, [product, purchaseOrders]);

    useEffect(() => {
        if (!product || !isOpen) return;
        const own = product.supplierId && suppliers.some(s => s.id === product.supplierId) ? product.supplierId : undefined;
        setSupplierId(own || lastSupplierId || (suppliers.length === 1 ? suppliers[0].id : ''));
        setQtyText(fmtQty(reorderQty(product, storeSettings), product.unitOfMeasure === 'kg'));
        setPlaced(null);
        setError(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product?.id, isOpen]);

    if (!isOpen || !product) return null;

    const qty = Math.max(0, num(qtyText));
    const cost = num(product.costPrice);
    const supplier = suppliers.find(s => s.id === supplierId);
    const unit = isKg ? 'kg' : 'units';

    const step = (dir: 1 | -1) => setQtyText(fmtQty(Math.max(0, num(qtyText) + dir * carton), isKg));

    const place = async () => {
        if (!supplier || qty <= 0 || placing) return;
        setPlacing(true);
        setError(null);
        if (product.supplierId !== supplier.id && !product.supplierId) {
            try {
                await api.put(`/products/${product.id}`, { supplierId: supplier.id });
                await onSaveProduct?.({ ...product, supplierId: supplier.id });
            } catch { /* remembering is a nicety; the order still goes ahead */ }
        }
        const { placed: done, error: err } = await placeOrders([{
            supplier: { id: supplier.id, name: supplier.name },
            items: [{ productId: product.id, productName: product.name, sku: product.sku, quantity: qty, costPrice: cost, receivedQuantity: 0 }],
        }], storeSettings);
        setPlacing(false);
        if (done[0]) { setPlaced(done[0]); onPlaced(); }
        if (err) setError(err);
    };

    const chip = (active: boolean) =>
        `inline-flex items-center px-3 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 ${active
            ? 'bg-sp-navy border-sp-navy text-white'
            : 'bg-surface border-brand-border text-brand-text hover:border-sp-navy/40'}`;
    const stepBtn = 'w-14 h-14 flex-shrink-0 rounded-xl border border-brand-border bg-surface text-2xl font-bold text-brand-text hover:bg-surface-variant active:scale-95 transition-all';

    return (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reorder-title" onClick={onClose}>
            <div className="w-full bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl border border-brand-border max-h-[92vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-md" onClick={e => e.stopPropagation()}>
                <div className="px-5 pt-4 pb-3 border-b border-brand-border flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 id="reorder-title" className="text-lg font-bold text-brand-text line-clamp-1">{placed ? 'Order placed' : `Reorder ${product.name}`}</h3>
                        <p className="text-sm text-brand-text-muted mt-0.5">
                            <span className="font-bold text-brand-text tnum">{fmtQty(num(product.stock), isKg)} {unit}</span> left · low at {fmtQty(thresholdFor(product, storeSettings), isKg)}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 text-brand-text-muted hover:text-brand-text rounded-full">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {placed ? (
                    <div className="px-5 py-5 space-y-4">
                        <p className="text-sm text-brand-text">
                            <strong>{placed.queued ? 'Saved offline' : placed.po.poNumber}</strong> — {fmtQty(qty, isKg)} {unit} from {placed.po.supplierName}, {formatCurrency(placed.po.total, storeSettings)}.
                        </p>
                        <SendOrderButtons po={placed.po} suppliers={suppliers} products={products} storeName={storeSettings.name} />
                        <button type="button" onClick={onClose} className="w-full py-3 rounded-lg border border-brand-border text-brand-text font-bold text-sm hover:bg-surface-variant">Done</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            <div>
                                <span className="block text-xs font-medium text-brand-text mb-1.5">Supplier</span>
                                {suppliers.length === 0 ? (
                                    <p className="text-sm text-brand-text-muted">No suppliers yet — add one in Purchase Orders → Suppliers first.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Supplier">
                                        {suppliers.map(s => (
                                            <button key={s.id} type="button" role="radio" aria-checked={supplierId === s.id} className={chip(supplierId === s.id)} onClick={() => setSupplierId(s.id)}>
                                                {s.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="block text-xs font-medium text-brand-text mb-1.5">
                                    Amount{carton > 1 ? ` · ${carton} per carton` : ''}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button type="button" className={stepBtn} onClick={() => step(-1)} aria-label="Decrease amount">−</button>
                                    <input
                                        type="text"
                                        inputMode={isKg ? 'decimal' : 'numeric'}
                                        value={qtyText}
                                        onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) setQtyText(e.target.value); }}
                                        aria-label="Amount to order"
                                        className="flex-1 min-w-0 h-14 px-3 text-3xl font-bold bg-surface border-2 border-brand-border rounded-xl text-brand-text text-center focus:outline-none focus:border-sp-orange tnum"
                                    />
                                    <button type="button" className={stepBtn} onClick={() => step(1)} aria-label="Increase amount">+</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-surface-variant/60 border border-brand-border rounded-lg px-4 py-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">At cost</span>
                                <span className="text-xl font-bold text-brand-text tnum">{cost > 0 ? formatCurrency(qty * cost, storeSettings) : '—'}</span>
                            </div>
                            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
                        </div>
                        <div className="px-5 py-4 border-t border-brand-border">
                            <button
                                type="button"
                                onClick={place}
                                disabled={!supplier || qty <= 0 || placing}
                                className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm active:scale-95 transition-colors disabled:opacity-50"
                            >
                                {placing ? 'Placing…' : supplier ? `Place order with ${supplier.name}` : 'Pick a supplier'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReorderSheet;
