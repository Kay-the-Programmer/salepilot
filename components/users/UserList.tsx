import React, { useState } from 'react';
import { User } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import EllipsisVerticalIcon from '../icons/EllipsisVerticalIcon';

interface UserListProps {
    users: User[];
    onSelectUser: (userId: string) => void;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    isLoading: boolean;
    error: string | null;
}

const UserList: React.FC<UserListProps> = ({ users, onSelectUser, onEdit, onDelete, isLoading, error }) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [showActionsForUser, setShowActionsForUser] = useState<string | null>(null);

    const handleUserClick = (userId: string) => {
        if (showActionsForUser === userId) {
            setShowActionsForUser(null);
        } else {
            setShowActionsForUser(null);
            onSelectUser(userId);
            setSelectedUserId(userId);
        }
    };

    const handleActionMenu = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        setShowActionsForUser(showActionsForUser === userId ? null : userId);
        setSelectedUserId(userId);
    };

    const getRoleIcon = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return <ShieldCheckIcon className="w-5 h-5 text-red-500" />;
            case 'staff':
                return <UserGroupIcon className="w-5 h-5 text-blue-500" />;
            case 'inventory_manager':
                return <BuildingOfficeIcon className="w-5 h-5 text-yellow-500" />;
            default:
                return <UserCircleIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const getRoleColor = (role: User['role']) => {
        switch (role) {
            case 'admin':
                return 'bg-red-50 text-red-700 border-red-100';
            case 'staff':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'inventory_manager':
                return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getRoleLabel = (role: User['role']) => {
        return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatUserCount = () => {
        const adminCount = users.filter(u => u.role === 'admin').length;
        const staffCount = users.filter(u => u.role === 'staff').length;
        const managerCount = users.filter(u => u.role === 'inventory_manager').length;
        
        return { adminCount, staffCount, managerCount };
    };

    if (isLoading) {
        return (
            <div className="px-4 py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-lg font-medium text-gray-700">Loading users...</p>
                    <p className="text-sm text-gray-500 mt-1">Fetching user data</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-12">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900 mb-2">Error loading users</p>
                    <p className="text-sm text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="px-4 py-12">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                        <UserGroupIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No users found</p>
                    <p className="text-sm text-gray-500 mt-1">Add users to get started</p>
                </div>
            </div>
        );
    }

    const roleCounts = formatUserCount();

    return (
        <div className="px-4 py-4 sm:px-6 lg:px-8">
            {/* Role Summary Cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="liquid-glass-card rounded-[2rem] p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                            <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Admins</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts.adminCount}</p>
                        </div>
                    </div>
                </div>
                <div className="liquid-glass-card rounded-[2rem] p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                            <UserGroupIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Staff</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts.staffCount}</p>
                        </div>
                    </div>
                </div>
                <div className="liquid-glass-card rounded-[2rem] p-4 border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Managers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts.managerCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden md:grid md:grid-cols-12 bg-gray-50 px-6 py-3 rounded-t-2xl border border-gray-200">
                <div className="col-span-4">
                    <span className="text-sm font-semibold text-gray-900">User</span>
                </div>
                <div className="col-span-4">
                    <span className="text-sm font-semibold text-gray-900">Email</span>
                </div>
                <div className="col-span-2">
                    <span className="text-sm font-semibold text-gray-900">Role</span>
                </div>
                <div className="col-span-2 text-right">
                    <span className="text-sm font-semibold text-gray-900">Actions</span>
                </div>
            </div>

            {/* Users List */}
            <div className="liquid-glass-card rounded-[2rem] border border-gray-200 overflow-hidden">
                {users.map((user) => (
                    <div 
                        key={user.id} 
                        className={`border-b border-gray-100 last:border-0 transition-colors cursor-pointer ${
                            selectedUserId === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleUserClick(user.id)}
                    >
                        {/* Mobile Card View */}
                        <div className="md:hidden p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border-2 border-white shadow-sm">
                                            <span className="text-blue-600 font-bold text-lg">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {user.name}
                                            </h3>
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                <span>{getRoleLabel(user.role)}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleActionMenu(e, user.id)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg active:scale-95 transition-all duration-300"
                                        aria-label="More actions"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Action Menu for Mobile */}
                            {showActionsForUser === user.id && (
                                <div className="mt-3 pt-3 border-t border-gray-100 animate-slide-down">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(user);
                                                setShowActionsForUser(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(user.id);
                                                setShowActionsForUser(null);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors active:scale-95 transition-all duration-300"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table Row */}
                        <div className="hidden md:grid md:grid-cols-12 px-6 py-4 items-center">
                            <div className="col-span-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-200">
                                        <span className="text-blue-600 font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-4">
                                <div className="text-gray-600">{user.email}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    {getRoleIcon(user.role)}
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(user);
                                        }}
                                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                                        aria-label="Edit user"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(user.id);
                                        }}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors active:scale-95 transition-all duration-300"
                                        aria-label="Delete user"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Footer Summary */}
            <div className="md:hidden mt-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">{users.length} Users</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                {roleCounts.adminCount} Admin
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {roleCounts.staffCount} Staff
                            </span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                {roleCounts.managerCount} Manager
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Tap user for details</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserList;