import { ModuleId, MODULES } from './entitlements';

/**
 * Contextual upsell engine — declarative config + a PURE eligibility engine.
 * ---------------------------------------------------------------------------
 * This module has no side effects: no storage, no network, no React, no
 * analytics. Everything here is evaluated against a read-only snapshot of the
 * user's own local data ({@link UpsellContextData}) so it runs fully offline and
 * is trivially unit-testable. All stateful concerns (persistence, the session
 * budget, analytics, conversion attribution) live in `services/upsellService.ts`.
 *
 * It layers on top of the existing hard 402 paywall (see `PaywallHost`): the
 * `paywall` surface enriches a 402 with outcome-framed copy, while the other
 * surfaces are proactive, fatigue-controlled nudges shown at habit moments.
 */

export type UpsellSurface =
    | 'paywall'        // reuse PaywallHost (hard 402 gate, outcome-framed copy + bundle)
    | 'discover_card'  // contextual premium tile on an app-launcher surface
    | 'daily_summary'  // single nudge slot in the AI day-summary card
    | 'inline_card'    // contextual card inside a feature screen
    | 'push';          // notificationService (highest-value data-driven moments only)

export type LifecycleStage = 'onboarding' | 'activation' | 'engagement' | 'expansion';

/** Ordinal rank so a moment shows once the user has reached *at least* its stage. */
export const STAGE_RANK: Record<LifecycleStage, number> = {
    onboarding: 0,
    activation: 1,
    engagement: 2,
    expansion: 3,
};

// ── Marketing layer ──────────────────────────────────────────────────────────
// Everything below turns a "moment" into a configurable marketing *campaign*:
// a manual on/off, a live window, a promotional offer, and A/B creative — all
// optional, so a campaign with none of them behaves exactly like the original
// fixed nudge. Super-Admin-authored campaigns arrive as a serialisable
// {@link CampaignDTO} (declarative trigger rule, no code) and are compiled into
// runtime moments by {@link compileCampaign} / {@link resolveCampaigns}.

export type CampaignStatus = 'active' | 'paused';
export type CampaignSource = 'builtin' | 'remote';

/** A/B creative variant. The campaign's base copy is the implicit control. */
export interface CampaignVariant {
    id: string;            // stable, short id used in analytics (e.g. 'a', 'b')
    headline: string;
    body: string;
    ctaLabel: string;
    weight?: number;       // relative bucketing weight (default 1)
}

/** Promotional offer attached to a campaign. The discount auto-applies by module
 *  server-side (no code to redeem), so there is no coupon field. */
export interface CampaignOffer {
    /** Percent off the module's catalogue price (1–100). */
    discountPct?: number;
    /** Offer expiry (ms epoch) — drives the countdown and auto-expiry. */
    endsAt?: number;
    /** Extra modules bundled into the same offer. */
    bundleModules?: ModuleId[];
}

/** Live window for a campaign. Absent fields mean "no bound on that side". */
export interface CampaignSchedule {
    startAt?: number;      // ms epoch; before this the campaign is not live
    endAt?: number;        // ms epoch; after this the campaign is not live
}

/** Numeric fields of the data snapshot a declarative trigger rule may test. */
export type TriggerField =
    | 'daysActive' | 'productCount' | 'productCap' | 'manualAddsThisSession'
    | 'customerCount' | 'dormantCustomerCount' | 'recentStockoutCount'
    | 'userCount' | 'storeCount' | 'salesCount' | 'cashSaleCount';

export type TriggerOp = '>=' | '<=' | '>' | '<' | '==';

/** Serialisable trigger predicate (authored via dropdowns in Super Admin).
 *  `and` chains a second clause so bands like "80%–<100% of cap" are expressible
 *  without code. Compiled to a pure function by {@link compileTrigger}. */
export interface TriggerRule {
    field: TriggerField;
    op: TriggerOp;
    value: number;
    and?: TriggerRule;
}

/** A campaign exactly as authored in Super Admin / persisted in the backend:
 *  identical to {@link UpsellMoment} but with a declarative `triggerRule`
 *  instead of a compiled `trigger` function. */
export interface CampaignDTO {
    id: string;
    module: ModuleId;
    surface: UpsellSurface;
    stage: LifecycleStage;
    priority: number;
    cooldownDays: number;
    /** Absent = always-true (paywall moments fire on the 402 itself). */
    triggerRule?: TriggerRule;
    headline: string;
    body: string;
    ctaLabel: string;
    status?: CampaignStatus;
    schedule?: CampaignSchedule;
    offer?: CampaignOffer;
    variants?: CampaignVariant[];
    placement?: string;
}

