import React from 'react';
import { StoreSettings, User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney, parseApiDate } from '../crm/crmModel';
import { DashboardOverview, DashRange } from './dashboardModel';
import { TrendChart, DeltaChip } from './DashBits';
import PeriodPicker from './PeriodPicker';

interface BizOverviewProps {
    overview: DashboardOverview;
    storeSettings?: StoreSettings | null;
    user: User;
    range: DashRange;
    onRange: (r: DashRange) => void;
    onViewSales: () => void;
    onViewProducts: () => void;
    onNewSale: () => void;
    onInventory: () => void;
    onOrders: () => void;
}

const greeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    return 'Good evening';
};

const fmtTime = (ts: string) => {
    const d = parseApiDate(ts);
    return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
};

export const BizOverview: React.FC<BizOverviewProps> = ({
    overview, storeSettings, user, range, onRange,
    onViewSales, onViewProducts, onNewSale, onInventory, onOrders,
}) => {
    const firstName = user?.name?.split(' ')[0] || 'there';
    const stockAlerts = overview.lowStockCount + overview.outOfStockCount;

    return (
        <main className="crm-main crm-section-fade">
            {/* Welcome + period picker */}
            <div className="dash-welcome">
                <div>
                    <h2 className="dash-welcome__title">{greeting()}, {firstName}</h2>
                    <p className="dash-welcome__sub">Here's what's happening in your shop today.</p>
                </div>
                <PeriodPicker range={range} onRange={onRange} />
            </div>

            {/* Top bento: sales highlights + quick actions panel */}
            <div className="dash-bento-top">
                <div className="dash-highlights">
                    {/* Revenue */}
                    <div className="dash-stat dash-stat--feature">
                        <div className="dash-stat__head">
                            <span className="dash-stat__label">{overview.rangeLabel}'s Sales</span>
                            <DeltaChip delta={overview.revenueDelta} small />
                        </div>
                        <div>
                            <span className="dash-stat__value">{formatMoney(overview.revenue, storeSettings)}</span>
                            <p className="dash-stat__sub">{overview.orders.toLocaleString()} transactions</p>
                        </div>
                    </div>

                    {/* Average sale */}
                    <div className="dash-stat">
                        <div className="dash-stat__head">
                            <span className="dash-stat__label">Avg. Sale</span>
                            <DeltaChip delta={overview.aovDelta} small />
                        </div>
                        <div>
                            <span className="dash-stat__value dash-stat__value--sm">{formatMoney(overview.aov, storeSettings)}</span>
                            <p className="dash-stat__sub">Per transaction</p>
                        </div>
                    </div>

                    {/* New customers */}
                    <div className="dash-stat">
                        <div className="dash-stat__head">
                            <span className="dash-stat__label">Customers</span>
                            <span className="dash-stat__chip"><Icon name="group" size={18} /></span>
                        </div>
                        <div>
                            <span className="dash-stat__value dash-stat__value--sm">{overview.newCustomers.toLocaleString()}</span>
                            <p className="dash-stat__sub">{overview.rangeLabel.toLowerCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Quick actions — navy panel with orange primary CTA */}
                <div className="dash-quick">
                    <div className="dash-quick__head">
                        <h2 className="dash-quick__title">Quick Actions</h2>
                    </div>
                    <div className="dash-quick__group">
                        <button type="button" className="dash-quick__primary" onClick={onNewSale}>
                            <Icon name="add_shopping_cart" size={22} />
                            New Sale
                        </button>
                        <div className="dash-quick__row">
                            <button type="button" className="dash-quick__btn" onClick={onInventory}>
                                <Icon name="inventory_2" size={20} />
                                Inventory
                            </button>
                            <button type="button" className="dash-quick__btn" onClick={onViewSales}>
                                <Icon name="assessment" size={20} />
                                Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lower bento: sales trend + recent activity */}
            <div className="dash-lower">
                <section className="dash-card dash-trend-card">
                    <div className="dash-card__head">
                        <h3 className="dash-card__title">Sales Trend</h3>
                        <span className="dash-trend__hint">Last 7 days</span>
                    </div>
                    <TrendChart points={overview.trend} max={overview.trendMax} storeSettings={storeSettings} height={260} />
                </section>

                <section className="dash-card dash-activity">
                    <div className="dash-activity__head">
                        <h3 className="dash-card__title">Recent Activity</h3>
                        <button type="button" className="dash-activity__viewall" onClick={onViewSales}>View All</button>
                    </div>
                    <div className="dash-activity__list">
                        {overview.activity.length === 0 ? (
                            <div className="dash-empty">
                                <Icon name="receipt_long" size={32} />
                                <p>No sales yet — completed transactions appear here.</p>
                            </div>
                        ) : (
                            overview.activity.map(row => {
                                const unpaid = row.status !== 'paid';
                                return (
                                    <div className="dash-activity__row" key={row.id}>
                                        <span className={`dash-activity__icon${unpaid ? ' dash-activity__icon--warn' : ''}`}>
                                            <Icon name={unpaid ? 'pending_actions' : 'receipt_long'} size={20} />
                                        </span>
                                        <div className="dash-activity__main">
                                            <p className="dash-activity__name">{row.customer}</p>
                                            <p className="dash-activity__meta">
                                                {fmtTime(row.ts)} • {row.channel === 'online' ? 'Online' : 'POS'} • {row.itemCount} {row.itemCount === 1 ? 'item' : 'items'}
                                            </p>
                                        </div>
                                        <span className="dash-activity__amount">{formatMoney(row.total, storeSettings)}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* Secondary metrics row */}
            <div className="dash-metrics">
                <button type="button" className="dash-mini dash-mini--btn" onClick={onViewProducts}>
                    <span className={`dash-mini__icon ${overview.lowStockCount > 0 ? 'dash-mini__icon--s' : 'dash-mini__icon--p'}`}><Icon name="inventory" size={22} /></span>
                    <div>
                        <p className="dash-mini__label">Low Stock</p>
                        <p className="dash-mini__value">{overview.lowStockCount.toLocaleString()} {overview.lowStockCount === 1 ? 'item' : 'items'}</p>
                    </div>
                </button>
                <button type="button" className="dash-mini dash-mini--btn" onClick={onViewProducts}>
                    <span className={`dash-mini__icon ${overview.outOfStockCount > 0 ? 'dash-mini__icon--e' : 'dash-mini__icon--p'}`}><Icon name="production_quantity_limits" size={22} /></span>
                    <div>
                        <p className="dash-mini__label">Out of Stock</p>
                        <p className="dash-mini__value">{overview.outOfStockCount.toLocaleString()} {overview.outOfStockCount === 1 ? 'item' : 'items'}</p>
                    </div>
                </button>
                <button type="button" className="dash-mini dash-mini--btn" onClick={onOrders}>
                    <span className="dash-mini__icon dash-mini__icon--t"><Icon name="shopping_cart" size={22} /></span>
                    <div>
                        <p className="dash-mini__label">Total Orders</p>
                        <p className="dash-mini__value">{overview.orders.toLocaleString()}</p>
                    </div>
                </button>
                {stockAlerts > 0 && <span className="sr-only">{stockAlerts} stock alerts</span>}
            </div>
        </main>
    );
};

export default BizOverview;
