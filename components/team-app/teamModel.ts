import { User } from '../../types';

export type StoreRole = 'admin' | 'inventory_manager' | 'staff';

export interface RoleDef {
    id: StoreRole;
    label: string;
    icon: string;
    tone: 'p' | 's' | 't';   // primary / secondary / tertiary accent
    desc: string;
    perks: string[];
}

/** Roles an admin can assign to store team members. */
export const ROLES: RoleDef[] = [
    {
        id: 'admin', label: 'Admin', icon: 'shield_person', tone: 'p',
        desc: 'Full access to the whole store.',
        perks: ['Manage users & roles', 'Sales, inventory & reports', 'Settings & billing'],
    },
    {
        id: 'inventory_manager', label: 'Inventory Manager', icon: 'inventory_2', tone: 's',
        desc: 'Full control of stock & products.',
        perks: ['Products & stock levels', 'Purchase orders & stock takes', 'No settings or billing'],
    },
    {
        id: 'staff', label: 'Staff', icon: 'badge', tone: 't',
        desc: 'Day-to-day operations.',
        perks: ['Process sales at the POS', 'View inventory', 'Basic customer access'],
    },
];

export const roleDef = (role?: string): RoleDef =>
    ROLES.find(r => r.id === role) ?? { id: 'staff', label: role || 'Member', icon: 'person', tone: 't', desc: '', perks: [] };

export interface TeamOverview {
    members: User[];
    total: number;
    admins: number;
    managers: number;
    staff: number;
}

/** Store team is everyone except customer/supplier accounts. */
export const buildTeamOverview = (users: User[]): TeamOverview => {
    const members = users.filter(u => u.role !== 'customer' && u.role !== 'supplier');
    return {
        members,
        total: members.length,
        admins: members.filter(u => u.role === 'admin' || u.role === 'superadmin').length,
        managers: members.filter(u => u.role === 'inventory_manager').length,
        staff: members.filter(u => u.role === 'staff').length,
    };
};
