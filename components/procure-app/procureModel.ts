import { Supplier, PurchaseOrder, SupplierInvoice } from '../../types';
import { num, parseApiDate } from '../crm/crmModel';
import {
    OPEN_STATUSES, AWAITING_STATUSES, outstandingItems, generateReorderDrafts, ReorderDraft,
} from '../purchase-orders/poModel';

/**
 * Procurement metrics — derived from the live suppliers / purchase orders /
 * supplier invoices the host Dashboard already loads. Money columns are Postgres
 * DECIMAL (returned as strings) so everything goes through num().
 *
 * PO domain logic (status, totals, reorder drafts) lives in the single source of
 * truth `components/purchase-orders/poModel`; re-exported here for existing
 * procure-app imports.
 */

export { OPEN_STATUSES, generateReorderDrafts };
export type { ReorderDraft };

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

export const buildProcureOverview = (
    suppliers: Supplier[],
    purchaseOrders: PurchaseOrder[],
    supplierInvoices: SupplierInvoice[],
    now = Date.now(),
): ProcureOverview => {
    const open = purchaseOrders.filter(po => OPEN_STATUSES.includes(po.status));
    const awaiting = purchaseOrders.filter(po => AWAITING_STATUSES.includes(po.status));

    const openOrdersValue = open.reduce((s, po) => s + num(po.total), 0);
    const awaitingReceiptItems = awaiting.reduce((s, po) => s + outstandingItems(po), 0);

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
