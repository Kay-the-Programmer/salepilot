import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { StatSparkline } from './charts/StatSparkline';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';

interface FilterableStatCardProps {
    title: string;
    type: 'revenue' | 'orders' | 'customers' | 'profit' | 'inventory_retail' | 'inventory_cost' | 'inventory_profit' | 'inventory_units' | 'active_customers' | 'new_customers' | 'store_credit' | 'total_inflow' | 'total_outflow' | 'net_cashflow' | 'cashflow_efficiency' | 'sale_margin' | 'personal_total' | 'personal_items' | 'personal_avg';
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

                let endpoint = '/reports/dashboard';
                if (type.startsWith('personal_')) {
                    endpoint = '/reports/personal-use';
                }

                const response = await api.get<any>(`${endpoint}?startDate=${startDateStr}&endDate=${endDateStr}`);

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
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.transactions || 0 }));
                        break;
                    case 'customers':
                        value = response.customers?.totalCustomers || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: 10 + i * 2 })); // Mock trend for customers
                        break;
                    case 'active_customers':
                        value = response.customers?.activeCustomersInPeriod || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.customers?.activeCustomersInPeriod || 0 }));
                        break;
                    case 'new_customers':
                        value = response.customers?.newCustomersInPeriod || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.customers?.newCustomersInPeriod || 0 }));
                        break;
                    case 'store_credit':
                        value = response.customers?.totalStoreCreditOwed || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.customers?.totalStoreCreditOwed || 0 }));
                        break;
                    case 'total_inflow':
                        value = response.cashflow?.totalInflow || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.cashflow?.totalInflow || 0 }));
                        break;
                    case 'total_outflow':
                        value = response.cashflow?.totalOutflow || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.cashflow?.totalOutflow || 0 }));
                        break;
                    case 'net_cashflow':
                        value = response.cashflow?.netCashflow || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.cashflow?.netCashflow || 0 }));
                        break;
                    case 'cashflow_efficiency':
                        const inflow = response.cashflow?.totalInflow || 0;
                        const net = response.cashflow?.netCashflow || 0;
                        value = inflow > 0 ? (net / inflow) * 100 : 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: value }));
                        break;
                    case 'inventory_retail':
                        value = response.inventory?.totalRetailValue || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.inventory?.totalRetailValue || 0 }));
                        break;
                    case 'inventory_cost':
                        value = response.inventory?.totalCostValue || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.inventory?.totalCostValue || 0 }));
                        break;
                    case 'inventory_profit':
                        value = response.inventory?.potentialProfit || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.inventory?.potentialProfit || 0 }));
                        break;
                    case 'inventory_units':
                        value = response.inventory?.totalUnits || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.inventory?.totalUnits || 0 }));
                        break;
                    case 'sale_margin':
                        value = response.sales?.grossMargin || 0;
                        trendData = trendPoints.map((t, i) => ({ name: i, value: t.profit && t.revenue ? (t.profit / t.revenue) * 100 : 0 }));
                        break;
                    case 'personal_total':
                        value = response.stats?.totalValue || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.stats?.totalValue || 0 }));
                        break;
                    case 'personal_items':
                        value = response.stats?.totalCount || 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: response.stats?.totalCount || 0 }));
                        break;
                    case 'personal_avg':
                        const total = response.stats?.totalValue || 0;
                        const count = response.stats?.totalCount || 0;
                        value = count > 0 ? total / count : 0;
                        trendData = trendPoints.map((_, i) => ({ name: i, value: value }));
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
        if (type === 'orders' || type === 'customers' || type === 'inventory_units' || type === 'active_customers' || type === 'new_customers' || type === 'personal_items') return val.toLocaleString();
        if (type === 'cashflow_efficiency' || type === 'sale_margin') return `${(val as number).toFixed(1)}%`;
        return formatCurrency(val as number, storeSettings);
    };

    return (
        <div className={`glass-effect dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-white/10 flex flex-col justify-between h-40 relative group hover:shadow-md transition-all ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="flex justify-between items-start z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center bg-opacity-15 dark:bg-opacity-25`}>
                            {icon}
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{title}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 min-h-[32px] flex items-center">
                        {loading ? (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-400 animate-spin"></div>
                        ) : (
                            formatValue(data.value)
                        )}
                    </div>
                </div>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-40 group-hover:opacity-60 transition-opacity rounded-b-2xl overflow-hidden pointer-events-none">
                {!loading && <StatSparkline data={data.trend} color={sparklineColor} height={60} />}
            </div>
        </div>
    );
};
