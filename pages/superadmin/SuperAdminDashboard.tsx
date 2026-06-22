import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatMoney } from '../../utils/currency';
import { RevenueSummary, StoreStats, User } from '../../types';

/**
 * Super Admin Dashboard — "Modern Tactile" redesign (see design_ref/DESIGN.md).
 *
 * A clean, warm, high-legibility platform overview built on the SalePilot
 * design tokens: warm off-white canvas, SalePilot Green primary, soft shadows,
 * generously rounded surfaces and pill status indicators. No decorative
 * animation — information first.
 */

type Tone = 'primary' | 'success' | 'amber' | 'danger' | 'neutral';

const TONE: Record<Tone, { chip: string; icon: string; accent: string }> = {
    primary: { chip: 'bg-sp-green-soft text-sp-green-dark', icon: 'text-sp-green-dark', accent: 'text-sp-green-dark' },
    success: { chip: 'bg-success-muted text-success', icon: 'text-success', accent: 'text-success' },
    amber:   { chip: 'bg-sp-amber-soft text-sp-amber', icon: 'text-sp-amber', accent: 'text-sp-amber' },
    danger:  { chip: 'bg-danger-muted text-danger', icon: 'text-danger', accent: 'text-danger' },
    neutral: { chip: 'bg-surface-variant text-brand-text-muted', icon: 'text-brand-text-muted', accent: 'text-brand-text-muted' },
};

const HEALTH_BADGE: Record<'checking' | 'ok' | 'degraded', { cls: string; dot: string; label: string; pulse: boolean }> = {
    checking: { cls: 'bg-surface-variant text-brand-text-muted', dot: 'bg-brand-text-muted', label: 'Checking status…', pulse: false },
    ok:       { cls: 'bg-success-muted text-success', dot: 'bg-success', label: 'All systems operational', pulse: true },
    degraded: { cls: 'bg-danger-muted text-danger', dot: 'bg-danger', label: 'Service degraded', pulse: false },
};

const formatCurrency = (amount: number) =>
    formatMoney(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);

const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
};

/* ────────────────────────────── Sub-components ───────────────────────────── */

const StatCard: React.FC<{
    label: string;
    value: string;
    icon: string;
    tone: Tone;
    sub?: React.ReactNode;
}> = ({ label, value, icon, tone, sub }) => {
    const t = TONE[tone];
    return (
        <div className="group bg-surface border border-brand-border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
                <span className={`material-symbols-rounded ${t.chip} w-11 h-11 rounded-xl flex items-center justify-center text-[22px]`}>
                    {icon}
                </span>
                {sub}
            </div>
            <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">{label}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{value}</p>
        </div>
    );
};

const Pill: React.FC<{ children: React.ReactNode; tone: 'up' | 'down' | 'flat' }> = ({ children, tone }) => {
    const cls =
        tone === 'up' ? 'bg-success-muted text-success'
        : tone === 'down' ? 'bg-danger-muted text-danger'
        : 'bg-surface-variant text-brand-text-muted';
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
            {tone !== 'flat' && (
                <span className="material-symbols-rounded text-[14px]">{tone === 'up' ? 'trending_up' : 'trending_down'}</span>
            )}
            {children}
        </span>
    );
};

