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
                <div className="bg-surface rounded-2xl p-6 border border-brand-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-brand-text tracking-tight">Daily Sales History</h3>
                            <p className="text-sm text-brand-text-muted mt-0.5">Revenue and top items per day</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-brand-text-muted">Show</span>
                            <select
                                className="text-sm bg-surface text-brand-text border border-brand-border rounded-lg px-3 py-2 font-medium outline-none focus:ring-1 focus:ring-sp-orange focus:border-sp-orange transition-all cursor-pointer"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        {dailySales
                            .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                            .map((day) => (
                                <div key={day.date} className="p-4 bg-surface-variant/50 rounded-xl border border-brand-border hover:border-sp-navy/30 transition-colors">
                                    <div className="flex items-baseline justify-between mb-3">
                                        <span className="font-bold text-brand-text text-sm">
                                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-brand-text-muted">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-0.5">Revenue</div>
                                        <div className="text-lg font-bold tracking-tight text-brand-text tnum">
                                            {formatCurrency(day.totalRevenue, storeSettings)}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-3 border-t border-brand-border">
                                        {day.items.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px]">
                                                <span className="text-brand-text-muted truncate flex-1 mr-2">{item.name}</span>
                                                <span className="font-bold text-brand-text tnum">{item.quantity}</span>
                                            </div>
                                        ))}
                                        {day.items.length > 3 && (
                                            <div className="text-[10px] font-bold text-sp-navy pt-1">
                                                +{day.items.length - 3} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {dailySales.length > dailyPageSize && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-variant text-brand-text-muted hover:bg-surface-variant/70 hover:text-brand-text transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                disabled={dailyPage === 1}
                                aria-label="Previous page"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-brand-text-muted tnum">
                                {dailyPage} / {Math.ceil(dailySales.length / dailyPageSize)}
                            </span>
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-variant text-brand-text-muted hover:bg-surface-variant/70 hover:text-brand-text transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                                aria-label="Next page"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
