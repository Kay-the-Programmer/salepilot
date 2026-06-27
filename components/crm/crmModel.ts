import { Customer, Sale, StoreSettings } from '../../types';

/**
 * CRM domain model — every metric is DERIVED client-side from the data the
 * SalePilot backend already serves (customers + sales).
 *
 * Two backend serialization quirks are normalised here so the numbers are real:
 *  - Money columns are Postgres DECIMAL, which `pg` returns as STRINGS
 *    ("124.50"). `num()` coerces them so spend isn't silently zeroed.
 *  - Timestamps arrive as a timezone-naive string (the backend formats them in
 *    the server's local zone, UTC on Render). `parseApiDate()` treats a string
 *    without an explicit zone as UTC, so "x ago" is accurate instead of skewed.
 */

/** Coerce a possibly-stringified numeric (DECIMAL from pg) to a finite number. */
export const num = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string') { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
    return 0;
};

/**
 * Parse a timestamp from the API. If the string carries no timezone designator
 * (the backend sends naive local strings) it is interpreted as UTC.
 */
export const parseApiDate = (v?: string | Date | null): Date | null => {
    if (!v) return null;
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
    const s = String(v).trim();
    if (!s) return null;

    // ISO 8601 with an explicit zone (…Z or ±hh:mm) — trust it as-is.
    if (/\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    // Naive ISO ("2026-06-21" or "2026-06-21T12:30:00") — treat as UTC.
    const isoNaive = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/.exec(s);
    if (isoNaive) {
        const [, y, mo, d, h = '0', mi = '0', se = '0'] = isoNaive;
        return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se));
    }
    // Locale string from the backend's formatTimestamp ("Jun 21, 2026, 12:30:00 PM"),
    // which represents the server's (UTC) wall-clock — pin it to UTC.
    const asUtc = new Date(`${s} UTC`);
    if (!Number.isNaN(asUtc.getTime())) return asUtc;
    const fallback = new Date(s);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/* ---------------- Tiers (optional, derived from lifetime spend) ---------------- */

export type TierId = 'silver' | 'gold' | 'platinum';

export interface TierDef {
    id: TierId;
    name: string;
    /** Inclusive lower bound of lifetime spend. */
    min: number;
    /** Exclusive upper bound (Infinity for the top tier). */
    max: number;
    icon: string;
}

export const TIERS: TierDef[] = [
    { id: 'silver', name: 'Silver', min: 0, max: 1000, icon: 'workspace_premium' },
    { id: 'gold', name: 'Gold', min: 1000, max: 5000, icon: 'star' },
    { id: 'platinum', name: 'Platinum', min: 5000, max: Infinity, icon: 'diamond' },
];

export const tierFor = (lifetimeSpend: number): TierDef =>
    TIERS.find(t => lifetimeSpend >= t.min && lifetimeSpend < t.max) ?? TIERS[0];

/* ---------------- Loyalty program (one model: points-per-spend) ---------------- */

export interface LoyaltyConfig {
    enabled: boolean;
    /** Spend this many currency units to earn 1 point (e.g. 10 → "1 pt / K10"). */
    earnSpendPerPoint: number;
    /** Points needed per redemption block (e.g. 100). */
    redeemPointsPerUnit: number;
    /** Currency value granted per redemption block (e.g. 5 → "100 pts = K5"). */
    redeemValuePerUnit: number;
    /** Minimum balance before a customer may redeem (0 = no minimum). */
    minRedeemPoints: number;
    /** Whether points lapse after a period of inactivity. */
    expiryEnabled: boolean;
    /** Months of inactivity before points expire. */
    expiryMonths: number;
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
    enabled: true,
    earnSpendPerPoint: 10,
    redeemPointsPerUnit: 100,
    redeemValuePerUnit: 5,
    minRedeemPoints: 0,
    expiryEnabled: false,
    expiryMonths: 12,
};

/** A recorded redemption (points → store credit). */
export interface RedemptionEntry {
    id: string;
    customerId: string;
    points: number;
    value: number;
    ts: string; // ISO
}

