import { Product, PurchaseOrder, POItem, Supplier, StoreSettings } from '../../types';
import { num } from '../crm/crmModel';
import { purchaseOrderMeta } from '../ui/StatusPill';

/**
 * Single source of truth for purchase-order domain logic — status, money maths,
 * reorder suggestions and the create/place payload. The Procurement Hub
 * (ProcureOrder*) and the standalone /po app both consume this, so there is
 * exactly one implementation of each rule.
 */

export { purchaseOrderMeta };

export const OPEN_STATUSES: PurchaseOrder['status'][] = ['draft', 'ordered', 'partially_received'];
export const AWAITING_STATUSES: PurchaseOrder['status'][] = ['ordered', 'partially_received'];

/** Units still to be received on a PO. */
export const outstandingItems = (po: PurchaseOrder): number =>
    (po.items || []).reduce((s, it) => s + Math.max(0, num(it.quantity) - num(it.receivedQuantity)), 0);

export interface PoTotals { subtotal: number; tax: number; total: number; units: number; }

/** Money totals for a set of PO items (tax as a whole-number percent). */
export const computePoTotals = (items: POItem[], shippingCost = 0, taxRate = 0): PoTotals => {
    const subtotal = items.reduce((s, it) => s + num(it.quantity) * num(it.costPrice), 0);
    const tax = subtotal * (num(taxRate) / 100);
    const units = items.reduce((s, it) => s + num(it.quantity), 0);
    return { subtotal, tax, total: subtotal + num(shippingCost) + tax, units };
};

/** Suggested top-up quantity to bring a product back above its reorder point. */
export const reorderQty = (p: Product): number =>
    Math.max(1, (num(p.reorderPoint) + num(p.safetyStock)) - num(p.stock));

/** At/below reorder point and eligible for a draft (used for cross-supplier drafts). */
const isLow = (p: Product): boolean =>
    p.status !== 'archived' && typeof p.reorderPoint !== 'undefined'
    && num(p.reorderPoint) > 0 && num(p.stock) <= num(p.reorderPoint);

/** Products below reorder point for a supplier, each with a suggested quantity.
 *  `exclude` skips products already on the order. */
export const suggestReorder = (
    products: Product[],
    supplierId: string,
    exclude: Set<string> = new Set(),
): (Product & { suggestedQty: number })[] => {
    if (!supplierId) return [];
    return products
        .filter(p => p.supplierId === supplierId && p.status === 'active' && !exclude.has(p.id)
            && typeof p.reorderPoint !== 'undefined' && num(p.stock) < num(p.reorderPoint))
        .map(p => ({ ...p, suggestedQty: reorderQty(p) }));
};

export const productToPoItem = (p: Product, quantity = 1): POItem => ({
    productId: p.id, productName: p.name, sku: p.sku, quantity, costPrice: num(p.costPrice), receivedQuantity: 0,
});

/** Stable id / number / created timestamp for a brand-new PO. */
export const newPoIdentifiers = () => ({
    id: `po_${Date.now()}`,
    poNumber: `PO-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
});

/** Apply the "place order" transition (draft → ordered + orderedAt). */
export function applyPlaceOrder<T extends { status: PurchaseOrder['status']; orderedAt?: string }>(po: T, placeOrder: boolean): T {
    if (placeOrder && po.status === 'draft') {
        return { ...po, status: 'ordered', orderedAt: po.orderedAt || new Date().toISOString() };
    }
    return po;
}

/** An auto-generated reorder draft for a single supplier. */
export interface ReorderDraft {
    supplierId: string;
    supplierName: string;
    items: POItem[];
    units: number;
    subtotal: number;
    tax: number;
    total: number;
}

/**
 * Build draft purchase orders (one per supplier) for every product at/below its
 * reorder point. Suggested quantity tops stock back up to reorderPoint+safetyStock.
 */
export const generateReorderDrafts = (
    products: Product[],
    suppliers: Supplier[],
    storeSettings?: StoreSettings | null,
): ReorderDraft[] => {
    const supById = new Map(suppliers.map(s => [s.id, s]));
    const bySupplier = new Map<string, POItem[]>();
    for (const p of products) {
        if (!p.supplierId || !isLow(p)) continue;
        const arr = bySupplier.get(p.supplierId) || [];
        arr.push(productToPoItem(p, reorderQty(p)));
        bySupplier.set(p.supplierId, arr);
    }
    const taxRate = num(storeSettings?.taxRate);
    const drafts: ReorderDraft[] = [];
    for (const [supplierId, items] of bySupplier) {
        const t = computePoTotals(items, 0, taxRate);
        drafts.push({
            supplierId, supplierName: supById.get(supplierId)?.name || 'Supplier',
            items, units: t.units, subtotal: t.subtotal, tax: t.tax, total: t.total,
        });
    }
    return drafts.sort((a, b) => b.total - a.total);
};
