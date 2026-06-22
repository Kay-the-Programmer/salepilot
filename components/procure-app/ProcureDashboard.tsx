import React from 'react';
import { StoreSettings } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { formatMoney, formatDate } from '../crm/crmModel';
import { ProcureOverview, poStatus } from './procureModel';

interface ProcureDashboardProps {
    overview: ProcureOverview;
    storeSettings?: StoreSettings | null;
    reorderCount?: number;
    onNewOrder: () => void;
    onViewSuppliers: () => void;
    onViewOrders: () => void;
    onAutoReorder: () => void;
    autoReorderEntitled?: boolean;
}

export const ProcureDashboard: React.FC<ProcureDashboardProps> = ({ overview, storeSettings, reorderCount = 0, onNewOrder, onViewSuppliers, onViewOrders, onAutoReorder, autoReorderEntitled = false }) => {
    const {
        totalSuppliers, openOrders, openOrdersValue, awaitingReceiptOrders, awaitingReceiptItems,
        payable, overdueCount, overdueAmount, recentOrders, topSuppliers,
    } = overview;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="crm-pagehead__title">Procurement Overview</h2>
                    <p className="crm-pagehead__sub">Track suppliers, purchase orders and what you owe.</p>
                </div>
                <button className="crm-btn crm-btn--primary" type="button" onClick={onNewOrder}>
                    <Icon name="add" size={20} /> New Purchase Order
                </button>
            </div>

            {/* Metrics */}
            <div className="proc-metrics">
                <button type="button" className="proc-metric" onClick={onViewSuppliers} style={{ cursor: 'pointer', textAlign: 'left' }}>
                    <span className="proc-metric__icon proc-metric__icon--t"><Icon name="local_shipping" size={24} /></span>
                    <div>
                        <p className="proc-metric__label">Suppliers</p>
                        <p className="proc-metric__value">{totalSuppliers.toLocaleString()}</p>
                    </div>
                </button>
                <button type="button" className="proc-metric" onClick={onViewOrders} style={{ cursor: 'pointer', textAlign: 'left' }}>
                    <span className="proc-metric__icon proc-metric__icon--p"><Icon name="receipt_long" size={24} /></span>
                    <div>
                        <p className="proc-metric__label">Open Orders</p>
                        <p className="proc-metric__value">{openOrders.toLocaleString()}</p>
                        <p className="proc-metric__sub">{formatMoney(openOrdersValue, storeSettings)} committed</p>
                    </div>
                </button>
                <button type="button" className="proc-metric" onClick={onViewOrders} style={{ cursor: 'pointer', textAlign: 'left' }}>
                    <span className="proc-metric__icon proc-metric__icon--s"><Icon name="pending_actions" size={24} /></span>
                    <div>
                        <p className="proc-metric__label">Awaiting Receipt</p>
                        <p className="proc-metric__value">{awaitingReceiptItems.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--c-outline)' }}>units</span></p>
                        <p className="proc-metric__sub">across {awaitingReceiptOrders} order{awaitingReceiptOrders === 1 ? '' : 's'}</p>
                    </div>
                </button>
                <div className="proc-metric">
                    <span className={`proc-metric__icon ${overdueAmount > 0 ? 'proc-metric__icon--e' : 'proc-metric__icon--p'}`}><Icon name="account_balance_wallet" size={24} /></span>
                    <div>
                        <p className="proc-metric__label">Payable</p>
                        <p className="proc-metric__value">{formatMoney(payable, storeSettings)}</p>
                        <p className="proc-metric__sub">{overdueCount > 0 ? `${formatMoney(overdueAmount, storeSettings)} overdue` : 'nothing overdue'}</p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="crm-grid12">
                <div className="crm-col-7">
                    <div className="crm-panel">
                        <div className="crm-panel__head">
                            <h3 className="crm-panel__title">Recent Purchase Orders</h3>
                            <button className="crm-link" type="button" onClick={onViewOrders}>View all</button>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="crm-empty" style={{ padding: '40px 16px' }}>
                                <Icon name="receipt_long" size={36} />
                                <p className="crm-empty__text">No purchase orders yet.</p>
                                <button className="crm-btn crm-btn--primary" type="button" onClick={onNewOrder} style={{ marginTop: 8 }}>
                                    <Icon name="add" size={20} /> Create one
                                </button>
                            </div>
                        ) : (
                            <div className="proc-list">
                                {recentOrders.map(po => {
                                    const st = poStatus(po.status);
                                    const itemCount = (po.items || []).length;
                                    return (
                                        <div key={po.id} className="proc-po">
                                            <span className="proc-po__icon"><Icon name="inventory_2" size={22} /></span>
                                            <div className="proc-po__body">
                                                <p className="proc-po__no">{po.poNumber || `PO ${po.id.slice(-5)}`}</p>
                                                <p className="proc-po__meta">{po.supplierName || 'Supplier'} · {itemCount} line{itemCount === 1 ? '' : 's'} · {formatDate(po.createdAt)}</p>
                                            </div>
                                            <div className="proc-po__right">
                                                <p className="proc-po__total">{formatMoney(po.total, storeSettings)}</p>
                                                <span className={`proc-status proc-status--${st.tone}`}>{st.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="crm-col-5">
                    <div className="crm-panel crm-panel__pad" style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <h3 className="crm-panel__title">Top Suppliers</h3>
                            <p className="crm-panel__sub">By total order value</p>
                        </div>
                        {topSuppliers.length === 0 ? (
                            <div className="crm-empty" style={{ padding: '24px 16px' }}>
                                <Icon name="local_shipping" size={32} />
                                <p className="crm-empty__text">No supplier spend yet.</p>
                            </div>
                        ) : (
                            <div>
                                {topSuppliers.map((s, i) => (
                                    <div key={s.supplierId} className="proc-sup">
                                        <span className="proc-sup__rank">{i + 1}</span>
                                        <Avatar name={s.name} size={36} square />
                                        <div className="proc-sup__name">
                                            {s.name}
                                            <div className="proc-sup__count">{s.orderCount} order{s.orderCount === 1 ? '' : 's'}</div>
                                        </div>
                                        <span className="proc-sup__spend">{formatMoney(s.spend, storeSettings)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="proc-alert proc-alert--receive">
                            <div className="proc-alert__left">
                                <span className="proc-alert__icon" style={{ background: 'var(--c-primary)', color: '#fff' }}><Icon name="auto_awesome" size={22} fill={1} /></span>
                                <div>
                                    <p className="proc-alert__title">Smart Reorder {!autoReorderEntitled && <span className="crm-badge crm-badge--gold" style={{ marginLeft: 4, padding: '1px 7px', fontSize: 10 }}>Premium</span>}</p>
                                    <p className="proc-alert__text">
                                        {reorderCount > 0
                                            ? `${reorderCount} item${reorderCount === 1 ? '' : 's'} at or below reorder point.`
                                            : 'Stock is healthy — nothing to reorder.'}
                                    </p>
                                </div>
                            </div>
                            {reorderCount > 0 && (
                                <button className="crm-btn crm-btn--primary" type="button" onClick={onAutoReorder} style={{ padding: '8px 14px', fontSize: 13 }}>
                                    {autoReorderEntitled ? 'Generate' : <><Icon name="lock" size={16} /> Unlock</>}
                                </button>
                            )}
                        </div>

                        <div className="proc-alert proc-alert--receive">
                            <div className="proc-alert__left">
                                <span className="proc-alert__icon"><Icon name="local_shipping" size={22} /></span>
                                <div>
                                    <p className="proc-alert__title">{awaitingReceiptOrders > 0 ? 'Awaiting delivery' : 'Nothing inbound'}</p>
                                    <p className="proc-alert__text">
                                        {awaitingReceiptOrders > 0
                                            ? `${awaitingReceiptItems} unit${awaitingReceiptItems === 1 ? '' : 's'} across ${awaitingReceiptOrders} order${awaitingReceiptOrders === 1 ? '' : 's'}.`
                                            : 'No orders are awaiting receipt.'}
                                    </p>
                                </div>
                            </div>
                            {awaitingReceiptOrders > 0 && (
                                <button className="crm-btn crm-btn--tonal" type="button" onClick={onViewOrders} style={{ padding: '8px 14px', fontSize: 13 }}>Receive</button>
                            )}
                        </div>

                        {overdueCount > 0 && (
                            <div className="proc-alert proc-alert--due">
                                <div className="proc-alert__left">
                                    <span className="proc-alert__icon"><Icon name="schedule" size={22} fill={1} /></span>
                                    <div>
                                        <p className="proc-alert__title">Payments due</p>
                                        <p className="proc-alert__text">{overdueCount} invoice{overdueCount === 1 ? '' : 's'} · {formatMoney(overdueAmount, storeSettings)} overdue.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button className="crm-fab" type="button" aria-label="New purchase order" onClick={onNewOrder}>
                <Icon name="add" size={26} />
            </button>
        </main>
    );
};

export default ProcureDashboard;
