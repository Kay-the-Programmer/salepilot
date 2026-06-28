import { Product, StoreSettings } from '../../types';

/**
 * Single source of truth for a product's stock health.
 *
 * Shared by every inventory list renderer — the desktop list/grid
 * (`ProductList`) and the mobile shell (`InventoryMobileShell`) — so the
 * "out / low / in stock" thresholds and labels never drift between them.
 */

export type StockKey = 'out' | 'low' | 'ok';

export interface StockStatus {
    key: StockKey;
    label: 'Out of stock' | 'Low stock' | 'In stock';
}

/** Coerce a possibly-string stock/number field to a finite number. */
export const asNumber = (val: unknown): number => {
    const n = typeof val === 'number' ? val : parseFloat(val as string);
    return Number.isFinite(n) ? n : 0;
};

/** Derive a product's stock status from its stock vs. its reorder point. */
export const stockStatus = (
    product: Product,
    storeSettings: StoreSettings | null | undefined,
): StockStatus => {
    const stock = asNumber(product.stock);
    const reorder = product.reorderPoint ?? storeSettings?.lowStockThreshold ?? 0;
    if (stock <= 0) return { key: 'out', label: 'Out of stock' };
    if (stock <= reorder) return { key: 'low', label: 'Low stock' };
    return { key: 'ok', label: 'In stock' };
};
