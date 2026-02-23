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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <div className="lg:col-span-2">
                    <FilterableSalesTrend storeSettings={storeSettings} />
                </div>
                <div>
                    <FilterableTopProducts storeSettings={storeSettings} />
                </div>
            </div>

            {/* Row 3: Daily Sales Table */}
            {dailySales && dailySales.length > 0 && (
                <div className="liquid-glass-card rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Sales History</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed breakdown of revenue per day</p>
                        </div>
                        <div className="flex items-center gap-3 liquid-glass-pill p-1.5 rounded-2xl">
                            <span className="text-xs font-bold uppercase tracking-wider ml-3 text-slate-500">Show</span>
                            <select
                                className="text-sm bg-blue-600 text-white rounded-xl px-4 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                                value={dailyPageSize}
                                onChange={(e) => {
                                    setDailyPageSize(parseInt(e.target.value));
                                    setDailyPage(1);
                                }}
                            >
                                <option value={5}>5 Days</option>
                                <option value={10}>10 Days</option>
                                <option value={15}>15 Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {dailySales
                            .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                            .map((day) => (
                                <div key={day.date} className="group p-6 bg-white/40 dark:bg-slate-800/20 rounded-3xl border border-slate-200/40 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                    <div className="flex flex-col mb-4">
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <div className="font-extrabold text-slate-900 dark:text-white text-lg">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-2xl mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <div className="text-xs font-bold opacity-70 mb-0.5">Revenue</div>
                                        <div className="text-lg font-black tracking-tight">
                                            {formatCurrency(day.totalRevenue, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {day.items.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px] font-medium">
                                                <span className="text-slate-500 dark:text-slate-400 truncate flex-1 mr-2">{item.name}</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                        {day.items.length > 3 && (
                                            <div className="text-[9px] uppercase tracking-widest font-black text-blue-500 pt-2 opacity-80 text-center">
                                                +{day.items.length - 3} More
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {dailySales.length > dailyPageSize && (
                        <div className="flex items-center justify-center gap-4 mt-12 pb-2">
                            <button
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-md active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed group"
                                onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                disabled={dailyPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <span className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-sm font-black text-slate-500 dark:text-slate-400 tracking-widest border border-slate-200/50 dark:border-white/5">
                                {dailyPage} <span className="mx-2 opacity-30">/</span> {Math.ceil(dailySales.length / dailyPageSize)}
                            </span>
                            <button
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-md active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed group"
                                onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                                aria-label="Next page"
                            >
                                <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
