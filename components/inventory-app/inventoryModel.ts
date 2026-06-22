import { Product, Category, Sale, PurchaseOrder, StoreSettings } from '../../types';
import { num } from '../crm/crmModel';

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
    totalValue: number;
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

/** Unit value: prefer cost price, fall back to retail price. */
const unitValue = (p: Product): number => {
    const cost = num(p.costPrice);
    return cost > 0 ? cost : num(p.price);
};

export const buildInventoryOverview = (
    products: Product[],
    categories: Category[],
    sales: Sale[],
    purchaseOrders: PurchaseOrder[],
    settings?: StoreSettings | null,
): InventoryOverview => {
    const active = products.filter(p => p.status !== 'archived');

    let totalValue = 0;
    let totalUnits = 0;
    const lowStockItems: Product[] = [];
    const criticalItems: Product[] = [];
    let outOfStockCount = 0;

    for (const p of active) {
        const stock = num(p.stock);
        totalValue += stock * unitValue(p);
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
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
    activity.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

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
