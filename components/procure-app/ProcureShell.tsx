import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcher from '../standalone/AppSwitcher';
import AppNavMenu from '../standalone/AppNavMenu';
import Logo from '../../assets/logo.png';

export type ProcSection = 'dashboard' | 'suppliers' | 'orders';

interface ProcureShellProps {
    active: ProcSection;
    user: User;
    onNavigate: (section: ProcSection) => void;
    onDiscover: () => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: { id: ProcSection; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long' },
];

/** Standalone Supplier & Procurement Hub frame — reuses the shared M3 chrome. */
export const ProcureShell: React.FC<ProcureShellProps> = ({ active, user, onNavigate, onDiscover, onExit, onLogout, children }) => {
    return (
        <div className="crm">
            <aside className="crm-rail" aria-label="Procurement navigation">
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name="local_shipping" size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        <span className="crm-rail__brand-title">SalePilot Procurement</span>
                        <span className="crm-rail__brand-sub">Supplier Hub</span>
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
                    <button type="button" className="crm-rail__item" onClick={onDiscover}>
                        <Icon name="apps" size={22} /> Discover Apps
                    </button>
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

            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute="procure" triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={NAV.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) }))}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {children}
            </div>

            {/* Embedded AI assistant — available from inside the Procurement app */}
            <AssistantLauncher userName={user?.name} />
        </div>
    );
};

export default ProcureShell;
