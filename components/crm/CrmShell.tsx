import React, { useState } from 'react';
import { User } from '../../types';
import { Icon, Avatar } from './CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';

export type CrmSection = 'dashboard' | 'customers' | 'loyalty' | 'insights';

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
    { id: 'loyalty', label: 'Loyalty', icon: 'card_membership' },
    { id: 'insights', label: 'Insights', icon: 'analytics' },
];

/**
 * Standalone CRM frame. Desktop = a fixed left navigation rail (mirrors the
 * standalone POS shell); mobile = a top bar + bottom navigation. Discover is
 * exposed on both so users can hop back to the SalePilot app launcher.
 */
export const CrmShell: React.FC<CrmShellProps> = ({ active, user, onNavigate, onDiscover, onExit, onLogout, onSearch, children }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // On the Insights page the section tabs are hidden — only Insights remains,
    // so the user picks an app to view (Discover stays available).
    const navItems = active === 'insights' ? NAV.filter(n => n.id === 'insights') : NAV;

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
                    <div className="crm-bar__brand">
                        <span className="crm-bar__logo"><Icon name="storefront" size={22} fill={1} /></span>
                        <span className="crm-bar__title">SalePilot CRM</span>
                    </div>
                    <div className="crm-bar__actions">
                        {onSearch && (
                            <button type="button" className="crm-iconbtn" aria-label="Search" onClick={onSearch}>
                                <Icon name="search" />
                            </button>
                        )}
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
                                        <button type="button" role="menuitem" className="crm-menu-item" onClick={() => { setMenuOpen(false); onDiscover(); }} style={menuItemStyle}>
                                            <Icon name="menu" size={20} /> Discover Apps
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

                <nav className="crm-bottomnav" aria-label="CRM navigation">
                    {navItems.map(item => {
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
                    <button type="button" className="crm-bottomnav__item" onClick={onDiscover}>
                        <Icon name="menu" size={24} />
                        <span>Discover Apps</span>
                    </button>
                </nav>
            </div>

            {/* Embedded AI assistant — available from inside the CRM app */}
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

export default CrmShell;
