import React, { useState, useRef, useEffect } from 'react';
import { StoreSettings, User, Announcement } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

// Icons
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ReceiptTaxIcon from '../components/icons/ReceiptTaxIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import UsersIcon from '../components/icons/UsersIcon';
import HomeIcon from '../components/icons/HomeIcon';
import XMarkIcon from '../components/icons/XMarkIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import BellAlertIcon from '../components/icons/BellAlertIcon';
import UserCircleIcon from '../components/icons/UserCircleIcon';

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
    user?: User | null;
    announcements?: Announcement[];
    onRefreshNotifications?: () => Promise<void>;
}

const toDateInputString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
};

const ReportsPage: React.FC<ReportsPageProps> = ({ storeSettings, onClose, user, announcements = [], onRefreshNotifications }) => {
    const navigate = useNavigate();
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
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const unreadCount = announcements.filter(n => !n.isRead).length;
    const sortedAnnouncements = [...announcements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`, {});
            onRefreshNotifications?.();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unread = announcements.filter(n => !n.isRead);
            await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`, {})));
            onRefreshNotifications?.();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

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
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
            {/* Header */}
            <header className="flex-none bg-white glass-effect px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-white leading-none">{getGreeting()} {user?.name?.split(' ')[0] || "User"}</h1>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1  tracking-wider font-semibold">Here's what's happening in your store</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Desktop Tabs Component (Hidden on mobile) */}
                    <div className="hidden min-[1100px]:flex items-center">
                        <div className="relative bg-gray-200  rounded-2xl  dark:bg-slate-800/50 p-1 backdrop-blur-sm">
                            <div className="flex items-center gap-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            flex items-center gap-2
                                            shrink-0
                                            px-4 
                                            py-2
                                            rounded-xl
                                            text-sm font-bold
                                            whitespace-nowrap
                                            transition-all duration-200 active:scale-95
                                            ${activeTab === tab.id
                                                ? 'bg-slate-50 dark:bg-slate-700 dark:text-slate-50  text-slate-700 shadow-md'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        <span className="flex items-center justify-center opacity-70">
                                            {tab.icon}
                                        </span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notifications Button */}
                    <div className="relative" ref={notificationsRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90"
                            aria-label="Notifications"
                        >
                            <BellAlertIcon className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/30">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Profile Icon */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 active:scale-90"
                        aria-label="Profile"
                    >
                        <UserCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Mobile Tab Scroller (Visible on mobile/tablet) */}
            <div className="flex-none min-[1100px]:hidden bg-white/80 rounded-full backdrop-blur-md dark:bg-slate-800/10 sticky top-[72px] z-30">
                <div className="relative">
                    <div className="flex items-center overflow-x-auto gap-2 px-4 py-3 scrollbar-hide mask-fade-edges">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2
                                        shrink-0
                                        px-4 py-2
                                        rounded-3xl
                                        text-sm font-bold
                                        whitespace-nowrap
                                        transition-all duration-200 active:scale-95
                                        ${isActive
                                            ? 'bg-blue-600/70 dark:bg-slate-700  text-white shadow-lg shadow-slate-500/20'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-transparent'
                                        }
                                    `}
                                >
                                    {isActive && React.cloneElement(tab.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Grid Menu Popup */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-fade-in" />

                    <div
                        className="absolute top-[80px] left-4 right-4 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-6 border border-slate-200 dark:border-white/10 animate-fade-in-up overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Quick Access</h3>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all active:scale-95 group ${isActive
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`mb-3 p-3 rounded-2xl transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                                            {React.cloneElement(tab.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-400/20">
                            <p className="text-blue-600 dark:text-blue-400 text-xs font-bold text-center">
                                Select a report to view detailed analytics and performance metrics for your business.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-[100]" onClick={() => setIsNotificationsOpen(false)}>
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" />
                    <div
                        className="absolute top-[70px] right-4 md:right-8 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-notification-slide-down"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {sortedAnnouncements.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-3">
                                        <BellAlertIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No notifications yet</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5">
                                    {sortedAnnouncements.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className={`w-full text-left px-5 py-3.5 transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${!notification.isRead ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.isRead ? 'bg-transparent' : 'bg-indigo-500 animate-pulse'
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${notification.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                                                        }`}>{notification.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-500 line-clamp-2 mt-0.5">{notification.message}</p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                                                        {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10">
                            <button
                                onClick={() => { setIsNotificationsOpen(false); navigate('/notifications'); }}
                                className="w-full py-2 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                            >
                                View all notifications
                            </button>
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
                <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm animate-fade-in flex items-end md:items-center justify-center min-[1100px]:hidden">
                    <div className="bg-white dark:bg-slate-900 w-full rounded-t-[2.5rem] shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden border-t border-slate-200 dark:border-white/10">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Filters</h2>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 active:scale-90 transition-all font-bold"
                                    aria-label="Close filters"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                        Time Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: '7d', label: '7 Days', action: () => setDateRange(7, '7d') },
                                            { id: '30d', label: '30 Days', action: () => setDateRange(30, '30d') },
                                            { id: 'month', label: 'This Month', action: setThisMonth },
                                            { id: 'custom', label: 'Custom', action: () => setDatePreset('custom') }
                                        ].map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => { preset.action(); if (preset.id !== 'custom') setShowFilters(false); }}
                                                className={`p-4 rounded-2xl border-2 transition-all active:scale-95 ${datePreset === preset.id
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}
                                            >
                                                <div className="text-sm font-bold">{preset.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {datePreset === 'custom' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2">Start Date</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2">End Date</label>
                                                <div className="relative">
                                                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-800 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6">
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-[0.98] transition-all"
                                    >
                                        Apply Filters
                                    </button>
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
                @keyframes notification-slide-down {
                    from { opacity: 0; transform: translateY(-12px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .animate-notification-slide-down {
                    animation: notification-slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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