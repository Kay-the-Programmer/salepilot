import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User } from '../types';
import {
    HomeIcon,
    ShoppingCartIcon,
    ClockIcon,
    ArchiveBoxIcon,
    ArrowUturnLeftIcon,
    UsersIcon,
    TruckIcon,
    ArrowDownTrayIcon,
    DocumentPlusIcon,
    CalculatorIcon,
    DocumentMagnifyingGlassIcon,
    UserIcon,
    Cog6ToothIcon,
    ArrowLeftOnRectangleIcon,
    BuildingStorefrontIcon,
    ClipboardDocumentListIcon,
    SwatchIcon,
    BellAlertIcon,
    SparklesIcon,
    CreditCardIcon,
    Bars3Icon,
    BookOpenIcon,
    XMarkIcon,
    ChatBubbleLeftRightIcon,
    SunIcon,
    MoonIcon
} from './icons';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../assets/logo.png';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    isOnline: boolean;
    allowedPages?: string[];
    superMode?: 'superadmin' | 'store';
    onChangeSuperMode?: (mode: 'superadmin' | 'store') => void;
    storesForSelect?: { id: string; name: string }[];
    selectedStoreId?: string | undefined;
    onSelectStore?: (storeId: string) => void;
    showOnMobile?: boolean;
    onMobileClose?: () => void;
    lastSync?: number | null;
    isSyncing?: boolean;
    unreadNotificationsCount?: number;
    pendingMatchesCount?: number;
    installPrompt?: any | null;
    onInstall?: () => void;
}

