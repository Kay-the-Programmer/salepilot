import React from 'react';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { TeamOverview, roleDef } from './teamModel';

interface TeamMembersProps {
    overview: TeamOverview;
    currentUser: User;
    entitled: boolean;
    freeSeats: number;
    onAdd: () => void;
    onEdit: (u: User) => void;
    onDelete: (u: User) => void;
    onUpgrade: () => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ overview, currentUser, entitled, freeSeats, onAdd, onEdit, onDelete, onUpgrade }) => {
    const { members, total, admins, managers, staff } = overview;
    const canAdd = entitled || total < freeSeats;

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="crm-pagehead__title">Team &amp; Access</h2>
                    <p className="crm-pagehead__sub">Manage who can access your store and what they can do.</p>
                </div>
                <button
                    className="crm-btn crm-btn--primary"
                    type="button"
                    onClick={canAdd ? onAdd : onUpgrade}
                    title={canAdd ? 'Add a team member' : 'Adding extra users is a premium add-on'}
                >
                    <Icon name={canAdd ? 'person_add' : 'lock'} size={20} /> Add User
                    {!canAdd && <span className="crm-badge crm-badge--gold" style={{ marginLeft: 4, padding: '2px 8px' }}>Premium</span>}
                </button>
            </div>

            {/* Stat bento */}
            <div className="crm-bento crm-bento--3" style={{ marginBottom: 20 }}>
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--p"><Icon name="groups" size={28} fill={1} /></div>
                    </div>
                    <div><p className="crm-stat__label">Total Members</p><p className="crm-stat__value">{total}</p></div>
                </div>
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--t"><Icon name="shield_person" size={28} fill={1} /></div>
                    </div>
                    <div><p className="crm-stat__label">Admins</p><p className="crm-stat__value">{admins}</p></div>
                </div>
                <div className="crm-stat">
                    <div className="crm-stat__top">
                        <div className="crm-stat__icon crm-stat__icon--s"><Icon name="badge" size={28} fill={1} /></div>
                    </div>
                    <div><p className="crm-stat__label">Staff &amp; Managers</p><p className="crm-stat__value">{staff + managers}</p></div>
                </div>
            </div>

            {/* Seat / premium status */}
            <div className={`team-seats ${entitled ? 'team-seats--ok' : (total >= freeSeats ? 'team-seats--locked' : 'team-seats--ok')}`}>
                <div className="team-seats__left">
                    <span className="team-seats__icon"><Icon name={entitled ? 'workspace_premium' : 'event_seat'} size={24} fill={1} /></span>
                    <div>
                        <p className="team-seats__title">
                            {entitled ? 'Team Members unlocked' : `${total} of ${freeSeats} free seat${freeSeats === 1 ? '' : 's'} used`}
                        </p>
                        <p className="team-seats__text">
                            {entitled
                                ? 'Add as many staff accounts as your store needs.'
                                : (total >= freeSeats
                                    ? 'Adding more users is a premium add-on.'
                                    : `You can add ${freeSeats - total} more user${freeSeats - total === 1 ? '' : 's'} on the free plan.`)}
                        </p>
                    </div>
                </div>
                {!entitled && total >= freeSeats && (
                    <button className="crm-btn crm-btn--filled" type="button" onClick={onUpgrade}>
                        <Icon name="lock_open" size={20} /> Unlock
                    </button>
                )}
            </div>

            {/* Member list */}
            <div className="crm-panel">
                <div className="crm-panel__head">
                    <h3 className="crm-panel__title">Members</h3>
                    <span className="crm-panel__sub">{total} account{total === 1 ? '' : 's'}</span>
                </div>
                {members.length === 0 ? (
                    <div className="crm-empty" style={{ padding: '48px 16px' }}>
                        <Icon name="group_off" size={40} />
                        <p className="crm-empty__title">No team members yet</p>
                        <p className="crm-empty__text">Add staff accounts so your team can sell and manage stock with their own logins.</p>
                        <button className="crm-btn crm-btn--primary" type="button" style={{ marginTop: 8 }} onClick={canAdd ? onAdd : onUpgrade}>
                            <Icon name={canAdd ? 'person_add' : 'lock'} size={20} /> Add your first member
                        </button>
                    </div>
                ) : (
                    <div className="team-list">
                        {members.map(u => {
                            const r = roleDef(u.role);
                            const isSelf = u.id === currentUser.id;
                            return (
                                <div key={u.id} className="team-row">
                                    <div className="team-row__id">
                                        <Avatar name={u.name} src={u.profilePicture} size={44} />
                                        <div style={{ minWidth: 0 }}>
                                            <p className="team-row__name">
                                                {u.name}{isSelf && <span className="team-you">You</span>}
                                            </p>
                                            <p className="team-row__email">{u.email}</p>
                                        </div>
                                    </div>
                                    <span className={`team-rolebadge team-rolebadge--${r.tone}`}>
                                        <Icon name={r.icon} size={14} fill={1} /> {u.role === 'superadmin' ? 'Owner' : r.label}
                                    </span>
                                    <div className="team-row__actions">
                                        <button type="button" className="crm-iconbtn" aria-label="Edit user" title="Edit" onClick={() => onEdit(u)}>
                                            <Icon name="edit" size={20} />
                                        </button>
                                        {!isSelf && (
                                            <button type="button" className="crm-iconbtn" aria-label="Remove user" title="Remove" onClick={() => onDelete(u)} style={{ color: 'var(--c-error)' }}>
                                                <Icon name="delete" size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default TeamMembers;
