import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import MinusCircleIcon from '../components/icons/MinusCircleIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ScaleIcon from '../components/icons/ScaleIcon';

import ReceiptTaxIcon from '../components/icons/ReceiptTaxIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import UsersIcon from '../components/icons/UsersIcon';
import { formatCurrency } from '../utils/currency';
import PlusIcon from '../components/icons/PlusIcon';
import TrendingDownIcon from '../components/icons/TrendingDownIcon';
import { api } from '../services/api';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import FunnelIcon from '../components/icons/FunnelIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import GridIcon from '../components/icons/GridIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import { RevenueChart, SalesChannelChart, StatSparkline } from '../components/reports/DashboardCharts';
import HomeIcon from '../components/icons/HomeIcon';
import { AiSummaryCard } from '../components/reports/AiSummaryCard';
import { OnboardingTaskList } from '../components/reports/OnboardingTaskList';
import { FilterableStatCard } from '../components/reports/FilterableStatCard';
import { FilterableRevenueChart } from '../components/reports/FilterableRevenueChart';
import { FilterableSalesChannelChart } from '../components/reports/FilterableSalesChannelChart';
import { FilterableTopSales } from '../components/reports/FilterableTopSales';

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

// Enhanced StatCard with better mobile styling
const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    noWrap?: boolean;
    compact?: boolean;
}> = ({ title, value, icon, color, noWrap = false, compact = false }) => (
    <div className={`relative overflow-hidden rounded-2xl glass-effect p-4 shadow-lg border border-gray-100/50 
        ${compact ? 'p-3' : 'p-4 sm:p-5'} 
        transition-all duration-200 hover:shadow-xl active:scale-[0.99]`}>
        <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full ${color} opacity-10`}></div>
        <div className="flex items-start">
            <div className={`flex-shrink-0 rounded-xl p-2.5 sm:p-3 ${color} bg-opacity-15`}>
                {icon}
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                <div className={`${noWrap ? 'whitespace-nowrap' : ''} text-xs sm:text-sm font-medium text-gray-500 mb-1`}>
                    {title}
                </div>
                <div className={`text-lg sm:text-xl font-bold text-gray-900 leading-tight ${noWrap ? 'whitespace-nowrap' : ''}`}>
                    {value}
                </div>
            </div>
        </div>
    </div>
);

// Simplified chart component for mobile
const MobileChart: React.FC<{
    data: { date: string; value1: number; value2: number }[];
    labels: [string, string];
    colors: [string, string];
    storeSettings: StoreSettings;
    height?: number;
}> = ({ data, labels, colors, storeSettings, height = 160 }) => {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                    <div className="text-sm">No data available</div>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.flatMap(d => [d.value1, d.value2]), 0) * 1.1 || 100;

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[0] }}></div>
                        <span className="text-xs font-medium text-gray-600">{labels[0]}</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors[1] }}></div>
                        <span className="text-xs font-medium text-gray-600">{labels[1]}</span>
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {data.length} days
                </div>
            </div>

            <div className="relative ml-16 mr-8" style={{ height: `${height}px` }}>
                <div className="absolute inset-0 flex items-end">
                    {data.map((point, index) => {
                        const left = `${(index / (data.length - 1 || 1)) * 100}%`;
                        const barWidth = `${80 / data.length}%`;
                        const height1 = maxValue ? `${(point.value1 / maxValue) * 85}%` : '0%';
                        const height2 = maxValue ? `${(point.value2 / maxValue) * 85}%` : '0%';

                        return (
                            <div key={index} className="absolute bottom-0 flex flex-col items-center" style={{ left, width: barWidth, transform: 'translateX(-50%)' }}>
                                <div className="relative w-full flex flex-col items-center">
                                    <div
                                        className="w-3/4 rounded-t-sm opacity-80"
                                        style={{
                                            height: height1,
                                            backgroundColor: colors[0],
                                            minHeight: '2px'
                                        }}
                                    />
                                    <div
                                        className="w-1/2 rounded-t-sm mt-1"
                                        style={{
                                            height: height2,
                                            backgroundColor: colors[1],
                                            minHeight: '2px'
                                        }}
                                    />
                                </div>
                                {index % Math.ceil(data.length / 5) === 0 && (
                                    <div className="absolute -bottom-6 text-[10px] text-gray-500 whitespace-nowrap">
                                        {new Date(point.date).getDate()}/{new Date(point.date).getMonth() + 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Y-axis markers */}
                {[0, 0.25, 0.5, 0.75, 1].map((tick, idx) => (
                    <div
                        key={idx}
                        className="absolute left-0 right-0 border-t border-gray-200 border-dashed"
                        style={{ bottom: `${tick * 85}%` }}
                    >
                        <div className="absolute -left-2 -top-2 transform -translate-x-full pr-2 text-xs text-gray-400">
                            {formatCurrency(maxValue * (1 - tick), storeSettings)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Enhanced TableRow for mobile
const MobileTableRow: React.FC<{
    label: string;
    value: string;
    rank: number;
    subLabel?: string;
    onClick?: () => void;
}> = ({ label, value, rank, subLabel, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 ${onClick ? 'active:bg-gray-50 cursor-pointer' : ''}`}
    >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
            {rank}
        </div>
        <div className="ml-3 flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{label}</div>
            {subLabel && (
                <div className="text-xs text-gray-500">{subLabel}</div>
            )}
        </div>
        <div className="ml-2 text-sm font-semibold text-gray-900">{value}</div>
    </div>
);

