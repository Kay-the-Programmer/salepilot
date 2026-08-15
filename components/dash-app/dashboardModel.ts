import { Product, Sale, Customer, StoreSettings } from '../../types';
import { num, parseApiDate } from '../crm/crmModel';

/**
 * Business Dashboard domain model — every figure is DERIVED client-side from the
 * data the SalePilot backend already serves (sales + products + customers), so
 * the standalone app needs no extra endpoints. Mirrors the approach used by the
 * CRM and Inventory apps (see crmModel / inventoryModel).
 */

export type DashPeriod = 'today' | 'week' | 'month' | 'last_month' | 'quarter' | 'year' | 'all';

/** A reporting range: one of the quick presets, or a custom calendar range. */
export type DashRange =
    | { kind: 'preset'; preset: DashPeriod }
    | { kind: 'custom'; start: number; end: number }; // [start, end) epoch ms

export const presetRange = (preset: DashPeriod): DashRange => ({ kind: 'preset', preset });

const DAY = 86400000;

const startOfDay = (t: number): number => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

export interface DashWindow {
    /** Inclusive start / exclusive end of the selected period. */
    start: number;
    end: number;
    /** The comparison window — the SAME ELAPSED PORTION of the previous period. */
    prevStart: number;
    prevEnd: number;
    /** False when there is no meaningful prior period (All Time). */
    comparable: boolean;
}

/**
 * THE window definition. Every figure on the dashboard — metric cards, trend,
 * transaction list, and the server-side product table — is filtered by this one
 * function, so no two panels can disagree about what a period means.
 *
 * All presets are CALENDAR-based and run to `now`. They used to be split:
 * Day/Week were rolling (last 24h / last 7×24h) for the cards while the product
 * table below them was asked for calendar dates, so an 8pm-yesterday sale
 * counted in "Today"'s revenue but was missing from "Today"'s product table.
 *
 * The prior window is the same elapsed slice of the preceding period, not an
 * equal span ending at the period start. On the 3rd of the month, "This Month"
 * now compares days 1–3 against days 1–3 of last month; it used to compare them
 * against the last three days of last month, which made the arrow meaningless.
 */
const rangeWindow = (range: DashRange, now: number): DashWindow => {
    if (range.kind === 'custom') {
        const span = Math.max(DAY, range.end - range.start);
        return { start: range.start, end: range.end, prevStart: range.start - span, prevEnd: range.start, comparable: true };
    }
    const d = new Date(now);
    const y = d.getFullYear(), m = d.getMonth();
    const today = startOfDay(now);
    let start: number;
    let end = now;
    // Start of the equivalent PREVIOUS period; the elapsed slice is applied below.
    let prevPeriodStart: number;
    switch (range.preset) {
        case 'today':
            start = today;
            prevPeriodStart = start - DAY;
            break;
        case 'week':                                                        // the last 7 calendar days, today included
            start = today - 6 * DAY;
            prevPeriodStart = start - 7 * DAY;
            break;
        case 'month':                                                       // month-to-date
            start = new Date(y, m, 1).getTime();
            prevPeriodStart = new Date(y, m - 1, 1).getTime();
            break;
        case 'last_month':                                                  // a complete month, compared to the one before it
            start = new Date(y, m - 1, 1).getTime();
            end = new Date(y, m, 1).getTime();
            prevPeriodStart = new Date(y, m - 2, 1).getTime();
            return { start, end, prevStart: prevPeriodStart, prevEnd: start, comparable: true };
        case 'quarter': {                                                   // quarter-to-date
            const q = Math.floor(m / 3) * 3;
            start = new Date(y, q, 1).getTime();
            prevPeriodStart = new Date(y, q - 3, 1).getTime();
            break;
        }
        case 'year':                                                        // year-to-date
            start = new Date(y, 0, 1).getTime();
            prevPeriodStart = new Date(y - 1, 0, 1).getTime();
            break;
        case 'all':
            start = new Date(2000, 0, 1).getTime();
            // Nothing precedes "all time" — the comparison is suppressed rather
            // than reported as a permanent +100%.
            return { start, end, prevStart: start, prevEnd: start, comparable: false };
        default:
            start = today - 6 * DAY;
            prevPeriodStart = start - 7 * DAY;
    }
    const elapsed = Math.max(0, end - start);
    return { start, end, prevStart: prevPeriodStart, prevEnd: prevPeriodStart + elapsed, comparable: true };
};

/** The active window for a range — exported so callers filter exactly as the cards do. */
export const windowFor = (range: DashRange, now: number = Date.now()): DashWindow => rangeWindow(range, now);

