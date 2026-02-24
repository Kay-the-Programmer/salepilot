import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../../types';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/currency';
import ShoppingBagIcon from '../../icons/ShoppingBagIcon';
import { TimeFilter, TimeRangeFilter } from '../TimeRangeFilter';

interface FilterableTopProductsProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableTopProducts: React.FC<FilterableTopProductsProps> = ({ storeSettings }) => {
    const [filter, setFilter] = useState<TimeFilter>('monthly');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);

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

                setProducts(response.sales?.topProductsByRevenue || []);
            } catch (err) {
                console.error("Failed to fetch top products", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    return (
        <div className={`glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10 flex flex-col min-h-[460px] transition-all ${isFilterOpen ? 'z-50 relative' : 'z-auto'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white/90 text-lg">Top Products</h3>
                <TimeRangeFilter value={filter} onChange={setFilter} onOpenChange={setIsFilterOpen} />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center py-10">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="space-y-3">
                        {products.slice(0, 10).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-1.5 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group active:scale-95 transition-all duration-300 min-w-0">
                                <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-xs font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:border-blue-500/30 transition-colors">
                                        #{i + 1}
                                    </div>
                                    <div className="min-w-0 flex-1 leading-tight">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{p.quantity} sold</p>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap ml-3 flex-shrink-0">
                                    {formatCurrency(p.revenue, storeSettings)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/40 rounded-full flex items-center justify-center mb-3">
                            <ShoppingBagIcon className="w-8 h-8 text-slate-200 dark:text-slate-800" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No sales data found</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">Try changing the time filter</p>
                    </div>
                )}
            </div>
        </div>
    );
};
