import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';

export type InvSection = 'dashboard' | 'items' | 'alerts';

interface InventoryShellProps {
    active: InvSection;
    user: User;
    onNavigate: (section: InvSection) => void;
    onPos: () => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: { id: InvSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'items', label: 'Inventory', icon: 'list_alt' },
    { id: 'alerts', label: 'Alerts', icon: 'notification_important' },
];

/**
 * Standalone Inventory Manager frame. Reuses the shared M3 chrome (`.crm`
 * tokens, rail, top bar, bottom nav) with inventory-specific navigation.
 */
export const InventoryShell: React.FC<InventoryShellProps> = ({ active, user, onNavigate, onPos, onExit, onLogout, children }) => {
    const { openAppSwitcher } = useAppSwitcher();
    return (
        <div className="crm">
            {/* Desktop rail */}
            <aside className="crm-rail" aria-label="Inventory navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="inventory_2" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-sub">Stock Manager</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            className={`crm-rail__item${active === item.id ? ' is-active' : ''}`}
                            aria-current={active === item.id ? 'page' : undefined}
                            onClick={() => onNavigate(item.id)}
                        >
                            <Icon name={item.icon} size={22} fill={active === item.id ? 1 : 0} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="crm-rail__foot">
                    <button type="button" className="crm-rail__item" onClick={onPos}>
                        <Icon name="point_of_sale" size={22} /> Point of Sale
                    </button>
                    <button type="button" className="crm-rail__item" onClick={openAppSwitcher}>
                        <Icon name="apps" size={22} /> SalePilot Apps
                    </button>
                    <RailThemeButton />
                    <button type="button" className="crm-rail__item crm-rail__item--logout" onClick={onLogout}>
                        <Icon name="logout" size={22} /> Logout
                    </button>
                    <div className="crm-rail__user">
                        <Avatar name={user?.name} src={user?.profilePicture} size={36} />
                        <div className="crm-rail__user-info">
                            <span className="crm-rail__user-name">{user?.name}</span>
                            <span className="crm-rail__user-role">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content column */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="inv" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={[
                                ...NAV.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) })),
                                { icon: 'point_of_sale', label: 'Point of Sale', onClick: onPos },
                            ]}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {children}
            </div>
        </div>
    );
};

export default InventoryShell;
