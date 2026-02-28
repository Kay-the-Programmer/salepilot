import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StoreSettings, User } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
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
import { AiSummaryCard } from '../components/reports/AiSummaryCard';
import { Settings, X, LayoutGrid } from 'lucide-react';
import { DashboardCardConfig } from '../types';

const DEFAULT_CARDS: DashboardCardConfig[] = [
    { id: 'tips', label: 'Tips & Guidance', visible: true, order: 0 },
    { id: 'expenses', label: 'Operating Expenses', visible: true, order: 1 },
    { id: 'profit', label: 'Net Profit', visible: true, order: 2 },
    { id: 'cashflow', label: 'Cashflow Trend', visible: true, order: 3 },
    { id: 'sales-trend', label: 'Sales Trends', visible: true, order: 4 },
    { id: 'channels', label: 'Sales Channels', visible: true, order: 5 },
    { id: 'recent-orders', label: 'Recent Orders', visible: true, order: 6 },
    { id: 'top-sales', label: 'Top Selling Products', visible: true, order: 7 },
];
interface ReportsPageProps {
    storeSettings: StoreSettings;
    onClose?: () => void;
    user?: User | null;
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

const ReportsPage: React.FC<ReportsPageProps> = ({ storeSettings, onClose, user }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
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

    const [isEditMode, setIsEditMode] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [cardConfig, setCardConfig] = useState<DashboardCardConfig[]>(() => {
        const saved = localStorage.getItem('salepilot_dashboard_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse dashboard config", e);
            }
        }
        return DEFAULT_CARDS;
    });

    useEffect(() => {
        localStorage.setItem('salepilot_dashboard_config', JSON.stringify(cardConfig));
    }, [cardConfig]);

    const toggleCardVisibility = (id: string) => {
        setCardConfig(prev => prev.map(card =>
            card.id === id ? { ...card, visible: !card.visible } : card
        ));
    };

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

    const sortedAnnouncements = notifications; // Already sorted by context/backend

