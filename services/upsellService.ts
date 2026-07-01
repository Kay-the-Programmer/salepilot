import {
    UPSELL_MOMENTS,
    selectEligible,
    cooldownUntil,
    resolveCampaigns,
    resolveCreative,
    offerLive,
    withinSchedule,
    UpsellContextData,
    UpsellMoment,
    Campaign,
    CampaignDTO,
    CampaignOffer,
    UpsellSurface,
    UpsellPersistMap,
    EligibilityState,
} from '../utils/upsell';
import { trackEvent } from '../src/utils/analytics';

/**
 * Stateful host for the (pure) upsell engine in `utils/upsell.ts`.
 * ---------------------------------------------------------------------------
 * Owns everything the engine must NOT: per-user persisted state (localStorage),
 * the in-memory one-proactive-per-session budget, manual-add session counting,
 * click→conversion attribution, and analytics emission.
 *
 * It is a module-level singleton (not React state) on purpose: `PaywallHost` and
 * `SubscriptionApp` both render *outside* the Dashboard tree, so they could not
 * read a Dashboard-provided context. The React layer (`useUpsell`) is a thin
 * reactive wrapper that subscribes to {@link UpsellService.subscribe}.
 */

const PERSIST_PREFIX = 'salePilot.upsell.';
const FIRST_SEEN_PREFIX = 'salePilot.upsell.firstSeen.';
const PRICING_KEY = 'salePilot.upsell.pricing';
const CAMPAIGNS_KEY = 'salePilot.upsell.campaigns';
const ANON_SEED_KEY = 'salePilot.upsell.anonSeed';

type Attribution = { momentId: string; surface: UpsellSurface; variantId?: string };

function loadCampaigns(): CampaignDTO[] | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CAMPAIGNS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

/** Per-module price for copy ("From K110/mo"). Sourced from the live catalogue. */
export interface ModulePrice { price: number; currency: string }
type PricingMap = Record<string, ModulePrice>;

