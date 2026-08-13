import { Product, Category, Sale, PurchaseOrder, StoreSettings } from '../../types';
import { num, parseApiDate } from '../crm/crmModel';

/** Epoch ms for a backend timestamp, UTC-safe (naive strings = server-local = UTC). */
const tsOf = (v?: string): number => parseApiDate(v ?? null)?.getTime() ?? 0;

/**
 * Inventory dashboard metrics — all derived from the live products / sales /
 * purchase-order data the host Dashboard already loads from the backend.
 * Money columns arrive as strings (Postgres DECIMAL) so everything goes through
 * num() to avoid silently zeroing values.
 */

export interface InvActivity {
    id: string;
    name: string;
    delta: number;          // signed unit change
    reason: string;         // Sale / Order Received / ...
    who: string;
    ts: string;             // ISO-ish
    kind: 'in' | 'out';
    image?: string;
}

export interface InvCategoryStat {
    id: string;
    name: string;
    value: number;
    pct: number;
    count: number;
}

export interface InventoryOverview {
    /** Stock at cost — what the books carry the inventory at. */
    totalValue: number;
    /** Stock at selling price — what the shelf is expected to bring in if it all sells. */
    retailValue: number;
    /** retailValue - totalValue: the margin still sitting on the shelf. */
    potentialProfit: number;
    /** Products with no cost price: they contribute 0 to totalValue. */
    missingCostCount: number;
    /** Recorded but not yet priced — held off the POS until a price is set. */
    unpricedCount: number;
    /** Recorded with nothing on the shelf yet — waiting to be stocked. */
    notStockedCount: number;
    totalSkus: number;
    totalUnits: number;
    lowStockCount: number;
    criticalCount: number;
    outOfStockCount: number;
    lowStockItems: Product[];
    criticalItems: Product[];
    categories: InvCategoryStat[];
    activity: InvActivity[];
    topMover?: { name: string; units: number };
}

/** Effective reorder threshold for a product. */
export const thresholdFor = (p: Product, settings?: StoreSettings | null): number => {
    const rp = num(p.reorderPoint);
    if (rp > 0) return rp;
    const ss = num(settings?.lowStockThreshold);
    return ss > 0 ? ss : 5;
};

/**
 * Unit value for stock on hand: cost price, and nothing else.
 *
 * This used to fall back to the retail price when a product had no cost, which
 * valued that stock at what it might sell for. Inventory is an asset carried at
 * cost, so that overstated the figure and — because the server values inventory
 * as `SUM(stock * cost_price)` for the balance sheet, the accounting summary and
 * the multi-store dashboard — it disagreed with every other total in the app.
 * A product with no cost now contributes 0, which is what the books say; the
 * accounting hub already reports how many products are missing a cost.
 */
const unitValue = (p: Product): number => num(p.costPrice);

export const buildInventoryOverview = (
    products: Product[],
    categories: Category[],
    sales: Sale[],
    purchaseOrders: PurchaseOrder[],
    settings?: StoreSettings | null,
): InventoryOverview => {
    const active = products.filter(p => p.status !== 'archived');

    let totalValue = 0;
    let retailValue = 0;
    let missingCostCount = 0;
    let unpricedCount = 0;
    let notStockedCount = 0;
    let totalUnits = 0;
    const lowStockItems: Product[] = [];
    const criticalItems: Product[] = [];
    let outOfStockCount = 0;

    for (const p of active) {
        const stock = num(p.stock);
        totalValue += stock * unitValue(p);
        retailValue += stock * num(p.price);
        if (unitValue(p) <= 0) missingCostCount++;
        if (!(num(p.price) > 0)) unpricedCount++;
        if (stock <= 0) notStockedCount++;
        totalUnits += stock;
        const thr = thresholdFor(p, settings);
        if (stock <= 0) outOfStockCount++;
        if (stock <= thr) {
            lowStockItems.push(p);
            if (stock <= Math.max(1, Math.ceil(thr / 2))) criticalItems.push(p);
        }
    }
    lowStockItems.sort((a, b) => num(a.stock) - num(b.stock));
    criticalItems.sort((a, b) => num(a.stock) - num(b.stock));

    // Category value breakdown (top 5 by value).
    const catName = new Map(categories.map(c => [c.id, c.name]));
    const catAgg = new Map<string, { value: number; count: number }>();
    for (const p of active) {
        const key = p.categoryId || '__none';
        const entry = catAgg.get(key) || { value: 0, count: 0 };
        entry.value += num(p.stock) * unitValue(p);
        entry.count += 1;
        catAgg.set(key, entry);
    }
    const categoriesOut: InvCategoryStat[] = Array.from(catAgg.entries())
        .map(([id, v]) => ({
            id,
            name: id === '__none' ? 'Uncategorized' : (catName.get(id) || 'Uncategorized'),
            value: v.value,
            count: v.count,
            pct: totalValue > 0 ? Math.round((v.value / totalValue) * 100) : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Recent stock movements: sales (out) + PO receptions (in).
    const imageByName = new Map<string, string | undefined>();
    for (const p of products) imageByName.set(p.name, p.imageUrls?.[0]);

    const activity: InvActivity[] = [];
    const recentSales = [...sales]
        .filter(s => !!s.timestamp)
        .sort((a, b) => tsOf(b.timestamp) - tsOf(a.timestamp))
        .slice(0, 25);
    for (const s of recentSales) {
        for (const item of s.cart || []) {
            const qty = num(item.quantity);
            if (qty <= 0) continue;
            activity.push({
                id: `${s.transactionId}-${item.productId}`,
                name: item.name,
                delta: -qty,
                reason: 'Sale',
                who: s.channel === 'online' ? 'Online order' : 'POS',
                ts: s.timestamp,
                kind: 'out',
                image: imageByName.get(item.name),
            });
        }
    }
    for (const po of purchaseOrders || []) {
        for (const rec of po.receptions || []) {
            for (const item of rec.items || []) {
                const qty = num(item.quantityReceived);
                if (qty <= 0) continue;
                activity.push({
                    id: `${po.id}-${item.productId}-${rec.date}`,
                    name: item.productName,
                    delta: qty,
                    reason: 'Order Received',
                    who: po.poNumber || 'Purchase order',
                    ts: rec.date,
                    kind: 'in',
                    image: imageByName.get(item.productName),
                });
            }
        }
    }
    activity.sort((a, b) => tsOf(b.ts) - tsOf(a.ts));

    // Top mover by units sold (recent sales).
    const moverTally = new Map<string, number>();
    for (const s of recentSales) {
        for (const item of s.cart || []) {
            moverTally.set(item.name, (moverTally.get(item.name) || 0) + num(item.quantity));
        }
    }
    let topMover: { name: string; units: number } | undefined;
    for (const [name, units] of moverTally) {
        if (!topMover || units > topMover.units) topMover = { name, units };
    }

    return {
        totalValue,
        retailValue,
        potentialProfit: retailValue - totalValue,
        missingCostCount,
        unpricedCount,
        notStockedCount,
        totalSkus: active.length,
        totalUnits,
        lowStockCount: lowStockItems.length,
        criticalCount: criticalItems.length,
        outOfStockCount,
        lowStockItems,
        criticalItems,
        categories: categoriesOut,
        activity: activity.slice(0, 6),
        topMover,
    };
};
