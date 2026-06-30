import { User } from '../../types';
import { ROLE_PAGES } from '../../utils/rbac';
import { MODULES, MARKETING_COMING_SOON } from '../../utils/entitlements';

/**
 * Canonical registry of the standalone "apps" that open from the SalePilot
 * launcher. Consumed by the in-app `AppSwitcher` / `AppSwitcherOverlay`. Each
 * app launches by navigating to `/<route>`; access is gated by `requires`
 * against the role's page permissions (`ROLE_PAGES`), with premium add-ons
 * gated further by the destination app's own paywall.
 */
export type AppDef = {
    name: string;
    page: string;
    route: string;
    desc: string;
    iconName: string;
    requires: string;
    module?: string;
    comingSoon?: boolean;
};

export const STANDALONE_APPS: AppDef[] = [
    { name: 'Super Admin', page: 'superadmin', route: 'superadmin', desc: 'Platform control center', iconName: 'admin_panel_settings', requires: 'superadmin' },
    { name: 'POS Terminal', page: 'pos', route: 'pos', desc: 'Ring up sales & checkout', iconName: 'point_of_sale', requires: 'sales' },
    { name: 'Business Dashboard', page: 'dash', route: 'dash', desc: 'Sales, trends & insights', iconName: 'monitoring', requires: 'reports' },
    { name: 'Hustle POS', page: 'hustle', route: 'hustle', desc: 'Fast amount-entry sales', iconName: 'bolt', requires: 'sales' },
    { name: 'Business Assistant', page: 'assistant', route: 'assistant', desc: 'AI insights & data chat', iconName: 'auto_awesome', requires: 'quick-view', module: MODULES.AI_ASSISTANT },
    { name: 'CRM', page: 'crm', route: 'crm', desc: 'Customers, loyalty & insights', iconName: 'diversity_3', requires: 'customers' },
    { name: 'Marketing Suite', page: 'marketing', route: 'marketing', desc: 'Facebook posts, comments & insights', iconName: 'campaign', requires: 'marketing', comingSoon: MARKETING_COMING_SOON },
    { name: 'Online Store', page: 'online-store', route: 'store', desc: 'Storefront link, QR & catalog sharing', iconName: 'storefront', requires: 'online-store' },
    { name: 'My Businesses', page: 'businesses', route: 'businesses', desc: 'Run multiple shops from one account', iconName: 'domain', requires: 'businesses' },
    { name: 'Inventory Manager', page: 'inv', route: 'inv', desc: 'Stock value, alerts & items', iconName: 'inventory_2', requires: 'inventory' },
    { name: 'User Manager', page: 'team', route: 'team', desc: 'Team members, roles & access', iconName: 'manage_accounts', requires: 'users' },
    { name: 'Procurement Hub', page: 'procure', route: 'procure', desc: 'Suppliers & purchase orders', iconName: 'local_shipping', requires: 'suppliers' },
    { name: 'Accounting Hub', page: 'books', route: 'books', desc: 'Ledger, expenses & reports', iconName: 'account_balance', requires: 'accounting' },
    { name: 'Logistics', page: 'fleet', route: 'fleet', desc: 'Shipments, couriers & fleet', iconName: 'local_shipping', requires: 'logistics' },
    { name: 'Purchase Orders', page: 'po', route: 'po', desc: 'Order lists & supplier POs', iconName: 'shopping_cart_checkout', requires: 'purchase-orders' },
    { name: 'Subscription', page: 'subscription', route: 'subscription', desc: 'Plan, billing & modules', iconName: 'card_membership', requires: 'subscription' },
    { name: 'Settings', page: 'config', route: 'config', desc: 'Store, POS & system config', iconName: 'settings', requires: 'settings' },
    { name: 'Audit Trail', page: 'audit', route: 'audit', desc: 'Activity log & alerts', iconName: 'manage_search', requires: 'audit-trail' },
    { name: 'Notifications', page: 'notify', route: 'notify', desc: 'Alerts & messages', iconName: 'notifications', requires: 'notifications' },
    { name: 'Account', page: 'account', route: 'account', desc: 'Profile & preferences', iconName: 'account_circle', requires: 'profile' },
];

/** Pages the role is entitled to — mirrors Dashboard's `posAllowedPages`. */
const allowedPagesFor = (user: Pick<User, 'role'> | null | undefined): string[] =>
    user?.role === 'superadmin' ? [...ROLE_PAGES['admin'], 'superadmin'] : (ROLE_PAGES[user?.role as User['role']] || []);

/** The standalone apps the given user may open, in registry order. */
export const getLaunchableApps = (user: Pick<User, 'role'> | null | undefined): AppDef[] => {
    const allowed = allowedPagesFor(user);
    return STANDALONE_APPS.filter(a => allowed.includes(a.requires));
};
