import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type MenuSection = 'menu' | 'import';

interface MenuShellProps {
    active: MenuSection;
    user: User;
    onNavigate: (section: MenuSection) => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<MenuSection>[] = [
    { id: 'menu', label: 'Menu', icon: 'restaurant_menu' },
    { id: 'import', label: 'Upload menu', icon: 'upload_file' },
];

/** Frame for the Menu app (restaurants, bars and cafes). */
export const MenuShell: React.FC<MenuShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
    <AppShell
        user={user}
        route="menu"
        navLabel="Menu navigation"
        brand={{ icon: 'restaurant_menu', title: 'SalePilot Menu', sub: 'What you serve' }}
        nav={NAV}
        active={active}
        onNavigate={onNavigate}
        onExit={onExit}
        onLogout={onLogout}
    >
        {children}
    </AppShell>
);

export default MenuShell;
