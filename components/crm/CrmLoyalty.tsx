import React from 'react';
import { StoreSettings } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CrmOverview, TIERS, formatMoney, formatCompact, describeEarn, describeRedeem } from './crmModel';

interface CrmLoyaltyProps {
    overview: CrmOverview;
    storeSettings?: StoreSettings | null;
    onConfigure: () => void;
    onOpenCustomer: (id: string) => void;
    onNotify: (msg: string) => void;
}

export const CrmLoyalty: React.FC<CrmLoyaltyProps> = ({ overview, storeSettings, onConfigure, onOpenCustomer }) => {
    const { config, pointsOutstanding, redemptionsThisMonth, loyaltyMembers, topByPoints } = overview;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Loyalty Program</p>
                    <h2 className="crm-pagehead__title">Rewards</h2>
                </div>
                <button className="crm-btn crm-btn--filled" type="button" onClick={onConfigure}>
                    <Icon name="tune" size={20} /> Configure program
                </button>
            </div>

            {/* Program banner */}
            <div className="crm-loy-banner" style={{ marginBottom: 24 }}>
                <span className="crm-loy-banner__ghost"><Icon name="redeem" size={180} fill={1} /></span>
                <div style={{ position: 'relative' }}>
                    <span className={`crm-statuspill ${config.enabled ? 'crm-statuspill--on' : 'crm-statuspill--off'}`} style={{ marginBottom: 14 }}>
                        <Icon name={config.enabled ? 'check_circle' : 'pause_circle'} size={16} fill={1} />
                        {config.enabled ? 'Active' : 'Paused'}
                    </span>
                    <h3 className="crm-loy-banner__title" style={{ marginBottom: 16 }}>Points-per-spend</h3>
                    <div className="crm-loy-banner__stats" style={{ gap: 28, flexWrap: 'wrap' }}>
                        <div>
                            <p className="crm-loy-banner__num" style={{ fontSize: 18 }}>{describeEarn(config, storeSettings)}</p>
                            <p className="crm-loy-banner__cap">Earn rate</p>
                        </div>
                        <div>
                            <p className="crm-loy-banner__num" style={{ fontSize: 18 }}>{describeRedeem(config, storeSettings)}</p>
                            <p className="crm-loy-banner__cap">Redemption rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roll-up stats (all calculated) */}
            <div className="crm-prog-banner" style={{ marginBottom: 24 }}>
                <div>
                    <p className="crm-prog-stat__label">Points outstanding</p>
                    <p className="crm-prog-stat__value">{config.enabled ? pointsOutstanding.toLocaleString() : '—'}</p>
                </div>
                <div>
                    <p className="crm-prog-stat__label">Redemptions this month</p>
                    <p className="crm-prog-stat__value">
                        {redemptionsThisMonth.count.toLocaleString()}
                        {redemptionsThisMonth.value > 0 ? ` · ${formatMoney(redemptionsThisMonth.value, storeSettings)}` : ''}
                    </p>
                </div>
                <div>
                    <p className="crm-prog-stat__label">Active members</p>
                    <p className="crm-prog-stat__value">{loyaltyMembers.toLocaleString()}</p>
                </div>
            </div>

            <div className="crm-loy-cols">
                {/* Top members by points */}
                <section>
                    <h2 className="crm-panel__title" style={{ marginBottom: 16 }}>Top members by points</h2>
                    <div className="crm-panel">
                        {topByPoints.length === 0 ? (
                            <div className="crm-empty" style={{ padding: '40px 16px' }}>
                                <Icon name="loyalty" size={36} />
                                <p className="crm-empty__text">
                                    {config.enabled ? 'No points earned yet — they accrue as customers buy.' : 'The program is paused. Turn it on in settings.'}
                                </p>
                            </div>
                        ) : (
                            <div className="crm-activity">
                                {topByPoints.map(m => (
                                    <div key={m.customer.id} className="crm-activity__row" role="button" onClick={() => onOpenCustomer(m.customer.id)}>
                                        <Avatar name={m.customer.name} size={48} />
                                        <div className="crm-activity__body">
                                            <p className="crm-activity__name">{m.customer.name}</p>
                                            <p className="crm-activity__meta">
                                                {m.redeemableValue > 0 ? `${formatMoney(m.redeemableValue, storeSettings)} redeemable` : 'Building balance'}
                                            </p>
                                        </div>
                                        <div className="crm-activity__right">
                                            <p className="crm-activity__amount crm-activity__amount--pos">{m.pointsBalance.toLocaleString()} pts</p>
                                            <p className="crm-activity__time">{formatCompact(m.pointsEarned)} earned</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Tier reference (optional, auto by spend) */}
                <aside>
                    <h2 className="crm-panel__title" style={{ marginBottom: 4 }}>Customer tiers</h2>
                    <p className="crm-panel__sub" style={{ marginBottom: 16 }}>Automatic segments by lifetime spend — used for badges, not perks.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {TIERS.map(t => {
                            const range = t.max === Infinity
                                ? `${formatMoney(t.min, storeSettings)}+`
                                : `${formatMoney(t.min, storeSettings)} – ${formatMoney(t.max, storeSettings)}`;
                            const count = overview.metrics.filter(m => m.tier.id === t.id && m.orderCount > 0).length;
                            return (
                                <div key={t.id} className="crm-card crm-card--pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span className={`crm-badge crm-badge--${t.id}`}><Icon name={t.icon} size={14} fill={1} /> {t.name}</span>
                                        <span className="crm-table__muted">{range}</span>
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </main>
    );
};

export default CrmLoyalty;
