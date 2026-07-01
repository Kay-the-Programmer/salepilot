import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { INPUT_CLASS } from '../../utils/ui';
import Modal from '../../components/ui/Modal';
import { MODULES } from '../../utils/entitlements';
import {
    UPSELL_MOMENTS, UpsellMoment, CampaignDTO,
    TriggerField, TriggerOp, TriggerRule, CampaignVariant, CampaignOffer,
} from '../../utils/upsell';

/**
 * Super Admin marketing console — author the upsell *campaigns* that drive add-on
 * revenue. Each campaign either OVERRIDES a built-in moment (same id — retune
 * copy/offer/schedule/A-B, or pause it) or is a BRAND-NEW campaign. They are
 * merged over the shipped defaults by the client engine (utils/upsell.ts).
 */

// --- Backend shape -----------------------------------------------------------
// `module` is loosened to string: the console targets any catalogue module id,
// not just the compile-time ModuleId union the client engine uses.
interface StoredCampaign extends Omit<CampaignDTO, 'module'> {
    module: string;
    active: boolean;     // published? (drafts are hidden from the engine)
    sortOrder: number;
}
type Origin = 'builtin' | 'override' | 'custom';
type Display = StoredCampaign & { origin: Origin };

// --- Option catalogues -------------------------------------------------------
const SURFACES: { value: CampaignDTO['surface']; label: string; hint: string }[] = [
    { value: 'inline_card', label: 'Inline card', hint: 'Card at the top of a feature screen' },
    { value: 'paywall', label: 'Paywall (402)', hint: 'Shown when a locked feature is hit' },
    { value: 'discover_card', label: 'App launcher', hint: 'Tile in the SalePilot apps switcher' },
    { value: 'daily_summary', label: 'Daily summary', hint: 'Nudge on the dashboard summary' },
    { value: 'push', label: 'Push', hint: 'A single local notification' },
];
const STAGES: { value: CampaignDTO['stage']; label: string }[] = [
    { value: 'onboarding', label: 'Onboarding' },
    { value: 'activation', label: 'Activation' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'expansion', label: 'Expansion' },
];
const FIELDS: { value: TriggerField; label: string }[] = [
    { value: 'daysActive', label: 'Days active' },
    { value: 'productCount', label: 'Product count' },
    { value: 'productCap', label: 'Product cap' },
    { value: 'manualAddsThisSession', label: 'Manual adds (this session)' },
    { value: 'customerCount', label: 'Customer count' },
    { value: 'dormantCustomerCount', label: 'Dormant customers' },
    { value: 'recentStockoutCount', label: 'Out-of-stock items' },
    { value: 'userCount', label: 'Team members' },
    { value: 'storeCount', label: 'Store count' },
    { value: 'salesCount', label: 'Total sales' },
    { value: 'cashSaleCount', label: 'Cash sales' },
];
const OPS: TriggerOp[] = ['>=', '<=', '>', '<', '=='];

// Surfaces that render in a specific on-screen slot; a NEW campaign on these must
// pick a placement to appear (built-in moments are placed by id in the code).
const PLACEMENT_SURFACES = ['inline_card', 'daily_summary', 'discover_card'];
const PLACEMENTS: { key: string; label: string; surfaces: string[] }[] = [
    { key: 'inventory', label: 'Inventory screen', surfaces: ['inline_card'] },
    { key: 'sales', label: 'Sales screen', surfaces: ['inline_card'] },
    { key: 'logistics', label: 'Logistics screen', surfaces: ['inline_card'] },
    { key: 'dashboard', label: 'Business dashboard', surfaces: ['daily_summary'] },
    { key: 'app-switcher', label: 'App launcher', surfaces: ['discover_card'] },
];

const surfaceLabel = (s: string) => SURFACES.find(x => x.value === s)?.label || s;

