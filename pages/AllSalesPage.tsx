import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Customer, StoreSettings } from '../types';
import Header from '../components/Header';
import SalesList from '../components/sales/SalesList';
import SaleDetailModal from '../components/sales/SaleDetailModal';
import { formatCurrency } from '../utils/currency';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
import GridIcon from '../components/icons/GridIcon';

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
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 animate-fade-in" />
            <div
                className="absolute top-[60px] right-4 left-auto w-72 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 flex flex-col max-h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Filter Sales</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Date Range */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date Range</label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500">From</label>
                                <input
                                    type="date"
                                    value={tempStartDate}
                                    onChange={e => setTempStartDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500">To</label>
                                <input
                                    type="date"
                                    value={tempEndDate}
                                    onChange={e => setTempEndDate(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-purple-500" />
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</label>
                        </div>
                        <div className="relative">
                            <select
                                value={tempCustomerId}
                                onChange={e => setTempCustomerId(e.target.value)}
                                className="w-full p-2 pr-8 rounded-lg border border-gray-200 bg-gray-50 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: '', label: 'All' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'unpaid', label: 'Unpaid' },
                                { value: 'partially_paid', label: 'Partial' },
                            ].map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setTempStatus(status.value)}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${tempStatus === status.value
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button
                        onClick={handleResetAndClose}
                        className="flex-1 py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold shadow-sm hover:bg-gray-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2 px-3 bg-gray-900 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};




// --- Main Page Component ---


const SimpleAreaChart: React.FC<{
    data: { date: string; totalRevenue: number }[];
    storeSettings: StoreSettings;
    color?: string;
}> = ({ data, storeSettings }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) return null;

    const height = 180;
    const width = 1000;
    const padding = { top: 20, bottom: 20 };

    // Sort and memoize data
    const sortedData = useMemo(() =>
        [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        , [data]);

    const maxVal = Math.max(...sortedData.map(d => d.totalRevenue)) || 1;

    const points = sortedData.map((d, i) => {
        const x = (i / (sortedData.length - 1 || 1)) * width;
        const normalizedY = (d.totalRevenue / maxVal);
        const y = height - (normalizedY * (height - padding.top - padding.bottom)) - padding.bottom;
        return { x, y, ...d };
    });

    const pathD = `M0,${height} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L${width},${height} Z`;
    const lineD = points.length === 1
        ? `M0,${points[0].y} L${width},${points[0].y}`
        : `M${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L${p.x},${p.y}`).join(' ');

    return (
        <div className="relative w-full h-full" onMouseLeave={() => setHoveredIndex(null)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                className="w-full h-full text-blue-500 overflow-visible"
            >
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                        <stop offset="90%" stopColor="currentColor" stopOpacity="0.0" />
                    </linearGradient>
                </defs>
                <path d={pathD} fill="url(#chartGradient)" />
                <path
                    d={lineD}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Interactive Overlay Columns */}
                {points.map((p, i) => (
                    <rect
                        key={i}
                        x={i === 0 ? 0 : points[i - 1].x + (p.x - points[i - 1].x) / 2}
                        y={0}
                        width={width / points.length}
                        height={height}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onClick={() => setHoveredIndex(i)}
                        onTouchStart={() => setHoveredIndex(i)}
                    />
                ))}

                {/* Visible Dots & Tooltip Indicator */}
                {points.map((p, i) => (
                    <g key={i}>
                        {(points.length < 15 || hoveredIndex === i) && (
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 6 : 3}
                                fill="white"
                                stroke="currentColor"
                                strokeWidth={hoveredIndex === i ? 3 : 2}
                                vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && points[hoveredIndex] && (
                <div
                    className="absolute bg-gray-900 text-white text-xs rounded-lg py-1 px-2 pointer-events-none shadow-xl transform -translate-x-1/2 -translate-y-full z-10"
                    style={{
                        left: `${(points[hoveredIndex].x / width) * 100}%`,
                        top: `${(points[hoveredIndex].y / height) * 100}%`,
                        marginTop: '-12px'
                    }}
                >
                    <div className="font-bold whitespace-nowrap">{formatCurrency(points[hoveredIndex].totalRevenue, storeSettings)}</div>
                    <div className="text-[10px] text-gray-300 whitespace-nowrap text-center">
                        {new Date(points[hoveredIndex].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            )}
        </div>
    );
};

const AllSalesPage: React.FC<AllSalesPageProps> = ({ customers, storeSettings }) => {
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'summary' | 'history'>('summary');
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
        return salesData.map(sale => {
            if (sale.customerName) return sale;
            if (!sale.customerId) return sale;
            const customer = customers.find(c => c.id === sale.customerId);
            return customer ? { ...sale, customerName: customer.name } : sale;
        });
    }, [salesData, customers]);

    // Stats
    const stats = useMemo(() => {
        const totalRevenue = enrichedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
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
            <Header title="Sales History" className="hidden md:block" />

            {/* Mobile Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 md:hidden">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">
                        {mobileView === 'summary' ? 'Sales Summary' : 'Sales History'}
                    </h1>
                    <div className="flex items-center space-x-2">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors ${isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                            aria-label="Menu"
                        >
                            <GridIcon className="w-6 h-6" />
                        </button>

                        {/* Filter Button */}
                        <button
                            onClick={() => setIsFilterSheetOpen(true)}
                            className={`p-2 rounded-lg active:bg-gray-100 transition-colors relative ${hasActiveFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                            aria-label="Filter options"
                        >
                            <FilterIcon className="w-6 h-6" />
                            {hasActiveFilters && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Active Filters Chips (Mobile) */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 pb-1">
                        {startDate && endDate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium border border-blue-100">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {selectedCustomerId && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 text-purple-700 px-2.5 py-1 text-xs font-medium border border-purple-100">
                                <UserIcon className="w-3 h-3" />
                                {customers.find(c => String(c.id) === String(selectedCustomerId))?.name || 'Customer'}
                            </span>
                        )}
                        {selectedStatus && (
                            <span className="inline-flex items-center gap-1.5 rounded-full capitalize bg-green-50 text-green-700 px-2.5 py-1 text-xs font-medium border border-green-100">
                                {selectedStatus.replace('_', ' ')}
                            </span>
                        )}
                        <button onClick={resetFilters} className="text-xs text-red-600 underline ml-1">
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Grid Menu Popup */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/50 animate-fade-in" />
                    {/* Position below header roughly */}
                    <div
                        className="absolute top-[60px] right-4 left-auto w-48 bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up border border-gray-100 p-2"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {
                                    setMobileView('summary');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${mobileView === 'summary'
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <ChartBarIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">Summary</span>
                            </button>
                            <button
                                onClick={() => {
                                    setMobileView('history');
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${mobileView === 'history'
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <RefreshIcon className="w-6 h-6 mb-1" />
                                <span className="text-xs font-semibold">History</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-6 min-w-0">
                <div className="max-w-7xl mx-auto">
                    {/* Mobile Stats Summary - Only in Summary View */}
                    <div className={`md:hidden space-y-4 mb-6 ${mobileView === 'summary' ? 'block' : 'hidden'}`}>
                        {/* 1. Top Stats Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <ChartBarIcon className="w-16 h-16" />
                                </div>
                                <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
                                <div className="text-xl font-bold text-gray-900 tracking-tight">
                                    {formatCurrency(
                                        // Try to use daily sales sum if available for more accurate "filtered" total, otherwise page stats
                                        dailySales.length > 0
                                            ? dailySales.reduce((sum, d) => sum + d.totalRevenue, 0)
                                            : stats.totalRevenue,
                                        storeSettings
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <ChartBarIcon className="w-16 h-16" />
                                </div>
                                <div className="text-sm font-medium text-gray-500 mb-1">Transactions</div>
                                <div className="text-xl font-bold text-gray-900 tracking-tight">
                                    {/* Use total count from API if available, else page stats */}
                                    {total > 0 ? total : stats.totalSales}
                                </div>
                            </div>
                        </div>

                        {/* 2. Graph Chart Card */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">Sales Trend</h3>
                                    <p className="text-xs text-gray-500">Revenue over specific period</p>
                                </div>
                                <button
                                    onClick={() => !hasActiveFilters && setIsFilterSheetOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
                                >
                                    <FilterIcon className="w-3 h-3" />
                                    <span>{hasActiveFilters ? 'Filtered' : 'Filter Chart'}</span>
                                </button>
                            </div>

                            <div className="h-48 w-full">
                                {dailySales && dailySales.length > 0 ? (
                                    <SimpleAreaChart data={dailySales} color="#2563eb" storeSettings={storeSettings} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                        <ChartBarIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <div className="text-xs">No chart data available</div>
                                        <button onClick={() => setIsFilterSheetOpen(true)} className="text-xs text-blue-600 font-medium mt-1">Select Date Range</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FilterBar removed - filters are in header */}

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
                            {/* Daily Sales Summary (Mobile View: Summary, Desktop: Always) */}
                            {dailySales && dailySales.length > 0 && (
                                <div className={`mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${mobileView === 'summary' ? 'block' : 'hidden md:block'}`}>
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
                                        <div className="text-sm text-gray-600">
                                            {formatCurrency(stats.avgSaleValue, storeSettings)} avg. sale
                                        </div>
                                    </div>
                                </div>

                                <SalesList
                                    sales={enrichedSales}
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