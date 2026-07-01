import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { formatRelativeDate } from '../../utils/date';
import { INPUT_CLASS } from '../../utils/ui';
import {
    ChatBubbleLeftRightIcon,
    ClockIcon,
    SearchIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    SparklesIcon,
    UserCircleIcon,
    BuildingStorefrontIcon,
} from '../../components/icons';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'praise' | 'general';
type FeedbackStatus = 'new' | 'reviewing' | 'planned' | 'resolved' | 'dismissed';

interface FeedbackItem {
    id: string;
    storeId?: string;
    storeName?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    userRole?: string;
    type: FeedbackType;
    rating?: number | null;
    subject?: string;
    message: string;
    page?: string;
    platform?: string;
    appVersion?: string;
    status: FeedbackStatus;
    adminNotes?: string;
    createdAt: string;
    updatedAt?: string;
}

interface FeedbackStats {
    total: number;
    newCount: number;
    openCount: number;
    last7: number;
    last30: number;
    ratedCount: number;
    avgRating: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    ratingDistribution: Record<string, number>;
    trend: { day: string; count: number }[];
}

const TYPE_META: Record<FeedbackType, { label: string; emoji: string; cls: string }> = {
    bug: { label: 'Bug', emoji: '🐞', cls: 'bg-danger-muted text-danger' },
    feature: { label: 'Feature', emoji: '✨', cls: 'bg-sp-green-soft text-sp-green-dark' },
    improvement: { label: 'Improvement', emoji: '📈', cls: 'bg-sp-amber-soft text-sp-amber' },
    praise: { label: 'Praise', emoji: '💚', cls: 'bg-success-muted text-success' },
    general: { label: 'General', emoji: '💬', cls: 'bg-surface-variant text-brand-text-muted' },
};

const STATUS_META: Record<FeedbackStatus, { label: string; cls: string }> = {
    new: { label: 'New', cls: 'bg-sp-green-soft text-sp-green-dark' },
    reviewing: { label: 'Reviewing', cls: 'bg-sp-amber-soft text-sp-amber' },
    planned: { label: 'Planned', cls: 'bg-info-muted text-info' },
    resolved: { label: 'Resolved', cls: 'bg-success-muted text-success' },
    dismissed: { label: 'Dismissed', cls: 'bg-surface-variant text-brand-text-muted' },
};

const STATUS_ORDER: FeedbackStatus[] = ['new', 'reviewing', 'planned', 'resolved', 'dismissed'];

const Stars: React.FC<{ value?: number | null; size?: number }> = ({ value, size = 14 }) => {
    if (!value) return <span className="text-xs text-brand-text-muted">No rating</span>;
    return (
        <span className="inline-flex items-center gap-0.5" title={`${value} / 5`}>
            {[1, 2, 3, 4, 5].map(n => (
                <svg key={n} width={size} height={size} viewBox="0 0 24 24"
                    className={n <= value ? 'text-sp-amber' : 'text-brand-border'}
                    fill="currentColor">
                    <path d="M11.48 3.5a.56.56 0 011.04 0l2.08 4.22a.56.56 0 00.42.31l4.66.68c.5.07.7.69.34 1.04l-3.37 3.29a.56.56 0 00-.16.5l.8 4.64a.56.56 0 01-.82.59l-4.17-2.19a.56.56 0 00-.52 0l-4.17 2.19a.56.56 0 01-.81-.59l.79-4.64a.56.56 0 00-.16-.5L4.4 9.75a.56.56 0 01.31-.96l4.66-.68a.56.56 0 00.42-.31l2.08-4.3z" />
                </svg>
            ))}
        </span>
    );
};

