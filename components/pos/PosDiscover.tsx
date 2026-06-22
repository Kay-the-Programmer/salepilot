import React, { useMemo } from 'react';
import { User, StoreSettings } from '../../types';
import { getAccessibleNavItems } from '../Sidebar';
import PosIcon from '../sales/PosIcon';
import { hasModule, MODULES, isPageEntitled } from '../../utils/entitlements';
import '../../pages/sale-v2.css';
import './pos-shell.css';

interface PosDiscoverProps {
    user: User;
    /** Pages the current role/plan is entitled to (PERMISSIONS[role]). */
    allowedPages: string[];
    /** Store entitlements — used to mark premium add-on apps as locked. */
    storeSettings?: StoreSettings | null;
    /** Launch an app into the full app (navigates to /<page>). */
    onLaunch: (page: string) => void;
    onOpenSidebar?: () => void;
}

const premiumPillStyle: React.CSSProperties = {
    marginLeft: 6,
    padding: '1px 7px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: '#ffe2b8',
    color: '#8a5a00',
    verticalAlign: 'middle',
};

// Group the full-app sidebar entries into friendly launcher sections.
const GROUPS: { title: string; pages: string[] }[] = [
    { title: 'Overview', pages: ['reports', 'quick-view', 'superadmin', 'customer/dashboard'] },
    { title: 'Sell & Stock', pages: ['pos', 'sales', 'sales-history', 'orders', 'inventory', 'stock-takes', 'returns', 'purchase-orders', 'accounting'] },
    { title: 'Relationships', pages: ['customers', 'suppliers', 'users', 'logistics', 'superadmin/stores'] },
    { title: 'System', pages: ['settings', 'audit-trail', 'subscription', 'notifications', 'user-guide', 'profile', 'superadmin/settings', 'superadmin/notifications', 'superadmin/subscriptions'] },
];

const DESCRIPTIONS: Record<string, string> = {
    'reports': 'Detailed reports & export',
    'quick-view': 'AI business assistant',
    'pos': 'Point of sale terminal',
    'sales': 'Process a new sale',
    'sales-history': 'Past transactions',
    'orders': 'Online & pending orders',
    'inventory': 'Products & stock levels',
    'stock-takes': 'Count & reconcile stock',
    'returns': 'Returns & refunds',
    'purchase-orders': 'Restock from suppliers',
    'accounting': 'Books, expenses & P&L',
    'customers': 'Customer directory',
    'suppliers': 'Supplier directory',
    'users': 'Team & permissions',
    'logistics': 'Deliveries & tracking',
    'settings': 'Store configuration',
    'audit-trail': 'Activity log',
    'subscription': 'Plan & billing',
    'notifications': 'Alerts & messages',
    'user-guide': 'Help & documentation',
    'profile': 'Your account',
    'superadmin': 'Platform control center',
};

type AppItem = { name: string; page: string; icon: React.ComponentType<{ className?: string }> };

