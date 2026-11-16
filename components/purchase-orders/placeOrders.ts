import { POItem, PurchaseOrder, StoreSettings, Supplier } from '../../types';
import { api } from '../../services/api';
import { num } from '../crm/crmModel';
import { computePoTotals, newPoIdentifiers } from './poModel';
import { waChatLink } from '../../utils/whatsapp';

export interface OrderToPlace {
    supplier: Pick<Supplier, 'id' | 'name'>;
    items: POItem[];
}

export interface PlacedOrder {
    po: PurchaseOrder;
    /** Saved on this device and waiting to sync — no server number yet. */
    queued: boolean;
}

/**
 * Create purchase orders already placed (status "ordered"), one per supplier.
 *
 * Posts directly rather than through the app-wide save handler because the
 * caller needs the saved order back: the server assigns the real PO number,
 * and that number goes into the message to the supplier. Orders are sent one
 * after another so a failure stops cleanly; whatever was placed before it is
 * returned with the error for the caller to report.
 */
export async function placeOrders(
    orders: OrderToPlace[],
    storeSettings: Pick<StoreSettings, 'taxRate'>,
): Promise<{ placed: PlacedOrder[]; error?: string }> {
    const placed: PlacedOrder[] = [];
    for (let i = 0; i < orders.length; i++) {
        const { supplier, items } = orders[i];
        const clean = items
            .map(it => ({ ...it, quantity: num(it.quantity), costPrice: num(it.costPrice), receivedQuantity: 0 }))
            .filter(it => it.quantity > 0);
        if (clean.length === 0) continue;

        const { subtotal, tax, total } = computePoTotals(clean, 0, storeSettings.taxRate);
        const ids = newPoIdentifiers();
        const now = new Date().toISOString();
        const po: PurchaseOrder = {
            ...ids,
            id: `${ids.id}_${i}`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            status: 'ordered',
            orderedAt: now,
            items: clean,
            subtotal,
            shippingCost: 0,
            tax,
            total,
        } as PurchaseOrder;

        try {
            const res = await api.post<PurchaseOrder>('/purchase-orders', po);
            const queued = !!(res as any)?.offline;
            placed.push({ po: queued || !(res as any)?.id ? po : { ...po, ...(res as PurchaseOrder) }, queued });
        } catch (err: any) {
            return { placed, error: err?.body?.message || err?.message || 'Could not place the order.' };
        }
    }
    return { placed };
}

const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(2));

/**
 * The order as a WhatsApp message to the supplier: who is ordering, the order
 * number, and each line as quantity × product. Prices are left out — the
 * supplier invoices at their own prices.
 */
export function orderMessage(po: PurchaseOrder, storeName?: string, units?: Record<string, 'unit' | 'kg'>): string {
    const lines = (po.items || []).map(it => {
        const q = num(it.quantity);
        const kg = units?.[it.productId] === 'kg';
        return `• ${fmtQty(q)}${kg ? ' kg' : ''} × ${it.productName}`;
    });
    return [
        `Hello ${po.supplierName || ''}`.trim() + ',',
        '',
        `${storeName ? `This is ${storeName}. ` : ''}Please supply the following (order ${po.poNumber}):`,
        ...lines,
        '',
        'Kindly confirm and let us know the delivery date. Thank you.',
    ].join('\n');
}

/** wa.me link to the supplier with the order typed out, or null without a usable phone. */
export const orderWhatsAppLink = (
    po: PurchaseOrder,
    supplier: Pick<Supplier, 'phone'> | undefined,
    storeName?: string,
    units?: Record<string, 'unit' | 'kg'>,
): string | null => waChatLink(supplier?.phone, orderMessage(po, storeName, units));
