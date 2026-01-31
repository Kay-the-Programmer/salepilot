import React from 'react';
import ChartBarIcon from '../../icons/ChartBarIcon';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface DailySalesSummaryProps {
    dailySales: { date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }[];
    mobileView: 'summary' | 'history';
    storeSettings: StoreSettings;
}

export default function DailySalesSummary({ dailySales, mobileView, storeSettings }: DailySalesSummaryProps) {
    if (!dailySales || dailySales.length === 0) return null;

    return (
        <div className={`mb-8 glass-effect dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden ${mobileView === 'summary' ? 'block' : 'hidden md:block'}`}>
            <div className="p-5 border-b border-slate-50 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 rounded-xl">
                            <ChartBarIcon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white leading-none mb-1">Daily Performance</h3>
                            <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Product breakdown by day</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-white/5">
                {dailySales.map(day => (
                    <div key={day.date} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                        {day.totalQuantity.toLocaleString()} Units
                                    </div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {formatCurrency(day.totalRevenue, storeSettings)}
                                    </div>
                                </div>
                            </div>

                            {/* Product Items with mini-chart bars */}
                            <div className="space-y-4">
                                {day.items.slice(0, 3).map((item, idx) => {
                                    const percentage = (item.revenue / (day.totalRevenue || 1)) * 100;
                                    return (
                                        <div key={item.name + idx} className="group relative">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="text-xs font-bold text-slate-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {item.name}
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500">{item.quantity} qty</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(item.revenue, storeSettings)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Mini Bar Chart */}
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.max(5, percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {day.items.length > 3 && (
                                    <div className="pt-2">
                                        <button className="w-full py-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                                            + {day.items.length - 3} more products
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .glass-effect {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
            `}} />
        </div>
    );
};
