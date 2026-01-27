import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';
import ShoppingCartIcon from '../icons/ShoppingCartIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon'; // Assuming for units/products

type TopSalesType = 'products' | 'units' | 'categories';

interface FilterableTopSalesProps {
    storeSettings: StoreSettings;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const FilterableTopSales: React.FC<FilterableTopSalesProps> = ({ storeSettings }) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
    const [typeFilter, setTypeFilter] = useState<TopSalesType>('products');
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const end = new Date();
                const start = new Date();

                switch (timeFilter) {
                    case 'daily': break;
                    case 'weekly': start.setDate(end.getDate() - 6); break;
                    case 'monthly': start.setDate(1); break;
                    case 'yearly': start.setMonth(0, 1); break;
                }

                const startDateStr = toDateInputString(start);
                const endDateStr = toDateInputString(end);

                // Fetch dashboard data for the period
                const response = await api.get<any>(`/reports/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`);
                const sales = response.sales || {};

                let processedItems: any[] = [];

                if (typeFilter === 'products') {
                    processedItems = (sales.topProductsByRevenue || []).slice(0, 8).map((p: any) => ({
                        id: p.id || p.name,
                        name: p.name,
                        revenue: p.revenue,
                        quantity: p.quantity,
                        subtitle: formatCurrency(p.revenue / (p.quantity || 1), storeSettings),
                        valueText: `${p.quantity} Sold`
                    }));
                } else if (typeFilter === 'units') {
                    // Assuming we might have topProductsByQuantity or we sort the revenue ones by quantity
                    const rawProducts = sales.topProductsByRevenue || [];
                    processedItems = [...rawProducts]
                        .sort((a, b) => b.quantity - a.quantity)
                        .slice(0, 8)
                        .map((p: any) => ({
                            id: p.id || p.name,
                            name: p.name,
                            revenue: p.revenue,
                            quantity: p.quantity,
                            subtitle: `${formatCurrency(p.revenue, storeSettings)} Total`,
                            valueText: `${p.quantity} Units`
                        }));
                } else if (typeFilter === 'categories') {
                    // If backend doesn't provide topCategoriesByRevenue, we might need to fallback.
                    // Let's assume the API might have topCategoriesByRevenue or similar.
                    processedItems = (sales.topCategoriesByRevenue || []).slice(0, 8).map((c: any) => ({
                        id: c.id || c.name,
                        name: c.name,
                        revenue: c.revenue,
                        quantity: c.quantity,
                        subtitle: `${c.quantity || 0} items sold`,
                        valueText: formatCurrency(c.revenue, storeSettings)
                    }));
                }

                setItems(processedItems);
            } catch (err) {
                console.error("Failed to fetch top sales data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeFilter, typeFilter, storeSettings]);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Top Sales</h3>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['products', 'units', 'categories'] as TopSalesType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${typeFilter === t
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                    <TimeRangeFilter value={timeFilter} onChange={setTimeFilter} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center py-10">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin"></div>
                    </div>
                ) : items.length > 0 ? (
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all group">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                                    {typeFilter === 'categories' ? (
                                        <div className="text-xl">🏷️</div>
                                    ) : (
                                        <ShoppingCartIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500">{item.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 text-sm">{item.valueText}</div>
                                    <div className="text-xs text-emerald-600 font-medium">Top #{i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <ArchiveBoxIcon className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">No sales data found</p>
                        <p className="text-slate-400 text-xs">Try changing the time filter or view</p>
                    </div>
                )}
            </div>
        </div>
    );
};
