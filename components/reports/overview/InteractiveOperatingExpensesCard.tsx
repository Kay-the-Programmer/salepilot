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
        window.location.pathname = '/books';
    };

    return (
        <div className={`dashboard-card group h-full ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            {/* Background sparkline */}
            {!isNewUser && (
                <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0">
                    {!loading && <StatSparkline data={trend} color="#ba1a1a" height={160} />}
                </div>
            )}

            <div className="flex justify-between items-start z-10 relative">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-danger/15 flex items-center justify-center">
                            <BanknotesIcon className="w-5 h-5 text-danger" />
                        </div>
                        <span className="text-brand-text-muted font-semibold text-[11px] uppercase tracking-wider">Operating Expenses</span>
                    </div>
                    <div className="text-[30px] leading-none font-bold tracking-tight text-brand-text mt-1 min-h-[36px] flex items-center tnum">
                        {loading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-brand-border border-t-danger animate-spin"></div>
                        ) : isNewUser ? (
                            <span className="text-lg text-brand-text-muted font-medium">No expenses yet</span>
                        ) : (
                            formatCurrency(operatingExpenses, storeSettings)
                        )}
                    </div>
                </div>
                {!isNewUser && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-20">
                        <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="mt-6 pt-4 border-t border-brand-border z-10 relative min-h-[120px] flex flex-col justify-center">
                {isNewUser ? (
                    <div className="text-center">
                        <p className="text-sm text-brand-text-muted mb-4 leading-relaxed">
                            Track daily operating costs like rent, utilities and marketing.
                        </p>
                        <button
                            onClick={handleGetStarted}
                            className="w-full py-3 px-4 bg-sp-navy text-white rounded-lg font-bold text-sm hover:bg-sp-navy-light transition-colors flex items-center justify-center gap-2 group/btn active:scale-95"
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
                                className="animate-expense-flash w-full flex justify-between items-center bg-surface-variant/60 px-4 py-3 rounded-xl border border-brand-border"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-2 h-2 rounded-full bg-danger flex-shrink-0"></span>
                                    <span className="text-sm font-semibold text-brand-text truncate">
                                        {expensesBreakdown[currentExpenseIndex].title}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-danger tnum flex-shrink-0 ml-2">
                                    {formatCurrency(expensesBreakdown[currentExpenseIndex].amount, storeSettings)}
                                </span>
                            </div>
                        )}
                        {loading && (
                            <div className="w-full flex justify-center">
                                <div className="w-5 h-5 rounded-full border-2 border-brand-border border-t-danger animate-spin"></div>
                            </div>
                        )}
                        {!loading && expensesBreakdown.length === 0 && (
                            <div className="w-full text-center text-xs text-brand-text-muted font-medium bg-surface-variant/50 py-2.5 rounded-xl border border-brand-border">
                                No recent expenses
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
