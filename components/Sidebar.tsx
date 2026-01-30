import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, StoreSettings } from '../types';
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
    ChatBubbleLeftRightIcon
} from './icons';
import { HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2';
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
    storeSettings?: StoreSettings | null;
    lastSync?: number | null;
    isSyncing?: boolean;
    unreadNotificationsCount?: number;
    pendingMatchesCount?: number;
    installPrompt?: any | null;
    onInstall?: () => void;
}

const NAV_ITEMS = [
    {
        name: 'Quick View',
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
        name: 'Logistics',
        page: 'logistics',
        icon: TruckIcon,
        roles: ['admin', 'staff', 'inventory_manager'],
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
        name: 'Online Orders',
        page: 'orders',
        icon: TruckIcon,
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
        name: 'Marketing',
        page: 'marketing',
        icon: SparklesIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager'],
        badge: 'New'
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
    storeSettings,
    lastSync,
    isSyncing,
    unreadNotificationsCount,
    pendingMatchesCount,
    installPrompt,
    onInstall
}: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
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
            case 'admin': return 'bg-red-100 text-red-800';
            case 'staff': return 'bg-blue-100 text-blue-800';
            case 'inventory_manager': return 'bg-yellow-100 text-yellow-800';
            case 'superadmin': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
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

    return (
        <>
            {/* Mobile Popup Menu (Grid Layout) */}
            {showOnMobile && (
                <div
                    ref={sidebarRef}
                    className="md:hidden fixed inset-0 w-full h-full glass-effect backdrop-blur-md z-[70] flex flex-col pointer-events-auto animate-fade-in-up overflow-hidden"
                >
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                        <button
                            onClick={onMobileClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                        </button>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-3 gap-4">
                            {navItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <NavLink
                                        key={item.page}
                                        to={`/${item.page}`}
                                        onClick={() => window.innerWidth < 768 && onMobileClose?.()}
                                        className={({ isActive }) => `
                                            flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all group
                                            ${isActive ? 'bg-blue-50/50 active' : ''}
                                        `}
                                    >
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors bg-white border border-gray-100 text-gray-600 group-[.active]:bg-blue-100 group-[.active]:text-blue-600">
                                            <IconComponent className="w-7 h-7" />
                                        </div>
                                        <span className="text-xs font-medium text-center leading-tight text-gray-600 group-[.active]:text-blue-700">
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
                                    className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors bg-white border border-blue-100 text-blue-600">
                                        <ArrowDownTrayIcon className="w-7 h-7" />
                                    </div>
                                    <span className="text-xs font-medium text-center leading-tight text-blue-700">
                                        Install App
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Footer (User & Logout) */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => handleNavigation('profile')}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user.role}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLogout();
                                }}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar (Existing Layout) */}
            <aside
                className={`
                    hidden md:flex
                    bg-gray-100 
                    h-screen flex-col transition-all duration-300 ease-in-out z-50
                    relative translate-x-0
                    ${isExpanded ? 'w-64' : 'w-20'}
                    shadow-none
                `}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF transparent'
                }}
            >
                {/* Desktop Logo */}
                <div className={`flex h-16 items-center border-b border-gray-200 transition-all duration-300 ${isExpanded ? 'px-6 justify-between' : 'px-0 justify-center'}`}>
                    {/* Collapse/Expand Toggle (Top Left) */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors ${!isExpanded && 'absolute left-1/2 -translate-x-1/2'}`}
                        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <img
                        src={logo}
                        alt="SalePilot"
                        className={`transition-all duration-300 object-contain ${isExpanded ? 'h-8 w-auto' : 'hidden'}`}
                    />
                </div>

                {/* Mode Switcher */}
                {user.role === 'superadmin' && isExpanded && (
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Mode</span>
                                <SwatchIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onChangeSuperMode?.('superadmin')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${superMode === 'superadmin' ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Superadmin
                                </button>
                            </div>
                            {superMode === 'store' && storesForSelect && (
                                <div className="mt-3">
                                    <select
                                        value={selectedStoreId || ''}
                                        onChange={(e) => onSelectStore?.(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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

                {/* Navigation Items */}
                <nav className="custom-scrollbar flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map(item => {
                        const IconComponent = item.icon;

                        return (
                            <NavLink
                                id={`sidebar-nav-${item.page.replace('/', '-')}`}
                                key={item.page}
                                to={`/${item.page}`}
                                end={item.page === 'superadmin'}
                                className={({ isActive }) => `
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                    transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-gray-200 text-gray-700 active-link font-bold'
                                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                    }
                                    ${!isExpanded && 'justify-center'}
                                `}
                                title={!isExpanded ? item.name : undefined}
                            >
                                <div className="flex-shrink-0 text-gray-500 group-hover:text-gray-700 [[.active-link]_&]:text-blue-600">
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <div className={`flex-1 text-left transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                    <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                                </div>
                                {item.badge && isExpanded && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                                {!isExpanded && <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full opacity-0 [[.active-link]_&]:opacity-100"></div>}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User Profile & Bottom Section */}
                <div className="px-3 py-4 border-t border-gray-200 space-y-4">
                    {/* User Profile */}
                    <NavLink
                        id="sidebar-profile-section"
                        to="/profile"
                        className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigation('profile')}
                        aria-label="View profile"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                    {(user?.name || 'User').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        </div>
                        <div className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Guest User'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleColor(user?.role || 'staff')}`}>
                                    <span className="mr-1">{getRoleIcon(user?.role || 'staff')}</span>
                                    {(user?.role || 'staff').replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </NavLink>

                    {/* Visit Online Store */}
                    {(selectedStoreId || user.currentStoreId) && (storeSettings?.isOnlineStoreEnabled !== false) && (
                        <a
                            href={`/shop/${selectedStoreId || user.currentStoreId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-xl
                                text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700
                                transition-colors duration-200
                                ${!isExpanded && 'justify-center'}
                            `}
                            title={!isExpanded ? 'Visit Online Store' : undefined}
                        >
                            <HiOutlineArrowTopRightOnSquare className="w-5 h-5 flex-shrink-0" />
                            <span className={`text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                Visit Online Store
                            </span>
                        </a>
                    )}

                    {/* Install App Link (Manual Trigger) */}
                    {installPrompt && (
                        <button
                            onClick={onInstall}
                            className={`
                                flex items-center gap-3 px-3 py-3 rounded-xl
                                text-blue-600 hover:bg-blue-50 hover:text-blue-700
                                transition-colors duration-200
                                ${!isExpanded && 'justify-center'}
                            `}
                            title={!isExpanded ? 'Install App' : undefined}
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 flex-shrink-0" />
                            <span className={`text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                                Install App
                            </span>
                        </button>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-xl
                            text-gray-600 hover:bg-red-50 hover:text-red-700
                            transition-colors duration-200
                            ${!isExpanded && 'justify-center'}
                        `}
                        title={!isExpanded ? 'Logout' : undefined}
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
                        <span className={`text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            Logout
                        </span>
                    </button>

                    {/* Status & Toggle */}
                    <div className={`flex items-center justify-between px-3 ${!isExpanded && 'justify-center'}`}>
                        <div className={`flex flex-col gap-1 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isOnline ? (isSyncing ? 'bg-blue-500 animate-spin' : 'bg-green-500 animate-pulse') : 'bg-yellow-500'}`}></div>
                                <span className="text-xs text-gray-500">
                                    {isOnline ? (isSyncing ? 'Syncing...' : 'Online') : 'Offline'}
                                </span>
                            </div>
                            {lastSync && isExpanded && (
                                <span className="text-[10px] text-gray-400 pl-4">
                                    Synced {formatLastSync(lastSync)}
                                </span>
                            )}
                        </div>

                    </div>

                </div>
            </aside>
        </>
    );
};

