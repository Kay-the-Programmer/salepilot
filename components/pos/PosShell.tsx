import React from 'react';
import { User } from '../../types';
import PosIcon from '../sales/PosIcon';
import PosBottomNav from './PosBottomNav';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import Logo from '../../assets/logo.png';
import '../../pages/sale-v2.css';
import './pos-shell.css';

export type PosSection = 'pos' | 'inventory' | 'dashboard' | 'discover';

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
    onExit,
    onLogout,
    children,
}) => {
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

            {/* On the Discover screen the primary tabs are hidden so the user
                focuses on picking an app from the launcher grid. */}
            {active !== 'discover' && (
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
            )}

            <div className="posshell__foot">
                <button
                    type="button"
                    className={`posshell__navitem${active === 'discover' ? ' posshell__navitem--active' : ''}`}
                    aria-current={active === 'discover' ? 'page' : undefined}
                    onClick={() => { onNavigate('discover'); onCloseDrawer(); }}
                >
                    <PosIcon name="apps" size={22} fill={active === 'discover' ? 1 : 0} />
                    Discover Apps
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

            <div className="posshell__content">
                {/* avatar / user is surfaced inside each page's own header */}
                <span hidden>{user?.name}</span>
                {children}
            </div>

            {/* Shared mobile bottom navigation */}
            <PosBottomNav active={active} onNavigate={onNavigate} />

            {/* Embedded AI assistant — available from inside the POS app */}
            <AssistantLauncher userName={user?.name} />
        </div>
    );
};

export default PosShell;
