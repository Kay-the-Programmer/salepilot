import { Product } from '../types';

const KEY = 'salepilot.pendingNewProduct';

/**
 * Cross-app handoff for the single Add Product form (/inv/items → ProductEditForm).
 *
 * There is exactly one product-creation form in the app. When another surface
 * (e.g. the POS, after scanning a barcode for an item that isn't catalogued yet)
 * needs to add a product, it stashes any prefilled values here and navigates to
 * /inv/items, where InventoryPage picks them up and opens the form pre-populated.
 */
export const setPendingNewProduct = (values: Partial<Omit<Product, 'id'>>): void => {
    try { sessionStorage.setItem(KEY, JSON.stringify(values)); } catch { /* storage unavailable — ignore */ }
};

/** Read and clear any stashed new-product prefill. Returns undefined if none. */
export const takePendingNewProduct = (): Partial<Omit<Product, 'id'>> | undefined => {
    try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return undefined;
        sessionStorage.removeItem(KEY);
        return JSON.parse(raw) as Partial<Omit<Product, 'id'>>;
    } catch {
        return undefined;
    }
};
