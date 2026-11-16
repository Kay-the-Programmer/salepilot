import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Supplier, Product, PurchaseOrder, POItem, StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney } from '../crm/crmModel';
import {
    computePoTotals, suggestReorder, productToPoItem, newPoIdentifiers, applyPlaceOrder, isLow, reorderQty, thresholdFor,
} from '../purchase-orders/poModel';
import { useToast } from '../../contexts/ToastContext';
import './procure-order-form.css';

interface ProcureOrderFormProps {
    poToEdit?: PurchaseOrder | null;
    suppliers: Supplier[];
    products: Product[];
    storeSettings: StoreSettings;
    initialSupplierId?: string;
    /** Pre-populated items (e.g. from Buy stock's "Add other products"). */
    initialItems?: POItem[];
    /** Who the store last ordered from — pre-selected on a brand-new order. */
    lastSupplierId?: string;
    /** Resolves false when the save was refused: the form stays open and can be saved again. */
    onSave: (po: PurchaseOrder, placeOrder: boolean) => void | Promise<unknown>;
    onCancel: () => void;
}

type Filter = 'low' | 'supplier' | 'all';

const fmtQty = (q: number, kg: boolean) => (kg ? (Number.isInteger(q) ? String(q) : q.toFixed(2)) : String(Math.round(q)));

/**
 * New / edit purchase order — two panes.
 *
 * Left: the catalogue to pick from (search, Low stock / This supplier / All,
 * one tap adds a product with a sensible amount). Right: the order being
 * built (supplier, lines with −/+, totals, and the single primary action).
 * On a phone the panes stack behind a Products / Order switch, with the total
 * and Place order pinned to the bottom.
 *
 * PO domain logic (totals, reorder rule, place-order transition, id/number)
 * comes from `components/purchase-orders/poModel`.
 */
