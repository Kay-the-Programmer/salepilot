/**
 * Hospitality mode: the one place that decides whether this store is a
 * restaurant, bar or cafe rather than a shop.
 *
 * Every hospitality screen — the Menu app, the menu-shaped till, open bills —
 * is gated on `isHospitality(settings)`. Keeping the comparison here means
 * switching a store over, or renaming the flag later, is a one-file change
 * instead of a hunt through the POS.
 *
 * The default is deliberately retail: a store whose settings have not loaded
 * yet, or that predates the field entirely, gets the till it has always had
 * rather than flickering into a menu it never asked for.
 */

import type { StoreSettings } from '../types';

export type BusinessMode = 'retail' | 'hospitality';

/** Business type ids (registration) that put a store into hospitality mode. */
export const HOSPITALITY_TYPE_IDS = ['food_beverage', 'cafe', 'bar_pub'] as const;

export const isHospitalityType = (typeId: string): boolean =>
    (HOSPITALITY_TYPE_IDS as readonly string[]).includes(typeId);

/** True when this store sells from a menu onto open bills. */
export const isHospitality = (settings?: Partial<StoreSettings> | null): boolean =>
    businessModeOf(settings) === 'hospitality';

/**
 * Remembered mode, for the handful of components that are mounted above the
 * store-settings fetch and cannot be handed a settings object — the app
 * switcher overlay is mounted from four separate places, and prop-drilling
 * settings into all of them to decide whether one tile appears is worse than a
 * cache. This mirrors how `getCurrentUser()` is read from a module rather than
 * threaded as a prop.
 *
 * It is a convenience, never an authority: the server decides what a store may
 * do, and settings win whenever they are available.
 */
const MODE_KEY = 'salepilot.businessMode';

type CachedMode = { storeId?: string; mode: BusinessMode };

const readCache = (): CachedMode | null => {
    try {
        const raw = localStorage.getItem(MODE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.mode === 'hospitality' || parsed?.mode === 'retail' ? parsed : null;
    } catch {
        // Private browsing, cleared site data, a quota error: the caller gets
        // 'retail' and the real answer a moment later from settings.
        return null;
    }
};

/** Called when store settings load or are saved. */
export const rememberBusinessMode = (settings?: Partial<StoreSettings> | null, storeId?: string): void => {
    if (!settings || settings.businessMode === undefined) return;
    try {
        localStorage.setItem(MODE_KEY, JSON.stringify({ storeId, mode: businessModeOf(settings) }));
    } catch { /* see readCache */ }
};

/** Forget the cached mode — on sign-out, so the next user starts clean. */
export const forgetBusinessMode = (): void => {
    try { localStorage.removeItem(MODE_KEY); } catch { /* see readCache */ }
};

/**
 * The store's mode. Pass settings whenever you have them. Without them the
 * remembered value is used, and failing that retail — so a shop never sees a
 * menu it didn't ask for, it only ever waits a moment for one it did.
 */
export const businessModeOf = (
    settings?: Partial<StoreSettings> | null,
    storeId?: string,
): BusinessMode => {
    if (settings?.businessMode === 'hospitality') return 'hospitality';
    if (settings?.businessMode === 'retail') return 'retail';
    const cached = readCache();
    if (!cached) return 'retail';
    // A cache written for another shop says nothing about this one.
    if (storeId && cached.storeId && cached.storeId !== storeId) return 'retail';
    return cached.mode;
};

/**
 * What a venue calls the thing a bill is opened against. A restaurant says
 * "Table", a bar says "Tab", a cafe says "Order" — one word, and it is the
 * difference between software that fits the room and software that doesn't.
 */
export const billNounFor = (types?: string[] | null): { one: string; many: string } => {
    const list = types ?? [];
    if (list.includes('bar_pub')) return { one: 'Tab', many: 'Tabs' };
    if (list.includes('cafe') && !list.includes('food_beverage')) return { one: 'Order', many: 'Orders' };
    return { one: 'Table', many: 'Tables' };
};