/** Net revenue of a sale: ex-tax, net of discounts (the platform-wide revenue
 *  definition), reduced by the refunded share. Cancelled sales contribute 0. */
const saleNet = (s: Sale): number => {
    if ((s as any).fulfillmentStatus === 'cancelled') return 0;
    const base = Math.max(0, num(s.subtotal) - num((s as any).discount));
    const refunded = num(s.totalRefunded);
    // The refunded SHARE must be measured against what the sale was worth
    // BEFORE the refund. `total` from /sales is already net of refunds, so
    // dividing by it inflated the share (a K90 refund on a K360 sale read as
    // 90/270 = 33% instead of 25%) and under-reported revenue. `originalTotal`
    // is the pre-refund figure; older cached rows that lack it are reconstructed
    // by adding the refund back.
    const original = num(s.originalTotal) || num(s.total) + refunded;
    const refundedFraction = original > 0 ? Math.min(1, refunded / original) : 0;
    return base * (1 - refundedFraction);
};

export interface DashDelta {
    /** Percentage change vs the prior comparable window. */
    pct: number;
    up: boolean;
    /** True when there is no prior baseline to compare against. */
    isNew: boolean;
    /** False when the range has no prior period at all (All Time) — render nothing. */
    comparable: boolean;
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

const delta = (cur: number, prev: number, comparable = true): DashDelta => {
    if (!comparable) return { pct: 0, up: true, isNew: false, comparable: false };
    if (prev <= 0) return { pct: cur > 0 ? 100 : 0, up: cur >= 0, isNew: cur > 0, comparable: true };
    const pct = ((cur - prev) / prev) * 100;
    return { pct: Math.abs(pct), up: pct >= 0, isNew: false, comparable: true };
};

/**
 * Split a window into 6–13 readable buckets: hours for a single day, days for a
 * few weeks, weeks for a few months, months beyond that.
 */
const trendBuckets = (start: number, end: number): { start: number; end: number; label: string }[] => {
    const span = Math.max(1, end - start);
    const fmt = (t: number, o: Intl.DateTimeFormatOptions) => new Date(t).toLocaleDateString(undefined, o);
    const out: { start: number; end: number; label: string }[] = [];

    if (span <= 1.5 * DAY) {                                    // one day → 3-hour blocks
        for (let t = start; t < end; t += 3 * 3600000) {
            out.push({ start: t, end: Math.min(end, t + 3 * 3600000), label: new Date(t).toLocaleTimeString(undefined, { hour: 'numeric' }) });
        }
    } else if (span <= 31 * DAY) {                              // days
        const opts: Intl.DateTimeFormatOptions = span <= 8 * DAY ? { weekday: 'short' } : { day: 'numeric', month: 'short' };
        for (let t = startOfDay(start); t < end; t += DAY) {
            out.push({ start: t, end: Math.min(end, t + DAY), label: fmt(t, opts) });
        }
    } else if (span <= 180 * DAY) {                             // weeks
        for (let t = startOfDay(start); t < end; t += 7 * DAY) {
            out.push({ start: t, end: Math.min(end, t + 7 * DAY), label: fmt(t, { day: 'numeric', month: 'short' }) });
        }
    } else {                                                     // months
        const d = new Date(start);
        let t = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        while (t < end) {
            const next = new Date(new Date(t).getFullYear(), new Date(t).getMonth() + 1, 1).getTime();
            out.push({ start: t, end: Math.min(end, next), label: fmt(t, { month: 'short' }) });
            t = next;
        }
    }

    // Very long ranges (All Time) would otherwise draw hundreds of points —
    // fold them into at most 13 evenly sized buckets, keeping the labels honest.
    const MAX = 13;
    if (out.length > MAX) {
        const size = Math.ceil(out.length / MAX);
        const folded: typeof out = [];
        for (let i = 0; i < out.length; i += size) {
            const chunk = out.slice(i, i + size);
            folded.push({ start: chunk[0].start, end: chunk[chunk.length - 1].end, label: chunk[0].label });
        }
        return folded;
    }
    return out;
};

const inRange = (s: Sale, start: number, end: number): boolean => {
    const d = parseApiDate(s.timestamp);
    if (!d) return false;
    const t = d.getTime();
    return t >= start && t < end;
};

/**
 * Authoritative period totals from the server's aggregate report endpoint.
 * The client-side figures are computed from `GET /sales`, which the backend
 * caps at the newest 1000 rows — fine for a week, silently short for "This
 * Year" on a busy store. When these are supplied they win.
 */
export interface DashServerTotals {
    revenue: number;
    orders: number;
    prevRevenue: number;
    prevOrders: number;
}

export const buildDashboard = (
    sales: Sale[],
    products: Product[],
    customers: Customer[],
    _storeSettings: StoreSettings | null,
    range: DashRange = { kind: 'preset', preset: 'week' },
    now = Date.now(),
    serverTotals?: DashServerTotals | null,
): DashboardOverview => {
    const { start, end, prevStart, prevEnd, comparable } = rangeWindow(range, now);

    const notCancelled = (s: Sale) => (s as any).fulfillmentStatus !== 'cancelled';
    const current = sales.filter(s => notCancelled(s) && inRange(s, start, end));
    const prior = sales.filter(s => notCancelled(s) && inRange(s, prevStart, prevEnd));

    const revenue = serverTotals ? serverTotals.revenue : current.reduce((sum, s) => sum + saleNet(s), 0);
    const prevRevenue = serverTotals ? serverTotals.prevRevenue : prior.reduce((sum, s) => sum + saleNet(s), 0);
    const orders = serverTotals ? serverTotals.orders : current.length;
    const prevOrders = serverTotals ? serverTotals.prevOrders : prior.length;
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

    // Trend across THE SELECTED PERIOD (it used to be pinned to the last 7 days
    // whatever the picker said, so the chart and the cards above it described
    // different windows). Bucket size adapts so the chart stays readable.
    const trend: TrendPoint[] = [];
    let trendMax = 0;
    for (const b of trendBuckets(start, end)) {
        const value = current
            .filter(s => inRange(s, b.start, b.end))
            .reduce((sum, s) => sum + saleNet(s), 0);
        trend.push({ label: b.label, value });
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
            delta: delta(row.revenue, priorRevenue.get(id) || 0, comparable),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Recent activity — the newest sales WITHIN THE SELECTED PERIOD. This list
    // used to ignore the picker entirely (and include cancelled sales at a zero
    // total), so choosing "Last Month" still listed this morning's takings.
    const activity: ActivityRow[] = [...current]
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
        revenueDelta: delta(revenue, prevRevenue, comparable),
        ordersDelta: delta(orders, prevOrders, comparable),
        aovDelta: delta(aov, prevAov, comparable),
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
    last_month: 'Last Month',
    quarter: 'This Quarter',
    year: 'This Year',
    all: 'All Time',
};

/**
 * The same window as `YYYY-MM-DD` strings, for the server-side report endpoints
 * (which take calendar dates, not epochs). `end` is exclusive here, so the last
 * inclusive day is a millisecond earlier — a window ending at midnight must not
 * report an extra empty day.
 */
const isoDay = (t: number): string => {
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * A window as the bounds the server report endpoints expect.
 *
 * These are full ISO instants, not calendar dates. `sales.timestamp` is
 * TIMESTAMPTZ, and a bare 'YYYY-MM-DD' gets cast in the DATABASE's timezone
 * (UTC), not the merchant's — so for a UTC+2 store every period boundary
 * landed two hours off and the server table covered a different slice of time
 * than the cards, which are computed in browser-local time. Sending the exact
 * instants the picker resolved to removes the ambiguity entirely.
 * `endDate` is EXCLUSIVE here; the backend steps back a millisecond.
 */
const datesOf = (start: number, end: number) => ({
    startDate: new Date(start).toISOString(),
    endDate: new Date(Math.max(start + 1, end)).toISOString(),
});

/** The same window as plain calendar dates, for display and file names. */
export const rangeDaysOf = (start: number, end: number) => ({ startDay: isoDay(start), endDay: isoDay(Math.max(start, end - 1)) });

export const rangeDates = (range: DashRange, now: number = Date.now()): { startDate: string; endDate: string } => {
    // No special-casing any more: every preset is already calendar-aligned in
    // rangeWindow, so the server report covers exactly the window the cards
    // count. The two rolling presets used to be remapped here, which is what
    // made the metric cards and the product table disagree under one label.
    const { start, end } = rangeWindow(range, now);
    return datesOf(start, end);
};

/** Current AND comparison windows as calendar dates, for server-side totals. */
export const rangeDatePair = (range: DashRange, now: number = Date.now()) => {
    const w = rangeWindow(range, now);
    return { current: datesOf(w.start, w.end), prior: datesOf(w.prevStart, w.prevEnd), comparable: w.comparable };
};

/** Short human label for a range — preset name, or formatted custom date(s). */
export const rangeLabel = (range: DashRange): string => {
    if (range.kind === 'preset') return PERIOD_LABEL[range.preset];
    const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    // `end` is exclusive — show the inclusive last day.
    if (range.end - range.start <= DAY) return fmt(range.start);
    return `${fmt(range.start)} – ${fmt(range.end - DAY)}`;
};