export const describeEarn = (c: LoyaltyConfig, settings?: StoreSettings | null): string =>
    `1 point per ${formatMoney(c.earnSpendPerPoint, settings)} spent`;

export const describeRedeem = (c: LoyaltyConfig, settings?: StoreSettings | null): string =>
    `${c.redeemPointsPerUnit.toLocaleString()} points = ${formatMoney(c.redeemValuePerUnit, settings)} off`;

/* ---------------- Per-customer metrics ---------------- */

export interface CustomerMetrics {
    customer: Customer;
    totalSpend: number;
    orderCount: number;
    tier: TierDef;
    statusBadge: 'gold' | 'silver' | 'platinum' | 'new' | 'inactive';
    statusLabel: string;
    avgOrder: number;
    lastPurchase: Date | null;
    firstPurchase: Date | null;
    daysSinceLastPurchase: number | null;
    isInactive: boolean;
    isChurnRisk: boolean;
    isNew: boolean;
    isReturning: boolean;
    monthlyFrequency: number;
    nextTier: TierDef | null;
    spendToNextTier: number;
    tierProgress: number;
    // Loyalty (points-per-spend)
    pointsEarned: number;      // lifetime, after expiry rule
    pointsRedeemed: number;
    pointsBalance: number;     // earned − redeemed (≥ 0)
    pointsExpired: boolean;
    redeemableBlocks: number;  // whole redemption blocks the balance covers
    redeemableValue: number;   // currency value of those blocks
    canRedeem: boolean;
}

const DAY = 86400000;

export const customerMetrics = (
    customer: Customer,
    sales: Sale[],
    config: LoyaltyConfig,
    redeemedPoints: number,
    now = Date.now(),
): CustomerMetrics => {
    const own = sales.filter(s => s.customerId === customer.id);
    const totalSpend = own.reduce((sum, s) => sum + num(s.total), 0);
    const orderCount = own.length;
    const tier = tierFor(totalSpend);

    const dates = own.map(s => parseApiDate(s.timestamp)).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime());
    const firstPurchase = dates[0] ?? null;
    const lastPurchase = dates[dates.length - 1] ?? null;
    const created = parseApiDate(customer.createdAt);

    const daysSinceLastPurchase = lastPurchase ? Math.floor((now - lastPurchase.getTime()) / DAY) : null;
    const isInactive = orderCount > 0 && daysSinceLastPurchase !== null && daysSinceLastPurchase >= 45;
    const isChurnRisk = orderCount > 0 && daysSinceLastPurchase !== null && daysSinceLastPurchase >= 60;
    const isNew = !!created && (now - created.getTime()) < 30 * DAY;
    const isReturning = orderCount > 1;

    const spanStart = (firstPurchase ?? created)?.getTime() ?? now;
    const months = Math.max(1, (now - spanStart) / (30 * DAY));
    const monthlyFrequency = orderCount / months;

    const tierIndex = TIERS.findIndex(t => t.id === tier.id);
    const nextTier = tierIndex >= 0 && tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;
    const spendToNextTier = nextTier ? Math.max(0, nextTier.min - totalSpend) : 0;
    const tierProgress = nextTier ? Math.min(1, (totalSpend - tier.min) / (nextTier.min - tier.min)) : 1;

    // Loyalty points.
    const expired = config.enabled && config.expiryEnabled && daysSinceLastPurchase !== null
        && daysSinceLastPurchase > config.expiryMonths * 30;
    const earnedRaw = config.enabled && config.earnSpendPerPoint > 0
        ? Math.floor(totalSpend / config.earnSpendPerPoint)
        : 0;
    const pointsEarned = expired ? 0 : earnedRaw;
    const pointsRedeemed = Math.max(0, Math.round(redeemedPoints));
    const pointsBalance = Math.max(0, pointsEarned - pointsRedeemed);
    const redeemableBlocks = config.redeemPointsPerUnit > 0 ? Math.floor(pointsBalance / config.redeemPointsPerUnit) : 0;
    const redeemableValue = redeemableBlocks * config.redeemValuePerUnit;
    const canRedeem = config.enabled && redeemableBlocks >= 1 && pointsBalance >= config.minRedeemPoints;

    let statusBadge: CustomerMetrics['statusBadge'];
    let statusLabel: string;
    if (isInactive) { statusBadge = 'inactive'; statusLabel = 'Inactive'; }
    else if (orderCount === 0 || isNew) { statusBadge = 'new'; statusLabel = 'New'; }
    else { statusBadge = tier.id; statusLabel = tier.name; }

    return {
        customer, totalSpend, orderCount, tier, statusBadge, statusLabel,
        avgOrder: orderCount ? totalSpend / orderCount : 0,
        lastPurchase, firstPurchase, daysSinceLastPurchase,
        isInactive, isChurnRisk, isNew, isReturning, monthlyFrequency,
        nextTier, spendToNextTier, tierProgress,
        pointsEarned, pointsRedeemed, pointsBalance, pointsExpired: !!expired,
        redeemableBlocks, redeemableValue, canRedeem,
    };
};

