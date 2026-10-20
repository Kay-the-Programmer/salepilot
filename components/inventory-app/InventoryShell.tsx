import React from 'react';
import { User } from '../../types';
import { can, canAccessPage } from '../../utils/rbac';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type InvSection = 'dashboard' | 'items' | 'alerts' | 'stock-takes' | 'closing-report';

interface InventoryShellProps {
    active: InvSection;
    user: User;
    onNavigate: (section: InvSection) => void;
    onPos: () => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<InvSection>[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'items', label: 'Inventory', icon: 'list_alt' },
    { id: 'closing-report', label: 'Closing Report', icon: 'assessment' },
    { id: 'stock-takes', label: 'Stock Takes', icon: 'fact_check' },
    { id: 'alerts', label: 'Alerts', icon: 'notification_important' },
];

/** Standalone Inventory Manager frame. */
export const InventoryShell: React.FC<InventoryShellProps> = ({ active, user, onNavigate, onPos, onExit, onLogout, children }) => {
    // Staff hold `inventory:read` — they look stock up but never count it, so
    // Stock Takes is not offered to them.
    const nav = NAV.filter(n => n.id !== 'stock-takes' || can(user?.role, 'inventory:manage'));
    // The register is not every role's next stop: an inventory manager holds no
    // `sales:perform`, so pointing them at the POS would only 403.
    const showPos = canAccessPage(user?.role, 'pos');

    return (
        <AppShell
            user={user}
            route="inv"
            navLabel="Inventory navigation"
            brand={{ icon: 'inventory_2', sub: 'Stock Manager' }}
            nav={nav}
            active={active}
            onNavigate={onNavigate}
            onExit={onExit}
            onLogout={onLogout}
            actions={showPos ? [{ icon: 'point_of_sale', label: 'Point of Sale', onClick: onPos }] : []}
            assistant={false}
        >
            {children}
        </AppShell>
    );
};

export default InventoryShell;
