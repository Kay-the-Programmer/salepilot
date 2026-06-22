import React from 'react';
import { StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { formatMoney } from '../crm/crmModel';
import { DashDelta, TrendPoint } from './dashboardModel';

/** Coloured up/down delta pill (matches the template's trend chips). */
export const DeltaChip: React.FC<{ delta: DashDelta; small?: boolean }> = ({ delta, small }) => {
    if (delta.isNew) {
        return <span className={`dash-delta dash-delta--up${small ? ' dash-delta--sm' : ''}`}><Icon name="trending_up" size={small ? 12 : 14} /> New</span>;
    }
    const cls = delta.up ? 'up' : 'down';
    return (
        <span className={`dash-delta dash-delta--${cls}${small ? ' dash-delta--sm' : ''}`}>
            <Icon name={delta.up ? 'trending_up' : 'trending_down'} size={small ? 12 : 14} />
            {delta.up ? '+' : '−'}{delta.pct.toFixed(delta.pct < 10 ? 1 : 0)}%
        </span>
    );
};

interface MetricCardProps {
    icon: string;
    tone: 'p' | 's' | 't';
    label: string;
    value: string;
    delta?: DashDelta;
}

/** A glass performance-pulse metric card. */
export const MetricCard: React.FC<MetricCardProps> = ({ icon, tone, label, value, delta }) => (
    <div className="dash-metric">
        <div className="dash-metric__top">
            <span className={`dash-metric__icon dash-metric__icon--${tone}`}><Icon name={icon} size={24} /></span>
            {delta && <DeltaChip delta={delta} />}
        </div>
        <div>
            <p className="dash-metric__label">{label}</p>
            <p className="dash-metric__value">{value}</p>
        </div>
    </div>
);

interface TrendChartProps {
    points: TrendPoint[];
    max: number;
    storeSettings?: StoreSettings | null;
    height?: number;
}

/**
 * Smooth area + line chart for the 7-day revenue trend. Pure SVG, no deps —
 * mirrors the merchant-dashboard reference design.
 */
export const TrendChart: React.FC<TrendChartProps> = ({ points, max, storeSettings, height = 220 }) => {
    const W = 100;
    const H = 100;
    const peak = max > 0 ? max : 1;
    const n = points.length;
    const coords = points.map((p, i) => ({
        x: n > 1 ? (i / (n - 1)) * W : W / 2,
        y: H - (p.value / peak) * (H - 12) - 6,
    }));

    // Build a smooth path using midpoint quadratic curves.
    const linePath = coords.reduce((acc, c, i) => {
        if (i === 0) return `M${c.x},${c.y}`;
        const prev = coords[i - 1];
        const mx = (prev.x + c.x) / 2;
        return `${acc} Q${prev.x},${prev.y} ${mx},${(prev.y + c.y) / 2} T${c.x},${c.y}`;
    }, '');
    const areaPath = coords.length
        ? `${linePath} L${coords[coords.length - 1].x},${H} L${coords[0].x},${H} Z`
        : '';

    const hasData = max > 0;

    return (
        <div className="dash-chart" style={{ height }}>
            {hasData ? (
                <>
                    <svg className="dash-chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                            <linearGradient id="dashTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--c-primary-container)" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="var(--c-primary-container)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#dashTrendGrad)" />
                        <path d={linePath} fill="none" stroke="var(--c-primary-container)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        {coords.map((c, i) => (
                            <circle key={i} cx={c.x} cy={c.y} r="1.6" fill="var(--c-primary)" vectorEffect="non-scaling-stroke" />
                        ))}
                    </svg>
                    <div className="dash-chart__peak">Peak {formatMoney(max, storeSettings)}</div>
                </>
            ) : (
                <div className="dash-chart__empty">
                    <Icon name="show_chart" size={36} />
                    <p>No sales in this range yet — completed sales will plot here.</p>
                </div>
            )}
            <div className="dash-chart__x">
                {points.map((p, i) => <span key={i}>{p.label}</span>)}
            </div>
        </div>
    );
};
