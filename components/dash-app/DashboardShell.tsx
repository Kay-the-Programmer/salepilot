import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type DashSection = 'overview' | 'sales' | 'products';

interface DashboardShellProps {
    active: DashSection;
    user: User;
    onNavigate: (section: DashSection) => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<DashSection>[] = [
    { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
    { id: 'sales', label: 'Sales', icon: 'insights' },
    { id: 'products', label: 'Products', icon: 'inventory_2' },
];

/** Standalone Business Dashboard frame. */
export const DashboardShell: React.FC<DashboardShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
    <AppShell
        user={user}
        route="dash"
        navLabel="Dashboard navigation"
        brand={{ icon: 'monitoring', title: 'SalePilot Dashboard', sub: 'Business Overview' }}
        nav={NAV}
        active={active}
        onNavigate={onNavigate}
        onExit={onExit}
        onLogout={onLogout}
    >
        {children}
    </AppShell>
);

export default DashboardShell;