// --- datetime <-> epoch helpers ---------------------------------------------
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (ms?: number) => {
    if (!ms) return '';
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (s: string): number | undefined => {
    if (!s) return undefined;
    const ms = new Date(s).getTime();
    return Number.isFinite(ms) ? ms : undefined;
};

// Built-in moment → display campaign (its trigger is code, so no rule is shown;
// an override that adds no rule keeps the built-in trigger on the client).
const builtinToDisplay = (m: UpsellMoment): Display => ({
    id: m.id, module: m.module, surface: m.surface, stage: m.stage,
    priority: m.priority, cooldownDays: m.cooldownDays,
    headline: m.headline, body: m.body, ctaLabel: m.ctaLabel,
    triggerRule: undefined, status: 'active', schedule: undefined,
    offer: undefined, variants: undefined, active: true, sortOrder: 0, origin: 'builtin',
});

const SuperAdminCampaigns: React.FC = () => {
    const [remote, setRemote] = useState<StoredCampaign[]>([]);
    const [moduleNames, setModuleNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Display | null>(null);
    const [tab, setTab] = useState<'campaigns' | 'performance'>('campaigns');

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [c, m] = await Promise.all([
                api.get<{ campaigns: StoredCampaign[] }>('/superadmin/upsell-campaigns'),
                api.get<{ modules: { id: string; name: string }[] }>('/superadmin/catalog/modules').catch(() => ({ modules: [] })),
            ]);
            setRemote(c.campaigns || []);
            const names: Record<string, string> = {};
            for (const mod of (m.modules || [])) names[mod.id] = mod.name;
            setModuleNames(names);
        } catch (e: any) {
            setError(e?.message || 'Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const moduleOptions = useMemo(() => {
        const ids = new Set<string>([...Object.keys(moduleNames), ...Object.values(MODULES)]);
        return [...ids].map(id => ({ id, name: moduleNames[id] || id })).sort((a, b) => a.name.localeCompare(b.name));
    }, [moduleNames]);

    const display: Display[] = useMemo(() => {
        const byId = new Map<string, Display>();
        for (const m of UPSELL_MOMENTS) byId.set(m.id, builtinToDisplay(m));
        for (const r of remote) byId.set(r.id, { ...r, origin: byId.has(r.id) ? 'override' : 'custom' });
        return [...byId.values()].sort((a, b) => (b.priority - a.priority) || a.id.localeCompare(b.id));
    }, [remote]);

    const moduleName = (id: string) => moduleNames[id] || id;

    const blank = (): Display => ({
        id: '', module: moduleOptions[0]?.id || '', surface: 'inline_card', stage: 'activation',
        priority: 50, cooldownDays: 14, headline: '', body: '', ctaLabel: '',
        triggerRule: { field: 'salesCount', op: '>=', value: 1 },
        status: 'active', schedule: undefined, offer: undefined, variants: undefined,
        placement: 'inventory', active: true, sortOrder: 0, origin: 'custom',
    });

    return (
        <main className="flex-1 min-h-0 overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-text">Upsell Campaigns</h1>
                        <p className="text-sm text-brand-text-muted mt-1">Author the in-app campaigns that sell your add-ons — retune the built-ins or launch new ones with offers, A/B variants and schedules.</p>
                    </div>
                    {tab === 'campaigns' && (
                        <button
                            onClick={() => setEditing(blank())}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-sp-amber text-white hover:bg-sp-green-dark transition active:scale-95 shadow-sm"
                        >
                            <span className="material-symbols-rounded text-[20px]">add</span>
                            New campaign
                        </button>
                    )}
                </div>

                <div className="inline-flex p-1 rounded-xl bg-surface-variant border border-brand-border mb-6">
                    {(['campaigns', 'performance'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === t ? 'bg-sp-amber text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}>
                            {t === 'campaigns' ? 'Campaigns' : 'Performance'}
                        </button>
                    ))}
                </div>

                {tab === 'performance' ? <CampaignPerformance moduleName={moduleName} /> : (<>
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={load} className="underline font-bold">Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-surface-variant animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {display.map(c => (
                            <CampaignCard key={c.id} c={c} moduleName={moduleName(c.module)} onEdit={() => setEditing(c)} />
                        ))}
                    </div>
                )}
                </>)}
            </div>

            {editing && (
                <CampaignEditor
                    initial={editing}
                    modules={moduleOptions}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            )}
        </main>
    );
};

