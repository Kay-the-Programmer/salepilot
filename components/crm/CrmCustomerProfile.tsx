import React, { useMemo } from 'react';
import { Sale, StoreSettings } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CustomerMetrics, LoyaltyConfig, formatMoney, formatDate, formatMonthYear, timeAgo } from './crmModel';

interface CrmCustomerProfileProps {
    metrics: CustomerMetrics;
    sales: Sale[];
    storeSettings?: StoreSettings | null;
    config: LoyaltyConfig;
    canManage?: boolean;
    smsEntitled?: boolean;
    onBack: () => void;
    onEdit: () => void;
    onMessage: () => void;
    onUpgrade: () => void;
    onRedeem: () => void;
    onDelete?: () => void;
}

const statusPill = (s: Sale) => {
    if (s.paymentStatus === 'paid') return <span className="crm-pill-status crm-pill-status--ok">COMPLETED</span>;
    if (s.paymentStatus === 'partially_paid') return <span className="crm-pill-status crm-pill-status--due">PARTIAL</span>;
    return <span className="crm-pill-status crm-pill-status--due">UNPAID</span>;
};

export const CrmCustomerProfile: React.FC<CrmCustomerProfileProps> = ({ metrics, sales, storeSettings, config, canManage, smsEntitled = false, onBack, onEdit, onMessage, onUpgrade, onRedeem, onDelete }) => {
    const c = metrics.customer;

    const ownSales = useMemo(
        () => sales.filter(s => s.customerId === c.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [sales, c.id],
    );

    // Favourite product (by quantity across all their purchases).
    const favourite = useMemo(() => {
        const tally = new Map<string, number>();
        let total = 0;
        for (const s of ownSales) {
            for (const it of s.cart || []) {
                tally.set(it.name, (tally.get(it.name) || 0) + (it.quantity || 0));
                total += it.quantity || 0;
            }
        }
        let best: { name: string; qty: number } | null = null;
        for (const [name, qty] of tally) if (!best || qty > best.qty) best = { name, qty };
        return best ? { name: best.name, pct: total ? Math.round((best.qty / total) * 100) : 0 } : null;
    }, [ownSales]);

    const isVip = metrics.tier.id === 'gold' || metrics.tier.id === 'platinum';

    return (
        <main className="crm-main crm-section-fade">
            <nav className="crm-crumbs">
                <button type="button" onClick={onBack}>Customers</button>
                <Icon name="chevron_right" size={18} />
                <span className="crm-crumbs__current">{c.name}</span>
            </nav>

            <div className="crm-prof-grid">
                {/* Hero */}
                <div className="crm-card crm-prof-full">
                    <div className="crm-hero">
                        <div className="crm-hero__avwrap">
                            <Avatar name={c.name} size={132} />
                            {isVip && (
                                <span className="crm-hero__badge"><Icon name="verified" size={14} fill={1} /> {metrics.tier.name}</span>
                            )}
                        </div>
                        <div className="crm-hero__main">
                            <h1 className="crm-hero__name">{c.name}</h1>
                            <div className="crm-hero__contacts">
                                {c.email && <span className="crm-hero__contact"><Icon name="mail" size={20} /> {c.email}</span>}
                                {c.phone && <span className="crm-hero__contact"><Icon name="call" size={20} /> {c.phone}</span>}
                                {!c.email && !c.phone && <span className="crm-hero__contact"><Icon name="info" size={20} /> No contact details on file</span>}
                            </div>
                            <div className="crm-hero__actions">
                                <button className="crm-btn crm-btn--filled" type="button" onClick={onEdit}>
                                    <Icon name="edit" size={20} /> Edit Profile
                                </button>
                                {smsEntitled ? (
                                    <button className="crm-btn crm-btn--outline" type="button" onClick={onMessage}>
                                        <Icon name="send" size={20} /> Send Message
                                    </button>
                                ) : (
                                    <button className="crm-btn crm-btn--outline" type="button" onClick={onUpgrade} title="SMS messaging is a premium add-on — tap to unlock">
                                        <Icon name="lock" size={20} /> Send Message
                                        <span className="crm-badge crm-badge--gold" style={{ marginLeft: 4, padding: '2px 8px' }}>Premium</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="crm-hero__side">
                            <div className="crm-hero__stat">
                                <p className="crm-hero__stat-label">Member Since</p>
                                <p className="crm-hero__stat-value">{formatMonthYear(c.createdAt)}</p>
                            </div>
                            <div className="crm-hero__stat">
                                <p className="crm-hero__stat-label">Last Activity</p>
                                <p className="crm-hero__stat-value" style={{ color: 'var(--c-secondary)' }}>
                                    {metrics.lastPurchase ? timeAgo(metrics.lastPurchase) : 'No purchases'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement insights */}
                <div className="crm-prof-eng">
                    <div className="crm-eng">
                        <div className="crm-engcard">
                            <div className="crm-engcard__icon crm-engcard__icon--p"><Icon name="calendar_month" size={28} /></div>
                            <p className="crm-engcard__label">Frequency</p>
                            <p className="crm-engcard__value">{metrics.monthlyFrequency.toFixed(1)}x / mo</p>
                            <p className="crm-engcard__note">{metrics.orderCount} order{metrics.orderCount === 1 ? '' : 's'} lifetime</p>
                        </div>
                        <div className="crm-engcard">
                            <div className="crm-engcard__icon crm-engcard__icon--s"><Icon name="payments" size={28} /></div>
                            <p className="crm-engcard__label">Average Spend</p>
                            <p className="crm-engcard__value">{formatMoney(metrics.avgOrder, storeSettings)}</p>
                            <p className="crm-engcard__note">{formatMoney(metrics.totalSpend, storeSettings)} lifetime</p>
                        </div>
                        <div className="crm-engcard">
                            <div className="crm-engcard__icon crm-engcard__icon--t"><Icon name="favorite" size={28} /></div>
                            <p className="crm-engcard__label">Top Purchase</p>
                            <p className="crm-engcard__value" style={{ fontSize: favourite ? 18 : 26 }}>{favourite?.name ?? '—'}</p>
                            <p className="crm-engcard__note">{favourite ? `${favourite.pct}% of items bought` : 'No purchases yet'}</p>
                        </div>
                    </div>
                </div>

                {/* Points & Rewards */}
                <div className="crm-prof-loy">
                    <div className="crm-loycard">
                        <div className="crm-loycard__glow" />
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <h3 className="crm-loycard__title">Points &amp; Rewards</h3>
                                <span className="crm-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                    <Icon name={metrics.tier.icon} size={14} fill={1} /> {metrics.tier.name}
                                </span>
                            </div>
                            <p className="crm-loycard__tier">
                                {config.enabled ? 'Earned automatically as they spend' : 'Loyalty program is paused'}
                            </p>
                        </div>

                        {config.enabled ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{metrics.pointsBalance.toLocaleString()}</span>
                                    <span style={{ fontSize: 14, opacity: 0.85 }}>points</span>
                                </div>
                                <p style={{ fontSize: 13, opacity: 0.9, margin: '0 0 14px' }}>
                                    {metrics.redeemableValue > 0
                                        ? <><b>{formatMoney(metrics.redeemableValue, storeSettings)}</b> ready to redeem</>
                                        : metrics.pointsExpired ? 'Points expired due to inactivity' : 'Not enough to redeem yet'}
                                </p>
                                {metrics.nextTier && (
                                    <div style={{ marginBottom: 14 }}>
                                        <div className="crm-loycard__track">
                                            <div className="crm-loycard__fill" style={{ width: `${Math.round(metrics.tierProgress * 100)}%` }} />
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                                            {formatMoney(metrics.spendToNextTier, storeSettings)} more spend to reach {metrics.nextTier.name}
                                        </div>
                                    </div>
                                )}
                                <button
                                    className="crm-loycard__btn"
                                    type="button"
                                    onClick={onRedeem}
                                    disabled={!metrics.canRedeem}
                                    style={{ opacity: metrics.canRedeem ? 1 : 0.5, cursor: metrics.canRedeem ? 'pointer' : 'not-allowed' }}
                                >
                                    {metrics.canRedeem ? `Redeem ${formatMoney(metrics.redeemableValue, storeSettings)}` : 'Redeem points'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, opacity: 0.9 }}>Enable the program in Rewards Settings to start earning points.</div>
                        )}
                    </div>
                </div>

                {/* Purchase history */}
                <div className="crm-prof-full">
                    <div className="crm-panel">
                        <div className="crm-panel__head" style={{ background: 'var(--c-surface-container)' }}>
                            <h2 className="crm-panel__title">Recent Purchase History</h2>
                            <span className="crm-panel__sub">{ownSales.length} transaction{ownSales.length === 1 ? '' : 's'}</span>
                        </div>
                        {ownSales.length === 0 ? (
                            <div className="crm-empty" style={{ padding: '40px 16px' }}>
                                <Icon name="shopping_bag" size={36} />
                                <p className="crm-empty__text">No purchases recorded for this customer yet.</p>
                            </div>
                        ) : (
                            <div className="crm-tablewrap">
                                <table className="crm-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th><th>Items</th><th>Status</th><th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ownSales.slice(0, 10).map(s => {
                                            const first = s.cart?.[0];
                                            const extra = (s.cart?.length || 0) - 1;
                                            const qty = s.cart?.reduce((n, it) => n + (it.quantity || 0), 0) ?? 0;
                                            return (
                                                <tr key={s.transactionId}>
                                                    <td><span className="crm-table__primary">{formatDate(s.timestamp)}</span></td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span className="crm-table__primary">
                                                                {first ? `${first.name}${first.quantity > 1 ? ` (x${first.quantity})` : ''}` : `${qty} items`}
                                                            </span>
                                                            <span className="crm-table__muted">{extra > 0 ? `+ ${extra} more item${extra === 1 ? '' : 's'}` : `${qty} item${qty === 1 ? '' : 's'}`}</span>
                                                        </div>
                                                    </td>
                                                    <td>{statusPill(s)}</td>
                                                    <td className="crm-table__total">{formatMoney(s.total, storeSettings)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {canManage && onDelete && (
                    <div className="crm-prof-full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-error)' }} onClick={onDelete}>
                            <Icon name="delete" size={20} /> Delete customer
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
};

export default CrmCustomerProfile;
