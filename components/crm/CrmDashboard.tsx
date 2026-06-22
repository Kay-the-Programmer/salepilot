import React from 'react';
import { StoreSettings } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CrmOverview, CustomerMetrics, formatMoney, timeAgo } from './crmModel';

interface CrmDashboardProps {
    overview: CrmOverview;
    storeSettings?: StoreSettings | null;
    onAddCustomer: () => void;
    onOpenCustomer: (id: string) => void;
    onViewAll: () => void;
    onViewInsights: () => void;
    onManageRewards: () => void;
}

const RANK_COLORS = ['var(--c-secondary-container)', 'var(--c-outline-variant)', 'rgba(189,201,194,0.6)', 'var(--c-tertiary-fixed-dim)', 'var(--c-tertiary-fixed-dim)'];

const TopCustomerCard: React.FC<{ m: CustomerMetrics; rank: number; settings?: StoreSettings | null; onClick: () => void }> = ({ m, rank, settings, onClick }) => (
    <button type="button" className="crm-top__card" onClick={onClick} style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <span className="crm-top__rankbar" style={{ background: RANK_COLORS[rank] }} />
        <span className="crm-top__ghost" style={{ color: RANK_COLORS[rank] }}>{rank + 1}</span>
        <Avatar name={m.customer.name} size={56} square />
        <div className="crm-top__body">
            <p className="crm-top__name">{m.customer.name}</p>
            <div className="crm-top__tier">
                <Icon name={m.tier.icon} size={16} fill={1} className="" />
                <span>{m.tier.name} Member</span>
            </div>
            <p className="crm-top__spend">{formatMoney(m.totalSpend, settings)} <span>Total Spend</span></p>
        </div>
    </button>
);

