import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { api } from '../../../services/api';
import { RevenueChart } from '../charts/RevenueChart';
import { TimeRangeFilter, TimeFilter } from '../TimeRangeFilter';

interface FilterableRevenueChartProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

import ChartBarIcon from '../../icons/ChartBarIcon';

export const FilterableSalesTrend: React.FC<FilterableRevenueChartProps> = ({ storeSettings }) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

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

                const salesTrend = response.sales?.salesTrend || {};
                const trendPoints = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = toDateInputString(d);
                    const dayData = salesTrend[dateStr] || { revenue: 0, profit: 0 };
                    trendPoints.push({
                        date: new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        revenue: dayData.revenue || 0,
                        profit: dayData.profit || 0
                    });
                }
                setChartData(trendPoints);
            } catch (err) {
                console.error("Failed to fetch revenue chart data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    return (
        <div className={`lg:col-span-2 glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-white/10 min-h-[400px] transition-all ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                        <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white/90 text-lg tracking-tight">Sales Trend</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_5px_rgba(251,146,60,0.5)]"></span> Revenue
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_5px_rgba(139,92,246,0.5)]"></span> Profit
                            </div>
                        </div>
                    </div>
                </div>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>

            {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin dark:border-slate-700 dark:border-t-blue-400"></div>
                </div>
            ) : (
                <RevenueChart
                    data={chartData}
                    storeSettings={storeSettings}
                />
            )}
        </div>
    );
};
