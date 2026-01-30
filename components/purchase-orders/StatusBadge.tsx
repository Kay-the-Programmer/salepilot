
import { PurchaseOrder } from '@/types';

interface StatusBadgeProps {
    status: PurchaseOrder['status'];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig = {
        draft: { color: 'bg-gray-100 text-gray-800', icon: '📝' },
        ordered: { color: 'bg-blue-100 text-blue-800', icon: '📦' },
        partially_received: { color: 'bg-yellow-100 text-yellow-800', icon: '📊' },
        received: { color: 'bg-green-100 text-green-800', icon: '✅' },
        canceled: { color: 'bg-red-100 text-red-800', icon: '❌' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
            <span>{config.icon}</span>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    );
};
