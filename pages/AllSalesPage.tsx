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
        <div className="flex flex-col min-h-[100dvh] bg-slate-50/50 dark:bg-slate-950/50 relative selection:bg-blue-500/30">
            <SalesHeader
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                mobileView={mobileView}
                setMobileView={setMobileView}
                hasActiveFilters={hasActiveFilters}
                startDate={startDate}
                endDate={endDate}
                selectedCustomerId={selectedCustomerId}
                resetFilters={resetFilters}
                customers={customers}
                total={total}
                isFilterOpen={isFilterSheetOpen}
                setIsFilterOpen={setIsFilterSheetOpen}
                onApplyFilters={handleApplyFilters}
                initialFilters={{ start: startDate, end: endDate, customer: selectedCustomerId, status: selectedStatus }}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
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
                        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[32px] p-12 border border-slate-200/50 dark:border-white/5 mt-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] mx-4 md:mx-6 flex flex-col items-center justify-center space-y-6 animate-pulse">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-xl"></div>
                                <div className="w-14 h-14 border-4 border-slate-100 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin relative z-10 shadow-sm"></div>
                            </div>
                            <div className="text-[15px] font-bold text-slate-600 dark:text-slate-400 tracking-wide">Fetching recent transactions...</div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-rose-200/50 dark:border-rose-500/20 rounded-[32px] p-8 mt-6 mx-4 md:mx-6 shadow-[0_8px_30px_rgb(225,29,72,0.06)] dark:shadow-[0_8px_30px_rgb(225,29,72,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="flex items-start gap-5 relative z-10">
                                <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 rounded-[20px] shadow-inner text-rose-600 dark:text-rose-400">
                                    <XMarkIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">Unable to Load Sales Data</h3>
                                    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{error}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[16px] text-[14px] font-bold tracking-wide shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all duration-300"
                                    >
                                        Try Again
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
                                            <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/50 pointer-events-none"></div>
                                                <div className="relative w-20 h-20 mb-6 group">
                                                    <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                                                    <div className="relative w-full h-full bg-white dark:bg-slate-800 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center rotate-3 group-hover:rotate-6 transition-all duration-300 border border-slate-100 dark:border-white/5">
                                                        <ChartBarIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                                    </div>
                                                </div>
                                                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-2 tracking-tight relative z-10">No transactions found</h3>
                                                <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed relative z-10">
                                                    {hasActiveFilters
                                                        ? 'Try modifying your search or clearing active filters to find what you are looking for.'
                                                        : 'Your sales history will elegantly appear here once you start processing transactions.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        onClick={resetFilters}
                                                        className="relative z-10 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[14px] font-bold tracking-wide rounded-[18px] hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 shadow-[0_8px_20px_rgb(0,0,0,0.12)] transition-all duration-300"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden">
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
                                    <div className="hidden xl:flex w-[450px] flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-l border-slate-200/50 dark:border-white/5 shadow-[-20px_0_40px_rgb(0,0,0,0.04)] dark:shadow-[-20px_0_40px_rgb(0,0,0,0.2)] overflow-hidden animate-fade-in-right z-20">
                                        <div className="relative p-6 flex items-center justify-center flex-none border-b border-slate-100/80 dark:border-white/5 bg-transparent">
                                            <div className="text-center">
                                                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">Sale Details</h3>
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase font-mono">{selectedSale.transactionId}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedSale(null)}
                                                className="absolute right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 active:scale-95"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                                            <SaleDetailContent sale={selectedSale} storeSettings={storeSettings} />
                                        </div>
                                        <div className="p-5 px-6 border-t border-slate-100/80 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl flex-none">
                                            <button
                                                className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[18px] text-[15px] font-bold tracking-wide shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                                                onClick={() => setIsReceiptOpen(true)}
                                            >
                                                <PrinterIcon className="w-5 h-5" />
                                                View Receipt
                                            </button>
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
