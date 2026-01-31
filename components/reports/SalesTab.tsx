import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';
import ReceiptTaxIcon from '../icons/ReceiptTaxIcon';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

import { FilterableStatCard } from './FilterableStatCard';
import { FilterableSalesTrend } from './sales/FilterableSalesTrend';
import { FilterableTopProducts } from './sales/FilterableTopProducts';

interface SalesTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    dailySales: any[] | null;
    dailyPage: number;
    setDailyPage: React.Dispatch<React.SetStateAction<number>>;
    dailyPageSize: number;
    setDailyPageSize: React.Dispatch<React.SetStateAction<number>>;
}

export const SalesTab: React.FC<SalesTabProps> = ({
    storeSettings,
    dailySales,
    dailyPage,
    setDailyPage,
    dailyPageSize,
    setDailyPageSize,
}) => {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterableStatCard
                    title="Revenue"
                    type="revenue"
                    icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
                    color="bg-green-100/50 dark:bg-green-500/20"
                    sparklineColor="#10b981"
                    storeSettings={storeSettings}
                />
                <FilterableStatCard
                    title="Profit"
                    type="profit"
                    icon={<TrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    color="bg-blue-100/50 dark:bg-blue-500/20"
                    sparklineColor="#3b82f6"
                    storeSettings={storeSettings}
                />
                <FilterableStatCard
                    title="Margin"
                    type="sale_margin"
                    icon={<ReceiptPercentIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                    color="bg-yellow-100/50 dark:bg-yellow-500/20"
                    sparklineColor="#eab308"
                    storeSettings={storeSettings}
                />
                <FilterableStatCard
                    title="Transactions"
                    type="orders"
                    icon={<ReceiptTaxIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                    color="bg-indigo-100/50 dark:bg-indigo-500/20"
                    sparklineColor="#6366f1"
                    storeSettings={storeSettings}
                />
            </div>

            {/* Row 2: Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FilterableSalesTrend storeSettings={storeSettings} />
                <FilterableTopProducts storeSettings={storeSettings} />
            </div>

            {/* Row 3: Daily Sales Table */}
            {dailySales && dailySales.length > 0 && (
                <div className="glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg uppercase tracking-wider">Daily Sales History</h3>
                        <select
                            className="text-sm border-slate-200 dark:border-white/10 border rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dailySales
                            .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                            .map((day) => (
                                <div key={day.date} className="p-5 bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg">
                                            {formatCurrency(day.totalRevenue, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {day.items.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-600 dark:text-slate-400 truncate flex-1 mr-2 font-medium">{item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                    {item.quantity} × {formatCurrency(item.revenue / item.quantity, storeSettings)}
                                                </span>
                                            </div>
                                        ))}
                                        {day.items.length > 3 && (
                                            <div className="text-[10px] uppercase tracking-widest font-bold text-center text-slate-400 pt-2 opacity-60">
                                                +{day.items.length - 3} more items
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {dailySales.length > dailyPageSize && (
                        <div className="flex items-center justify-center gap-6 mt-10">
                            <button
                                className="flex items-center px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                disabled={dailyPage === 1}
                            >
                                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                                Previous
                            </button>
                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-4 py-1.5 rounded-lg">
                                {dailyPage} <span className="mx-1 opacity-50">/</span> {Math.ceil(dailySales.length / dailyPageSize)}
                            </span>
                            <button
                                className="flex items-center px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                            >
                                Next
                                <ChevronRightIcon className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
