import { api } from '../../services/api';
import { LoyaltyConfig, DEFAULT_LOYALTY_CONFIG, RedemptionEntry } from './crmModel';

/**
 * Loyalty persistence — store-scoped, on the backend.
 *
 * The program configuration and the redemption ledger used to live in each
 * browser's localStorage, so two staff members saw two different programs and
 * redemption history died with the browser profile. Both now round-trip through
 * `/api/crm/loyalty/*`, and redeeming is a single server-side transaction that
 * records the ledger row and grants the store credit together.
 */

export interface RedemptionRow extends RedemptionEntry {
    /** Joined from `customers` so the ledger reads without a second lookup. */
    customerName?: string | null;
}

/** API rows carry `createdAt`; `RedemptionEntry.ts` is what the model consumes. */
const toEntry = (r: any): RedemptionRow => ({
    id: r.id,
    customerId: r.customerId,
    points: Number(r.points) || 0,
    value: Number(r.value) || 0,
    ts: r.createdAt || r.ts || new Date().toISOString(),
    customerName: r.customerName ?? null,
});

export const loyaltyService = {
    /** The store's program. Falls back to the defaults if the call fails, so a
     *  transient error never makes the CRM look like the program was wiped. */
    async getConfig(): Promise<LoyaltyConfig> {
        try {
            const cfg = await api.get<Partial<LoyaltyConfig>>('/crm/loyalty/program');
            return { ...DEFAULT_LOYALTY_CONFIG, ...(cfg || {}) };
        } catch {
            return { ...DEFAULT_LOYALTY_CONFIG };
        }
    },

    /** Persist the program; returns the stored (clamped) config. An offline save
     *  is queued by the api layer, so echo back what was submitted. */
    async saveConfig(config: LoyaltyConfig): Promise<LoyaltyConfig> {
        const saved = await api.put<Partial<LoyaltyConfig>>('/crm/loyalty/program', config) as any;
        if (!saved || saved.offline) return { ...config };
        return { ...DEFAULT_LOYALTY_CONFIG, ...saved };
    },

    /** The redemption ledger, newest first. Optionally one customer's. */
    async getLedger(customerId?: string): Promise<RedemptionRow[]> {
        try {
            const rows = await api.get<any[]>(`/crm/loyalty/redemptions${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`);
            return Array.isArray(rows) ? rows.map(toEntry) : [];
        } catch {
            return [];
        }
    },

    /**
     * Redeem a customer's points. The server recomputes the balance from their
     * sales and the stored program, so it decides how many points and how much
     * credit — the client cannot ask for more than the points cover.
     */
    async redeem(customerId: string): Promise<{ redemption: RedemptionRow; customer: any; pointsBalance: number }> {
        const res = await api.post<any>('/crm/loyalty/redemptions', { customerId }, { skipQueue: true });
        return { redemption: toEntry(res.redemption), customer: res.customer, pointsBalance: Number(res.pointsBalance) || 0 };
    },
};

export default loyaltyService;
