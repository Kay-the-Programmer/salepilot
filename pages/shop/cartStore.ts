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
}

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

/** Clamp a desired quantity to [1, stock] (stock ≤ 0 means unknown → allow). */
const clampQty = (qty: number, stock: number) => {
    const upper = stock > 0 ? stock : 9999;
    return Math.max(1, Math.min(upper, Math.round(qty) || 1));
};

export const addToCart = (
    storeId: string,
    item: Omit<CartItem, 'quantity'>,
    quantity = 1
): CartItem[] => {
    const items = getCart(storeId);
    const existing = items.find(i => i.id === item.id);
    if (existing) {
        existing.quantity = clampQty(existing.quantity + quantity, item.stock ?? existing.stock);
        existing.price = item.price; // refresh price/stock snapshots
        existing.stock = item.stock ?? existing.stock;
    } else {
        items.push({ ...item, quantity: clampQty(quantity, item.stock) });
    }
    persist(storeId, items);
    return items;
};

export const updateQuantity = (storeId: string, id: string, quantity: number): CartItem[] => {
    let items = getCart(storeId);
    if (quantity <= 0) {
        items = items.filter(i => i.id !== id);
    } else {
        const item = items.find(i => i.id === id);
        if (item) item.quantity = clampQty(quantity, item.stock);
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
