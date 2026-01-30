import Pagination from '../components/ui/Pagination';
import { useState, useMemo, useEffect } from 'react';
import { Sale, Customer, StoreSettings } from '../types';
import SalesList from '../components/sales/SalesList';
import SaleDetailModal from '../components/sales/SaleDetailModal';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { api } from '../services/api';
import { dbService } from '../services/dbService';
import XMarkIcon from '../components/icons/XMarkIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';

// New Modular Components
import SalesHeader from '../components/sales/all_sales/SalesHeader';
import MobileViewMenu from '../components/sales/all_sales/MobileViewMenu';
import SalesFilterSheet from '../components/sales/all_sales/SalesFilterSheet';
import SalesFilterBar from '../components/sales/all_sales/SalesFilterBar';
import DashboardStats from '../components/sales/all_sales/DashboardStats';
import DailySalesSummary from '../components/sales/all_sales/DailySalesSummary';

interface AllSalesPageProps {
    customers: Customer[];
    storeSettings: StoreSettings;
}

export default function AllSalesPage({ customers, storeSettings }: AllSalesPageProps) {
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'summary' | 'history'>('summary');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [salesData, setSalesData] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const hasActiveFilters = useMemo(() => !!(startDate || endDate || selectedCustomerId || selectedStatus), [startDate, endDate, selectedCustomerId, selectedStatus]);
    const [dailySales, setDailySales] = useState<{ date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }[]>([]);

    // Pagination state for Sales History
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);

    // Enriched sales with customer names resolved from the customers list
    const enrichedSales = useMemo(() => {
        if (!Array.isArray(salesData)) return [];
        return salesData.map(sale => {
            if (sale.customerName) return sale;
            if (!sale.customerId) return sale;
            const customer = customers.find(c => c.id === sale.customerId);
            return customer ? { ...sale, customerName: customer.name } : sale;
        });
    }, [salesData, customers]);

    // Stats
    const stats = useMemo(() => {
        const totalRevenue = enrichedSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
        const totalSales = enrichedSales.length;
        const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        const paidSales = enrichedSales.filter(s => s.paymentStatus === 'paid').length;

        return { totalRevenue, totalSales, avgSaleValue, paidSales };
    }, [enrichedSales]);

    useEffect(() => {
        const fetchSales = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
                if (selectedCustomerId) params.append('customerId', selectedCustomerId);
                if (selectedStatus) params.append('paymentStatus', selectedStatus);
                params.append('page', String(page));
                params.append('limit', String(pageSize));
                params.append('sortBy', sortBy);
                params.append('sortOrder', sortOrder);

                const [fetchedSales, daily] = await Promise.all([
                    api.get<{ items: Sale[]; total: number; page: number; limit: number }>(`/sales?${params.toString()}`),
                    startDate && endDate ? api.get<{ daily: any }>(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`) : Promise.resolve({ daily: [] as any }),
                ]);
                setSalesData(fetchedSales?.items || []);
                setTotal(fetchedSales?.total || 0);
                setDailySales((daily as any)?.daily || []);

            } catch (err: any) {
                // Offline fallback
                try {
                    const allSales = await dbService.getAll<Sale>('sales');
                    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                    const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;

                    let filtered = allSales.filter(s => {
                        const ts = new Date(s.timestamp);
                        if (start && ts < start) return false;
                        if (end && ts > end) return false;
                        if (selectedCustomerId && String(s.customerId || '') !== String(selectedCustomerId)) return false;
                        if (selectedStatus && s.paymentStatus !== (selectedStatus as any)) return false;
                        return true;
                    });

                    filtered.sort((a, b) => {
                        let cmp = 0;
                        switch (sortBy) {
                            case 'total':
                                cmp = a.total - b.total;
                                break;
                            case 'customer':
                                cmp = (a.customerName || '').localeCompare(b.customerName || '');
                                break;
                            case 'status':
                                cmp = (a.paymentStatus || '').localeCompare(b.paymentStatus || '');
                                break;
                            case 'date':
                            default:
                                cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                        }
                        return sortOrder === 'asc' ? cmp : -cmp;
                    });

                    const totalCount = filtered.length;
                    const startIdx = (page - 1) * pageSize;
                    const pageItems = filtered.slice(startIdx, startIdx + pageSize);

                    setSalesData(pageItems);
                    setTotal(totalCount);

                    if (start && end) {
                        const dailyMap = new Map<string, { date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }>();
                        const itemsAggMap = new Map<string, Map<string, { quantity: number; revenue: number }>>();

                        for (const sale of filtered) {
                            const d = new Date(sale.timestamp);
                            const key = d.toISOString().slice(0, 10);
                            if (d < start || d > end) continue;

                            if (!dailyMap.has(key)) {
                                dailyMap.set(key, { date: key, totalRevenue: 0, totalQuantity: 0, items: [] });
                                itemsAggMap.set(key, new Map());
                            }
                            const day = dailyMap.get(key)!;
                            day.totalRevenue += sale.total || 0;

                            for (const it of sale.cart || []) {
                                day.totalQuantity += it.quantity || 0;
                                const perDay = itemsAggMap.get(key)!;
                                const prev = perDay.get(it.name) || { quantity: 0, revenue: 0 };
                                prev.quantity += it.quantity || 0;
                                prev.revenue += (it.price || 0) * (it.quantity || 0);
                                perDay.set(it.name, prev);
                            }
                        }

                        const dailyArr = Array.from(dailyMap.values()).map(day => {
                            const perDay = itemsAggMap.get(day.date)!;
                            day.items = Array.from(perDay.entries()).map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }));
                            return day;
                        }).sort((a, b) => b.date.localeCompare(a.date));

                        setDailySales(dailyArr);
                    } else {
                        setDailySales([]);
                    }

                    setError(null);
                } catch (fallbackErr: any) {
                    setError(err.message || 'Failed to fetch sales data.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchSales();
        }, 300);

        return () => clearTimeout(timer);
    }, [startDate, endDate, selectedCustomerId, selectedStatus, page, pageSize, sortBy, sortOrder]);

    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, selectedCustomerId, selectedStatus, sortBy, sortOrder]);

    const handleApplyFilters = (newFilters: { start: string; end: string; customer: string; status: string }) => {
        setStartDate(newFilters.start);
        setEndDate(newFilters.end);
        setSelectedCustomerId(newFilters.customer);
        setSelectedStatus(newFilters.status);
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedCustomerId('');
        setSelectedStatus('');
        setPage(1);
    };

    const handleExportCSV = () => {
        const headers = ['Transaction ID', 'Timestamp', 'Customer Name', 'Status', 'Subtotal', 'Tax', 'Discount', 'Total'];
        const rows = enrichedSales.map(s => [s.transactionId, new Date(s.timestamp).toLocaleString(), s.customerName || 'N/A', s.paymentStatus, s.subtotal.toFixed(2), s.tax.toFixed(2), s.discount.toFixed(2), s.total.toFixed(2)]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Sales Report", 14, 16);
        (doc as any).autoTable({
            head: [['ID', 'Date', 'Customer', 'Status', 'Total']],
            body: enrichedSales.map(s => [s.transactionId, new Date(s.timestamp).toLocaleDateString(), s.customerName || 'N/A', s.paymentStatus, formatCurrency(s.total, storeSettings)]),
            startY: 20,
        });
        doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white relative">
            <SalesHeader
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                mobileView={mobileView}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                setIsFilterSheetOpen={setIsFilterSheetOpen}
                hasActiveFilters={hasActiveFilters}
                startDate={startDate}
                endDate={endDate}
                selectedCustomerId={selectedCustomerId}
                resetFilters={resetFilters}
                customers={customers}
            />

            <MobileViewMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                mobileView={mobileView}
                setMobileView={setMobileView}
            />

            <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 min-w-0">
                <div className="max-w-7xl mx-auto">

                    {/* Filter Toggle Button (Desktop mainly, to show/hide the filter bar) */}
                    {/* The original code had `showFilters` logic but I noticed in the original file line 778 there is a button that sets IsFilterSheetOpen, but there is also a "Filter Chart" button.
                        However, line 677 says {showFilters && ...}.
                        Wait, where is setShowFilters called? Use search in original file.
                    */}
                    {/* Checking original file for setShowFilters usage... */}

                    <div className="hidden md:flex justify-end mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-all"
                        >
                            <span className="text-gray-500">Filters</span>
                            <div className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
                                <ChevronDownIcon className="w-4 h-4" />
                            </div>
                        </button>
                    </div>

                    <SalesFilterBar
                        showFilters={showFilters}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        selectedCustomerId={selectedCustomerId}
                        setSelectedCustomerId={setSelectedCustomerId}
                        customers={customers}
                        resetFilters={resetFilters}
                        handleExportCSV={handleExportCSV}
                        handleExportPDF={handleExportPDF}
                    />

                    <DashboardStats
                        mobileView={mobileView}
                        dailySales={dailySales}
                        stats={stats}
                        total={total}
                        storeSettings={storeSettings}
                        hasActiveFilters={hasActiveFilters}
                        onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
                    />

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-white rounded-2xl p-8 border border-gray-200">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <div className="text-gray-600">Loading sales data...</div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XMarkIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-red-900">Unable to Load Data</h3>
                                    <p className="text-red-700 mt-1">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && !error && (
                        <>
                            <DailySalesSummary
                                dailySales={dailySales}
                                mobileView={mobileView}
                                storeSettings={storeSettings}
                            />

                            {/* Sales List (Mobile View: History, Desktop: Always) */}
                            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${mobileView === 'history' ? 'block' : 'hidden md:block'}`}>
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                                            <p className="text-sm text-gray-500">
                                                {total} sale{total !== 1 ? 's' : ''} found
                                            </p>
                                        </div>

                                        {/* Summary Header */}
                                        {enrichedSales.length > 0 && (
                                            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-sm text-slate-600">Total Sales Value</div>
                                                        <div className="text-xl font-bold text-slate-900">
                                                            {formatCurrency(
                                                                enrichedSales.reduce((sum, sale) => sum + Number(sale.total), 0),
                                                                storeSettings
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <SalesList
                                    sales={enrichedSales}
                                    onSelectSale={setSelectedSale}
                                    storeSettings={storeSettings}
                                />

                                {/* Pagination Controls (Mobile Optimized) */}
                                <Pagination
                                    total={total}
                                    page={page}
                                    pageSize={pageSize}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                    label="transactions"
                                />
                            </div>

                            {/* Empty State */}
                            {salesData.length === 0 && !isLoading && (
                                <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ChartBarIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales found</h3>
                                        <p className="text-gray-600 mb-6">
                                            {hasActiveFilters
                                                ? 'Try adjusting your filters to see more results'
                                                : 'Sales will appear here once transactions are processed'}
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={resetFilters}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-colors"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            <SaleDetailModal
                isOpen={!!selectedSale}
                onClose={() => setSelectedSale(null)}
                sale={selectedSale}
                storeSettings={storeSettings}
            />

            <SalesFilterSheet
                isOpen={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                onApply={handleApplyFilters}
                onReset={resetFilters}
                initialFilters={{ start: startDate, end: endDate, customer: selectedCustomerId, status: selectedStatus }}
                customers={customers}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
            />
        </div>
    );
}
