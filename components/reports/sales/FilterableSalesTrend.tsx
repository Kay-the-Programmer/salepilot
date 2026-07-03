import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { fetchDashboardRange } from '../reportsData';
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

                const response = await fetchDashboardRange(startDateStr, endDateStr);

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
        <div className={`dashboard-card h-full ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-brand-text text-lg tracking-tight">Sales Trend</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                                <span className="w-2 h-2 rounded-full bg-sp-orange"></span> Revenue
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                                <span className="w-2 h-2 rounded-full bg-sp-navy"></span> Profit
                            </div>
                        </div>
                    </div>
                    <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
                </div>

                {loading ? (
                    <div className="w-full h-[300px] flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-4 border-brand-border border-t-sp-navy animate-spin"></div>
                    </div>
                ) : (
                    <RevenueChart
                        data={chartData}
                        storeSettings={storeSettings}
                    />
                )}
            </div>
        </div>
    );
};
