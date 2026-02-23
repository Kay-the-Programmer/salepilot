import { useState, useMemo, useEffect, useCallback } from 'react';
import Pagination from '../components/ui/Pagination';
import SocketService from '../services/socketService';
import { Sale, Customer, StoreSettings } from '../types';
import SalesList from '../components/sales/SalesList';
import SaleDetailModal from '../components/sales/SaleDetailModal';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { api } from '../services/api';
import { dbService } from '../services/dbService';
import XMarkIcon from '../components/icons/XMarkIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';

// New Modular Components
import SalesHeader from '../components/sales/all_sales/SalesHeader';
// Removed unused MobileViewMenu import
import SalesFilterSheet from '../components/sales/all_sales/SalesFilterSheet';

import DashboardStats from '../components/sales/all_sales/DashboardStats';
import DailySalesSummary from '../components/sales/all_sales/DailySalesSummary';
import SaleDetailContent from '../components/sales/SaleDetailContent';
import ReceiptModal from '../components/sales/ReceiptModal';
import PrinterIcon from '../components/icons/PrinterIcon';

interface AllSalesPageProps {
    customers: Customer[];
    storeSettings: StoreSettings;
}

export default function AllSalesPage({ customers, storeSettings }: AllSalesPageProps) {
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'summary' | 'history'>('history');
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
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const hasActiveFilters = useMemo(() => !!(startDate || endDate || selectedCustomerId || selectedStatus), [startDate, endDate, selectedCustomerId, selectedStatus]);
    const [dailySales, setDailySales] = useState<{ date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }[]>([]);

    // View Mode for SalesList
    const [salesListViewMode] = useState<'grid' | 'list'>('list');

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

    const fetchSales = useCallback(async () => {
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
    }, [startDate, endDate, selectedCustomerId, selectedStatus, page, pageSize, sortBy, sortOrder]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSales();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchSales]); // fetchSales is now a stable dependency due to useCallback

    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, selectedCustomerId, selectedStatus, sortBy, sortOrder]);

    // Socket.io integration for real-time updates
    useEffect(() => {
        if (storeSettings?.storeId) {
            const socketService = SocketService.getInstance();
            socketService.joinStore(storeSettings.storeId);

            const handleNewSaleOrOrder = () => {
                console.log('New sale or order received via socket, refreshing sales...');
                fetchSales(); // This will trigger a re-fetch of sales data
            };

            socketService.on('new_sale', handleNewSaleOrOrder);
            socketService.on('new_order', handleNewSaleOrOrder);

            return () => {
                socketService.off('new_sale', handleNewSaleOrOrder);
                socketService.off('new_order', handleNewSaleOrOrder);
                socketService.leaveStore(storeSettings.storeId);
            };
        }
    }, [storeSettings?.storeId, fetchSales]); // fetchSales is a stable dependency

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
        <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-950 relative selection:bg-blue-500/30">
            <SalesHeader
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                mobileView={mobileView}
                setMobileView={setMobileView}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                setIsFilterSheetOpen={setIsFilterSheetOpen}
                hasActiveFilters={hasActiveFilters}
                startDate={startDate}
                endDate={endDate}
                selectedCustomerId={selectedCustomerId}
                resetFilters={resetFilters}
                customers={customers}
                total={total}
            />


            <main className="flex-1 overflow-hidden bg-transparent min-w-0 flex flex-col max-w-[1400px] mx-auto w-full">
                <div className="w-full h-full flex flex-col">

                    {/* Filter Toggle Button is now inside SalesHeader */}

                    <div className="flex-none px-4 md:px-6">


                        <DashboardStats
                            mobileView={mobileView}
                            dailySales={dailySales}
                            stats={stats}
                            total={total}
                            storeSettings={storeSettings}
                            hasActiveFilters={hasActiveFilters}
                            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
                        />
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-white dark:bg-slate-900/60 rounded-[24px] p-8 border border-slate-200/50 dark:border-white/5 mt-4 shadow-sm mx-4 md:mx-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                                <div className="text-[15px] font-bold text-slate-600 dark:text-slate-400 tracking-wide">Loading sales data...</div>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-[24px] p-6 mt-4 mx-4 md:mx-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 rounded-[14px]">
                                    <XMarkIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[15px] font-bold text-rose-900 dark:text-rose-200 mb-1">Unable to Load Data</h3>
                                    <p className="text-[13px] font-medium text-rose-700 dark:text-rose-300">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-[14px] text-[13px] font-bold tracking-wide shadow-sm hover:bg-rose-700 transition-colors active:scale-95 transition-all duration-300"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && !error && (
                        <div className="flex-1 flex flex-col min-h-0 gap-0">
                            <div className="flex-none px-4 md:px-6 mb-0">
                                <DailySalesSummary
                                    dailySales={dailySales}
                                    mobileView={mobileView}
                                    storeSettings={storeSettings}
                                />
                            </div>

                            {/* Split View Container */}
                            <div className="flex-1 flex min-h-0 m-0">
                                {/* Left Column: Sales List */}
                                <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden ${mobileView === 'history' ? 'block' : 'hidden md:flex'}`}>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 px-4 md:px-6 pb-6">
                                        {salesData.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-900/60 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[20px] flex items-center justify-center mb-5 rotate-3 transition-transform hover:rotate-6">
                                                    <ChartBarIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2 tracking-tight">No sales found</h3>
                                                <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                                                    {hasActiveFilters
                                                        ? 'Try adjusting your filters to see more results.'
                                                        : 'Sales will appear here once transactions are processed.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={resetFilters}
                                                        className="px-6 py-3 bg-blue-600 text-white text-[14px] font-bold tracking-wide rounded-[16px] hover:bg-blue-700 transition-colors active:scale-95 shadow-md"
                                                    >
                                                        Clear All Filters
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900/60 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden">
                                                <SalesList
                                                    sales={enrichedSales}
                                                    onSelectSale={setSelectedSale}
                                                    storeSettings={storeSettings}
                                                    viewMode={salesListViewMode}
                                                    selectedSaleId={selectedSale?.transactionId}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Controls (Fixed Bottom) */}
                                    <div className="p-4 md:px-6 flex-none bg-slate-50 dark:bg-slate-950 border-t border-transparent z-10">
                                        <Pagination
                                            total={total}
                                            page={page}
                                            pageSize={pageSize}
                                            onPageChange={setPage}
                                            onPageSizeChange={setPageSize}
                                            label="transactions"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Sale Details (Desktop) */}
                                {selectedSale && (
                                    <div className="hidden xl:flex w-[450px] flex-col bg-white dark:bg-slate-900/90 backdrop-blur-3xl border-l border-slate-200/50 dark:border-white/5 shadow-2xl overflow-hidden animate-fade-in-right z-20">
                                        <div className="p-5 px-6 flex justify-between items-center flex-none border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Sale Details</h3>
                                            <button
                                                onClick={() => setSelectedSale(null)}
                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 active:scale-95 touch-manipulation"
                                            >
                                                <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                                            <SaleDetailContent sale={selectedSale} storeSettings={storeSettings} />
                                        </div>
                                        <div className="p-5 px-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20 flex-none">
                                            <div className="flex gap-3">
                                                <button
                                                    className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[16px] text-[14px] font-bold tracking-wide text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                                                    onClick={() => setIsReceiptOpen(true)}
                                                >
                                                    <PrinterIcon className="w-4.5 h-4.5" />
                                                    Print Receipt
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <SaleDetailModal
                isOpen={!!selectedSale && (window.innerWidth < 1280)} // Only show modal on smaller screens
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
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
            />

            {isReceiptOpen && selectedSale && (
                <ReceiptModal
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    saleData={selectedSale}
                    storeSettings={storeSettings}
                    showSnackbar={() => { }}
                />
            )}
        </div>
    );
}
