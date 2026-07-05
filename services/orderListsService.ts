import { api } from './api';

/** A single line on a quick order list. */
export interface QuickItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    checked: boolean;
}

/** A lightweight restock checklist ("Quick List") — no supplier/catalogue needed. */
export interface QuickList {
    id: string;
    title: string;
    items: QuickItem[];
    createdAt: number;
    importedAt?: number;
    /** Set once the list has been exported to a purchase order — guards against
     *  accidentally creating duplicate POs from the same list. */
    exportedAt?: number;
    exportedPoNumber?: string;
}

/** Fetch every order list for the current store. */
export const getOrderLists = () => api.get<QuickList[]>('/order-lists');

/**
 * Create or update a list. The backend upserts by id, so this is safe to call
 * repeatedly and safe to replay from the offline queue without duplicating.
 */
export const saveOrderList = (list: QuickList) => api.post<QuickList>('/order-lists', list);

/** Delete a list by id. */
export const deleteOrderList = (id: string) => api.delete(`/order-lists/${id}`);
