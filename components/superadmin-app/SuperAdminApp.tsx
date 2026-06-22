import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import SuperAdminDashboard from '../../pages/superadmin/SuperAdminDashboard';
import SuperAdminStores from '../../pages/superadmin/SuperAdminStores';
import SuperAdminStoreDetails from '../../pages/superadmin/SuperAdminStoreDetails';
import SuperAdminNotifications from '../../pages/superadmin/SuperAdminNotifications';
import SuperAdminSubscriptions from '../../pages/superadmin/SuperAdminSubscriptions';
import SuperAdminCatalog from '../../pages/superadmin/SuperAdminCatalog';
import SuperAdminSettings from '../../pages/superadmin/SuperAdminSettings';
import '../crm/crm.css';

export type SuperSection = 'overview' | 'stores' | 'broadcasts' | 'billing' | 'catalog' | 'settings';

interface SuperAdminAppProps {
    user: User;
    /** URL segment after /superadmin (e.g. "stores", "notifications"). */
    subPath?: string;
    /** Store id when viewing /superadmin/stores/:id. */
    storeId?: string;
    onDiscover: () => void;
    onExit: () => void;
    onLogout: () => void;
}

const NAV: { id: SuperSection; label: string; icon: string; route: string }[] = [
    { id: 'overview',   label: 'Overview',   icon: 'space_dashboard', route: '/superadmin' },
    { id: 'stores',     label: 'Stores',     icon: 'storefront',      route: '/superadmin/stores' },
    { id: 'broadcasts', label: 'Broadcasts', icon: 'campaign',        route: '/superadmin/notifications' },
    { id: 'billing',    label: 'Billing',    icon: 'payments',        route: '/superadmin/subscriptions' },
    { id: 'catalog',    label: 'Plans & Pricing', icon: 'sell',       route: '/superadmin/catalog' },
    { id: 'settings',   label: 'Settings',   icon: 'settings',        route: '/superadmin/settings' },
];

const sectionForSub = (subPath?: string): SuperSection => {
    switch (subPath) {
        case 'stores': return 'stores';
        case 'notifications': return 'broadcasts';
        case 'subscriptions': return 'billing';
        case 'catalog': return 'catalog';
        case 'settings': return 'settings';
        default: return 'overview';
    }
};

/**
 * Super Admin — the platform control center, packaged as a standalone app that
 * opens from Discover. Reuses the shared "boutique green" chrome (`.crm` rail,
 * top bar, bottom nav) so it matches the CRM, Dashboard and Inventory apps, and
 * hosts the platform pages (overview, stores, broadcasts, billing, settings)
 * with its own navigation.
 */
export const SuperAdminApp: React.FC<SuperAdminAppProps> = ({
    user, subPath, storeId, onDiscover, onExit, onLogout,
}) => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const active = sectionForSub(subPath);

    let content: React.ReactNode;
    switch (active) {
        case 'stores':
            content = storeId ? <SuperAdminStoreDetails storeId={storeId} /> : <SuperAdminStores />;
            break;
        case 'broadcasts':
            content = <SuperAdminNotifications />;
            break;
        case 'billing':
            content = <SuperAdminSubscriptions />;
            break;
        case 'catalog':
            content = <SuperAdminCatalog />;
            break;
        case 'settings':
            content = <SuperAdminSettings />;
            break;
        default:
            content = <SuperAdminDashboard currentUser={user} />;
    }

    const activeLabel = NAV.find(n => n.id === active)?.label ?? 'Super Admin';

    return (
        <div className="crm">
            {/* Desktop rail */}
            <aside className="crm-rail" aria-label="Super Admin navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="admin_panel_settings" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">Super Admin</span>
                        <span className="crm-rail__brand-sub">Platform control</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`crm-rail__item${active === item.id ? ' is-active' : ''}`}
                            aria-current={active === item.id ? 'page' : undefined}
                            onClick={() => navigate(item.route)}
                        >
                            <Icon name={item.icon} size={22} fill={active === item.id ? 1 : 0} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={onDiscover}>
                        <Icon name="apps" size={22} /> Discover Apps
                    </button>
                    <button type="button" className="crm-rail__item" onClick={onExit}>
                        <Icon name="grid_view" size={22} /> Full App
                    </button>
                    <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
                        <Icon name="logout" size={22} /> Logout
                    </button>
                    <div className="crm-rail__user">
                        <Avatar name={user?.name} src={(user as any)?.profilePicture} size={36} />
                        <div className="crm-rail__user-info">
                            <span className="crm-rail__user-name">{user?.name}</span>
                            <span className="crm-rail__user-role">Super Admin</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content column */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <div className="crm-bar__brand">
                        <span className="crm-bar__logo"><Icon name="admin_panel_settings" size={22} fill={1} /></span>
                        <span className="crm-bar__title">{activeLabel}</span>
                    </div>
                    <div className="crm-bar__actions">
                        <button type="button" className="crm-iconbtn" aria-label="Discover apps" onClick={onDiscover}>
                            <Icon name="apps" size={22} />
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="crm-bar__avatar"
                                aria-label="Account menu"
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                onClick={() => setMenuOpen(o => !o)}
                            >
                                {(user as any)?.profilePicture ? <img src={(user as any).profilePicture} alt={user.name} /> : (user?.name?.[0]?.toUpperCase() || 'S')}
                            </button>
                            {menuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setMenuOpen(false)} aria-hidden="true" />
                                    <div role="menu" style={menuPanelStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                                            <Avatar name={user?.name} src={(user as any)?.profilePicture} size={36} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--c-on-surface-variant)' }}>Super Admin</div>
                                            </div>
                                        </div>
                                        <div style={{ height: 1, background: 'var(--c-outline-variant)', opacity: 0.5, margin: '4px 0' }} />
                                        <button type="button" role="menuitem" className="crm-menu-item" onClick={() => { setMenuOpen(false); onExit(); }} style={menuItemStyle}>
                                            <Icon name="grid_view" size={20} /> Full SalePilot App
                                        </button>
                                        <button type="button" role="menuitem" className="crm-menu-item" onClick={() => { setMenuOpen(false); onLogout(); }} style={{ ...menuItemStyle, color: 'var(--c-error)' }}>
                                            <Icon name="logout" size={20} /> Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {content}

                <nav className="crm-bottomnav" aria-label="Super Admin navigation">
                    {NAV.map(item => {
                        const isActive = active === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`crm-bottomnav__item${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => navigate(item.route)}
                            >
                                <Icon name={item.icon} size={24} fill={isActive ? 1 : 0} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

const menuItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
    border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
    fontWeight: 600, color: 'var(--c-on-bg)', textAlign: 'left', borderRadius: 'var(--c-radius)',
};

const menuPanelStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 61, minWidth: 220,
    background: 'var(--c-surface-lowest)', borderRadius: 'var(--c-radius-lg)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid var(--c-outline-variant)',
    overflow: 'hidden', padding: 6,
};

export default SuperAdminApp;
