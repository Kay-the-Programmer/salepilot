import { Sale } from '../types';

/**
 * The platform's definition of revenue, client side.
 *
 * This mirrors `s-back/src/utils/revenue.ts`, which holds the same definition
 * as SQL fragments. The arithmetic is small enough that every screen had
 * simply written it out again — `(s.subtotal || 0) - (s.discount || 0)`
 * appeared inline in the dashboard, the accounting KPI, the cash-flow chart,
 * the tax report and the receipt builder. Small and copied is exactly the
 * combination that drifts: when tax classes landed, five places had to be
 * found by hand, and the one that was missed would not have failed a test —
 * it would just have shown a different number on one screen.
 *
 *   accrual · ex-tax · net of discount · excludes cancelled
 *
 * Tax is money held for the revenue authority, not income, so it never counts.
 *
 * Refunds are deliberately NOT deducted by {@link saleRevenue}, matching the
 * backend: a refund belongs to the period it happens in, not the one the sale
 * was rung in, so netting it against the sale would let an August return
 * quietly reduce April. Screens that want the net-of-returns view ask for it
 * explicitly with {@link saleNetOfRefunds} — which is what the Business
 * Dashboard shows, while the Accounting Hub reports revenue gross and returns
 * on their own line.
 */

const num = (v: unknown): number => {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
    return Number.isFinite(n) ? n : 0;
};

/** Cancelled sales never happened, financially. */
export const isCancelled = (s: Sale): boolean =>
    (s as { fulfillmentStatus?: string }).fulfillmentStatus === 'cancelled';

/**
 * Sale-level revenue: what the customer agreed to pay, before tax and after
 * the order discount. Zero for a cancelled sale.
 */
export const saleRevenue = (s: Sale): number => {
    if (isCancelled(s)) return 0;
    return Math.max(0, num(s.subtotal) - num((s as { discount?: number }).discount));
};

/**
 * The share of a sale that survived refunds, 0–1.
 *
 * Measured against what the sale was worth BEFORE the refund. `total` as it
 * comes back from `/sales` is already net of refunds, so dividing by it
 * inflated the share — a K90 refund on a K360 sale read as 90/270 = 33%
 * instead of 25%, under-reporting revenue. `originalTotal` is the pre-refund
 * figure; older cached rows that lack it are reconstructed by adding the
 * refund back.
 */
export const survivingFraction = (s: Sale): number => {
    const refunded = num(s.totalRefunded);
    if (refunded <= 0) return 1;
    const original = num(s.originalTotal) || num(s.total) + refunded;
    return original > 0 ? 1 - Math.min(1, refunded / original) : 1;
};

/** Sale-level revenue with the refunded share taken off. */
export const saleNetOfRefunds = (s: Sale): number => saleRevenue(s) * survivingFraction(s);

/** Sum of {@link saleRevenue} over a list. */
export const totalRevenue = (sales: Sale[]): number =>
    sales.reduce((a, s) => a + saleRevenue(s), 0);

/** Sum of {@link saleNetOfRefunds} over a list. */
export const totalRevenueNetOfRefunds = (sales: Sale[]): number =>
    sales.reduce((a, s) => a + saleNetOfRefunds(s), 0);

/**
 * The sale's discount as a factor to apply to its lines: 1 when undiscounted,
 * 0.9 for a 10%-off basket. Keeps per-product figures adding back up to the
 * sale's revenue instead of its pre-discount face value.
 */
export const discountFactor = (s: Sale): number => {
    const subtotal = num(s.subtotal);
    if (subtotal <= 0) return 1;
    return 1 - num((s as { discount?: number }).discount) / subtotal;
};
