import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { api } from '../../../services/api';
import { RevenueChart } from '../charts/RevenueChart';
import { TimeRangeFilter, TimeFilter } from '../TimeRangeFilter';

interface FilterableCashflowTrendProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableCashflowTrend: React.FC<FilterableCashflowTrendProps> = ({ storeSettings }) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any[]>([]);

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

                const cashflowTrend = response.cashflow?.cashflowTrend || {};
                const trendPoints = [];
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = toDateInputString(d);
                    const dayData = cashflowTrend[dateStr] || { inflow: 0, outflow: 0 };
                    trendPoints.push({
                        date: new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        inflow: dayData.inflow || 0,
                        outflow: dayData.outflow || 0
                    });
                }
                setChartData(trendPoints);
            } catch (err) {
                console.error("Failed to fetch cashflow trend data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    return (
        <div className={`dashboard-card h-full transition-all duration-300 ${isFilterOpen ? 'z-50' : 'z-auto'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-brand-text text-lg tracking-tight">Cashflow Trend</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                            <span className="w-2 h-2 rounded-full bg-success"></span> Inflow
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                            <span className="w-2 h-2 rounded-full bg-danger"></span> Outflow
                        </div>
                    </div>
                </div>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>

            {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-brand-border border-t-sp-navy animate-spin"></div>
                </div>
            ) : (
                <RevenueChart
                    data={chartData}
                    storeSettings={storeSettings}
                    barKey="inflow"
                    lineKey="outflow"
                    barColor="#16a34a"
                    lineColor="#ba1a1a"
                    height={220}
                />
            )}
        </div>
    );
};
