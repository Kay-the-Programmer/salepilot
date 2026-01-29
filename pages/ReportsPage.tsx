import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';

// Icons
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ReceiptTaxIcon from '../components/icons/ReceiptTaxIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import UsersIcon from '../components/icons/UsersIcon';
import HomeIcon from '../components/icons/HomeIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import FunnelIcon from '../components/icons/FunnelIcon';
import GridIcon from '../components/icons/GridIcon';

// Components
import { OverviewTab } from '../components/reports/OverviewTab';
import { SalesTab } from '../components/reports/SalesTab';
import { InventoryTab } from '../components/reports/InventoryTab';
import { CustomersTab } from '../components/reports/CustomersTab';
import { CashflowTab } from '../components/reports/CashflowTab';
import { PersonalUseTab } from '../components/reports/PersonalUseTab';

interface ReportsPageProps {
    storeSettings: StoreSettings;
    onClose?: () => void;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ReportsPage: React.FC<ReportsPageProps> = ({ storeSettings, onClose }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        return toDateInputString(d);
    });
    const [endDate, setEndDate] = useState(toDateInputString(new Date()));
    const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('reports.activeTab') || 'overview');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [datePreset, setDatePreset] = useState<'7d' | '30d' | 'month' | 'custom'>('30d');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [recentOrdersTab, setRecentOrdersTab] = useState<'all' | 'online' | 'pos'>('all');

    const [reportData, setReportData] = useState<any | null>(null);
    const [dailySales, setDailySales] = useState<any[] | null>(null);
    const [dailyPage, setDailyPage] = useState<number>(1);
    const [dailyPageSize, setDailyPageSize] = useState<number>(5);
    const [personalUse, setPersonalUse] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <HomeIcon className="w-4 h-4" /> },
        { id: 'sales', label: 'Sales', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventory', icon: <ArchiveBoxIcon className="w-4 h-4" /> },
        { id: 'customers', label: 'Customers', icon: <UsersIcon className="w-4 h-4" /> },
        { id: 'cashflow', label: 'Cashflow', icon: <TrendingUpIcon className="w-4 h-4" /> },
        { id: 'personal-use', label: 'Personal', icon: <ReceiptTaxIcon className="w-4 h-4" /> },
    ];

    useEffect(() => {
        localStorage.setItem('reports.activeTab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        const fetchReportData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [dash, daily, pu] = await Promise.all([
                    api.get<any>(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                    api.get<any>(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
                    api.get<any>(`/reports/personal-use?startDate=${startDate}&endDate=${endDate}`),
                ]);
                setReportData(dash);
                setDailySales(daily.daily || []);
                setPersonalUse(pu.items || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportData();
    }, [startDate, endDate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const setDateRange = (days: number, preset: '7d' | '30d' | 'month') => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
        setDatePreset(preset);
    };

    const setThisMonth = () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), end.getMonth(), 1);
        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
        setDatePreset('month');
    }

    const salesTrend = useMemo(() => {
        if (!reportData?.sales?.salesTrend) return [];
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toDateInputString(d);
            trend.push({
                date: dateStr,
                value1: reportData.sales.salesTrend[dateStr]?.revenue || 0,
                value2: reportData.sales.salesTrend[dateStr]?.profit || 0,
            });
        }
        return trend;
    }, [reportData, startDate, endDate]);

    const cashflowTrend = useMemo(() => {
        if (!reportData?.cashflow?.cashflowTrend) return [];
        const trend = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = toDateInputString(d);
            trend.push({
                date: dateStr,
                value1: reportData.cashflow.cashflowTrend[dateStr]?.inflow || 0,
                value2: reportData.cashflow.cashflowTrend[dateStr]?.outflow || 0,
            });
        }
        return trend;
    }, [reportData, startDate, endDate]);

    const handleExportCSV = () => {
        const dateString = `${startDate}_to_${endDate}`;
        let headers: string[] = [];
        let rows: any[][] = [];

        if (activeTab === 'sales' && reportData?.sales) {
            headers = ['Product Name', 'Units Sold', 'Total Revenue'];
            rows = reportData.sales.topProductsByRevenue.map((p: any) => [p.name, p.quantity, p.revenue]);
        }

        if (headers.length === 0) {
            alert("No data to export for this tab.");
            return;
        }

        const escapeCsvCell = (cell: any) => {
            if (cell == null) return '';
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
        };

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.map(escapeCsvCell).join(",")).join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${activeTab}_report_${dateString}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const dateString = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;

        doc.setFontSize(18);
        doc.text(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date Range: ${dateString}`, 14, 29);

        if (activeTab === 'sales' && reportData?.sales) {
            (doc as any).autoTable({
                startY: 35,
                body: [
                    [`Revenue: ${formatCurrency(reportData.sales.totalRevenue, storeSettings)}`, `Gross Profit: ${formatCurrency(reportData.sales.totalProfit, storeSettings)}`],
                    [`Transactions: ${reportData.sales.totalTransactions}`, `Avg. Sale: ${formatCurrency(reportData.sales.avgSaleValue, storeSettings)}`],
                ],
                theme: 'plain',
            });
            (doc as any).autoTable({
                head: [['Top Products by Revenue', 'Revenue']],
                body: reportData.sales.topProductsByRevenue.map((p: any) => [p.name, formatCurrency(p.revenue, storeSettings)]),
                startY: (doc as any).lastAutoTable.finalY + 10,
            });
        }

        doc.save(`${activeTab}_report_${dateString}.pdf`);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="text-gray-600">Loading report data...</div>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6 text-center">
                    <div className="text-red-500 mb-2">⚠️ Error loading report</div>
                    <div className="text-gray-600 text-sm mb-4">{error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (!reportData) {
            return (
                <div className="p-6 text-center text-gray-500">
                    No data available for the selected period.
                </div>
            );
        }

        switch (activeTab) {
            case 'overview': {
                const userJson = localStorage.getItem('salePilotUser');
                const userName = userJson ? JSON.parse(userJson).name : undefined;

                return (
                    <OverviewTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                        userName={userName}
                        recentOrdersTab={recentOrdersTab}
                        setRecentOrdersTab={setRecentOrdersTab}
                    />
                );
            }
            case 'sales':
                return (
                    <SalesTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                        salesTrend={salesTrend}
                        dailySales={dailySales}
                        dailyPage={dailyPage}
                        setDailyPage={setDailyPage}
                        dailyPageSize={dailyPageSize}
                        setDailyPageSize={setDailyPageSize}
                    />
                );

            case 'inventory':
                return (
                    <InventoryTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                    />
                );

            case 'customers':
                return (
                    <CustomersTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                    />
                );

            case 'cashflow':
                return (
                    <CashflowTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                        cashflowTrend={cashflowTrend}
                        onClose={onClose}
                    />
                );

            case 'personal-use':
                return (
                    <PersonalUseTab
                        personalUse={personalUse}
                        storeSettings={storeSettings}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full glass-effect relative">

            {/* Header */}
            <div className="sticky top-0 z-40 glass-effect px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-lg active:bg-gray-100"
                                aria-label="Close"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-600" />
                            </button>
                        )}
                        <div className="ml-2">
                            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                            <div className="text-xs text-gray-500">
                                {datePreset === 'custom'
                                    ? `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                    : datePreset === '7d' ? 'Last 7 days'
                                        : datePreset === '30d' ? 'Last 30 days'
                                            : 'This month'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Desktop Tabs  */}
                    <div className="hidden md:flex  shadow-lg rounded-3xl border border-white items-center gap-3 mx-6">
                        <div className="flex glass-effect p-1 rounded-3xl shrink-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-1.5 rounded-2xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-gray-200 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center  p-1 rounded-xl space-x-2">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 px-4 rounded-3xl bg-white shadow-lg flex items-center gap-2  active:bg-gray-200 text-gray-600"
                            aria-label="Menu"
                        >
                            <GridIcon className="w-5 h-5" />
                        </button>

                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 flex items-center gap-2 bg-white shadow-lg rounded-3xl px-4 active:bg-gray-200 transition-colors ${showFilters ? 'bg-gray-100 text-gray-900' : 'text-gray-600'}`}
                                aria-label="Filter options"
                            >
                                <FunnelIcon className="w-5 h-5" />
                                <span className="text-xs font-semibold text-gray-500 tracking-wider">Filter</span>
                            </button>

                            {/* Floating Filter Popup */}
                            {showFilters && (
                                <div className="absolute right-0 top-full mt-2 w-[400px] bg-white rounded-2xl shadow-xl border border-gray-100 z-30 animate-fade-in origin-top-right p-4 hidden md:block">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-gray-900">Filter Report</h3>
                                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Range</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setDateRange(7, '7d')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${datePreset === '7d' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    Last 7 Days
                                                </button>
                                                <button
                                                    onClick={() => setDateRange(30, '30d')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${datePreset === '30d' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    Last 30 Days
                                                </button>
                                                <button
                                                    onClick={setThisMonth}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${datePreset === 'month' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    This Month
                                                </button>
                                                <button
                                                    onClick={() => setDatePreset('custom')}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${datePreset === 'custom' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    Custom Range
                                                </button>
                                            </div>
                                        </div>

                                        {datePreset === 'custom' && (
                                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                                <div className="space-y-1 flex-1">
                                                    <label className="text-xs font-medium text-gray-600">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="block w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <label className="text-xs font-medium text-gray-600">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="block w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                                            <button
                                                onClick={() => setShowFilters(false)}
                                                className="text-sm text-blue-600 font-medium hover:text-blue-700"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Grid Menu Popup */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 backdrop-blur-3xl bg-gray-900/50 md:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)}>
                    {/* Position slightly below header */}
                    <div
                        className="absolute top-[70px] right-4 left-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl p-5 animate-fade-in-up border border-gray-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-3 gap-4">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${isActive
                                            ? 'bg-gray-900/90 text-white shadow-lg'
                                            : 'bg-gray-50/90 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className={`mb-2 p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                                            {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                                        </div>
                                        <span className="text-xs font-semibold">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto w-full">

                    {renderContent()}
                </div>
            </main>

            {/* Mobile Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 animate-fade-in flex items-end md:items-center justify-center md:hidden">
                    <div className="bg-white w-full md:w-auto md:min-w-[400px] rounded-t-3xl md:rounded-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="p-2 rounded-lg active:bg-gray-100"
                                    aria-label="Close filters"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => { setDateRange(7, '7d'); setShowFilters(false); }}
                                            className={`p-3 rounded-xl border-2 ${datePreset === '7d' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
                                        >
                                            <div className="text-sm font-medium">7 Days</div>
                                        </button>
                                        <button
                                            onClick={() => { setDateRange(30, '30d'); setShowFilters(false); }}
                                            className={`p-3 rounded-xl border-2 ${datePreset === '30d' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
                                        >
                                            <div className="text-sm font-medium">30 Days</div>
                                        </button>
                                        <button
                                            onClick={() => { setThisMonth(); setShowFilters(false); }}
                                            className={`p-3 rounded-xl border-2 ${datePreset === 'month' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
                                        >
                                            <div className="text-sm font-medium">This Month</div>
                                        </button>
                                        <button
                                            onClick={() => setDatePreset('custom')}
                                            className={`p-3 rounded-xl border-2 ${datePreset === 'custom' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
                                        >
                                            <div className="text-sm font-medium">Custom</div>
                                        </button>
                                    </div>
                                </div>

                                {datePreset === 'custom' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl active:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="flex-1 py-3 px-4 bg-gray-900 text-white font-medium rounded-xl active:bg-gray-800"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for safe areas and animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .safe-area-top {
                    padding-top: env(safe-area-inset-top, 0px);
                }
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 0px);
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            ` }} />
        </div>
    );
};

export default ReportsPage;