/* ---------------- Store-wide overview ---------------- */

export interface CrmOverview {
    config: LoyaltyConfig;
    metrics: CustomerMetrics[];
    byId: Map<string, CustomerMetrics>;
    totalCustomers: number;
    loyaltyMembers: number;
    retentionRate: number;
    churnCount: number;
    newThisMonth: number;
    avgLifetimeValue: number;
    maxSpend: number;
    vipAvgSpend: number;
    topCustomers: CustomerMetrics[];
    topByPoints: CustomerMetrics[];
    recentSales: { sale: Sale; metrics?: CustomerMetrics }[];
    segments: { vip: number; regular: number; atRisk: number; vipPct: number; regularPct: number; atRiskPct: number };
    growth: { label: string; created: number; returning: number }[];
    // Loyalty roll-ups
    pointsOutstanding: number;
    pointsIssuedTotal: number;
    redemptionsThisMonth: { count: number; points: number; value: number };
}

export const buildOverview = (
    customers: Customer[],
    sales: Sale[],
    config: LoyaltyConfig,
    ledger: RedemptionEntry[],
    now = Date.now(),
): CrmOverview => {
    // Points redeemed per customer (from the redemption ledger).
    const redeemedByCustomer = new Map<string, number>();
    for (const r of ledger) redeemedByCustomer.set(r.customerId, (redeemedByCustomer.get(r.customerId) || 0) + num(r.points));

    const metrics = customers.map(c => customerMetrics(c, sales, config, redeemedByCustomer.get(c.id) || 0, now));
    const byId = new Map(metrics.map(m => [m.customer.id, m]));

    const withOrders = metrics.filter(m => m.orderCount > 0);
    const loyaltyMembers = withOrders.filter(m => !m.isInactive).length;
    const returning = withOrders.filter(m => m.isReturning).length;
    const retentionRate = withOrders.length ? (returning / withOrders.length) * 100 : 0;
    const churnCount = metrics.filter(m => m.isChurnRisk).length;
    const newThisMonth = metrics.filter(m => m.isNew).length;
    const totalSpendAll = withOrders.reduce((s, m) => s + m.totalSpend, 0);
    const avgLifetimeValue = withOrders.length ? totalSpendAll / withOrders.length : 0;
    const maxSpend = metrics.reduce((mx, m) => Math.max(mx, m.totalSpend), 0);
    const vipMembers = metrics.filter(m => (m.tier.id === 'gold' || m.tier.id === 'platinum') && m.orderCount > 0);
    const vipAvgSpend = vipMembers.length ? vipMembers.reduce((s, m) => s + m.totalSpend, 0) / vipMembers.length : 0;

    const pointsOutstanding = metrics.reduce((s, m) => s + m.pointsBalance, 0);
    const pointsIssuedTotal = metrics.reduce((s, m) => s + m.pointsEarned + m.pointsRedeemed, 0);

    // Redemptions in the current calendar month.
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const redemptionsThisMonth = ledger.reduce(
        (acc, r) => {
            const d = parseApiDate(r.ts);
            if (d && d.getTime() >= monthStart.getTime()) { acc.count += 1; acc.points += num(r.points); acc.value += num(r.value); }
            return acc;
        },
        { count: 0, points: 0, value: 0 },
    );

    const topCustomers = [...metrics].sort((a, b) => b.totalSpend - a.totalSpend).filter(m => m.totalSpend > 0).slice(0, 5);
    const topByPoints = [...metrics].sort((a, b) => b.pointsBalance - a.pointsBalance).filter(m => m.pointsBalance > 0).slice(0, 5);

    const recentSales = [...sales]
        .filter(s => !!s.timestamp)
        .sort((a, b) => (parseApiDate(b.timestamp)?.getTime() ?? 0) - (parseApiDate(a.timestamp)?.getTime() ?? 0))
        .slice(0, 8)
        .map(sale => ({ sale, metrics: sale.customerId ? byId.get(sale.customerId) : undefined }));

    const vip = metrics.filter(m => (m.tier.id === 'gold' || m.tier.id === 'platinum') && m.orderCount > 0 && !m.isInactive).length;
    const atRisk = metrics.filter(m => m.isInactive).length;
    const regular = Math.max(0, withOrders.length - vip - atRisk);
    const denom = Math.max(1, withOrders.length);
    const segments = {
        vip, regular, atRisk,
        vipPct: Math.round((vip / denom) * 100),
        regularPct: Math.round((regular / denom) * 100),
        atRiskPct: Math.round((atRisk / denom) * 100),
    };

    const growth: CrmOverview['growth'] = [];
    const WEEK = 7 * DAY;
    for (let i = 4; i >= 0; i--) {
        const end = now - i * WEEK;
        const start = end - WEEK;
        const created = customers.filter(c => {
            const d = parseApiDate(c.createdAt);
            return d && d.getTime() >= start && d.getTime() < end;
        }).length;
        const returningOrders = sales.filter(s => {
            const d = parseApiDate(s.timestamp);
            return d && d.getTime() >= start && d.getTime() < end && !!s.customerId;
        }).length;
        growth.push({ label: i === 0 ? 'Now' : `W${5 - i}`, created, returning: returningOrders });
    }

    return {
        config, metrics, byId, totalCustomers: customers.length, loyaltyMembers, retentionRate,
        churnCount, newThisMonth, avgLifetimeValue, maxSpend, vipAvgSpend, topCustomers, topByPoints,
        recentSales, segments, growth,
        pointsOutstanding, pointsIssuedTotal, redemptionsThisMonth,
    };
};

