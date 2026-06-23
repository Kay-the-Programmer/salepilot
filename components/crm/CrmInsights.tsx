import React, { useMemo } from 'react';
import { StoreSettings } from '../../types';
import { Icon, Avatar } from './CrmBits';
import { CrmOverview, formatMoney } from './crmModel';

interface CrmInsightsProps {
    overview: CrmOverview;
    storeSettings?: StoreSettings | null;
    onReengage: () => void;
    onNotify: (msg: string) => void;
}

export const CrmInsights: React.FC<CrmInsightsProps> = ({ overview, storeSettings, onReengage }) => {
    const { growth, segments, churnCount, avgLifetimeValue } = overview;

    const maxBar = useMemo(
        () => Math.max(1, ...growth.map(g => g.created + g.returning)),
        [growth],
    );

    const churnAvatars = useMemo(
        () => overview.metrics.filter(m => m.isChurnRisk).slice(0, 3),
        [overview.metrics],
    );
    const churnExtra = Math.max(0, churnCount - churnAvatars.length);

    const topVip = useMemo(
        () => overview.topCustomers.find(m => m.tier.id === 'platinum' || m.tier.id === 'gold') ?? overview.topCustomers[0],
        [overview.topCustomers],
    );

    // Average lifetime value as a share of the highest single spend (real ratio).
    const ltvShare = overview.maxSpend > 0 ? Math.round((overview.avgLifetimeValue / overview.maxSpend) * 100) : 0;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Performance Overview</p>
                    <h2 className="crm-pagehead__title">CRM Insights</h2>
                </div>
                <span className="crm-pagehead__sub" style={{ alignSelf: 'flex-end' }}>All-time figures</span>
            </div>

            {/* Stat row */}
            <div className="crm-seg crm-seg--3">
                <div className="crm-insight-card">
                    <div className="crm-insight-card__top">
                        <span className="crm-insight-card__iconbox"><Icon name="payments" size={24} fill={1} /></span>
                        <span className="crm-stat__trend crm-stat__trend--p" style={{ fontSize: 13 }}>
                            <Icon name="trending_up" size={16} /> Lifetime
                        </span>
                    </div>
                    <p className="crm-insight-card__label">Average Lifetime Value</p>
                    <p className="crm-insight-card__value">{formatMoney(avgLifetimeValue, storeSettings)}</p>
                    <div className="crm-insight-card__bar"><div style={{ width: `${ltvShare}%` }} /></div>
                    <p className="crm-engcard__note" style={{ textAlign: 'left' }}>{ltvShare}% of your top spender's lifetime value</p>
                </div>

                {/* Growth chart */}
                <div className="crm-insight-card crm-seg__span2">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Customer Growth</h3>
                        <div className="crm-legend">
                            <span><i style={{ background: 'var(--c-primary)' }} /> New</span>
                            <span><i style={{ background: 'var(--c-secondary-fixed-dim)' }} /> Returning</span>
                        </div>
                    </div>
                    <div className="crm-chart">
                        {growth.map(g => (
                            <div className="crm-chart__col" key={g.label}>
                                <div className="crm-chart__bars">
                                    <div className="crm-chart__bar crm-chart__bar--new" style={{ height: `${(g.created / maxBar) * 100}%` }} title={`${g.created} new`} />
                                    <div className="crm-chart__bar crm-chart__bar--ret" style={{ height: `${(g.returning / maxBar) * 100}%` }} title={`${g.returning} returning`} />
                                </div>
                                <span className="crm-chart__x">{g.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Segments + churn */}
            <div className="crm-seg crm-seg--2">
                <div className="crm-insight-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h3 className="crm-panel__title" style={{ fontSize: 20 }}>Top Segments</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="crm-segrow">
                            <div className="crm-segrow__top">
                                <span><Icon name="star" size={20} fill={1} className="" /> VIP Customers</span>
                                <span>{segments.vipPct}%</span>
                            </div>
                            <div className="crm-segrow__track"><div className="crm-segrow__fill" style={{ width: `${segments.vipPct}%`, background: 'var(--c-primary-container)' }} /></div>
                        </div>
                        <div className="crm-segrow">
                            <div className="crm-segrow__top">
                                <span><Icon name="group" size={20} /> Loyal Regulars</span>
                                <span>{segments.regularPct}%</span>
                            </div>
                            <div className="crm-segrow__track"><div className="crm-segrow__fill" style={{ width: `${segments.regularPct}%`, background: 'var(--c-primary)' }} /></div>
                        </div>
                        <div className="crm-segrow">
                            <div className="crm-segrow__top">
                                <span><Icon name="warning" size={20} /> At Risk</span>
                                <span>{segments.atRiskPct}%</span>
                            </div>
                            <div className="crm-segrow__track"><div className="crm-segrow__fill" style={{ width: `${segments.atRiskPct}%`, background: 'var(--c-error)' }} /></div>
                        </div>
                    </div>
                </div>

                <div className="crm-churn">
                    <div className="crm-churn__head">
                        <span className="crm-churn__icon"><Icon name="history" size={24} fill={1} /></span>
                        <div>
                            <h3 className="crm-churn__title">Churn Risk Alert</h3>
                            <p className="crm-churn__text">
                                {churnCount > 0
                                    ? `${churnCount} customer${churnCount === 1 ? '' : 's'} haven't visited in 60+ days. Re-engage before they lapse.`
                                    : 'No customers are currently at churn risk. Nicely done!'}
                            </p>
                        </div>
                    </div>
                    {churnCount > 0 && (
                        <div className="crm-churn__foot">
                            <div className="crm-stack">
                                {churnAvatars.map(m => <Avatar key={m.customer.id} name={m.customer.name} size={40} />)}
                                {churnExtra > 0 && <span className="crm-stack__more">+{churnExtra}</span>}
                            </div>
                            <button className="crm-btn crm-btn--primary" type="button" onClick={onReengage}>Re-engage</button>
                        </div>
                    )}
                </div>
            </div>

            {/* AI recommendation */}
            <div className="crm-ai">
                <span className="crm-ai__icon"><Icon name="auto_awesome" size={24} fill={1} /></span>
                <div className="crm-ai__body">
                    <h4 className="crm-ai__title">SalePilot Intelligence</h4>
                    <p className="crm-ai__text">
                        {topVip && overview.vipAvgSpend > 0
                            ? <>Your top spender <b>{topVip.customer.name}</b> is a {topVip.tier.name} member. Your Gold &amp; Platinum members average {formatMoney(overview.vipAvgSpend, storeSettings)} in lifetime spend versus {formatMoney(overview.avgLifetimeValue, storeSettings)} overall — nurture your Regulars toward that tier.</>
                            : <>Start recording sales against customers to unlock spending patterns and tier recommendations.</>}
                    </p>
                </div>
                <button className="crm-btn crm-btn--outline" type="button" onClick={onReengage}>Re-engage at-risk</button>
            </div>
        </main>
    );
};

export default CrmInsights;
