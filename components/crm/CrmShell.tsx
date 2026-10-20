import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type CrmSection = 'dashboard' | 'customers' | 'whatsapp' | 'loyalty' | 'insights';

interface CrmShellProps {
    active: CrmSection;
    user: User;
    onNavigate: (section: CrmSection) => void;
    onExit: () => void;
    onLogout: () => void;
    onSearch?: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<CrmSection>[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'customers', label: 'Customers', icon: 'group' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'loyalty', label: 'Loyalty', icon: 'card_membership' },
    { id: 'insights', label: 'Insights', icon: 'analytics' },
];

/** Standalone CRM frame — the shared chrome, with the CRM's sections. */
export const CrmShell: React.FC<CrmShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
    <AppShell
        user={user}
        route="crm"
        navLabel="CRM navigation"
        brand={{ icon: 'storefront', title: 'SalePilot CRM', sub: 'Customer Hub' }}
        nav={NAV}
        active={active}
        onNavigate={onNavigate}
        onExit={onExit}
        onLogout={onLogout}
    >
        {children}
    </AppShell>
);

export default CrmShell;
