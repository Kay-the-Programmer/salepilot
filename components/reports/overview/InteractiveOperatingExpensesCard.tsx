import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import { StatSparkline } from '../charts/StatSparkline';
import { TimeRangeFilter, TimeFilter } from '../TimeRangeFilter';
import BanknotesIcon from '../../icons/BanknotesIcon';
import ArrowRightIcon from '../../icons/ArrowRightIcon';

interface InteractiveOperatingExpensesCardProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const InteractiveOperatingExpensesCard: React.FC<InteractiveOperatingExpensesCardProps> = ({
    storeSettings
}) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [operatingExpenses, setOperatingExpenses] = useState<number>(0);
    const [trend, setTrend] = useState<any[]>([]);

    // For flashing expenses
    const [expensesBreakdown, setExpensesBreakdown] = useState<{ title: string, amount: number }[]>([]);
    const [currentExpenseIndex, setCurrentExpenseIndex] = useState(0);

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
                    const dayData = salesTrend[dateStr] || { expenses: 0 };
                    trendPoints.push({ name: dateStr, value: dayData.expenses || 0 });
                }

                setOperatingExpenses(response.sales?.totalOperatingExpenses || 0);
                setTrend(trendPoints);

                // Set real expenses breakdown from API
                const breakdown = response.sales?.expensesBreakdown || [];
                setExpensesBreakdown(breakdown);

            } catch (err) {
                console.error("Failed to fetch operating expenses data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    const memoizedBreakdown = React.useMemo(() => expensesBreakdown, [expensesBreakdown]);

    // Flashing effect loop
    useEffect(() => {
        if (memoizedBreakdown.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentExpenseIndex((prev) => (prev + 1) % memoizedBreakdown.length);
        }, 2500); // Change expense every 2.5 seconds

        return () => clearInterval(interval);
    }, [memoizedBreakdown.length]);

    const isNewUser = !loading && operatingExpenses === 0 && expensesBreakdown.length === 0;

    const handleGetStarted = () => {
        window.location.hash = 'expenses';
        window.location.pathname = '/accounting';
    };

    return (
        <div className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[24px] p-7 flex flex-col justify-between relative group transition-all duration-300 shadow-[0_2px_8px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgb(0,0,0,0.08)] ${isFilterOpen ? 'z-50' : 'z-auto'} overflow-hidden h-[360px]`}>
            {/* Background Sparkline */}
            {!isNewUser && (
                <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-all duration-500 rounded-b-[2rem] pointer-events-none z-0">
                    {!loading && <StatSparkline data={trend} color="#ef4444" height={160} />}
                </div>
            )}

            <div className="flex justify-between items-start z-10 relative">
                <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center bg-opacity-20 dark:bg-opacity-30 shadow-inner group-hover:scale-110 transition-transform duration-300">
                            <BanknotesIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs tracking-wide">Operating Expenses</span>
                    </div>
                    <div className="text-[32px] font-semibold tracking-tight text-slate-900 dark:text-white mt-1 min-h-[40px] flex items-center">
                        {loading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-red-600 dark:border-slate-700 dark:border-t-red-400 animate-spin"></div>
                        ) : isNewUser ? (
                            <span className="text-xl text-slate-400 font-medium">No expenses yet</span>
                        ) : (
                            formatCurrency(operatingExpenses, storeSettings)
                        )}
                    </div>
                </div>
                {!isNewUser && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-20 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
                        <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 z-10 relative h-[140px] flex flex-col justify-center">
                {isNewUser ? (
                    <div className="text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Organize your business by tracking daily operating costs like rent, utilities, and marketing.
                        </p>
                        <button
                            onClick={handleGetStarted}
                            className="w-full py-3.5 px-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-300 border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 group/btn"
                        >
                            <span>Start Adding Expenses</span>
                            <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <>
                        {expensesBreakdown.length > 0 && !loading && (
                            <div
                                key={currentExpenseIndex}
                                className="animate-fade-in-up w-full flex justify-between items-center bg-red-50/50 dark:bg-red-900/10 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {expensesBreakdown[currentExpenseIndex].title}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                                    {formatCurrency(expensesBreakdown[currentExpenseIndex].amount, storeSettings)}
                                </span>
                            </div>
                        )}
                        {loading && (
                            <div className="w-full flex justify-center">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin"></div>
                            </div>
                        )}
                        {!loading && expensesBreakdown.length === 0 && (
                            <div className="w-full text-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 py-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                No recent expenses
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/0 via-red-500/0 to-red-500/5 dark:to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem] z-0"></div>

            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(8px); }
                    15% { opacity: 1; transform: translateY(0); }
                    85% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-8px); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 2.5s ease-in-out infinite both;
                }
            `}</style>
        </div>
    );
};
