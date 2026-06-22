import { PurchaseOrder } from '@/types';
import { StatusPill, purchaseOrderMeta } from '../ui/StatusPill';

interface StatusBadgeProps {
    status: PurchaseOrder['status'];
}

const PO_ICON: Record<string, string> = {
    draft: '📝',
    ordered: '📦',
    partially_received: '📊',
    received: '✅',
    canceled: '❌',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const meta = purchaseOrderMeta(status);
    return (
        <StatusPill tone={meta.tone} icon={<span>{PO_ICON[status] ?? '📝'}</span>} className="px-3 py-1.5">
            {meta.label}
        </StatusPill>
    );
}
