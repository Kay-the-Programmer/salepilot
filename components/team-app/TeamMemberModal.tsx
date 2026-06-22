import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { ROLES } from './teamModel';

interface TeamMemberModalProps {
    isOpen: boolean;
    userToEdit?: User | null;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>, id?: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Add / edit a team member. Preserves the existing UserFormModal logic — same
 * onSave(userData, id?) contract, the same name/email/role fields and password
 * rules (required & 8+ chars for new users, optional on edit).
 */
export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, userToEdit, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<User['role']>('staff');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setError('');
        setPassword('');
        setShowPw(false);
        if (userToEdit) {
            setName(userToEdit.name || '');
            setEmail(userToEdit.email || '');
            setRole(userToEdit.role || 'staff');
        } else {
            setName(''); setEmail(''); setRole('staff');
        }
    }, [isOpen, userToEdit]);

    if (!isOpen) return null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
        if (!EMAIL_RE.test(email)) { setError('Please enter a valid email address.'); return; }
        if (!userToEdit && password.length < 8) { setError('A password of at least 8 characters is required for new users.'); return; }
        if (userToEdit && password && password.length < 8) { setError('New password must be at least 8 characters long.'); return; }

        const base: Omit<User, 'id'> = { name: name.trim(), email: email.trim().toLowerCase(), role };
        const payload = (!userToEdit || password) ? { ...base, password } : base;
        onSave(payload, userToEdit?.id);
        onClose();
    };

    const pwPct = Math.min((password.length / 8) * 100, 100);

    return (
        <div className="crm-modal-backdrop" onClick={onClose}>
            <div className="crm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={userToEdit ? 'Edit member' : 'Add member'}>
                <div className="crm-modal__bar">
                    <button type="button" className="crm-iconbtn" aria-label="Close" onClick={onClose}><Icon name="arrow_back" /></button>
                    <h2 className="crm-modal__title">{userToEdit ? 'Edit Member' : 'Add Team Member'}</h2>
                </div>

                <form onSubmit={submit}>
                    <div className="crm-modal__body">
                        {error && (
                            <div className="crm-form-error" role="alert" style={{ margin: 0 }}>
                                <Icon name="error" size={20} fill={1} /> {error}
                            </div>
                        )}

                        <div className="crm-field">
                            <label className="crm-field__label" htmlFor="tm-name">Full name</label>
                            <input id="tm-name" className="crm-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" autoFocus />
                        </div>

                        <div className="crm-field">
                            <label className="crm-field__label" htmlFor="tm-email">Email address</label>
                            <input id="tm-email" className="crm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
                        </div>

                        <div className="crm-field">
                            <span className="crm-field__label">Role</span>
                            <div className="team-rolepick">
                                {ROLES.map(r => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        className={`team-roleopt${role === r.id ? ' is-active' : ''}`}
                                        onClick={() => setRole(r.id)}
                                    >
                                        <span className="team-roleopt__icon"><Icon name={r.icon} size={22} fill={role === r.id ? 1 : 0} /></span>
                                        <div style={{ minWidth: 0 }}>
                                            <p className="team-roleopt__name">{r.label}</p>
                                            <p className="team-roleopt__desc">{r.desc}</p>
                                        </div>
                                        <span className="team-roleopt__check"><Icon name="check_circle" size={22} fill={1} /></span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="crm-field">
                            <label className="crm-field__label" htmlFor="tm-pw">{userToEdit ? 'Change password' : 'Create password'}</label>
                            <div className="crm-input-affix">
                                <input
                                    id="tm-pw"
                                    className="crm-input"
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={userToEdit ? 'Leave blank to keep current' : 'Minimum 8 characters'}
                                    style={{ borderRadius: 'var(--c-radius) 0 0 var(--c-radius)' }}
                                />
                                <button type="button" className="crm-input-affix__prefix" onClick={() => setShowPw(s => !s)} style={{ borderLeft: 'none', borderRadius: '0 var(--c-radius) var(--c-radius) 0', cursor: 'pointer' }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                                    <Icon name={showPw ? 'visibility_off' : 'visibility'} size={20} />
                                </button>
                            </div>
                            {(password.length > 0 || !userToEdit) && (
                                <>
                                    <div className="team-pw"><div className="team-pw__fill" style={{ width: `${pwPct}%`, background: password.length >= 8 ? 'var(--c-primary)' : 'var(--c-secondary-container)' }} /></div>
                                    <p className="crm-input-group__hint">{password.length >= 8 ? '✓ Strong enough' : `${password.length}/8 characters`}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="crm-modal__foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '12px 22px' }} onClick={onClose}>Cancel</button>
                        <button type="submit" className="crm-btn crm-btn--primary" style={{ padding: '12px 26px' }}>
                            <Icon name={userToEdit ? 'save' : 'person_add'} size={20} /> {userToEdit ? 'Save changes' : 'Add member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamMemberModal;
