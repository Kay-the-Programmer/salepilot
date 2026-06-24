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
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

/**
 * DEV OVERRIDE: WhatsApp messaging is free while the team builds/tests the CRM
 * integration, so it never shows as a locked premium add-on. Defaults to FREE;
 * set `VITE_WHATSAPP_FREE=false` (and `WHATSAPP_FREE=false` on the backend) to
 * re-enable the paid add-on before charging for it.
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

/** User seats included for free (the owner). Extra seats need TEAM_MEMBERS. */
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
    reports: MODULES.ADVANCED_REPORTS,
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
