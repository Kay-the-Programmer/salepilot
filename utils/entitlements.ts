import { StoreSettings } from '../types';

/**
 * Premium add-on modules (modular packaging). Mirrors the backend
 * entitlements.service. A feature is unlocked when its module id is present in
 * `storeSettings.enabledModules` (granted by the platform after payment).
 */
export const MODULES = {
    SMS_MESSAGING: 'sms_messaging',
    WHATSAPP_MESSAGING: 'whatsapp_messaging',
    SOCIAL_MARKETING: 'social_marketing',
    TEAM_MEMBERS: 'team_members',
    AUTO_REORDER: 'auto_reorder',
    AI_ASSISTANT: 'ai_assistant',
    QUICK_IMPORT: 'quick_import',
    ADVANCED_REPORTS: 'advanced_reports',
    PUBLIC_TRACKING: 'public_tracking',
    UNLIMITED_PRODUCTS: 'unlimited_products',
    PAYMENT_GATEWAY: 'payment_gateway',
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

/**
 * WhatsApp messaging ships INCLUDED, not sold — a launch decision, not the dev
 * override it began as. Connecting the inbox requires Meta dashboard work (an
 * app, a phone_number_id, a permanent token, our callback URL registered) that
 * a one-till shop cannot do unaided, so it is not billed; its catalogue row is
 * off sale to match. Set `VITE_WHATSAPP_FREE=false` (and `WHATSAPP_FREE=false`
 * on the backend) to charge for it once onboarding is self-serve.
 */
export const WHATSAPP_FREE = (import.meta.env?.VITE_WHATSAPP_FREE ?? 'true') !== 'false';

/**
 * DEV OVERRIDE: Social Marketing (Facebook Pages) is free while the team builds/
 * tests. Defaults to FREE; set `VITE_SOCIAL_FREE=false` (and `SOCIAL_FREE=false`
 * on the backend) to re-enable the paid add-on.
 */
export const SOCIAL_FREE = (import.meta.env?.VITE_SOCIAL_FREE ?? 'true') !== 'false';

/**
 * Product gate for the Marketing Suite (Facebook Pages). Now **launched** — the
 * Discover tile opens the live app. Set `VITE_MARKETING_COMING_SOON=true` to put
 * it back behind the "Coming Soon" lock (tile locked + teaser screen).
 */
export const MARKETING_COMING_SOON = (import.meta.env?.VITE_MARKETING_COMING_SOON ?? 'false') !== 'false';

/**
 * Apps withheld from the launch. Their tiles are already commented out of
 * `standaloneApps.ts`, but the router's catch-all sends any unmatched path to
 * `Dashboard`, which dispatches on the path — so without these flags `/marketing`
 * and `/fleet` still opened the full apps for anyone who typed the URL. That is
 * a half-launch: unadvertised, unsupported and untested surface area.
 *
 * Set `VITE_MARKETING_ENABLED=true` / `VITE_LOGISTICS_ENABLED=true` to bring
 * either back (tile line in `standaloneApps.ts` must be uncommented too).
 */
export const MARKETING_ENABLED = (import.meta.env?.VITE_MARKETING_ENABLED ?? 'false') !== 'false';
export const LOGISTICS_ENABLED = (import.meta.env?.VITE_LOGISTICS_ENABLED ?? 'false') !== 'false';

/**
 * Plan capacity — mirrors `s-back/src/services/plan-limits.ts`. Every tier
 * includes every feature now, so the tiers differ on how much: shops, staff
 * logins, products, AI. `-1` means unlimited.
 *
 * The server is authoritative (it answers 402 PLAN_LIMIT); this mirror is only
 * so the UI can show a meter and disable a button before the round trip.
 */
export interface PlanLimits {
    stores: number;
    seats: number;
    products: number;
    aiRequests: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
    plan_basic: { stores: 1, seats: 2, products: 500, aiRequests: 50 },
    plan_pro: { stores: 1, seats: 6, products: -1, aiRequests: 500 },
    plan_enterprise: { stores: -1, seats: -1, products: -1, aiRequests: -1 },
};

/** Capacity for a plan id — the entry tier when it is unknown or missing. */
export const limitsForPlan = (planId?: string | null): PlanLimits =>
    (planId && PLAN_LIMITS[planId]) ? PLAN_LIMITS[planId] : PLAN_LIMITS.plan_basic;

/** Whether a limit allows one more of something. */
export const withinLimit = (used: number, limit: number): boolean => limit === -1 || used < limit;

/** @deprecated Seats are a plan capacity now — use {@link limitsForPlan}. */
export const FREE_SEATS = 1;

/**
 * Products allowed on the free core (display hint — backend is authoritative and
 * may override via the FREE_PRODUCT_LIMIT env). Beyond this needs UNLIMITED_PRODUCTS.
 */
export const FREE_PRODUCT_LIMIT = 100;

/** Whether a store has a given premium module unlocked. Defaults to locked. */
export const hasModule = (settings: StoreSettings | null | undefined, moduleId: string): boolean =>
    Array.isArray(settings?.enabledModules) && settings!.enabledModules!.includes(moduleId);

/**
 * Sidebar page keys that live behind a premium add-on module. A page absent from
 * this map is always entitled (core). This static map is the fallback; the live
 * map is configured by the Super Admin (each module's "pages") and loaded at
 * runtime via {@link setPageModules}.
 */
export const PAGE_MODULES: Record<string, string> = {
    // Empty by design. The only entry was `reports: ADVANCED_REPORTS`, and the
    // Reports app has been retired — the page key `reports` now grants the
    // Business Dashboard, which every tier includes, so gating it would have
    // locked the dashboard behind an add-on that no longer exists.
};

/** Catalog-driven page→module map loaded from the backend; null until loaded. */
let dynamicPageModules: Record<string, string> | null = null;

/** Install the live catalog page→module map (call once after fetching it). */
export const setPageModules = (map: Record<string, string> | null | undefined): void => {
    dynamicPageModules = map && typeof map === 'object' ? map : null;
};

/** Whether the current store may open a given page (core pages are always allowed). */
export const isPageEntitled = (settings: StoreSettings | null | undefined, page: string): boolean => {
    const map = dynamicPageModules || PAGE_MODULES;
    const moduleId = map[page];
    return !moduleId || hasModule(settings, moduleId);
};
