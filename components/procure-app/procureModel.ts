import { Supplier, Product, PurchaseOrder, POItem, SupplierInvoice, StoreSettings } from '../../types';
import { num, parseApiDate } from '../crm/crmModel';

/**
 * Procurement metrics — derived from the live suppliers / purchase orders /
 * supplier invoices the host Dashboard already loads. Money columns are Postgres
 * DECIMAL (returned as strings) so everything goes through num().
 */

export const OPEN_STATUSES: PurchaseOrder['status'][] = ['draft', 'ordered', 'partially_received'];
const AWAITING_STATUSES: PurchaseOrder['status'][] = ['ordered', 'partially_received'];

export interface PoStatusMeta { label: string; tone: 'p' | 's' | 't' | 'e' | 'n'; }

export const poStatus = (status: PurchaseOrder['status']): PoStatusMeta => {
    switch (status) {
        case 'received': return { label: 'Received', tone: 'p' };
        case 'partially_received': return { label: 'Partial', tone: 's' };
        case 'ordered': return { label: 'Ordered', tone: 't' };
        case 'canceled': return { label: 'Canceled', tone: 'e' };
        default: return { label: 'Draft', tone: 'n' };
    }
};

export interface SupplierStat {
    supplier?: Supplier;
    supplierId: string;
    name: string;
    spend: number;
    orderCount: number;
}

export interface ProcureOverview {
    totalSuppliers: number;
    openOrders: number;
    openOrdersValue: number;
    awaitingReceiptOrders: number;
    awaitingReceiptItems: number;
    payable: number;
    overdueCount: number;
    overdueAmount: number;
    recentOrders: PurchaseOrder[];
    topSuppliers: SupplierStat[];
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
 * Build draft purchase orders (one per supplier) for every product that has a
 * supplier and has fallen at/below its reorder point. Suggested quantity tops
 * stock back up to reorderPoint + safetyStock. The user reviews & places these.
 */
export const generateReorderDrafts = (
    products: Product[],
    suppliers: Supplier[],
    storeSettings?: StoreSettings | null,
): ReorderDraft[] => {
    const supById = new Map(suppliers.map(s => [s.id, s]));
    const bySupplier = new Map<string, POItem[]>();

    for (const p of products) {
        if (p.status === 'archived' || !p.supplierId) continue;
        if (typeof p.reorderPoint === 'undefined') continue;
        const reorder = num(p.reorderPoint);
        if (reorder <= 0) continue;
        const stock = num(p.stock);
        if (stock > reorder) continue; // not low (≤ reorder point triggers)
        const target = reorder + num(p.safetyStock);
        const qty = Math.max(1, target - stock);
        const item: POItem = {
            productId: p.id, productName: p.name, sku: p.sku,
            quantity: qty, costPrice: num(p.costPrice), receivedQuantity: 0,
        };
        const arr = bySupplier.get(p.supplierId) || [];
        arr.push(item);
        bySupplier.set(p.supplierId, arr);
    }

    const taxRate = num(storeSettings?.taxRate) / 100;
    const drafts: ReorderDraft[] = [];
    for (const [supplierId, items] of bySupplier) {
        const subtotal = items.reduce((s, it) => s + num(it.quantity) * num(it.costPrice), 0);
        const tax = subtotal * taxRate;
        const units = items.reduce((s, it) => s + num(it.quantity), 0);
        drafts.push({ supplierId, supplierName: supById.get(supplierId)?.name || 'Supplier', items, units, subtotal, tax, total: subtotal + tax });
    }
    return drafts.sort((a, b) => b.total - a.total);
};

const poItemsOutstanding = (po: PurchaseOrder): number =>
    (po.items || []).reduce((sum, it) => sum + Math.max(0, num(it.quantity) - num(it.receivedQuantity)), 0);

export const buildProcureOverview = (
    suppliers: Supplier[],
    purchaseOrders: PurchaseOrder[],
    supplierInvoices: SupplierInvoice[],
    now = Date.now(),
): ProcureOverview => {
    const open = purchaseOrders.filter(po => OPEN_STATUSES.includes(po.status));
    const awaiting = purchaseOrders.filter(po => AWAITING_STATUSES.includes(po.status));

    const openOrdersValue = open.reduce((s, po) => s + num(po.total), 0);
    const awaitingReceiptItems = awaiting.reduce((s, po) => s + poItemsOutstanding(po), 0);

    // Accounts payable from supplier invoices.
    let payable = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    for (const inv of supplierInvoices || []) {
        const balance = Math.max(0, num(inv.amount) - num(inv.amountPaid));
        if (inv.status === 'paid' || balance <= 0) continue;
        payable += balance;
        const due = parseApiDate(inv.dueDate);
        const isOverdue = inv.status === 'overdue' || (due && due.getTime() < now);
        if (isOverdue) { overdueCount += 1; overdueAmount += balance; }
    }

    const recentOrders = [...purchaseOrders]
        .sort((a, b) => (parseApiDate(b.createdAt)?.getTime() ?? 0) - (parseApiDate(a.createdAt)?.getTime() ?? 0))
        .slice(0, 6);

    // Top suppliers by committed spend (sum of PO totals).
    const supplierById = new Map(suppliers.map(s => [s.id, s]));
    const agg = new Map<string, SupplierStat>();
    for (const po of purchaseOrders) {
        if (!po.supplierId) continue;
        const entry = agg.get(po.supplierId) || {
            supplierId: po.supplierId,
            supplier: supplierById.get(po.supplierId),
            name: supplierById.get(po.supplierId)?.name || po.supplierName || 'Supplier',
            spend: 0,
            orderCount: 0,
        };
        entry.spend += num(po.total);
        entry.orderCount += 1;
        agg.set(po.supplierId, entry);
    }
    const topSuppliers = Array.from(agg.values()).filter(s => s.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, 5);

    return {
        totalSuppliers: suppliers.length,
        openOrders: open.length,
        openOrdersValue,
        awaitingReceiptOrders: awaiting.length,
        awaitingReceiptItems,
        payable,
        overdueCount,
        overdueAmount,
        recentOrders,
        topSuppliers,
    };
};
