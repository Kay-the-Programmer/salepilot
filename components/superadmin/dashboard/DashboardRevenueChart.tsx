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
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden h-full">
            <div className="p-6 border-b border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ChartBarIcon className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-lg font-bold text-white tracking-wide">Revenue Analysis</h2>
                        </div>
                        <p className="text-slate-500 text-sm font-mono tracking-wider ml-7">System revenue performance</p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
                        {(['1m', '3m', '6m', '1y'] as const).map((period) => (
                            <button
                                key={period}
                                onClick={() => setActiveFilter(period)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 font-mono ${activeFilter === period
                                    ? 'bg-indigo-500/20 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)] border border-indigo-500/30'
                                    : 'text-slate-500 hover:text-indigo-300 hover:bg-white/5'
                                    }`}
                            >
                                {period.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {filteredMonths.length > 0 ? (
                    <>
                        <div className="h-64 flex items-end justify-between gap-4 relative">
                            {/* Grid lines background */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-full h-px bg-dashed border-t border-slate-700 border-dashed"></div>
                                ))}
                            </div>

                            {filteredMonths.map((month, i) => {
                                const max = Math.max(...filteredMonths.map(x => x.amount), 1);
                                const height = Math.max((month.amount / max) * 100, 5); // Min height 5%
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 flex flex-col items-center gap-3 group relative z-10"
                                    >
                                        <div className="w-full flex flex-col items-center relative h-full justify-end">
                                            <div
                                                style={{ height: `${height}%` }}
                                                className="w-full max-w-12 bg-gradient-to-t from-indigo-900/50 to-indigo-500 rounded-t-sm transition-all duration-500 group-hover:to-cyan-400 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] relative border-t border-x border-indigo-500/30 overflow-hidden"
                                            >
                                                {/* Bar top highlight */}
                                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50"></div>

                                            </div>

                                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-700 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 shadow-xl pointer-events-none min-w-[100px] text-center backdrop-blur-xl">
                                                <div className="font-bold text-indigo-300 mb-0.5">{formatCurrency(month.amount)}</div>
                                                <div className="text-slate-500 text-[10px] font-mono whitespace-nowrap">{month.count} TXNS</div>
                                                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono font-medium truncate w-full text-center group-hover:text-indigo-400 transition-colors">
                                            {month.month.substring(0, 3).toUpperCase()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                        <ChartBarIcon className="w-12 h-12 mb-3 opacity-20 animate-pulse" />
                        <p className="text-sm font-mono">NO DATA STREAM DETECTED</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardRevenueChart;
