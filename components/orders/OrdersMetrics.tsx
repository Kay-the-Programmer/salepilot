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
        <div className="px-6 py-2 border-brand-border bg-transparent flex flex-row items-center justify-between gap-4">
            <div className="overflow-x-auto no-scrollbar w-full md:w-auto">
                <div className="flex items-center gap-8 min-w-max py-2">
                    {[
                        { label: 'Total Orders', value: stats.total },
                        { label: 'Pending', value: stats.pending },
                        { label: 'Revenue', value: formatCurrency(stats.revenue, storeSettings) },
                        { label: 'Avg Value', value: formatCurrency(stats.avgOrderValue, storeSettings) }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col">
                            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em] mb-0.5">{s.label}</span>
                            <span className="text-base font-bold text-brand-text tracking-tight tnum">{s.value}</span>
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
