import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';

// --- Types (mirror backend catalog.service) ----------------------------------
interface CatalogModule {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    pages: string[];
    independentlyPurchasable: boolean;
    isCore: boolean;
    active: boolean;
    sortOrder: number;
}
interface CatalogPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    moduleIds: string[];
    features: string[];
    aiRequestsLimit: number;
    isPopular: boolean;
    active: boolean;
    sortOrder: number;
}

// Curated page keys a module can unlock (mirror Sidebar navItems). Friendly labels.
const PAGE_OPTIONS: { key: string; label: string }[] = [
    { key: 'reports', label: 'Reports' },
    { key: 'quick-view', label: 'AI Quick View' },
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'purchase-orders', label: 'Purchase Orders' },
    { key: 'stock-takes', label: 'Stock Takes' },
    { key: 'accounting', label: 'Accounting' },
    { key: 'customers', label: 'Customers (CRM)' },
    { key: 'logistics', label: 'Logistics' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'directory', label: 'Marketplace Directory' },
    { key: 'orders', label: 'Online Orders' },
    { key: 'returns', label: 'Returns' },
    { key: 'audit-trail', label: 'Audit Trail' },
    { key: 'whatsapp/conversations', label: 'WhatsApp Chats' },
];

const money = (n: number, c = 'ZMW') => {
    const sym = c === 'USD' ? '$' : c === 'ZMW' ? 'K' : c === 'GBP' ? '£' : c === 'EUR' ? '€' : '';
    const v = (Number.isFinite(n) ? n : 0).toLocaleString();
    return sym ? `${sym}${v}` : `${c} ${v}`;
};

type Tab = 'modules' | 'plans';

const SuperAdminCatalog: React.FC = () => {
    const [tab, setTab] = useState<Tab>('modules');
    const [modules, setModules] = useState<CatalogModule[]>([]);
    const [plans, setPlans] = useState<CatalogPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editModule, setEditModule] = useState<CatalogModule | null>(null);
    const [editPlan, setEditPlan] = useState<CatalogPlan | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [m, p] = await Promise.all([
                api.get<{ modules: CatalogModule[] }>('/superadmin/catalog/modules'),
                api.get<{ plans: CatalogPlan[] }>('/superadmin/catalog/plans'),
            ]);
            setModules(m.modules || []);
            setPlans(p.plans || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load catalog');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const blankModule = (): CatalogModule => ({
        id: '', name: '', description: '', price: 0, currency: 'ZMW',
        pages: [], independentlyPurchasable: true, isCore: false, active: true, sortOrder: (modules.length + 1),
    });
    const blankPlan = (): CatalogPlan => ({
        id: '', name: '', description: '', price: 0, currency: 'ZMW', interval: 'month',
        moduleIds: [], features: [], aiRequestsLimit: 0, isPopular: false, active: true, sortOrder: (plans.length + 1),
    });

    return (
        <main className="flex-1 min-h-0 overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-text">Plans &amp; Pricing</h1>
                        <p className="text-sm text-brand-text-muted mt-1">Configure add-on prices, the pages they unlock, what can be bought independently, and your subscription plans.</p>
                    </div>
                    <button
                        onClick={() => (tab === 'modules' ? setEditModule(blankModule()) : setEditPlan(blankPlan()))}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-sp-green text-white hover:bg-sp-green-dark transition active:scale-95 shadow-sm"
                    >
                        <span className="material-symbols-rounded text-[20px]">add</span>
                        {tab === 'modules' ? 'New add-on' : 'New plan'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="inline-flex p-1 rounded-xl bg-surface-variant border border-brand-border mb-6">
                    {(['modules', 'plans'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === t ? 'bg-sp-green text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                        >
                            {t === 'modules' ? 'Add-on Modules' : 'Subscription Plans'}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={load} className="underline font-bold">Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-surface-variant animate-pulse" />)}
                    </div>
                ) : tab === 'modules' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modules.map(m => (
                            <ModuleCard key={m.id} m={m} onEdit={() => setEditModule(m)} />
                        ))}
                        {modules.length === 0 && <Empty label="No add-on modules yet." />}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map(p => (
                            <PlanCard key={p.id} p={p} modules={modules} onEdit={() => setEditPlan(p)} />
                        ))}
                        {plans.length === 0 && <Empty label="No subscription plans yet." />}
                    </div>
                )}
            </div>

            {editModule && (
                <ModuleEditor
                    initial={editModule}
                    onClose={() => setEditModule(null)}
                    onSaved={() => { setEditModule(null); load(); }}
                />
            )}
            {editPlan && (
                <PlanEditor
                    initial={editPlan}
                    modules={modules}
                    onClose={() => setEditPlan(null)}
                    onSaved={() => { setEditPlan(null); load(); }}
                />
            )}
        </main>
    );
};