    // Auto-scroll tab into view
    useEffect(() => {
        if (activeTab && tabBarRef.current) {
            const activeElement = document.getElementById(`tab-${activeTab}`);
            if (activeElement) {
                // Determine if we are on mobile (where tabs are hidden)
                const isMobile = window.innerWidth < 768;
                if (!isMobile) {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        }
        localStorage.setItem('reports.activeTab', activeTab);
    }, [activeTab]);

    const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

    // Data fetching logic
    const [reportData, setReportData] = useState<any | null>(null);
    const [dailySales, setDailySales] = useState<any[] | null>(null);
    const [personalUse, setPersonalUse] = useState<any[] | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, salesRes, personalRes] = await Promise.all([
                api.get(`/reports/dashboard?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/daily-sales?startDate=${startDate}&endDate=${endDate}`),
                api.get(`/reports/personal-use?startDate=${startDate}&endDate=${endDate}`)
            ]);
            setReportData(statsRes);
            setDailySales((salesRes as any).dailySales || []);
            setPersonalUse((personalRes as any).personalUse || []);
        } catch (err) {
            console.error("Failed to fetch report data", err);
        } finally {
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
                        isEditMode={isEditMode}
                        cardConfig={cardConfig}
                        setCardConfig={setCardConfig}
                        toggleCardVisibility={toggleCardVisibility}
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
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google overflow-hidden relative">
            {/* Skip to content link for accessibility */}
            <a
                href="#report-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
            >
                Skip to report content
            </a>

            {/* Header — compact on mobile */}
            <header className="flex-none sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-transparent transition-all duration-300" role="banner">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="min-w-0">
                            <p className="text-[13px] md:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1 tracking-wide uppercase">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            <h1 className="text-2xl md:text-[34px] font-bold md:font-semibold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                                {getGreeting()}, {user?.name?.split(' ')[0] || "User"}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="flex md:hidden items-center gap-2" ref={filterMenuRef}>
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 flex-shrink-0 active:scale-95 transition-transform bg-white dark:bg-slate-800 shadow-sm"
                                aria-label="Go to profile"
                            >
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-full h-full text-slate-400 dark:text-slate-500" />
                                )}
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl transition-all duration-300 active:scale-95 shadow-sm group"
                                    aria-label={`Date filter: ${datePresetLabel}`}
                                    aria-expanded={showFilters}
                                >
                                    <CalendarIcon className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" />
                                </button>

                                {showFilters && (
                                    <div className="absolute top-full right-0 mt-3 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50 dark:border-white/10 z-50 transform origin-top-right transition-all animate-notification-slide-down">
                                        {(['7d', '30d', 'month'] as const).map((preset) => (
                                            <button
                                                key={preset}
                                                onClick={() => { handleDatePreset(preset); setShowFilters(false); }}
                                                className={`w-full text-left px-5 py-3.5 text-[15px] font-medium transition-colors ${datePreset === preset
                                                    ? 'bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                {preset === '7d' ? 'Last 7 Days' : preset === '30d' ? 'Last 30 Days' : 'This Month'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative hidden md:block" ref={notificationsRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl transition-all duration-300 active:scale-95 shadow-sm group"
                                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                                aria-expanded={isNotificationsOpen}
                                aria-haspopup="true"
                            >
                                <BellAlertIcon className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-md border-2 border-slate-50 dark:border-slate-900 animate-pulse" aria-hidden="true">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/profile')}
                            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl transition-all duration-300 active:scale-95 shadow-sm group"
                            aria-label="Go to profile"
                        >
                            <UserCircleIcon className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" />
                        </button>

                        <div className="relative hidden md:block" ref={exportMenuRef}>
                            <button
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[15px] tracking-wide transition-all duration-300 active:scale-95 ${isExportMenuOpen
                                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                                    : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 backdrop-blur-xl hover:shadow-sm'
                                    }`}
                                aria-expanded={isExportMenuOpen}
                                aria-haspopup="true"
                            >
                                <ArrowDownTrayIcon className={`w-4.5 h-4.5`} />
                                <span>Export</span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isExportMenuOpen && (
                                <div className="absolute top-full right-0 mt-3 w-48 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50 dark:border-white/10 z-50 transform origin-top-right transition-all animate-notification-slide-down">
                                    <button
                                        onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-5 py-3.5 text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                        Export as CSV
                                    </button>
                                    <button
                                        onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-5 py-3.5 text-[15px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors border-t border-slate-100 dark:border-white/5 flex items-center gap-3 active:scale-95 transition-all duration-300"
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                        Export as PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Desktop Apple-style Segmented Control Tab Bar */}
            <nav
                ref={tabBarRef}
                className="hidden md:flex flex-none sticky top-[90px] z-30 transition-all duration-300 bg-slate-50 dark:bg-slate-950 pb-2 border-b border-transparent"
                role="tablist"
                aria-label="Report sections"
                onKeyDown={handleTabKeyDown}
            >
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between w-full">
                    <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-1.5 rounded-[20px] overflow-hidden gap-1.5 w-full relative shadow-inner ring-1 ring-slate-900/5 dark:ring-white/10">
                        <div className="grid grid-cols-6 gap-1.5 flex-1 relative isolate">
                            {/* Sliding Indicator (Magic Pill) */}
                            <div
                                className="absolute top-0 bottom-0 left-0 bg-white dark:bg-slate-700/80 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-white/5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] -z-10"
                                style={{
                                    width: `calc((100% - 30px) / 6)`, // 5 gaps of 6px (gap-1.5) = 30px
                                    transform: `translateX(calc(${activeTabIndex} * 100% + ${activeTabIndex * 6}px))`
                                }}
                                aria-hidden="true"
                            />

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
                                        className={`flex items-center justify-center gap-2 px-2 py-2.5 rounded-[16px] text-[14px] font-semibold tracking-wide whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        <Icon className={`w-4.5 h-4.5 transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {activeTab === 'overview' && (
                            <div className="flex items-center gap-1 ml-2 border-l border-slate-300 dark:border-white/10 pl-2">
                                {isEditMode && (
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20"
                                    >
                                        <LayoutGrid className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:block">Library</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 group/settings ${isEditMode
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                                        : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <Settings className={`w-4 h-4 md:w-3.5 md:h-3.5 ${isEditMode ? 'animate-spin-slow' : 'group-hover/settings:rotate-90 transition-transform duration-500'}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                                        {isEditMode ? 'Done' : 'Customize'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main
                ref={contentRef}
                id="report-content"
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 scroll-smooth"
                tabIndex={-1}
            >
                <div className="max-w-[1400px] mx-auto w-full pb-20 md:pb-0">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Footer Spacing for Bottom Nav */}
            <div className="h-28 md:hidden flex-none"></div>

            {/* Premium Mobile Bottom Navigation Bar */}
            <nav aria-label="Mobile Bottom Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-t border-slate-200/50 dark:border-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center justify-around px-2 py-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.Icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex flex-1 flex-col items-center justify-center gap-1.5 py-1 transition-all duration-300 active:scale-95 outline-none ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'}`}
                                aria-selected={isActive}
                            >
                                <div className="relative">
                                    <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 scale-110' : 'bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
                                        <Icon className="w-[22px] h-[22px]" />
                                    </div>
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 uppercase ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Notification Drawer - simplified for this component */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)}></div>
                    <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl animate-notification-slide-left flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold dark:text-white">Notifications</h2>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:underline">Mark all as read</button>
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
                                        onClick={() => !n.isRead && markAsRead(n.id)}
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

            {/* Premium Apple-Style Dashboard Settings Drawer */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500"
                        onClick={() => setIsSettingsOpen(false)}
                    ></div>
                    <div className="relative w-full max-w-sm h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] animate-notification-slide-left flex flex-col border-l border-white/20 dark:border-white/5">
                        <div className="px-8 pt-12 pb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    Customize
                                </h2>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                                    Tailor your dashboard layout to focus on what matters most.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-full transition-all active:scale-90"
                            >
                                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                            <div className="bg-white/40 dark:bg-white/5 rounded-[28px] overflow-hidden border border-white/20 dark:border-white/5 shadow-sm">
                                {cardConfig.sort((a, b) => a.order - b.order).map((card, index) => (
                                    <div
                                        key={card.id}
                                        className={`flex items-center justify-between p-4 group transition-colors ${index !== cardConfig.length - 1 ? 'border-b border-slate-100/50 dark:border-white/5' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${card.visible
                                                ? 'bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                                                : 'bg-slate-200 dark:bg-slate-800'
                                                }`}>
                                                <LayoutGrid className={`w-5 h-5 ${card.visible ? 'text-white' : 'text-slate-400'}`} />
                                            </div>
                                            <span className={`text-[15px] font-semibold tracking-tight transition-colors ${card.visible ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                                                }`}>{card.label}</span>
                                        </div>

                                        {/* iOS-Style Toggle Switch */}
                                        <button
                                            onClick={() => toggleCardVisibility(card.id)}
                                            className={`w-[52px] h-[32px] rounded-full p-1 transition-all duration-300 relative outline-none focus:ring-2 focus:ring-blue-500/20 ${card.visible
                                                ? 'bg-[#34C759]'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                        >
                                            <div className={`w-[24px] h-[24px] bg-white rounded-full shadow-[0_2px_4_rgba(0,0,0,0.15)] transition-all duration-300 transform ${card.visible ? 'translate-x-[20px]' : 'translate-x-0'
                                                }`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 px-4">
                                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                                    Changes are saved automatically
                                </p>
                            </div>
                        </div>

                        <div className="p-8 mt-auto backdrop-blur-xl bg-white/10 dark:bg-slate-900/10">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[22px] font-bold text-[15px] shadow-[0_8px_24_rgba(0,0,0,0.15)] hover:scale-[1.02] active:scale-98 transition-all duration-300"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Floating Button */}
            {reportData && (
                <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={user?.name} />
            )}
        </div>
    );
};

export default ReportsPage;