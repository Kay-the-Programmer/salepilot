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
                return <ShieldCheckIcon className="w-4 h-4 text-red-600 dark:text-red-400" />;
            case 'staff':
                return <UserGroupIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
            case 'inventory_manager':
                return <BuildingOfficeIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
            default:
                return <UserCircleIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
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

    const formatUserCount = () => {
        const adminCount = users.filter(u => u.role === 'admin').length;
        const staffCount = users.filter(u => u.role === 'staff').length;
        const managerCount = users.filter(u => u.role === 'inventory_manager').length;
        return { adminCount, staffCount, managerCount };
    };

    if (isLoading) {
        return (
            <div className="px-4 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-white/10 border-t-blue-600 dark:border-t-blue-500 mb-4"></div>
                    <p className="text-[15px] font-medium text-slate-700 dark:text-slate-300">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-12">
                <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md mx-auto border border-red-100 dark:border-red-900/30 shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 dark:bg-red-500/10 mb-4">
                        <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-[17px] font-semibold text-slate-900 dark:text-white mb-2">Error loading users</p>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="px-4 py-12">
                <div className="text-center bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md mx-auto border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-200 dark:border-white/5 shadow-inner">
                        <UserGroupIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-[17px] font-semibold text-slate-900 dark:text-white">No users found</p>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Add users to get started</p>
                </div>
            </div>
        );
    }

    const roleCounts = formatUserCount();

    return (
        <div className="pb-8">
            {/* Role Summary Cards */}
            <div className="mb-6 md:mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 border border-slate-200/50 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center">
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-2xl mr-4 shadow-sm border border-red-100 dark:border-red-900/30">
                            <ShieldCheckIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admins</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{roleCounts.adminCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 border border-slate-200/50 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl mr-4 shadow-sm border border-blue-100 dark:border-blue-900/30">
                            <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Staff</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{roleCounts.staffCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-5 border border-slate-200/50 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl mr-4 shadow-sm border border-yellow-100 dark:border-yellow-900/30">
                            <BuildingOfficeIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Managers</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{roleCounts.managerCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table Header (Hidden on Mobile) */}
            <div className="hidden md:grid md:grid-cols-12 px-6 py-3 mb-2 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Users List Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-200/50 dark:border-white/10 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-left">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className={`relative border-b border-slate-100 dark:border-white/5 last:border-0 transition-colors cursor-pointer block w-full text-left outline-none ${selectedUserId === user.id ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        onClick={() => handleUserClick(user.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleUserClick(user.id);
                            }
                        }}
                        tabIndex={0}
                        role="button"
                    >
                        {/* Mobile Card View */}
                        <div className="md:hidden p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                    <div className="w-[46px] h-[46px] flex-shrink-0 rounded-[14px] bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center border border-white/50 dark:border-white/10 shadow-sm">
                                        <span className="text-blue-600 dark:text-white font-bold text-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white truncate pr-2">
                                                {user.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[14px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user.email}</p>
                                            <div className={`inline-flex items-center gap-1 -mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 ml-2">
                                    <button
                                        onClick={(e) => handleActionMenu(e, user.id)}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 active:scale-95"
                                        aria-label="More actions"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                    </button>
                                    <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                </div>
                            </div>

                            {/* Action Menu for Mobile - Slides down nicely within the card */}
                            {showActionsForUser === user.id && (
                                <div className="mt-3 overflow-hidden animate-notification-slide-down">
                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(user);
                                                setShowActionsForUser(null);
                                            }}
                                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl active:scale-95 transition-all duration-300 border border-slate-200/50 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900"
                                        >
                                            <PencilIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(user.id);
                                                setShowActionsForUser(null);
                                            }}
                                            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl active:scale-95 transition-all duration-300 border border-slate-200/50 dark:border-white/5 hover:border-red-200 dark:hover:border-red-900"
                                        >
                                            <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Table Row */}
                        <div className="hidden md:grid md:grid-cols-12 px-6 py-4 items-center group">
                            <div className="col-span-4 flex items-center gap-3.5 pr-4">
                                <div className="w-[42px] h-[42px] rounded-[14px] bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-600 dark:to-blue-800 flex items-center justify-center border border-white/50 dark:border-white/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                    <span className="text-blue-600 dark:text-white font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[15px] font-semibold text-slate-900 dark:text-white truncate">{user.name}</div>
                                </div>
                            </div>
                            <div className="col-span-4 pr-4">
                                <div className="text-[15px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                            </div>
                            <div className="col-span-2">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border ${getRoleColor(user.role)}`}>
                                    {getRoleIcon(user.role)}
                                    <span>{getRoleLabel(user.role)}</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(user);
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all duration-300 transform active:scale-95"
                                        aria-label="Edit user"
                                    >
                                        <PencilIcon className="w-[18px] h-[18px]" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(user.id);
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all duration-300 transform active:scale-95"
                                        aria-label="Delete user"
                                    >
                                        <TrashIcon className="w-[18px] h-[18px]" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-end group-hover:hidden group-focus-within:hidden h-9">
                                    <ChevronRightIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile Footer Summary */}
            <div className="md:hidden mt-6 text-center">
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{users.length} Users</p>
                <div className="flex justify-center items-center gap-3 mt-2 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        {roleCounts.adminCount} Admin
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        {roleCounts.staffCount} Staff
                    </span>
                    <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        {roleCounts.managerCount} Mgr
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserList;