import React from 'react';
import { getCurrentUser } from '../../services/authService';
import AppSwitcher from './AppSwitcher';
import AppNavMenu, { AppNavItem } from './AppNavMenu';
import Logo from '../../assets/logo.png';

interface StandaloneTopBarProps {
    /** The current app's own sections, surfaced in the right-hand menu. */
    navItems?: AppNavItem[];
    /** Route of this app, to highlight it in the app switcher (e.g. 'hustle'). */
    currentRoute?: string;
    /** "Full SalePilot App" — leave the standalone app. */
    onExit?: () => void;
    onLogout?: () => void;
    /** Override the bar element classes (e.g. a different hide breakpoint). */
    className?: string;
    /** App-specific controls rendered just after the app switcher (left). */
    leftExtra?: React.ReactNode;
    /** App-specific controls rendered just before the menu (right). */
    rightExtra?: React.ReactNode;
}

const ICON_BTN = 'inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition';

/**
 * The unified standalone-app mobile top bar: an app switcher on the left, the
 * SalePilot logo centred, and the current app's sections menu + light/dark
 * toggle on the right. Pulls the signed-in user itself so apps that don't pass
 * `user` down can still use it.
 */
export const StandaloneTopBar: React.FC<StandaloneTopBarProps> = ({
    navItems = [], currentRoute, onExit, onLogout, className, leftExtra, rightExtra,
}) => {
    const user = getCurrentUser();
    return (
        <header className={className ?? 'relative md:hidden flex-shrink-0 h-16 bg-surface border-b border-brand-border shadow-sm flex items-center justify-between px-3 z-20'}>
            <div className="flex items-center gap-1 min-w-0">
                <AppSwitcher user={user} currentRoute={currentRoute} triggerClassName={ICON_BTN} />
                {leftExtra}
            </div>
            <img src={Logo} alt="SalePilot" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-auto pointer-events-none" />
            <div className="flex items-center gap-1">
                {rightExtra}
                <AppNavMenu items={navItems} onExit={onExit} onLogout={onLogout} triggerClassName={ICON_BTN} />
            </div>
        </header>
    );
};

export default StandaloneTopBar;
