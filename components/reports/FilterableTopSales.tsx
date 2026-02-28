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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

                // Fetch dashboard data, products, and categories in parallel
                const [dashResponse, products, categories] = await Promise.all([
                    api.get<any>(`/reports/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`),
                    api.get<any[]>('/products'),
                    api.get<any[]>('/categories')
                ]);

                const sales = dashResponse.sales || {};
                const topProducts = sales.topProductsByRevenue || [];

                let processedItems: any[] = [];

                if (typeFilter === 'products') {
                    processedItems = topProducts.slice(0, 8).map((p: any) => ({
                        id: p.id || p.name,
                        name: p.name,
                        revenue: p.revenue,
                        quantity: p.quantity,
                        subtitle: formatCurrency(p.revenue / (p.quantity || 1), storeSettings),
                        valueText: `${p.quantity} Sold`
                    }));
                } else if (typeFilter === 'units') {
                    processedItems = [...topProducts]
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
                    // Client-side aggregation by category
                    const categoryMap: Record<string, { name: string, revenue: number, quantity: number }> = {};

                    // Initialize with all categories
                    categories.forEach(cat => {
                        categoryMap[cat.id] = { name: cat.name, revenue: 0, quantity: 0 };
                    });

                    // Map products to categories for quick lookup
                    const productToCategory: Record<string, string> = {};
                    products.forEach(prod => {
                        if (prod.categoryId) {
                            productToCategory[prod.id] = prod.categoryId;
                            // Also map by name as fallback if API topProducts only has names
                            productToCategory[prod.name] = prod.categoryId;
                        }
                    });

                    // Aggregate
                    topProducts.forEach((p: any) => {
                        const catId = p.id ? productToCategory[p.id] : productToCategory[p.name];
                        if (catId && categoryMap[catId]) {
                            categoryMap[catId].revenue += p.revenue;
                            categoryMap[catId].quantity += p.quantity;
                        }
                    });

                    processedItems = Object.entries(categoryMap)
                        .filter(([_, data]) => data.revenue > 0 || data.quantity > 0)
                        .map(([id, data]) => ({
                            id,
                            name: data.name,
                            revenue: data.revenue,
                            quantity: data.quantity,
                            subtitle: `${data.quantity} units across category`,
                            valueText: formatCurrency(data.revenue, storeSettings)
                        }))
                        .sort((a, b) => b.revenue - a.revenue)
                        .slice(0, 8);
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
        <div className={`dashboard-card h-[400px] flex flex-col transition-all duration-300 ${isFilterOpen ? 'z-[60] relative' : 'z-auto'}`}>
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-baseline sm:items-center gap-4 mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg whitespace-nowrap">Top Sales</h3>
                <div className="flex flex-wrap items-center gap-2 xs:justify-end">
                    <TimeRangeFilter value={timeFilter} onChange={setTimeFilter} onOpenChange={setIsFilterOpen} />
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl shadow-inner">
                        {(['products', 'units', 'categories'] as TopSalesType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${typeFilter === t
                                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="h-full flex items-center justify-center py-10">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-600 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
                    </div>
                ) : items.length > 0 ? (
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all group active:scale-95 transition-all duration-300">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors active:scale-95 transition-all duration-300">
                                    {typeFilter === 'categories' ? (
                                        <div className="text-xl">🏷️</div>
                                    ) : (
                                        <ShoppingCartIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-indigo-400 dark:group-hover:text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{item.valueText}</div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Top #{i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                            <ArchiveBoxIcon className="w-8 h-8 text-slate-200 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No sales data found</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">Try changing the time filter or view</p>
                    </div>
                )}
            </div>
        </div>
    );
};
