
import React from 'react';
import { User } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UserCircleIcon from '../icons/UserCircleIcon';

interface UserDetailsViewProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode, actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
        {children}
    </div>
);


const roleBadges: { [key in User['role']]: string } = {
    admin: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20',
    staff: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-700/10',
    inventory_manager: 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
};

const UserDetailsView: React.FC<UserDetailsViewProps> = ({ user, onEdit, onDelete }) => {
    
    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the user "${user.name}"? This action cannot be undone.`)) {
            onDelete(user.id);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 flex flex-col items-center text-center bg-white p-6 rounded-lg shadow">
                    <UserCircleIcon className="w-24 h-24 text-gray-400" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                     <span className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadges[user.role]}`}>
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                </div>
                <div className="lg:col-span-2">
                    <InfoCard 
                        title="Account Information"
                        actions={
                            <>
                                <button onClick={() => onEdit(user)} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    <PencilIcon className="h-4 w-4 text-gray-500" />
                                    Edit
                                </button>
                                <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50">
                                    <TrashIcon className="h-4 w-4" />
                                    Delete
                                </button>
                            </>
                        }
                    >
                         <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-md text-gray-900">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                <dd className="mt-1 text-md text-gray-900">{user.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Role</dt>
                                <dd className="mt-1 text-md text-gray-900">{user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</dd>
                            </div>
                         </dl>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsView;