// Native-like tab bar for mobile
const MobileTabBar: React.FC<{
    tabs: { id: string; label: string; icon?: React.ReactNode }[];
    activeTab: string;
    onChange: (tab: string) => void;
}> = ({ tabs, activeTab, onChange }) => (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-1 py-2">
        <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg mx-1 flex items-center space-x-2 transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                </button>
            ))}
        </div>
    </div>
);

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
                const sales = reportData.sales;
                // Get user name from local storage or context if available (mocking for now or safe fallback)
                const userJson = localStorage.getItem('salePilotUser');
                const userName = userJson ? JSON.parse(userJson).name : undefined;

                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        {/* Onboarding Task List for new users */}
                        {reportData.sales.totalRevenue === 0 && (
                            <OnboardingTaskList
                                stats={{
                                    totalUnits: reportData.inventory.totalUnits,
                                    totalSuppliers: reportData.customers.totalSuppliers,
                                    totalCustomers: reportData.customers.totalCustomers,
                                }}
                            />
                        )}

                        {/* AI Summary Card */}
                        <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={userName} />

                        {reportData.sales.totalRevenue > 0 && (
                            <>
                                {/* Row 1: Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Total Earnings */}
                                    <FilterableStatCard
                                        title="Total Earnings"
                                        type="revenue"
                                        icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />}
                                        color="bg-emerald-100"
                                        sparklineColor="#10b981"
                                        storeSettings={storeSettings}
                                    />

                                    {/* Card 2: Total Orders */}
                                    <FilterableStatCard
                                        title="Total Orders"
                                        type="orders"
                                        icon={<ShoppingCartIcon className="w-5 h-5 text-orange-600" />}
                                        color="bg-orange-100"
                                        sparklineColor="#f97316"
                                        storeSettings={storeSettings}
                                    />

                                    {/* Card 3: Customers */}
                                    <FilterableStatCard
                                        title="Customers"
                                        type="customers"
                                        icon={<UsersIcon className="w-5 h-5 text-indigo-600" />}
                                        color="bg-indigo-100"
                                        sparklineColor="#6366f1"
                                        storeSettings={storeSettings}
                                    />

                                    {/* Card 4: Net Profit */}
                                    <FilterableStatCard
                                        title="Net Profit"
                                        type="profit"
                                        icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}
                                        color="bg-blue-100"
                                        sparklineColor="#3b82f6"
                                        storeSettings={storeSettings}
                                    />
                                </div>

                                {/* Row 2: Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <FilterableRevenueChart storeSettings={storeSettings} />
                                    <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                                </div>

                                {/* Row 3: Recent Orders & Top Sales */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Recent Orders - 2 Cols */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-slate-900 text-lg">Recent Orders</h3>
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                {(['all', 'online', 'pos'] as const).map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setRecentOrdersTab(tab)}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${recentOrdersTab === tab
                                                            ? 'bg-white text-slate-900 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        {tab === 'all' ? 'All' : tab === 'online' ? 'Online' : 'In-Store'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product ID</th>
                                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                                        <th className="py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {reportData.sales.recentOrders
                                                        ?.filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab)
                                                        .slice(0, 5)
                                                        .map((order: any, i: number) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 text-sm text-slate-600 font-medium truncate max-w-[100px]" title={order.transactionId}>
                                                                    #{order.transactionId.substring(0, 8)}...
                                                                </td>
                                                                <td className="py-3 text-sm text-slate-900 flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                        {(order.customerName || 'W').charAt(0)}
                                                                    </div>
                                                                    {order.customerName || 'Walk-in Customer'}
                                                                </td>
                                                                <td className="py-3 text-sm text-slate-900 font-bold">
                                                                    {formatCurrency(order.total, storeSettings)}
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {(!reportData.sales.recentOrders || reportData.sales.recentOrders
                                                        .filter((order: any) => recentOrdersTab === 'all' || order.channel === recentOrdersTab).length === 0) && (
                                                            <tr>
                                                                <td colSpan={4} className="py-8 text-center text-slate-400">
                                                                    No recent {recentOrdersTab === 'all' ? '' : recentOrdersTab === 'online' ? 'online' : 'in-store'} orders found
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Top Sale - 1 Col */}
                                    <FilterableTopSales storeSettings={storeSettings} />
                                </div>
                            </>
                        )}
                    </div>
                );
            }
            case 'sales':
                const sales = reportData.sales;
                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        {/* Row 1: Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Revenue"
                                value={formatCurrency(sales.totalRevenue, storeSettings)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                            />
                            <StatCard
                                title="Profit"
                                value={formatCurrency(sales.totalProfit, storeSettings)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                            />
                            <StatCard
                                title="Margin"
                                value={`${sales.grossMargin.toFixed(1)}%`}
                                icon={<ReceiptPercentIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                            />
                            <StatCard
                                title="Transactions"
                                value={`${sales.totalTransactions}`}
                                icon={<ReceiptTaxIcon className="h-5 w-5 text-indigo-600" />}
                                color="bg-indigo-100"
                            />
                        </div>

                        {/* Row 2: Charts & Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue Chart - Takes 2 cols */}
                            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg mb-6">Sales Trend</h3>
                                <RevenueChart
                                    data={salesTrend.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), revenue: d.value1, profit: d.value2 }))}
                                    barKey="revenue"
                                    lineKey="profit"
                                    storeSettings={storeSettings}
                                />
                            </div>

                            {/* Top Products List - Takes 1 col */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
                                <h3 className="font-bold text-slate-900 text-lg mb-4">Top Products</h3>
                                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                                    {sales.topProductsByRevenue.slice(0, 8).map((p: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-500">
                                                    #{i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                                                    <p className="text-xs text-slate-500">{p.quantity} sold</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-slate-900 whitespace-nowrap ml-2">
                                                {formatCurrency(p.revenue, storeSettings)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Daily Sales Table */}
                        {dailySales && dailySales.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                    <h3 className="font-bold text-slate-900 text-lg">Daily Sales History</h3>
                                    <select
                                        className="text-sm border-gray-200 border rounded-lg px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={dailyPageSize}
                                        onChange={(e) => {
                                            setDailyPageSize(parseInt(e.target.value));
                                            setDailyPage(1);
                                        }}
                                    >
                                        <option value={5}>Show 5 days</option>
                                        <option value={10}>Show 10 days</option>
                                        <option value={15}>Show 15 days</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dailySales
                                        .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                                        .map((day) => (
                                            <div key={day.date} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                                                <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                                                    <div className="font-bold text-slate-900">
                                                        {new Date(day.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                        {formatCurrency(day.totalRevenue, storeSettings)}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {day.items.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-600 truncate flex-1 mr-2">{item.name}</span>
                                                            <span className="font-medium text-slate-900 whitespace-nowrap">
                                                                {item.quantity} x {formatCurrency(item.revenue / item.quantity, storeSettings)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {day.items.length > 3 && (
                                                        <div className="text-xs text-center text-slate-400 pt-1">
                                                            +{day.items.length - 3} more items
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {dailySales.length > dailyPageSize && (
                                    <div className="flex items-center justify-center gap-4 mt-8">
                                        <button
                                            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                            disabled={dailyPage === 1}
                                        >
                                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                            Previous
                                        </button>
                                        <span className="text-sm text-slate-500">
                                            Page {dailyPage} of {Math.ceil(dailySales.length / dailyPageSize)}
                                        </span>
                                        <button
                                            className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => setDailyPage(p => Math.min(Math.ceil(dailySales.length / dailyPageSize), p + 1))}
                                            disabled={dailyPage >= Math.ceil(dailySales.length / dailyPageSize)}
                                        >
                                            Next
                                            <ChevronRightIcon className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'inventory':
                const inventory = reportData.inventory;
                const invLabels = ['Retail', 'Cost'];
                const invData = [{
                    date: toDateInputString(new Date()),
                    value1: inventory.totalRetailValue,
                    value2: inventory.totalCostValue
                }];

                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Retail Value"
                                value={formatCurrency(inventory.totalRetailValue, storeSettings)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                            />
                            <StatCard
                                title="Cost Value"
                                value={formatCurrency(inventory.totalCostValue, storeSettings)}
                                icon={<MinusCircleIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                            />
                            <StatCard
                                title="Potential Profit"
                                value={formatCurrency(inventory.potentialProfit, storeSettings)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                            />
                            <StatCard
                                title="Total Units"
                                value={inventory.totalUnits.toLocaleString()}
                                icon={<ArchiveBoxIcon className="h-5 w-5 text-purple-600" />}
                                color="bg-purple-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg mb-6">Inventory Value Comparison</h3>
                                <div className="h-48 flex items-end justify-around px-10">
                                    <div className="flex flex-col items-center w-1/3">
                                        <div className="w-full bg-blue-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: '100%' }}></div>
                                        <div className="mt-2 text-sm font-medium text-slate-600">Retail Value</div>
                                        <div className="text-xs text-slate-500 font-bold">{formatCurrency(inventory.totalRetailValue, storeSettings)}</div>
                                    </div>
                                    <div className="flex flex-col items-center w-1/3">
                                        <div className="w-full bg-yellow-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(inventory.totalCostValue / inventory.totalRetailValue) * 100}%` }}></div>
                                        <div className="mt-2 text-sm font-medium text-slate-600">Cost Value</div>
                                        <div className="text-xs text-slate-500 font-bold">{formatCurrency(inventory.totalCostValue, storeSettings)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                                <ArchiveBoxIcon className="w-16 h-16 text-slate-200 mb-4" />
                                <h3 className="font-bold text-slate-900 text-lg">Inventory Health</h3>
                                <p className="text-sm text-slate-500 mt-2 px-4">
                                    Your inventory has a potential profit margin of <span className="font-bold text-green-600">{((inventory.potentialProfit / inventory.totalRetailValue) * 100).toFixed(1)}%</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'customers':
                const customers = reportData.customers;
                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Customers"
                                value={customers.totalCustomers.toLocaleString()}
                                icon={<UsersIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                            />
                            <StatCard
                                title="Active Customers"
                                value={customers.activeCustomersInPeriod.toLocaleString()}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                            />
                            <StatCard
                                title="New Customers"
                                value={customers.newCustomersInPeriod.toLocaleString()}
                                icon={<PlusIcon className="h-5 w-5 text-indigo-600" />}
                                color="bg-indigo-100"
                            />
                            <StatCard
                                title="Store Credit"
                                value={formatCurrency(customers.totalStoreCreditOwed, storeSettings)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg mb-6">Customer Acquisition</h3>
                                <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="text-center">
                                        <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <p className="text-slate-500 text-sm">Customer trend data visualization would go here</p>
                                        <p className="text-slate-400 text-xs mt-1">(Requires more detailed historical data)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                                <div className="p-4 bg-indigo-50 rounded-full mb-4">
                                    <UsersIcon className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-slate-900 text-lg">Growth Insight</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    You acquired <span className="font-bold text-indigo-600">{customers.newCustomersInPeriod}</span> new customers this period.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'cashflow':
                const cashflow = reportData.cashflow;
                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Inflow"
                                value={formatCurrency(cashflow.totalInflow, storeSettings)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                            />
                            <StatCard
                                title="Total Outflow"
                                value={formatCurrency(cashflow.totalOutflow, storeSettings)}
                                icon={<TrendingDownIcon className="h-5 w-5 text-red-600" />}
                                color="bg-red-100"
                            />
                            <StatCard
                                title="Net Cashflow"
                                value={formatCurrency(cashflow.netCashflow, storeSettings)}
                                icon={<ScaleIcon className={`h-5 w-5 ${cashflow.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />}
                                color={cashflow.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}
                            />
                            <StatCard
                                title="Efficiency"
                                value={cashflow.totalInflow > 0 ? `${((cashflow.netCashflow / cashflow.totalInflow) * 100).toFixed(1)}%` : '0%'}
                                icon={<ReceiptPercentIcon className="h-5 w-5 text-purple-600" />}
                                color="bg-purple-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg mb-6">Cashflow Trend</h3>
                                <RevenueChart
                                    data={cashflowTrend.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), inflow: d.value1, outflow: d.value2 }))}
                                    title="Net Cashflow Trend"
                                    barKey="inflow"
                                    lineKey="outflow"
                                    storeSettings={storeSettings}
                                />
                            </div>

                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                                <ScaleIcon className={`w-16 h-16 mb-4 ${cashflow.netCashflow >= 0 ? 'text-green-200' : 'text-red-200'}`} />
                                <h3 className="font-bold text-slate-900 text-lg">Financial Position</h3>
                                <p className="text-sm text-slate-500 mt-2 px-4">
                                    Your net cashflow is <span className={`font-bold ${cashflow.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{cashflow.netCashflow >= 0 ? 'positive' : 'negative'}</span> for this period.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'personal-use':
                const totalPersonalUseCount = personalUse ? personalUse.length : 0;
                const totalPersonalUseValue = personalUse ? personalUse.reduce((acc, item) => acc + (item.change * -1), 0) : 0;

                return (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Items"
                                value={totalPersonalUseCount.toString()}
                                icon={<ArchiveBoxIcon className="h-5 w-5 text-orange-600" />}
                                color="bg-orange-100"
                            />
                            <StatCard
                                title="Total Adjustments"
                                value={totalPersonalUseValue.toString()}
                                icon={<MinusCircleIcon className="h-5 w-5 text-red-600" />}
                                color="bg-red-100"
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg mb-4">Personal Use Adjustments</h3>
                            {!personalUse || personalUse.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    No personal use records in this period
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {personalUse.map((item) => (
                                        <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                                    <ReceiptTaxIcon className="w-5 h-5 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {new Date(item.timestamp).toLocaleDateString()} • {item.userName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                                <div className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                                                    {item.fromQty ?? 0} → {item.toQty ?? 0}
                                                </div>
                                                <div className="font-bold text-red-600 text-lg">
                                                    {item.change ?? 0}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
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
                            {/* ... (date preset text) ... */}
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
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center  p-1 rounded-xl space-x-2">
                        {/* Mobile Menu Button - New */}
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