/**
 * Read-only snapshot derived from the Dashboard store + auth/session. Local data
 * only — never fetched. Built by `contexts/UpsellContext.tsx` and pushed into the
 * service singleton.
 */
export interface UpsellContextData {
    role: string;                 // from rbac; only 'admin'/'superadmin' are eligible
    isMidSale: boolean;           // true while a POS sale is in progress — suppress everything
    daysActive: number;           // days since first sale / first session

    /** Owned-module check. NOTE: also returns true for modules under a free-override
     *  (WHATSAPP_FREE / SOCIAL_FREE) so we never upsell a currently-free feature. */
    hasModule: (m: ModuleId) => boolean;

    productCount: number;
    productCap: number;           // free-tier cap (Infinity if unlimited_products owned)
    manualAddsThisSession: number;

    customerCount: number;
    dormantCustomerCount: number; // bought before, but no purchase in 30+ days

    recentStockoutCount: number;  // products currently out of stock (approximation — see UPSELL_NOTES)
    userCount: number;            // team members on the store
    storeCount: number;

    salesCount: number;           // total recorded sales
    cashSaleCount: number;        // sales taken in cash (no electronic payment captured)
}

export interface UpsellMoment {
    id: string;                   // stable id, used in analytics
    module: ModuleId;
    surface: UpsellSurface;
    stage: LifecycleStage;
    priority: number;             // higher wins when several are eligible in one session
    cooldownDays: number;         // re-show delay after a dismissal
    /** Pure predicate over local data. MUST be cheap and side-effect free. */
    trigger: (ctx: UpsellContextData) => boolean;
    headline: string;             // outcome-framed, sentence case
    body: string;
    ctaLabel: string;

    // ── Marketing layer (all optional; absent = today's fixed-nudge behaviour) ─
    /** Manual on/off for the campaign. Absent = 'active'. */
    status?: CampaignStatus;
    /** Live window. Absent = always live. */
    schedule?: CampaignSchedule;
    /** Promotional offer (discount / coupon / countdown / bundle). */
    offer?: CampaignOffer;
    /** A/B creative variants; the base copy above is the implicit control. */
    variants?: CampaignVariant[];
    /** Which on-screen slot an inline / daily / discover campaign renders in
     *  (e.g. 'inventory'). Built-in moments are placed by id, so they don't need
     *  this; a NEW campaign on those surfaces must set it to appear anywhere. */
    placement?: string;
    /** Provenance: built-in default vs Super-Admin-authored remote campaign. */
    source?: CampaignSource;
}

/** A runtime campaign is just an {@link UpsellMoment} with the marketing layer
 *  populated. Alias kept so new code can use the clearer name. */
export type Campaign = UpsellMoment;

const PAYWALL_ALWAYS = () => true; // a 402 firing IS the trigger for paywall moments

/**
 * The moment catalogue. Nine moments from the brief plus one documented
 * `discover_card` moment to exercise the fifth surface (see UPSELL_NOTES.md).
 * Copy is outcome-framed, sentence case, no fake urgency.
 */
