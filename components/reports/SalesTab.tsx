import React from 'react';
import { StatCard } from './StatCard';
import { RevenueChart } from './DashboardCharts';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';
import ReceiptTaxIcon from '../icons/ReceiptTaxIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface SalesTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    salesTrend: any[];
    dailySales: any[] | null;
    dailyPage: number;
    setDailyPage: React.Dispatch<React.SetStateAction<number>>;
    dailyPageSize: number;
    setDailyPageSize: React.Dispatch<React.SetStateAction<number>>;
}

export const SalesTab: React.FC<SalesTabProps> = ({
    reportData,
    storeSettings,
    salesTrend,
    dailySales,
    dailyPage,
    setDailyPage,
    dailyPageSize,
    setDailyPageSize,
}) => {
    const sales = reportData.sales;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Revenue"
                    value={formatCurrency(sales.totalRevenue, storeSettings)}
                    icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600" />}
                    color="bg-green-100"
                    tooltip="Total income from sales before any expenses or COGS are deducted."
                />
                <StatCard
                    title="Profit"
                    value={formatCurrency(sales.totalProfit, storeSettings)}
                    icon={<TrendingUpIcon className="h-5 w-5 text-blue-600" />}
                    color="bg-blue-100"
                    tooltip="Gross Profit (Revenue minus Cost of Goods Sold)."
                />
                <StatCard
                    title="Margin"
                    value={`${sales.grossMargin.toFixed(1)}%`}
                    icon={<ReceiptPercentIcon className="h-5 w-5 text-yellow-600" />}
                    color="bg-yellow-100"
                    tooltip="Gross Margin percentage ((Profit / Revenue) * 100)."
                />
                <StatCard
                    title="Transactions"
                    value={`${sales.totalTransactions}`}
                    icon={<ReceiptTaxIcon className="h-5 w-5 text-indigo-600" />}
                    color="bg-indigo-100"
                    tooltip="The total count of individual sales completed in this period."
                />
            </div>

            {/* Row 2: Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Takes 2 cols */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg mb-6">Sales Trend</h3>
                    <RevenueChart
                        data={salesTrend.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), revenue: d.value1, profit: d.value2 }))}
                        barKey="revenue"
                        lineKey="profit"
                        storeSettings={storeSettings}
                    />
                </div>

                {/* Top Products List - Takes 1 col */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-lg mb-4">Top Products</h3>
                    <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                        {sales.topProductsByRevenue.slice(0, 8).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                                        #{i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.quantity} sold</p>
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-slate-900 whitespace-nowrap ml-2">
                                    {formatCurrency(p.revenue, storeSettings)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 3: Daily Sales Table */}
            {dailySales && dailySales.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <h3 className="font-bold text-slate-900 text-lg">Daily Sales History</h3>
                        <select
                            className="text-sm border-gray-200 border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={dailyPageSize}
                            onChange={(e) => {
                                setDailyPageSize(parseInt(e.target.value));
                                setDailyPage(1);
                            }}
                        >
                            <option value={5}>Show 5 days</option>
                            <option value={10}>Show 10 days</option>
                            <option value={15}>Show 15 days</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dailySales
                            .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                            .map((day) => (
                                <div key={day.date} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                        <div className="font-bold text-slate-900">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {formatCurrency(day.totalRevenue, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {day.items.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-600 truncate flex-1 mr-2">{item.name}</span>
                                                <span className="font-medium text-slate-900 whitespace-nowrap">
                                                    {item.quantity} x {formatCurrency(item.revenue / item.quantity, storeSettings)}
                                                </span>
                                            </div>
                                        ))}
                                        {day.items.length > 3 && (
                                            <div className="text-xs text-center text-slate-400 pt-1">
                                                +{day.items.length - 3} more items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {dailySales.length > dailyPageSize && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                disabled={dailyPage === 1}
                            >
                                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                Previous
                            </button>
                            <span className="text-sm text-slate-500">
                                Page {dailyPage} of {Math.ceil(dailySales.length / dailyPageSize)}
                            </span>
                            <button
                                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                            >
                                Next
                                <ChevronRightIcon className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
