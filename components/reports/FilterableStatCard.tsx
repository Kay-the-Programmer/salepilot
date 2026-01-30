import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { StatSparkline } from './charts/StatSparkline';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';

interface FilterableStatCardProps {
    title: string;
    type: 'revenue' | 'orders' | 'customers' | 'profit';
    icon: React.ReactNode;
    color: string; // Tailwind class for background color
    sparklineColor: string; // Hex color for sparkline
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableStatCard: React.FC<FilterableStatCardProps> = ({
    title,
    type,
    icon,
    color,
    sparklineColor,
    storeSettings
}) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ value: number | string, trend: any[] }>({ value: 0, trend: [] });

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

                let value: number | string = 0;
                let trendData: any[] = [];
                let salesTrend = response.sales?.salesTrend || {};

                const trendPoints = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = toDateInputString(d);
                    const dayData = salesTrend[dateStr] || { revenue: 0, profit: 0, transactions: 0 };
                    trendPoints.push({ date: dateStr, ...dayData });
                }

                switch (type) {
                    case 'revenue':
                        value = response.sales?.totalRevenue || 0;
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.revenue || 0 }));
                        break;
                    case 'profit':
                        value = response.sales?.totalProfit || 0;
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.profit || 0 }));
                        break;
                    case 'orders':
                        value = response.sales?.totalTransactions || 0;
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.revenue || 0 }));
                        break;
                    case 'customers':
                        value = response.customers?.totalCustomers || 0;
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.revenue || 0 }));
                        break;
                }

                setData({ value, trend: trendData });
            } catch (err) {
                console.error("Failed to fetch stat card data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter, type]);

    const formatValue = (val: number | string) => {
        if (type === 'orders' || type === 'customers') return val.toString();
        return formatCurrency(val as number, storeSettings);
    };

    return (
        <div className={`glass-effect rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative group hover:shadow-md transition-all ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="flex justify-between items-start z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                            {icon}
                        </div>
                        <span className="text-slate-500 font-medium text-sm">{title}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-2 min-h-[32px] flex items-center">
                        {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin"></div>
                        ) : (
                            formatValue(data.value)
                        )}
                    </div>
                </div>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-40 transition-opacity rounded-b-2xl overflow-hidden pointer-events-none">
                {!loading && <StatSparkline data={data.trend} color={sparklineColor} height={60} />}
            </div>
        </div>
    );
};
