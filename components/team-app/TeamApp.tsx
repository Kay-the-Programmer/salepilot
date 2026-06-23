import React, { useEffect, useMemo, useState } from 'react';
import { User, StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import PremiumUpgradeModal from '../ui/PremiumUpgradeModal';
import { useConfirm } from '../ui/useConfirm';
import { hasModule, MODULES, FREE_SEATS } from '../../utils/entitlements';
import { TeamShell, TeamSection } from './TeamShell';
import TeamMembers from './TeamMembers';
import TeamRoles from './TeamRoles';
import TeamMemberModal from './TeamMemberModal';
import { buildTeamOverview } from './teamModel';
import '../crm/crm.css';
import './team.css';

interface TeamAppProps {
    section: TeamSection;
    user: User;
    users: User[];
    storeSettings: StoreSettings | null;
    onNavigate: (section: TeamSection) => void;
    onDiscover: () => void;
    onExit: () => void;
    onLogout: () => void;
    onSaveUser: (userData: Omit<User, 'id'>, id?: string) => Promise<void> | void;
    onDeleteUser: (userId: string) => Promise<void> | void;
}

/**
 * Standalone User Manager. Admin-only. Reuses the existing user save/delete
 * logic; adding a member beyond the free seat needs the Team Members add-on,
 * enforced both here (UX) and on the backend (402).
 */
export const TeamApp: React.FC<TeamAppProps> = ({
    section, user, users, storeSettings, onNavigate, onDiscover, onExit, onLogout, onSaveUser, onDeleteUser,
}) => {
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const { confirm, confirmDialog } = useConfirm();

    const notify = (msg: string) => setToast(msg);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const overview = useMemo(() => buildTeamOverview(users), [users]);
    const entitled = hasModule(storeSettings, MODULES.TEAM_MEMBERS);
    const canAdd = entitled || overview.total < FREE_SEATS;

    const openAdd = () => {
        if (!canAdd) { setUpgradeOpen(true); return; }
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (u: User) => { setEditing(u); setFormOpen(true); };

    const handleSave = async (data: Omit<User, 'id'>, id?: string) => {
        try {
            await onSaveUser(data, id);
            notify(id ? 'Member updated.' : 'Member added.');
        } catch (err: any) {
            notify(err?.message || 'Could not save member.');
        }
    };

    const handleDelete = async (u: User) => {
        if (u.id === user.id) { notify('You cannot remove your own account.'); return; }
        const ok = await confirm({
            title: `Remove ${u.name}?`,
            message: 'They will immediately lose access to this store. This cannot be undone.',
            confirmLabel: 'Remove',
            danger: true,
        });
        if (!ok) return;
        try {
            await onDeleteUser(u.id);
            notify('Member removed.');
        } catch (err: any) {
            notify(err?.message || 'Could not remove member.');
        }
    };

    const content = section === 'roles'
        ? <TeamRoles overview={overview} />
        : (
            <TeamMembers
                overview={overview}
                currentUser={user}
                entitled={entitled}
                freeSeats={FREE_SEATS}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={handleDelete}
                onUpgrade={() => setUpgradeOpen(true)}
            />
        );

    return (
        <TeamShell
            active={section}
            user={user}
            onNavigate={onNavigate}
            onDiscover={onDiscover}
            onExit={onExit}
            onLogout={onLogout}
        >
            {content}

            {formOpen && (
                <TeamMemberModal
                    isOpen={formOpen}
                    userToEdit={editing}
                    onClose={() => { setFormOpen(false); setEditing(null); }}
                    onSave={handleSave}
                />
            )}

            <PremiumUpgradeModal
                isOpen={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                title="Unlock Team Members"
                description="Add staff and manager accounts with their own logins and roles. This is a premium add-on you can unlock for a small monthly fee."
                bullets={[
                    'Add staff & inventory-manager accounts',
                    'Assign roles and control what each can do',
                    'The owner seat stays free',
                ]}
            />

            {toast && (
                <div className="crm-toast" role="status">
                    <Icon name="check_circle" size={20} fill={1} />
                    {toast}
                </div>
            )}

            {confirmDialog}
        </TeamShell>
    );
};

export default TeamApp;
