import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { fetchDashboardRange } from '../reportsData';
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

                const response = await fetchDashboardRange(startDateStr, endDateStr);

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
            {/* Background sparkline */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none z-0">
                {!loading && <StatSparkline data={trend} color="#002B6B" height={160} />}
            </div>

            <div className="flex justify-between items-start z-10 relative">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-sp-navy-soft flex items-center justify-center">
                            <DocumentTextIcon className="w-5 h-5 text-sp-navy" />
                        </div>
                        <span className="text-brand-text-muted font-semibold text-[11px] uppercase tracking-wider">Net Profit</span>
                    </div>
                    <div className="text-[30px] leading-none font-bold tracking-tight text-brand-text mt-1 min-h-[36px] flex items-center tnum">
                        {loading ? (
                            <div className="w-5 h-5 rounded-full border-2 border-brand-border border-t-sp-navy animate-spin"></div>
                        ) : (
                            formatCurrency(netIncome, storeSettings)
                        )}
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-20">
                    <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
                </div>
            </div>

            {/* Divider and details row */}
            <div className="mt-6 pt-4 border-t border-brand-border z-10 relative">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] text-brand-text-muted uppercase tracking-widest font-bold mb-1">Transactions</div>
                        <div className="text-lg font-bold text-brand-text tnum">
                            {loading ? '—' : transactions.toLocaleString()}
                        </div>
                    </div>
                    <div className="border-l border-brand-border pl-4">
                        <div className="text-[10px] text-brand-text-muted uppercase tracking-widest font-bold mb-1">Total Revenue</div>
                        <div className="text-lg font-bold text-brand-text tnum">
                            {loading ? '—' : formatCurrency(revenue, storeSettings)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
