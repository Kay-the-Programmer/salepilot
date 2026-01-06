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
    <div className={`bg-white ${compact ? 'p-4' : 'p-5'} rounded-2xl shadow-sm border border-gray-200`}>
        <div className={`flex items-center ${compact ? 'mb-3' : 'mb-4'}`}>
            {icon && (
                <div className="mr-3 p-2 bg-gray-100 rounded-lg">
                    {icon}
                </div>
            )}
            <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'} text-gray-900`}>{title}</h3>
        </div>
        <div className={compact ? 'space-y-2' : 'space-y-4'}>
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
        className={`flex items-center justify-between py-3 ${onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100 -mx-2 px-2 rounded-xl transition-colors' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center flex-1 min-w-0">
            {icon && (
                <div className="mr-3 text-gray-400">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-500">{label}</div>
                <div className="text-base font-medium text-gray-900 truncate">{value}</div>
            </div>
        </div>
        {onClick && <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
    </div>
);

const UserDetailsView: React.FC<UserDetailsViewProps> = ({ user, onEdit, onDelete, onBack }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);

    const getRoleIcon = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return <ShieldCheckIcon className="w-5 h-5 text-red-600" />;
            case 'staff':
                return <UserGroupIcon className="w-5 h-5 text-blue-600" />;
            case 'inventory_manager':
                return <BuildingOfficeIcon className="w-5 h-5 text-yellow-600" />;
            default:
                return <KeyIcon className="w-5 h-5 text-gray-600" />;
        }
    };

    const getRoleColor = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'staff':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'inventory_manager':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getRoleLabel = (role: User['role']) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the user "${user.name}"? This action cannot be undone.`)) {
            onDelete(user.id);
        }
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
        <div className="h-full flex flex-col">
            {/* Mobile Header */}
            {onBack && (
                <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
                    <div className="px-4 py-3 flex items-center">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="ml-3">
                            <h1 className="text-lg font-semibold text-gray-900">User Details</h1>
                            <p className="text-sm text-gray-500">#{user.id.slice(-8)}</p>
                        </div>
                        <button
                            onClick={() => setShowActionMenu(!showActionMenu)}
                            className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="More actions"
                        >
                            <EllipsisVerticalIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Action Menu */}
            {showActionMenu && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowActionMenu(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up">
                        <div className="p-2">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        onEdit(user);
                                        setShowActionMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <PencilIcon className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">Edit User</div>
                                        <div className="text-sm text-gray-500">Update user details</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(true);
                                        setShowActionMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors"
                                >
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <TrashIcon className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-red-700">Delete User</div>
                                        <div className="text-sm text-red-500">Remove user from system</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-h-[60vh] sm:max-w-md flex flex-col shadow-2xl">
                        <div className="sm:hidden pt-3 pb-1 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="text-center">
                                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <TrashIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete User</h3>
                                <p className="text-gray-500 mb-6">
                                    Are you sure you want to delete <span className="font-semibold text-gray-900">{user.name}</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:bg-red-800 transition-colors"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* User Profile Header */}
                    <div className="mb-6 md:mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 border-4 border-white shadow-md flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-3xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                                    <p className="text-lg text-gray-600 mb-3">{user.email}</p>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRoleColor(user.role)}`}>
                                            {getRoleIcon(user.role)}
                                            <span className="font-semibold">{getRoleLabel(user.role)}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.id.slice(-8)}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Desktop Actions */}
                                <div className="hidden md:flex items-center gap-3">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                        Delete
                                    </button>
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
                                icon={<UserIcon className="w-5 h-5 text-gray-600" />}
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
                            </InfoCard>

                            {/* Permissions Overview */}
                            <InfoCard
                                title="Permissions Overview"
                                icon={<ShieldCheckIcon className="w-5 h-5 text-gray-600" />}
                                compact
                            >
                                <div className="space-y-3">
                                    {formatPermissions().map((permission, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-sm text-gray-700">{permission}</span>
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
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Role Description</h4>
                                        <p className="text-gray-700 text-sm">
                                            {user.role === 'admin' && 'Full administrative access with all system privileges.'}
                                            {user.role === 'staff' && 'Standard staff access for daily operations and sales.'}
                                            {user.role === 'inventory_manager' && 'Inventory management access with product and stock control.'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 mb-2">Access Level</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${user.role === 'admin' ? 'bg-red-500 w-full' :
                                                        user.role === 'inventory_manager' ? 'bg-yellow-500 w-3/4' :
                                                            'bg-blue-500 w-2/3'
                                                        }`}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {user.role === 'admin' ? 'Full' : user.role === 'inventory_manager' ? 'High' : 'Medium'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>

                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                                <h4 className="font-semibold text-blue-900 mb-4">Quick Actions</h4>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <PencilIcon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-gray-900">Edit Profile</div>
                                                <div className="text-xs text-gray-500">Update user details</div>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-red-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <TrashIcon className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-red-700">Delete Account</div>
                                                <div className="text-xs text-red-500">Remove from system</div>
                                            </div>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Account Status */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900">Account Status</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium text-green-700">Active</span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    This user account is currently active and can access the system.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Action Bar */}
            <div className="md:hidden sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex gap-3">
                    <button
                        onClick={() => onEdit(user)}
                        className="flex-1 px-4 py-3.5 rounded-xl border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 active:bg-blue-100 transition-colors"
                    >
                        Edit User
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 px-4 py-3.5 rounded-xl border-2 border-red-300 text-red-700 font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsView;