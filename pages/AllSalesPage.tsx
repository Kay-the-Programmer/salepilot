import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Customer, StoreSettings } from '../types';
import Header from '../components/Header';
import SalesList from '../components/sales/SalesList';
import SaleDetailModal from '../components/sales/SaleDetailModal';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import { api } from '../services/api';
import { dbService } from '../services/dbService';
import FilterIcon from '../components/icons/FilterIcon';
import XMarkIcon from '../components/icons/XMarkIcon';

interface AllSalesPageProps {
    customers: Customer[];
    storeSettings: StoreSettings;
}

// --- Subcomponents ---

const SalesFilterSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: { start: string; end: string; customer: string; status: string }) => void;
    onReset: () => void;
    initialFilters: { start: string; end: string; customer: string; status: string };
    customers: Customer[];
}> = ({ isOpen, onClose, onApply, onReset, initialFilters, customers }) => {
    const [tempStartDate, setTempStartDate] = useState(initialFilters.start);
    const [tempEndDate, setTempEndDate] = useState(initialFilters.end);
    const [tempCustomerId, setTempCustomerId] = useState(initialFilters.customer);
    const [tempStatus, setTempStatus] = useState(initialFilters.status);

    useEffect(() => {
        if (isOpen) {
            setTempStartDate(initialFilters.start);
            setTempEndDate(initialFilters.end);
            setTempCustomerId(initialFilters.customer);
            setTempStatus(initialFilters.status);
        }
    }, [isOpen, initialFilters]);

    const handleApply = () => {
        onApply({ start: tempStartDate, end: tempEndDate, customer: tempCustomerId, status: tempStatus });
        onClose();
    };

    const handleResetAndClose = () => {
        onReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={onClose}>
            <div
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg p-4 transform transition-transform duration-300 ease-in-out"
                style={{ transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button onClick={onClose} className="p-1"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="sheet-start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" id="sheet-start-date" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} className="mt-1 block w-full rounded-md border p-2 border-gray-300  shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="sheet-end-date" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" id="sheet-end-date" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} className="mt-1 block w-full rounded-md border p-2 border-gray-300 shadow-sm"/>
                    </div>
                    <div>
                        <label htmlFor="sheet-customer-filter" className="block text-sm font-medium text-gray-700">Customer</label>
                        <select id="sheet-customer-filter" value={tempCustomerId} onChange={e => setTempCustomerId(e.target.value)} className="mt-1 block w-full rounded-md border p-2 border-gray-300 shadow-sm">
                            <option value="">All Customers</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="sheet-status-filter" className="block text-sm font-medium text-gray-700">Status</label>
                        <select id="sheet-status-filter" value={tempStatus} onChange={e => setTempStatus(e.target.value)} className="mt-1 block w-full rounded-md border p-2 border-gray-300 shadow-sm">
                            <option value="">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partially_paid">Partially Paid</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button onClick={handleResetAndClose} className="w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Reset
                    </button>
                    <button onClick={handleApply} className="w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

const FilterBar: React.FC<{
    onOpenFilterSheet: () => void;
    onReset: () => void;
    filters: { start: string; end: string; customer: string; status: string };
    customers: Customer[];
    hasActiveFilters: boolean;
}> = ({ onOpenFilterSheet, onReset, filters, customers, hasActiveFilters }) => (
    <div className="md:hidden flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <button onClick={onOpenFilterSheet} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-800 rounded-md bg-white border shadow-sm hover:bg-gray-50">
                <FilterIcon className="w-5 h-5" />
                <span>Filters</span>
            </button>
            {hasActiveFilters && (
                <button onClick={onReset} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    Clear All
                </button>
            )}
        </div>
        {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
                {filters.start && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs ring-1 ring-inset ring-blue-200">
                        From: {filters.start}
                    </span>
                )}
                {filters.end && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs ring-1 ring-inset ring-blue-200">
                        To: {filters.end}
                    </span>
                )}
                {filters.customer && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs ring-1 ring-inset ring-blue-200">
                        {customers.find(c => String(c.id) === String(filters.customer))?.name || filters.customer}
                    </span>
                )}
                {filters.status && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs ring-1 ring-inset ring-blue-200 capitalize">
                        {filters.status.replace('_', ' ')}
                    </span>
                )}
            </div>
        )}
    </div>
);


// --- Main Page Component ---

