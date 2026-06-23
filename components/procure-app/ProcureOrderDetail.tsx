import React, { useMemo } from 'react';
import { PurchaseOrder, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { num, formatMoney, formatDate } from '../crm/crmModel';
import { poStatus, OPEN_STATUSES } from './procureModel';
import { useConfirm } from '../ui/useConfirm';

interface ProcureOrderDetailProps {
    po: PurchaseOrder;
    storeSettings?: StoreSettings | null;
    onBack: () => void;
    onEdit: () => void;
    onReceive: () => void;
    onUpdateStatus: (status: PurchaseOrder['status']) => void;
    onDelete: () => void;
}

const STEPS: { id: PurchaseOrder['status']; label: string }[] = [
    { id: 'draft', label: 'Draft' },
    { id: 'ordered', label: 'Ordered' },
    { id: 'partially_received', label: 'Receiving' },
    { id: 'received', label: 'Received' },
];

export const ProcureOrderDetail: React.FC<ProcureOrderDetailProps> = ({ po, storeSettings, onBack, onEdit, onReceive, onUpdateStatus, onDelete }) => {
    const st = poStatus(po.status);
    const { confirm, confirmDialog } = useConfirm();

    const m = useMemo(() => {
        let ordered = 0, received = 0;
        for (const it of po.items || []) { ordered += num(it.quantity); received += num(it.receivedQuantity); }
        return { ordered, received, pct: ordered > 0 ? Math.round((received / ordered) * 100) : 0 };
    }, [po.items]);

    const canPlace = po.status === 'draft';
    const canReceive = OPEN_STATUSES.includes(po.status) && po.status !== 'draft';
    const canCancel = po.status !== 'received' && po.status !== 'canceled';
    const stepIndex = po.status === 'canceled' ? -1 : STEPS.findIndex(s => s.id === po.status);

    const cancel = async () => {
        const ok = await confirm({
            title: `Cancel ${po.poNumber}?`,
            message: 'The order will be marked canceled and its items will not be received.',
            confirmLabel: 'Cancel order',
            cancelLabel: 'Keep order',
            danger: true,
        });
        if (ok) onUpdateStatus('canceled');
    };

    return (
        <main className="crm-main crm-section-fade">
            <nav className="crm-crumbs">
                <button type="button" onClick={onBack}>Orders</button>
                <Icon name="chevron_right" size={18} />
                <span className="crm-crumbs__current">{po.poNumber}</span>
            </nav>

            {/* Header */}
            <div className="proc-prof-head" style={{ marginBottom: 28 }}>
                <div className="proc-prof-id">
                    <div className="proc-prof-logo" style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-surface-high)', color: 'var(--c-primary)' }}>
                        <Icon name="receipt_long" size={34} fill={1} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div className="proc-prof-badges">
                            <span className={`proc-status proc-status--${st.tone}`}>{st.label}</span>
                            {po.isMarketplaceOrder && <span className="crm-badge crm-badge--platinum"><Icon name="storefront" size={14} fill={1} /> Marketplace</span>}
                        </div>
                        <h2 className="proc-prof-name">{po.poNumber}</h2>
                        <div className="proc-prof-meta">
                            <span><Icon name="local_shipping" size={18} /> {po.supplierName || 'Supplier'}</span>
                            <span><Icon name="calendar_today" size={18} /> {formatDate(po.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="proc-prof-actions">
                    {po.status === 'received' ? (
                        <span className="crm-badge crm-badge--platinum" style={{ alignSelf: 'center' }}><Icon name="lock" size={14} fill={1} /> Received · locked</span>
                    ) : (
                        <button type="button" className="crm-btn crm-btn--outline" onClick={onEdit}><Icon name="edit" size={20} /> Edit</button>
                    )}
                    {canPlace && <button type="button" className="crm-btn crm-btn--primary" onClick={() => onUpdateStatus('ordered')}><Icon name="send" size={20} /> Place Order</button>}
                    {canReceive && <button type="button" className="crm-btn crm-btn--primary" onClick={onReceive}><Icon name="inventory" size={20} /> Receive Stock</button>}
                </div>
            </div>

            {/* Status timeline */}
            {po.status === 'canceled' ? (
                <div className="proc-alert proc-alert--due" style={{ marginBottom: 28 }}>
                    <div className="proc-alert__left">
                        <span className="proc-alert__icon"><Icon name="cancel" size={22} fill={1} /></span>
                        <div><p className="proc-alert__title">Order canceled</p><p className="proc-alert__text">This purchase order was canceled and won't be received.</p></div>
                    </div>
                </div>
            ) : (
                <div className="po-timeline">
                    {STEPS.map((s, i) => {
                        const done = stepIndex >= 0 && i <= stepIndex;
                        const active = i === stepIndex;
                        return (
                            <React.Fragment key={s.id}>
                                <div className={`po-timeline__step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
                                    <span className="po-timeline__dot"><Icon name={done ? 'check' : 'radio_button_unchecked'} size={16} fill={done ? 1 : 0} /></span>
                                    <span className="po-timeline__label">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && <span className={`po-timeline__bar${stepIndex > i ? ' is-done' : ''}`} />}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Meta cards */}
            <div className="proc-metrics" style={{ marginBottom: 28 }}>
                <div className="proc-metric"><span className="proc-metric__icon proc-metric__icon--t"><Icon name="event" size={22} /></span><div><p className="proc-metric__label">Expected</p><p className="proc-metric__value" style={{ fontSize: 20 }}>{po.expectedAt ? formatDate(po.expectedAt) : '—'}</p></div></div>
                <div className="proc-metric"><span className="proc-metric__icon proc-metric__icon--p"><Icon name="inventory_2" size={22} /></span><div><p className="proc-metric__label">Items received</p><p className="proc-metric__value" style={{ fontSize: 20 }}>{m.received} / {m.ordered}</p><p className="proc-metric__sub">{m.pct}% complete</p></div></div>
                <div className="proc-metric"><span className="proc-metric__icon proc-metric__icon--s"><Icon name="category" size={22} /></span><div><p className="proc-metric__label">Line items</p><p className="proc-metric__value" style={{ fontSize: 20 }}>{(po.items || []).length}</p></div></div>
                <div className="proc-metric"><span className="proc-metric__icon proc-metric__icon--p"><Icon name="payments" size={22} /></span><div><p className="proc-metric__label">Order total</p><p className="proc-metric__value" style={{ fontSize: 20 }}>{formatMoney(po.total, storeSettings)}</p></div></div>
            </div>

            {/* Items */}
            <div className="crm-panel" style={{ marginBottom: 24 }}>
                <div className="crm-panel__head">
                    <h3 className="crm-panel__title">Order items</h3>
                </div>
                <div className="crm-tablewrap">
                    <table className="crm-table">
                        <thead>
                            <tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit cost</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                            {(po.items || []).map(it => {
                                const qty = num(it.quantity); const rec = num(it.receivedQuantity);
                                const full = rec >= qty;
                                return (
                                    <tr key={it.productId}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="crm-table__primary">{it.productName}</span>
                                                <span className="crm-table__muted">SKU {it.sku}</span>
                                            </div>
                                        </td>
                                        <td>{qty}</td>
                                        <td>
                                            <span className={`crm-pill-status ${full ? 'crm-pill-status--ok' : 'crm-pill-status--due'}`}>{rec} / {qty}</span>
                                        </td>
                                        <td>{formatMoney(num(it.costPrice), storeSettings)}</td>
                                        <td className="crm-table__total">{formatMoney(qty * num(it.costPrice), storeSettings)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary + notes */}
            <div className="crm-grid12" style={{ marginBottom: 24 }}>
                {po.notes && (
                    <div className="crm-col-7">
                        <div className="crm-panel crm-panel__pad">
                            <h3 className="crm-panel__title" style={{ marginBottom: 8 }}>Notes</h3>
                            <p style={{ fontSize: 14, color: 'var(--c-on-surface-variant)', margin: 0, whiteSpace: 'pre-wrap' }}>{po.notes}</p>
                        </div>
                    </div>
                )}
                <div className={po.notes ? 'crm-col-5' : 'crm-col-7'}>
                    <section className="po-summary">
                        <div className="po-summary__rows">
                            <div className="po-summary__row"><span>Subtotal</span><b>{formatMoney(po.subtotal, storeSettings)}</b></div>
                            {num(po.shippingCost) > 0 && <div className="po-summary__row"><span>Shipping</span><b>{formatMoney(po.shippingCost, storeSettings)}</b></div>}
                            <div className="po-summary__row"><span>Tax / VAT</span><b>{formatMoney(po.tax, storeSettings)}</b></div>
                        </div>
                        <div className="po-summary__grand"><span>Grand Total</span><b>{formatMoney(po.total, storeSettings)}</b></div>
                    </section>
                </div>
            </div>

            {/* Status actions / danger */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>
                {canCancel && (
                    <button type="button" className="crm-btn crm-btn--outline" style={{ color: 'var(--c-error)', borderColor: 'var(--c-error)' }} onClick={cancel}>
                        <Icon name="cancel" size={20} /> Cancel order
                    </button>
                )}
                <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-error)' }} onClick={onDelete}>
                    <Icon name="delete" size={20} /> Delete
                </button>
            </div>

            {confirmDialog}
        </main>
    );
};

export default ProcureOrderDetail;
