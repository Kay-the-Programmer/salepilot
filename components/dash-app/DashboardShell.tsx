import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';
import RailThemeButton from '../standalone/RailThemeButton';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';

export type DashSection = 'overview' | 'sales' | 'products';

interface DashboardShellProps {
    active: DashSection;
    user: User;
    onNavigate: (section: DashSection) => void;
    onReports: () => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: { id: DashSection; label: string; icon: string }[] = [
    { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { id: 'sales', label: 'Sales', icon: 'insights' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
];

/**
 * Standalone Business Dashboard frame. Reuses the shared M3 "boutique green"
 * chrome (`.crm` tokens, rail, top bar, bottom nav) so it matches the CRM,
 * Inventory and POS standalone apps exactly.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
    active, user, onNavigate, onReports, onExit, onLogout, children,
}) => {
    const { openAppSwitcher } = useAppSwitcher();
    return (
        <div className="crm">
            {/* Desktop rail */}
            <aside className="crm-rail" aria-label="Dashboard navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot Dashboard</span>
                        <span className="crm-rail__brand-sub">Business Overview</span>
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
                    <button type="button" className="crm-rail__item" onClick={onReports}>
                        <Icon name="analytics" size={22} /> Full Reports
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
                    <AppSwitcher user={user} currentRoute="dash" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={[
                                ...NAV.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) })),
                                { icon: 'analytics', label: 'Full Reports', onClick: onReports },
                            ]}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {children}
            </div>

            {/* Embedded AI assistant — available from inside the Dashboard app */}
            <AssistantLauncher userName={user?.name} />
        </div>
    );
};

export default DashboardShell;