const NAV_ITEMS = [
    {
        name: 'Business Assistant',
        page: 'quick-view',
        icon: SparklesIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer', 'supplier'],
        badge: null
    },
    {
        name: 'Dashboard',
        page: 'reports',
        icon: HomeIcon,
        roles: ['superadmin', 'admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Dashboard',
        page: 'customer/dashboard',
        icon: HomeIcon,
        roles: ['customer'],
        badge: null
    },
    {
        name: 'My Orders',
        page: 'customer/orders',
        icon: ShoppingCartIcon,
        roles: ['customer'],
        badge: null
    },
    {
        name: 'POS Terminal',
        page: 'sales',
        icon: ShoppingCartIcon,
        roles: ['admin', 'staff'],
        badge: null
    },
    {
        name: 'Sales History',
        page: 'sales-history',
        icon: ClockIcon,
        roles: ['admin', 'staff'],
        badge: null
    },
    {
        name: 'Inventory',
        page: 'inventory',
        icon: ArchiveBoxIcon,
        roles: ['admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Stock Takes',
        page: 'stock-takes',
        icon: ClipboardDocumentListIcon,
        roles: ['admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Returns',
        page: 'returns',
        icon: ArrowUturnLeftIcon,
        roles: ['admin', 'staff'],
        badge: null
    },
    {
        name: 'Customers',
        page: 'customers',
        icon: UsersIcon,
        roles: ['admin'],
        badge: null
    },
    {
        name: 'Suppliers',
        page: 'suppliers',
        icon: TruckIcon,
        roles: ['admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Purchase Orders',
        page: 'purchase-orders',
        icon: DocumentPlusIcon,
        roles: ['admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Accounting',
        page: 'accounting',
        icon: CalculatorIcon,
        roles: ['superadmin', 'admin'],
        badge: null
    },
    {
        name: 'Audit Trail',
        page: 'audit-trail',
        icon: DocumentMagnifyingGlassIcon,
        roles: ['superadmin', 'admin'],
        badge: null
    },
    {
        name: 'Users',
        page: 'users',
        icon: UsersIcon,
        roles: ['superadmin', 'admin'],
        badge: null
    },
    {
        name: 'Notifications',
        page: 'notifications',
        icon: BellAlertIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer'],
        badge: null
    },
    {
        name: 'Settings',
        page: 'settings',
        icon: Cog6ToothIcon,
        roles: ['superadmin', 'admin'],
        badge: null
    },
    {
        name: 'Subscription',
        page: 'subscription',
        icon: CreditCardIcon,
        roles: ['superadmin', 'admin'],
        badge: null
    },
    {
        name: 'Overview',
        page: 'superadmin',
        icon: HomeIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Stores',
        page: 'superadmin/stores',
        icon: BuildingStorefrontIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Broadcasts',
        page: 'superadmin/notifications',
        icon: BellAlertIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Billing',
        page: 'superadmin/subscriptions',
        icon: CreditCardIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Settings',
        page: 'superadmin/settings',
        icon: Cog6ToothIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Profile',
        page: 'profile',
        icon: UserIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer'],
        badge: null
    },
    {
        name: 'Marketplace',
        page: 'directory',
        icon: BuildingStorefrontIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer'],
        badge: null
    },
    {
        name: 'User Guide',
        page: 'user-guide',
        icon: BookOpenIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer'],
        badge: null
    },
    {
        name: 'WhatsApp Support',
        page: 'whatsapp/conversations',
        icon: ChatBubbleLeftRightIcon,
        roles: ['superadmin'],
        badge: null
    },
    {
        name: 'Contact Support',
        page: 'support',
        icon: ChatBubbleLeftRightIcon,
        roles: ['admin'],
        badge: null
    },
];

export default function Sidebar({
    user,
    onLogout,
    isOnline,
    allowedPages,
    superMode = 'store',
    onChangeSuperMode,
    storesForSelect,
    selectedStoreId,
    onSelectStore,
    showOnMobile = false,
    onMobileClose,
    lastSync,
    isSyncing,
    unreadNotificationsCount,
    pendingMatchesCount,
    installPrompt,
    onInstall
}: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { theme, toggleTheme } = useTheme();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Filter navigation items based on user role and allowed pages
    const navItemsWithBadges = NAV_ITEMS.map(item => {
        if (item.page === 'notifications' && (unreadNotificationsCount || 0) > 0) {
            return { ...item, badge: unreadNotificationsCount?.toString() || null };
        }
        if (item.page === 'directory' && (pendingMatchesCount || 0) > 0) {
            return { ...item, badge: pendingMatchesCount?.toString() || null };
        }
        return item;
    });

    let navItems = navItemsWithBadges.filter(item => item.roles.includes(user.role));
    if (allowedPages && allowedPages.length > 0) {
        navItems = navItems.filter(item => allowedPages.includes(item.page));
    }

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showOnMobile &&
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target as Node) &&
                window.innerWidth < 768) {
                onMobileClose?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showOnMobile, onMobileClose]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (showOnMobile && window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showOnMobile]);


    const handleNavigation = (page: string) => {
        navigate(`/${page}`);
        if (window.innerWidth < 768) {
            onMobileClose?.();
        }
    };

    const getRoleColor = (role: User['role']) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
            case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
            case 'inventory_manager': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
            case 'superadmin': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
        }
    };

    const getRoleIcon = (role: User['role']) => {
        switch (role) {
            case 'admin': return '👑';
            case 'staff': return '👤';
            case 'inventory_manager': return '📦';
            case 'superadmin': return '🦸';
            default: return '👤';
        }
    };

    const formatLastSync = (timestamp: number | null | undefined) => {
        if (!timestamp) return 'Never';
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    // Shared nav link renderer for both desktop sidebar and mobile
    const renderNavItem = (item: typeof navItems[0], compact = false) => {
        const IconComponent = item.icon;
        return (
            <NavLink
                id={`sidebar-nav-${item.page.replace('/', '-')}`}
                key={item.page}
                to={`/${item.page}`}
                end={item.page === 'superadmin'}
                onClick={() => window.innerWidth < 768 && onMobileClose?.()}
                className={({ isActive }) => `
                    w-full flex items-center gap-3 px-3 py-2 rounded-xl
                    transition-all duration-200 group relative
                    ${isActive
                        ? 'bg-gray-200/50 dark:bg-white/10 text-gray-900 dark:text-white active-link font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5'
                    }
                    ${compact ? 'justify-center' : ''}
                `}
                title={compact ? item.name : undefined}
            >
                <div className="flex-shrink-0 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-100 [[.active-link]_&]:text-blue-500 dark:[[.active-link]_&]:text-blue-400 transition-colors">
                    <IconComponent className="w-5 h-5" />
                </div>
                {!compact && (
                    <div className="flex-1 text-left">
                        <span className="text-[13px] leading-tight">{item.name}</span>
                    </div>
                )}
                {item.badge && !compact && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full">
                        {item.badge}
                    </span>
                )}
                {compact && <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 [[.active-link]_&]:opacity-100 transition-opacity"></div>}
            </NavLink>
        );
    };

    return (
        <>
            {/* Mobile Popup Menu (Grid Layout) */}
            {showOnMobile && (
                <div
                    ref={sidebarRef}
                    className="md:hidden fixed inset-0 w-full h-full bg-white/70 dark:bg-black/70 backdrop-blur-2xl z-[70] flex flex-col pointer-events-auto animate-fade-in-up overflow-hidden"
                >
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 text-gray-900 dark:text-white select-none">
                        <h2 className="text-3xl font-bold tracking-tight">Menu</h2>
                        <button
                            onClick={onMobileClose}
                            className="p-2 rounded-full bg-gray-200/50 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors active:scale-95 duration-200"
                            aria-label="Close menu"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                        <div className="grid grid-cols-4 gap-x-2 gap-y-6">
                            {navItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <NavLink
                                        key={item.page}
                                        to={`/${item.page}`}
                                        onClick={() => window.innerWidth < 768 && onMobileClose?.()}
                                        className={({ isActive }) => `
                                            flex flex-col items-center group
                                            ${isActive ? 'active' : ''}
                                        `}
                                    >
                                        <div className="relative">
                                            <div className="w-[60px] h-[60px] mx-auto rounded-[1.25rem] flex items-center justify-center transition-all duration-200 
                                                bg-white dark:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-gray-100/50 dark:border-white/5
                                                text-gray-600 dark:text-gray-300 group-hover:scale-105 group-active:scale-95 group-[.active]:text-blue-600 dark:group-[.active]:text-blue-400">
                                                <IconComponent className="w-[26px] h-[26px]" />
                                            </div>
                                            {item.badge && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10">
                                                    {item.badge}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium text-center leading-tight text-gray-700 dark:text-gray-300 mt-1.5 truncate w-full px-1 group-[.active]:text-blue-600 dark:group-[.active]:text-blue-400 group-[.active]:font-semibold">
                                            {item.name}
                                        </span>
                                    </NavLink>
                                );
                            })}
                            {installPrompt && (
                                <button
                                    onClick={() => {
                                        onInstall?.();
                                        onMobileClose?.();
                                    }}
                                    className="flex flex-col items-center group"
                                >
                                    <div className="w-[60px] h-[60px] mx-auto rounded-[1.25rem] flex items-center justify-center transition-all duration-200 
                                        bg-white dark:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-gray-100/50 dark:border-white/5
                                        text-blue-500 group-hover:scale-105 group-active:scale-95">
                                        <ArrowDownTrayIcon className="w-[26px] h-[26px]" />
                                    </div>
                                    <span className="text-[11px] font-medium text-center leading-tight text-blue-600 dark:text-blue-400 mt-1.5 truncate w-full px-1 group-[.active]:font-semibold">
                                        Install App
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Footer (User & Logout) */}
                    <div className="p-6 pb-8 mx-auto w-full max-w-sm">
                        <div className="flex items-center gap-4 p-4 rounded-[1.75rem] bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner text-lg" onClick={() => handleNavigation('profile')}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0" onClick={() => handleNavigation('profile')}>
                                <p className="text-base font-semibold text-gray-900 dark:text-white truncate tracking-tight">{user.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate tracking-tight">{user.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="p-3 rounded-full bg-gray-100/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:scale-105 active:scale-95 transition-all duration-300"
                                >
                                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="p-3 rounded-full bg-red-50/80 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:scale-105 active:scale-95 transition-all duration-300"
                                >
                                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar — Unified single-column layout */}
            <aside
                className={`
                    hidden md:flex
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl
                    h-screen flex-col transition-all duration-300 ease-in-out z-50
                    relative translate-x-0 border-r border-gray-200/50 dark:border-white/10
                    ${isExpanded ? 'w-64' : 'w-20'}
                `}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF transparent'
                }}
            >
                {/* ─── Header (Logo + Toggle) ─── */}
                <div className={`flex h-14 items-center shrink-0 transition-all duration-300 ${isExpanded ? 'px-5 justify-between' : 'px-0 justify-center'}`}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors ${!isExpanded && 'absolute left-1/2 -translate-x-1/2'}`}
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>

                    <img
                        src={logo}
                        alt="SalePilot"
                        className={`transition-all duration-300 object-contain ${isExpanded ? 'h-7 w-auto' : 'hidden'}`}
                    />
                </div>

                {/* ─── User Profile Card ─── */}
                <div className={`shrink-0 px-3 ${isExpanded ? 'pt-2 pb-3' : 'py-3'}`}>
                    <NavLink
                        id="sidebar-profile-section"
                        to="/profile"
                        className={({ isActive }) => `
                            flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200
                            ${isExpanded ? 'p-3' : 'p-2 justify-center'}
                            ${isActive
                                ? 'bg-blue-50/80 dark:bg-blue-500/10'
                                : 'hover:bg-gray-100/70 dark:hover:bg-white/[0.05]'
                            }
                        `}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigation('profile')}
                        aria-label="View profile"
                    >
                        <div className="relative flex-shrink-0">
                            <div className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm ${isExpanded ? 'w-9 h-9' : 'w-10 h-10'}`}>
                                <span className={`text-white font-semibold ${isExpanded ? 'text-sm' : 'text-base'}`}>
                                    {(user?.name || 'User').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        </div>
                        {isExpanded && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Guest User'}</p>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md mt-0.5 ${getRoleColor(user?.role || 'staff')}`}>
                                    <span>{getRoleIcon(user?.role || 'staff')}</span>
                                    {(user?.role || 'staff').replace('_', ' ')}
                                </span>
                            </div>
                        )}
                    </NavLink>
                </div>

                {/* ─── Mode Switcher (Superadmin only) ─── */}
                {user.role === 'superadmin' && isExpanded && (
                    <div className="shrink-0 px-3 pb-2">
                        <div className="bg-gray-50/80 dark:bg-white/[0.03] rounded-xl p-2.5">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Mode</span>
                                <SwatchIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onChangeSuperMode?.('superadmin')}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${superMode === 'superadmin' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.1]'}`}
                                >
                                    Superadmin
                                </button>
                            </div>
                            {superMode === 'store' && storesForSelect && (
                                <div className="mt-2">
                                    <select
                                        value={selectedStoreId || ''}
                                        onChange={(e) => onSelectStore?.(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-white"
                                    >
                                        <option value="">Select Store</option>
                                        {storesForSelect.map(store => (
                                            <option key={store.id} value={store.id}>
                                                {store.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Subtle separator ─── */}
                <div className="mx-4 border-t border-gray-100 dark:border-white/[0.04]" />

                {/* ─── Navigation ─── */}
                <nav className="custom-scrollbar flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
                    {navItems.map(item => renderNavItem(item, !isExpanded))}
                </nav>

                {/* ─── Subtle separator ─── */}
                <div className="mx-4 border-t border-gray-100 dark:border-white/[0.04]" />

                {/* ─── Bottom Actions (integrated, no separate panel) ─── */}
                <div className={`shrink-0 px-3 py-2 space-y-0.5`}>
                    {/* Install App */}
                    {installPrompt && (
                        <button
                            onClick={onInstall}
                            className={`
                                flex items-center gap-3 px-4 py-2.5 rounded-xl w-full
                                text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-500/[0.08] hover:text-blue-700 dark:hover:text-blue-300
                                transition-colors duration-200
                                ${!isExpanded && 'justify-center'}
                            `}
                            title={!isExpanded ? 'Install App' : undefined}
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm font-medium">Install App</span>}
                        </button>
                    )}

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`
                            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                            text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-white/[0.05] hover:text-gray-700 dark:hover:text-white
                            transition-colors duration-200
                            ${!isExpanded && 'justify-center'}
                        `}
                        title={!isExpanded ? (theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode') : undefined}
                    >
                        {theme === 'light' ? (
                            <>
                                <MoonIcon className="w-5 h-5 flex-shrink-0" />
                                {isExpanded && <span className="text-sm font-medium">Dark Mode</span>}
                            </>
                        ) : (
                            <>
                                <SunIcon className="w-5 h-5 flex-shrink-0" />
                                {isExpanded && <span className="text-sm font-medium">Light Mode</span>}
                            </>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={onLogout}
                        className={`
                            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                            text-gray-500 dark:text-gray-400 hover:bg-red-50/80 dark:hover:bg-red-500/[0.08] hover:text-red-600 dark:hover:text-red-400
                            transition-colors duration-200
                            ${!isExpanded && 'justify-center'}
                        `}
                        title={!isExpanded ? 'Logout' : undefined}
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                        {isExpanded && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>

                {/* ─── Status Bar ─── */}
                <div className={`shrink-0 px-4 py-2 ${!isExpanded && 'flex justify-center'}`}>
                    <div className={`flex items-center gap-2 ${!isExpanded ? 'justify-center' : ''}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? (isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500') : 'bg-amber-500'}`} />
                        {isExpanded && (
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                    {isOnline ? (isSyncing ? 'Syncing…' : 'Online') : 'Offline'}
                                </span>
                                {lastSync && (
                                    <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                        Synced {formatLastSync(lastSync)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};
