import React, { useState, useEffect } from 'react';

import { api } from '../../services/api';
import { SalesChannelChart } from './charts/SalesChannelChart';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';

interface FilterableSalesChannelChartProps {
    totalRevenue: number; // For fallback calculation if needed
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableSalesChannelChart: React.FC<FilterableSalesChannelChartProps> = () => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ online: 0, inStore: 0, total: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const end = new Date();
                const start = new Date();

                switch (filter) {
                    case 'daily': break;
                    case 'weekly': start.setDate(end.getDate() - 6); break;
                    case 'monthly': start.setDate(1); break;
                    case 'yearly': start.setMonth(0, 1); break;
                }

                const startDateStr = toDateInputString(start);
                const endDateStr = toDateInputString(end);

                const response = await api.get<any>(`/reports/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`);

                const sales = response.sales || {};
                const online = sales.salesByChannel?.find((c: any) => c.channel === 'online')?.revenue || 0;
                const total = sales.totalRevenue || 0;
                const inStore = sales.salesByChannel?.find((c: any) => c.channel === 'pos')?.revenue || (total - online);

                setData({ online, inStore, total });
            } catch (err) {
                console.error("Failed to fetch sales channel data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    return (
        <div className={`glass-effect rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col min-h-[400px] transition-all ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 text-lg">Sales Channels</h3>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="flex-1 flex items-center justify-center">
                        <SalesChannelChart
                            online={data.online}
                            inStore={data.inStore}
                            total={data.total}
                        />
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Online
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="w-3 h-3 rounded-full bg-orange-400"></span> In-Store
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
