import { User } from '../types';
import { canAccessPage } from '../utils/rbac';
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
    BuildingStorefrontIcon,
    ClipboardDocumentListIcon,
    BellAlertIcon,
    CpuChipIcon,
    CreditCardIcon,
    BookOpenIcon,
    ChatBubbleLeftRightIcon,
    ChartBarIcon
} from './icons';

/**
 * SalePilot navigation registry + role-based access control.
 *
 * The Sidebar's *design layer* has been retired — navigation now lives in the
 * Discover apps page (`components/pos/PosDiscover.tsx`), which is the visual
 * launcher. This module is the shared *logic* layer: the canonical list of
 * pages with their role gates, consumed by Discover (and anywhere else that
 * needs to know what a user may open). The default export renders nothing and
 * exists only so legacy imports keep compiling.
 */

export interface NavItem {
    name: string;
    page: string;
    icon: React.ComponentType<{ className?: string }>;
    roles: User['role'][];
    badge: string | null;
}

export const NAV_ITEMS: NavItem[] = [
    {
        name: 'Dashboard',
        page: 'dash',
        icon: HomeIcon,
        roles: ['superadmin', 'admin', 'inventory_manager'],
        badge: null
    },
    {
        name: 'Business Assistant',
        page: 'quick-view',
        icon: CpuChipIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer', 'supplier'],
        badge: null
    },
    {
        name: 'Reports',
        page: 'reports',
        icon: ChartBarIcon,
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
        page: 'pos',
        icon: BuildingStorefrontIcon,
        roles: ['admin', 'staff'],
        badge: null
    },
    {
        name: 'Point of Sale',
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
        name: 'Logistics',
        page: 'logistics',
        icon: TruckIcon,
        roles: ['superadmin', 'admin', 'staff', 'inventory_manager'],
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

/**
 * RBAC selector — the pages a user may open, given their role and (optionally)
 * the store's entitlement allow-list. This is the same gate the old sidebar
 * applied; Discover now consumes it to render only permitted app cards.
 */
export function getAccessibleNavItems(user: Pick<User, 'role'>, allowedPages?: string[]): NavItem[] {
    // Authority comes from the canonical RBAC map (utils/rbac.ts), NOT the
    // per-item `roles` field (kept only as display metadata) — this guarantees
    // the launcher and the route guard agree.
    let items = NAV_ITEMS.filter(item => canAccessPage(user.role, item.page));
    if (allowedPages && allowedPages.length > 0) {
        items = items.filter(item => allowedPages.includes(item.page));
    }
    return items;
}

/**
 * Props the legacy Sidebar accepted. Retained so existing call sites
 * (`<Sidebar user={…} onLogout={…} … />`) keep type-checking against the stub.
 */
export interface SidebarProps {
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
    pendingMatchesCount?: number;
    installPrompt?: any | null;
    onInstall?: () => void;
}

/**
 * The Sidebar design layer has been removed in favour of the Discover apps
 * launcher. This stub keeps legacy `import Sidebar from './Sidebar'` call sites
 * compiling and renders nothing.
 */
export default function Sidebar(_props: SidebarProps) {
    return null;
}
