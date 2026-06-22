import { StoreSettings } from '../types';

/**
 * Premium add-on modules (modular packaging). Mirrors the backend
 * entitlements.service. A feature is unlocked when its module id is present in
 * `storeSettings.enabledModules` (granted by the platform after payment).
 */
export const MODULES = {
    SMS_MESSAGING: 'sms_messaging',
    TEAM_MEMBERS: 'team_members',
    AUTO_REORDER: 'auto_reorder',
    AI_ASSISTANT: 'ai_assistant',
    QUICK_IMPORT: 'quick_import',
    ADVANCED_REPORTS: 'advanced_reports',
} as const;

export type ModuleId = typeof MODULES[keyof typeof MODULES];

/** User seats included for free (the owner). Extra seats need TEAM_MEMBERS. */
export const FREE_SEATS = 1;

/** Whether a store has a given premium module unlocked. Defaults to locked. */
export const hasModule = (settings: StoreSettings | null | undefined, moduleId: string): boolean =>
    Array.isArray(settings?.enabledModules) && settings!.enabledModules!.includes(moduleId);

/**
 * Sidebar page keys that live behind a premium add-on module. A page absent from
 * this map is always entitled (core). Keep in sync with the module registry.
 */
export const PAGE_MODULES: Record<string, string> = {
    reports: MODULES.ADVANCED_REPORTS,
};

/** Whether the current store may open a given page (core pages are always allowed). */
export const isPageEntitled = (settings: StoreSettings | null | undefined, page: string): boolean => {
    const moduleId = PAGE_MODULES[page];
    return !moduleId || hasModule(settings, moduleId);
};
