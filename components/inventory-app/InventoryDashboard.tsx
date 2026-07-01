import React from 'react';
import { StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney, timeAgo } from '../crm/crmModel';
import { InventoryOverview } from './inventoryModel';

interface InventoryDashboardProps {
    overview: InventoryOverview;
    storeSettings?: StoreSettings | null;
    onAddItem: () => void;
    onViewItems: () => void;
    onViewAlerts: () => void;
    onGeneratePO: () => void;
    onNotify: (msg: string) => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ overview, storeSettings, onAddItem, onViewItems, onViewAlerts }) => {
    const { totalValue, totalSkus, totalUnits, lowStockCount, criticalCount, activity, categories, topMover } = overview;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="crm-pagehead__title">Inventory Overview</h2>
                    <p className="crm-pagehead__sub">Manage and monitor your shop's assets in real-time.</p>
                </div>
                <button className="crm-btn crm-btn--primary" type="button" onClick={onAddItem}>
                    <Icon name="add" size={20} /> Add New Item
                </button>
            </div>

            {/* Bento metrics */}
            <div className="inv-metrics">
                <div className="inv-metric">
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon inv-metric__icon--p"><Icon name="payments" size={24} /></span>
                        <span className="inv-metric__chip inv-metric__chip--p">{totalUnits.toLocaleString()} units</span>
                    </div>
                    <div>
                        <p className="inv-metric__label">Total Value</p>
                        <p className="inv-metric__value">{formatMoney(totalValue, storeSettings)}</p>
                    </div>
                </div>

                <div className="inv-metric">
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon inv-metric__icon--s"><Icon name="inventory" size={24} /></span>
                    </div>
                    <div>
                        <p className="inv-metric__label">Total Items</p>
                        <p className="inv-metric__value">{totalSkus.toLocaleString()} <small>SKUs</small></p>
                    </div>
                </div>

                <button type="button" className="inv-metric inv-metric--alert" onClick={onViewAlerts} style={{ cursor: 'pointer', textAlign: 'left' }}>
                    <div className="inv-metric__top">
                        <span className="inv-metric__icon inv-metric__icon--e"><Icon name="warning" size={24} fill={1} /></span>
                        {lowStockCount > 0 && <span className="inv-metric__chip inv-metric__chip--e">Action Needed</span>}
                    </div>
                    <div>
                        <p className="inv-metric__label">Low Stock Count</p>
                        <p className="inv-metric__value">{lowStockCount.toLocaleString()} <small>Items</small></p>
                    </div>
                </button>
            </div>

            {/* Activity + alerts */}
            <div className="inv-cols">
                <div>
                    <div className="inv-col-head">
                        <h3>Recent Activity</h3>
                        <button className="crm-link" type="button" onClick={onViewItems}>View All History</button>
                    </div>
                    <div className="crm-panel">
                        {activity.length === 0 ? (
                            <div className="crm-empty" style={{ padding: '40px 16px' }}>
                                <Icon name="history" size={36} />
                                <p className="crm-empty__text">No stock movements yet. Sales and received orders will show here.</p>
                            </div>
                        ) : (
                            <div className="crm-activity">
                                {activity.map(a => (
                                    <div key={a.id} className="crm-activity__row" style={{ cursor: 'default' }}>
                                        <span className="inv-thumb">
                                            {a.image ? <img src={a.image} alt={a.name} /> : <Icon name="inventory_2" size={22} />}
                                        </span>
                                        <div className="crm-activity__body">
                                            <p className="crm-activity__name">{a.name}</p>
                                            <p className="crm-activity__meta">{a.who} · {timeAgo(a.ts)}</p>
                                        </div>
                                        <div className="crm-activity__right">
                                            <p className={`inv-delta ${a.kind === 'in' ? 'inv-delta--in' : 'inv-delta--out'}`}>
                                                {a.delta > 0 ? '+' : ''}{a.delta} units
                                            </p>
                                            <p className="crm-activity__time">{a.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="inv-side">
                    <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Inventory Alerts</h3>

                    <div className="inv-alert">
                        <span className="inv-alert__icon"><Icon name="trending_down" size={24} /></span>
                        <div>
                            <p className="inv-alert__title">{criticalCount > 0 ? 'Critical Low Stock' : 'Stock levels healthy'}</p>
                            <p className="inv-alert__text">
                                {criticalCount > 0
                                    ? `${criticalCount} item${criticalCount === 1 ? '' : 's'} reaching critical levels.`
                                    : 'Nothing needs restocking right now.'}
                            </p>
                        </div>
                    </div>

                    <div className="inv-insight">
                        <span className="inv-insight__ghost"><Icon name="lightbulb" size={120} fill={1} /></span>
                        <p className="inv-insight__title">Smart Insights</p>
                        <p className="inv-insight__text">
                            {topMover
                                ? `"${topMover.name}" is moving fast (${topMover.units} sold recently). Consider increasing stock levels.`
                                : 'Record some sales to unlock stock recommendations.'}
                        </p>
                        <button className="inv-insight__btn" type="button" onClick={onViewItems}>
                            {topMover ? 'Review item' : 'View items'}
                        </button>
                    </div>

                    <div className="inv-cat">
                        <p className="inv-cat__title">Top Categories</p>
                        {categories.length === 0 ? (
                            <p className="crm-empty__text" style={{ textAlign: 'left' }}>No categories with stock value yet.</p>
                        ) : categories.map(c => (
                            <div className="inv-cat__row" key={c.id}>
                                <div className="inv-cat__line">
                                    <span>{c.name}</span>
                                    <b>{c.pct}%</b>
                                </div>
                                <div className="inv-cat__track"><div className="inv-cat__fill" style={{ width: `${c.pct}%` }} /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button className="crm-fab" type="button" aria-label="Add item" onClick={onAddItem}>
                <Icon name="add" size={26} />
            </button>
        </main>
    );
};

export default InventoryDashboard;
