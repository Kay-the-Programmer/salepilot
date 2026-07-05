import React, { useEffect, useMemo, useState } from 'react';
import { Supplier, Product, PurchaseOrder, POItem, StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney } from '../crm/crmModel';
import { computePoTotals, suggestReorder, productToPoItem, newPoIdentifiers, applyPlaceOrder } from '../purchase-orders/poModel';

type Step = 'build' | 'review';

interface ProcureOrderFormProps {
    poToEdit?: PurchaseOrder | null;
    suppliers: Supplier[];
    products: Product[];
    storeSettings: StoreSettings;
    initialSupplierId?: string;
    /** Pre-populated items (e.g. from an auto-generated reorder draft). */
    initialItems?: POItem[];
    onSave: (po: PurchaseOrder, placeOrder: boolean) => void;
    onCancel: () => void;
    showSnackbar: (message: string, type?: any) => void;
}

/**
 * New / edit purchase order — the M3 wizard (Supplier → Add Items → Review).
 * PO domain logic (totals, reorder suggestions, place-order transition, id/number)
 * comes from the single source of truth `components/purchase-orders/poModel`.
 */
export const ProcureOrderForm: React.FC<ProcureOrderFormProps> = ({
    poToEdit, suppliers, products, storeSettings, initialSupplierId, initialItems, onSave, onCancel, showSnackbar,
}) => {
    const [po, setPo] = useState<Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>>(() => {
        if (poToEdit) return { ...poToEdit };
        const prefill = initialSupplierId ? suppliers.find(s => s.id === initialSupplierId) : null;
        return {
            supplierId: prefill?.id || '', supplierName: prefill?.name || '', status: 'draft',
            items: initialItems ? initialItems.map(i => ({ ...i })) : [], notes: '', subtotal: 0, shippingCost: 0, tax: 0, total: 0,
            expectedAt: undefined, isMarketplaceOrder: !!prefill?.linkedStoreId,
        };
    });
    const [step, setStep] = useState<Step>('build');
    const [supplierPickerOpen, setSupplierPickerOpen] = useState(!poToEdit && !initialSupplierId);
    const [itemPickerOpen, setItemPickerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    const selectSupplier = (supplier: Supplier) => {
        // Preserve any pre-filled items when assigning the first supplier (e.g. a
        // PO drafted from an order list); only clear when switching suppliers,
        // since catalogue items are supplier-scoped.
        setPo(prev => ({
            ...prev,
            supplierId: supplier.id,
            supplierName: supplier.name,
            items: prev.supplierId && prev.supplierId !== supplier.id ? [] : prev.items,
            isMarketplaceOrder: !!supplier.linkedStoreId,
        }));
        setSupplierPickerOpen(false);
    };

    const addProductToPO = (product: Product, quantity = 1) => {
        setPo(prev => {
            if (prev.items.some(i => i.productId === product.id)) { showSnackbar('Product is already in this PO.', 'info'); return prev; }
            return { ...prev, items: [...prev.items, productToPoItem(product, quantity)] };
        });
    };

    const updateItem = (productId: string, field: 'quantity' | 'costPrice', value: number) => {
        setPo(prev => ({ ...prev, items: prev.items.map(i => i.productId === productId ? { ...i, [field]: Math.max(0, value) } : i) }));
    };
    const removeItem = (productId: string) => setPo(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== productId) }));

    // Recompute totals via the shared PO money model.
    useEffect(() => {
        const { subtotal, tax, total } = computePoTotals(po.items, po.shippingCost, storeSettings.taxRate);
        setPo(prev => ({ ...prev, subtotal, tax, total }));
    }, [po.items, po.shippingCost, storeSettings.taxRate]);

    const supplier = useMemo(() => suppliers.find(s => s.id === po.supplierId) || null, [suppliers, po.supplierId]);

    const availableProducts = useMemo(() => {
        if (!po.supplierId) return [] as Product[];
        const inPo = new Set(po.items.map(i => i.productId));
        const term = productSearch.trim().toLowerCase();
        return products.filter(p => p.supplierId === po.supplierId && p.status === 'active' && !inPo.has(p.id)
            && (!term || p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)));
    }, [po.supplierId, po.items, products, productSearch]);

    const suggested = useMemo(
        () => suggestReorder(products, po.supplierId, new Set(po.items.map(i => i.productId))),
        [po.supplierId, po.items, products],
    );

    const addAllSuggested = () => {
        if (suggested.length === 0) { showSnackbar('Nothing to reorder for this supplier.', 'info'); return; }
        setPo(prev => ({
            ...prev,
            items: [...prev.items, ...suggested.map(p => productToPoItem(p, p.suggestedQty))],
        }));
        showSnackbar(`Added ${suggested.length} suggested product${suggested.length === 1 ? '' : 's'}.`, 'success');
    };

    const totalUnits = po.items.reduce((n, it) => n + num(it.quantity), 0);

    const save = (placeOrder: boolean) => {
        const ids = poToEdit
            ? { id: poToEdit.id, poNumber: poToEdit.poNumber, createdAt: poToEdit.createdAt }
            : newPoIdentifiers();
        const base: PurchaseOrder = { ...po, ...ids, status: poToEdit ? po.status : 'draft' };
        onSave(applyPlaceOrder(base, placeOrder), placeOrder);
    };

    const canContinue = !!po.supplierId && po.items.length > 0;
    const sym = storeSettings.currency?.symbol ?? '$';

    return (
        <div className="crm-form-overlay" role="dialog" aria-modal="true" aria-label={poToEdit ? 'Edit purchase order' : 'New purchase order'}>
            <header className="crm-form-bar">
                <div className="crm-form-bar__left">
                    <button type="button" className="crm-iconbtn" aria-label="Back" onClick={step === 'review' ? () => setStep('build') : onCancel} style={{ color: 'var(--c-primary)' }}>
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="crm-form-bar__title">{poToEdit ? `Edit ${poToEdit.poNumber}` : 'New Purchase Order'}</h1>
                </div>
            </header>

            <div className="crm-form-scroll">
                <div className="crm-form-inner" style={{ maxWidth: 880 }}>
                    {/* Progress */}
                    <div className="po-steps">
                        <div className="po-steps__labels">
                            <span className={po.supplierId ? 'is-done' : 'is-active'}>Supplier</span>
                            <span className={step === 'build' ? 'is-active' : 'is-done'}>Add Items</span>
                            <span className={step === 'review' ? 'is-active' : ''}>Review</span>
                        </div>
                        <div className="po-steps__bar">
                            <div className="po-steps__seg is-on" />
                            <div className={`po-steps__seg${(po.items.length > 0 || step === 'review') ? ' is-on2' : ''}`} />
                            <div className={`po-steps__seg${step === 'review' ? ' is-on' : ''}`} />
                        </div>
                    </div>

                    {step === 'build' ? (
                        <>
                            {/* Supplier */}
                            <section style={{ marginBottom: 32 }}>
                                <div className="po-sec-head">
                                    <h2 className="crm-form-section__title">Supplier Details</h2>
                                    {po.supplierId && (
                                        <button type="button" className="crm-btn crm-btn--ghost" onClick={() => setSupplierPickerOpen(o => !o)} style={{ padding: '6px 14px' }}>
                                            <Icon name="sync" size={18} /> Change Supplier
                                        </button>
                                    )}
                                </div>

                                {supplier && !supplierPickerOpen ? (
                                    <div className="po-supplier">
                                        <Avatar name={supplier.name} size={56} square />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h3 className="po-supplier__name">{supplier.name}</h3>
                                                {supplier.linkedStoreId && <Icon name="verified" size={18} fill={1} className="po-supplier__verified" />}
                                            </div>
                                            {supplier.address && <p className="po-supplier__addr">{supplier.address}</p>}
                                            <div className="po-supplier__contacts">
                                                {supplier.phone && <span><Icon name="call" size={16} /> {supplier.phone}</span>}
                                                {supplier.email && <span><Icon name="mail" size={16} /> {supplier.email}</span>}
                                            </div>
                                        </div>
                                        {supplier.paymentTerms && <span className="crm-badge crm-badge--silver">{supplier.paymentTerms}</span>}
                                    </div>
                                ) : (
                                    <div className="po-picker">
                                        {suppliers.length === 0 ? (
                                            <p className="crm-input-group__hint" style={{ padding: 8 }}>No suppliers yet — add one in the Suppliers tab first.</p>
                                        ) : suppliers.map(s => (
                                            <button key={s.id} type="button" className={`po-picker__row${s.id === po.supplierId ? ' is-active' : ''}`} onClick={() => selectSupplier(s)}>
                                                <Avatar name={s.name} size={40} square />
                                                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                                                    <p className="po-picker__name">{s.name}</p>
                                                    <p className="po-picker__meta">{s.contactPerson || s.email || 'Supplier'}</p>
                                                </div>
                                                {s.id === po.supplierId && <Icon name="check_circle" size={20} fill={1} className="po-picker__check" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Items */}
                            <section style={{ marginBottom: 32 }}>
                                <div className="po-sec-head">
                                    <h2 className="crm-form-section__title">Order Items</h2>
                                    <button type="button" className="crm-btn crm-btn--primary" disabled={!po.supplierId} onClick={() => setItemPickerOpen(o => !o)} style={{ opacity: po.supplierId ? 1 : 0.5, padding: '8px 16px' }}>
                                        <Icon name="add" size={20} /> Add Item
                                    </button>
                                </div>

                                {po.supplierId && suggested.length > 0 && (
                                    <button type="button" className="po-suggest" onClick={addAllSuggested}>
                                        <Icon name="auto_awesome" size={18} fill={1} />
                                        <span>{suggested.length} product{suggested.length === 1 ? '' : 's'} below reorder point — tap to add suggested quantities.</span>
                                        <Icon name="add_circle" size={20} />
                                    </button>
                                )}

                                {itemPickerOpen && (
                                    <div className="po-picker" style={{ marginBottom: 16 }}>
                                        <div className="crm-search" style={{ marginBottom: 8 }}>
                                            <Icon name="search" size={20} />
                                            <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products to add..." />
                                        </div>
                                        {availableProducts.length === 0 ? (
                                            <p className="crm-input-group__hint" style={{ padding: 8 }}>{po.supplierId ? 'No more products from this supplier.' : 'Select a supplier first.'}</p>
                                        ) : availableProducts.slice(0, 40).map(p => (
                                            <button key={p.id} type="button" className="po-picker__row" onClick={() => { addProductToPO(p); setProductSearch(''); }}>
                                                <span className="po-picker__thumb"><Icon name="inventory_2" size={20} /></span>
                                                <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                                                    <p className="po-picker__name">{p.name}</p>
                                                    <p className="po-picker__meta">SKU {p.sku} · {formatMoney(num(p.costPrice), storeSettings)} cost</p>
                                                </div>
                                                <Icon name="add" size={20} className="po-picker__check" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {po.items.length === 0 ? (
                                    <div className="crm-empty" style={{ padding: '40px 16px', background: 'var(--c-surface-low)', borderRadius: 'var(--c-radius-lg)' }}>
                                        <Icon name="inventory_2" size={36} />
                                        <p className="crm-empty__text">{po.supplierId ? 'No items yet. Tap “Add Item”.' : 'Pick a supplier, then add items.'}</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {po.items.map(it => (
                                            <div key={it.productId} className="po-item">
                                                <div className="po-item__id">
                                                    <span className="po-item__thumb"><Icon name="inventory_2" size={22} /></span>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p className="po-item__name">{it.productName}</p>
                                                        <p className="po-item__sku">SKU: {it.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="po-item__fields">
                                                    <label className="po-field">
                                                        <span>Quantity</span>
                                                        <input type="number" min={0} value={it.quantity} onChange={e => updateItem(it.productId, 'quantity', parseFloat(e.target.value) || 0)} />
                                                    </label>
                                                    <label className="po-field">
                                                        <span>Unit Cost</span>
                                                        <div className="po-field__money"><i>{sym}</i><input type="number" min={0} step="0.01" value={it.costPrice} onChange={e => updateItem(it.productId, 'costPrice', parseFloat(e.target.value) || 0)} /></div>
                                                    </label>
                                                    <div className="po-item__total">
                                                        <span>Total</span>
                                                        <p>{formatMoney(num(it.quantity) * num(it.costPrice), storeSettings)}</p>
                                                    </div>
                                                    <button type="button" className="crm-iconbtn" aria-label="Remove item" style={{ color: 'var(--c-error)' }} onClick={() => removeItem(it.productId)}>
                                                        <Icon name="delete" size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Summary */}
                            {po.items.length > 0 && (
                                <section className="po-summary">
                                    <div className="po-summary__head"><Icon name="analytics" size={22} /> <h2 className="crm-form-section__title" style={{ margin: 0 }}>Order Summary</h2></div>
                                    <div className="po-summary__rows">
                                        <div className="po-summary__row"><span>Total Items</span><b>{totalUnits} Units</b></div>
                                        <div className="po-summary__row"><span>Subtotal</span><b>{formatMoney(po.subtotal, storeSettings)}</b></div>
                                        <div className="po-summary__row"><span>Tax / VAT ({num(storeSettings.taxRate)}%)</span><b>{formatMoney(po.tax, storeSettings)}</b></div>
                                    </div>
                                    <div className="po-summary__grand"><span>Grand Total</span><b>{formatMoney(po.total, storeSettings)}</b></div>
                                </section>
                            )}
                        </>
                    ) : (
                        /* Review */
                        <section>
                            <h2 className="crm-form-section__title" style={{ marginBottom: 16 }}>Review &amp; confirm</h2>
                            <div className="po-supplier" style={{ marginBottom: 20 }}>
                                <Avatar name={supplier?.name || '?'} size={48} square />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 className="po-supplier__name">{supplier?.name || 'No supplier'}</h3>
                                    <p className="po-supplier__addr">{po.items.length} line{po.items.length === 1 ? '' : 's'} · {totalUnits} units</p>
                                </div>
                            </div>

                            <div className="crm-form-section" style={{ gap: 14 }}>
                                {po.items.map(it => (
                                    <div key={it.productId} className="po-review-row">
                                        <div style={{ minWidth: 0 }}>
                                            <p className="po-item__name">{it.productName}</p>
                                            <p className="po-item__sku">{it.quantity} × {formatMoney(num(it.costPrice), storeSettings)}</p>
                                        </div>
                                        <b>{formatMoney(num(it.quantity) * num(it.costPrice), storeSettings)}</b>
                                    </div>
                                ))}
                            </div>

                            <div className="crm-input-group" style={{ marginTop: 20 }}>
                                <label className="crm-input-group__label">Expected delivery (optional)</label>
                                <input type="date" className="crm-input" value={po.expectedAt ? po.expectedAt.slice(0, 10) : ''} onChange={e => setPo(prev => ({ ...prev, expectedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
                            </div>
                            <div className="crm-input-group" style={{ marginTop: 16 }}>
                                <label className="crm-input-group__label">Notes (optional)</label>
                                <textarea className="crm-input" rows={3} value={po.notes || ''} onChange={e => setPo(prev => ({ ...prev, notes: e.target.value }))} placeholder="Delivery instructions, references..." />
                            </div>

                            <section className="po-summary" style={{ marginTop: 24 }}>
                                <div className="po-summary__rows">
                                    <div className="po-summary__row"><span>Subtotal</span><b>{formatMoney(po.subtotal, storeSettings)}</b></div>
                                    <div className="po-summary__row"><span>Tax / VAT ({num(storeSettings.taxRate)}%)</span><b>{formatMoney(po.tax, storeSettings)}</b></div>
                                </div>
                                <div className="po-summary__grand"><span>Grand Total</span><b>{formatMoney(po.total, storeSettings)}</b></div>
                            </section>
                        </section>
                    )}
                </div>
            </div>

            <footer className="crm-form-foot">
                <div className="crm-form-foot__inner" style={{ justifyContent: 'space-between' }}>
                    <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '14px 22px' }} onClick={step === 'review' ? () => setStep('build') : onCancel}>
                        {step === 'review' ? 'Back' : 'Discard'}
                    </button>
                    {step === 'build' ? (
                        <button type="button" className="crm-btn crm-btn--primary" disabled={!canContinue} style={{ opacity: canContinue ? 1 : 0.5, padding: '14px 28px' }} onClick={() => setStep('review')}>
                            Continue to Review <Icon name="arrow_forward" size={20} />
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" className="crm-btn crm-btn--outline" style={{ padding: '14px 22px' }} onClick={() => save(false)}>Save Draft</button>
                            <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '14px 26px' }} onClick={() => save(true)}>
                                <Icon name="check" size={20} /> Place Order
                            </button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default ProcureOrderForm;
