/**
 * Frontend Role-Based Access Control — single source of truth.
 * ---------------------------------------------------------------------------
 * Mirrors the backend matrix in `s-back/src/auth/rbac.ts`. Two layers:
 *
 *  1. CAPABILITIES (`ROLE_PERMISSIONS` + `can`) — fine-grained `resource:action`
 *     permissions, used to show/hide individual controls (e.g. an "edit
 *     customer" button). These MUST stay in sync with the backend so the UI
 *     never offers an action the API will reject.
 *
 *  2. PAGE ACCESS (`PAGE_ACCESS` + `canAccessPage` / `ROLE_PAGES`) — which app
 *     "pages" a role may open. Both the route guard (Dashboard) and the app
 *     launcher (PosDiscover via Sidebar) consume this, so navigation and
 *     routing can never disagree.
 *
 * DENY BY DEFAULT: a role only gets what is listed here.
 */
import { User } from '../types';

export type Role = User['role']; // 'superadmin' | 'admin' | 'staff' | 'inventory_manager' | 'customer' | 'supplier'

export type Permission =
    | 'platform:manage'
    | 'users:manage'
    | 'settings:read'
    | 'settings:manage'
    | 'accounting:manage'
    | 'expenses:manage'
    | 'billing:manage'
    | 'audit:read'
    | 'inventory:read'
    | 'inventory:manage'
    | 'suppliers:manage'
    | 'purchasing:manage'
    | 'sales:read'
    | 'sales:perform'
    | 'returns:perform'
    | 'customers:read'
    | 'customers:create'
    | 'customers:manage'
    | 'reports:dashboard'
    | 'reports:sales'
    | 'logistics:read'
    | 'logistics:manage'
    | 'messaging:read'
    | 'messaging:send'
    | 'messaging:manage'
    | 'ai:use';

const STORE_PERMISSIONS: Permission[] = [
    'users:manage', 'settings:read', 'settings:manage', 'accounting:manage', 'expenses:manage',
    'billing:manage', 'audit:read', 'inventory:read', 'inventory:manage', 'suppliers:manage',
    'purchasing:manage', 'sales:read', 'sales:perform', 'returns:perform', 'customers:read',
    'customers:create', 'customers:manage', 'reports:dashboard', 'reports:sales', 'logistics:read',
    'logistics:manage', 'messaging:read', 'messaging:send', 'messaging:manage', 'ai:use',
];

/** Capability matrix — kept identical to the backend. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    superadmin: ['platform:manage', ...STORE_PERMISSIONS],
    admin: [...STORE_PERMISSIONS],
    inventory_manager: [
        'inventory:read', 'inventory:manage', 'suppliers:manage', 'purchasing:manage',
        'reports:dashboard', 'settings:read', 'logistics:read', 'logistics:manage', 'ai:use',
    ],
    staff: [
        'inventory:read', 'sales:read', 'sales:perform', 'returns:perform', 'customers:read',
        'customers:create', 'reports:sales', 'settings:read', 'logistics:read', 'logistics:manage',
        'messaging:read', 'messaging:send', 'ai:use',
    ],
    customer: [],
    supplier: [],
};

/** Does the role hold the capability? */
export const can = (role: Role | undefined, permission: Permission): boolean =>
    !!role && ROLE_PERMISSIONS[role]?.includes(permission);

/** All capabilities held by a role. */
export const permissionsForRole = (role: Role | undefined): Permission[] =>
    role && ROLE_PERMISSIONS[role] ? [...ROLE_PERMISSIONS[role]] : [];

/**
 * Canonical page → allowed-roles map. `superadmin` is handled as a wildcard in
 * the helpers below (the platform owner can reach everything), so it does not
 * need to be listed on every store page.
 */
export const PAGE_ACCESS: Record<string, Role[]> = {
    // Dashboards & insight
    'dash':                     ['admin', 'inventory_manager'],
    'reports':                  ['admin', 'inventory_manager'],
    'quick-view':               ['admin', 'staff', 'inventory_manager', 'customer', 'supplier'],

    // POS & sales
    'pos':                      ['admin', 'staff'],
    'sales':                    ['admin', 'staff'],
    'sales-history':            ['admin', 'staff'],
    'orders':                   ['admin', 'staff'],
    'returns':                  ['admin', 'staff'],

    // Inventory & products
    'inventory':                ['admin', 'inventory_manager', 'staff'],
    'categories':               ['admin', 'inventory_manager'],
    'stock-takes':              ['admin', 'inventory_manager'],
    'suppliers':                ['admin', 'inventory_manager'],
    'purchase-orders':          ['admin', 'inventory_manager'],

    // CRM
    'customers':                ['admin', 'staff'],

    // Marketing (Facebook Pages suite)
    'marketing':                ['admin'],

    // Finance & billing
    'accounting':               ['admin'],
    'subscription':             ['admin'],

    // Team & governance
    'users':                    ['admin'],
    'audit-trail':              ['admin'],
    'settings':                 ['admin'],

    // Logistics
    'logistics':                ['admin', 'staff', 'inventory_manager'],

    // Comms & support
    'notifications':            ['admin', 'staff', 'inventory_manager', 'customer', 'supplier'],
    'support':                  ['admin'],
    'whatsapp/conversations':   [], // superadmin-only (wildcard)
    'whatsapp/settings':        [], // superadmin-only (wildcard)

    // Marketplace / discovery
    'directory':                ['admin', 'staff', 'inventory_manager', 'customer'],

    // Customer self-service
    'customer/dashboard':       ['customer'],
    'customer/orders':          ['customer'],

    // Supplier self-service
    'supplier/dashboard':       ['supplier'],
    'supplier/orders':          ['supplier'],

    // Universal
    'profile':                  ['admin', 'staff', 'inventory_manager', 'customer', 'supplier'],
    'user-guide':               ['admin', 'staff', 'inventory_manager', 'customer', 'supplier'],
    'privacy':                  ['admin', 'staff', 'inventory_manager', 'customer', 'supplier'],

    // Platform administration (superadmin)
    'superadmin':               ['superadmin'],
    'superadmin/stores':        ['superadmin'],
    'superadmin/notifications': ['superadmin'],
    'superadmin/subscriptions': ['superadmin'],
    'superadmin/settings':      ['superadmin'],
};

/** Can this role open this page? Superadmin can reach any known page. */
export const canAccessPage = (role: Role | undefined, page: string): boolean => {
    if (!role) return false;
    if (role === 'superadmin') return true;
    return !!PAGE_ACCESS[page]?.includes(role);
};

/** Every page a role may open (superadmin = all known pages). */
export const pagesForRole = (role: Role): string[] => {
    if (role === 'superadmin') return Object.keys(PAGE_ACCESS);
    return Object.keys(PAGE_ACCESS).filter(page => PAGE_ACCESS[page].includes(role));
};

const ALL_ROLES: Role[] = ['superadmin', 'admin', 'staff', 'inventory_manager', 'customer', 'supplier'];

/**
 * Role → pages map. Shape-compatible with the legacy `PERMISSIONS` object the
 * Dashboard route guard relies on (`PERMISSIONS[role]: string[]`).
 */
export const ROLE_PAGES: Record<Role, string[]> = ALL_ROLES.reduce((acc, role) => {
    acc[role] = pagesForRole(role);
    return acc;
}, {} as Record<Role, string[]>);