export const ProcureOrderForm: React.FC<ProcureOrderFormProps> = ({
    poToEdit, suppliers, products, storeSettings, initialSupplierId, initialItems, lastSupplierId, onSave, onCancel,
}) => {
    const { showToast } = useToast();
    const [po, setPo] = useState<Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>>(() => {
        if (poToEdit) return { ...poToEdit };
        const prefillId = initialSupplierId || lastSupplierId;
        const prefill = prefillId ? suppliers.find(s => s.id === prefillId) : null;
        return {
            supplierId: prefill?.id || '', supplierName: prefill?.name || '', status: 'draft',
            items: initialItems ? initialItems.map(i => ({ ...i })) : [], notes: '', subtotal: 0, shippingCost: 0, tax: 0, total: 0,
            expectedAt: undefined, isMarketplaceOrder: !!prefill?.linkedStoreId,
        };
    });
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [search, setSearch] = useState('');
    // Phone layout: which pane is showing.
    const [pane, setPane] = useState<'products' | 'order'>(
        poToEdit || (initialItems && initialItems.length) ? 'order' : 'products',
    );
    const searchRef = useRef<HTMLInputElement>(null);
    const savingRef = useRef(false);
    const [saving, setSaving] = useState(false);
    const [justAdded, setJustAdded] = useState<string | null>(null);

    const supplier = useMemo(() => suppliers.find(s => s.id === po.supplierId) || null, [suppliers, po.supplierId]);
    const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    const inOrder = useMemo(() => new Set(po.items.map(i => i.productId)), [po.items]);

    const lowForOrder = useMemo(
        () => suggestReorder(products, po.supplierId, inOrder, storeSettings),
        [products, po.supplierId, inOrder, storeSettings],
    );
    const lowCount = useMemo(
        () => products.filter(p => p.status === 'active' && isLow(p, storeSettings)
            && (!po.supplierId || p.supplierId === po.supplierId)).length,
        [products, po.supplierId, storeSettings],
    );
    const [filter, setFilter] = useState<Filter>(() => (lowCount > 0 ? 'low' : 'all'));

    useEffect(() => {
        if (pane === 'products' && !poToEdit) {
            const t = setTimeout(() => searchRef.current?.focus(), 60);
            return () => clearTimeout(t);
        }
    }, [pane, poToEdit]);

    // Totals through the shared PO money model.
    useEffect(() => {
        const { subtotal, tax, total } = computePoTotals(po.items, po.shippingCost, storeSettings.taxRate);
        setPo(prev => ({ ...prev, subtotal, tax, total }));
    }, [po.items, po.shippingCost, storeSettings.taxRate]);

    const selectSupplier = (s: Supplier | null) => {
        // The basket survives a supplier change: any product can be bought from anyone.
        setPo(prev => ({
            ...prev,
            supplierId: s?.id || '',
            supplierName: s?.name || '',
            isMarketplaceOrder: !!s?.linkedStoreId,
        }));
        setSupplierOpen(false);
    };

    const cartonOf = (p?: Product) => (p && p.unitOfMeasure !== 'kg' && num(p.unitsPerCarton) > 1 ? num(p.unitsPerCarton) : 1);

    /** A sensible first amount: the reorder suggestion if low, else one carton, else one. */
    const firstQty = (p: Product) => (isLow(p, storeSettings) ? reorderQty(p, storeSettings) : cartonOf(p));

    const addProduct = (p: Product, quantity = firstQty(p)) => {
        if (inOrder.has(p.id)) return;
        setPo(prev => ({ ...prev, items: [...prev.items, productToPoItem(p, quantity)] }));
        setJustAdded(p.id);
        setTimeout(() => setJustAdded(id => (id === p.id ? null : id)), 900);
    };

    const addAllLow = () => {
        if (lowForOrder.length === 0) return;
        setPo(prev => ({ ...prev, items: [...prev.items, ...lowForOrder.map(p => productToPoItem(p, p.suggestedQty))] }));
        showToast(`Added ${lowForOrder.length} low-stock product${lowForOrder.length === 1 ? '' : 's'}.`, 'success');
    };

    const setQty = (productId: string, q: number) =>
        setPo(prev => ({ ...prev, items: prev.items.map(i => (i.productId === productId ? { ...i, quantity: Math.max(0, q) } : i)) }));
    const setCost = (productId: string, c: number) =>
        setPo(prev => ({ ...prev, items: prev.items.map(i => (i.productId === productId ? { ...i, costPrice: Math.max(0, c) } : i)) }));
    const removeItem = (productId: string) => setPo(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== productId) }));

    const step = (it: POItem, dir: 1 | -1) => {
        const p = productById.get(it.productId);
        const kg = p?.unitOfMeasure === 'kg';
        const next = Math.max(0, num(it.quantity) + dir * cartonOf(p));
        setQty(it.productId, kg ? Math.round(next * 100) / 100 : next);
    };

    // The catalogue, filtered. Products this supplier normally provides sort first.
    const catalogue = useMemo(() => {
        const term = search.trim().toLowerCase();
        return products
            .filter(p => p.status === 'active')
            .filter(p => !term || p.name.toLowerCase().includes(term) || (p.sku || '').toLowerCase().includes(term) || (p.barcode || '').toLowerCase() === term)
            .filter(p => term ? true
                : filter === 'low' ? isLow(p, storeSettings) && (!po.supplierId || p.supplierId === po.supplierId)
                    : filter === 'supplier' ? !!po.supplierId && p.supplierId === po.supplierId
                        : true)
            .sort((a, b) => {
                const aOwn = po.supplierId && a.supplierId === po.supplierId ? 0 : 1;
                const bOwn = po.supplierId && b.supplierId === po.supplierId ? 0 : 1;
                return aOwn - bOwn || a.name.localeCompare(b.name);
            });
    }, [products, search, filter, po.supplierId, storeSettings]);

    const lines = po.items.length;
    const canSave = lines > 0 && po.items.some(i => num(i.quantity) > 0);

    const save = (placeOrder: boolean) => {
        if (!canSave || savingRef.current) return; // one order per tap, however fast the taps
        savingRef.current = true;
        const ids = poToEdit
            ? { id: poToEdit.id, poNumber: poToEdit.poNumber, createdAt: poToEdit.createdAt }
            : newPoIdentifiers();
        const base: PurchaseOrder = {
            ...po,
            items: po.items.filter(i => num(i.quantity) > 0),
            ...ids,
            status: poToEdit ? po.status : 'draft',
        };
        setSaving(true);
        Promise.resolve(onSave(applyPlaceOrder(base, placeOrder), placeOrder)).then(ok => {
            if (ok === false) { savingRef.current = false; setSaving(false); }
        }, () => { savingRef.current = false; setSaving(false); });
    };

    const canPlace = !poToEdit || po.status === 'draft';
    const total = formatMoney(po.total, storeSettings);

    const primary = canPlace ? (
        <button type="button" className="crm-btn crm-btn--primary pof-primary" disabled={!canSave || saving} aria-busy={saving} onClick={() => save(true)}>
            <Icon name={saving ? "hourglass_top" : "send"} size={20} /> {saving ? "Placing…" : "Place order"}
        </button>
    ) : (
        <button type="button" className="crm-btn crm-btn--primary pof-primary" disabled={!canSave || saving} aria-busy={saving} onClick={() => save(false)}>
            <Icon name={saving ? "hourglass_top" : "check"} size={20} /> {saving ? "Saving…" : "Save changes"}
        </button>
    );

    return (
        <div className="crm-form-overlay pof" role="dialog" aria-modal="true" aria-label={poToEdit ? 'Edit purchase order' : 'New purchase order'}>
            {/* ── Top bar ── */}
            <header className="pof-bar">
                <button type="button" className="crm-iconbtn" aria-label="Close" onClick={onCancel}>
                    <Icon name="close" />
                </button>
                <div className="pof-bar__title">
                    <h1>{poToEdit ? `Edit ${poToEdit.poNumber}` : 'New purchase order'}</h1>
                    <p>{lines === 0 ? 'Pick products to order' : `${lines} product${lines === 1 ? '' : 's'} · ${total}`}</p>
                </div>
                {canPlace && (
                    <button type="button" className="crm-btn crm-btn--ghost pof-bar__draft" disabled={!canSave || saving} onClick={() => save(false)}>
                        Save draft
                    </button>
                )}
            </header>

            {/* Phone: switch between the two panes */}
            <div className="pof-switch" role="tablist" aria-label="Order sections">
                <button type="button" role="tab" aria-selected={pane === 'products'} className={pane === 'products' ? 'is-on' : ''} onClick={() => setPane('products')}>
                    Products
                </button>
                <button type="button" role="tab" aria-selected={pane === 'order'} className={pane === 'order' ? 'is-on' : ''} onClick={() => setPane('order')}>
                    Order{lines > 0 ? <span className="pof-count">{lines}</span> : null}
                </button>
            </div>

            <div className={`pof-body pof-body--${pane}`}>
                {/* ════ Left: catalogue ════ */}
                <section className="pof-pane pof-cat" aria-label="Products">
                    <div className="pof-cat__head">
                        <div className="pof-search">
                            <Icon name="search" size={20} />
                            <input
                                ref={searchRef}
                                type="search"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search name, SKU or barcode"
                                aria-label="Search products"
                            />
                        </div>
                        <div className="pof-chips" role="radiogroup" aria-label="Show">
                            <button type="button" role="radio" aria-checked={filter === 'low'} className={`pof-chip${filter === 'low' ? ' is-on' : ''}`} onClick={() => setFilter('low')}>
                                Low stock{lowCount > 0 && <span className="pof-chip__n">{lowCount}</span>}
                            </button>
                            {supplier && (
                                <button type="button" role="radio" aria-checked={filter === 'supplier'} className={`pof-chip${filter === 'supplier' ? ' is-on' : ''}`} onClick={() => setFilter('supplier')}>
                                    From {supplier.name}
                                </button>
                            )}
                            <button type="button" role="radio" aria-checked={filter === 'all'} className={`pof-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>
                                All products
                            </button>
                        </div>
                        {filter === 'low' && !search && lowForOrder.length > 1 && (
                            <button type="button" className="pof-addall" onClick={addAllLow}>
                                <Icon name="playlist_add" size={20} />
                                Add all {lowForOrder.length} at suggested amounts
                            </button>
                        )}
                    </div>

                    <ul className="pof-list">
                        {catalogue.length === 0 ? (
                            <li className="pof-empty">
                                <Icon name={search ? 'search_off' : filter === 'low' ? 'task_alt' : 'inventory_2'} size={32} />
                                <p>
                                    {search ? `No product matches “${search.trim()}”.`
                                        : filter === 'low' ? 'Nothing is running low.'
                                            : filter === 'supplier' ? `No products are linked to ${supplier?.name}.` : 'No products yet.'}
                                </p>
                                {!search && filter !== 'all' && (
                                    <button type="button" className="crm-link" onClick={() => setFilter('all')}>Show all products</button>
                                )}
                            </li>
                        ) : catalogue.slice(0, 80).map(p => {
                            const kg = p.unitOfMeasure === 'kg';
                            const stock = num(p.stock);
                            const thr = thresholdFor(p, storeSettings);
                            const tone = stock <= 0 ? 'out' : stock <= thr ? 'low' : 'ok';
                            const added = inOrder.has(p.id);
                            const suggest = firstQty(p);
                            return (
                                <li key={p.id} className={`pof-prod${added ? ' is-added' : ''}${justAdded === p.id ? ' is-flash' : ''}`}>
                                    <span className={`pof-dot pof-dot--${tone}`} aria-hidden />
                                    <div className="pof-prod__text">
                                        <p className="pof-prod__name">{p.name}</p>
                                        <p className="pof-prod__meta">
                                            <span className={tone !== 'ok' ? `pof-tone--${tone}` : undefined}>{fmtQty(stock, kg)}{kg ? ' kg' : ''} left</span>
                                            {' · '}{formatMoney(num(p.costPrice), storeSettings)} cost
                                            {po.supplierId && p.supplierId === po.supplierId ? ' · usual supplier' : ''}
                                        </p>
                                    </div>
                                    {added ? (
                                        <span className="pof-added" aria-label={`${p.name} is on the order`}>
                                            <Icon name="check" size={18} /> Added
                                        </span>
                                    ) : (
                                        <button type="button" className="pof-add" onClick={() => addProduct(p)} aria-label={`Add ${fmtQty(suggest, kg)}${kg ? ' kg' : ''} of ${p.name}`}>
                                            <Icon name="add" size={18} /> {fmtQty(suggest, kg)}{kg ? ' kg' : ''}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* ════ Right: the order ════ */}
                <section className="pof-pane pof-order" aria-label="Order">
                    <div className="pof-card">
                        {/* Supplier */}
                        <div className="pof-supplier">
                            <Avatar name={supplier?.name || '?'} size={44} square />
                            <div className="pof-supplier__text">
                                <span className="pof-label">Supplier</span>
                                <p className="pof-supplier__name">{supplier?.name || 'Not chosen yet'}</p>
                                {supplier?.phone && <p className="pof-supplier__meta">{supplier.phone}</p>}
                                {!supplier && <p className="pof-supplier__meta">You can name the supplier before receiving.</p>}
                            </div>
                            <button type="button" className="crm-btn crm-btn--outline pof-supplier__change" aria-expanded={supplierOpen} onClick={() => setSupplierOpen(o => !o)}>
                                {supplier ? 'Change' : 'Choose'}
                            </button>
                        </div>
                        {supplierOpen && (
                            <div className="pof-suppliers" role="listbox" aria-label="Suppliers">
                                {suppliers.map(s => (
                                    <button key={s.id} type="button" role="option" aria-selected={s.id === po.supplierId} className={s.id === po.supplierId ? 'is-on' : ''} onClick={() => selectSupplier(s)}>
                                        <Avatar name={s.name} size={32} square />
                                        <span>{s.name}</span>
                                        {s.id === po.supplierId && <Icon name="check" size={18} />}
                                    </button>
                                ))}
                                <button type="button" role="option" aria-selected={!po.supplierId} className={!po.supplierId ? 'is-on' : ''} onClick={() => selectSupplier(null)}>
                                    <span className="pof-suppliers__none"><Icon name="help" size={18} /></span>
                                    <span>Decide later</span>
                                </button>
                            </div>
                        )}

                        {/* Lines */}
                        <div className="pof-lines-head">
                            <span className="pof-label">Items</span>
                            {lines > 0 && <span className="pof-label">{lines} product{lines === 1 ? '' : 's'}</span>}
                        </div>
                        {lines === 0 ? (
                            <div className="pof-lines-empty">
                                <Icon name="shopping_cart" size={28} />
                                <p>Nothing on the order yet.</p>
                                <p className="pof-muted">Tap <b>+</b> on a product to add it.</p>
                                <button type="button" className="crm-link pof-only-phone" onClick={() => setPane('products')}>Browse products</button>
                            </div>
                        ) : (
                            <ul className="pof-lines">
                                {po.items.map(it => {
                                    const p = productById.get(it.productId);
                                    const kg = p?.unitOfMeasure === 'kg';
                                    const lineTotal = num(it.quantity) * num(it.costPrice);
                                    return (
                                        <li key={it.productId} className={`pof-line${justAdded === it.productId ? ' is-flash' : ''}`}>
                                            <div className="pof-line__top">
                                                <p className="pof-line__name">{it.productName}</p>
                                                <button type="button" className="pof-x" aria-label={`Remove ${it.productName}`} onClick={() => removeItem(it.productId)}>
                                                    <Icon name="close" size={18} />
                                                </button>
                                            </div>
                                            <div className="pof-line__row">
                                                <div className="pof-stepper">
                                                    <button type="button" aria-label={`Fewer ${it.productName}`} onClick={() => step(it, -1)}>−</button>
                                                    <input
                                                        type="text"
                                                        inputMode={kg ? 'decimal' : 'numeric'}
                                                        value={fmtQty(num(it.quantity), !!kg)}
                                                        onChange={e => { const v = e.target.value; if (/^\d*(\.\d{0,2})?$/.test(v)) setQty(it.productId, parseFloat(v) || 0); }}
                                                        aria-label={`Quantity of ${it.productName}`}
                                                    />
                                                    <button type="button" aria-label={`More ${it.productName}`} onClick={() => step(it, 1)}>+</button>
                                                </div>
                                                <label className="pof-cost">
                                                    <span>@</span>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        defaultValue={num(it.costPrice) ? String(num(it.costPrice)) : ''}
                                                        placeholder="0.00"
                                                        onBlur={e => setCost(it.productId, parseFloat(e.target.value) || 0)}
                                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                                        aria-label={`Unit cost of ${it.productName}`}
                                                    />
                                                </label>
                                                <p className="pof-line__total">{formatMoney(lineTotal, storeSettings)}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* Delivery & note */}
                        <details className="pof-more" open={!!(po.expectedAt || po.notes)}>
                            <summary>Delivery date &amp; note</summary>
                            <div className="pof-more__grid">
                                <label>
                                    <span className="pof-label">Expected delivery</span>
                                    <input type="date" className="crm-input" value={po.expectedAt ? po.expectedAt.slice(0, 10) : ''} onChange={e => setPo(prev => ({ ...prev, expectedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
                                </label>
                                <label>
                                    <span className="pof-label">Note to supplier</span>
                                    <input type="text" className="crm-input" value={po.notes || ''} onChange={e => setPo(prev => ({ ...prev, notes: e.target.value }))} placeholder="e.g. deliver before 10am" />
                                </label>
                            </div>
                        </details>

                        {/* Totals + action */}
                        <div className="pof-totals">
                            <div><span>Subtotal</span><b>{formatMoney(po.subtotal, storeSettings)}</b></div>
                            {num(storeSettings.taxRate) > 0 && (
                                <div><span>Tax ({num(storeSettings.taxRate)}%)</span><b>{formatMoney(po.tax, storeSettings)}</b></div>
                            )}
                            <div className="pof-totals__grand"><span>Total</span><b>{total}</b></div>
                        </div>
                        <div className="pof-actions">{primary}</div>
                    </div>
                </section>
            </div>

            {/* Phone: total + primary action always in reach */}
            <footer className="pof-dock">
                <button type="button" className="pof-dock__sum" onClick={() => setPane(pane === 'products' ? 'order' : 'products')}>
                    <span className="pof-dock__total">{total}</span>
                    <span className="pof-dock__meta">{lines} product{lines === 1 ? '' : 's'} · {pane === 'products' ? 'View order' : 'Add products'}</span>
                </button>
                {primary}
            </footer>
        </div>
    );
};

export default ProcureOrderForm;
