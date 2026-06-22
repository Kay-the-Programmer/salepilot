import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import PosIcon from '../sales/PosIcon';
import '../../pages/sale-v2.css';
import './pos-shell.css';

interface PosDashboardProps {
    storeSettings: StoreSettings;
    onOpenSidebar?: () => void;
}

type Period = 'today' | 'month' | 'year';

interface DailyEntry {
    date: string;
    totalRevenue: number;
    totalQuantity: number;
    items?: { name: string; quantity: number; revenue: number }[];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const rangeFor = (period: Period): { start: string; end: string; label: string } => {
    const now = new Date();
    if (period === 'today') return { start: iso(now), end: iso(now), label: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) };
    if (period === 'month') return { start: iso(new Date(now.getFullYear(), now.getMonth(), 1)), end: iso(now), label: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) };
    return { start: iso(new Date(now.getFullYear(), 0, 1)), end: iso(now), label: String(now.getFullYear()) };
};

export const PosDashboard: React.FC<PosDashboardProps> = ({ storeSettings, onOpenSidebar }) => {
    const [period, setPeriod] = useState<Period>('today');
    const [daily, setDaily] = useState<DailyEntry[]>([]);
    const [txnCount, setTxnCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { start, end, label } = useMemo(() => rangeFor(period), [period]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [report, salesRes] = await Promise.all([
                api.get<{ daily: DailyEntry[] }>(`/reports/daily-sales?startDate=${start}&endDate=${end}`),
                api.get<{ total: number }>(`/sales?startDate=${start}&endDate=${end}&page=1&limit=1`),
            ]);
            setDaily(report?.daily || []);
            setTxnCount(salesRes?.total || 0);
        } catch (err: any) {
            setError(err?.message || 'Could not load sales reports.');
            setDaily([]);
            setTxnCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [start, end]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const revenue = daily.reduce((a, d) => a + (d.totalRevenue || 0), 0);
        const itemsSold = daily.reduce((a, d) => a + (d.totalQuantity || 0), 0);
        const avg = txnCount > 0 ? revenue / txnCount : 0;
        return { revenue, itemsSold, avg, txns: txnCount };
    }, [daily, txnCount]);

    const chart = useMemo(() => {
        const map = new Map(daily.map(d => [d.date, d.totalRevenue || 0]));
        if (period === 'month') {
            const cols: { label: string; value: number }[] = [];
            const s = new Date(start);
            const e = new Date(end);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                cols.push({ label: String(d.getDate()), value: map.get(iso(d)) || 0 });
            }
            return cols;
        }
        if (period === 'year') {
            const year = new Date(end).getFullYear();
            const upto = new Date(end).getMonth();
            const cols: { label: string; value: number }[] = [];
            for (let m = 0; m <= upto; m++) {
                const prefix = `${year}-${String(m + 1).padStart(2, '0')}`;
                const value = daily.filter(d => d.date.startsWith(prefix)).reduce((a, d) => a + (d.totalRevenue || 0), 0);
                cols.push({ label: MONTHS[m], value });
            }
            return cols;
        }
        return [];
    }, [daily, period, start, end]);

    const chartMax = useMemo(() => Math.max(1, ...chart.map(c => c.value)), [chart]);

    const topItems = useMemo(() => {
        const map = new Map<string, { quantity: number; revenue: number }>();
        for (const d of daily) {
            for (const it of d.items || []) {
                const prev = map.get(it.name) || { quantity: 0, revenue: 0 };
                prev.quantity += it.quantity || 0;
                prev.revenue += it.revenue || 0;
                map.set(it.name, prev);
            }
        }
        return Array.from(map.entries())
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [daily]);

    return (
        <div className="posdash">
            <header className="posdash__bar">
                <button type="button" className="posdash__menu" aria-label="Open menu" onClick={onOpenSidebar}>
                    <PosIcon name="menu" size={22} />
                </button>
                <h1 className="posdash__title">Dashboard</h1>
                <div className="posdash__seg" role="tablist" aria-label="Report period">
                    {([['today', 'Today'], ['month', 'Monthly'], ['year', 'Yearly']] as [Period, string][]).map(([p, l]) => (
                        <button
                            key={p}
                            type="button"
                            role="tab"
                            aria-selected={period === p}
                            className={period === p ? 'is-active' : ''}
                            onClick={() => setPeriod(p)}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </header>

            <div className="posdash__body">
                {isLoading ? (
                    <div className="posdash__loading">
                        <div className="posdash__spinner" />
                        <p>Loading {label}…</p>
                    </div>
                ) : error ? (
                    <div className="posdash__empty">
                        <PosIcon name="error" size={40} />
                        <p>{error}</p>
                        <button type="button" className="v2-btn v2-btn--secondary" onClick={fetchData}>Try again</button>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="posdash__stats">
                            <div className="statcard">
                                <div className="statcard__top">
                                    <span className="statcard__label">Revenue</span>
                                    <span className="statcard__icon"><PosIcon name="payments" size={18} fill={1} /></span>
                                </div>
                                <span className="statcard__value statcard__value--accent tnum">{formatCurrency(stats.revenue, storeSettings)}</span>
                            </div>
                            <div className="statcard">
                                <div className="statcard__top">
                                    <span className="statcard__label">Transactions</span>
                                    <span className="statcard__icon"><PosIcon name="receipt_long" size={18} fill={1} /></span>
                                </div>
                                <span className="statcard__value tnum">{stats.txns}</span>
                            </div>
                            <div className="statcard">
                                <div className="statcard__top">
                                    <span className="statcard__label">Avg. Sale</span>
                                    <span className="statcard__icon"><PosIcon name="trending_up" size={18} fill={1} /></span>
                                </div>
                                <span className="statcard__value tnum">{formatCurrency(stats.avg, storeSettings)}</span>
                            </div>
                            <div className="statcard">
                                <div className="statcard__top">
                                    <span className="statcard__label">Items Sold</span>
                                    <span className="statcard__icon"><PosIcon name="inventory_2" size={18} fill={1} /></span>
                                </div>
                                <span className="statcard__value tnum">{stats.itemsSold}</span>
                            </div>
                        </div>

                        {/* Chart (month / year) */}
                        {period !== 'today' && (
                            <div className="posdash__card">
                                <div className="posdash__card-head">
                                    <h3>Revenue {period === 'month' ? 'by day' : 'by month'}</h3>
                                    <span>{label}</span>
                                </div>
                                {chart.every(c => c.value === 0) ? (
                                    <div className="posdash__empty" style={{ padding: 'var(--v2-space-10) 0' }}>
                                        <PosIcon name="bar_chart" size={36} />
                                        <p>No sales recorded for this period.</p>
                                    </div>
                                ) : (
                                    <div className="chart">
                                        {chart.map((c, i) => (
                                            <div className="chart__col" key={i} title={`${c.label}: ${formatCurrency(c.value, storeSettings)}`}>
                                                <div className="chart__bar-wrap">
                                                    <div className="chart__bar" style={{ height: `${(c.value / chartMax) * 100}%` }} />
                                                </div>
                                                <span className="chart__label">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top items */}
                        <div className="posdash__card">
                            <div className="posdash__card-head">
                                <h3>Top products</h3>
                                <span>{label}</span>
                            </div>
                            {topItems.length === 0 ? (
                                <div className="posdash__empty" style={{ padding: 'var(--v2-space-10) 0' }}>
                                    <PosIcon name="receipt_long" size={36} />
                                    <p>No sales {period === 'today' ? 'today' : 'in this period'} yet.</p>
                                </div>
                            ) : (
                                <div>
                                    {topItems.map((it, i) => (
                                        <div className="topitem" key={it.name}>
                                            <span className="topitem__rank">{i + 1}</span>
                                            <div className="topitem__name" title={it.name}>
                                                {it.name}
                                                <span className="topitem__qty"> · {it.quantity} sold</span>
                                            </div>
                                            <span className="topitem__rev tnum">{formatCurrency(it.revenue, storeSettings)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PosDashboard;
