import React from 'react';
import { StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney, timeAgo } from '../crm/crmModel';
import { DashboardOverview, DashRange } from './dashboardModel';
import { MetricCard, TrendChart } from './DashBits';
import PeriodPicker from './PeriodPicker';

interface BizSalesProps {
    overview: DashboardOverview;
    storeSettings?: StoreSettings | null;
    range: DashRange;
    onRange: (r: DashRange) => void;
    onReports: () => void;
}

const STATUS_LABEL: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', partially_paid: 'Part-paid' };

export const BizSales: React.FC<BizSalesProps> = ({ overview, storeSettings, range, onRange, onReports }) => (
    <main className="crm-main crm-section-fade">
        <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
                <p className="crm-pagehead__eyebrow">Sales · {overview.rangeLabel}</p>
                <h2 className="crm-pagehead__title">Sales Performance</h2>
                <p className="crm-pagehead__sub">Revenue, orders and recent transactions.</p>
            </div>
            <PeriodPicker range={range} onRange={onRange} />
        </div>

        <div className="dash-pulse">
            <MetricCard icon="payments" tone="p" label="Total Revenue" value={formatMoney(overview.revenue, storeSettings)} delta={overview.revenueDelta} />
            <MetricCard icon="shopping_cart" tone="s" label="Total Orders" value={overview.orders.toLocaleString()} delta={overview.ordersDelta} />
            <MetricCard icon="analytics" tone="t" label="Avg. Order Value" value={formatMoney(overview.aov, storeSettings)} delta={overview.aovDelta} />
        </div>

        <section className="dash-card dash-card--chart" style={{ marginBottom: 16 }}>
            <div className="dash-card__head">
                <div>
                    <h3 className="dash-card__title">Revenue Trend</h3>
                    <p className="dash-card__sub">Daily revenue over the last 7 days</p>
                </div>
                <button className="crm-link" type="button" onClick={onReports}>Open full reports</button>
            </div>
            <TrendChart points={overview.trend} max={overview.trendMax} storeSettings={storeSettings} height={260} />
        </section>

        <section className="crm-panel">
            <div className="crm-panel__head">
                <div>
                    <h3 className="crm-panel__title">Recent Transactions</h3>
                    <p className="crm-panel__sub">Newest sales across POS and online</p>
                </div>
                <button className="crm-link" type="button" onClick={onReports}>View all</button>
            </div>
            {overview.activity.length === 0 ? (
                <div className="crm-empty" style={{ padding: '48px 16px' }}>
                    <Icon name="receipt_long" size={36} />
                    <p className="crm-empty__text">No transactions yet. Completed sales will appear here.</p>
                </div>
            ) : (
                <div className="crm-activity">
                    {overview.activity.map(a => (
                        <div key={a.id} className="crm-activity__row" style={{ cursor: 'default' }}>
                            <span className="dash-product__art" style={{ width: 44, height: 44 }}>
                                <Icon name={a.channel === 'online' ? 'language' : 'storefront'} size={20} />
                            </span>
                            <div className="crm-activity__body">
                                <p className="crm-activity__name">{a.customer}</p>
                                <p className="crm-activity__meta">{a.itemCount} item{a.itemCount === 1 ? '' : 's'} · {timeAgo(a.ts)}</p>
                            </div>
                            <div className="crm-activity__right">
                                <p className="crm-activity__amount crm-activity__amount--pos">{formatMoney(a.total, storeSettings)}</p>
                                <span className={`crm-pill-status ${a.status === 'paid' ? 'crm-pill-status--ok' : 'crm-pill-status--due'}`} style={{ marginTop: 4 }}>
                                    {STATUS_LABEL[a.status] || a.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    </main>
);

export default BizSales;
