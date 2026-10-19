import { Product, PurchaseOrder, POItem } from '../../types';
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

/** At/below reorder point and eligible for a draft. */
export const isLow = (p: Product): boolean =>
    p.status !== 'archived' && typeof p.reorderPoint !== 'undefined'
    && num(p.reorderPoint) > 0 && num(p.stock) <= num(p.reorderPoint);

/**
 * How many items a reorder would cover — the badge on the Procurement Hub.
 *
 * Only the count, deliberately. The drafts themselves (quantities and money)
 * are built by the server at GET /purchase-orders/reorder-suggestions, which
 * is where the Auto Reorder entitlement is enforced; duplicating that
 * arithmetic here just gave it a second place to drift from.
 */
export const countReorderItems = (products: Product[]): number =>
    products.filter(p => p.supplierId && isLow(p)).length;

/** Products below reorder point for a supplier, each with a suggested quantity.
 *  `exclude` skips products already on the order. */
export const suggestReorder = (
    products: Product[],
    supplierId: string | null | undefined,
    exclude: Set<string> = new Set(),
): (Product & { suggestedQty: number })[] => {
    // With a supplier chosen, suggest what that supplier normally provides;
    // without one, suggest everything below its reorder point, so an order
    // raised before the supplier is known still gets the same head start.
    return products
        .filter(p => (supplierId ? p.supplierId === supplierId : true)
            && p.status === 'active' && !exclude.has(p.id)
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

