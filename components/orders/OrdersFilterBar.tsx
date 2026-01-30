import React from 'react';
import ListGridToggle from '../ui/ListGridToggle';

interface OrdersFilterBarProps {
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
}

const OrdersFilterBar: React.FC<OrdersFilterBarProps> = ({
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode
}) => {
    return (
        <>
            <div className="md:hidden px-6 flex justify-end mb-2">
                <ListGridToggle viewMode={viewMode} onViewModeChange={setViewMode} size="sm" />
            </div>

            {/* Filter Tabs (Mobile Only) */}
            <div className="md:hidden px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/30">
                {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filterStatus === status
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>
        </>
    );
};

export default OrdersFilterBar;
