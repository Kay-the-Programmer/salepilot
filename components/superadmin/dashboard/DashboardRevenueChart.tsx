
import React, { useState } from 'react';
import { ChartBarIcon } from '../../icons';
import { RevenueSummary } from '../../../types';

interface DashboardRevenueChartProps {
    revSummary: RevenueSummary | null;
    formatCurrency: (amount: number) => string;
}

const DashboardRevenueChart: React.FC<DashboardRevenueChartProps> = ({ revSummary, formatCurrency }) => {
    const [activeFilter, setActiveFilter] = useState<'1m' | '3m' | '6m' | '1y'>('6m');

    // Filter months based on active filter
    const filteredMonths = React.useMemo(() => {
        if (!revSummary?.byMonth) return [];
        const months = revSummary.byMonth.slice(0, 12);

        switch (activeFilter) {
            case '1m': return months.slice(0, 1);
            case '3m': return months.slice(0, 3);
            case '6m': return months.slice(0, 6);
            case '1y': return months;
            default: return months.slice(0, 6);
        }
    }, [revSummary?.byMonth, activeFilter]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Revenue Performance</h2>
                        <p className="text-gray-600 text-sm mt-1">Monthly revenue overview</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                        {(['1m', '3m', '6m', '1y'] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => setActiveFilter(period)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeFilter === period
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {period.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6">
                {filteredMonths.length > 0 ? (
                    <>
                        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
                            {filteredMonths.map((month, i) => {
                                const max = Math.max(...filteredMonths.map(x => x.amount), 1);
                                const height = (month.amount / max) * 100;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col items-center gap-3 group"
                                    >
                                        <div className="w-full flex flex-col items-center relative">
                                            <div
                                                style={{ height: `${height}%` }}
                                                className="w-3/4 sm:w-full max-w-16 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-500 group-hover:from-indigo-600 group-hover:to-indigo-500"
                                            ></div>
                                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                <div className="font-semibold">{formatCurrency(month.amount)}</div>
                                                <div className="text-gray-300 text-xs">{month.count} transactions</div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                                            {month.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                                    <span>Revenue Amount</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                                    <span>Transaction Count</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <ChartBarIcon className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">No revenue data available</p>
                        <p className="text-xs mt-1">Revenue data will appear here once available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardRevenueChart;
