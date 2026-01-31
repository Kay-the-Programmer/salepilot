
import { PurchaseOrder } from '@/types';

interface StatusBadgeProps {
    status: PurchaseOrder['status'];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig = {
        draft: { color: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300', icon: '📝' },
        ordered: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', icon: '📦' },
        partially_received: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400', icon: '📊' },
        received: { color: 'bg-green-100 dark:bg-emerald-900/30 text-green-800 dark:text-emerald-400', icon: '✅' },
        canceled: { color: 'bg-red-100 dark:bg-rose-900/30 text-red-800 dark:text-rose-400', icon: '❌' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
            <span>{config.icon}</span>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    );
};