// --- Cards -------------------------------------------------------------------
const Pill: React.FC<{ tone: 'green' | 'amber' | 'muted' | 'red'; children: React.ReactNode }> = ({ tone, children }) => {
    const cls = tone === 'green' ? 'bg-success-muted text-success'
        : tone === 'amber' ? 'bg-sp-amber-soft text-sp-amber'
        : tone === 'red' ? 'bg-danger-muted text-danger'
        : 'bg-surface-variant text-brand-text-muted';
    return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{children}</span>;
};

const CampaignCard: React.FC<{ c: Display; moduleName: string; onEdit: () => void }> = ({ c, moduleName, onEdit }) => {
    const paused = c.status === 'paused';
    const offerOn = !!c.offer && !!c.offer.discountPct;
    return (
        <button onClick={onEdit} className={`text-left bg-surface border rounded-2xl p-5 shadow-sm hover:shadow-md transition ${paused || !c.active ? 'opacity-70' : ''} ${c.origin === 'custom' ? 'border-sp-green/40' : 'border-brand-border'}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                    <h3 className="font-extrabold text-brand-text truncate">{c.headline || '(no headline)'}</h3>
                    <p className="text-xs text-brand-text-muted truncate">Sells <b>{moduleName}</b> · {surfaceLabel(c.surface)}</p>
                </div>
                <span className="material-symbols-rounded text-brand-text-muted text-[20px] shrink-0">edit</span>
            </div>
            <p className="text-sm text-brand-text-muted line-clamp-2 mb-3">{c.body || '—'}</p>
            <div className="flex flex-wrap gap-1.5">
                {c.origin === 'builtin' && <Pill tone="muted">Built-in</Pill>}
                {c.origin === 'override' && <Pill tone="amber">Customised</Pill>}
                {c.origin === 'custom' && <Pill tone="green">Custom</Pill>}
                {!c.active && <Pill tone="muted">Draft</Pill>}
                {paused && <Pill tone="red">Paused</Pill>}
                {offerOn && <Pill tone="amber">{c.offer?.discountPct ? `${c.offer.discountPct}% off` : 'Offer'}</Pill>}
                {c.variants && c.variants.length > 0 && <Pill tone="green">A/B ×{c.variants.length}</Pill>}
                {c.schedule && (c.schedule.startAt || c.schedule.endAt) && <Pill tone="muted">Scheduled</Pill>}
                <Pill tone="muted">{c.stage}</Pill>
            </div>
        </button>
    );
};

// --- Editor helpers ----------------------------------------------------------
const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
    <label className="block">
        <span className="block text-xs font-bold text-brand-text-muted uppercase tracking-wide mb-1.5">{label}</span>
        {children}
        {hint && <span className="block text-xs text-brand-text-muted mt-1">{hint}</span>}
    </label>
);
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
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="pt-4 border-t border-brand-border first:pt-0 first:border-0 space-y-3">
        <h4 className="text-sm font-extrabold text-brand-text">{title}</h4>
        {children}
    </div>
);

// --- Editor ------------------------------------------------------------------
const CampaignEditor: React.FC<{
    initial: Display;
    modules: { id: string; name: string }[];
    onClose: () => void;
    onSaved: () => void;
}> = ({ initial, modules, onClose, onSaved }) => {
    const [f, setF] = useState<Display>(initial);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const isBuiltin = initial.origin === 'builtin';
    const isOverride = initial.origin === 'override';
    const isNewCustom = initial.origin === 'custom' && !initial.id;

    const set = (patch: Partial<Display>) => setF(prev => ({ ...prev, ...patch }));

    // Trigger rule (paywall never uses one — it fires on the 402).
    const usesRule = f.surface !== 'paywall';
    const [customTrigger, setCustomTrigger] = useState<boolean>(!!initial.triggerRule);

    // Placement — a NEW campaign on a slot-based surface must pick where it shows.
    const usesPlacement = PLACEMENT_SURFACES.includes(f.surface);
    const showPlacement = usesPlacement && initial.origin === 'custom';
    const placementOptions = PLACEMENTS.filter(p => p.surfaces.includes(f.surface));
    const rule = f.triggerRule;
    const setRule = (patch: Partial<TriggerRule>) => set({ triggerRule: { ...(rule || { field: 'salesCount', op: '>=', value: 1 }), ...patch } });
    const secondClause = rule?.and;
    const setSecond = (patch: Partial<TriggerRule> | null) => {
        if (!rule) return;
        set({ triggerRule: { ...rule, and: patch === null ? undefined : { ...(secondClause || { field: 'productCount', op: '<', value: 100 }), ...patch } } });
    };

    // Offer
    const offerOn = !!f.offer;
    const setOffer = (patch: Partial<CampaignOffer> | null) =>
        set({ offer: patch === null ? undefined : { ...(f.offer || {}), ...patch } });

    // Variants
    const variants = f.variants || [];
    const setVariants = (v: CampaignVariant[]) => set({ variants: v.length ? v : undefined });
    const addVariant = () => setVariants([...variants, { id: String.fromCharCode(97 + variants.length), headline: '', body: '', ctaLabel: '' }]);
    const updVariant = (i: number, patch: Partial<CampaignVariant>) => setVariants(variants.map((v, idx) => idx === i ? { ...v, ...patch } : v));
    const delVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

    const buildBody = (): any => {
        const offer = offerOn && f.offer ? f.offer : null;
        return {
            id: f.id || undefined,
            module: f.module,
            surface: f.surface,
            stage: f.stage,
            priority: f.priority,
            cooldownDays: f.cooldownDays,
            // null clears any override rule (keeps the built-in trigger on the client);
            // absent key would mean "leave unchanged", so we always send the key.
            triggerRule: usesRule && customTrigger ? f.triggerRule : null,
            headline: f.headline,
            body: f.body,
            ctaLabel: f.ctaLabel,
            status: f.status,
            schedule: f.schedule || null,
            offer,
            variants: variants.length ? variants : null,
            placement: f.placement || '',
            active: f.active,
            sortOrder: f.sortOrder,
        };
    };

    const save = async () => {
        if (!f.module) { setErr('Pick the add-on this campaign sells.'); return; }
        if (!f.headline.trim()) { setErr('A headline is required.'); return; }
        setSaving(true); setErr(null);
        try {
            const body = buildBody();
            if (f.id) await api.put(`/superadmin/upsell-campaigns/${f.id}`, body);
            else await api.post('/superadmin/upsell-campaigns', body);
            onSaved();
        } catch (e: any) {
            setErr(e?.message || 'Failed to save'); setSaving(false);
        }
    };
    // For built-in overrides "reset" deletes the override row → reverts to default.
    const reset = async () => {
        const msg = isOverride
            ? `Reset "${f.id}" to its built-in default? Your customisations will be removed.`
            : `Delete campaign "${f.headline || f.id}"?`;
        if (!window.confirm(msg)) return;
        setSaving(true);
        try { await api.delete(`/superadmin/upsell-campaigns/${f.id}`); onSaved(); }
        catch (e: any) { setErr(e?.message || 'Failed'); setSaving(false); }
    };

    const title = isNewCustom ? 'New campaign' : isBuiltin ? `Customise “${f.id}”` : `Edit “${f.id}”`;

    return (
        <Modal open onClose={onClose} size="2xl" disabled={saving}
            title={title}
            icon={<span className="material-symbols-rounded text-sp-green text-[22px]">ads_click</span>}>
            <div className="p-6 overflow-y-auto space-y-5">
                {err && <div className="p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium">{err}</div>}
                {isBuiltin && <div className="p-3 rounded-xl bg-sp-amber-soft text-sp-amber text-xs font-medium">This is a shipped default. Saving creates a customisation you can reset later. Leave “custom trigger” off to keep its smart targeting.</div>}

                <Section title="Targeting">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Sells add-on">
                            <select className={INPUT_CLASS} value={f.module} onChange={e => set({ module: e.target.value })} disabled={isBuiltin || isOverride}>
                                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Surface">
                            <select className={INPUT_CLASS} value={f.surface} onChange={e => set({ surface: e.target.value as any })} disabled={isBuiltin || isOverride}>
                                {SURFACES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Lifecycle stage">
                            <select className={INPUT_CLASS} value={f.stage} onChange={e => set({ stage: e.target.value as any })}>
                                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Priority" hint="Higher wins ties">
                            <input type="number" className={INPUT_CLASS} value={f.priority} onChange={e => set({ priority: parseInt(e.target.value) || 0 })} />
                        </Field>
                        <Field label="Cooldown (days)" hint="Re-show delay after dismiss">
                            <input type="number" className={INPUT_CLASS} value={f.cooldownDays} onChange={e => set({ cooldownDays: parseInt(e.target.value) || 0 })} />
                        </Field>
                    </div>
                    {showPlacement && (
                        <Field label="Placement" hint={f.placement ? undefined : "Pick where this campaign appears, or it won't show"}>
                            <select className={INPUT_CLASS} value={f.placement || ''} onChange={e => set({ placement: e.target.value || undefined })}>
                                <option value="">— pick a slot —</option>
                                {placementOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                        </Field>
                    )}
                    {usesRule ? (
                        <>
                            <Toggle on={customTrigger} onClick={() => setCustomTrigger(v => !v)}
                                label="Custom trigger rule"
                                hint={isBuiltin || isOverride ? 'Off = keep the built-in smart trigger' : 'When should this fire?'} />
                            {customTrigger && (
                                <div className="space-y-2 p-3 rounded-xl bg-surface-variant">
                                    <RuleRow rule={rule} onChange={setRule} />
                                    {secondClause ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-brand-text-muted shrink-0">AND</span>
                                            <RuleRow rule={secondClause} onChange={p => setSecond(p)} />
                                            <button type="button" onClick={() => setSecond(null)} className="text-danger shrink-0"><span className="material-symbols-rounded text-[20px]">close</span></button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setSecond({})} className="text-xs font-bold text-sp-green">+ Add AND condition</button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-brand-text-muted">Paywall campaigns fire automatically when a locked feature is hit — no trigger needed.</p>
                    )}
                </Section>

                <Section title="Message">
                    <Field label="Headline"><input className={INPUT_CLASS} value={f.headline} onChange={e => set({ headline: e.target.value })} placeholder="Turn your numbers into decisions" /></Field>
                    <Field label="Body"><textarea className={INPUT_CLASS} rows={2} value={f.body} onChange={e => set({ body: e.target.value })} /></Field>
                    <Field label="Button label"><input className={INPUT_CLASS} value={f.ctaLabel} onChange={e => set({ ctaLabel: e.target.value })} placeholder="Unlock now" /></Field>
                </Section>

                <Section title="Limited-time offer">
                    <Toggle on={offerOn} onClick={() => setOffer(offerOn ? null : { discountPct: 20 })} label="Attach an offer" hint="Discount, coupon and/or countdown" />
                    {offerOn && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="% off" hint="Auto-applies to the first charge"><input type="number" min={0} max={100} className={INPUT_CLASS} value={f.offer?.discountPct ?? ''} onChange={e => setOffer({ discountPct: e.target.value === '' ? undefined : Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })} /></Field>
                            <Field label="Ends at" hint="Drives the countdown"><input type="datetime-local" className={INPUT_CLASS} value={toLocalInput(f.offer?.endsAt)} onChange={e => setOffer({ endsAt: fromLocalInput(e.target.value) })} /></Field>
                        </div>
                    )}
                </Section>

                <Section title="A/B variants">
                    <p className="text-xs text-brand-text-muted">Add variants to test alternative copy. The message above is the control; each visitor is bucketed deterministically and conversions are tracked per variant.</p>
                    {variants.map((v, i) => (
                        <div key={i} className="p-3 rounded-xl border border-brand-border space-y-2">
                            <div className="flex items-center gap-2">
                                <input className={INPUT_CLASS + ' !w-20'} value={v.id} onChange={e => updVariant(i, { id: e.target.value })} placeholder="id" />
                                <input className={INPUT_CLASS} value={v.headline} onChange={e => updVariant(i, { headline: e.target.value })} placeholder="Variant headline" />
                                <button type="button" onClick={() => delVariant(i)} className="text-danger shrink-0"><span className="material-symbols-rounded text-[20px]">delete</span></button>
                            </div>
                            <input className={INPUT_CLASS} value={v.body} onChange={e => updVariant(i, { body: e.target.value })} placeholder="Variant body" />
                            <div className="flex gap-2">
                                <input className={INPUT_CLASS} value={v.ctaLabel} onChange={e => updVariant(i, { ctaLabel: e.target.value })} placeholder="Button label" />
                                <input type="number" min={0} className={INPUT_CLASS + ' !w-28'} value={v.weight ?? 1} onChange={e => updVariant(i, { weight: Math.max(0, parseInt(e.target.value) || 0) })} title="Weight" />
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addVariant} className="text-xs font-bold text-sp-green">+ Add variant</button>
                </Section>

                <Section title="Schedule & publish">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Live from" hint="Optional"><input type="datetime-local" className={INPUT_CLASS} value={toLocalInput(f.schedule?.startAt)} onChange={e => set({ schedule: { ...(f.schedule || {}), startAt: fromLocalInput(e.target.value) } })} /></Field>
                        <Field label="Live until" hint="Optional"><input type="datetime-local" className={INPUT_CLASS} value={toLocalInput(f.schedule?.endAt)} onChange={e => set({ schedule: { ...(f.schedule || {}), endAt: fromLocalInput(e.target.value) } })} /></Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Toggle on={f.status !== 'paused'} onClick={() => set({ status: f.status === 'paused' ? 'active' : 'paused' })} label="Running" hint="Pause to turn the campaign off without deleting it." />
                        <Toggle on={f.active} onClick={() => set({ active: !f.active })} label="Published" hint="Drafts are saved but never shown to merchants." />
                    </div>
                </Section>
            </div>

            <div className="p-4 border-t border-brand-border flex items-center justify-between gap-2 shrink-0">
                {(isOverride || (initial.origin === 'custom' && f.id)) ?
                    <button onClick={reset} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-danger hover:bg-danger-muted transition disabled:opacity-50">{isOverride ? 'Reset to default' : 'Delete'}</button>
                    : <span />}
                <div className="flex gap-2">
                    <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand-text-muted hover:bg-surface-variant transition">Cancel</button>
                    <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sp-amber text-white hover:bg-sp-green-dark transition active:scale-95 disabled:opacity-50">{saving ? 'Saving…' : 'Save campaign'}</button>
                </div>
            </div>
        </Modal>
    );
};

const RuleRow: React.FC<{ rule?: TriggerRule; onChange: (patch: Partial<TriggerRule>) => void }> = ({ rule, onChange }) => (
    <div className="flex items-center gap-2">
        <select className={INPUT_CLASS} value={rule?.field || 'salesCount'} onChange={e => onChange({ field: e.target.value as TriggerField })}>
            {FIELDS.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
        </select>
        <select className={INPUT_CLASS + ' !w-20'} value={rule?.op || '>='} onChange={e => onChange({ op: e.target.value as TriggerOp })}>
            {OPS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <input type="number" className={INPUT_CLASS + ' !w-28'} value={rule?.value ?? 0} onChange={e => onChange({ value: parseFloat(e.target.value) || 0 })} />
    </div>
);

// --- Performance (funnel) ----------------------------------------------------
interface FunnelRow { impressions: number; clicks: number; conversions: number; revenue: number; }
interface VariantFunnel extends FunnelRow { variantId: string; }
interface CampaignFunnel extends FunnelRow { momentId: string; module: string | null; surface: string | null; variants: VariantFunnel[]; }
interface FunnelReport { totals: FunnelRow; campaigns: CampaignFunnel[]; sinceDays: number; }

const pctLabel = (n: number, den: number) => den > 0 ? `${Math.round((n / den) * 1000) / 10}%` : '—';
const kwacha = (n: number) => `K${(Number.isFinite(n) ? n : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div className="bg-surface border border-brand-border rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">{label}</p>
        <p className="text-2xl font-extrabold text-brand-text mt-1">{value}</p>
        {sub && <p className="text-xs text-brand-text-muted mt-0.5">{sub}</p>}
    </div>
);

// --- A/B significance (two-proportion z-test on conversion-per-impression) ----
const normCdf = (z: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
};
const twoPropP = (c1: number, n1: number, c2: number, n2: number): number => {
    if (n1 === 0 || n2 === 0) return 1;
    const p1 = c1 / n1, p2 = c2 / n2, pooled = (c1 + c2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
    if (!se) return 1;
    return 2 * (1 - normCdf(Math.abs(p1 - p2) / se)); // two-sided p-value
};
interface Verdict { text: string; tone: 'green' | 'muted'; winnerId?: string }
const abVerdict = (variants: VariantFunnel[]): Verdict => {
    const usable = variants.filter(v => v.impressions > 0);
    if (usable.length < 2) return { text: 'Add a second variant to A/B test this campaign.', tone: 'muted' };
    const sorted = [...usable].sort((a, b) => (b.conversions / b.impressions) - (a.conversions / a.impressions));
    const [top, runner] = sorted;
    const totalConv = usable.reduce((s, v) => s + v.conversions, 0);
    const minImpr = Math.min(...usable.map(v => v.impressions));
    // Guardrail against calling a winner on thin data.
    if (totalConv < 10 || minImpr < 30) return { text: 'Gathering data — not enough traffic for a confident result yet.', tone: 'muted' };
    const conf = Math.round((1 - twoPropP(top.conversions, top.impressions, runner.conversions, runner.impressions)) * 100);
    return conf >= 95
        ? { text: `Variant ${top.variantId} is winning at ${conf}% confidence.`, tone: 'green', winnerId: top.variantId }
        : { text: `No clear winner yet (${conf}% confidence) — keep the test running.`, tone: 'muted' };
};

const VariantBreakdown: React.FC<{ variants: VariantFunnel[] }> = ({ variants }) => {
    const verdict = abVerdict(variants);
    return (
        <div className="px-4 pb-3 space-y-1">
            <div className={`mb-1 px-3 py-2 rounded-lg text-xs font-semibold ${verdict.tone === 'green' ? 'bg-success-muted text-success' : 'bg-surface-variant text-brand-text-muted'}`}>
                {verdict.tone === 'green' ? '🏆 ' : ''}{verdict.text}
            </div>
            {variants.map(v => (
                <div key={v.variantId} className={`grid grid-cols-2 md:grid-cols-12 gap-2 px-3 py-2 rounded-lg text-xs items-center ${v.variantId === verdict.winnerId ? 'bg-success-muted' : 'bg-surface-variant'}`}>
                    <span className="md:col-span-4 font-bold text-brand-text">Variant {v.variantId}{v.variantId === verdict.winnerId ? ' 🏆' : ''}</span>
                    <span className="md:col-span-2 text-right">{v.impressions.toLocaleString()}</span>
                    <span className="md:col-span-2 text-right">{v.clicks.toLocaleString()} · {pctLabel(v.clicks, v.impressions)}</span>
                    <span className="md:col-span-2 text-right">{v.conversions.toLocaleString()} · {pctLabel(v.conversions, v.impressions)}</span>
                    <span className="md:col-span-2 text-right font-bold text-sp-green">{kwacha(v.revenue)}</span>
                </div>
            ))}
        </div>
    );
};

const CampaignPerformance: React.FC<{ moduleName: (id: string) => string }> = ({ moduleName }) => {
    const [days, setDays] = useState(30);
    const [report, setReport] = useState<FunnelReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true); setError(null);
        api.get<FunnelReport>(`/superadmin/upsell-analytics?days=${days}`)
            .then(r => { if (!cancelled) setReport(r); })
            .catch(e => { if (!cancelled) setError(e?.message || 'Failed to load analytics'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [days]);

    const t = report?.totals;
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-brand-text-muted">Funnel over the last {days} days — captured as merchants see and act on your campaigns.</p>
                <select className={INPUT_CLASS + ' !w-32'} value={days} onChange={e => setDays(parseInt(e.target.value))}>
                    <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
                </select>
            </div>

            {error && <div className="p-3 rounded-xl bg-danger-muted text-danger text-sm font-medium">{error}</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Impressions" value={(t?.impressions ?? 0).toLocaleString()} />
                <Stat label="Clicks" value={(t?.clicks ?? 0).toLocaleString()} sub={`CTR ${pctLabel(t?.clicks ?? 0, t?.impressions ?? 0)}`} />
                <Stat label="Conversions" value={(t?.conversions ?? 0).toLocaleString()} sub={`CVR ${pctLabel(t?.conversions ?? 0, t?.clicks ?? 0)}`} />
                <Stat label="Revenue" value={kwacha(t?.revenue ?? 0)} />
            </div>

            {loading ? (
                <div className="h-40 rounded-2xl bg-surface-variant animate-pulse" />
            ) : (report?.campaigns.length ?? 0) === 0 ? (
                <div className="text-center py-16 text-brand-text-muted text-sm">No campaign activity yet. Data appears as merchants see your campaigns.</div>
            ) : (
                <div className="bg-surface border border-brand-border rounded-2xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-brand-text-muted border-b border-brand-border">
                        <span className="col-span-4">Campaign</span>
                        <span className="col-span-2 text-right">Impressions</span>
                        <span className="col-span-2 text-right">Clicks · CTR</span>
                        <span className="col-span-2 text-right">Conv · CVR</span>
                        <span className="col-span-2 text-right">Revenue</span>
                    </div>
                    {report!.campaigns.map(c => (
                        <div key={c.momentId} className="border-b border-brand-border last:border-0">
                            <button onClick={() => setExpanded(expanded === c.momentId ? null : c.momentId)} className="w-full grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 text-left hover:bg-surface-variant transition items-center">
                                <span className="md:col-span-4 min-w-0">
                                    <span className="block text-sm font-bold text-brand-text truncate">{c.momentId}</span>
                                    <span className="block text-xs text-brand-text-muted truncate">{moduleName(c.module || '')} · {c.surface}{c.variants.length ? ` · A/B ×${c.variants.length}` : ''}</span>
                                </span>
                                <span className="md:col-span-2 text-right text-sm font-semibold text-brand-text">{c.impressions.toLocaleString()}</span>
                                <span className="md:col-span-2 text-right text-sm text-brand-text">{c.clicks.toLocaleString()} · <span className="text-brand-text-muted">{pctLabel(c.clicks, c.impressions)}</span></span>
                                <span className="md:col-span-2 text-right text-sm text-brand-text">{c.conversions.toLocaleString()} · <span className="text-sp-green font-semibold">{pctLabel(c.conversions, c.impressions)}</span></span>
                                <span className="md:col-span-2 text-right text-sm font-bold text-sp-green">{kwacha(c.revenue)}</span>
                            </button>
                            {expanded === c.momentId && c.variants.length > 0 && (
                                <VariantBreakdown variants={c.variants} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuperAdminCampaigns;
