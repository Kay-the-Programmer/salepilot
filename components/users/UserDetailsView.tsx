import React, { useState } from 'react';
import { User } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import UserIcon from '../icons/UserIcon';
import KeyIcon from '../icons/KeyIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';

interface UserDetailsViewProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onBack?: () => void;
}

const InfoCard: React.FC<{
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    compact?: boolean;
}> = ({ title, children, icon, compact = false }) => (
    <div className={`bg-white dark:bg-slate-900 ${compact ? 'p-4 md:p-5' : 'p-5 md:p-6'} rounded-2xl md:rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5 transition-all`}>
        <div className={`flex items-center ${compact ? 'mb-3 md:mb-4' : 'mb-4 md:mb-5'}`}>
            {icon && (
                <div className="mr-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    {icon}
                </div>
            )}
            <h3 className={`font-bold ${compact ? 'text-base' : 'text-lg'} text-slate-900 dark:text-white tracking-tight`}>{title}</h3>
        </div>
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}> = ({ label, value, icon, onClick }) => (
    <div
        className={`flex items-center justify-between py-3.5 ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-3 px-3 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-[0.98]' : 'border-b border-slate-100 dark:border-white/5 last:border-0 pb-4 last:pb-0'}`}
        onClick={onClick}
    >
        <div className="flex items-center flex-1 min-w-0">
            {icon && (
                <div className="mr-3.5 text-slate-400 dark:text-slate-500">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                <div className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{value}</div>
            </div>
        </div>
        {onClick && <ChevronRightIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />}
    </div>
);

const UserDetailsView: React.FC<UserDetailsViewProps> = ({ user, onEdit, onDelete, onBack }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const getRoleIcon = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return <ShieldCheckIcon className="w-5 h-5 text-red-600 dark:text-red-400" />;
            case 'staff':
                return <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'inventory_manager':
                return <BuildingOfficeIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
            default:
                return <KeyIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
        }
    };

    const getRoleColor = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
            case 'staff':
                return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20';
            case 'inventory_manager':
                return 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
            default:
                return 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-white/10';
        }
    };

    const getRoleLabel = (role: User['role']) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleDelete = () => {
        if (deleteConfirmation === 'DELETE') {
            onDelete(user.id);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteConfirm(false);
        setDeleteConfirmation('');
    };

    const formatPermissions = () => {
        switch (user.role) {
            case 'admin':
                return ['Full system access', 'Manage users', 'Configure settings', 'View all reports'];
            case 'staff':
                return ['Process sales', 'View products', 'Basic inventory access', 'Customer management'];
            case 'inventory_manager':
                return ['Full inventory control', 'Manage stock levels', 'Supplier management', 'Product catalog'];
            default:
                return ['Basic access'];
        }
    };

    return (
        <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Desktop & Mobile Header combined for uniform feel */}
            <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-transparent transition-all duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-6 flex items-center justify-between">
                    <div className="flex flex-1 items-center">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="mr-3 p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white active:bg-slate-200/50 dark:active:bg-slate-800 rounded-full transition-all duration-300 active:scale-95"
                                aria-label="Go back"
                            >
                                <ArrowLeftIcon className="w-[22px] h-[22px]" />
                            </button>
                        )}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl md:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight truncate">User Details</h1>
                            <p className="hidden md:block text-[15px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">#{user.id.slice(-8)}</p>
                        </div>
                    </div>
                    {/* Top right actions for Desktop */}
                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={() => onEdit(user)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm backdrop-blur-xl transition-all duration-300 active:scale-95"
                        >
                            <PencilIcon className="w-[18px] h-[18px]" />
                            Edit User
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all duration-300 active:scale-95 border border-red-100 dark:border-red-900/30"
                        >
                            <TrashIcon className="w-[18px] h-[18px]" />
                            Delete
                        </button>
                    </div>
                    {/* Top right actions for Mobile */}
                    <button
                        onClick={() => setShowActionMenu(!showActionMenu)}
                        className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all duration-300 bg-slate-200/50 dark:bg-slate-800/50 rounded-full"
                        aria-label="More actions"
                    >
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Action Menu (iOS Action Sheet style) */}
            {showActionMenu && (
                <div className="md:hidden fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center animate-fade-in" onClick={() => setShowActionMenu(false)}>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-t-[32px] overflow-hidden flex flex-col animate-notification-slide-up shadow-2xl safe-area-bottom pb-6">
                        <div className="p-4 pt-3">
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5"></div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-3">
                                <button
                                    onClick={() => {
                                        onEdit(user);
                                        setShowActionMenu(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2.5 p-4 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-white/5"
                                >
                                    <PencilIcon className="w-[18px] h-[18px] text-blue-600 dark:text-blue-400" />
                                    <span className="text-[17px] font-semibold text-blue-600 dark:text-blue-400">Edit User Profile</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(true);
                                        setShowActionMenu(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2.5 p-4 active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
                                >
                                    <TrashIcon className="w-[18px] h-[18px] text-red-600 dark:text-red-400" />
                                    <span className="text-[17px] font-semibold text-red-600 dark:text-red-400">Delete Account</span>
                                </button>
                            </div>
                            <button
                                onClick={() => setShowActionMenu(false)}
                                className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl text-[17px] font-bold text-slate-900 dark:text-white active:scale-[0.98] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal (iOS Alert style) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4 md:p-0">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[28px] md:rounded-[32px] w-full max-w-sm overflow-hidden flex flex-col animate-notification-slide-up shadow-2xl border border-slate-200/50 dark:border-white/10">
                        <div className="p-6 md:p-8 text-center pb-6">
                            <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-[18px] flex items-center justify-center mb-5 border border-red-100 dark:border-red-900/30">
                                <TrashIcon className="w-7 h-7 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-[22px] font-bold text-slate-900 dark:text-white mb-2 leading-tight">Delete User</h3>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                Are you sure you want to delete <strong className="font-semibold text-slate-900 dark:text-white">{user.name}</strong>? This action cannot be undone.
                            </p>

                            <div className="mb-2 text-left">
                                <label htmlFor="confirm-delete" className="block text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Type <span className="font-mono text-red-500 dark:text-red-400">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    id="confirm-delete"
                                    className="w-full px-4 py-3.5 rounded-[16px] bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-[15px] font-medium text-slate-900 dark:text-white placeholder-slate-400"
                                    placeholder="Type DELETE"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                        <div className="flex border-t border-slate-200/50 dark:border-white/10">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 px-4 py-4 text-[17px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:bg-slate-100 dark:active:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <div className="w-px bg-slate-200/50 dark:bg-white/10"></div>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirmation !== 'DELETE'}
                                className={`flex-1 px-4 py-4 text-[17px] font-bold transition-colors ${deleteConfirmation === 'DELETE'
                                    ? 'text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20'
                                    : 'text-red-300 dark:text-red-800/50 cursor-not-allowed'
                                    }`}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-12 space-y-6 max-w-[1400px] mx-auto w-full">
                {/* User Profile Header Hero */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 md:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10 opacity-60"></div>
                    <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-center text-center md:text-left">
                        <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-[32px] bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600 dark:to-indigo-800 border-[6px] border-white dark:border-slate-800 shadow-xl flex items-center justify-center flex-shrink-0 z-10 transform hover:scale-105 transition-transform duration-500">
                            <span className="text-blue-600 dark:text-white font-bold text-[40px] md:text-[48px]">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-[28px] md:text-[36px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-2">{user.name}</h2>
                            <p className="text-[17px] text-slate-500 dark:text-slate-400 font-medium mb-4 flex items-center justify-center md:justify-start gap-2">
                                <EnvelopeIcon className="w-5 h-5 text-slate-400" />
                                {user.email}
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold border ${getRoleColor(user.role)} shadow-sm`}>
                                    {getRoleIcon(user.role)}
                                    <span>{getRoleLabel(user.role)}</span>
                                </div>
                                <div className="inline-flex items-center px-4 py-2 rounded-full border border-green-200/50 dark:border-green-500/20 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-[14px] font-semibold shadow-sm gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    Active
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Account Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Account Information */}
                        <InfoCard
                            title="Account Information"
                            icon={<UserIcon className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" />}
                        >
                            <DetailItem
                                label="Full Name"
                                value={user.name}
                                icon={<UserCircleIcon className="w-5 h-5" />}
                                onClick={() => onEdit(user)}
                            />
                            <DetailItem
                                label="Email Address"
                                value={user.email}
                                icon={<EnvelopeIcon className="w-5 h-5" />}
                            />
                            <DetailItem
                                label="User Role"
                                value={getRoleLabel(user.role)}
                                icon={<KeyIcon className="w-5 h-5" />}
                            />
                            <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                                <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">User ID</div>
                                <div className="font-mono text-[14px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl inline-block mt-1">{user.id}</div>
                            </div>
                        </InfoCard>

                        {/* Permissions Overview */}
                        <InfoCard
                            title="Permissions Overview"
                            icon={<ShieldCheckIcon className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" />}
                            compact
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {formatPermissions().map((permission, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                            <ShieldCheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">{permission}</span>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    </div>

                    {/* Right Column - Role Details */}
                    <div className="space-y-6">
                        {/* Role Information */}
                        <InfoCard
                            title="Role Details"
                            icon={getRoleIcon(user.role)}
                        >
                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                                    <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">
                                        {user.role === 'admin' && 'Full administrative access with all system privileges.'}
                                        {user.role === 'staff' && 'Standard staff access for daily operations and sales.'}
                                        {user.role === 'inventory_manager' && 'Inventory management access with product and stock control.'}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <h4 className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Access Level</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[14px] font-semibold">
                                            <span className="text-slate-700 dark:text-slate-300">System Access</span>
                                            <span className="text-slate-900 dark:text-white">
                                                {user.role === 'admin' ? 'Full' : user.role === 'inventory_manager' ? 'High' : 'Medium'}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${user.role === 'admin' ? 'bg-red-500 dark:bg-red-500 w-full' :
                                                    user.role === 'inventory_manager' ? 'bg-yellow-500 dark:bg-yellow-500 w-3/4' :
                                                        'bg-blue-500 dark:bg-blue-500 w-2/3'
                                                    }`}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </InfoCard>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDetailsView;