
import React from 'react';
import { User } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UserCircleIcon from '../icons/UserCircleIcon';

interface UserListProps {
    users: User[];
    onSelectUser: (userId: string) => void;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    isLoading: boolean;
    error: string | null;
}

const UserList: React.FC<UserListProps> = ({ users, onSelectUser, onEdit, onDelete, isLoading, error }) => {

    if (isLoading) {
        return <div className="text-center p-10">Loading users...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (users.length === 0) {
        return <div className="text-center p-10 text-gray-500">No users found.</div>;
    }

    const roleBadges: { [key in User['role']]: string } = {
        admin: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20',
        staff: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-700/10',
        inventory_manager: 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">User</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectUser(user.id)}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        <UserCircleIcon className="h-10 w-10 text-gray-300" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-gray-900">{user.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadges[user.role]}`}>
                                                    {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="flex items-center justify-end space-x-4" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900" title="Edit User">
                                                        <PencilIcon className="w-5 h-5"/>
                                                    </button>
                                                    <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-900" title="Delete User">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserList;
