import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';

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

const TABS = [
    { id: 'overview', label: 'Overview', Icon: HomeIcon },
    { id: 'sales', label: 'Sales', Icon: CurrencyDollarIcon },
    { id: 'inventory', label: 'Inventory', Icon: ArchiveBoxIcon },
    { id: 'customers', label: 'Customers', Icon: UsersIcon },
    { id: 'cashflow', label: 'Cashflow', Icon: TrendingUpIcon },
    { id: 'personal-use', label: 'Personal', Icon: ReceiptTaxIcon },
];

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
    const [recentOrdersTab, setRecentOrdersTab] = useState<'all' | 'online' | 'pos'>('all');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const tabBarRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Sales Pagination State
    const [dailyPage, setDailyPage] = useState(1);
    const [dailyPageSize, setDailyPageSize] = useState(10);

    // Keyboard navigation for tabs (arrow keys)
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
        const tabIds = TABS.map(t => t.id);
        const currentIndex = tabIds.indexOf(activeTab);
        let nextIndex = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % tabIds.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = tabIds.length - 1;
        }

        if (nextIndex !== -1) {
            const nextTabId = tabIds[nextIndex];
            setActiveTab(nextTabId);
            const nextTabElement = document.getElementById(`tab-${nextTabId}`);
            nextTabElement?.focus();
        }
    }, [activeTab]);

    // Announcements logic
    const unreadCount = announcements.filter(n => !n.isRead).length;
    const sortedAnnouncements = [...announcements].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`, {});
            if (onRefreshNotifications) await onRefreshNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all', {});
            if (onRefreshNotifications) await onRefreshNotifications();
            setIsNotificationsOpen(false);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Auto-scroll tab into view
    useEffect(() => {
        if (activeTab && tabBarRef.current) {
            const activeElement = document.getElementById(`tab-${activeTab}`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        localStorage.setItem('reports.activeTab', activeTab);
    }, [activeTab]);

    // Data fetching logic
    const [reportData, setReportData] = useState<any | null>(null);
    const [dailySales, setDailySales] = useState<any[] | null>(null);
    const [personalUse, setPersonalUse] = useState<any[] | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [statsRes, salesRes, personalRes] = await Promise.all([
                api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/personal-use?startDate=${startDate}&endDate=${endDate}`)
            ]);
            setReportData(statsRes);
            setDailySales(salesRes.dailySales || []);
            setPersonalUse(personalRes.personalUse || []);
        } catch (err) {
            console.error("Failed to fetch report data", err);
        } finally {
            setIsRefreshing(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Export functionality
    const handleExportCSV = () => {
        if (!dailySales) return;
        const headers = ['Date', 'Revenue', 'Profit', 'Transactions'];
        const rows = dailySales.map(day => [
            day.date,
            day.revenue,
            day.profit,
            day.transactions
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!reportData || !dailySales) return;
        const doc = new jsPDF() as any;

        doc.setFontSize(20);
        doc.text('Sales Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

        const tableColumn = ["Date", "Revenue", "Profit", "Transactions"];
        const tableRows = dailySales.map(day => [
            day.date,
            formatCurrency(day.revenue, storeSettings),
            formatCurrency(day.profit, storeSettings),
            day.transactions
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
        });

        doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
    };

    const handleDatePreset = (preset: '7d' | '30d' | 'month') => {
        setDatePreset(preset);
        const end = new Date();
        const start = new Date();

        if (preset === '7d') {
            start.setDate(end.getDate() - 6);
        } else if (preset === '30d') {
            start.setDate(end.getDate() - 29);
        } else if (preset === 'month') {
            start.setDate(1);
        }

        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
    };

    const renderContent = () => {
        if (!reportData) return <div className="p-8 text-center text-slate-500">Loading data...</div>;

        switch (activeTab) {
            case 'overview':
                return (
                    <OverviewTab
                        reportData={reportData}
                        storeSettings={storeSettings}
                        userName={user?.name}
                        recentOrdersTab={recentOrdersTab}
                        setRecentOrdersTab={setRecentOrdersTab}
                    />
                );
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

    const datePresetLabel = datePreset === '7d' ? '7D' : datePreset === '30d' ? '30D' : datePreset === 'month' ? 'Mo' : 'Custom';

    return (
        <div className="flex flex-col h-[100dvh] bg-mesh-light font-google overflow-hidden relative">
            {/* Skip to content link for accessibility */}
            <a
                href="#report-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
            >
                Skip to report content
            </a>

            {/* Header — compact on mobile */}
            <header className="flex-none liquid-glass-header sticky top-0 z-40" role="banner">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                                {getGreeting()}, {user?.name?.split(' ')[0] || "User"}
                            </h1>
                            <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1 tracking-wide font-medium truncate flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        {/* Mobile Date Filter */}
                        <button
                            onClick={() => setShowFilters(true)}
                            className="flex md:hidden items-center gap-1.5 p-2 px-3 rounded-full liquid-glass-pill transition-all duration-200 active:scale-90 active:scale-95 transition-all duration-300"
                            aria-label={`Date filter: ${datePresetLabel}`}
                        >
                            <CalendarIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{datePresetLabel}</span>
                        </button>

                        <div className="relative hidden md:block" ref={notificationsRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-3 rounded-full liquid-glass-pill transition-all duration-200 hover:shadow-lg active:scale-95 group"
                                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                                aria-expanded={isNotificationsOpen}
                                aria-haspopup="true"
                            >
                                <BellAlertIcon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full animate-pulse shadow-md shadow-blue-500/40" aria-hidden="true">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/profile')}
                            className="hidden md:flex p-3 rounded-full liquid-glass-pill transition-all duration-200 hover:shadow-lg active:scale-95 group"
                            aria-label="Go to profile"
                        >
                            <UserCircleIcon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </button>

                        <div className="relative hidden md:block" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 active:scale-95 ${isExportMenuOpen
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'liquid-glass-pill hover:shadow-md'
                                    }`}
                                aria-expanded={isExportMenuOpen}
                                aria-haspopup="true"
                            >
                                <ArrowDownTrayIcon className={`w-4.5 h-4.5 ${isExportMenuOpen ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
                                <span>Export</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isExportMenuOpen && (
                                <div className="absolute top-full right-0 mt-3 w-48 liquid-glass rounded-2xl overflow-hidden shadow-2xl animate-notification-slide-down border border-white/20 dark:border-white/10 z-50">
                                    <button
                                        onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-3 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        Export as CSV
                                    </button>
                                    <button
                                        onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors border-t border-slate-100 dark:border-white/5 flex items-center gap-3 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        Export as PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Universal Google-style Pill Tab Bar */}
            <nav
                ref={tabBarRef}
                className="flex-none liquid-glass sticky top-[80px] md:top-[90px] z-30 transition-all duration-300"
                role="tablist"
                aria-label="Report sections"
                onKeyDown={handleTabKeyDown}
            >
                <div className="max-w-[1400px] mx-auto px-3 md:px-8 py-2 md:py-3 flex items-center justify-between">
                    <div className="flex overflow-x-auto scrollbar-hide gap-2 snap-x snap-mandatory pb-1 max-w-full">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.Icon;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    id={`tab-${tab.id}`}
                                    aria-selected={isActive}
                                    aria-controls={`tabpanel-${tab.id}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 snap-start flex items-center gap-2 px-5 py-2.5 md:py-3 rounded-full text-[13px] md:text-sm font-bold tracking-wide whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 liquid-glass-pill transition-all duration-200 ${isActive ? 'active scale-105 shadow-md shadow-blue-500/20' : 'hover:scale-102'}`}
                                >
                                    <Icon className={isActive ? 'w-4.5 h-4.5' : 'w-4 h-4'} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="hidden md:flex items-center gap-3 border-l border-slate-200 dark:border-white/10 pl-6 ml-4">
                        <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-full border border-slate-200 dark:border-white/10">
                            {(['7d', '30d', 'month'] as const).map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handleDatePreset(preset)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${datePreset === preset
                                        ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {preset === '7d' ? '7D' : preset === '30d' ? '30D' : 'This Month'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            <main
                ref={contentRef}
                id="report-content"
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 scroll-smooth"
                tabIndex={-1}
            >
                <div className="max-w-[1400px] mx-auto w-full">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Footer Spacing */}
            <div className="h-20 md:hidden flex-none"></div>

            {/* Notification Drawer - simplified for this component */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
                    <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl animate-notification-slide-left flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white">Notifications</h2>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-blue-600 hover:underline">Mark all as read</button>
                                )}
                                <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors active:scale-95 transition-all duration-300">
                                    <XMarkIcon className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {sortedAnnouncements.length > 0 ? (
                                sortedAnnouncements.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${n.isRead
                                            ? 'bg-slate-50 dark:bg-white/5 border-transparent'
                                            : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900 shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold text-sm ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{n.title}</h3>
                                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2 leading-relaxed">{n.message}</p>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <BellAlertIcon className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm font-medium">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;