
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
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[28px] p-6 ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <ChartBarIcon className="w-20 h-20 dark:text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">Total Revenue</div>
                        <div className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mt-2">
                            {formatCurrency(
                                // Try to use daily sales sum if available for more accurate "filtered" total, otherwise page stats
                                dailySales.length > 0
                                    ? dailySales.reduce((sum, d) => sum + d.totalRevenue, 0)
                                    : stats.totalRevenue,
                                storeSettings
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[28px] p-6 ring-1 ring-slate-900/5 dark:ring-white/10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <ChartBarIcon className="w-20 h-20 dark:text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">Transactions</div>
                        <div className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mt-2">
                            {/* Use total count from API if available, else page stats */}
                            {total > 0 ? total : stats.totalSales}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Graph Chart Card */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[32px] p-6 lg:p-8 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-50 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Sales Trend</h3>
                        <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Revenue over selected period</p>
                    </div>
                    <button
                        onClick={() => !hasActiveFilters && onOpenFilterSheet()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-[16px] text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95 duration-300 ring-1 ring-slate-200/50 dark:ring-white/5"
                    >
                        <FilterIcon className="w-4 h-4" />
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