// --- Cards -------------------------------------------------------------------

const Pill: React.FC<{ tone: 'green' | 'amber' | 'muted'; children: React.ReactNode }> = ({ tone, children }) => {
    const cls = tone === 'green' ? 'bg-success-muted text-success'
        : tone === 'amber' ? 'bg-sp-amber-soft text-sp-amber'
        : 'bg-surface-variant text-brand-text-muted';
    return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{children}</span>;
};

const ModuleCard: React.FC<{ m: CatalogModule; onEdit: () => void }> = ({ m, onEdit }) => (
    <button onClick={onEdit} className="text-left bg-surface border border-brand-border rounded-2xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
                <h3 className="font-extrabold text-brand-text truncate">{m.name}</h3>
                <p className="text-xs text-brand-text-muted font-mono">{m.id}</p>
            </div>
            <span className="text-xl font-extrabold text-sp-green whitespace-nowrap">{money(m.price, m.currency)}<span className="text-xs text-brand-text-muted font-medium">/mo</span></span>
        </div>
        <p className="text-sm text-brand-text-muted line-clamp-2 mb-3">{m.description || '—'}</p>
        <div className="flex flex-wrap gap-1.5">
            {!m.active && <Pill tone="muted">Inactive</Pill>}
            {m.active && <Pill tone="green">Active</Pill>}
            {m.independentlyPurchasable ? <Pill tone="amber">À-la-carte</Pill> : <Pill tone="muted">Plan-only</Pill>}
            {m.isCore && <Pill tone="muted">Core</Pill>}
            {m.pages.length > 0 && <Pill tone="muted">{m.pages.length} page{m.pages.length === 1 ? '' : 's'}</Pill>}
        </div>
    </button>
);

const PlanCard: React.FC<{ p: CatalogPlan; modules: CatalogModule[]; onEdit: () => void }> = ({ p, modules, onEdit }) => (
    <button onClick={onEdit} className={`text-left bg-surface border rounded-2xl p-5 shadow-sm hover:shadow-md transition ${p.isPopular ? 'border-sp-green ring-1 ring-sp-green/30' : 'border-brand-border'}`}>
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-brand-text">{p.name}</h3>
            {p.isPopular && <Pill tone="green">Popular</Pill>}
        </div>
        <div className="mb-3">
            <span className="text-2xl font-extrabold text-brand-text">{money(p.price, p.currency)}</span>
            <span className="text-sm text-brand-text-muted">/{p.interval}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
            {p.active ? <Pill tone="green">Active</Pill> : <Pill tone="muted">Inactive</Pill>}
            <Pill tone="muted">{p.moduleIds.length} module{p.moduleIds.length === 1 ? '' : 's'}</Pill>
            <Pill tone="muted">AI: {p.aiRequestsLimit === -1 ? '∞' : p.aiRequestsLimit}</Pill>
        </div>
        <p className="text-xs text-brand-text-muted">
            {p.moduleIds.length ? p.moduleIds.map(id => modules.find(m => m.id === id)?.name || id).join(', ') : 'Core only'}
        </p>
    </button>
);

const Empty: React.FC<{ label: string }> = ({ label }) => (
    <div className="col-span-full text-center py-16 text-brand-text-muted text-sm">{label}</div>
);

// --- Module editor -----------------------------------------------------------

const Toggle: React.FC<{ on: boolean; onClick: () => void; label: string; hint?: string }> = ({ on, onClick, label, hint }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-brand-border bg-surface hover:bg-surface-variant transition text-left">
        <span className="min-w-0">
            <span className="block text-sm font-bold text-brand-text">{label}</span>
            {hint && <span className="block text-xs text-brand-text-muted">{hint}</span>}
        </span>
        <span className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-sp-green' : 'bg-surface-variant border border-brand-border'}`}>
            <span className="block w-5 h-5 bg-white rounded-full shadow transition-transform" style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }} />
        </span>
    </button>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <label className="block">
        <span className="block text-xs font-bold text-brand-text-muted uppercase tracking-wide mb-1.5">{label}</span>
        {children}
    </label>
);

