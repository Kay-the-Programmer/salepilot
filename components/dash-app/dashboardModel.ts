import { Product, Sale, Customer, StoreSettings } from '../../types';
import { num, parseApiDate } from '../crm/crmModel';

/**
 * Business Dashboard domain model — every figure is DERIVED client-side from the
 * data the SalePilot backend already serves (sales + products + customers), so
 * the standalone app needs no extra endpoints. Mirrors the approach used by the
 * CRM and Inventory apps (see crmModel / inventoryModel).
 */

export type DashPeriod = 'today' | 'week' | 'month';

/** A reporting range: one of the quick presets, or a custom calendar range. */
export type DashRange =
    | { kind: 'preset'; preset: DashPeriod }
    | { kind: 'custom'; start: number; end: number }; // [start, end) epoch ms

export const presetRange = (preset: DashPeriod): DashRange => ({ kind: 'preset', preset });

const DAY = 86400000;

/** Inclusive-start, exclusive-end window for a range, plus the matching prior window. */
const rangeWindow = (range: DashRange, now: number): { start: number; end: number; prevStart: number; prevEnd: number } => {
    if (range.kind === 'custom') {
        const span = Math.max(DAY, range.end - range.start);
        return { start: range.start, end: range.end, prevStart: range.start - span, prevEnd: range.start };
    }
    const span = range.preset === 'today' ? DAY : range.preset === 'week' ? 7 * DAY : 30 * DAY;
    return { start: now - span, end: now, prevStart: now - 2 * span, prevEnd: now - span };
};

/** Net value of a sale (total less anything refunded). */
const saleNet = (s: Sale): number => Math.max(0, num(s.total) - num(s.totalRefunded));

export interface DashDelta {
    /** Percentage change vs the prior comparable window. */
    pct: number;
    up: boolean;
    /** True when there is no prior baseline to compare against. */
    isNew: boolean;
}

export interface TrendPoint {
    label: string;
    value: number;
}

export interface TopProduct {
    id: string;
    name: string;
    image?: string;
    units: number;
    revenue: number;
    delta: DashDelta;
}

export interface ActivityRow {
    id: string;
    customer: string;
    total: number;
    ts: string;
    channel: 'pos' | 'online';
    status: 'paid' | 'unpaid' | 'partially_paid';
    itemCount: number;
}

export interface DashboardOverview {
    period: DashPeriod;
    /** Human label for the active range (preset name or formatted custom dates). */
    rangeLabel: string;
    revenue: number;
    orders: number;
    aov: number;
    revenueDelta: DashDelta;
    ordersDelta: DashDelta;
    aovDelta: DashDelta;
    newCustomers: number;
    grossMargin: number;       // profit / revenue (0–1), 0 when unknown
    trend: TrendPoint[];        // last 7 calendar days, oldest → newest
    trendMax: number;
    topProducts: TopProduct[];
    activity: ActivityRow[];
    lowStockCount: number;
    outOfStockCount: number;
}

const delta = (cur: number, prev: number): DashDelta => {
    if (prev <= 0) return { pct: cur > 0 ? 100 : 0, up: cur >= 0, isNew: prev <= 0 && cur > 0 };
    const pct = ((cur - prev) / prev) * 100;
    return { pct: Math.abs(pct), up: pct >= 0, isNew: false };
};

const inRange = (s: Sale, start: number, end: number): boolean => {
    const d = parseApiDate(s.timestamp);
    if (!d) return false;
    const t = d.getTime();
    return t >= start && t < end;
};

