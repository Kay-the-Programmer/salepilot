import React from 'react';
import { User } from '../../types';
import AppShell, { AppShellNavItem } from '../standalone/AppShell';

export type TeamSection = 'members' | 'roles';

interface TeamShellProps {
    active: TeamSection;
    user: User;
    onNavigate: (section: TeamSection) => void;
    onExit: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const NAV: AppShellNavItem<TeamSection>[] = [
    { id: 'members', label: 'Team', icon: 'groups' },
    { id: 'roles', label: 'Roles', icon: 'shield_person' },
];

/** Standalone User Manager frame. */
export const TeamShell: React.FC<TeamShellProps> = ({ active, user, onNavigate, onExit, onLogout, children }) => (
    <AppShell
        user={user}
        route="team"
        navLabel="User manager navigation"
        brand={{ icon: 'manage_accounts', title: 'SalePilot Team', sub: 'User Manager' }}
        nav={NAV}
        active={active}
        onNavigate={onNavigate}
        onExit={onExit}
        onLogout={onLogout}
    >
        {children}
    </AppShell>
);

export default TeamShell;
