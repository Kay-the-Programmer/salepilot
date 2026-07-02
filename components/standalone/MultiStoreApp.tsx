import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ArrowRightLeft, ShieldCheck, ShieldAlert, Store, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { StoreSettings, User } from '../../types';
import {
    getMyStores, switchStore, registerStoreAndRefreshUser, checkStoreNameAvailability,
    getMyStoresSummary, MyStore, MyStoresSummary,
} from '../../services/storesService';
import { setStoredCurrentStore } from '../../services/authService';
import { formatMoney } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { StatSparkline } from '../reports/charts/StatSparkline';
import { Icon, Avatar } from '../crm/CrmBits';
import AppSwitcher from './AppSwitcher';
import AppNavMenu from './AppNavMenu';
import RailThemeButton from './RailThemeButton';
import Logo from '../../assets/logo.png';
import '../crm/crm.css';

interface MultiStoreAppProps {
    user: User;
    storeSettings: StoreSettings | null;
    onLogout: () => void;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
    /** Soft store switch: Dashboard swaps the user in state so every store-scoped screen refetches — no reload, no logout. */
    onStoreSwitched?: (user: User) => void;
}

type BizSection = 'overview' | 'businesses';

const NAV: { id: BizSection; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'monitoring' },
    { id: 'businesses', label: 'Businesses', icon: 'storefront' },
];

const RANGES: { label: string; days: number }[] = [
    { label: 'Today', days: 1 },
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
];

const card = 'bg-surface border border-brand-border rounded-2xl shadow-sm';
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-sp-amber text-white hover:bg-sp-green-dark`;
const btnGhost = `${btn} bg-surface-variant text-brand-text hover:brightness-95`;
const input = 'w-full px-4 py-2.5 rounded-xl border border-brand-border bg-surface-container-lowest text-brand-text focus:ring-2 focus:ring-sp-green/30 focus:border-sp-green outline-none';

const statusPill = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'active') return 'bg-success-muted text-success';
    if (v === 'trial') return 'bg-sp-amber-soft text-sp-amber';
    if (v === 'past_due' || v === 'suspended') return 'bg-danger-muted text-danger';
    return 'bg-surface-variant text-brand-text-muted';
};

/** % change vs the prior window; null when there's no baseline. */
const deltaPct = (cur: number, prev: number): number | null =>
    prev > 0 ? ((cur - prev) / prev) * 100 : null;

const DeltaBadge: React.FC<{ cur: number; prev: number }> = ({ cur, prev }) => {
    const d = deltaPct(cur, prev);
    if (d === null) return <span className="text-xs font-bold text-brand-text-muted">—</span>;
    const up = d >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? 'text-success' : 'text-danger'}`}>
            {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(d).toFixed(0)}%
        </span>
    );
};

