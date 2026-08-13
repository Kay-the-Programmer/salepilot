import { Product, StoreSettings } from '../../types';

/**
 * Single source of truth for a product's stock health.
 *
 * Shared by every inventory list renderer — the desktop list/grid
 * (`ProductList`) and the mobile shell (`InventoryMobileShell`) — so the
 * "out / low / in stock" thresholds and labels never drift between them.
 */

export type StockKey = 'unpriced' | 'out' | 'low' | 'ok';

export interface StockStatus {
    key: StockKey;
    label: 'Needs price' | 'Out of stock' | 'Low stock' | 'In stock';
}

/** Coerce a possibly-string stock/number field to a finite number. */
export const asNumber = (val: unknown): number => {
    const n = typeof val === 'number' ? val : parseFloat(val as string);
    return Number.isFinite(n) ? n : 0;
};

/** A product recorded for later: no selling price, so it can't reach the till. */
export const isUnpriced = (product: Product): boolean => !(asNumber(product.price) > 0);

/** Derive a product's stock status from its stock vs. its reorder point. */
export const stockStatus = (
    product: Product,
    storeSettings: StoreSettings | null | undefined,
): StockStatus => {
    const stock = asNumber(product.stock);
    const reorder = product.reorderPoint ?? storeSettings?.lowStockThreshold ?? 0;
    // Ranked above the stock states on purpose: an unpriced product is kept off
    // the POS whatever its stock level, so that is the fact worth surfacing.
    if (isUnpriced(product)) return { key: 'unpriced', label: 'Needs price' };
    if (stock <= 0) return { key: 'out', label: 'Out of stock' };
    if (stock <= reorder) return { key: 'low', label: 'Low stock' };
    return { key: 'ok', label: 'In stock' };
};