const SuperAdminFeedback: React.FC = () => {
    const { showToast } = useToast();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | FeedbackStatus>('open');
    const [typeFilter, setTypeFilter] = useState<'all' | FeedbackType>('all');
    const [search, setSearch] = useState('');

    // Per-row triage draft + saving state
    const [expanded, setExpanded] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (search.trim()) params.set('search', search.trim());
            const [listResp, statsResp] = await Promise.all([
                api.get<{ feedback: FeedbackItem[] }>(`/feedback?${params.toString()}`),
                api.get<{ stats: FeedbackStats }>(`/feedback/stats`),
            ]);
            setItems(listResp.feedback || []);
            setStats(statsResp.stats || null);
        } catch (e: any) {
            showToast(e?.message || 'Failed to load feedback', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reload when server-side filters change (search is debounced).
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter, typeFilter]);
    useEffect(() => {
        const t = setTimeout(load, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [search]);

    const patch = async (id: string, body: { status?: FeedbackStatus; adminNotes?: string }) => {
        setSavingId(id);
        try {
            const resp = await api.patch<{ feedback: FeedbackItem }>(`/feedback/${id}`, body);
            const updated = (resp as any).feedback as FeedbackItem;
            setItems(prev => prev.map(it => (it.id === id ? { ...it, ...updated } : it)));
            showToast('Feedback updated', 'success');
            // Stats shift when status changes — refresh the aggregates quietly.
            if (body.status) {
                try {
                    const s = await api.get<{ stats: FeedbackStats }>(`/feedback/stats`);
                    setStats(s.stats);
                } catch { /* non-fatal */ }
            }
        } catch (e: any) {
            showToast(e?.message || 'Update failed', 'error');
        } finally {
            setSavingId(null);
        }
    };

    const toggleExpand = (it: FeedbackItem) => {
        if (expanded === it.id) { setExpanded(null); return; }
        setExpanded(it.id);
        setNoteDraft(it.adminNotes || '');
    };

    const maxTrend = useMemo(
        () => Math.max(1, ...(stats?.trend || []).map(t => t.count)),
        [stats]
    );

    const ratingBars = useMemo(() => {
        const dist = stats?.ratingDistribution || {};
        const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
        return [5, 4, 3, 2, 1].map(n => ({
            star: n,
            count: dist[n] || 0,
            pct: Math.round(((dist[n] || 0) / total) * 100),
        }));
    }, [stats]);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-sp-green-dark">Platform</p>
                        <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight text-brand-text flex items-center gap-3">
                            <span className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center">
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                            </span>
                            Feedback
                        </h1>
                        <p className="text-brand-text-muted mt-1">
                            What your merchants are telling you — collected in-app, analyzed and triaged here.
                        </p>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-text bg-surface border border-brand-border rounded-xl hover:bg-surface-variant transition-all disabled:opacity-50 shadow-sm active:scale-95"
                    >
                        <ClockIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <span className="w-11 h-11 rounded-xl bg-sp-green-soft text-sp-green-dark flex items-center justify-center"><ChatBubbleLeftRightIcon className="w-6 h-6" /></span>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Total feedback</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{stats?.total ?? '—'}</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">{stats?.last7 ?? 0} in last 7 days</p>
                    </div>
                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <span className="w-11 h-11 rounded-xl bg-sp-amber-soft text-sp-amber flex items-center justify-center"><ExclamationTriangleIcon className="w-6 h-6" /></span>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Open items</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{stats?.openCount ?? '—'}</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">{stats?.newCount ?? 0} brand new</p>
                    </div>
                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <span className="w-11 h-11 rounded-xl bg-success-muted text-success flex items-center justify-center"><SparklesIcon className="w-6 h-6" /></span>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Avg rating</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-success tnum">
                            {stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}
                            <span className="text-base text-brand-text-muted font-bold"> / 5</span>
                        </p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">{stats?.ratedCount ?? 0} rated</p>
                    </div>
                    <div className="bg-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                        <span className="w-11 h-11 rounded-xl bg-info-muted text-info flex items-center justify-center"><CheckCircleIcon className="w-6 h-6" /></span>
                        <p className="mt-4 text-[13px] font-semibold tracking-wide text-brand-text-muted uppercase">Resolved</p>
                        <p className="mt-1 text-3xl font-extrabold tracking-tight text-brand-text tnum">{stats?.byStatus?.resolved ?? 0}</p>
                        <p className="mt-1 text-xs font-semibold text-brand-text-muted">{stats?.byStatus?.dismissed ?? 0} dismissed</p>
                    </div>
                </div>

                {/* Analytics row: type mix, ratings, 30-day trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* By type */}
                    <div className="bg-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-extrabold tracking-tight text-brand-text uppercase">By type</h3>
                        <div className="mt-4 space-y-3">
                            {(Object.keys(TYPE_META) as FeedbackType[]).map(t => {
                                const count = stats?.byType?.[t] || 0;
                                const total = stats?.total || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={t}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-bold text-brand-text">{TYPE_META[t].emoji} {TYPE_META[t].label}</span>
                                            <span className="font-semibold text-brand-text-muted tnum">{count}</span>
                                        </div>
                                        <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                                            <div className="h-full bg-sp-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rating distribution */}
                    <div className="bg-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-extrabold tracking-tight text-brand-text uppercase">Rating distribution</h3>
                        <div className="mt-4 space-y-3">
                            {ratingBars.map(r => (
                                <div key={r.star} className="flex items-center gap-3">
                                    <span className="w-10 shrink-0 text-xs font-bold text-brand-text flex items-center gap-0.5">
                                        {r.star}
                                        <svg width="12" height="12" viewBox="0 0 24 24" className="text-sp-amber" fill="currentColor"><path d="M11.48 3.5a.56.56 0 011.04 0l2.08 4.22a.56.56 0 00.42.31l4.66.68c.5.07.7.69.34 1.04l-3.37 3.29a.56.56 0 00-.16.5l.8 4.64a.56.56 0 01-.82.59l-4.17-2.19a.56.56 0 00-.52 0l-4.17 2.19a.56.56 0 01-.81-.59l.79-4.64a.56.56 0 00-.16-.5L4.4 9.75a.56.56 0 01.31-.96l4.66-.68a.56.56 0 00.42-.31l2.08-4.3z" /></svg>
                                    </span>
                                    <div className="flex-1 h-2.5 bg-surface-variant rounded-full overflow-hidden">
                                        <div className="h-full bg-sp-amber rounded-full transition-all duration-500" style={{ width: `${r.pct}%` }} />
                                    </div>
                                    <span className="w-8 shrink-0 text-right text-xs font-semibold text-brand-text-muted tnum">{r.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 30-day trend */}
                    <div className="bg-surface border border-brand-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-extrabold tracking-tight text-brand-text uppercase">Last 30 days</h3>
                        {(stats?.trend?.length ?? 0) === 0 ? (
                            <p className="mt-6 text-sm text-brand-text-muted">No submissions yet.</p>
                        ) : (
                            <div className="mt-6 flex items-end gap-1 h-28">
                                {stats!.trend.map(t => (
                                    <div key={t.day} className="flex-1 group relative flex flex-col justify-end">
                                        <div
                                            className="w-full bg-sp-green/70 group-hover:bg-sp-green rounded-t transition-all"
                                            style={{ height: `${Math.max(4, (t.count / maxTrend) * 100)}%` }}
                                            title={`${t.day}: ${t.count}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="mt-3 text-xs font-semibold text-brand-text-muted">{stats?.last30 ?? 0} total this month</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {(['open', 'all', ...STATUS_ORDER] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 ${statusFilter === s
                                    ? 'bg-sp-amber text-white shadow-sm'
                                    : 'bg-surface border border-brand-border text-brand-text-muted hover:bg-surface-variant'}`}
                            >
                                {s === 'all' ? 'All' : s === 'open' ? 'Open' : STATUS_META[s].label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="bg-surface border border-brand-border rounded-xl py-2.5 px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-sp-green/30"
                        >
                            <option value="all">All types</option>
                            {(Object.keys(TYPE_META) as FeedbackType[]).map(t => (
                                <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <SearchIcon className="w-4 h-4 text-brand-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search feedback…"
                                className={`${INPUT_CLASS} pl-10 w-full sm:w-64`}
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse bg-surface-variant rounded-2xl h-32 border border-brand-border" />
                        ))
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-surface border border-brand-border rounded-2xl">
                            <div className="w-20 h-20 bg-sp-green-soft rounded-full flex items-center justify-center mb-5">
                                <ChatBubbleLeftRightIcon className="w-9 h-9 text-sp-green-dark" />
                            </div>
                            <h3 className="text-lg font-extrabold tracking-tight text-brand-text">No feedback here</h3>
                            <p className="text-sm text-brand-text-muted mt-1">Try a different filter, or wait for merchants to weigh in.</p>
                        </div>
                    ) : (
                        items.map(it => {
                            const tm = TYPE_META[it.type] || TYPE_META.general;
                            const sm = STATUS_META[it.status] || STATUS_META.new;
                            const isOpen = expanded === it.id;
                            return (
                                <div key={it.id} className="bg-surface border border-brand-border rounded-2xl shadow-sm transition-all hover:shadow-md">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl ${tm.cls}`}>{tm.emoji}</div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${tm.cls}`}>{tm.label}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${sm.cls}`}>{sm.label}</span>
                                                        <Stars value={it.rating} />
                                                    </div>
                                                    {it.subject && <h4 className="mt-1.5 text-base font-bold text-brand-text tracking-tight truncate">{it.subject}</h4>}
                                                    <p className="mt-1 text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{it.message}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleExpand(it)}
                                                className="shrink-0 px-3 py-2 rounded-xl bg-surface border border-brand-border text-brand-text text-xs font-bold hover:bg-surface-variant transition-all active:scale-95"
                                            >
                                                {isOpen ? 'Close' : 'Triage'}
                                            </button>
                                        </div>

                                        {/* Meta row */}
                                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-text-muted">
                                            <span className="inline-flex items-center gap-1.5"><UserCircleIcon className="w-3.5 h-3.5" />{it.userName || 'Unknown'}{it.userRole ? ` · ${it.userRole}` : ''}</span>
                                            {it.storeName && <span className="inline-flex items-center gap-1.5"><BuildingStorefrontIcon className="w-3.5 h-3.5" />{it.storeName}</span>}
                                            <span className="inline-flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" />{formatRelativeDate(it.createdAt)}</span>
                                            {it.page && <span className="font-mono opacity-80">{it.page}</span>}
                                        </div>
                                    </div>

                                    {/* Triage panel */}
                                    {isOpen && (
                                        <div className="border-t border-brand-border p-5 bg-surface-variant/40 space-y-4 rounded-b-2xl">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-2">Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {STATUS_ORDER.map(s => (
                                                        <button
                                                            key={s}
                                                            disabled={savingId === it.id}
                                                            onClick={() => patch(it.id, { status: s })}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${it.status === s ? STATUS_META[s].cls + ' ring-2 ring-sp-green/40' : 'bg-surface border border-brand-border text-brand-text-muted hover:bg-surface-variant'}`}
                                                        >
                                                            {STATUS_META[s].label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-2">Internal note</label>
                                                <textarea
                                                    className={`${INPUT_CLASS} h-24 resize-none`}
                                                    placeholder="Notes for your team (not shown to the merchant)…"
                                                    value={noteDraft}
                                                    onChange={e => setNoteDraft(e.target.value)}
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        disabled={savingId === it.id || noteDraft === (it.adminNotes || '')}
                                                        onClick={() => patch(it.id, { adminNotes: noteDraft })}
                                                        className="px-4 py-2 rounded-xl bg-sp-amber text-white text-xs font-bold hover:bg-sp-green-dark transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {savingId === it.id ? 'Saving…' : 'Save note'}
                                                    </button>
                                                </div>
                                            </div>
                                            {it.userEmail && (
                                                <a
                                                    href={`mailto:${it.userEmail}?subject=${encodeURIComponent('Re: your SalePilot feedback')}`}
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sp-green-dark hover:underline"
                                                >
                                                    Reply to {it.userEmail}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminFeedback;
