import React, { useEffect, useMemo, useState } from 'react';
import { POItem, Product, PurchaseOrder, StoreSettings, Supplier } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney } from '../crm/crmModel';
import { ReorderDraft, ReorderDraftItem } from '../purchase-orders/poModel';
import { placeOrders, PlacedOrder } from '../purchase-orders/placeOrders';
import SendOrderButtons from '../purchase-orders/SendOrderButtons';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Line extends ReorderDraftItem {
    include: boolean;
    qtyText: string;
}

interface Group {
    /** The suggestion's own supplier; null for products that have none. */
    supplierId: string | null;
    supplierName: string | null;
    /** For the no-supplier group: who the buyer picked. */
    chosenSupplierId?: string;
    lines: Line[];
}

interface Props {
    suppliers: Supplier[];
    products: Product[];
    storeSettings: StoreSettings;
    onBack: () => void;
    /** After orders are placed — the parent refreshes its data. */
    onPlaced: (orders: PurchaseOrder[]) => void;
    /** Open one supplier's lines in the full order form, to add other products. */
    onOpenInForm: (supplierId: string, items: POItem[]) => void;
    /** Syncs a product edited here (its remembered supplier) into app state. */
    onSaveProduct?: (product: Product) => Promise<unknown> | void;
    onAddSupplier?: () => void;
}

const fmtQty = (q: number, kg: boolean) => (kg ? q.toFixed(2) : String(Math.round(q)));

/**
 * Buy stock — everything that is low, already worked out, on one screen.
 *
 * Grouped by supplier with suggested quantities filled in (the shared reorder
 * rule: up to twice the threshold, whole cartons). Untick what you don't want,
 * nudge a quantity, then one button places an order with every supplier.
 * Products with no supplier are grouped last; picking a supplier for them is
 * one tap and is remembered on the products for next time.
 */