export const UPSELL_MOMENTS: UpsellMoment[] = [
    {
        id: 'product_cap_near',
        module: MODULES.UNLIMITED_PRODUCTS,
        surface: 'inline_card',
        stage: 'activation',
        priority: 40,
        cooldownDays: 7,
        trigger: c => c.productCount >= c.productCap * 0.8 && c.productCount < c.productCap,
        headline: "You're nearly out of room",
        body: 'Keep adding products without limits as your shop grows.',
        ctaLabel: 'Remove the limit',
    },
    {
        id: 'dormant_customers',
        module: MODULES.WHATSAPP_MESSAGING,
        surface: 'inline_card',
        stage: 'engagement',
        priority: 80,
        cooldownDays: 14,
        trigger: c => c.dormantCustomerCount >= 3,
        headline: 'Some regulars have gone quiet',
        body: 'Win them back with a WhatsApp message — they already know your shop.',
        ctaLabel: 'Message them',
    },
    {
        // High-count mirror of dormant_customers, delivered as a single push.
        id: 'dormant_customers_push',
        module: MODULES.WHATSAPP_MESSAGING,
        surface: 'push',
        stage: 'engagement',
        priority: 80,
        cooldownDays: 14,
        trigger: c => c.dormantCustomerCount >= 8,
        headline: 'Regulars are slipping away',
        body: 'You have customers who haven\'t bought in a while — a quick WhatsApp can win them back.',
        ctaLabel: 'Open CRM',
    },
    {
        id: 'daily_summary_ai',
        module: MODULES.AI_ASSISTANT,
        surface: 'daily_summary',
        stage: 'engagement',
        priority: 50,
        cooldownDays: 10,
        trigger: c => c.daysActive >= 5,
        headline: 'Ask your shop a question',
        body: 'The assistant reads all your data — try "what should I reorder?"',
        ctaLabel: 'Try the assistant',
    },
    {
        id: 'report_locked',
        module: MODULES.ADVANCED_REPORTS,
        surface: 'paywall',
        stage: 'activation',
        priority: 60,
        cooldownDays: 30,
        trigger: PAYWALL_ALWAYS,
        headline: 'Turn your numbers into decisions',
        body: 'Advanced reports give you P&L, cashflow and tax-ready exports from data you already have.',
        ctaLabel: 'Unlock advanced reports',
    },
    {
        id: 'accept_mobile_money',
        module: MODULES.PAYMENT_GATEWAY,
        surface: 'inline_card',
        stage: 'activation',
        priority: 65,
        cooldownDays: 14,
        trigger: c => c.cashSaleCount >= 8,
        headline: "You're taking a lot of cash sales",
        body: 'Let customers pay by Airtel or MTN at checkout — money lands straight in your account.',
        ctaLabel: 'Accept mobile money',
    },
    {
        id: 'stockout_repeat',
        module: MODULES.AUTO_REORDER,
        surface: 'inline_card',
        stage: 'engagement',
        priority: 70,
        cooldownDays: 14,
        trigger: c => c.recentStockoutCount >= 2,
        headline: 'Bestsellers keep running out',
        body: 'Auto-reorder watches your stock and drafts purchase orders before you sell out.',
        ctaLabel: 'Set up auto-reorder',
    },
    {
        id: 'second_staff',
        module: MODULES.TEAM_MEMBERS,
        surface: 'paywall',
        stage: 'activation',
        priority: 55,
        cooldownDays: 30,
        trigger: PAYWALL_ALWAYS,
        headline: 'Bring your team on board',
        body: 'Give staff their own logins so they can sell while you keep oversight — no shared password.',
        ctaLabel: 'Add team members',
    },
    {
        id: 'bulk_manual_adds',
        module: MODULES.QUICK_IMPORT,
        surface: 'inline_card',
        stage: 'activation',
        priority: 45,
        cooldownDays: 7,
        trigger: c => c.manualAddsThisSession >= 5,
        headline: 'Adding a lot by hand?',
        body: 'Import your whole product list from a spreadsheet in one go.',
        ctaLabel: 'Try quick import',
    },
    {
        id: 'tracking_requested',
        module: MODULES.PUBLIC_TRACKING,
        surface: 'inline_card',
        stage: 'engagement',
        priority: 35,
        cooldownDays: 21,
        trigger: c => c.customerCount >= 3,
        headline: 'Let customers track their own orders',
        body: 'Share a live tracking link so buyers can follow deliveries without messaging you.',
        ctaLabel: 'Turn on tracking',
    },
    {
        // Documented extra: proactive cross-sell on the launcher, layered over the
        // same module's hard 402 (report_locked). Exercises the discover_card surface.
        id: 'discover_advanced_reports',
        module: MODULES.ADVANCED_REPORTS,
        surface: 'discover_card',
        stage: 'engagement',
        priority: 30,
        cooldownDays: 14,
        trigger: c => c.daysActive >= 7,
        headline: 'See the full picture',
        body: 'Unlock advanced reports — P&L, cashflow and exports your accountant will love.',
        ctaLabel: 'See advanced reports',
    },
];

// ── Pure eligibility engine ──────────────────────────────────────────────────

export interface MomentPersistRecord {
    lastShownAt?: number;
    dismissedUntil?: number;
    permanentlyDismissed?: boolean;
}

export type UpsellPersistMap = Record<string, MomentPersistRecord>;

/** Everything the engine needs beyond the data snapshot, passed in explicitly so
 *  the engine stays pure (no globals, no clock). */
