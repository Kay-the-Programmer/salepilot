import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
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
 * opens from the app switcher. Reuses the shared "boutique green" chrome (`.crm` rail,
 * top bar, bottom nav) so it matches the CRM, Dashboard and Inventory apps, and
 * hosts the platform pages (overview, stores, broadcasts, billing, settings)
 * with its own navigation.
 */
export const SuperAdminApp: React.FC<SuperAdminAppProps> = ({
    user, subPath, storeId, onExit, onLogout,
}) => {
    const navigate = useNavigate();
    const { openAppSwitcher } = useAppSwitcher();
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
                    <button type="button" className="crm-rail__item" onClick={openAppSwitcher}>
                        <Icon name="apps" size={22} /> SalePilot Apps
                    </button>
                    <button type="button" className="crm-rail__item" onClick={onExit}>
                        <Icon name="grid_view" size={22} /> Full App
                    </button>
                    <RailThemeButton />
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
                    <AppSwitcher user={user} currentRoute="superadmin" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={NAV.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => navigate(n.route) }))}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {content}
            </div>
        </div>
    );
};

export default SuperAdminApp;
