import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import UserIcon from '../components/icons/UserIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import RefreshIcon from '../components/icons/RefreshIcon';
import DownloadIcon from '../components/icons/DownloadIcon';

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

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Select date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
                onClick={onClose}
            >
                {/* Sheet */}
                <div
                    className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${
                        isOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="pt-3 pb-2 flex justify-center">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Narrow down your sales data</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Date Range */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <label className="text-sm font-semibold text-gray-900">Date Range</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-600">From</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            id="sheet-start-date"
                                            value={tempStartDate}
                                            onChange={e => setTempStartDate(e.target.value)}
                                            className="w-full p-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {tempStartDate && (
                                            <button
                                                onClick={() => setTempStartDate('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-600">To</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            id="sheet-end-date"
                                            value={tempEndDate}
                                            onChange={e => setTempEndDate(e.target.value)}
                                            className="w-full p-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {tempEndDate && (
                                            <button
                                                onClick={() => setTempEndDate('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <label className="text-sm font-semibold text-gray-900">Customer</label>
                            </div>
                            <div className="relative">
                                <select
                                    id="sheet-customer-filter"
                                    value={tempCustomerId}
                                    onChange={e => setTempCustomerId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                >
                                    <option value="">All Customers</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-900">Payment Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: '', label: 'All', color: 'bg-gray-100 text-gray-700' },
                                    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' },
                                    { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700' },
                                    { value: 'partially_paid', label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
                                ].map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => setTempStatus(status.value)}
                                        className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            tempStatus === status.value
                                                ? `${status.color} ring-2 ring-offset-1 ring-current/20`
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleResetAndClose}
                                className="py-3.5 px-4 rounded-xl bg-white text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={handleApply}
                                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-blue-500/25"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const FilterBar: React.FC<{
    onOpenFilterSheet: () => void;
    onReset: () => void;
    filters: { start: string; end: string; customer: string; status: string };
    customers: Customer[];
    hasActiveFilters: boolean;
}> = ({ onOpenFilterSheet, onReset, filters, customers, hasActiveFilters }) => {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="md:hidden space-y-3">
            {/* Main Filter Button */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenFilterSheet}
                    className="flex-1 flex items-center justify-between p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FilterIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-semibold text-gray-900">Filters</div>
                            <div className="text-xs text-gray-500">
                                {hasActiveFilters ? 'Custom filters applied' : 'Add filters to narrow results'}
                            </div>
                        </div>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                </button>
                
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="p-3.5 rounded-xl bg-gradient-to-r from-red-50 to-red-100 text-red-700 font-semibold hover:from-red-100 hover:to-red-200 active:scale-[0.98] transition-all duration-200 border border-red-200"
                        title="Clear all filters"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Active Filters Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2" aria-label="Active filters">
                    {filters.start && filters.end && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-blue-100">
                            <CalendarIcon className="w-3 h-3" />
                            {formatDate(filters.start)} → {formatDate(filters.end)}
                        </span>
                    )}
                    {filters.customer && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-purple-100">
                            <UserIcon className="w-3 h-3" />
                            {customers.find(c => String(c.id) === String(filters.customer))?.name || filters.customer}
                        </span>
                    )}
                    {filters.status && (
                        <span className="inline-flex items-center gap-1.5 rounded-full capitalize bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-emerald-100">
                            {filters.status.replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};


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

    // Stats
    const stats = useMemo(() => {
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalSales = salesData.length;
        const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;
        const paidSales = salesData.filter(s => s.paymentStatus === 'paid').length;
        
        return { totalRevenue, totalSales, avgSaleValue, paidSales };
    }, [salesData]);

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
        <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white">
            <Header title="Sales History" />
            
            <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 min-w-0">
                <div className="max-w-7xl mx-auto">
                    {/* Mobile Stats Summary */}
                    <div className="md:hidden mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ChartBarIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-xs font-medium text-gray-600">Total Revenue</div>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue, storeSettings)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <ChartBarIcon className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="text-xs font-medium text-gray-600">Transactions</div>
                                </div>
                                <div className="text-xl font-bold text-gray-900">{stats.totalSales}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filter Bar */}
                    <div className="mb-6">
                        <FilterBar
                            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
                            onReset={resetFilters}
                            filters={{ start: startDate, end: endDate, customer: selectedCustomerId, status: selectedStatus }}
                            customers={customers}
                            hasActiveFilters={hasActiveFilters}
                        />
                    </div>

                    {/* Desktop Filters & Export */}
                    <div className="hidden md:block mb-6">
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 items-center">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={e => setStartDate(e.target.value)} 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={e => setEndDate(e.target.value)} 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Customer</label>
                                    <select 
                                        value={selectedCustomerId} 
                                        onChange={e => setSelectedCustomerId(e.target.value)} 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Customers</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Status</label>
                                    <select 
                                        value={selectedStatus} 
                                        onChange={e => setSelectedStatus(e.target.value)} 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="paid">Paid</option>
                                        <option value="unpaid">Unpaid</option>
                                        <option value="partially_paid">Partially Paid</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 lg:col-span-3 justify-end">
                                    <button 
                                        onClick={resetFilters}
                                        className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        onClick={handleExportCSV}
                                        className="px-4 py-2.5 rounded-xl bg-white text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        CSV
                                    </button>
                                    <button 
                                        onClick={handleExportPDF}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            {/* Daily Sales Summary (Mobile Optimized) */}
                            {dailySales && dailySales.length > 0 && (
                                <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                                                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">Daily Sales Breakdown</h3>
                                                    <p className="text-sm text-gray-500">Product performance by day</p>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {dailySales.length} day{dailySales.length !== 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="divide-y divide-gray-100">
                                        {dailySales.map(day => (
                                            <div key={day.date} className="hover:bg-gray-50/50 transition-colors">
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="font-semibold text-gray-900">
                                                            {new Date(day.date).toLocaleDateString('en-US', { 
                                                                weekday: 'short', 
                                                                month: 'short', 
                                                                day: 'numeric',
                                                                year: 'numeric' 
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-gray-600">
                                                                <span className="font-semibold">{day.totalQuantity.toLocaleString()}</span> units
                                                            </span>
                                                            <span className="font-bold text-gray-900">
                                                                {formatCurrency(day.totalRevenue, storeSettings)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Product Items */}
                                                    <div className="space-y-2">
                                                        {day.items.slice(0, 3).map((item, idx) => (
                                                            <div key={item.name + idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-600 font-medium">{item.quantity}</span>
                                                                    <span className="font-semibold text-gray-900">
                                                                        {formatCurrency(item.revenue, storeSettings)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {day.items.length > 3 && (
                                                            <div className="text-center">
                                                                <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                                                                    + {day.items.length - 3} more products
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sales List */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
                                            <p className="text-sm text-gray-500">
                                                {total} sale{total !== 1 ? 's' : ''} found
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {formatCurrency(stats.avgSaleValue, storeSettings)} avg. sale
                                        </div>
                                    </div>
                                </div>
                                
                                <SalesList
                                    sales={salesData}
                                    onSelectSale={setSelectedSale}
                                    storeSettings={storeSettings}
                                />

                                {/* Pagination Controls (Mobile Optimized) */}
                                {total > 0 && (
                                    <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            {/* Page Info */}
                                            <div className="text-sm text-gray-600">
                                                <span>
                                                    Showing <strong className="text-gray-900">{(page - 1) * pageSize + 1}</strong> -{' '}
                                                    <strong className="text-gray-900">{Math.min(page * pageSize, total)}</strong> of{' '}
                                                    <strong className="text-gray-900">{total.toLocaleString()}</strong> transactions
                                                </span>
                                            </div>
                                            
                                            {/* Controls */}
                                            <div className="flex items-center gap-3">
                                                {/* Rows per page */}
                                                <div className="flex items-center gap-2">
                                                    <label className="text-sm text-gray-600 hidden sm:block">Rows:</label>
                                                    <div className="relative">
                                                        <select
                                                            value={pageSize}
                                                            onChange={(e) => { 
                                                                setPageSize(parseInt(e.target.value, 10)); 
                                                                setPage(1); 
                                                            }}
                                                            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            {[10, 20, 50, 100].map(sz => (
                                                                <option key={sz} value={sz}>{sz}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Pagination Buttons */}
                                                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
                                                    <button
                                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                                        disabled={page <= 1}
                                                    >
                                                        ← Prev
                                                    </button>
                                                    <div className="px-3 py-1.5 text-sm font-medium text-gray-900">
                                                        {page}
                                                    </div>
                                                    <button
                                                        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))}
                                                        disabled={page * pageSize >= total}
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
            />
        </div>
    );
};

export default AllSalesPage;