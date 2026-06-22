import React, { useMemo } from 'react';
import { Supplier, Product, PurchaseOrder, SupplierInvoice, StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { num, formatMoney, formatDate } from '../crm/crmModel';
import { OPEN_STATUSES, poStatus } from './procureModel';

interface ProcureSupplierProfileProps {
    supplier: Supplier;
    products: Product[];           // all products (filtered here)
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    storeSettings?: StoreSettings | null;
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPlaceOrder: () => void;
}

const stockBadge = (stock: number, reorder: number) => {
    if (stock <= 0) return { label: 'Out of stock', cls: 'proc-prod__badge--out' };
    if (reorder > 0 && stock <= reorder) return { label: 'Low Stock', cls: 'proc-prod__badge--low' };
    return { label: 'In Stock', cls: 'proc-prod__badge--in' };
};

export const ProcureSupplierProfile: React.FC<ProcureSupplierProfileProps> = ({
    supplier, products, purchaseOrders, supplierInvoices, storeSettings, onBack, onEdit, onDelete, onPlaceOrder,
}) => {
    const s = supplier;

    const m = useMemo(() => {
        const pos = purchaseOrders.filter(po => po.supplierId === s.id);
        const invoices = supplierInvoices.filter(inv => inv.supplierId === s.id);
        const supProducts = products.filter(p => p.supplierId === s.id && p.status !== 'archived');

        const totalOrdered = pos.reduce((sum, po) => sum + num(po.total), 0);
        const orderCount = pos.length;
        const openCount = pos.filter(po => OPEN_STATUSES.includes(po.status)).length;

        let itemsOrdered = 0;
        let itemsReceived = 0;
        for (const po of pos) for (const it of po.items || []) { itemsOrdered += num(it.quantity); itemsReceived += num(it.receivedQuantity); }
        const fulfillRate = itemsOrdered > 0 ? Math.round((itemsReceived / itemsOrdered) * 100) : 0;
        const avgOrder = orderCount > 0 ? totalOrdered / orderCount : 0;

        let payable = 0; let overdue = 0;
        for (const inv of invoices) {
            const bal = Math.max(0, num(inv.amount) - num(inv.amountPaid));
            if (inv.status === 'paid' || bal <= 0) continue;
            payable += bal;
            const due = inv.dueDate ? new Date(inv.dueDate).getTime() : 0;
            if (inv.status === 'overdue' || (due && due < Date.now())) overdue += bal;
        }

        const currentOrders = [...pos]
            .sort((a, b) => {
                const ao = OPEN_STATUSES.includes(a.status) ? 0 : 1;
                const bo = OPEN_STATUSES.includes(b.status) ? 0 : 1;
                if (ao !== bo) return ao - bo;
                return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
            })
            .slice(0, 4);

        return { pos, supProducts, totalOrdered, orderCount, openCount, fulfillRate, avgOrder, payable, overdue, currentOrders };
    }, [s.id, purchaseOrders, supplierInvoices, products]);

    return (
        <main className="crm-main crm-section-fade">
            <nav className="crm-crumbs">
                <button type="button" onClick={onBack}>Suppliers</button>
                <Icon name="chevron_right" size={18} />
                <span className="crm-crumbs__current">{s.name}</span>
            </nav>

            {/* Header */}
            <div className="proc-prof-head">
                <div className="proc-prof-id">
                    <div className="proc-prof-logo"><Avatar name={s.name} size={128} square /></div>
                    <div style={{ minWidth: 0 }}>
                        <div className="proc-prof-badges">
                            {s.linkedStoreId
                                ? <span className="crm-badge crm-badge--platinum"><Icon name="verified" size={14} fill={1} /> SalePilot Partner</span>
                                : <span className="crm-badge crm-badge--gold"><Icon name="handshake" size={14} fill={1} /> Supplier</span>}
                            {s.paymentTerms && <span className="crm-badge crm-badge--silver">{s.paymentTerms}</span>}
                        </div>
                        <h2 className="proc-prof-name">{s.name}</h2>
                        <div className="proc-prof-meta">
                            {s.address && <span><Icon name="location_on" size={18} /> {s.address}</span>}
                            {s.contactPerson && <span><Icon name="person" size={18} /> {s.contactPerson}</span>}
                            <span className="is-accent"><Icon name="receipt_long" size={18} /> {m.orderCount} order{m.orderCount === 1 ? '' : 's'}</span>
                        </div>
                    </div>
                </div>
                <div className="proc-prof-actions">
                    <button type="button" className="crm-btn crm-btn--outline" onClick={onEdit}>
                        <Icon name="edit" size={20} /> Edit Profile
                    </button>
                    <button type="button" className="crm-btn crm-btn--primary" onClick={onPlaceOrder}>
                        <Icon name="add_shopping_cart" size={20} /> Place Order
                    </button>
                </div>
            </div>

            {/* Performance overview (real metrics) */}
            <section>
                <h3 className="proc-section-title"><Icon name="analytics" size={24} /> Performance Overview</h3>
                <div className="proc-bento">
                    <div className="proc-stat-card">
                        <span className="proc-stat-card__label">Total Ordered</span>
                        <span className="proc-stat-card__value proc-stat-card__value--p">{formatMoney(m.totalOrdered, storeSettings)}</span>
                        <span className="proc-stat-card__sub">{m.orderCount} order{m.orderCount === 1 ? '' : 's'} all time</span>
                    </div>
                    <div className="proc-stat-card">
                        <span className="proc-stat-card__label">Items Received</span>
                        <span className="proc-stat-card__value">{m.fulfillRate}<small>%</small></span>
                        <div className="proc-stat-card__bar"><div style={{ width: `${m.fulfillRate}%` }} /></div>
                    </div>
                    <div className="proc-stat-card">
                        <span className="proc-stat-card__label">Avg. Order Value</span>
                        <span className="proc-stat-card__value">{formatMoney(m.avgOrder, storeSettings)}</span>
                        <span className="proc-stat-card__sub">{m.openCount} open order{m.openCount === 1 ? '' : 's'}</span>
                    </div>
                    <div className="proc-stat-card">
                        <span className="proc-stat-card__label">Outstanding</span>
                        <span className={`proc-stat-card__value ${m.overdue > 0 ? 'proc-stat-card__value--e' : 'proc-stat-card__value--p'}`}>{formatMoney(m.payable, storeSettings)}</span>
                        <span className="proc-stat-card__sub">{m.overdue > 0 ? `${formatMoney(m.overdue, storeSettings)} overdue` : 'Nothing overdue'}</span>
                    </div>
                </div>
            </section>

            {/* Orders + catalog */}
            <div className="proc-prof-cols">
                <div>
                    <div className="proc-col-head">
                        <h3 className="proc-section-title" style={{ margin: 0 }}><Icon name="receipt_long" size={22} /> Current Orders</h3>
                        <button className="crm-link" type="button" onClick={onPlaceOrder}>View All</button>
                    </div>
                    {m.currentOrders.length === 0 ? (
                        <div className="crm-empty" style={{ padding: '40px 16px', background: 'var(--c-surface-low)', borderRadius: 'var(--c-radius-lg)' }}>
                            <Icon name="receipt_long" size={36} />
                            <p className="crm-empty__text">No purchase orders with this supplier yet.</p>
                        </div>
                    ) : m.currentOrders.map(po => {
                        const st = poStatus(po.status);
                        const first = po.items?.[0];
                        const count = (po.items || []).reduce((n, it) => n + num(it.quantity), 0);
                        return (
                            <div key={po.id} className="proc-order">
                                <div className="proc-order__top">
                                    <span className="proc-order__no">{po.poNumber || `PO ${po.id.slice(-5)}`}</span>
                                    <span className={`proc-status proc-status--${st.tone}`}>{st.label}</span>
                                </div>
                                <p className="proc-order__items">{count} item{count === 1 ? '' : 's'}{first ? ` · ${first.productName}` : ''}</p>
                                <div className="proc-order__foot">
                                    <span className="proc-order__total">{formatMoney(po.total, storeSettings)}</span>
                                    <span className="proc-order__date">{po.expectedAt ? `Est. ${formatDate(po.expectedAt)}` : formatDate(po.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div>
                    <div className="proc-col-head">
                        <h3 className="proc-section-title" style={{ margin: 0 }}><Icon name="inventory_2" size={22} /> Supplier Catalog</h3>
                        <span className="crm-panel__sub">{m.supProducts.length} product{m.supProducts.length === 1 ? '' : 's'}</span>
                    </div>
                    {m.supProducts.length === 0 ? (
                        <div className="crm-empty" style={{ padding: '48px 16px', background: 'var(--c-surface-low)', borderRadius: 'var(--c-radius-lg)' }}>
                            <Icon name="inventory_2" size={40} />
                            <p className="crm-empty__text">No products are linked to this supplier yet.</p>
                        </div>
                    ) : (
                        <div className="proc-cat-grid">
                            {m.supProducts.slice(0, 12).map(p => {
                                const stock = num(p.stock);
                                const badge = stockBadge(stock, num(p.reorderPoint));
                                return (
                                    <div key={p.id} className="proc-prod">
                                        <div className="proc-prod__img">
                                            {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} alt={p.name} /> : <Icon name="inventory_2" size={40} />}
                                            <span className={`proc-prod__badge ${badge.cls}`}>{badge.label}</span>
                                        </div>
                                        <div className="proc-prod__body">
                                            <h4 className="proc-prod__name">{p.name}</h4>
                                            <p className="proc-prod__desc">{p.description || `SKU ${p.sku}`}</p>
                                            <div className="proc-prod__foot">
                                                <span className="proc-prod__price">
                                                    {formatMoney(num(p.costPrice) > 0 ? num(p.costPrice) : num(p.price), storeSettings)}
                                                    <small> /unit</small>
                                                </span>
                                                <button type="button" className="proc-prod__add" aria-label={`Order ${p.name}`} title="Add to a purchase order" onClick={onPlaceOrder}>
                                                    <Icon name="add" size={22} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Danger zone */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 36 }}>
                <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-error)' }} onClick={onDelete}>
                    <Icon name="delete" size={20} /> Delete supplier
                </button>
            </div>
        </main>
    );
};

export default ProcureSupplierProfile;