export const CrmDashboard: React.FC<CrmDashboardProps> = ({ overview, storeSettings, onAddCustomer, onOpenCustomer, onViewAll, onViewInsights, onManageRewards }) => {
    const { totalCustomers, loyaltyMembers, retentionRate, topCustomers, recentSales, churnCount, config, pointsOutstanding, redemptionsThisMonth } = overview;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Management Console</p>
                    <h2 className="crm-pagehead__title">Store Overview</h2>
                </div>
                <div className="crm-pagehead__actions">
                    <button className="crm-btn crm-btn--outline" type="button" onClick={onViewInsights}>
                        <Icon name="calendar_today" size={20} /> All time
                    </button>
                    <button className="crm-btn crm-btn--filled" type="button" onClick={onAddCustomer}>
                        <Icon name="person_add" size={20} /> New Customer
                    </button>
                </div>
            </div>

            {/* Stat bento */}
            <div className="crm-bento crm-bento--3">
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--p"><Icon name="group" size={28} fill={1} /></div>
                        <span className="crm-stat__trend crm-stat__trend--p"><Icon name="trending_up" size={14} /> {overview.newThisMonth} new</span>
                    </div>
                    <div>
                        <p className="crm-stat__label">Total Customers</p>
                        <p className="crm-stat__value">{totalCustomers.toLocaleString()}</p>
                    </div>
                </div>
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--s"><Icon name="card_membership" size={28} fill={1} /></div>
                        <span className="crm-stat__trend crm-stat__trend--s"><Icon name="loyalty" size={14} /> Active</span>
                    </div>
                    <div>
                        <p className="crm-stat__label">Active Loyalty Members</p>
                        <p className="crm-stat__value">{loyaltyMembers.toLocaleString()}</p>
                    </div>
                </div>
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--t"><Icon name="analytics" size={28} fill={1} /></div>
                        <span className="crm-stat__trend crm-stat__trend--t"><Icon name="auto_graph" size={14} /> Retention</span>
                    </div>
                    <div>
                        <p className="crm-stat__label">Customer Retention Rate</p>
                        <p className="crm-stat__value">{retentionRate.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            {/* Rewards summary */}
            <div className="crm-panel crm-panel__pad" style={{ marginBottom: 24 }}>
                <div className="crm-reward-summary">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <div className="crm-reward-metric">
                            <span className="crm-reward-metric__icon"><Icon name="redeem" size={26} fill={1} /></span>
                            <div>
                                <p className="crm-reward-metric__value">{config.enabled ? pointsOutstanding.toLocaleString() : '—'}</p>
                                <p className="crm-reward-metric__label">Points outstanding</p>
                            </div>
                        </div>
                        <div className="crm-reward-metric">
                            <span className="crm-reward-metric__icon" style={{ background: 'rgba(0,128,96,0.12)', color: 'var(--c-primary)' }}><Icon name="local_activity" size={26} fill={1} /></span>
                            <div>
                                <p className="crm-reward-metric__value">{redemptionsThisMonth.count.toLocaleString()}</p>
                                <p className="crm-reward-metric__label">
                                    Redemptions this month{redemptionsThisMonth.value > 0 ? ` · ${formatMoney(redemptionsThisMonth.value, storeSettings)}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button className="crm-btn crm-btn--outline" type="button" onClick={onManageRewards}>
                        <Icon name="tune" size={20} /> Manage rewards
                    </button>
                </div>
            </div>

            {/* Secondary grid */}
            <div className="crm-grid12">
                <div className="crm-col-7">
                    <div className="crm-panel">
                        <div className="crm-panel__head">
                            <h3 className="crm-panel__title">Recent Customer Activity</h3>
                            <button className="crm-link" type="button" onClick={onViewAll}>View All</button>
                        </div>
                        <div className="crm-activity">
                            {recentSales.length === 0 ? (
                                <div className="crm-empty" style={{ padding: '40px 16px' }}>
                                    <Icon name="receipt_long" size={36} />
                                    <p className="crm-empty__text">No recent sales yet.</p>
                                </div>
                            ) : recentSales.map(({ sale, metrics }) => {
                                const name = metrics?.customer.name || sale.customerName || sale.customerDetails?.name || 'Walk-in customer';
                                const itemCount = sale.itemsCount ?? sale.cart?.reduce((n, it) => n + (it.quantity || 0), 0) ?? 0;
                                return (
                                    <div
                                        key={sale.transactionId}
                                        className="crm-activity__row"
                                        role={metrics ? 'button' : undefined}
                                        onClick={() => metrics && onOpenCustomer(metrics.customer.id)}
                                    >
                                        <Avatar name={name} size={48} />
                                        <div className="crm-activity__body">
                                            <p className="crm-activity__name">{name}</p>
                                            <p className="crm-activity__meta">
                                                {itemCount > 0 ? `Purchased ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'New transaction'}
                                            </p>
                                        </div>
                                        <div className="crm-activity__right">
                                            <p className="crm-activity__amount crm-activity__amount--pos">{formatMoney(sale.total, storeSettings)}</p>
                                            <p className="crm-activity__time">{timeAgo(sale.timestamp)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="crm-col-5">
                    <div className="crm-panel crm-panel--alt crm-panel__pad" style={{ height: '100%' }}>
                        <div style={{ marginBottom: 16 }}>
                            <h3 className="crm-panel__title">Top Customers</h3>
                            <p className="crm-panel__sub">Ranking by total spend</p>
                        </div>
                        <div className="crm-top">
                            {topCustomers.length === 0 ? (
                                <div className="crm-empty" style={{ padding: '32px 16px' }}>
                                    <Icon name="emoji_events" size={36} />
                                    <p className="crm-empty__text">Spending data will appear here once customers buy.</p>
                                </div>
                            ) : topCustomers.slice(0, 3).map((m, i) => (
                                <TopCustomerCard key={m.customer.id} m={m} rank={i} settings={storeSettings} onClick={() => onOpenCustomer(m.customer.id)} />
                            ))}
                        </div>

                        <div className="crm-spotlight">
                            <div>
                                <p className="crm-spotlight__label">Retention Spotlight</p>
                                <p className="crm-spotlight__text">
                                    {churnCount > 0
                                        ? `Loyalty outreach due for ${churnCount} customer${churnCount === 1 ? '' : 's'}`
                                        : 'All customers are active — great work!'}
                                </p>
                            </div>
                            <button className="crm-spotlight__btn" type="button" aria-label="Open insights" onClick={onViewInsights}>
                                <Icon name="chevron_right" size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button className="crm-fab" type="button" aria-label="Add customer" onClick={onAddCustomer}>
                <Icon name="add" size={26} />
            </button>
        </main>
    );
};

export default CrmDashboard;
