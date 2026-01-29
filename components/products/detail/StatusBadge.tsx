import React from 'react';
import { Product } from '@/types.ts';

interface StatusBadgeProps {
    status: Product['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = {
        active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
        archived: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Archived' },
    }[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Active' };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            {config.label}
        </span>
    );
};

export default StatusBadge;
