import React from 'react';
import { StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import ListGridToggle from '../ui/ListGridToggle';

interface OrdersMetricsProps {
    stats: {
        total: number;
        pending: number;
        revenue: number;
        avgOrderValue: number;
    };
    storeSettings: StoreSettings;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

const OrdersMetrics: React.FC<OrdersMetricsProps> = ({
    stats,
    storeSettings,
    viewMode,
    setViewMode
}) => {
    return (
        <div className="px-6 py-2 border-slate-200 bg-transparent flex flex-row items-center justify-between gap-4">
            <div className="overflow-x-auto no-scrollbar w-full md:w-auto">
                <div className="flex items-center gap-8 min-w-max py-2">
                    {[
                        { label: 'Total Orders', value: stats.total, color: 'slate' },
                        { label: 'Pending', value: stats.pending, color: 'amber' },
                        { label: 'Revenue', value: formatCurrency(stats.revenue, storeSettings), color: 'emerald' },
                        { label: 'Avg Value', value: formatCurrency(stats.avgOrderValue, storeSettings), color: 'indigo' }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</span>
                            <span className={`text-base font-semibold text-slate-700`}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden md:flex items-center">
                <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
        </div>
    );
};

export default OrdersMetrics;