// Standalone apps that open in their own focused shell (not plain sidebar pages).
// Each is gated by a sidebar page the role/plan already grants.
const STANDALONE_APPS: { name: string; page: string; route: string; desc: string; iconName: string; requires: string; module?: string }[] = [
    { name: 'Business Dashboard', page: 'dash', route: 'dash', desc: 'Sales, trends & insights', iconName: 'monitoring', requires: 'reports' },
    { name: 'Hustle POS', page: 'hustle', route: 'hustle', desc: 'Fast amount-entry sales', iconName: 'bolt', requires: 'sales' },
    { name: 'Business Assistant', page: 'assistant', route: 'assistant', desc: 'AI insights & data chat', iconName: 'auto_awesome', requires: 'quick-view', module: MODULES.AI_ASSISTANT },
    { name: 'CRM', page: 'crm', route: 'crm', desc: 'Customers, loyalty & insights', iconName: 'diversity_3', requires: 'customers' },
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

export const PosDiscover: React.FC<PosDiscoverProps> = ({ user, allowedPages, storeSettings, onLaunch, onOpenSidebar }) => {
    // Pages now fronted by a dedicated standalone app card above — hide the raw
    // nav entry so it isn't listed twice (e.g. legacy 'quick-view' → Business Assistant).
    const SUPERSEDED_BY_APP = ['dash', 'quick-view', 'subscription', 'audit-trail', 'notifications', 'profile', 'accounting', 'logistics', 'purchase-orders', 'settings'];

    const available = useMemo<AppItem[]>(() => {
        // RBAC is enforced by the shared Sidebar logic layer (role + entitlement
        // allow-list); Discover is now the design layer that renders it.
        return getAccessibleNavItems(user, allowedPages)
            .filter(item => !SUPERSEDED_BY_APP.includes(item.page));
    }, [user, allowedPages]);

    const grouped = useMemo(() => {
        const claimed = new Set<string>();
        const sections = GROUPS.map(g => {
            const items = available.filter(a => g.pages.includes(a.page));
            items.forEach(i => claimed.add(i.page));
            return { title: g.title, items };
        }).filter(s => s.items.length > 0);

        const more = available.filter(a => !claimed.has(a.page));
        if (more.length > 0) sections.push({ title: 'More', items: more });
        return sections;
    }, [available]);

    return (
        <div className="posdash">
            <header className="posdash__bar">
                <button type="button" className="posdash__menu" aria-label="Open menu" onClick={onOpenSidebar}>
                    <PosIcon name="menu" size={22} />
                </button>
                <div>
                    <h1 className="posdash__title">Discover Apps</h1>
                    <p className="discover__sub">Jump to any SalePilot app</p>
                </div>
            </header>

            <div className="posdash__body">
                {(() => {
                    const apps = STANDALONE_APPS.filter(a => allowedPages.includes(a.requires));
                    if (apps.length === 0) return null;
                    return (
                        <div className="discover__group">
                            <h2 className="discover__group-title">SalePilot Apps</h2>
                            <div className="discover__grid">
                                {apps.map(app => {
                                    const locked = !!app.module && !hasModule(storeSettings, app.module);
                                    return (
                                    <button
                                        key={app.page}
                                        type="button"
                                        className="appcard"
                                        onClick={() => onLaunch(locked ? 'subscription' : app.route)}
                                        title={locked ? 'Premium add-on — tap to unlock' : undefined}
                                    >
                                        <span className="appcard__icon">
                                            <PosIcon name={app.iconName} size={24} />
                                        </span>
                                        <span className="appcard__name">
                                            {app.name}
                                            {locked && <span style={premiumPillStyle}>Premium</span>}
                                        </span>
                                        <span className="appcard__desc">{app.desc}</span>
                                        <span className="appcard__go">
                                            <PosIcon name={locked ? 'lock' : 'arrow_forward'} size={18} />
                                        </span>
                                    </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {grouped.length === 0 ? (
                    <div className="posdash__empty">
                        <PosIcon name="apps" size={40} />
                        <p>No apps available for your account.</p>
                    </div>
                ) : (
                    grouped.map(section => (
                        <div className="discover__group" key={section.title}>
                            <h2 className="discover__group-title">{section.title}</h2>
                            <div className="discover__grid">
                                {section.items.map(item => {
                                    const Icon = item.icon;
                                    const locked = !isPageEntitled(storeSettings, item.page);
                                    return (
                                        <button
                                            key={item.page}
                                            type="button"
                                            className="appcard"
                                            onClick={() => onLaunch(locked ? 'subscription' : item.page)}
                                            title={locked ? 'Premium add-on — tap to unlock' : undefined}
                                        >
                                            <span className="appcard__icon">
                                                <Icon className="w-6 h-6" />
                                            </span>
                                            <span className="appcard__name">
                                                {item.name}
                                                {locked && <span style={premiumPillStyle}>Premium</span>}
                                            </span>
                                            <span className="appcard__desc">{DESCRIPTIONS[item.page] || 'Open app'}</span>
                                            <span className="appcard__go">
                                                <PosIcon name={locked ? 'lock' : 'arrow_forward'} size={18} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PosDiscover;