/* ---------------- Formatting helpers ---------------- */

export const formatMoney = (amount: unknown, settings?: StoreSettings | null): string => {
    const symbol = settings?.currency?.symbol ?? '$';
    const position = settings?.currency?.position ?? 'before';
    const value = num(amount);
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return position === 'after' ? `${formatted}${symbol}` : `${symbol}${formatted}`;
};

export const formatCompact = (n: number): string => {
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${Math.round(n)}`;
};

export const timeAgo = (input?: string | Date | null): string => {
    const d = parseApiDate(input ?? null);
    if (!d) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now'; // also covers small clock skew / future stamps
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const monthsAgo = Math.floor(days / 30);
    if (monthsAgo < 12) return `${monthsAgo} month${monthsAgo === 1 ? '' : 's'} ago`;
    return `${Math.floor(monthsAgo / 12)} year${monthsAgo < 24 ? '' : 's'} ago`;
};

export const formatMonthYear = (input?: string | Date | null): string => {
    const d = parseApiDate(input ?? null);
    return d ? d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—';
};

export const formatDate = (input?: string | Date | null): string => {
    const d = parseApiDate(input ?? null);
    return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
};

export const initials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const avatarColor = (seed: string): string => {
    const palette = ['#002b6b', '#1a428a', '#9b4500', '#1f2f4e', '#364566', '#763300'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length];
};