const RevenueChart: React.FC<{ revSummary: RevenueSummary | null; growth: number | null }> = ({ revSummary, growth }) => {
    const [range, setRange] = useState<'3m' | '6m' | '1y'>('6m');

    const months = useMemo(() => {
        const all = revSummary?.byMonth ?? [];
        const take = range === '3m' ? 3 : range === '6m' ? 6 : 12;
        // byMonth is newest-first; show oldest → newest along the x-axis.
        return all.slice(0, take).slice().reverse();
    }, [revSummary?.byMonth, range]);

    const max = Math.max(...months.map(m => m.amount), 1);

    return (
        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Cash collected</h2>
                        {growth !== null && (
                            <Pill tone={growth >= 0 ? 'up' : 'down'}>{Math.abs(growth).toFixed(1)}%</Pill>
                        )}
                    </div>
                    <p className="text-sm text-brand-text-muted">
                        {formatCurrency(revSummary?.thisMonthCollected || 0)} this month · {formatCurrency(revSummary?.totalAmount || 0)} lifetime
                    </p>
                </div>
                <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-xl">
                    {(['3m', '6m', '1y'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setRange(p)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                range === p ? 'bg-surface text-sp-green-dark shadow-sm' : 'text-brand-text-muted hover:text-brand-text'
                            }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6 flex-1">
                {months.length > 0 ? (
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
                        {months.map((m, i) => {
                            const height = Math.max((m.amount / max) * 100, 3);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full flex-1 flex items-end justify-center relative">
                                        <div
                                            style={{ height: `${height}%` }}
                                            className="w-full max-w-[44px] rounded-t-lg bg-sp-green/80 group-hover:bg-sp-green transition-all duration-300"
                                        />
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity bg-warm-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap text-center z-10">
                                            <div className="font-bold">{formatCurrency(m.amount)}</div>
                                            <div className="text-warm-400 text-[10px]">{m.count} payments</div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-brand-text-muted">
                                        {m.month.substring(0, 3)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-brand-text-muted">
                        <span className="material-symbols-rounded text-5xl opacity-30">bar_chart</span>
                        <p className="text-sm mt-2">No revenue recorded yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const StoreHealth: React.FC<{ stats: StoreStats }> = ({ stats }) => {
    const rows: { label: string; value: number; tone: Tone; icon: string }[] = [
        { label: 'Active', value: stats.active, tone: 'success', icon: 'check_circle' },
        { label: 'On trial', value: stats.trial, tone: 'amber', icon: 'schedule' },
        { label: 'Past due', value: stats.pastDue ?? 0, tone: 'danger', icon: 'error' },
        { label: 'Canceled', value: stats.canceled ?? 0, tone: 'neutral', icon: 'cancel' },
    ];
    const total = Math.max(stats.total, 1);

    return (
        <div className="bg-surface border border-brand-border rounded-2xl shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-brand-border">
                <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Subscription health</h2>
                <p className="text-sm text-brand-text-muted">{formatNumber(stats.total)} stores on the platform</p>
            </div>
            <div className="p-6 space-y-5 flex-1">
                {rows.map(r => {
                    const pct = Math.round((r.value / total) * 100);
                    return (
                        <div key={r.label}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text">
                                    <span className={`material-symbols-rounded text-[18px] ${TONE[r.tone].icon}`}>{r.icon}</span>
                                    {r.label}
                                </span>
                                <span className="text-sm font-bold text-brand-text tnum">{formatNumber(r.value)} <span className="text-brand-text-muted font-medium">· {pct}%</span></span>
                            </div>
                            <div className="h-2.5 rounded-full bg-surface-variant overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        r.tone === 'success' ? 'bg-success' : r.tone === 'amber' ? 'bg-sp-amber' : r.tone === 'danger' ? 'bg-danger' : 'bg-warm-400'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const QuickLink: React.FC<{ icon: string; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
    <button
        onClick={onClick}
        className="group text-left bg-surface border border-brand-border rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-sp-green/40"
    >
        <div className="flex items-center justify-between">
            <span className="material-symbols-rounded w-11 h-11 rounded-xl bg-sp-green-soft text-sp-green-dark flex items-center justify-center text-[22px]">
                {icon}
            </span>
            <span className="material-symbols-rounded text-brand-text-muted group-hover:text-sp-green-dark transition-colors">arrow_forward</span>
        </div>
        <p className="mt-4 font-bold text-brand-text">{title}</p>
        <p className="text-sm text-brand-text-muted">{desc}</p>
    </button>
);

/* ──────────────────────────────── Page ──────────────────────────────────── */

const SuperAdminDashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({ total: 0, active: 0, trial: 0, inactive: 0 });
    const [health, setHealth] = useState<'checking' | 'ok' | 'degraded'>('checking');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [revResp, storesResp] = await Promise.all([
                    api.get<{ summary: RevenueSummary }>('/superadmin/revenue/summary'),
                    api.get<{ stores: any[] }>('/superadmin/stores'),
                ]);
                if (cancelled) return;
                setRevSummary(revResp.summary);
                const stores = storesResp.stores || [];
                // Count on a single, mutually-exclusive dimension (subscription status) so the
                // same store can't be tallied under two cards at once.
                setStoreStats({
                    total: stores.length,
                    active: stores.filter((s: any) => s.subscriptionStatus === 'active').length,
                    trial: stores.filter((s: any) => s.subscriptionStatus === 'trial').length,
                    pastDue: stores.filter((s: any) => s.subscriptionStatus === 'past_due').length,
                    canceled: stores.filter((s: any) => s.subscriptionStatus === 'canceled').length,
                    inactive: stores.filter((s: any) => s.status === 'inactive').length,
                });
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Live platform health (real check, not a hardcoded label).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const h = await api.get<{ status?: string }>('/health');
                if (!cancelled) setHealth(h?.status === 'OK' ? 'ok' : 'degraded');
            } catch {
                if (!cancelled) setHealth('degraded');
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Month-over-month revenue growth (newest two months in byMonth).
    const growth = useMemo(() => {
        const m = revSummary?.byMonth ?? [];
        if (m.length < 2 || !m[1].amount) return null;
        return ((m[0].amount - m[1].amount) / m[1].amount) * 100;
    }, [revSummary?.byMonth]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-brand-text-muted">
                    <span className="material-symbols-rounded text-4xl text-sp-green animate-spin">progress_activity</span>
                    <p className="text-sm font-semibold">Loading platform overview…</p>
                </div>
            </div>
        );
    }

    const firstName = (currentUser?.name || 'Super Admin').split(' ')[0];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-sp-green-dark">Platform</p>
                        <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-brand-text">
                            {greeting()}, {firstName}
                        </h1>
                        <p className="mt-1 text-brand-text-muted">Here's how SalePilot is performing across every store.</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 self-start sm:self-auto rounded-full px-3 py-1.5 text-sm font-bold ${HEALTH_BADGE[health].cls}`}>
                        <span className={`w-2 h-2 rounded-full ${HEALTH_BADGE[health].dot} ${HEALTH_BADGE[health].pulse ? 'animate-pulse' : ''}`} />
                        {HEALTH_BADGE[health].label}
                    </span>
                </header>

                {/* KPI cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        label="Monthly recurring (MRR)"
                        value={formatCurrency(revSummary?.mrr || 0)}
                        icon="payments"
                        tone="primary"
                        sub={<span className="text-xs font-bold text-brand-text-muted whitespace-nowrap">ARR {formatCurrency(revSummary?.arr || 0)}</span>}
                    />
                    <StatCard label="Active subscriptions" value={formatNumber(revSummary?.activeSubscriptions ?? storeStats.active)} icon="verified" tone="success" />
                    <StatCard label="On trial" value={formatNumber(revSummary?.trialCount ?? storeStats.trial)} icon="schedule" tone="amber" />
                    <StatCard label="Total stores" value={formatNumber(storeStats.total)} icon="apartment" tone="neutral" />
                </section>

                {/* Revenue + store health */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <RevenueChart revSummary={revSummary} growth={growth} />
                    </div>
                    <div className="lg:col-span-1">
                        <StoreHealth stats={storeStats} />
                    </div>
                </section>

                {/* Quick links */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <QuickLink icon="storefront" title="Manage stores" desc="Review, activate & configure stores" onClick={() => navigate('/superadmin/stores')} />
                    <QuickLink icon="campaign" title="Send a broadcast" desc="Notify stores platform-wide" onClick={() => navigate('/superadmin/notifications')} />
                    <QuickLink icon="credit_card" title="Billing & revenue" desc="Subscriptions and payments" onClick={() => navigate('/superadmin/subscriptions')} />
                </section>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
