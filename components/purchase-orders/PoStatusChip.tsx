import { PurchaseOrder } from '@/types';
import { StatusPill, purchaseOrderMeta } from '../ui/StatusPill';

/**
 * The single purchase-order status chip. Semantic colours per DESIGN.md (success
 * / amber / primary / danger / neutral at ~15% tint with solid text), used
 * everywhere a PO status is shown so there is one look and one status→style map.
 */
export default function PoStatusChip({ status, className = '' }: { status: PurchaseOrder['status']; className?: string }) {
    const m = purchaseOrderMeta(status);
    return <StatusPill tone={m.tone} className={className}>{m.label}</StatusPill>;
}