export const MultiStoreApp: React.FC<MultiStoreAppProps> = ({ user, onLogout, showSnackbar, onStoreSwitched }) => {
    const navigate = useNavigate();
    const [section, setSection] = useState<BizSection>('overview');

    // Portfolio summary (Overview)
    const [days, setDays] = useState(7);
    const [summary, setSummary] = useState<MyStoresSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(false);

    // Businesses section
    const [stores, setStores] = useState<MyStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', type: '', phone: '', address: '' });
    const [nameTaken, setNameTaken] = useState(false);
    const nameCheckRef = useRef(0);

    const load = () => {
        setLoading(true);
        getMyStores().then(setStores).catch(() => showSnackbar('Could not load your businesses.', 'error')).finally(() => setLoading(false));
    };
    const loadSummary = (d = days) => {
        setSummaryLoading(true);
        setSummaryError(false);
        getMyStoresSummary(d)
            .then(s => { setSummary(s); setSummaryError(!s || !Array.isArray((s as any).stores)); })
            .catch(() => setSummaryError(true))
            .finally(() => setSummaryLoading(false));
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { loadSummary(days); }, [days]);

    // Debounced live availability check on the new-business name.
    useEffect(() => {
        const name = form.name.trim();
        if (name.length < 2) { setNameTaken(false); return; }
        const seq = ++nameCheckRef.current;
        const t = setTimeout(() => {
            checkStoreNameAvailability(name)
                .then(available => { if (seq === nameCheckRef.current) setNameTaken(!available); })
                .catch(() => { /* soft check only */ });
        }, 400);
        return () => clearTimeout(t);
    }, [form.name]);

    const applySwitchedUser = (u: User, storeId: string) => {
        setStoredCurrentStore(storeId);
        if (onStoreSwitched) {
            onStoreSwitched(u);
        } else {
            // Fallback when the host didn't wire the soft switch: hard reload.
            setTimeout(() => window.location.assign('/'), 400);
        }
    };

    const doSwitch = async (s: { id: string; name: string; isCurrent: boolean }, thenOpen = false) => {
        if (s.isCurrent) { if (thenOpen) navigate('/dash'); return; }
        setSwitching(s.id);
        try {
            const refreshed = await switchStore(s.id);
            applySwitchedUser(refreshed, s.id);
            showSnackbar(`Switched to ${s.name}.`, 'success');
            if (thenOpen) { navigate('/dash'); return; }
            // Stay in the hub — refresh both lists so the Active badge moves.
            load();
            loadSummary();
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not switch business.', 'error');
        } finally {
            setSwitching(null);
        }
    };

    const create = async () => {
        if (form.name.trim().length < 2) { showSnackbar('Enter a business name (min 2 characters).', 'error'); return; }
        if (nameTaken) { showSnackbar('That business name is already taken.', 'error'); return; }
        setCreating(true);
        try {
            const { store, user: refreshed } = await registerStoreAndRefreshUser(
                form.name.trim(),
                form.type.trim() ? [form.type.trim()] : [],
                form.phone.trim() || undefined,
                form.address.trim() || undefined,
            );
            applySwitchedUser(refreshed, store.id); // backend makes the new store active
            showSnackbar(`${store.name} created and set as your active business.`, 'success');
            setForm({ name: '', type: '', phone: '', address: '' });
            setShowForm(false);
            load();
            loadSummary();
        } catch (e: any) {
            showSnackbar(e?.message || 'Could not create the business.', 'error');
        } finally { setCreating(false); }
    };

    const current = stores.find(s => s.isCurrent);
    const others = stores.filter(s => !s.isCurrent);

    // Attention = low-stock items across businesses + subscriptions expiring within 7 days.
    const attention = useMemo(() => {
        if (!summary?.stores?.length) return { lowStock: 0, expiring: 0 };
        const soon = Date.now() + 7 * 86_400_000;
        return {
            lowStock: summary.stores.reduce((n, s) => n + (s.lowStockCount || 0), 0),
            expiring: summary.stores.filter(s => s.subscriptionEndsAt && new Date(s.subscriptionEndsAt).getTime() <= soon).length,
        };
    }, [summary]);

    const money = (n: number) => formatMoney(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const renderOverview = () => (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-brand-text">Portfolio overview</h1>
                    <p className="text-sm text-brand-text-muted mt-0.5">How each of your businesses is performing</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-surface-variant rounded-xl p-0.5">
                        {RANGES.map(r => (
                            <button
                                key={r.days}
                                onClick={() => setDays(r.days)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${days === r.days ? 'bg-sp-amber text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => loadSummary()} className="p-2 rounded-xl bg-surface border border-brand-border text-brand-text-muted hover:text-brand-text transition-colors active:scale-95" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Combined toplines */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${card} p-4`}>
                    <div className="text-sm text-brand-text-muted">Combined revenue</div>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-brand-text tnum">{summary?.totals ? money(summary.totals.revenue) : '—'}</span>
                        {summary?.totals && <DeltaBadge cur={summary.totals.revenue} prev={summary.totals.prevRevenue} />}
                    </div>
                </div>
                <div className={`${card} p-4`}>
                    <div className="text-sm text-brand-text-muted">Transactions</div>
                    <div className="text-2xl font-extrabold text-brand-text mt-1 tnum">{summary?.totals ? summary.totals.transactions : '—'}</div>
                </div>
                <div className={`${card} p-4`}>
                    <div className="text-sm text-brand-text-muted">Businesses</div>
                    <div className="text-2xl font-extrabold text-brand-text mt-1 tnum">{summary?.stores?.length ?? stores.length ?? '—'}</div>
                </div>
                <div className={`${card} p-4`}>
                    <div className="text-sm text-brand-text-muted">Needs attention</div>
                    <div className={`text-2xl font-extrabold mt-1 tnum ${attention.lowStock + attention.expiring > 0 ? 'text-sp-amber' : 'text-brand-text'}`}>
                        {summary ? attention.lowStock + attention.expiring : '—'}
                    </div>
                    {summary && (attention.lowStock > 0 || attention.expiring > 0) && (
                        <div className="text-xs text-brand-text-muted mt-0.5">
                            {[attention.lowStock > 0 ? `${attention.lowStock} low stock` : '', attention.expiring > 0 ? `${attention.expiring} sub${attention.expiring !== 1 ? 's' : ''} expiring` : ''].filter(Boolean).join(' · ')}
                        </div>
                    )}
                </div>
            </div>

            {/* Per-business performance */}
            {summaryLoading && !summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[0, 1].map(i => <div key={i} className={`${card} h-56 animate-pulse`} />)}
                </div>
            ) : summaryError ? (
                <div className={`${card} p-8 text-center space-y-3`}>
                    <p className="text-sm text-brand-text-muted">Couldn't load your businesses' performance. Check your connection.</p>
                    <button className={btnGhost} onClick={() => loadSummary()}><RefreshCw className="w-4 h-4" /> Try again</button>
                </div>
            ) : !summary?.stores?.length ? (
                <div className={`${card} p-10 text-center space-y-4`}>
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-sp-green-soft text-sp-green flex items-center justify-center"><Store className="w-7 h-7" /></div>
                    <div>
                        <p className="font-extrabold text-brand-text">No businesses yet</p>
                        <p className="text-sm text-brand-text-muted mt-1">Create your first business to start selling.</p>
                    </div>
                    <button className={btnPrimary} onClick={() => { setSection('businesses'); setShowForm(true); }}><Plus className="w-4 h-4" /> Create a business</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.stores.map(s => (
                        <div key={s.id} className={`${card} p-5 ${s.isCurrent ? 'ring-2 ring-sp-green/30' : ''}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.isCurrent ? 'bg-sp-green-soft text-sp-green' : 'bg-surface-variant text-brand-text-muted'}`}>
                                        <Store className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-brand-text truncate">{s.name}</h3>
                                            {s.isCurrent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sp-amber text-white shrink-0"><Check className="w-3 h-3" /> Active</span>}
                                        </div>
                                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusPill(s.subscriptionStatus)}`}>{s.subscriptionStatus || s.status}</span>
                                    </div>
                                </div>
                                <DeltaBadge cur={s.revenue} prev={s.prevRevenue} />
                            </div>

                            <div className="mt-3 flex items-end justify-between gap-3">
                                <div>
                                    <div className="text-2xl font-extrabold text-brand-text tnum">{money(s.revenue)}</div>
                                    <div className="text-xs text-brand-text-muted">{s.transactions} sale{s.transactions !== 1 ? 's' : ''} · {RANGES.find(r => r.days === days)?.label.toLowerCase()}</div>
                                </div>
                                <div className="w-32">
                                    <StatSparkline data={s.trend.map(t => ({ value: t.revenue }))} color="#FF7F27" height={44} />
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-brand-border grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className={`text-sm font-extrabold tnum ${s.lowStockCount > 0 ? 'text-sp-amber' : 'text-brand-text'}`}>{s.lowStockCount}</div>
                                    <div className="text-[11px] text-brand-text-muted">Low stock</div>
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-brand-text tnum">{money(s.inventoryValue)}</div>
                                    <div className="text-[11px] text-brand-text-muted">Inventory</div>
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-brand-text tnum">{s.customersCount}</div>
                                    <div className="text-[11px] text-brand-text-muted">Customers</div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button className={`${btnPrimary} flex-1`} disabled={switching === s.id} onClick={() => doSwitch(s, true)}>
                                    {switching === s.id ? 'Switching…' : 'Open'}
                                </button>
                                {!s.isCurrent && (
                                    <button className={btnGhost} disabled={switching === s.id} onClick={() => doSwitch(s)}>
                                        <ArrowRightLeft className="w-4 h-4" /> Make active
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderBusinesses = () => (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 gap-5">
            {/* Active business */}
            {current && (
                <div className={`${card} p-6 ring-2 ring-sp-green/30`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-sp-green-soft text-sp-green flex items-center justify-center shrink-0"><Store className="w-6 h-6" /></div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-extrabold text-brand-text truncate">{current.name}</h2>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sp-amber text-white"><Check className="w-3 h-3" /> Active</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-muted">
                                    <span className={`px-2 py-0.5 rounded-full font-bold ${statusPill(current.subscriptionStatus)}`}>{current.subscriptionStatus || current.status}</span>
                                    {current.subscriptionEndsAt && <span>until {formatDate(current.subscriptionEndsAt)}</span>}
                                    {current.isVerified ? <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="w-3.5 h-3.5" /> Verified</span> : <span className="inline-flex items-center gap-1 text-sp-amber"><ShieldAlert className="w-3.5 h-3.5" /> Unverified</span>}
                                </div>
                            </div>
                        </div>
                        <button className={btnGhost} onClick={() => navigate('/dash')}>Open</button>
                    </div>
                </div>
            )}

            {/* Other businesses */}
            {loading ? (
                <div className={`${card} p-6 text-center text-sm text-brand-text-muted`}>Loading your businesses…</div>
            ) : others.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted px-1">Switch business</p>
                    {others.map(s => (
                        <div key={s.id} className={`${card} p-4 flex items-center justify-between gap-3`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-variant text-brand-text-muted flex items-center justify-center shrink-0"><Store className="w-5 h-5" /></div>
                                <div className="min-w-0">
                                    <p className="font-bold text-brand-text truncate">{s.name}</p>
                                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusPill(s.subscriptionStatus)}`}>{s.subscriptionStatus || s.status}</span>
                                </div>
                            </div>
                            <button className={btnGhost} disabled={switching === s.id} onClick={() => doSwitch(s)}>
                                <ArrowRightLeft className="w-4 h-4" /> {switching === s.id ? 'Switching…' : 'Switch'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add a business */}
            {showForm ? (
                <div className={`${card} p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-extrabold text-brand-text">Register a new business</h2>
                        <button className="p-1.5 rounded-lg hover:bg-surface-variant text-brand-text-muted" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3">
                        <label className="block">
                            <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Business name *</span>
                            <input className={`${input} ${nameTaken ? 'border-danger focus:border-danger focus:ring-danger/30' : ''}`} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Downtown Branch" />
                            {nameTaken && <span className="block mt-1 text-xs font-semibold text-danger">This name is already taken — choose another.</span>}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Type (optional)</span>
                                <input className={input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Retail, Restaurant…" />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Phone (optional)</span>
                                <input className={input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+260…" />
                            </label>
                        </div>
                        <label className="block">
                            <span className="block text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-1.5">Address (optional)</span>
                            <input className={input} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City" />
                        </label>
                    </div>
                    <p className="text-xs text-brand-text-muted mt-3">The new business is a full, separate entity with its own products, sales and settings. It starts on a trial and becomes your active store — you can switch back any time.</p>
                    <button className={`${btnPrimary} w-full mt-4 py-3`} disabled={creating || nameTaken} onClick={create}>
                        <Plus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create business'}
                    </button>
                </div>
            ) : (
                <button className={`${card} p-5 flex items-center gap-3 text-left hover:border-sp-green hover:shadow-md transition-all`} onClick={() => setShowForm(true)}>
                    <div className="w-10 h-10 rounded-xl bg-sp-green-soft text-sp-green flex items-center justify-center shrink-0"><Plus className="w-5 h-5" /></div>
                    <div>
                        <p className="font-bold text-brand-text">Register another business</p>
                        <p className="text-sm text-brand-text-muted">Run multiple shops or entities from one account.</p>
                    </div>
                </button>
            )}
        </div>
    );

    return (
        <div className="crm">
            {/* Desktop rail */}
            <aside className="crm-rail" aria-label="Business Manager navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="domain" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">Business Manager</span>
                        <span className="crm-rail__brand-sub">All your businesses</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`crm-rail__item${section === item.id ? ' is-active' : ''}`}
                            aria-current={section === item.id ? 'page' : undefined}
                            onClick={() => setSection(item.id)}
                        >
                            <Icon name={item.icon} size={22} fill={section === item.id ? 1 : 0} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={() => navigate('/')}>
                        <Icon name="grid_view" size={22} /> Full App
                    </button>
                    <RailThemeButton />
                    <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
                        <Icon name="logout" size={22} /> Logout
                    </button>
                    <div className="crm-rail__user">
                        <Avatar name={user?.name} src={(user as any)?.profilePicture} size={36} />
                        <div className="crm-rail__user-info">
                            <span className="crm-rail__user-name">{user?.name}</span>
                            <span className="crm-rail__user-role">Owner</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content column */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="businesses" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={NAV.map(n => ({ icon: n.icon, label: n.label, active: section === n.id, onClick: () => setSection(n.id) }))}
                            onExit={() => navigate('/')}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-background">
                    {section === 'overview' ? renderOverview() : renderBusinesses()}
                </main>
            </div>
        </div>
    );
};

export default MultiStoreApp;
