
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
                <div className="bg-white dark:bg-slate-900/60 rounded-[24px] p-5 border border-slate-200/50 dark:border-white/5 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ChartBarIcon className="w-16 h-16 dark:text-white" />
                    </div>
                    <div className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(
                            // Try to use daily sales sum if available for more accurate "filtered" total, otherwise page stats
                            dailySales.length > 0
                                ? dailySales.reduce((sum, d) => sum + d.totalRevenue, 0)
                                : stats.totalRevenue,
                            storeSettings
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900/60 rounded-[24px] p-5 border border-slate-200/50 dark:border-white/5 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ChartBarIcon className="w-16 h-16 dark:text-white" />
                    </div>
                    <div className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Transactions</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {/* Use total count from API if available, else page stats */}
                        {total > 0 ? total : stats.totalSales}
                    </div>
                </div>
            </div>

            {/* 2. Graph Chart Card */}
            <div className="bg-white dark:bg-slate-900/60 rounded-[24px] p-5 lg:p-6 border border-slate-200/50 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sales Trend</h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Revenue over specific period</p>
                    </div>
                    <button
                        onClick={() => !hasActiveFilters && onOpenFilterSheet()}
                        className="flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[12px] lg:rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-colors active:scale-95 transition-all duration-300 border border-slate-200/50 dark:border-white/5"
                    >
                        <FilterIcon className="w-3.5 h-3.5" />
                        <span>{hasActiveFilters ? 'Filtered' : 'Filter Chart'}</span>
                    </button>
                </div>

                <div className="h-48 w-full">
                    {dailySales && dailySales.length > 0 ? (
                        <SalesAreaChart data={dailySales} color="#3b82f6" storeSettings={storeSettings} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                            <ChartBarIcon className="w-8 h-8 mb-2 opacity-50" />
                            <div className="text-[13px] font-medium">No chart data available</div>
                            <button onClick={onOpenFilterSheet} className="text-[13px] text-blue-600 dark:text-blue-400 font-bold mt-1.5 active:scale-95 transition-all duration-300">Select Date Range</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
