import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, StoreSettings } from '../../types';
import StandaloneShell from '../../components/standalone/StandaloneShell';
import EditProfileModal from '../../components/EditProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';

interface ProfileAppProps {
  user: User;
  storeSettings?: StoreSettings | null;
  onUpdateProfile: (data: { name: string; email: string }) => Promise<void>;
  onChangePassword: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  onLogout: () => void;
  onInstall?: () => void;
  installPrompt?: any;
}

const InfoRow: React.FC<{ icon: string; label: string; value?: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-3">
    <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 22 }}>{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant">{label}</p>
      <p className="text-sm font-medium m3-text-on-surface truncate">{value || '—'}</p>
    </div>
  </div>
);

const ActionRow: React.FC<{ icon: string; label: string; onClick: () => void; danger?: boolean; chevron?: boolean }> = ({ icon, label, onClick, danger, chevron = true }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition active:scale-[0.99] ${danger ? 'm3-text-error hover:m3-bg-error-container' : 'm3-text-on-surface hover:m3-bg-surface-high'}`}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{icon}</span>
    <span className="flex-1 text-left text-sm font-semibold">{label}</span>
    {chevron && <span className="material-symbols-outlined m3-text-on-surface-variant" style={{ fontSize: 20 }}>chevron_right</span>}
  </button>
);

const ProfileApp: React.FC<ProfileAppProps> = ({ user, storeSettings, onUpdateProfile, onChangePassword, onLogout, onInstall, installPrompt }) => {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const initial = (user?.name?.trim()?.[0] || 'S').toUpperCase();
  const planLabel = user.subscriptionPlan
    ? user.subscriptionPlan.replace(/^plan_/, '').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Free / Trial';

  const navItems = [
    { icon: 'home', label: 'Home', onClick: () => navigate('/') },
    { icon: 'apps', label: 'Apps', onClick: () => navigate('/pos/discover') },
    { icon: 'notifications', label: 'Alerts', onClick: () => navigate('/notify') },
    { icon: 'person', label: 'Account', active: true, onClick: () => {} },
  ];

  return (
    <StandaloneShell icon="account_circle" title="Account" navItems={navItems}>
      <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto w-full pb-24 md:pb-8">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-6 sp-fade-in">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 m3-border-primary m3-bg-primary-fixed flex items-center justify-center mb-3">
            {user.profilePicture
              ? <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold m3-text-primary">{initial}</span>}
          </div>
          <h2 className="text-2xl font-bold m3-text-on-surface">{user.name}</h2>
          <p className="text-sm m3-text-on-surface-variant">{user.email}</p>
          <span className="mt-2 inline-block text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full m3-bg-primary-fixed m3-text-primary capitalize">{user.role?.replace('_', ' ')}</span>
        </div>

        {/* Account details */}
        <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm px-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wide m3-text-on-surface-variant pt-4 pb-1">Account details</p>
          <div className="divide-y" style={{ borderColor: 'var(--m3-outline-variant)' }}>
            <InfoRow icon="person" label="Full name" value={user.name} />
            <InfoRow icon="mail" label="Email" value={user.email} />
            <InfoRow icon="call" label="Phone" value={user.phone} />
            <InfoRow icon="badge" label="Role" value={user.role?.replace('_', ' ')} />
          </div>
        </div>

        {/* Store & plan */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="m3-bg-surface-low rounded-2xl border m3-border-outline-variant p-4">
            <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 24 }}>storefront</span>
            <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant mt-2">Store</p>
            <p className="text-sm font-semibold m3-text-on-surface truncate">{storeSettings?.name || '—'}</p>
          </div>
          <button onClick={() => navigate('/subscription')} className="text-left m3-bg-surface-low rounded-2xl border m3-border-outline-variant p-4 hover:m3-bg-surface-high transition active:scale-[0.99]">
            <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 24 }}>card_membership</span>
            <p className="text-[11px] uppercase tracking-wide m3-text-on-surface-variant mt-2">Plan</p>
            <p className="text-sm font-semibold m3-text-on-surface truncate capitalize">{planLabel}</p>
          </button>
        </div>

        {/* Actions */}
        <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-1.5 mb-4">
          <ActionRow icon="edit" label="Edit profile" onClick={() => setEditOpen(true)} />
          <ActionRow icon="lock" label="Change password" onClick={() => setPwOpen(true)} />
          <ActionRow icon="card_membership" label="Subscription & billing" onClick={() => navigate('/subscription')} />
          {installPrompt && <ActionRow icon="install_mobile" label="Install app" onClick={() => onInstall?.()} />}
          <ActionRow icon="help" label="Help & guide" onClick={() => navigate('/user-guide')} />
        </div>

        <div className="m3-bg-surface-lowest rounded-2xl border m3-border-outline-variant shadow-sm p-1.5">
          <ActionRow icon="logout" label="Log out" onClick={onLogout} danger chevron={false} />
        </div>
      </div>

      <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSave={onUpdateProfile} currentUser={user} />
      <ChangePasswordModal isOpen={pwOpen} onClose={() => setPwOpen(false)} onSave={onChangePassword} />
    </StandaloneShell>
  );
};

export default ProfileApp;