const ProcureBuyStock: React.FC<Props> = ({
    suppliers, products, storeSettings, onBack, onPlaced, onOpenInForm, onSaveProduct, onAddSupplier,
}) => {
    const { showToast } = useToast();
    const [groups, setGroups] = useState<Group[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [placing, setPlacing] = useState(false);
    const [placed, setPlaced] = useState<PlacedOrder[] | null>(null);

    const load = async () => {
        setLoadError(null);
        try {
            const { drafts } = await api.get<{ drafts: ReorderDraft[] }>('/purchase-orders/reorder-suggestions');
            setGroups((drafts || []).map(d => ({
                supplierId: d.supplierId,
                supplierName: d.supplierName,
                // A single supplier on file is the obvious pick for orphans.
                chosenSupplierId: d.supplierId ? undefined : (suppliers.length === 1 ? suppliers[0].id : undefined),
                lines: d.items.map(it => ({
                    ...it,
                    include: true,
                    qtyText: fmtQty(num(it.quantity), it.unitOfMeasure === 'kg'),
                })),
            })));
        } catch (err: any) {
            if (err?.status === 402) { onBack(); return; }
            setLoadError(err?.body?.message || err?.message || 'Could not work out what to buy.');
        }
    };

    useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

    const supplierOf = (g: Group) => {
        const id = g.supplierId || g.chosenSupplierId;
        return id ? suppliers.find(s => s.id === id) || (g.supplierId ? { id: g.supplierId, name: g.supplierName || 'Supplier' } as Supplier : undefined) : undefined;
    };

    const updateLine = (gi: number, li: number, patch: Partial<Line>) =>
        setGroups(prev => prev && prev.map((g, i) => i !== gi ? g : {
            ...g, lines: g.lines.map((l, j) => (j === li ? { ...l, ...patch } : l)),
        }));

    const step = (gi: number, li: number, dir: 1 | -1) => {
        const l = groups![gi].lines[li];
        const kg = l.unitOfMeasure === 'kg';
        const carton = !kg && num(l.unitsPerCarton) > 1 ? num(l.unitsPerCarton) : 1;
        const next = Math.max(0, num(l.qtyText) + dir * carton);
        updateLine(gi, li, { qtyText: fmtQty(next, kg), include: next > 0 });
    };

    const qtyOf = (l: Line) => (l.include ? Math.max(0, num(l.qtyText)) : 0);

    const plan = useMemo(() => (groups || []).map(g => {
        const lines = g.lines.filter(l => qtyOf(l) > 0);
        const subtotal = lines.reduce((s, l) => s + qtyOf(l) * num(l.costPrice), 0);
        return { group: g, lines, subtotal, supplier: supplierOf(g) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [groups, suppliers]);

    const ready = plan.filter(p => p.lines.length > 0 && p.supplier);
    const blocked = plan.filter(p => p.lines.length > 0 && !p.supplier);
    const grandTotal = ready.reduce((s, p) => s + p.subtotal, 0) * (1 + num(storeSettings.taxRate) / 100);
    const orderCount = new Set(ready.map(p => p.supplier!.id)).size;

    const placeAll = async () => {
        if (ready.length === 0 || placing) return;
        setPlacing(true);

        // Remember the supplier picked for products that had none.
        for (const p of ready) {
            if (p.group.supplierId || !p.supplier) continue;
            for (const l of p.lines) {
                try {
                    await api.put(`/products/${l.productId}`, { supplierId: p.supplier.id });
                    const prod = products.find(x => x.id === l.productId);
                    if (prod) await onSaveProduct?.({ ...prod, supplierId: p.supplier.id });
                } catch { /* the order matters more than remembering; carry on */ }
            }
        }

        // One order per supplier: products given a supplier here join that
        // supplier's order rather than becoming a second one.
        const bySupplier = new Map<string, { supplier: Supplier; items: POItem[] }>();
        for (const p of ready) {
            const entry = bySupplier.get(p.supplier!.id) || { supplier: p.supplier!, items: [] };
            for (const l of p.lines) {
                entry.items.push({
                    productId: l.productId, productName: l.productName, sku: l.sku,
                    quantity: qtyOf(l), costPrice: num(l.costPrice), receivedQuantity: 0,
                });
            }
            bySupplier.set(p.supplier!.id, entry);
        }

        const { placed: done, error } = await placeOrders(
            Array.from(bySupplier.values()).map(({ supplier, items }) => ({
                supplier: { id: supplier.id, name: supplier.name },
                items,
            })),
            storeSettings,
        );
        setPlacing(false);
        if (done.length > 0) {
            setPlaced(done);
            onPlaced(done.map(d => d.po));
        }
        if (error) showToast(`${done.length ? `${done.length} placed, then: ` : ''}${error}`, 'error');
    };

    // ── After placing: send each order to its supplier ──
    if (placed) {
        return (
            <main className="crm-main crm-section-fade">
                <div className="crm-pagehead" style={{ marginBottom: 16 }}>
                    <div>
                        <p className="crm-pagehead__eyebrow">Done</p>
                        <h2 className="crm-pagehead__title">{placed.length} order{placed.length === 1 ? '' : 's'} placed</h2>
                        <p className="crm-pagehead__sub">Send each one to the supplier — it opens WhatsApp with the order written out.</p>
                    </div>
                </div>
                <div className="crm-panel">
                    <div className="proc-list">
                        {placed.map(({ po, queued }) => (
                            <div key={po.id} className="proc-po" style={{ flexWrap: 'wrap' }}>
                                <Avatar name={po.supplierName || 'Supplier'} size={44} square />
                                <div className="proc-po__body">
                                    <p className="proc-po__no">{po.supplierName}</p>
                                    <p className="proc-po__meta">
                                        {queued ? 'Saved offline — will sync' : po.poNumber} · {(po.items || []).length} product{(po.items || []).length === 1 ? '' : 's'} · {formatMoney(po.total, storeSettings)}
                                    </p>
                                </div>
                                <SendOrderButtons po={po} suppliers={suppliers} products={products} storeName={storeSettings.name} compact />
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: 20 }}>
                    <button type="button" className="crm-btn crm-btn--outline" onClick={onBack}>Done</button>
                </div>
            </main>
        );
    }

    return (
        <main className="crm-main crm-section-fade buy">
            <nav className="crm-crumbs">
                <button type="button" onClick={onBack}>Orders</button>
                <Icon name="chevron_right" size={18} />
                <span className="crm-crumbs__current">Buy stock</span>
            </nav>
            <div className="crm-pagehead" style={{ marginBottom: 16 }}>
                <div>
                    <h2 className="crm-pagehead__title">Buy stock</h2>
                    <p className="crm-pagehead__sub">
                        Everything at or below its reorder level, with amounts worked out. Untick anything you don't want, then place the orders.
                    </p>
                </div>
            </div>

            {loadError ? (
                <div className="crm-panel"><div className="crm-empty" style={{ padding: '40px 16px' }}>
                    <p className="crm-empty__title">{loadError}</p>
                    <button type="button" className="crm-btn crm-btn--primary" onClick={load}>Try again</button>
                </div></div>
            ) : groups === null ? (
                <div className="crm-panel"><div className="crm-empty" style={{ padding: '40px 16px' }}><p className="crm-empty__text">Working out what to buy…</p></div></div>
            ) : groups.length === 0 ? (
                <div className="crm-panel"><div className="crm-empty" style={{ padding: '40px 16px' }}>
                    <Icon name="task_alt" size={40} />
                    <p className="crm-empty__title">Nothing is running low</p>
                    <p className="crm-empty__text">Every product is above its reorder level.</p>
                </div></div>
            ) : (
                <div className="buy__groups">
                    {groups.map((g, gi) => {
                        const p = plan[gi];
                        const orphan = !g.supplierId;
                        return (
                            <section key={g.supplierId || 'none'} className="crm-panel buy__group">
                                <header className="buy__head">
                                    <Avatar name={p.supplier?.name || '?'} size={40} square />
                                    <div className="buy__head-text">
                                        <p className="proc-po__no">{orphan ? 'No supplier yet' : g.supplierName}</p>
                                        <p className="proc-po__meta">
                                            {p.lines.length} of {g.lines.length} product{g.lines.length === 1 ? '' : 's'} · {formatMoney(p.subtotal, storeSettings)}
                                        </p>
                                    </div>
                                    {!orphan && p.lines.length > 0 && (
                                        <button
                                            type="button"
                                            className="crm-btn crm-btn--ghost"
                                            style={{ padding: '6px 12px' }}
                                            onClick={() => onOpenInForm(g.supplierId!, p.lines.map(l => ({
                                                productId: l.productId, productName: l.productName, sku: l.sku,
                                                quantity: qtyOf(l), costPrice: num(l.costPrice), receivedQuantity: 0,
                                            })))}
                                        >
                                            Add other products
                                        </button>
                                    )}
                                </header>

                                {orphan && (
                                    <div className="buy__pick">
                                        <span className="buy__pick-label">Order these from:</span>
                                        <div className="crm-chips">
                                            {suppliers.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    className={`crm-chip${g.chosenSupplierId === s.id ? ' is-active' : ''}`}
                                                    onClick={() => setGroups(prev => prev && prev.map((x, i) => i === gi ? { ...x, chosenSupplierId: s.id } : x))}
                                                >
                                                    {s.name}
                                                </button>
                                            ))}
                                            {onAddSupplier && (
                                                <button type="button" className="crm-chip" onClick={onAddSupplier}>+ New supplier</button>
                                            )}
                                        </div>
                                        {suppliers.length === 0 && <p className="proc-po__meta">Add a supplier first, then come back.</p>}
                                    </div>
                                )}

                                <ul className="buy__lines">
                                    {g.lines.map((l, li) => {
                                        const kg = l.unitOfMeasure === 'kg';
                                        const carton = !kg && num(l.unitsPerCarton) > 1 ? num(l.unitsPerCarton) : 0;
                                        return (
                                            <li key={l.productId} className={`buy__line${l.include ? '' : ' is-off'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={l.include}
                                                    onChange={e => updateLine(gi, li, { include: e.target.checked })}
                                                    aria-label={`Include ${l.productName}`}
                                                />
                                                <div className="buy__line-text">
                                                    <p className="buy__name">{l.productName}</p>
                                                    <p className="proc-po__meta">
                                                        {fmtQty(num(l.stock), kg)} left · low at {fmtQty(num(l.threshold), kg)}{carton ? ` · ${carton} per carton` : ''}
                                                    </p>
                                                </div>
                                                <div className="buy__qty">
                                                    <button type="button" aria-label={`Fewer ${l.productName}`} onClick={() => step(gi, li, -1)}>−</button>
                                                    <input
                                                        type="text"
                                                        inputMode={kg ? 'decimal' : 'numeric'}
                                                        value={l.qtyText}
                                                        onChange={e => { if (/^\d*(\.\d{0,2})?$/.test(e.target.value)) updateLine(gi, li, { qtyText: e.target.value, include: true }); }}
                                                        aria-label={`Quantity of ${l.productName}`}
                                                    />
                                                    <button type="button" aria-label={`More ${l.productName}`} onClick={() => step(gi, li, 1)}>+</button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            )}

            {groups && groups.length > 0 && (
                <footer className="buy__foot">
                    <div className="buy__foot-inner">
                        <div>
                            <p className="buy__total">{formatMoney(grandTotal, storeSettings)}</p>
                            <p className="proc-po__meta">
                                {blocked.length > 0
                                    ? `Pick a supplier for ${blocked.reduce((n, b) => n + b.lines.length, 0)} product(s) to include them`
                                    : `incl. ${num(storeSettings.taxRate)}% tax, at cost price`}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="crm-btn crm-btn--primary"
                            style={{ padding: '14px 26px' }}
                            disabled={ready.length === 0 || placing}
                            onClick={placeAll}
                        >
                            <Icon name="send" size={20} />
                            {placing ? 'Placing…' : `Place ${orderCount} order${orderCount === 1 ? '' : 's'}`}
                        </button>
                    </div>
                </footer>
            )}
        </main>
    );
};

export default ProcureBuyStock;