const AllSalesPage: React.FC<AllSalesPageProps> = ({ customers, storeSettings }) => {
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
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

                const [fetchedSales, daily] = await Promise.all([
                    api.get<{ items: Sale[]; total: number; page: number; limit: number }>(`/sales?${params.toString()}`),
                    startDate && endDate ? api.get<{ daily: any }>(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`) : Promise.resolve({ daily: [] as any }),
                ]);
                setSalesData(fetchedSales.items);
                setTotal(fetchedSales.total);
                setDailySales((daily as any).daily || []);

                //Debugging taking place here
                console.log("Debugging the sales api response", fetchedSales.items)
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

                    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
    }, [startDate, endDate, selectedCustomerId, selectedStatus, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, selectedCustomerId, selectedStatus]);

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
        const rows = salesData.map(s => [ s.transactionId, new Date(s.timestamp).toLocaleString(), s.customerName || 'N/A', s.paymentStatus, s.subtotal.toFixed(2), s.tax.toFixed(2), s.discount.toFixed(2), s.total.toFixed(2) ]);
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
            body: salesData.map(s => [ s.transactionId, new Date(s.timestamp).toLocaleDateString(), s.customerName || 'N/A', s.paymentStatus, formatCurrency(s.total, storeSettings) ]),
            startY: 20,
        });
        doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <>
            <Header title="Sales History" />
            <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-4 lg:p-4 min-w-0">
                <div className="bg-gray-100 p-0 rounded-md mb-6 min-w-0">
                    {/* --- Mobile Filter Bar --- */}
                    <FilterBar
                        onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
                        onReset={resetFilters}
                        filters={{ start: startDate, end: endDate, customer: selectedCustomerId, status: selectedStatus }}
                        customers={customers}
                        hasActiveFilters={hasActiveFilters}
                    />

                    {/* --- Desktop Filters --- */}
                    <div className="hidden md:block">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 items-end">
                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm"/>
                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm"/>
                                <select id="customer-filter" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm">
                                    <option value="">All Customers</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select id="status-filter" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="p-2 border rounded-md text-sm w-full md:w-auto bg-white shadow-sm">
                                    <option value="">All Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="partially_paid">Partially Paid</option>
                                </select>
                            <div className="flex gap-2 flex-col sm:flex-row">
                                <button onClick={resetFilters} className="w-full sm:w-auto justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Reset</button>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                                <button onClick={handleExportCSV} className="w-full sm:w-1/2 justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-1" title="Export CSV" aria-label="Export CSV"><ArrowDownTrayIcon className="w-4 h-4" /> CSV</button>
                                <button onClick={handleExportPDF} className="w-full sm:w-1/2 justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 flex items-center gap-1" title="Export PDF" aria-label="Export PDF"><ArrowDownTrayIcon className="w-4 h-4" /> PDF</button>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && <div className="text-center p-10">Loading sales...</div>}
                {error && <div className="text-center p-10 text-red-500">Error: {error}</div>}
                {!isLoading && !error && (
                    <>
                        {dailySales && dailySales.length > 0 && (
                            <div className="p-2 mb-6 min-w-0 rounded-md bg-white shadow-sm ">
                                <h3 className="inline-block rounded-2xl bg-gray-50 text-base font-semibold text-gray-800 mb-2 p-2 px-4">
                                    Daily Sales (Products)
                                </h3>
                                <div className="space-y-2">
                                    {dailySales.map(day => (
                                        <div key={day.date} className="border bg-gray-50 rounded-md overflow-hidden">
                                            <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                                                <div className="font-medium text-gray-800">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div className="text-sm text-gray-600 flex items-center gap-4">
                                                    <span>Qty: <strong>{day.totalQuantity.toLocaleString()}</strong></span>
                                                    <span>Revenue: <strong>{formatCurrency(day.totalRevenue, storeSettings)}</strong></span>
                                                </div>
                                            </div>
                                            <div className="p-2 overflow-x-auto">
                                                <table className="min-w-full">
                                                    <thead>
                                                    <tr className="text-xs uppercase text-gray-500">
                                                        <th className="text-left px-2 py-1">Product</th>
                                                        <th className="text-center px-2 py-1">Qty</th>
                                                        <th className="text-right px-2 py-1">Revenue</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {day.items.map((item, idx) => (
                                                        <tr key={item.name + idx} className="border-t hover:bg-gray-50">
                                                            <td className="px-2 py-1 text-sm">{item.name}</td>
                                                            <td className="px-2 py-1 text-sm text-center">{item.quantity}</td>
                                                            <td className="px-2 py-1 text-sm text-right font-medium">{formatCurrency(item.revenue, storeSettings)}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <SalesList
                            sales={salesData}
                            onSelectSale={setSelectedSale}
                            storeSettings={storeSettings}
                        />

                        {/* Pagination Controls */}
                        <div className="mt-4 bg-white p-3 rounded-md border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-gray-600">
                                {total > 0 ? (
                                    <span>
                                        Showing <strong>{(page - 1) * pageSize + 1}</strong> - <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong>
                                    </span>
                                ) : (
                                    <span>No results</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Rows per page</label>
                                <select
                                    className="rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                                >
                                    {[10, 20, 50, 100].map(sz => (
                                        <option key={sz} value={sz}>{sz}</option>
                                    ))}
                                </select>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
                                        onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))}
                                        disabled={page * pageSize >= total}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

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
            />
        </>
    );
};

export default AllSalesPage;
