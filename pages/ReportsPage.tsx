import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StoreSettings } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import MinusCircleIcon from '../components/icons/MinusCircleIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ScaleIcon from '../components/icons/ScaleIcon';
import ReportBlock from '../components/reports/ReportBlock';
import ReceiptTaxIcon from '../components/icons/ReceiptTaxIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import UsersIcon from '../components/icons/UsersIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import { formatCurrency } from '../utils/currency';
import PlusIcon from '../components/icons/PlusIcon';
import TrendingDownIcon from '../components/icons/TrendingDownIcon';
import { api } from '../services/api';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import FunnelIcon from '../components/icons/FunnelIcon';
import DocumentArrowDownIcon from '../components/icons/DocumentArrowDownIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';

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
    <div className={`relative overflow-hidden rounded-2xl bg-white p-4 shadow-lg border border-gray-100 
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
                            {formatCurrency(maxValue * (1 - tick), storeSettings, true)}
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
    const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('reports.activeTab') || 'sales');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [datePreset, setDatePreset] = useState<'7d' | '30d' | 'month' | 'custom'>('30d');

    const [reportData, setReportData] = useState<any | null>(null);
    const [dailySales, setDailySales] = useState<any[] | null>(null);
    const [dailyPage, setDailyPage] = useState<number>(1);
    const [dailyPageSize, setDailyPageSize] = useState<number>(5);
    const [personalUse, setPersonalUse] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tabs = [
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
                    api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                    api.get(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
                    api.get(`/reports/personal-use?startDate=${startDate}&endDate=${endDate}`),
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
            case 'sales':
                const sales = reportData.sales;
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <StatCard
                                title="Revenue"
                                value={formatCurrency(sales.totalRevenue, storeSettings, true)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                                compact
                            />
                            <StatCard
                                title="Profit"
                                value={formatCurrency(sales.totalProfit, storeSettings, true)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                                compact
                            />
                            <StatCard
                                title="Margin"
                                value={`${sales.grossMargin.toFixed(1)}%`}
                                icon={<ReceiptPercentIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                                compact
                            />
                            <StatCard
                                title="Transactions"
                                value={`${sales.totalTransactions}`}
                                icon={<ReceiptTaxIcon className="h-5 w-5 text-indigo-600" />}
                                color="bg-indigo-100"
                                compact
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">Sales Trend</h3>
                            <MobileChart
                                data={salesTrend}
                                labels={['Revenue', 'Profit']}
                                colors={['#3b82f6', '#10b981']}
                                storeSettings={storeSettings}
                                height={240}
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
                            <div className="space-y-2">
                                {sales.topProductsByRevenue.slice(0, 5).map((p: any, i: number) => (
                                    <MobileTableRow
                                        key={p.name}
                                        rank={i + 1}
                                        label={p.name}
                                        subLabel={`${p.quantity} units`}
                                        value={formatCurrency(p.revenue, storeSettings, true)}
                                    />
                                ))}
                            </div>
                        </div>

                        {dailySales && dailySales.length > 0 && (
                            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Daily Sales</h3>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            className="text-sm border rounded-lg px-2 py-1"
                                            value={dailyPageSize}
                                            onChange={(e) => {
                                                setDailyPageSize(parseInt(e.target.value));
                                                setDailyPage(1);
                                            }}
                                        >
                                            <option value={5}>5 days</option>
                                            <option value={7}>7 days</option>
                                            <option value={10}>10 days</option>
                                        </select>
                                    </div>
                                </div>

                                {dailySales
                                    .slice((dailyPage - 1) * dailyPageSize, dailyPage * dailyPageSize)
                                    .map((day) => (
                                        <div key={day.date} className="mb-4 last:mb-0 p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium text-gray-900">
                                                    {new Date(day.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(day.totalRevenue, storeSettings, true)}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                {day.items.slice(0, 3).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 truncate">{item.name}</span>
                                                        <span className="font-medium text-gray-900">
                                                            {item.quantity} × {formatCurrency(item.revenue / item.quantity, storeSettings, true)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {day.items.length > 3 && (
                                                    <div className="text-xs text-gray-500 text-center pt-1">
                                                        +{day.items.length - 3} more items
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                {dailySales.length > dailyPageSize && (
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <button
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 disabled:opacity-30"
                                            onClick={() => setDailyPage(p => Math.max(1, p - 1))}
                                            disabled={dailyPage === 1}
                                        >
                                            <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page {dailyPage} of {Math.ceil(dailySales.length / dailyPageSize)}
                                        </span>
                                        <button
                                            className="flex items-center px-3 py-1.5 text-sm text-gray-600 disabled:opacity-30"
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
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <StatCard
                                title="Retail Value"
                                value={formatCurrency(inventory.totalRetailValue, storeSettings, true)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                                compact
                            />
                            <StatCard
                                title="Cost Value"
                                value={formatCurrency(inventory.totalCostValue, storeSettings, true)}
                                icon={<MinusCircleIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                                compact
                            />
                            <StatCard
                                title="Potential Profit"
                                value={formatCurrency(inventory.potentialProfit, storeSettings, true)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                                compact
                            />
                            <StatCard
                                title="Total Units"
                                value={inventory.totalUnits.toLocaleString()}
                                icon={<ArchiveBoxIcon className="h-5 w-5 text-purple-600" />}
                                color="bg-purple-100"
                                compact
                            />
                        </div>
                    </div>
                );

            case 'customers':
                const customers = reportData.customers;
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <StatCard
                                title="Total Customers"
                                value={customers.totalCustomers.toLocaleString()}
                                icon={<UsersIcon className="h-5 w-5 text-blue-600" />}
                                color="bg-blue-100"
                                compact
                            />
                            <StatCard
                                title="Active Customers"
                                value={customers.activeCustomersInPeriod.toLocaleString()}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                                compact
                            />
                            <StatCard
                                title="New Customers"
                                value={customers.newCustomersInPeriod.toLocaleString()}
                                icon={<PlusIcon className="h-5 w-5 text-indigo-600" />}
                                color="bg-indigo-100"
                                compact
                            />
                            <StatCard
                                title="Store Credit"
                                value={formatCurrency(customers.totalStoreCreditOwed, storeSettings, true)}
                                icon={<CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />}
                                color="bg-yellow-100"
                                compact
                            />
                        </div>
                    </div>
                );

            case 'cashflow':
                const cashflow = reportData.cashflow;
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            <StatCard
                                title="Total Inflow"
                                value={formatCurrency(cashflow.totalInflow, storeSettings, true)}
                                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                                color="bg-green-100"
                                compact
                            />
                            <StatCard
                                title="Total Outflow"
                                value={formatCurrency(cashflow.totalOutflow, storeSettings, true)}
                                icon={<TrendingDownIcon className="h-5 w-5 text-red-600" />}
                                color="bg-red-100"
                                compact
                            />
                            <StatCard
                                title="Net Cashflow"
                                value={formatCurrency(cashflow.netCashflow, storeSettings, true)}
                                icon={<ScaleIcon className={`h-5 w-5 ${cashflow.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />}
                                color={cashflow.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}
                                compact
                            />
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">Cashflow Trend</h3>
                            <MobileChart
                                data={cashflowTrend}
                                labels={['Inflow', 'Outflow']}
                                colors={['#22c55e', '#ef4444']}
                                storeSettings={storeSettings}
                                height={240}
                            />
                        </div>
                    </div>
                );

            case 'personal-use':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">Personal Use Adjustments</h3>
                            {!personalUse || personalUse.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No personal use records in this period
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {personalUse.slice(0, 10).map((item) => (
                                        <div key={item.id} className="p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <div className="font-medium text-gray-900">{item.productName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(item.timestamp).toLocaleDateString()} • {item.userName}
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-semibold ${item.change < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {item.change ?? '-'}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-600">
                                                <span className="mr-4">From: {item.fromQty ?? '-'}</span>
                                                <span>To: {item.toQty ?? '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {personalUse.length > 10 && (
                                        <div className="text-center text-sm text-gray-500 pt-2">
                                            +{personalUse.length - 10} more records
                                        </div>
                                    )}
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
        <div className="flex flex-col h-full w-full bg-gray-50 relative">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
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

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                            aria-label="Filter options"
                        >
                            <FunnelIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className="p-2 rounded-lg bg-gray-100 active:bg-gray-200"
                                aria-label="Export options"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
                            </button>

                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-2xl border border-gray-200 py-1 z-20">
                                    <button
                                        onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 active:bg-gray-100"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4 mr-3" />
                                        Export as PDF
                                    </button>
                                    <button
                                        onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}
                                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 active:bg-gray-100"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4 mr-3" />
                                        Export as CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Tabs */}
            <MobileTabBar
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4">
                <div className="max-w-7xl mx-auto w-full">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 animate-fade-in flex items-end md:items-center justify-center">
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
            <style jsx>{`
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
            `}</style>
        </div>
    );
};

export default ReportsPage;