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
        <div className="px-6 py-3 border-brand-border bg-transparent flex flex-row items-center justify-between gap-4">
            <div className="overflow-x-auto no-scrollbar w-full md:w-auto">
                {/* Velocity metric strip — label-md caption over a display-weight value */}
                <div className="flex items-stretch gap-6 min-w-max py-1">
                    {[
                        { label: 'Total Orders', value: stats.total, accent: false },
                        { label: 'Pending', value: stats.pending, accent: false },
                        { label: 'Revenue', value: formatCurrency(stats.revenue, storeSettings), accent: true },
                        { label: 'Avg Value', value: formatCurrency(stats.avgOrderValue, storeSettings), accent: false }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col justify-center pr-6 border-r border-brand-border last:border-r-0 last:pr-0">
                            <span className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider mb-1">{s.label}</span>
                            <span className={`text-xl font-bold tracking-tight tnum leading-none ${s.accent ? 'text-sp-navy' : 'text-brand-text'}`}>{s.value}</span>
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
