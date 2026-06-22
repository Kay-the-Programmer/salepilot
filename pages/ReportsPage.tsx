import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StoreSettings, User, DashboardCardConfig } from '../types';
import { useNotifications } from '../contexts/NotificationContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { api } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { hasModule, MODULES } from '../utils/entitlements';
import { useNavigate } from 'react-router-dom';

// Shared boutique-green M3 chrome (the SalePilot standalone-app design system)
import { Icon, Avatar } from '../components/crm/CrmBits';
import '../components/crm/crm.css';

// Report content tabs (data wired) + AI summary
import { OverviewTab } from '../components/reports/OverviewTab';
import { SalesTab } from '../components/reports/SalesTab';
import { InventoryTab } from '../components/reports/InventoryTab';
import { CustomersTab } from '../components/reports/CustomersTab';
import { AiSummaryCard } from '../components/reports/AiSummaryCard';
import { Settings, X, LayoutGrid } from 'lucide-react';

const DEFAULT_CARDS: DashboardCardConfig[] = [
    { id: 'tips', label: 'Tips & Guidance', visible: true, order: 0 },
    { id: 'expenses', label: 'Operating Expenses', visible: true, order: 1 },
    { id: 'profit', label: 'Net Profit', visible: true, order: 2 },
    { id: 'cashflow', label: 'Cashflow Trend', visible: true, order: 3 },
    { id: 'cashflow-stats', label: 'Cashflow Stats', visible: true, order: 4 },
    { id: 'outflow-breakdown', label: 'Outflow Breakdown', visible: true, order: 5 },
    { id: 'financial-position', label: 'Financial Position', visible: true, order: 6 },
    { id: 'personal-stats', label: 'Personal Use Stats', visible: true, order: 7 },
    { id: 'personal-list', label: 'Personal Use List', visible: true, order: 8 },
    { id: 'sales-trend', label: 'Sales Trends', visible: true, order: 9 },
    { id: 'channels', label: 'Sales Channels', visible: true, order: 10 },
    { id: 'recent-orders', label: 'Recent Orders', visible: true, order: 11 },
    { id: 'top-sales', label: 'Top Selling Products', visible: true, order: 12 },
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
    return 'Good evening';
};

type SectionId = 'overview' | 'sales' | 'inventory' | 'customers';

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'sales', label: 'Sales', icon: 'payments' },
    { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { id: 'customers', label: 'Customers', icon: 'group' },
];

const DATE_PRESETS: { id: '7d' | '30d' | 'month'; label: string }[] = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'month', label: 'This Month' },
];

