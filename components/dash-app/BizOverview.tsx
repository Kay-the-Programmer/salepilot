import React from 'react';
import { StoreSettings, User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney } from '../crm/crmModel';
import { DashboardOverview, DashPeriod, PERIOD_LABEL } from './dashboardModel';
import { MetricCard, TrendChart, DeltaChip } from './DashBits';

interface BizOverviewProps {
    overview: DashboardOverview;
    storeSettings?: StoreSettings | null;
    user: User;
    period: DashPeriod;
    onPeriod: (p: DashPeriod) => void;
    onViewSales: () => void;
    onViewProducts: () => void;
    onNewSale: () => void;
    onInventory: () => void;
    onOrders: () => void;
    onCustomers: () => void;
}

const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';
    return 'Good evening';
};

export const BizOverview: React.FC<BizOverviewProps> = ({
    overview, storeSettings, user, period, onPeriod,
    onViewSales, onViewProducts, onNewSale, onInventory, onOrders, onCustomers,
}) => {
    const firstName = user?.name?.split(' ')[0] || 'there';

    const quickActions = [
        { icon: 'add_shopping_cart', label: 'New Sale', primary: true, onClick: onNewSale },
        { icon: 'inventory_2', label: 'Update Stock', onClick: onInventory },
        { icon: 'receipt_long', label: 'Review Orders', onClick: onOrders },
        { icon: 'group', label: 'Customers', onClick: onCustomers },
    ];

    return (
        <main className="crm-main crm-section-fade">
            {/* Welcome + period picker */}
            <div className="dash-welcome">
                <div>
                    <h2 className="dash-welcome__title">{greeting()}, {firstName}</h2>
                    <p className="dash-welcome__sub">Here's what's happening in your shop today.</p>
                </div>
                <div className="dash-segment" role="tablist" aria-label="Reporting period">
                    {(['today', 'week', 'month'] as DashPeriod[]).map(p => (
                        <button
                            key={p}
                            type="button"
                            role="tab"
                            aria-selected={period === p}
                            className={`dash-segment__btn${period === p ? ' is-active' : ''}`}
                            onClick={() => onPeriod(p)}
                        >
                            {p === 'today' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
                        </button>
                    ))}
                </div>
            </div>


            <div className="dash-pulse">
                <MetricCard icon="payments" tone="p" label="Total Revenue" value={formatMoney(overview.revenue, storeSettings)} delta={overview.revenueDelta} />
                <MetricCard icon="shopping_cart" tone="s" label="Total Orders" value={overview.orders.toLocaleString()} delta={overview.ordersDelta} />
            </div>

            {/* Bento: trend + top performers */}
            <div className="dash-bento">
                <section className="dash-card dash-card--performers">
                    <div className="dash-card__head">
                        <h3 className="dash-card__title">Top Performers</h3>
                    </div>
                    {overview.topProducts.length === 0 ? (
                        <div className="dash-empty">
                            <Icon name="emoji_events" size={32} />
                            <p>No product sales yet in this period.</p>
                        </div>
                    ) : (
                        <div className="dash-performers">
                            {overview.topProducts.map(p => (
                                <div className="dash-product" key={p.id}>
                                    <span className="dash-product__art">
                                        {p.image ? <img src={p.image} alt={p.name} /> : <Icon name="inventory_2" size={22} />}
                                    </span>
                                    <div className="dash-product__info">
                                        <p className="dash-product__name">{p.name}</p>
                                        <p className="dash-product__meta">{p.units.toLocaleString()} sold</p>
                                    </div>
                                    <div className="dash-product__right">
                                        <p className="dash-product__rev">{formatMoney(p.revenue, storeSettings)}</p>
                                        <DeltaChip delta={p.delta} small />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="dash-card__cta" type="button" onClick={onViewProducts}>
                        View product report <Icon name="arrow_forward" size={18} />
                    </button>
                </section>
            </div>

            {/* Secondary insight strip */}
            <div className="dash-strip">
                <div className="dash-strip__item">
                    <span className="dash-strip__icon dash-strip__icon--p"><Icon name="group_add" size={22} /></span>
                    <div>
                        <p className="dash-strip__value">{overview.newCustomers.toLocaleString()}</p>
                        <p className="dash-strip__label">New customers</p>
                    </div>
                </div>
                <div className="dash-strip__item">
                    <span className="dash-strip__icon dash-strip__icon--s"><Icon name="percent" size={22} /></span>
                    <div>
                        <p className="dash-strip__value">{overview.grossMargin > 0 ? `${Math.round(overview.grossMargin * 100)}%` : '—'}</p>
                        <p className="dash-strip__label">Gross margin</p>
                    </div>
                </div>
                <button type="button" className="dash-strip__item dash-strip__item--btn" onClick={onViewProducts}>
                    <span className={`dash-strip__icon ${overview.lowStockCount + overview.outOfStockCount > 0 ? 'dash-strip__icon--e' : 'dash-strip__icon--p'}`}>
                        <Icon name="warning" size={22} fill={1} />
                    </span>
                    <div>
                        <p className="dash-strip__value">{(overview.lowStockCount + overview.outOfStockCount).toLocaleString()}</p>
                        <p className="dash-strip__label">Stock alerts</p>
                    </div>
                </button>
            </div>

            {/* Quick actions */}
            <div className="dash-section-head" style={{ marginTop: 8 }}>
                <span className="dash-eyebrow">Quick Actions</span>
            </div>
            <div className="dash-actions">
                {quickActions.map(a => (
                    <button
                        key={a.label}
                        type="button"
                        className={`dash-action${a.primary ? ' dash-action--primary' : ''}`}
                        onClick={a.onClick}
                    >
                        <Icon name={a.icon} size={30} />
                        <span>{a.label}</span>
                    </button>
                ))}
            </div>

        </main>
    );
};

export default BizOverview;
