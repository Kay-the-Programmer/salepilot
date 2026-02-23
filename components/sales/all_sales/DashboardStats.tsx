import React from 'react';
import ChartBarIcon from '../../icons/ChartBarIcon';
import FilterIcon from '../../icons/FilterIcon';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';
import SalesAreaChart from './SalesAreaChart';

interface DashboardStatsProps {
    mobileView: 'summary' | 'history';
    dailySales: { date: string; totalRevenue: number }[];
    stats: { totalRevenue: number; totalSales: number };
    total: number;
    storeSettings: StoreSettings;
    hasActiveFilters: boolean;
    onOpenFilterSheet: () => void;
}

export default function DashboardStats({
    mobileView, dailySales, stats, total, storeSettings,
    hasActiveFilters, onOpenFilterSheet
}: DashboardStatsProps) {
    return (
        <div className={`md:hidden space-y-4 mt-4 mb-6 ${mobileView === 'summary' ? 'block' : 'hidden'}`}>
            {/* 1. Top Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 p-4 border border-gray-100 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <ChartBarIcon className="w-16 h-16 dark:text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {formatCurrency(
                            // Try to use daily sales sum if available for more accurate "filtered" total, otherwise page stats
                            dailySales.length > 0
                                ? dailySales.reduce((sum, d) => sum + d.totalRevenue, 0)
                                : stats.totalRevenue,
                            storeSettings
                        )}
                    </div>
                </div>
                <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 p-4 border border-gray-100 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <ChartBarIcon className="w-16 h-16 dark:text-white" />
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Transactions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {/* Use total count from API if available, else page stats */}
                        {total > 0 ? total : stats.totalSales}
                    </div>
                </div>
            </div>

            {/* 2. Graph Chart Card */}
            <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 p-4 border border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Sales Trend</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Revenue over specific period</p>
                    </div>
                    <button
                        onClick={() => !hasActiveFilters && onOpenFilterSheet()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors active:scale-95 transition-all duration-300"
                    >
                        <FilterIcon className="w-3 h-3" />
                        <span>{hasActiveFilters ? 'Filtered' : 'Filter Chart'}</span>
                    </button>
                </div>

                <div className="h-48 w-full">
                    {dailySales && dailySales.length > 0 ? (
                        <SalesAreaChart data={dailySales} color="#2563eb" storeSettings={storeSettings} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                            <ChartBarIcon className="w-8 h-8 mb-2 opacity-50" />
                            <div className="text-xs">No chart data available</div>
                            <button onClick={onOpenFilterSheet} className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">Select Date Range</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
