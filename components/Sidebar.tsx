import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import {
    HomeIcon,
    ShoppingCartIcon,
    ClockIcon,
    ArchiveBoxIcon,
    ArrowUturnLeftIcon,
    UsersIcon,
    TruckIcon,
    DocumentPlusIcon,
    CalculatorIcon,
    DocumentMagnifyingGlassIcon,
    UserIcon,
    Cog6ToothIcon,
    ChevronDoubleLeftIcon,
    ArrowLeftOnRectangleIcon,
    XMarkIcon,
    Bars3Icon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    SwatchIcon,
    BellAlertIcon
} from './icons';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
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
}

const NAV_ITEMS = [
    {
        name: 'Dashboard',
        page: 'reports',
        icon: HomeIcon,
        roles: ['superadmin', 'admin', 'inventory_manager'],
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
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager'],
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
        name: 'Superadmin',
        page: 'superadmin',
        icon: UserIcon,
        roles: ['superadmin'],
        badge: 'Pro'
    },
    {
        name: 'Profile',
        page: 'profile',
        icon: UserIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager'],
        badge: null
    },
];

const Sidebar: React.FC<SidebarProps> = ({
    currentPage,
    setCurrentPage,
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
    onMobileClose
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [mobileMode, setMobileMode] = useState<'menu' | 'settings'>('menu');
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Filter navigation items based on user role and allowed pages
    let navItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));
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
        setCurrentPage(page);
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

    return (
        <>
            {/* Mobile Overlay */}
            {showOnMobile && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                ref={sidebarRef}
                className={`
                    bg-gradient-to-b from-gray-50 to-white border-r border-gray-200/50
                    h-screen flex flex-col transition-all duration-300 ease-in-out z-50
                    fixed md:relative md:translate-x-0
                    ${isExpanded ? 'w-72 md:w-64' : 'w-20'}
                    ${showOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    shadow-xl md:shadow-none
                `}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#9CA3AF transparent'
                }}
            >
                {/* Mobile Header */}
                <div className="md:hidden px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">SalePilot</h1>
                            <p className="text-xs text-gray-500">Business Suite</p>
                        </div>
                    </div>
                    <button
                        onClick={onMobileClose}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        aria-label="Close menu"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Desktop Logo */}
                <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                            <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">SalePilot</h1>
                            <p className="text-xs text-gray-500 whitespace-nowrap">Business Suite</p>
                        </div>
                    </div>
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
                                <button
                                    onClick={() => onChangeSuperMode?.('store')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${superMode === 'store' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Store
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
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map(item => {
                        const IconComponent = item.icon;
                        const isActive = currentPage === item.page;

                        return (
                            <button
                                key={item.page}
                                onClick={() => handleNavigation(item.page)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-xl
                                    transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                                    ${!isExpanded && 'justify-center'}
                                `}
                                title={!isExpanded ? item.name : undefined}
                            >
                                <div className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
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
                                {/* Active indicator for collapsed mode */}
                                {!isExpanded && isActive && (
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile & Bottom Section */}
                <div className="px-3 py-4 border-t border-gray-200 space-y-4">
                    {/* User Profile */}
                    <div
                        onClick={() => handleNavigation('profile')}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${currentPage === 'profile' ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigation('profile')}
                        aria-label="View profile"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        </div>
                        <div className={`flex-1 min-w-0 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getRoleColor(user.role)}`}>
                                    <span className="mr-1">{getRoleIcon(user.role)}</span>
                                    {user.role.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

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
                        <div className={`flex items-center gap-2 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                            <span className="text-xs text-gray-500">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* Collapse/Expand Toggle */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!isExpanded && 'rotate-180'}`} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Floating Menu Button */}
            <button
                onClick={onMobileClose}
                className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
                aria-label="Open menu"
                style={{ marginBottom: 'env(safe-area-inset-bottom, 0)' }}
            >
                <Bars3Icon className="w-6 h-6" />
            </button>
        </>
    );
};

export default Sidebar;