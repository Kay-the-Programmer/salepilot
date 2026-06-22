import React from 'react';
import { StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney } from '../crm/crmModel';
import { DashboardOverview, DashPeriod, PERIOD_LABEL } from './dashboardModel';
import { DeltaChip } from './DashBits';

interface BizProductsProps {
    overview: DashboardOverview;
    storeSettings?: StoreSettings | null;
    period: DashPeriod;
    onPeriod: (p: DashPeriod) => void;
    onInventory: () => void;
}

export const BizProducts: React.FC<BizProductsProps> = ({ overview, storeSettings, period, onPeriod, onInventory }) => {
    const maxRev = overview.topProducts[0]?.revenue || 1;
    const alerts = overview.lowStockCount + overview.outOfStockCount;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Products · {PERIOD_LABEL[period]}</p>
                    <h2 className="crm-pagehead__title">Product Insights</h2>
                    <p className="crm-pagehead__sub">Best sellers and stock health at a glance.</p>
                </div>
                <div className="dash-segment" role="tablist" aria-label="Reporting period">
                    {(['today', 'week', 'month'] as DashPeriod[]).map(p => (
                        <button key={p} type="button" role="tab" aria-selected={period === p}
                            className={`dash-segment__btn${period === p ? ' is-active' : ''}`} onClick={() => onPeriod(p)}>
                            {p === 'today' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stock health strip */}
            <div className="dash-strip" style={{ marginBottom: 16 }}>
                <button type="button" className="dash-strip__item dash-strip__item--btn" onClick={onInventory}>
                    <span className={`dash-strip__icon ${overview.lowStockCount > 0 ? 'dash-strip__icon--s' : 'dash-strip__icon--p'}`}>
                        <Icon name="trending_down" size={22} />
                    </span>
                    <div>
                        <p className="dash-strip__value">{overview.lowStockCount.toLocaleString()}</p>
                        <p className="dash-strip__label">Low stock</p>
                    </div>
                </button>
                <button type="button" className="dash-strip__item dash-strip__item--btn" onClick={onInventory}>
                    <span className={`dash-strip__icon ${overview.outOfStockCount > 0 ? 'dash-strip__icon--e' : 'dash-strip__icon--p'}`}>
                        <Icon name="error" size={22} fill={1} />
                    </span>
                    <div>
                        <p className="dash-strip__value">{overview.outOfStockCount.toLocaleString()}</p>
                        <p className="dash-strip__label">Out of stock</p>
                    </div>
                </button>
                <div className="dash-strip__item">
                    <span className="dash-strip__icon dash-strip__icon--t"><Icon name="sell" size={22} /></span>
                    <div>
                        <p className="dash-strip__value">{overview.topProducts.reduce((n, p) => n + p.units, 0).toLocaleString()}</p>
                        <p className="dash-strip__label">Units sold (top 5)</p>
                    </div>
                </div>
            </div>

            <section className="crm-panel">
                <div className="crm-panel__head">
                    <div>
                        <h3 className="crm-panel__title">Top Selling Products</h3>
                        <p className="crm-panel__sub">Ranked by revenue this period</p>
                    </div>
                    <button className="crm-link" type="button" onClick={onInventory}>Manage inventory</button>
                </div>
                {overview.topProducts.length === 0 ? (
                    <div className="crm-empty" style={{ padding: '48px 16px' }}>
                        <Icon name="inventory_2" size={36} />
                        <p className="crm-empty__text">No product sales recorded in this period yet.</p>
                    </div>
                ) : (
                    <div className="dash-ranklist">
                        {overview.topProducts.map((p, i) => (
                            <div className="dash-rank" key={p.id}>
                                <span className="dash-rank__no">{i + 1}</span>
                                <span className="dash-product__art">
                                    {p.image ? <img src={p.image} alt={p.name} /> : <Icon name="inventory_2" size={22} />}
                                </span>
                                <div className="dash-rank__main">
                                    <p className="dash-product__name">{p.name}</p>
                                    <div className="dash-rank__track">
                                        <div className="dash-rank__fill" style={{ width: `${Math.max(6, (p.revenue / maxRev) * 100)}%` }} />
                                    </div>
                                    <p className="dash-product__meta">{p.units.toLocaleString()} units sold</p>
                                </div>
                                <div className="dash-product__right">
                                    <p className="dash-product__rev">{formatMoney(p.revenue, storeSettings)}</p>
                                    <DeltaChip delta={p.delta} small />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {alerts > 0 && (
                <div className="crm-spotlight" style={{ marginTop: 16 }}>
                    <div>
                        <p className="crm-spotlight__label">Inventory needs attention</p>
                        <p className="crm-spotlight__text">{alerts} item{alerts === 1 ? '' : 's'} low or out of stock — restock to avoid missed sales.</p>
                    </div>
                    <button className="crm-spotlight__btn" type="button" aria-label="Manage inventory" onClick={onInventory}>
                        <Icon name="arrow_forward" size={22} />
                    </button>
                </div>
            )}
        </main>
    );
};

export default BizProducts;
