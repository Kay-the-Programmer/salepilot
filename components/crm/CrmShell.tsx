import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from './CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';
import RailThemeButton from '../standalone/RailThemeButton';

export type CrmSection = 'dashboard' | 'customers' | 'whatsapp' | 'loyalty' | 'insights';

interface CrmShellProps {
    active: CrmSection;
    user: User;
    onNavigate: (section: CrmSection) => void;
    onDiscover: () => void;
    onExit: () => void;
    onLogout: () => void;
    onSearch?: () => void;
    children: React.ReactNode;
}

const NAV: { id: CrmSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'loyalty', label: 'Loyalty', icon: 'card_membership' },
    { id: 'insights', label: 'Insights', icon: 'analytics' },
];

/**
 * Standalone CRM frame. Desktop = a fixed left navigation rail (mirrors the
 * standalone POS shell); mobile = a top bar + bottom navigation. Discover is
 * exposed on both so users can hop back to the SalePilot app launcher.
 */
export const CrmShell: React.FC<CrmShellProps> = ({ active, user, onNavigate, onDiscover, onExit, onLogout, children }) => {
    // On the Insights page the section tabs are hidden — only Insights remains,
    // so the user picks an app to view (Discover stays available).
    const navItems = NAV;

    return (
        <div className="crm">
            {/* Desktop navigation rail */}
            <aside className="crm-rail" aria-label="CRM navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="storefront" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot CRM</span>
                        <span className="crm-rail__brand-sub">Customer Hub</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {navItems.map(item => (
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
                    <button type="button" className="crm-rail__item" onClick={onDiscover}>
                        <Icon name="apps" size={22} /> Discover Apps
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

            {/* Content column (with mobile top bar + bottom nav) */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="crm" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={navItems.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) }))}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {children}
            </div>

            {/* Embedded AI assistant — available from inside the CRM app */}
            <AssistantLauncher userName={user?.name} />
        </div>
    );
};

export default CrmShell;
