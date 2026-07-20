/**
 * pages/shop/cartStore.ts
 *
 * Single source of truth for the public storefront cart.
 * Persisted per-store in localStorage (`cart_<storeId>`) so a shopper's cart
 * survives reloads; every mutation dispatches `cart-updated` so the header
 * badge, drawer and pages stay in sync (and legacy listeners keep working).
 */

import { useCallback, useEffect, useState } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image?: string;
    quantity: number;
    stock: number;
    unitOfMeasure?: string;
    /** Wholesale minimum order quantity (absent/≤1 = no minimum). */
    moq?: number;
    /** Base unit price before quantity breaks (defaults to price). */
    basePrice?: number;
    /** Wholesale quantity-break tiers; price is recomputed as qty changes. */
    tiers?: PriceTier[];
}

export interface PriceTier { minQty: number; price: number }

/** Price a buyer actually pays: wholesale price on wholesale storefronts when set. */
export const effectiveUnitPrice = (
    p: { price: number; wholesalePrice?: number | null },
    wholesale: boolean | undefined
): number => (wholesale && p.wholesalePrice != null ? p.wholesalePrice : p.price);

/** Apply quantity-break tiers: the deepest tier the qty reaches wins. */
export const tierUnitPrice = (base: number, tiers: PriceTier[] | undefined | null, qty: number): number => {
    let price = base;
    for (const t of [...(tiers || [])].sort((a, b) => a.minQty - b.minQty)) {
        if (t.minQty >= 2 && t.price > 0 && qty >= t.minQty) price = t.price;
    }
    return price;
};

/** Refresh a cart line's unit price from its tiers for its current quantity. */
const repriceLine = (item: CartItem) => {
    if (item.tiers && item.tiers.length > 0) {
        item.price = tierUnitPrice(item.basePrice ?? item.price, item.tiers, item.quantity);
    }
};

const cartKey = (storeId: string) => `cart_${storeId}`;

export const getCart = (storeId: string): CartItem[] => {
    try {
        const raw = localStorage.getItem(cartKey(storeId));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const persist = (storeId: string, items: CartItem[]) => {
    localStorage.setItem(cartKey(storeId), JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
};

export const cartCount = (items: CartItem[]): number =>
    items.reduce((acc, item) => acc + (item.quantity || 0), 0);

export const cartSubtotal = (items: CartItem[]): number =>
    items.reduce((acc, item) => acc + item.price * item.quantity, 0);

/** Clamp a desired quantity to [min(=MOQ or 1), stock] (stock ≤ 0 means unknown → allow). */
const clampQty = (qty: number, stock: number, moq?: number) => {
    const lower = moq && moq > 1 ? moq : 1;
    const upper = stock > 0 ? stock : 9999;
    return Math.max(lower, Math.min(upper, Math.round(qty) || lower));
};

export const addToCart = (
    storeId: string,
    item: Omit<CartItem, 'quantity'>,
    quantity = 1
): CartItem[] => {
    const items = getCart(storeId);
    const existing = items.find(i => i.id === item.id);
    if (existing) {
        existing.quantity = clampQty(existing.quantity + quantity, item.stock ?? existing.stock, item.moq ?? existing.moq);
        existing.price = item.price; // refresh price/stock snapshots
        existing.stock = item.stock ?? existing.stock;
        existing.moq = item.moq ?? existing.moq;
        existing.basePrice = item.basePrice ?? existing.basePrice;
        existing.tiers = item.tiers ?? existing.tiers;
        repriceLine(existing);
    } else {
        // First add jumps straight to the MOQ so wholesale lines are valid.
        const line = { ...item, quantity: clampQty(quantity, item.stock, item.moq) };
        repriceLine(line);
        items.push(line);
    }
    persist(storeId, items);
    return items;
};

export const updateQuantity = (storeId: string, id: string, quantity: number): CartItem[] => {
    let items = getCart(storeId);
    const item = items.find(i => i.id === id);
    const min = item?.moq && item.moq > 1 ? item.moq : 1;
    // Stepping below the minimum removes the line (mirrors the qty-0 case).
    if (quantity < min) {
        items = items.filter(i => i.id !== id);
    } else if (item) {
        item.quantity = clampQty(quantity, item.stock, item.moq);
        repriceLine(item);
    }
    persist(storeId, items);
    return items;
};

export const removeFromCart = (storeId: string, id: string): CartItem[] => {
    const items = getCart(storeId).filter(i => i.id !== id);
    persist(storeId, items);
    return items;
};

export const clearCart = (storeId: string): void => {
    localStorage.removeItem(cartKey(storeId));
    window.dispatchEvent(new Event('cart-updated'));
};

/** Subscribe to cart changes (same-tab mutations + cross-tab storage events). */
export const subscribeToCart = (fn: () => void): (() => void) => {
    window.addEventListener('cart-updated', fn);
    window.addEventListener('storage', fn);
    return () => {
        window.removeEventListener('cart-updated', fn);
        window.removeEventListener('storage', fn);
    };
};

/**
 * React binding: live cart state for a store with a single subscription.
 * `qtyOf(productId)` powers "in cart" indicators and card steppers.
 */
export const useShopCart = (storeId: string | undefined) => {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        if (!storeId) return;
        const refresh = () => setItems(getCart(storeId));
        refresh();
        return subscribeToCart(refresh);
    }, [storeId]);

    const qtyOf = useCallback(
        (productId: string) => items.find(i => i.id === productId)?.quantity || 0,
        [items]
    );

    return { items, qtyOf, count: cartCount(items), subtotal: cartSubtotal(items) };
};
