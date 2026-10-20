import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import AssistantLauncher from '../../pages/assistant/AssistantLauncher';
import AppSwitcher from './AppSwitcher';
import AppNavMenu from './AppNavMenu';
import RailThemeButton from './RailThemeButton';
import Logo from '../../assets/logo.png';
import { useAppSwitcher } from '../../contexts/AppSwitcherContext';
import '../crm/crm.css';
import '../../pages/assistant/assistant.css';

/**
 * The frame every standalone app runs in: a fixed navigation rail on desktop,
 * a top bar with the app switcher and a sections menu on mobile.
 *
 * There used to be six of these — CrmShell, DashboardShell, InventoryShell,
 * ProcureShell, TeamShell, AccountingShell — and they were the same file six
 * times. Normalising the names away, two of them differed by thirty-six lines,
 * nearly all of it the nav array. That is the worst kind of duplication,
 * because nothing goes wrong loudly: a fix to the rail's keyboard handling, or
 * the mobile menu, or the logout button lands in one app and silently does not
 * land in the other five, and the only way to notice is to open all six.
 *
 * So the chrome lives here once and each app contributes what is actually
 * particular to it: its nav items, its brand block, its route. The props are
 * deliberately narrow — an app that wants something genuinely new from the
 * frame should add it here, for everyone, rather than fork the frame again.
 */

export interface AppShellNavItem<Id extends string = string> {
    id: Id;
    label: string;
    icon: string;
}

/** An extra rail entry that is not a section — e.g. Inventory's "Point of Sale". */
export interface AppShellAction {
    icon: string;
    label: string;
    onClick: () => void;
}

export interface AppShellProps<Id extends string = string> {
    user: User;
    /** This app's route segment, so the switcher can highlight it. */
    route: string;
    /**
     * Rail brand block. `title` is optional because not every app wants two
     * lines there — Inventory shows only the subtitle.
     */
    brand: { icon: string; title?: string; sub: string };
    /** Accessible name for the desktop rail. */
    navLabel: string;
    nav: AppShellNavItem<Id>[];
    active: Id;
    onNavigate: (id: Id) => void;
    onExit: () => void;
    onLogout: () => void;
    /** Shown in the rail foot and the mobile menu, above "SalePilot Apps". */
    actions?: AppShellAction[];
    /** The embedded AI assistant. Off for apps that have no use for it. */
    assistant?: boolean;
    /** Wrapper for the scrolling content, where an app needs to scope its CSS. */
    contentClassName?: string;
    children: React.ReactNode;
}

export function AppShell<Id extends string = string>({
    user, route, brand, navLabel, nav, active,
    onNavigate, onExit, onLogout,
    actions = [], assistant = true, contentClassName, children,
}: AppShellProps<Id>) {
    const { openAppSwitcher } = useAppSwitcher();

    // One list drives the desktop rail and the mobile menu, so the two cannot
    // drift apart — which is how an app ends up with a section you can only
    // reach on a phone.
    const menuItems = [
        ...nav.map(n => ({ icon: n.icon, label: n.label, active: active === n.id, onClick: () => onNavigate(n.id) })),
        ...actions.map(a => ({ icon: a.icon, label: a.label, onClick: a.onClick })),
    ];

    return (
        <div className="crm">
            {/* Desktop navigation rail */}
            <aside className="crm-rail" aria-label={navLabel}>
                <div className="crm-rail__brand">
                    <span className="crm-bar__logo"><Icon name={brand.icon} size={22} fill={1} /></span>
                    <div className="crm-rail__brand-text">
                        {brand.title && <span className="crm-rail__brand-title">{brand.title}</span>}
                        <span className="crm-rail__brand-sub">{brand.sub}</span>
                    </div>
                </div>

                <nav className="crm-rail__nav">
                    {nav.map(item => (
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
                    {actions.map(a => (
                        <button key={a.label} type="button" className="crm-rail__item" onClick={a.onClick}>
                            <Icon name={a.icon} size={22} /> {a.label}
                        </button>
                    ))}
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

            {/* Content column (with mobile top bar) */}
            <div className="crm-body">
                <header className="crm-bar crm-bar--mobile">
                    <AppSwitcher user={user} currentRoute={route} triggerClassName="crm-iconbtn" />
                    <img src={Logo} alt="SalePilot" className="crm-bar__brandlogo" />
                    <div className="crm-bar__actions">
                        <AppNavMenu
                            items={menuItems}
                            onExit={onExit}
                            onLogout={onLogout}
                            triggerClassName="crm-iconbtn"
                        />
                    </div>
                </header>

                {contentClassName
                    ? <div className={contentClassName} style={{ minHeight: '100%' }}>{children}</div>
                    : children}
            </div>

            {assistant && <AssistantLauncher userName={user?.name} />}
        </div>
    );
}

export default AppShell;
