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
}

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
): UpsellMoment | null {
    const pool = moments.filter(m =>
        m.surface === surface && (!restrictIds || restrictIds.includes(m.id)),
    );
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
