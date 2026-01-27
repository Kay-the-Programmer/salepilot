import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { RevenueChart } from './DashboardCharts';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';

interface FilterableRevenueChartProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableRevenueChart: React.FC<FilterableRevenueChartProps> = ({ storeSettings }) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
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
                        date: new Date(dateStr).getDate(),
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
        <div className="lg:col-span-2 glass-effect rounded-2xl p-5 shadow-sm border border-slate-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-900 text-lg">Revenue</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span> Revenue
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-violet-500"></span> Profit
                        </div>
                    </div>
                </div>
                <TimeRangeFilter value={filter} onChange={setFilter} />
            </div>

            {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin"></div>
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