const ReportsPage: React.FC<ReportsPageProps> = ({ storeSettings, user }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    // Advanced Reports is a premium add-on module — locked unless the store has
    // unlocked it (granted by the platform after payment).
    const reportsUnlocked = hasModule(storeSettings, MODULES.ADVANCED_REPORTS);

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        return toDateInputString(d);
    });
    const [endDate, setEndDate] = useState(toDateInputString(new Date()));
    const [activeTab, setActiveTab] = useState<SectionId>(() => (localStorage.getItem('reports.activeTab') as SectionId) || 'overview');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [datePreset, setDatePreset] = useState<'7d' | '30d' | 'month' | 'custom'>('30d');
    const [recentOrdersTab, setRecentOrdersTab] = useState<'all' | 'online' | 'pos'>('all');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [cardConfig, setCardConfig] = useState<DashboardCardConfig[]>(() => {
        const saved = localStorage.getItem('salepilot_dashboard_config');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse dashboard config', e);
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

    // Sales pagination state
    const [dailyPage, setDailyPage] = useState(1);
    const [dailyPageSize, setDailyPageSize] = useState(10);

    useEffect(() => {
        localStorage.setItem('reports.activeTab', activeTab);
    }, [activeTab]);

    // Data fetching
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
            console.error('Failed to fetch report data', err);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (reportsUnlocked) fetchData();
    }, [fetchData, reportsUnlocked]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Export
    const handleExportCSV = () => {
        if (!dailySales) return;
        const headers = ['Date', 'Revenue', 'Profit', 'Transactions'];
        const rows = dailySales.map(day => [day.date, day.revenue, day.profit, day.transactions]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
        const tableColumn = ['Date', 'Revenue', 'Profit', 'Transactions'];
        const tableRows = dailySales.map(day => [
            day.date,
            formatCurrency(day.revenue, storeSettings),
            formatCurrency(day.profit, storeSettings),
            day.transactions
        ]);
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40 });
        doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
    };

    const handleDatePreset = (preset: '7d' | '30d' | 'month') => {
        setDatePreset(preset);
        const end = new Date();
        const start = new Date();
        if (preset === '7d') start.setDate(end.getDate() - 6);
        else if (preset === '30d') start.setDate(end.getDate() - 29);
        else if (preset === 'month') start.setDate(1);
        setStartDate(toDateInputString(start));
        setEndDate(toDateInputString(end));
    };

    const renderContent = () => {
        if (!reportData) {
            return (
                <div className="crm-empty" style={{ padding: '72px 16px' }}>
                    <span className="crm-spinner" aria-hidden="true" />
                    <p className="crm-empty__text" style={{ marginTop: 16 }}>Loading your reports…</p>
                </div>
            );
        }
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
                        personalUse={personalUse}
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
                return <InventoryTab reportData={reportData} storeSettings={storeSettings} />;
            case 'customers':
                return <CustomersTab reportData={reportData} storeSettings={storeSettings} />;
            default:
                return null;
        }
    };

    const firstName = user?.name?.split(' ')[0] || 'there';
    const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const dateInputStyle: React.CSSProperties = {
        height: 40, padding: '0 12px', fontSize: 13, fontFamily: 'inherit',
        border: '1px solid var(--c-outline-variant)', borderRadius: 'var(--c-radius-lg)',
        background: 'var(--c-surface-lowest)', color: 'var(--c-on-bg)', outline: 'none',
    };
    const menuStyle: React.CSSProperties = {
        position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 40, minWidth: 200,
        background: 'var(--c-surface-lowest)', borderRadius: 'var(--c-radius-lg)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.16)', border: '1px solid var(--c-outline-variant)',
        overflow: 'hidden', padding: 6,
    };
    const menuItemStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
        border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
        fontWeight: 600, color: 'var(--c-on-bg)', textAlign: 'left', borderRadius: 'var(--c-radius)',
    };

    // ── Premium gate ──────────────────────────────────────────────────────────
    // Advanced Reports is a paid add-on. When locked, show an on-brand unlock
    // screen (soft upgrade CTA) instead of the report content.
    if (!reportsUnlocked) {
        const PERKS = [
            { icon: 'query_stats', text: 'Profit & loss, cashflow and financial position' },
            { icon: 'insights', text: 'Sales, inventory and customer analytics' },
            { icon: 'download', text: 'Export to CSV & PDF for tax and investors' },
            { icon: 'auto_awesome', text: 'AI business summaries and guidance' },
        ];
        return (
            <div className="crm">
                <aside className="crm-rail" aria-label="Reports navigation">
                    <div className="crm-rail__brand">
                        <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                        <div className="crm-rail__brand-text">
                            <span className="crm-rail__brand-title">SalePilot Reports</span>
                            <span className="crm-rail__brand-sub">Premium add-on</span>
                        </div>
                    </div>
                    <nav className="crm-rail__nav">
                        {SECTIONS.map(s => (
                            <button key={s.id} type="button" className="crm-rail__item" disabled style={{ opacity: 0.55, cursor: 'not-allowed' }}>
                                <Icon name={s.icon} size={22} />
                                <span style={{ flex: 1 }}>{s.label}</span>
                                <Icon name="lock" size={16} />
                            </button>
                        ))}
                    </nav>
                    <div className="crm-rail__foot">
                        <button type="button" className="crm-rail__item" onClick={() => navigate('/dash')}>
                            <Icon name="dashboard" size={22} /> Dashboard
                        </button>
                        <button type="button" className="crm-rail__item" onClick={() => navigate('/pos/discover')}>
                            <Icon name="menu" size={22} /> Discover Apps
                        </button>
                        <button type="button" className="crm-rail__item" onClick={() => navigate('/')}>
                            <Icon name="grid_view" size={22} /> Full App
                        </button>
                    </div>
                </aside>

                <div className="crm-body">
                    <header className="crm-bar crm-bar--mobile">
                        <div className="crm-bar__brand">
                            <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                            <span className="crm-bar__title">Reports</span>
                        </div>
                        <button type="button" className="crm-iconbtn" aria-label="Close" onClick={() => navigate('/dash')}>
                            <Icon name="close" size={22} />
                        </button>
                    </header>

                    <main className="crm-main crm-section-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="reports-lock">
                            <span className="reports-lock__badge">
                                <Icon name="workspace_premium" size={16} fill={1} /> Premium add-on
                            </span>
                            <span className="reports-lock__icon"><Icon name="lock" size={40} fill={1} /></span>
                            <h2 className="reports-lock__title">Unlock Advanced Reports</h2>
                            <p className="reports-lock__sub">
                                Detailed business reporting is a premium feature. Unlock it to dive into your
                                full financial picture — and pay only for what your shop needs.
                            </p>
                            <ul className="reports-lock__perks">
                                {PERKS.map(p => (
                                    <li key={p.text}>
                                        <span className="reports-lock__perk-ic"><Icon name={p.icon} size={20} /></span>
                                        {p.text}
                                    </li>
                                ))}
                            </ul>
                            <div className="reports-lock__actions">
                                <button type="button" className="crm-btn crm-btn--primary" onClick={() => navigate('/subscription')}>
                                    <Icon name="lock_open" size={20} /> Unlock Advanced Reports
                                </button>
                                <button type="button" className="crm-btn crm-btn--outline" onClick={() => navigate('/dash')}>
                                    Back to Dashboard
                                </button>
                            </div>
                            <p className="reports-lock__foot">Manage your plan &amp; add-ons from Subscription.</p>
                        </div>
                    </main>

                    <nav className="crm-bottomnav" aria-label="Reports navigation">
                        {SECTIONS.map(s => (
                            <button key={s.id} type="button" className="crm-bottomnav__item" style={{ opacity: 0.55 }} onClick={() => navigate('/subscription')}>
                                <Icon name={s.icon} size={24} />
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <style>{`
                    .crm .reports-lock { max-width: 520px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 32px 24px; background: var(--c-surface-lowest); border: 1px solid rgba(189,201,194,0.3); border-radius: var(--c-radius-xl); box-shadow: var(--c-elev-1); }
                    .crm .reports-lock__badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: var(--c-radius-pill); background: var(--c-secondary-container); color: var(--c-on-secondary-container); font-size: 12px; font-weight: 700; }
                    .crm .reports-lock__icon { width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--c-primary-container); color: var(--c-on-primary-container); box-shadow: 0 8px 24px -8px rgba(0,101,75,0.5); margin-top: 4px; }
                    .crm .reports-lock__title { font-size: 26px; font-weight: 700; letter-spacing: -0.01em; color: var(--c-on-bg); margin: 0; }
                    .crm .reports-lock__sub { font-size: 15px; line-height: 1.55; color: var(--c-on-surface-variant); margin: 0; max-width: 420px; }
                    .crm .reports-lock__perks { list-style: none; margin: 8px 0 4px; padding: 0; display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 380px; text-align: left; }
                    .crm .reports-lock__perks li { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; color: var(--c-on-bg); }
                    .crm .reports-lock__perk-ic { width: 36px; height: 36px; flex-shrink: 0; border-radius: var(--c-radius); display: inline-flex; align-items: center; justify-content: center; background: var(--c-surface-high); color: var(--c-primary); }
                    .crm .reports-lock__actions { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 380px; margin-top: 10px; }
                    .crm .reports-lock__actions .crm-btn { width: 100%; }
                    .crm .reports-lock__foot { font-size: 12px; color: var(--c-on-surface-variant); margin: 4px 0 0; }
                `}</style>

                {/* AI summary stays available even when reports is locked */}
            </div>
        );
    }

    return (
        <div className="crm">
            {/* Desktop side nav (the Reports app's own sidenav) */}
            <aside className="crm-rail" aria-label="Reports navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot Reports</span>
                        <span className="crm-rail__brand-sub">Business Insights</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            className={`crm-rail__item${activeTab === s.id ? ' is-active' : ''}`}
                            aria-current={activeTab === s.id ? 'page' : undefined}
                            onClick={() => setActiveTab(s.id)}
                        >
                            <Icon name={s.icon} size={22} fill={activeTab === s.id ? 1 : 0} />
                            {s.label}
                        </button>
                    ))}
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={() => navigate('/dash')}>
                        <Icon name="dashboard" size={22} /> Dashboard
                    </button>
                    <button type="button" className="crm-rail__item" onClick={() => navigate('/pos/discover')}>
                        <Icon name="menu" size={22} /> Discover Apps
                    </button>
                    <button type="button" className="crm-rail__item" onClick={() => navigate('/')}>
                        <Icon name="grid_view" size={22} /> Full App
                    </button>
                    <button type="button" className="crm-rail__item" onClick={() => navigate('/profile')}>
                        <div className="crm-rail__user" style={{ border: 'none', padding: 0, margin: 0 }}>
                            <Avatar name={user?.name} src={user?.profilePicture} size={32} />
                            <div className="crm-rail__user-info">
                                <span className="crm-rail__user-name">{user?.name}</span>
                                <span className="crm-rail__user-role">{user?.role}</span>
                            </div>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Content column */}
            <div className="crm-body">
                {/* Mobile top bar */}
                <header className="crm-bar crm-bar--mobile">
                    <div className="crm-bar__brand">
                        <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                        <span className="crm-bar__title">Reports</span>
                    </div>
                    <div className="crm-bar__actions">
                        <button type="button" className="crm-iconbtn" aria-label="Notifications" onClick={() => setIsNotificationsOpen(true)}>
                            <Icon name="notifications" size={22} />
                            {unreadCount > 0 && <span className="crm-iconbtn__dot" />}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="crm-bar__avatar"
                                aria-label="Account menu"
                                onClick={() => setMenuOpen(o => !o)}
                            >
                                {user?.profilePicture ? <img src={user.profilePicture} alt={user.name} /> : (user?.name?.[0]?.toUpperCase() || 'U')}
                            </button>
                            {menuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setMenuOpen(false)} aria-hidden="true" />
                                    <div role="menu" style={menuStyle}>
                                        <button type="button" role="menuitem" style={menuItemStyle} onClick={() => { setMenuOpen(false); navigate('/dash'); }}>
                                            <Icon name="dashboard" size={20} /> Dashboard
                                        </button>
                                        <button type="button" role="menuitem" style={menuItemStyle} onClick={() => { setMenuOpen(false); navigate('/pos/discover'); }}>
                                            <Icon name="menu" size={20} /> Discover Apps
                                        </button>
                                        <button type="button" role="menuitem" style={menuItemStyle} onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                                            <Icon name="account_circle" size={20} /> Account
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="crm-main crm-section-fade">
                    {/* Page header — greeting, date range, export */}
                    <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', rowGap: 16 }}>
                        <div>
                            <p className="crm-pagehead__eyebrow">{todayLabel}</p>
                            <h2 className="crm-pagehead__title">Financial Reports</h2>
                            <p className="crm-pagehead__sub">{getGreeting()}, {firstName} — review your business health.</p>
                        </div>

                        <div className="crm-pagehead__actions" style={{ alignItems: 'center' }}>
                            <div className="crm-chips" style={{ paddingBottom: 0 }}>
                                {DATE_PRESETS.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={`crm-chip${datePreset === p.id ? ' is-active' : ''}`}
                                        onClick={() => handleDatePreset(p.id)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    max={endDate}
                                    onChange={(e) => { setStartDate(e.target.value); setDatePreset('custom'); }}
                                    style={dateInputStyle}
                                    aria-label="Start date"
                                />
                                <span style={{ color: 'var(--c-on-surface-variant)' }}>–</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={(e) => { setEndDate(e.target.value); setDatePreset('custom'); }}
                                    style={dateInputStyle}
                                    aria-label="End date"
                                />
                            </div>

                            {activeTab === 'overview' && (
                                <>
                                    {isEditMode && (
                                        <button type="button" className="crm-btn crm-btn--tonal" onClick={() => setIsSettingsOpen(true)}>
                                            <LayoutGrid className="w-4 h-4" /> Library
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`crm-btn ${isEditMode ? 'crm-btn--filled' : 'crm-btn--outline'}`}
                                        onClick={() => setIsEditMode(v => !v)}
                                    >
                                        <Settings className="w-4 h-4" /> {isEditMode ? 'Done' : 'Customize'}
                                    </button>
                                </>
                            )}

                            <div style={{ position: 'relative' }} ref={exportMenuRef}>
                                <button type="button" className="crm-btn crm-btn--primary" onClick={() => setIsExportMenuOpen(o => !o)}>
                                    <Icon name="download" size={20} /> Export
                                    <Icon name="expand_more" size={18} />
                                </button>
                                {isExportMenuOpen && (
                                    <div role="menu" style={menuStyle}>
                                        <button type="button" role="menuitem" style={menuItemStyle} onClick={() => { handleExportCSV(); setIsExportMenuOpen(false); }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--c-primary)' }} /> Export as CSV
                                        </button>
                                        <button type="button" role="menuitem" style={menuItemStyle} onClick={() => { handleExportPDF(); setIsExportMenuOpen(false); }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--c-error)' }} /> Export as PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {renderContent()}
                </main>

                {/* Mobile bottom nav = the report sections */}
                <nav className="crm-bottomnav" aria-label="Reports navigation">
                    {SECTIONS.map(s => {
                        const isActive = activeTab === s.id;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                className={`crm-bottomnav__item${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => setActiveTab(s.id)}
                            >
                                <Icon name={s.icon} size={24} fill={isActive ? 1 : 0} />
                                <span>{s.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Notifications drawer */}
            {isNotificationsOpen && (
                <div className="crm-modal-backdrop" style={{ alignItems: 'stretch', justifyContent: 'flex-end' }} onClick={() => setIsNotificationsOpen(false)}>
                    <div
                        className="crm-modal"
                        style={{ maxWidth: 420, height: '100%', maxHeight: '100dvh', borderRadius: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="crm-modal__bar">
                            <h2 className="crm-modal__title" style={{ flex: 1 }}>Notifications</h2>
                            {unreadCount > 0 && (
                                <button className="crm-link" onClick={markAllAsRead}>Mark all read</button>
                            )}
                            <button className="crm-iconbtn" aria-label="Close" onClick={() => setIsNotificationsOpen(false)}>
                                <Icon name="close" size={22} />
                            </button>
                        </div>
                        <div className="crm-modal__body" style={{ gap: 12 }}>
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => !n.isRead && markAsRead(n.id)}
                                        className="crm-recip"
                                        style={{ textAlign: 'left', cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 4, borderLeft: n.isRead ? undefined : '3px solid var(--c-primary)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                            <span className="crm-recip__name" style={{ fontSize: 14 }}>{n.title}</span>
                                            {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--c-primary)', marginTop: 4, flexShrink: 0 }} />}
                                        </div>
                                        <span className="crm-recip__meta" style={{ whiteSpace: 'normal' }}>{n.message}</span>
                                        <span className="crm-recip__meta">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="crm-empty" style={{ padding: '48px 16px' }}>
                                    <Icon name="notifications_off" size={36} />
                                    <p className="crm-empty__text">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard customize drawer */}
            {isSettingsOpen && (
                <div className="crm-modal-backdrop" style={{ alignItems: 'stretch', justifyContent: 'flex-end' }} onClick={() => setIsSettingsOpen(false)}>
                    <div
                        className="crm-modal"
                        style={{ maxWidth: 400, height: '100%', maxHeight: '100dvh', borderRadius: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="crm-modal__bar" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, paddingTop: 20, paddingBottom: 16 }}>
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h2 className="crm-modal__title">Customize</h2>
                                <button className="crm-iconbtn" aria-label="Close" onClick={() => setIsSettingsOpen(false)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--c-on-surface-variant)', margin: 0 }}>Choose which cards appear on your overview.</p>
                        </div>
                        <div className="crm-modal__body" style={{ gap: 8 }}>
                            {cardConfig.slice().sort((a, b) => a.order - b.order).map((card) => (
                                <div key={card.id} className="crm-recip">
                                    <div className="crm-recip__id">
                                        <span className="crm-reward__icon" style={{ width: 40, height: 40, background: card.visible ? 'var(--c-primary-container)' : 'var(--c-surface-high)', color: card.visible ? 'var(--c-on-primary-container)' : 'var(--c-on-surface-variant)' }}>
                                            <LayoutGrid className="w-5 h-5" />
                                        </span>
                                        <span className="crm-recip__name" style={{ fontSize: 14 }}>{card.label}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`crm-switch${card.visible ? ' is-on' : ''}`}
                                        aria-pressed={card.visible}
                                        aria-label={`Toggle ${card.label}`}
                                        onClick={() => toggleCardVisibility(card.id)}
                                    >
                                        <span className="crm-switch__knob" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="crm-modal__foot">
                            <button type="button" className="crm-btn crm-btn--primary crm-btn--block" onClick={() => setIsSettingsOpen(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI summary floating helper */}
            {reportData && (
                <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={user?.name} />
            )}
        </div>
    );
};

export default ReportsPage;
