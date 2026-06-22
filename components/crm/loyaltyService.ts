import { LoyaltyConfig, DEFAULT_LOYALTY_CONFIG, RedemptionEntry } from './crmModel';

/**
 * Loyalty persistence for the rewards MVP.
 *
 * The program *configuration* (earn/redeem rates, expiry) and the *redemption
 * ledger* are stored per store in localStorage. This keeps the feature shippable
 * with zero backend migrations. The tangible reward — store credit — IS written
 * back to the SalePilot backend on redeem (see CrmApp.handleRedeem), so the
 * customer's balance is real and usable at the POS. Promoting config + ledger to
 * the backend (store_settings.loyalty_program + a redemptions table) is the
 * natural next step once it can be tested end-to-end.
 */

const CONFIG_KEY = (storeId: string) => `crm.loyalty.config.${storeId}`;
const LEDGER_KEY = (storeId: string) => `crm.loyalty.ledger.${storeId}`;

const storeKey = (storeId?: string | null) => storeId || 'default';

const safeParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
};

export const loyaltyService = {
    getConfig(storeId?: string | null): LoyaltyConfig {
        if (typeof localStorage === 'undefined') return { ...DEFAULT_LOYALTY_CONFIG };
        const stored = safeParse<Partial<LoyaltyConfig>>(localStorage.getItem(CONFIG_KEY(storeKey(storeId))), {});
        // Merge so new fields added later inherit sane defaults.
        return { ...DEFAULT_LOYALTY_CONFIG, ...stored };
    },

    saveConfig(storeId: string | null | undefined, config: LoyaltyConfig): void {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(CONFIG_KEY(storeKey(storeId)), JSON.stringify(config));
    },

    getLedger(storeId?: string | null): RedemptionEntry[] {
        if (typeof localStorage === 'undefined') return [];
        const list = safeParse<RedemptionEntry[]>(localStorage.getItem(LEDGER_KEY(storeKey(storeId))), []);
        return Array.isArray(list) ? list : [];
    },

    addRedemption(storeId: string | null | undefined, entry: Omit<RedemptionEntry, 'id' | 'ts'> & { ts?: string }): RedemptionEntry[] {
        const ledger = this.getLedger(storeId);
        const full: RedemptionEntry = {
            id: `rdm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            ts: entry.ts || new Date().toISOString(),
            customerId: entry.customerId,
            points: entry.points,
            value: entry.value,
        };
        const next = [...ledger, full];
        if (typeof localStorage !== 'undefined') localStorage.setItem(LEDGER_KEY(storeKey(storeId)), JSON.stringify(next));
        return next;
    },
};

export default loyaltyService;