function loadPricing(): PricingMap {
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(PRICING_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function loadPersist(userId?: string): UpsellPersistMap {
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(PERSIST_PREFIX + (userId || 'anon'));
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

class UpsellService {
    private ctx: UpsellContextData | null = null;
    private userId: string | undefined;
    private persist: UpsellPersistMap = {};

    // Session-scoped (in-memory; resets on app load).
    private sessionShownId: string | null = null;           // the one proactive moment shown
    private impressions = new Set<string>();                 // momentIds already counted this session
    private attribution: Record<string, Attribution> = {};  // module -> click attribution
    private manualAdds = 0;

    // Live catalogue pricing (offline fallback = last-cached). Never hardcoded.
    private pricing: PricingMap = loadPricing();

    // Super-Admin-authored campaigns (offline fallback = last-cached). Merged over
    // the built-in defaults by the engine; null means "defaults only".
    private remote: CampaignDTO[] | null = loadCampaigns();

    // Optional server-side event recorder, installed by the React layer so this
    // service stays free of the api/Capacitor import (node tests need no jsdom).
    private eventSink: ((name: string, params: Record<string, any>) => void) | null = null;

    private listeners = new Set<() => void>();
    private version = 0;

    // ── reactivity (useSyncExternalStore) ────────────────────────────────────
    subscribe = (cb: () => void): (() => void) => {
        this.listeners.add(cb);
        return () => { this.listeners.delete(cb); };
    };
    getVersion = (): number => this.version;
    private emit() {
        this.version++;
        this.listeners.forEach(l => l());
    }

    /** Install a server-side event recorder (the React layer POSTs to the backend). */
    setEventSink(fn: ((name: string, params: Record<string, any>) => void) | null): void {
        this.eventSink = fn;
    }
    /** Emit an analytics event to GA4 and (if installed) the server-side funnel store. */
    private emitEvent(name: string, params: Record<string, any>): void {
        trackEvent(name, params);
        try { this.eventSink?.(name, params); } catch { /* never break UI on telemetry */ }
    }

    // ── identity & data snapshot ──────────────────────────────────────────────
    setUser(userId?: string): void {
        if (userId === this.userId) return;
        this.userId = userId;
        this.persist = loadPersist(userId);
        this.emit();
    }

    setContext(ctx: UpsellContextData): void {
        this.ctx = ctx;
        this.emit();
    }

    getContext(): UpsellContextData | null {
        return this.ctx;
    }

    /** Lazily stamps and returns the per-user first-seen time (ms). Local only. */
    getFirstSeen(): number {
        const key = FIRST_SEEN_PREFIX + (this.userId || 'anon');
        const now = Date.now();
        if (typeof localStorage === 'undefined') return now;
        try {
            const existing = localStorage.getItem(key);
            if (existing) {
                const n = parseInt(existing, 10);
                if (Number.isFinite(n)) return n;
            }
            localStorage.setItem(key, String(now));
        } catch { /* ignore */ }
        return now;
    }

    getManualAdds(): number {
        return this.manualAdds;
    }

    /** Install live catalogue prices (called from the React layer after fetching
     *  /subscriptions/addons). Cached for offline use. */
    setPricing(addons: Array<{ id: string; price: number; currency: string }> | null | undefined): void {
        if (!Array.isArray(addons) || addons.length === 0) return;
        const map: PricingMap = {};
        for (const a of addons) {
            if (a && a.id && Number.isFinite(a.price)) map[a.id] = { price: a.price, currency: a.currency || 'ZMW' };
        }
        if (Object.keys(map).length === 0) return;
        this.pricing = map;
        if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem(PRICING_KEY, JSON.stringify(map)); } catch { /* ignore */ }
        }
        this.emit();
    }

    /** Last-known price for a module, or null if the catalogue hasn't loaded. */
    getPrice(module: string): ModulePrice | null {
        return this.pricing[module] ?? null;
    }

    /** Install Super-Admin-authored campaigns (from /subscriptions/upsell-campaigns).
     *  Cached for offline use; merged over the built-in defaults by the engine. */
    setCampaigns(remote: CampaignDTO[] | null | undefined): void {
        if (!Array.isArray(remote)) return;
        this.remote = remote;
        if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(remote)); } catch { /* ignore */ }
        }
        this.emit();
    }

    /** The live campaign list: Super-Admin remote campaigns merged over defaults. */
    private resolved(): Campaign[] {
        return resolveCampaigns(UPSELL_MOMENTS, this.remote);
    }

    /** Stable per-user (or persisted anon) seed for deterministic A/B bucketing. */
    private seed(): string {
        if (this.userId) return this.userId;
        if (typeof localStorage === 'undefined') return 'anon';
        try {
            let s = localStorage.getItem(ANON_SEED_KEY);
            if (!s) { s = Math.random().toString(36).slice(2); localStorage.setItem(ANON_SEED_KEY, s); }
            return s;
        } catch {
            return 'anon';
        }
    }

    /** Apply the user's deterministic A/B variant copy onto a campaign (no-op
     *  when the campaign defines no variants). */
    private withCreative(m: Campaign): Campaign {
        const c = resolveCreative(m, this.seed());
        if (!c.variantId) return m;
        return { ...m, headline: c.headline, body: c.body, ctaLabel: c.ctaLabel };
    }

    /** Live promotional offer for a campaign right now, or null. */
    getOffer(m: UpsellMoment): CampaignOffer | null {
        return offerLive(m, Date.now());
    }

    /** Best live offer for a *module* right now across all resolved campaigns —
     *  mirrors the server's getModuleDiscounts so the subscription page shows the
     *  same discounted price the checkout will actually charge. */
    getModuleOffer(moduleId: string): CampaignOffer | null {
        const now = Date.now();
        let best: CampaignOffer | null = null;
        let bestPct = -1;
        for (const c of this.resolved()) {
            if (c.module !== moduleId || c.status === 'paused') continue;
            if (!withinSchedule(c, now)) continue;
            const o = offerLive(c, now);
            if (!o) continue;
            const pct = o.discountPct ?? 0;
            if (pct > bestPct) { best = o; bestPct = pct; }
        }
        return best;
    }

    /** The paywall campaign for a module (resolved over remote config), with the
     *  user's A/B variant applied. Lets PaywallHost honour console-authored copy. */
    getPaywallMoment(module: string): UpsellMoment | null {
        const m = this.resolved().find(c => c.surface === 'paywall' && c.module === module) ?? null;
        return m ? this.withCreative(m) : null;
    }

    /** Called by the product-create path; counts toward bulk_manual_adds. */
    recordManualAdd(): void {
        this.manualAdds += 1;
        this.emit();
    }

    private state(): EligibilityState {
        return { persist: this.persist, sessionShownId: this.sessionShownId, now: Date.now() };
    }

    // ── selection ─────────────────────────────────────────────────────────────
    getEligible(surface: UpsellSurface, restrictIds?: readonly string[], placement?: string): UpsellMoment | null {
        if (!this.ctx) return null;
        const m = selectEligible(this.resolved(), surface, this.ctx, this.state(), restrictIds, placement);
        return m ? this.withCreative(m) : null;
    }

    private save() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(PERSIST_PREFIX + (this.userId || 'anon'), JSON.stringify(this.persist));
        } catch { /* ignore quota errors */ }
    }

    private params(m: UpsellMoment) {
        const variantId = resolveCreative(m, this.seed()).variantId;
        return { momentId: m.id, module: m.module, surface: m.surface, ...(variantId ? { variantId } : {}) };
    }

    // ── outcome recording (idempotent where it matters) ──────────────────────
    recordShown(m: UpsellMoment): void {
        if (this.impressions.has(m.id)) return; // one impression per moment per session
        this.impressions.add(m.id);
        this.emitEvent('upsell_impression', this.params(m));

        // Proactive surfaces consume the single per-session budget slot.
        if (m.surface !== 'paywall' && !this.sessionShownId) {
            this.sessionShownId = m.id;
        }
        const rec = this.persist[m.id] || {};
        rec.lastShownAt = Date.now();
        this.persist[m.id] = rec;
        this.save();
        this.emit();
    }

    recordClick(m: UpsellMoment): void {
        this.emitEvent('upsell_click', this.params(m));
        // Remember the click (incl. A/B variant) so a completed checkout for this
        // module attributes back to the exact campaign + variant.
        const variantId = resolveCreative(m, this.seed()).variantId ?? undefined;
        this.attribution[m.module] = { momentId: m.id, surface: m.surface, variantId };
    }

    recordDismissed(m: UpsellMoment, opts: { permanent?: boolean } = {}): void {
        this.emitEvent('upsell_dismiss', this.params(m));
        const rec = this.persist[m.id] || {};
        if (opts.permanent) {
            rec.permanentlyDismissed = true;
        } else {
            rec.dismissedUntil = cooldownUntil(m, Date.now());
        }
        this.persist[m.id] = rec;
        this.save();
        this.emit();
    }

    /** Attribute a completed checkout: emit upsell_convert for any purchased module
     *  that was clicked from an upsell earlier this session. */
    notePurchaseCompleted(modules: string[] | undefined): void {
        if (!Array.isArray(modules)) return;
        for (const moduleId of modules) {
            const a = this.attribution[moduleId];
            if (a) {
                this.emitEvent('upsell_convert', { momentId: a.momentId, module: moduleId, surface: a.surface, ...(a.variantId ? { variantId: a.variantId } : {}), value: this.pricing[moduleId]?.price });
                delete this.attribution[moduleId];
            }
        }
    }
}

export const upsellService = new UpsellService();
