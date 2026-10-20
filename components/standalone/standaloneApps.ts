import { User } from '../../types';
import { ROLE_PAGES } from '../../utils/rbac';
import { MODULES } from '../../utils/entitlements';

/**
 * Canonical registry of the standalone "apps" that open from the SalePilot
 * launcher. Consumed by the in-app `AppSwitcher` / `AppSwitcherOverlay`. Each
 * app launches by navigating to `/<route>`; access is gated by `requires`
 * against the role's page permissions (`ROLE_PAGES`), with premium add-ons
 * gated further by the destination app's own paywall.
 */
/**
 * The jobs a shop does, in the order a shopkeeper thinks about them.
 *
 * The launcher used to list every app A–Z, which put Account, Accounting Hub
 * and Audit Trail next to each other and left Expenses nowhere near the books.
 * Alphabetical order only helps someone who already knows what the app is
 * called — which is precisely not the person opening this screen for the first
 * time. Grouping by the job instead means you can find something by knowing
 * what you want to do, not what we named it.
 */
export const APP_GROUPS = ['Sell', 'Stock', 'Customers', 'Money', 'Setup', 'Platform'] as const;
export type AppGroup = typeof APP_GROUPS[number];

export type AppDef = {
    name: string;
    page: string;
    route: string;
    desc: string;
    iconName: string;
    requires: string;
    group: AppGroup;
    module?: string;
    comingSoon?: boolean;
};

export const STANDALONE_APPS: AppDef[] = [
    { name: 'Super Admin', page: 'superadmin', route: 'superadmin', desc: 'Platform control centre', iconName: 'admin_panel_settings', requires: 'superadmin', group: 'Platform' },
    { name: 'Till', page: 'pos', route: 'pos', desc: 'Sell and take payment', iconName: 'point_of_sale', requires: 'sales', group: 'Sell' },
    { name: 'Sales Reports', page: 'dash', route: 'dash', desc: 'How the shop is doing', iconName: 'monitoring', requires: 'reports', group: 'Money' },
    // Hustle POS is withheld from launch as a separate app — its keypad is the
    // POS's "Quick" mode. See HUSTLE_APP_ENABLED in utils/entitlements.
    // { name: 'Online Orders', page: 'orders', route: 'orders', desc: 'Orders customers placed online', iconName: 'shopping_bag', requires: 'orders', group: 'Sell' },
    { name: 'Ask SalePilot', page: 'assistant', route: 'assistant', desc: 'Ask questions about your shop', iconName: 'auto_awesome', requires: 'quick-view', module: MODULES.AI_ASSISTANT, group: 'Money' },
    { name: 'Customers', page: 'crm', route: 'crm', desc: 'Customer list, loyalty and messages', iconName: 'diversity_3', requires: 'customers', group: 'Customers' },
    // Marketing Suite is withheld from launch — see MARKETING_ENABLED in utils/entitlements.
    // { name: 'Online Store', page: 'online-store', route: 'store', desc: 'Your shop link, QR code and sharing', iconName: 'storefront', requires: 'online-store', group: 'Sell' },
    { name: 'My Shops', page: 'businesses', route: 'businesses', desc: 'Run all your shops from one place', iconName: 'domain', requires: 'businesses', group: 'Setup' },
    { name: 'Stock', page: 'inv', route: 'inv', desc: 'What you have, what is running low', iconName: 'inventory_2', requires: 'inventory', group: 'Stock' },
    { name: 'Staff', page: 'team', route: 'team', desc: 'Who can use the shop and what they can do', iconName: 'manage_accounts', requires: 'users', group: 'Setup' },
    { name: 'Buy Stock', page: 'procure', route: 'procure', desc: 'Suppliers and orders you place', iconName: 'shopping_cart_checkout', requires: 'suppliers', group: 'Stock' },
    // { name: 'Buy from Shops', page: 'directory', route: 'marketplace', desc: 'Order stock from other shops near you', iconName: 'local_mall', requires: 'directory', group: 'Stock' },
    { name: 'Books', page: 'books', route: 'books', desc: 'Money in, money out and statements', iconName: 'account_balance', requires: 'accounting', group: 'Money' },
    { name: 'Expenses', page: 'expenses', route: 'expenses', desc: 'Record what you spend for the shop', iconName: 'receipt_long', requires: 'expenses', group: 'Money' },
    { name: 'Quotes & Invoices', page: 'sales-docs', route: 'quotes', desc: 'Price offers and bills for customers', iconName: 'description', requires: 'sales-docs', group: 'Sell' },
    // { name: 'Logistics', page: 'fleet', route: 'fleet', desc: 'Shipments, couriers & fleet', iconName: 'local_shipping', requires: 'logistics' },
    { name: 'Plan & Billing', page: 'subscription', route: 'subscription', desc: 'Your plan and payments', iconName: 'card_membership', requires: 'subscription', group: 'Setup' },
    { name: 'Settings', page: 'config', route: 'config', desc: 'Shop details, till and receipts', iconName: 'settings', requires: 'settings', group: 'Setup' },
    { name: 'Activity Log', page: 'audit', route: 'audit', desc: 'Who did what, and when', iconName: 'manage_search', requires: 'audit-trail', group: 'Setup' },
    { name: 'Notifications', page: 'notify', route: 'notify', desc: 'Alerts and messages', iconName: 'notifications', requires: 'notifications', group: 'Setup' },
    { name: 'My Account', page: 'account', route: 'account', desc: 'Your name, password and preferences', iconName: 'account_circle', requires: 'profile', group: 'Setup' },
    // Gated on 'profile' so every role can fetch the till installer, not just owners.
    { name: 'Desktop App', page: 'downloads', route: 'downloads', desc: 'Install the till on Windows', iconName: 'download', requires: 'profile', group: 'Setup' },
];

/** Pages the role is entitled to — mirrors Dashboard's `posAllowedPages`. */
const allowedPagesFor = (user: Pick<User, 'role'> | null | undefined): string[] =>
    user?.role === 'superadmin' ? [...ROLE_PAGES['admin'], 'superadmin'] : (ROLE_PAGES[user?.role as User['role']] || []);

/** The standalone apps the given user may open, in registry order. */
export const getLaunchableApps = (user: Pick<User, 'role'> | null | undefined): AppDef[] => {
    const allowed = allowedPagesFor(user);
    return STANDALONE_APPS.filter(a => allowed.includes(a.requires));
};
