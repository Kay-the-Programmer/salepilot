import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import PosIcon from '../sales/PosIcon';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcherOverlay from '../standalone/AppSwitcherOverlay';
import { recordAppUse } from '../standalone/appUsage';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../assets/logo.png';
import '../../pages/sale-v2.css';
import './pos-shell.css';

export type PosSection = 'pos' | 'inventory' | 'dashboard';

interface PosShellProps {
    active: PosSection;
    user: User;
    drawerOpen: boolean;
    onCloseDrawer: () => void;
    onNavigate: (section: PosSection) => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: { id: PosSection; icon: string; label: string }[] = [
    { id: 'pos', icon: 'point_of_sale', label: 'Point of Sale' },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventory Manager' },
    { id: 'dashboard', icon: 'monitoring', label: 'Dashboard' },
];

/**
 * Standalone POS frame. Reuses existing page components as children; this only
 * provides the focused navigation chrome (rail on desktop, drawer on mobile).
 */
export const PosShell: React.FC<PosShellProps> = ({
    active,
    user,
    drawerOpen,
    onCloseDrawer,
    onNavigate,
    onLogout,
    children,
}) => {
    const [appsOpen, setAppsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    useEffect(() => { recordAppUse('pos'); }, []);
    const renderNav = (inDrawer: boolean) => (
        <>
            <div className="posshell__brand">
                {inDrawer && (
                    <button type="button" className="v2-iconbtn posshell__drawer-close" aria-label="Close menu" onClick={onCloseDrawer}>
                        <PosIcon name="close" size={20} />
                    </button>
                )}
                <img src={Logo} alt="SalePilot" />
                <span className="posshell__brand-sub">POS Terminal</span>
            </div>

            <nav className="posshell__nav">
                {NAV.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        className={`posshell__navitem${active === item.id ? ' posshell__navitem--active' : ''}`}
                        aria-current={active === item.id ? 'page' : undefined}
                        onClick={() => { onNavigate(item.id); onCloseDrawer(); }}
                    >
                        <PosIcon name={item.icon} size={22} fill={active === item.id ? 1 : 0} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="posshell__foot">
                <button
                    type="button"
                    className="posshell__navitem"
                    onClick={() => { setAppsOpen(true); onCloseDrawer(); }}
                >
                    <PosIcon name="apps" size={22} />
                    SalePilot Apps
                </button>
                <button type="button" className="posshell__navitem" onClick={toggleTheme}>
                    <PosIcon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={22} />
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button type="button" className="posshell__navitem posshell__navitem--logout" onClick={() => { onLogout(); onCloseDrawer(); }}>
                    <PosIcon name="logout" size={22} />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="posshell">
            <aside className="posshell__rail posshell__rail--desktop" aria-label="POS navigation">
                {renderNav(false)}
            </aside>

            {drawerOpen && (
                <>
                    <div className="posshell__backdrop" onClick={onCloseDrawer} aria-hidden="true" />
                    <aside className="posshell__rail posshell__drawer" aria-label="POS navigation">
                        {renderNav(true)}
                    </aside>
                </>
            )}

            {/* POS page content (SalesPage / Inventory / Dashboard / Discover) */}
            <main className="posshell__content">
                {children}
            </main>

            {/* Embedded AI assistant — hidden on the sale terminal so it doesn't
                distract during checkout; still available on dashboard / discover. */}
            {active !== 'pos' && <AssistantLauncher userName={user?.name} />}

            <AppSwitcherOverlay open={appsOpen} onClose={() => setAppsOpen(false)} user={user} currentRoute="pos" />
        </div>
    );
};

export default PosShell;
