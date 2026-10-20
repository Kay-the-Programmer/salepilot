import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { Icon, Avatar } from '../crm/CrmBits';
import { TeamOverview, roleDef } from './teamModel';

interface TeamMembersProps {
    overview: TeamOverview;
    currentUser: User;
    /** Staff logins this plan allows, -1 for unlimited. */
    seatLimit: number;
    onAdd: () => void;
    onEdit: (u: User) => void;
    onDelete: (u: User) => void;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({ overview, currentUser, seatLimit, onAdd, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { members, total, admins, managers, staff } = overview;
    // Seats are capacity, not a feature to buy: every tier can add staff, the
    // tiers differ in how many. So running out is answered by a bigger plan,
    // not by unlocking anything, and there is one place to go for that.
    const unlimited = seatLimit < 0;
    const canAdd = unlimited || total < seatLimit;
    const seePlans = () => navigate('/subscription');

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
                    onClick={canAdd ? onAdd : seePlans}
                    title={canAdd ? 'Add a team member' : `Your plan allows ${seatLimit} staff login${seatLimit === 1 ? '' : 's'}`}
                >
                    <Icon name={canAdd ? 'person_add' : 'arrow_upward'} size={20} /> Add User
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

            {/* Seat capacity */}
            <div className={`team-seats ${canAdd ? 'team-seats--ok' : 'team-seats--locked'}`}>
                <div className="team-seats__left">
                    <span className="team-seats__icon"><Icon name={unlimited ? 'workspace_premium' : 'event_seat'} size={24} fill={1} /></span>
                    <div>
                        <p className="team-seats__title">
                            {unlimited ? 'Unlimited staff logins' : `${total} of ${seatLimit} staff login${seatLimit === 1 ? '' : 's'} used`}
                        </p>
                        <p className="team-seats__text">
                            {unlimited
                                ? 'Add as many staff accounts as your store needs.'
                                : (canAdd
                                    ? `You can add ${seatLimit - total} more${seatLimit - total === 1 ? '' : ''} on this plan.`
                                    : 'A larger plan raises this limit — every feature is included in all of them.')}
                        </p>
                    </div>
                </div>
                {!canAdd && (
                    <button className="crm-btn crm-btn--filled" type="button" onClick={seePlans}>
                        <Icon name="arrow_upward" size={20} /> See plans
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
                        <button className="crm-btn crm-btn--primary" type="button" style={{ marginTop: 8 }} onClick={canAdd ? onAdd : seePlans}>
                            <Icon name={canAdd ? 'person_add' : 'arrow_upward'} size={20} /> Add your first member
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