const ModuleEditor: React.FC<{ initial: CatalogModule; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const [f, setF] = useState<CatalogModule>(initial);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const isNew = !initial.id;
    const set = (patch: Partial<CatalogModule>) => setF(prev => ({ ...prev, ...patch }));
    const togglePage = (key: string) => set({ pages: f.pages.includes(key) ? f.pages.filter(p => p !== key) : [...f.pages, key] });

    const save = async () => {
        if (!f.name.trim()) { setErr('Name is required'); return; }
        setSaving(true); setErr(null);
        try {
            const body = { ...f, name: f.name.trim() };
            if (isNew) await api.post('/superadmin/catalog/modules', body);
            else await api.put(`/superadmin/catalog/modules/${f.id}`, body);
            onSaved();
        } catch (e: any) {
            setErr(e?.message || 'Failed to save');
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!window.confirm(`Delete add-on "${f.name}"? Stores already granted it keep it until their next change.`)) return;
        setSaving(true);
        try { await api.delete(`/superadmin/catalog/modules/${f.id}`); onSaved(); }
        catch (e: any) { setErr(e?.message || 'Failed to delete'); setSaving(false); }
    };

    return (
        <Modal open onClose={onClose} size="2xl" disabled={saving}
            title={isNew ? 'New add-on module' : 'Edit add-on'}
            icon={<span className="material-symbols-rounded text-sp-green text-[22px]">extension</span>}>
            <div className="p-6 overflow-y-auto space-y-4">
                {err && <div className="p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium">{err}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name"><input className={INPUT_CLASS} value={f.name} onChange={e => set({ name: e.target.value })} placeholder="AI Assistant" /></Field>
                    <Field label="Price / month">
                        <div className="flex gap-2">
                            <select className={INPUT_CLASS + ' !w-24'} value={f.currency} onChange={e => set({ currency: e.target.value })}>
                                <option>ZMW</option><option>USD</option><option>EUR</option><option>GBP</option>
                            </select>
                            <input type="number" min={0} className={INPUT_CLASS} value={f.price} onChange={e => set({ price: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </Field>
                </div>
                <Field label="Description"><textarea className={INPUT_CLASS} rows={2} value={f.description} onChange={e => set({ description: e.target.value })} /></Field>

                <Field label="Pages this add-on unlocks">
                    <div className="flex flex-wrap gap-2">
                        {PAGE_OPTIONS.map(opt => {
                            const on = f.pages.includes(opt.key);
                            return (
                                <button key={opt.key} type="button" onClick={() => togglePage(opt.key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? 'bg-sp-green text-white border-sp-green' : 'bg-surface text-brand-text-muted border-brand-border hover:border-sp-green'}`}>
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-brand-text-muted mt-1.5">Locked pages prompt an upgrade until the store has this add-on.</p>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Toggle on={f.independentlyPurchasable} onClick={() => set({ independentlyPurchasable: !f.independentlyPurchasable })}
                        label="Buy independently" hint="Customers can purchase this à la carte, not just inside a plan." />
                    <Toggle on={f.active} onClick={() => set({ active: !f.active })}
                        label="Active" hint="Inactive add-ons are hidden from customers." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Module ID">
                        <input className={INPUT_CLASS + (isNew ? '' : ' opacity-60')} value={f.id} disabled={!isNew}
                            onChange={e => set({ id: e.target.value })} placeholder="auto from name" />
                    </Field>
                    <Field label="Sort order"><input type="number" className={INPUT_CLASS} value={f.sortOrder} onChange={e => set({ sortOrder: parseInt(e.target.value) || 0 })} /></Field>
                </div>
            </div>
            <div className="p-4 border-t border-brand-border flex items-center justify-between gap-2 shrink-0">
                {!isNew ? <button onClick={remove} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-danger hover:bg-danger-muted transition disabled:opacity-50">Delete</button> : <span />}
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand-text-muted hover:bg-surface-variant transition">Cancel</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sp-green text-white hover:bg-sp-green-dark transition active:scale-95 disabled:opacity-50">{saving ? 'Saving…' : 'Save add-on'}</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Plan editor -------------------------------------------------------------

const PlanEditor: React.FC<{ initial: CatalogPlan; modules: CatalogModule[]; onClose: () => void; onSaved: () => void }> = ({ initial, modules, onClose, onSaved }) => {
    const [f, setF] = useState<CatalogPlan>(initial);
    const [featuresText, setFeaturesText] = useState(initial.features.join('\n'));
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const isNew = !initial.id;
    const set = (patch: Partial<CatalogPlan>) => setF(prev => ({ ...prev, ...patch }));
    const toggleModule = (id: string) => set({ moduleIds: f.moduleIds.includes(id) ? f.moduleIds.filter(m => m !== id) : [...f.moduleIds, id] });
    const includedTotal = useMemo(() => f.moduleIds.reduce((sum, id) => sum + (modules.find(m => m.id === id)?.price || 0), 0), [f.moduleIds, modules]);

    const save = async () => {
        if (!f.name.trim()) { setErr('Name is required'); return; }
        setSaving(true); setErr(null);
        try {
            const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean);
            const body = { ...f, name: f.name.trim(), features };
            if (isNew) await api.post('/superadmin/catalog/plans', body);
            else await api.put(`/superadmin/catalog/plans/${f.id}`, body);
            onSaved();
        } catch (e: any) {
            setErr(e?.message || 'Failed to save');
            setSaving(false);
        }
    };
    const remove = async () => {
        if (!window.confirm(`Delete plan "${f.name}"?`)) return;
        setSaving(true);
        try { await api.delete(`/superadmin/catalog/plans/${f.id}`); onSaved(); }
        catch (e: any) { setErr(e?.message || 'Failed to delete'); setSaving(false); }
    };

    return (
        <Modal open onClose={onClose} size="2xl" disabled={saving}
            title={isNew ? 'New subscription plan' : 'Edit plan'}
            icon={<span className="material-symbols-rounded text-sp-green text-[22px]">workspace_premium</span>}>
            <div className="p-6 overflow-y-auto space-y-4">
                {err && <div className="p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium">{err}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name"><input className={INPUT_CLASS} value={f.name} onChange={e => set({ name: e.target.value })} placeholder="Pro" /></Field>
                    <Field label="Price">
                        <div className="flex gap-2">
                            <select className={INPUT_CLASS + ' !w-24'} value={f.currency} onChange={e => set({ currency: e.target.value })}>
                                <option>ZMW</option><option>USD</option><option>EUR</option><option>GBP</option>
                            </select>
                            <input type="number" min={0} className={INPUT_CLASS} value={f.price} onChange={e => set({ price: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </Field>
                </div>
                <Field label="Description"><input className={INPUT_CLASS} value={f.description} onChange={e => set({ description: e.target.value })} /></Field>

                <Field label="Included add-on modules">
                    <div className="flex flex-wrap gap-2">
                        {modules.length === 0 && <span className="text-sm text-brand-text-muted">Create add-on modules first.</span>}
                        {modules.map(m => {
                            const on = f.moduleIds.includes(m.id);
                            return (
                                <button key={m.id} type="button" onClick={() => toggleModule(m.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? 'bg-sp-green text-white border-sp-green' : 'bg-surface text-brand-text-muted border-brand-border hover:border-sp-green'}`}>
                                    {m.name} · {money(m.price, m.currency)}
                                </button>
                            );
                        })}
                    </div>
                    {f.moduleIds.length > 0 && (
                        <p className="text-xs text-brand-text-muted mt-1.5">À-la-carte value of included add-ons: <b className="text-brand-text">{money(includedTotal, f.currency)}</b>/mo</p>
                    )}
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Billing interval">
                        <select className={INPUT_CLASS} value={f.interval} onChange={e => set({ interval: e.target.value as 'month' | 'year' })}>
                            <option value="month">Monthly</option><option value="year">Yearly</option>
                        </select>
                    </Field>
                    <Field label="AI requests / mo (-1 = ∞)"><input type="number" className={INPUT_CLASS} value={f.aiRequestsLimit} onChange={e => set({ aiRequestsLimit: parseInt(e.target.value) || 0 })} /></Field>
                    <Field label="Sort order"><input type="number" className={INPUT_CLASS} value={f.sortOrder} onChange={e => set({ sortOrder: parseInt(e.target.value) || 0 })} /></Field>
                </div>

                <Field label="Feature bullets (one per line)">
                    <textarea className={INPUT_CLASS} rows={4} value={featuresText} onChange={e => setFeaturesText(e.target.value)} placeholder={'Unlimited Products\nPriority Support'} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Toggle on={f.isPopular} onClick={() => set({ isPopular: !f.isPopular })} label="Most popular" hint="Highlights this plan in the pricing page." />
                    <Toggle on={f.active} onClick={() => set({ active: !f.active })} label="Active" hint="Inactive plans are hidden from customers." />
                </div>
            </div>
            <div className="p-4 border-t border-brand-border flex items-center justify-between gap-2 shrink-0">
                {!isNew ? <button onClick={remove} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-danger hover:bg-danger-muted transition disabled:opacity-50">Delete</button> : <span />}
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand-text-muted hover:bg-surface-variant transition">Cancel</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sp-green text-white hover:bg-sp-green-dark transition active:scale-95 disabled:opacity-50">{saving ? 'Saving…' : 'Save plan'}</button>
                </div>
            </div>
        </Modal>
    );
};

export default SuperAdminCatalog;
