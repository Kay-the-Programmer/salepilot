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
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <FilterableSalesTrend storeSettings={storeSettings} />
                </div>
                <div className="md:col-span-1">
                    <FilterableTopProducts storeSettings={storeSettings} />
                </div>
            </div>

            {/* Row 3: Daily Sales Table */}
            {dailySales && dailySales.length > 0 && (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[24px] p-8 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/50 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Sales History</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed breakdown of revenue per day</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-[16px]">
                            <span className="text-[13px] font-medium tracking-wide ml-3 text-slate-500">Show</span>
                            <select
                                className="text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer active:scale-95 shadow-sm"
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
                                <div key={day.date} className="group p-6 bg-slate-50/50 dark:bg-slate-900/20 rounded-[20px] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300 active:scale-[0.98]">
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
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl mb-5 border border-slate-100 dark:border-white/5 shadow-sm group-hover:shadow-[0_4px_12px_rgb(0,0,0,0.05)] transition-all duration-300">
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Revenue</div>
                                        <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
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
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
                                onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                disabled={dailyPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            <span className="px-5 py-2 rounded-full bg-transparent text-[14px] font-medium text-slate-500 dark:text-slate-400">
                                {dailyPage} <span className="mx-1.5 opacity-40">/</span> {Math.ceil(dailySales.length / dailyPageSize)}
                            </span>
                            <button
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
                                onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                                aria-label="Next page"
                            >
                                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
