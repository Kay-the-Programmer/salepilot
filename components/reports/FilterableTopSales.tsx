import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { TimeRangeFilter, TimeFilter } from './TimeRangeFilter';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';

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
        <div className={`dashboard-card h-[400px] flex flex-col ${isFilterOpen ? 'z-[60] relative' : 'z-auto'}`}>
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-baseline sm:items-center gap-3 mb-5">
                <h3 className="font-bold text-brand-text text-lg tracking-tight whitespace-nowrap">Top Sales</h3>
                <div className="flex flex-wrap items-center gap-2 xs:justify-end">
                    <TimeRangeFilter value={timeFilter} onChange={setTimeFilter} onOpenChange={setIsFilterOpen} />
                    <div className="flex bg-surface-variant p-1 rounded-lg">
                        {(['products', 'units', 'categories'] as TopSalesType[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${typeFilter === t
                                    ? 'bg-sp-navy text-white shadow-sm'
                                    : 'text-brand-text-muted hover:text-brand-text'
                                    }`}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar -mx-1">
                {loading ? (
                    <div className="h-full flex items-center justify-center py-10">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-border border-t-sp-navy animate-spin"></div>
                    </div>
                ) : items.length > 0 ? (
                    <div className="space-y-1">
                        {items.map((item, i) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-surface-variant/50 rounded-lg transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center flex-shrink-0 text-sm font-bold text-brand-text-muted tnum">
                                    {typeFilter === 'categories' ? (
                                        <span className="text-lg">🏷️</span>
                                    ) : (
                                        <span>{i + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-brand-text text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-brand-text-muted truncate">{item.subtitle}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="font-bold text-brand-text text-sm tnum">{item.valueText}</div>
                                    <div className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">Top #{i + 1}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 bg-surface-variant rounded-full flex items-center justify-center mb-3">
                            <ArchiveBoxIcon className="w-7 h-7 text-brand-text-muted/50" />
                        </div>
                        <p className="text-brand-text text-sm font-semibold">No sales data found</p>
                        <p className="text-brand-text-muted text-xs mt-0.5">Try changing the time filter or view</p>
                    </div>
                )}
            </div>
        </div>
    );
};
