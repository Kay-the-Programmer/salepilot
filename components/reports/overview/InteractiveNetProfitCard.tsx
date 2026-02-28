import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { StatSparkline } from '../charts/StatSparkline';
import { TimeRangeFilter, TimeFilter } from '../TimeRangeFilter';
import DocumentTextIcon from '../../icons/DocumentTextIcon';

interface InteractiveNetProfitCardProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const InteractiveNetProfitCard: React.FC<InteractiveNetProfitCardProps> = ({
    storeSettings
}) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [netIncome, setNetIncome] = useState<number>(0);
    const [transactions, setTransactions] = useState<number>(0);
    const [revenue, setRevenue] = useState<number>(0);
    const [trend, setTrend] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const end = new Date();
                const start = new Date();

                switch (filter) {
                    case 'daily': break;
                    case 'weekly': start.setDate(end.getDate() - 6); break;
                    case 'monthly': start.setDate(1); break;
                    case 'yearly': start.setMonth(0, 1); break;
                }

                const startDateStr = toDateInputString(start);
                const endDateStr = toDateInputString(end);

                const response = await api.get<any>(`/reports/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`);

                let salesTrend = response.sales?.salesTrend || {};

                const trendPoints = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = toDateInputString(d);
                    const dayData = salesTrend[dateStr] || { netIncome: 0 };
                    trendPoints.push({ name: dateStr, value: dayData.netIncome || 0 });
                }

                setNetIncome(response.sales?.netIncome || 0);
                setTransactions(response.sales?.totalTransactions || 0);
                setRevenue(response.sales?.totalRevenue || 0);
                setTrend(trendPoints);
            } catch (err) {
                console.error("Failed to fetch net profit data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    return (
        <div className={`dashboard-card group h-full ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="dashboard-card-glow"></div>
            {/* Background Sparkline */}
            <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-all duration-500 rounded-b-[2rem] pointer-events-none z-0">
                {!loading && <StatSparkline data={trend} color="#3b82f6" height={160} />}
            </div>

            <div className="flex justify-between items-start z-10 relative">
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center bg-opacity-20 dark:bg-opacity-30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wide">Net Profit</span>
                    </div>
                    <div className="text-[32px] font-semibold tracking-tight text-slate-900 dark:text-white mt-1 min-h-[40px] flex items-center">
                        {loading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400 animate-spin"></div>
                        ) : (
                            formatCurrency(netIncome, storeSettings)
                        )}
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-20 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
                    <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
                </div>
            </div>

            {/* Divider and Details Row */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 z-10 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div className="group/stat hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors cursor-pointer">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover/stat:animate-pulse"></span>
                            Transactions
                        </div>
                        <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            {loading ? '-' : transactions.toLocaleString()}
                        </div>
                    </div>
                    <div className="group/stat hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-colors cursor-pointer border-l border-slate-100 dark:border-slate-700/50 pl-4">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover/stat:animate-pulse"></span>
                            Total Revenue
                        </div>
                        <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            {loading ? '-' : formatCurrency(revenue, storeSettings)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem] z-0"></div>
        </div>
    );
};
