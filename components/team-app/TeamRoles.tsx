import React from 'react';
import { Icon } from '../crm/CrmBits';
import { ROLES, TeamOverview } from './teamModel';

interface TeamRolesProps {
    overview: TeamOverview;
}

export const TeamRoles: React.FC<TeamRolesProps> = ({ overview }) => {
    const countFor = (id: string) => {
        if (id === 'admin') return overview.admins;
        if (id === 'inventory_manager') return overview.managers;
        if (id === 'staff') return overview.staff;
        return 0;
    };

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ marginBottom: 16 }}>
                <div>
                    <p className="crm-pagehead__eyebrow">Access control</p>
                    <h2 className="crm-pagehead__title">Roles</h2>
                    <p className="crm-pagehead__sub">What each role can do. Assign a role when you add or edit a member.</p>
                </div>
            </div>

            <div className="team-roles">
                {ROLES.map(r => (
                    <div key={r.id} className="team-rolecard">
                        <div className={`team-rolecard__icon team-rolecard__icon--${r.tone}`}><Icon name={r.icon} size={26} fill={1} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <h3 className="team-rolecard__name">{r.label}</h3>
                            <span className="team-rolecard__count">{countFor(r.id)} member{countFor(r.id) === 1 ? '' : 's'}</span>
                        </div>
                        <p className="team-rolecard__desc">{r.desc}</p>
                        <ul className="team-rolecard__list">
                            {r.perks.map(p => (
                                <li key={p}><Icon name="check_circle" size={16} fill={1} /> {p}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default TeamRoles;
