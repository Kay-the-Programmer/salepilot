import { useEffect, useSyncExternalStore } from 'react';
import { Product, Customer, Sale, User, StoreSettings } from '../types';
import {
    hasModule,
    MODULES,
    ModuleId,
    FREE_PRODUCT_LIMIT,
    WHATSAPP_FREE,
    SOCIAL_FREE,
} from '../utils/entitlements';
import { UpsellContextData, UpsellMoment, UpsellSurface, CampaignOffer } from '../utils/upsell';
import { upsellService, ModulePrice } from '../services/upsellService';

/**
 * React binding for the upsell engine.
 *
 * - `useUpsellSync` is called ONCE by the Dashboard shell (a hook, so it runs
 *   before Dashboard's many early returns). It derives the read-only
 *   {@link UpsellContextData} snapshot from the central store and pushes it into
 *   the service singleton. No provider wraps the tree — every surface reads the
 *   live snapshot through `useUpsell`, including apps in Dashboard's other return
 *   branches.
 * - `useUpsell` is the reactive read hook for surfaces.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DORMANT_MS = 30 * DAY_MS;

export interface UpsellSyncInput {
    currentUser: User | null;
    storeSettings: StoreSettings | null;
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    users: User[];
    isMidSale: boolean;
    storeCount: number;
}

/** Owned-module check that also treats free-overridden modules as owned, so we
 *  never upsell a feature that is currently free. */
function makeHasModule(storeSettings: StoreSettings | null): (m: ModuleId) => boolean {
    return (m: ModuleId) => {
        if (m === MODULES.WHATSAPP_MESSAGING && WHATSAPP_FREE) return true;
        if (m === MODULES.SOCIAL_MARKETING && SOCIAL_FREE) return true;
        // A merchant who has connected their own Lenco account already accepts
        // mobile money — don't upsell the gateway to them.
        if (m === MODULES.PAYMENT_GATEWAY && !!storeSettings?.lencoPublicKey) return true;
        return hasModule(storeSettings, m);
    };
}

/** A sale counts as cash when no electronic payment was captured. */
function isCashSale(s: Sale): boolean {
    const method = (s.paymentMethod || '').toLowerCase();
    if (method) return method.includes('cash');
    return s.cashReceived != null; // no method recorded but cash was tendered
}

function buildSnapshot(input: UpsellSyncInput): UpsellContextData {
    const { currentUser, storeSettings, products, customers, sales, users, isMidSale, storeCount } = input;
    const now = Date.now();

    // Last purchase per customer + earliest sale (tenure proxy), single pass.
    const lastSaleByCustomer: Record<string, number> = {};
    let earliestSale = Infinity;
    for (const s of sales) {
        const t = Date.parse(s.timestamp);
        if (!Number.isFinite(t)) continue;
        if (t < earliestSale) earliestSale = t;
        if (s.customerId) {
            const prev = lastSaleByCustomer[s.customerId];
            if (!prev || t > prev) lastSaleByCustomer[s.customerId] = t;
        }
    }

    const dormantCustomerCount = Object.values(lastSaleByCustomer)
        .filter(t => now - t >= DORMANT_MS).length;

    const firstSeen = upsellService.getFirstSeen();
    const firstActive = Number.isFinite(earliestSale) ? Math.min(earliestSale, firstSeen) : firstSeen;
    const daysActive = Math.max(0, Math.floor((now - firstActive) / DAY_MS));

    const ownsModule = makeHasModule(storeSettings);
    const productCap = ownsModule(MODULES.UNLIMITED_PRODUCTS) ? Infinity : FREE_PRODUCT_LIMIT;

    // No historical stock-out signal exists; approximate with current out-of-stock.
    const recentStockoutCount = products.filter(p => p.status === 'active' && (p.stock ?? 0) <= 0).length;

    const cashSaleCount = sales.reduce((n, s) => n + (isCashSale(s) ? 1 : 0), 0);

    return {
        role: currentUser?.role ?? '',
        isMidSale,
        daysActive,
        hasModule: ownsModule,
        productCount: products.length,
        productCap,
        manualAddsThisSession: upsellService.getManualAdds(),
        customerCount: customers.length,
        dormantCustomerCount,
        recentStockoutCount,
        userCount: users.length,
        storeCount,
        salesCount: sales.length,
        cashSaleCount,
    };
}

/** Dashboard-only: keep the engine's data snapshot in sync with the store. */
export function useUpsellSync(input: UpsellSyncInput): void {
    const userId = input.currentUser?.id;
    useEffect(() => {
        upsellService.setUser(userId);
    }, [userId]);

    useEffect(() => {
        upsellService.setContext(buildSnapshot(input));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        input.currentUser,
        input.storeSettings,
        input.products,
        input.customers,
        input.sales,
        input.users,
        input.isMidSale,
        input.storeCount,
    ]);
}

export interface UseUpsell {
    ctx: UpsellContextData | null;
    getEligible: (surface: UpsellSurface, restrictIds?: readonly string[], placement?: string) => UpsellMoment | null;
    recordShown: (m: UpsellMoment) => void;
    recordClick: (m: UpsellMoment) => void;
    recordDismissed: (m: UpsellMoment, opts?: { permanent?: boolean }) => void;
    getPrice: (module: string) => ModulePrice | null;
    /** Live promotional offer for a campaign (discount / coupon / countdown), or null. */
    getOffer: (m: UpsellMoment) => CampaignOffer | null;
}

/** Reactive read hook for upsell surfaces. */
export function useUpsell(): UseUpsell {
    useSyncExternalStore(upsellService.subscribe, upsellService.getVersion, upsellService.getVersion);
    return {
        ctx: upsellService.getContext(),
        getEligible: (surface, restrictIds, placement) => upsellService.getEligible(surface, restrictIds, placement),
        recordShown: m => upsellService.recordShown(m),
        recordClick: m => upsellService.recordClick(m),
        recordDismissed: (m, opts) => upsellService.recordDismissed(m, opts),
        getPrice: module => upsellService.getPrice(module),
        getOffer: m => upsellService.getOffer(m),
    };
}
