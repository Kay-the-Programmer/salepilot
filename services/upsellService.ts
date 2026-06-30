import {
    UPSELL_MOMENTS,
    selectEligible,
    cooldownUntil,
    UpsellContextData,
    UpsellMoment,
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

type Attribution = { momentId: string; surface: UpsellSurface };

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

    /** Called by the product-create path; counts toward bulk_manual_adds. */
    recordManualAdd(): void {
        this.manualAdds += 1;
        this.emit();
    }

    private state(): EligibilityState {
        return { persist: this.persist, sessionShownId: this.sessionShownId, now: Date.now() };
    }

    // ── selection ─────────────────────────────────────────────────────────────
    getEligible(surface: UpsellSurface, restrictIds?: readonly string[]): UpsellMoment | null {
        if (!this.ctx) return null;
        return selectEligible(UPSELL_MOMENTS, surface, this.ctx, this.state(), restrictIds);
    }

    private save() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(PERSIST_PREFIX + (this.userId || 'anon'), JSON.stringify(this.persist));
        } catch { /* ignore quota errors */ }
    }

    private params(m: UpsellMoment) {
        return { momentId: m.id, module: m.module, surface: m.surface };
    }

    // ── outcome recording (idempotent where it matters) ──────────────────────
    recordShown(m: UpsellMoment): void {
        if (this.impressions.has(m.id)) return; // one impression per moment per session
        this.impressions.add(m.id);
        trackEvent('upsell_impression', this.params(m));

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
        trackEvent('upsell_click', this.params(m));
        // Remember the click so a completed checkout for this module attributes back.
        this.attribution[m.module] = { momentId: m.id, surface: m.surface };
    }

    recordDismissed(m: UpsellMoment, opts: { permanent?: boolean } = {}): void {
        trackEvent('upsell_dismiss', this.params(m));
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
                trackEvent('upsell_convert', { momentId: a.momentId, module: moduleId, surface: a.surface });
                delete this.attribution[moduleId];
            }
        }
    }
}

export const upsellService = new UpsellService();
