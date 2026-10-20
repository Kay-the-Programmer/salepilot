import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type ProcSection = 'dashboard' | 'suppliers' | 'orders' | 'lists';

interface ProcureShellProps {
    active: ProcSection;
    user: User;
    onNavigate: (section: ProcSection) => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<ProcSection>[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'suppliers', label: 'Suppliers', icon: 'local_shipping' },
    { id: 'orders', label: 'Orders', icon: 'receipt_long' },
    { id: 'lists', label: 'Order Lists', icon: 'checklist' },
];

/** Standalone Purchase Orders hub frame. */
export const ProcureShell: React.FC<ProcureShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
    <AppShell
        user={user}
        route="procure"
        navLabel="Purchase Orders navigation"
        brand={{ icon: 'shopping_cart_checkout', title: 'SalePilot Purchase Orders', sub: 'Suppliers & POs' }}
        nav={NAV}
        active={active}
        onNavigate={onNavigate}
        onExit={onExit}
        onLogout={onLogout}
    >
        {children}
    </AppShell>
);

export default ProcureShell;