export interface EligibilityState {
    persist: UpsellPersistMap;
    /** The single proactive moment already shown this session, if any. */
    sessionShownId: string | null;
    now: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Current lifecycle stage inferred purely from local data. */
export function currentStage(ctx: UpsellContextData): LifecycleStage {
    if (ctx.productCount <= 0) return 'onboarding'; // no first value yet
    if (ctx.daysActive >= 14) return 'expansion';
    if (ctx.daysActive >= 3) return 'engagement';
    return 'activation';
}

/**
 * Does this moment pass ALL eligibility gates except the session budget?
 * (The session budget is a cross-moment concern handled in {@link selectEligible}.)
 */
export function isEligible(moment: UpsellMoment, ctx: UpsellContextData, state: EligibilityState): boolean {
    // 0. campaign on/off + live window (defaults keep today's behaviour exactly)
    if (moment.status === 'paused') return false;
    if (!withinSchedule(moment, state.now)) return false;
    // 1. role — only owners/admins may buy
    if (ctx.role !== 'admin' && ctx.role !== 'superadmin') return false;
    // 2. never during the sale flow
    if (ctx.isMidSale) return false;
    // 3. stage reached
    if (STAGE_RANK[currentStage(ctx)] < STAGE_RANK[moment.stage]) return false;
    // 4. not already owned (free-overrides count as owned via ctx.hasModule)
    if (ctx.hasModule(moment.module)) return false;
    // 5. data trigger
    if (!moment.trigger(ctx)) return false;
    // 6. cooldown / permanent opt-out
    const rec = state.persist[moment.id];
    if (rec?.permanentlyDismissed) return false;
    if (rec?.dismissedUntil && state.now < rec.dismissedUntil) return false;
    return true;
}

function topByPriority(list: UpsellMoment[]): UpsellMoment | null {
    return list.reduce<UpsellMoment | null>((best, m) => (!best || m.priority > best.priority ? m : best), null);
}

/**
 * The single highest-priority eligible moment for a surface, honouring the
 * one-proactive-per-session budget. `paywall` is exempt from the budget (it is
 * gated by a real 402). `restrictIds` lets a screen ask only for *its* moments so
 * different inline screens show different cards without fighting over the budget.
 */
export function selectEligible(
    moments: UpsellMoment[],
    surface: UpsellSurface,
    ctx: UpsellContextData,
    state: EligibilityState,
    restrictIds?: readonly string[],
    placement?: string,
): UpsellMoment | null {
    // A slot scopes itself by the built-in ids it hosts AND/OR its placement key.
    // A campaign shows if its id is in `restrictIds` (built-ins) OR its `placement`
    // matches (new campaigns). With neither scope given, the whole surface is open.
    const scoped = restrictIds !== undefined || placement !== undefined;
    const pool = moments.filter(m => {
        if (m.surface !== surface) return false;
        if (!scoped) return true;
        if (restrictIds && restrictIds.includes(m.id)) return true;
        if (placement && m.placement === placement) return true;
        return false;
    });
    const eligible = pool.filter(m => isEligible(m, ctx, state));

    if (surface === 'paywall') return topByPriority(eligible);

    // Proactive surfaces: once one proactive moment has been shown this session,
    // only that same moment may keep rendering — everything else is suppressed.
    if (state.sessionShownId) {
        return eligible.find(m => m.id === state.sessionShownId) ?? null;
    }
    return topByPriority(eligible);
}

/** The paywall moment for a module, if any. Used by PaywallHost on a 402 — does
 *  not gate on ctx/session because the 402 itself is the user-driven trigger. */
export function getPaywallMoment(module: string): UpsellMoment | null {
    return UPSELL_MOMENTS.find(m => m.surface === 'paywall' && m.module === module) ?? null;
}

/** Compute the timestamp a dismissal cooldown expires at. */
export function cooldownUntil(moment: UpsellMoment, now: number): number {
    return now + moment.cooldownDays * DAY_MS;
}

// ── Marketing layer: scheduling, trigger rules, A/B, offers ───────────────────

/** Is the campaign within its live window? Absent schedule = always live. */
export function withinSchedule(moment: UpsellMoment, now: number): boolean {
    const s = moment.schedule;
    if (!s) return true;
    if (s.startAt != null && now < s.startAt) return false;
    if (s.endAt != null && now > s.endAt) return false;
    return true;
}

/** Compile a declarative {@link TriggerRule} into a pure predicate. Absent rule
 *  = always-true (used by paywall campaigns, whose trigger is the 402 itself). */
export function compileTrigger(rule: TriggerRule | undefined): (ctx: UpsellContextData) => boolean {
    if (!rule) return () => true;
    const test = (r: TriggerRule, ctx: UpsellContextData): boolean => {
        const v = ctx[r.field];
        switch (r.op) {
            case '>=': return v >= r.value;
            case '<=': return v <= r.value;
            case '>': return v > r.value;
            case '<': return v < r.value;
            case '==': return v === r.value;
            default: return false;
        }
    };
    return (ctx) => test(rule, ctx) && (!rule.and || compileTrigger(rule.and)(ctx));
}

/**
 * Turn a serialisable {@link CampaignDTO} (authored in Super Admin) into a
 * runtime {@link Campaign} by compiling its declarative trigger. Trigger
 * precedence: a paywall campaign always-fires (the 402 is its trigger); an
 * explicit `triggerRule` wins; otherwise, when this DTO *overrides a built-in*
 * (`base` given) we KEEP the built-in's original compiled trigger — so an admin
 * can retune copy/offer/schedule without having to re-author a complex data
 * trigger. A brand-new campaign with no rule defaults to always-eligible (still
 * gated by stage / role / cooldown / schedule).
 */
export function compileCampaign(dto: CampaignDTO, base?: Campaign): Campaign {
    const { triggerRule, ...rest } = dto;
    const trigger = dto.surface === 'paywall'
        ? PAYWALL_ALWAYS
        : triggerRule
            ? compileTrigger(triggerRule)
            : (base?.trigger ?? PAYWALL_ALWAYS);
    return { ...rest, trigger, source: 'remote' };
}

/**
 * Merge Super-Admin remote campaigns over the built-in defaults, keyed by id:
 * a remote campaign with a built-in's id REPLACES it (preserving the built-in's
 * trigger unless the override supplies its own rule — see {@link compileCampaign});
 * a brand-new id is appended. Built-ins are tagged `source: 'builtin'`. With no
 * remote config the defaults are returned unchanged, so the engine always has a
 * safe, offline fallback.
 */
export function resolveCampaigns(builtin: Campaign[], remote: CampaignDTO[] | null | undefined): Campaign[] {
    const byId = new Map<string, Campaign>(builtin.map(m => [m.id, { ...m, source: 'builtin' as const }]));
    if (Array.isArray(remote)) {
        for (const dto of remote) byId.set(dto.id, compileCampaign(dto, byId.get(dto.id)));
    }
    return [...byId.values()];
}

/** Small, stable string hash (FNV-1a). Used only for deterministic A/B buckets. */
function hashString(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0; // unsigned
}

/**
 * Deterministic, weighted A/B pick via **rendezvous (HRW) hashing**: each variant
 * gets a score from `hash(seed:campaign:variantId)` shaped by its weight, and the
 * highest wins. A given (seed, campaign) always resolves to the same variant, and
 * — crucially — adding or removing a variant only reassigns the users it directly
 * affects (those who move to a new variant, or off a removed one); everyone else
 * keeps their variant, so an experiment isn't contaminated when its set is edited.
 * Returns null when the campaign defines no variants (use the base copy).
 */
export function pickVariant(moment: UpsellMoment, seed: string): CampaignVariant | null {
    const variants = moment.variants;
    if (!variants || variants.length === 0) return null;
    let best: CampaignVariant | null = null;
    let bestScore = -Infinity;
    for (const v of variants) {
        const w = Math.max(0, v.weight ?? 1);
        if (w <= 0) continue; // zero weight → never chosen
        // key ∈ (0,1); score = ln(key)/w is highest for the weight-favoured variant.
        const key = Math.max(hashString(`${seed}:${moment.id}:${v.id}`) / 4294967296, 1e-12);
        const score = Math.log(key) / w;
        if (score > bestScore) { bestScore = score; best = v; }
    }
    return best ?? variants[0]; // all zero-weight → fall back to the first
}

export interface ResolvedCreative {
    headline: string;
    body: string;
    ctaLabel: string;
    /** The chosen A/B variant id, or null when the base copy (control) is used. */
    variantId: string | null;
}

/** The copy actually shown: the chosen A/B variant applied over the base copy. */
export function resolveCreative(moment: UpsellMoment, seed: string): ResolvedCreative {
    const v = pickVariant(moment, seed);
    return {
        headline: v?.headline ?? moment.headline,
        body: v?.body ?? moment.body,
        ctaLabel: v?.ctaLabel ?? moment.ctaLabel,
        variantId: v?.id ?? null,
    };
}

/** The live offer for a campaign right now, or null if absent/expired. */
export function offerLive(moment: UpsellMoment, now: number): CampaignOffer | null {
    const o = moment.offer;
    if (!o) return null;
    if (o.endsAt != null && now > o.endsAt) return null;
    return o;
}
