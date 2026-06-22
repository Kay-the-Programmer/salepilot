import React, { useState } from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';

export type DashSection = 'overview' | 'sales' | 'products';

interface DashboardShellProps {
    active: DashSection;
    user: User;
    onNavigate: (section: DashSection) => void;
    onReports: () => void;
    onDiscover: () => void;
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
    active, user, onNavigate, onReports, onDiscover, onExit, onLogout, children,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

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

            {/* Content column */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <div className="crm-bar__brand">
                        <span className="crm-bar__logo"><Icon name="monitoring" size={22} fill={1} /></span>
                        <span className="crm-bar__title">Dashboard</span>
                    </div>
                    <div className="crm-bar__actions">
                        <button type="button" className="crm-iconbtn" aria-label="Full reports" onClick={onReports}>
                            <Icon name="analytics" size={22} />
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
                                {user?.profilePicture ? <img src={user.profilePicture} alt={user.name} /> : (user?.name?.[0]?.toUpperCase() || 'U')}
                            </button>
                            {menuOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setMenuOpen(false)} aria-hidden="true" />
                                    <div role="menu" style={menuPanelStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                                            <Avatar name={user?.name} src={user?.profilePicture} size={36} />
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--c-on-surface-variant)', textTransform: 'capitalize' }}>{user?.role}</div>
                                            </div>
                                        </div>
                                        <div style={{ height: 1, background: 'var(--c-outline-variant)', opacity: 0.5, margin: '4px 0' }} />
                                        <button type="button" role="menuitem" className="crm-menu-item" onClick={() => { setMenuOpen(false); onReports(); }} style={menuItemStyle}>
                                            <Icon name="analytics" size={20} /> Full Reports
                                        </button>
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

                {children}

                <nav className="crm-bottomnav" aria-label="Dashboard navigation">
                    {NAV.map(item => {
                        const isActive = active === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`crm-bottomnav__item${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => onNavigate(item.id)}
                            >
                                <Icon name={item.icon} size={24} fill={isActive ? 1 : 0} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                    <button type="button" className="crm-bottomnav__item" onClick={onReports}>
                        <Icon name="analytics" size={24} />
                        <span>Reports</span>
                    </button>
                    <button type="button" className="crm-bottomnav__item" onClick={onDiscover}>
                        <Icon name="menu" size={24} />
                        <span>Discover</span>
                    </button>
                </nav>
            </div>

            {/* Embedded AI assistant — available from inside the Dashboard app */}
            <AssistantLauncher userName={user?.name} />
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

export default DashboardShell;
