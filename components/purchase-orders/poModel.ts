import { Product, PurchaseOrder, POItem, StoreSettings } from '../../types';
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

/**
 * The reorder rule — mirrored exactly from the server (s-back
 * services/reorder.ts), so the low-stock alert, the Procurement badge and the
 * suggested orders all agree on what is low and how much to buy.
 */
export const thresholdFor = (p: Pick<Product, 'reorderPoint'>, settings?: Pick<StoreSettings, 'lowStockThreshold'> | null): number => {
    const rp = num(p.reorderPoint);
    if (rp > 0) return rp;
    const st = num(settings?.lowStockThreshold);
    return st > 0 ? st : 5;
};

/** At or below its threshold, and still on sale. */
export const isLow = (p: Product, settings?: Pick<StoreSettings, 'lowStockThreshold'> | null): boolean =>
    p.status !== 'archived' && num(p.stock) <= thresholdFor(p, settings);

/**
 * How much to buy: up to twice the threshold (or threshold + safety stock if
 * larger), whole cartons for unit goods with a carton size, two decimals for
 * weighed goods, never less than one.
 */
export const reorderQty = (p: Product, settings?: Pick<StoreSettings, 'lowStockThreshold'> | null): number => {
    const threshold = thresholdFor(p, settings);
    const target = Math.max(threshold * 2, threshold + num(p.safetyStock));
    const need = target - num(p.stock);
    if (p.unitOfMeasure === 'kg') return Math.max(0.01, Math.ceil(need * 100) / 100);
    let qty = Math.max(1, Math.ceil(need));
    const carton = Math.floor(num(p.unitsPerCarton));
    if (carton > 1) qty = Math.ceil(qty / carton) * carton;
    return qty;
};

/** How many products are low — the badge on the Procurement Hub and Buy stock. */
export const countReorderItems = (products: Product[], settings?: Pick<StoreSettings, 'lowStockThreshold'> | null): number =>
    products.filter(p => p.status === 'active' && isLow(p, settings)).length;

/** Low products (for a supplier, when one is chosen), each with a suggested quantity.
 *  `exclude` skips products already on the order. */
export const suggestReorder = (
    products: Product[],
    supplierId: string | null | undefined,
    exclude: Set<string> = new Set(),
    settings?: Pick<StoreSettings, 'lowStockThreshold'> | null,
): (Product & { suggestedQty: number })[] =>
    products
        .filter(p => (supplierId ? p.supplierId === supplierId : true)
            && p.status === 'active' && !exclude.has(p.id) && isLow(p, settings))
        .map(p => ({ ...p, suggestedQty: reorderQty(p, settings) }));

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

/** A suggested line, with the context the Buy stock screen shows. */
export interface ReorderDraftItem extends POItem {
    stock?: number;
    threshold?: number;
    unitOfMeasure?: 'unit' | 'kg';
    unitsPerCarton?: number | null;
}

/** An auto-generated reorder draft for a single supplier. */
export interface ReorderDraft {
    /** null = these products have no supplier yet; the buyer picks one. */
    supplierId: string | null;
    supplierName: string | null;
    items: ReorderDraftItem[];
    units: number;
    subtotal: number;
    tax: number;
    total: number;
}