export const buildDashboard = (
    sales: Sale[],
    products: Product[],
    customers: Customer[],
    _storeSettings: StoreSettings | null,
    range: DashRange = { kind: 'preset', preset: 'week' },
    now = Date.now(),
): DashboardOverview => {
    const { start, end, prevStart, prevEnd } = rangeWindow(range, now);

    const current = sales.filter(s => inRange(s, start, end));
    const prior = sales.filter(s => inRange(s, prevStart, prevEnd));

    const revenue = current.reduce((sum, s) => sum + saleNet(s), 0);
    const prevRevenue = prior.reduce((sum, s) => sum + saleNet(s), 0);
    const orders = current.length;
    const prevOrders = prior.length;
    const aov = orders ? revenue / orders : 0;
    const prevAov = prevOrders ? prevRevenue / prevOrders : 0;

    // Net quantity actually kept by the customer (sold less any per-line returns).
    const netQty = (item: { quantity: number; returnedQuantity?: number }) =>
        Math.max(0, num(item.quantity) - num(item.returnedQuantity));

    // Gross margin from cart cost data when available.
    let cost = 0;
    let revenueWithCost = 0;
    for (const s of current) {
        for (const item of s.cart || []) {
            if (item.costPrice != null) {
                const q = netQty(item);
                cost += num(item.costPrice) * q;
                revenueWithCost += num(item.price) * q;
            }
        }
    }
    const grossMargin = revenueWithCost > 0 ? Math.max(0, (revenueWithCost - cost) / revenueWithCost) : 0;

    // New customers in the current window.
    const newCustomers = customers.filter(c => {
        const d = parseApiDate(c.createdAt);
        return d && d.getTime() >= start && d.getTime() < end;
    }).length;

    // 7-day trend (always a weekday sparkline regardless of headline period).
    const trend: TrendPoint[] = [];
    let trendMax = 0;
    for (let i = 6; i >= 0; i--) {
        const dayEnd = now - i * DAY;
        const dayStart = dayEnd - DAY;
        const value = sales
            .filter(s => inRange(s, dayStart, dayEnd))
            .reduce((sum, s) => sum + saleNet(s), 0);
        const label = new Date(dayEnd - DAY / 2).toLocaleDateString(undefined, { weekday: 'short' });
        trend.push({ label, value });
        trendMax = Math.max(trendMax, value);
    }

    // Top products by revenue across the current window (with prior-window delta).
    const productById = new Map(products.map(p => [p.id, p]));
    const agg = new Map<string, { name: string; units: number; revenue: number }>();
    const priorRevenue = new Map<string, number>();
    for (const s of current) {
        for (const item of s.cart || []) {
            const key = item.productId || item.name;
            const q = netQty(item);
            const row = agg.get(key) || { name: item.name, units: 0, revenue: 0 };
            row.units += q;
            row.revenue += num(item.price) * q;
            agg.set(key, row);
        }
    }
    for (const s of prior) {
        for (const item of s.cart || []) {
            const key = item.productId || item.name;
            priorRevenue.set(key, (priorRevenue.get(key) || 0) + num(item.price) * netQty(item));
        }
    }
    const topProducts: TopProduct[] = [...agg.entries()]
        .map(([id, row]) => ({
            id,
            name: row.name,
            image: productById.get(id)?.imageUrls?.[0],
            units: row.units,
            revenue: row.revenue,
            delta: delta(row.revenue, priorRevenue.get(id) || 0),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Recent activity (latest sales, newest first).
    const activity: ActivityRow[] = [...sales]
        .filter(s => !!s.timestamp)
        .sort((a, b) => (parseApiDate(b.timestamp)?.getTime() ?? 0) - (parseApiDate(a.timestamp)?.getTime() ?? 0))
        .slice(0, 6)
        .map(s => ({
            id: s.transactionId,
            customer: s.customerName || s.customerDetails?.name || 'Walk-in customer',
            total: saleNet(s),
            ts: s.timestamp,
            channel: s.channel === 'online' ? 'online' : 'pos',
            status: s.paymentStatus || 'paid',
            itemCount: (s.cart || []).reduce((n, i) => n + netQty(i), 0),
        }));

    // Stock health.
    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const p of products) {
        if (p.status === 'archived') continue;
        const stock = num(p.stock);
        const reorder = num(p.reorderPoint) || num(p.safetyStock) || 5;
        if (stock <= 0) outOfStockCount++;
        else if (stock <= reorder) lowStockCount++;
    }

    return {
        period: range.kind === 'preset' ? range.preset : 'today',
        rangeLabel: rangeLabel(range),
        revenue,
        orders,
        aov,
        revenueDelta: delta(revenue, prevRevenue),
        ordersDelta: delta(orders, prevOrders),
        aovDelta: delta(aov, prevAov),
        newCustomers,
        grossMargin,
        trend,
        trendMax,
        topProducts,
        activity,
        lowStockCount,
        outOfStockCount,
    };
};

export const PERIOD_LABEL: Record<DashPeriod, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
};

/** Short human label for a range — preset name, or formatted custom date(s). */
export const rangeLabel = (range: DashRange): string => {
    if (range.kind === 'preset') return PERIOD_LABEL[range.preset];
    const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    // `end` is exclusive — show the inclusive last day.
    if (range.end - range.start <= DAY) return fmt(range.start);
    return `${fmt(range.start)} – ${fmt(range.end - DAY)}`;
};
