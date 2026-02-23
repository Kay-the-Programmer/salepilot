
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import UserList from '../components/users/UserList';
import UserFormModal from '../components/users/UserFormModal';
import UserDetailsView from '../components/users/UserDetailsView';
import PlusIcon from '../components/icons/PlusIcon';
import MagnifyingGlassIcon from '../components/icons/MagnifyingGlassIcon';
import { SnackbarType } from '../App';

interface UsersPageProps {
    users: User[];
    onSaveUser: (user: Omit<User, 'id'>, id?: string) => void;
    onDeleteUser: (userId: string) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    isLoading: boolean;
    error: string | null;
}

const UsersPage: React.FC<UsersPageProps> = ({ users, onSaveUser, onDeleteUser, showSnackbar, isLoading, error }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleOpenAddModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSave = (user: Omit<User, 'id'>, id?: string) => {
        onSaveUser(user, id);
        handleCloseModal();
        // If we are editing the currently viewed user, we don't want to go back to the list
        if (!id) {
            setSelectedUserId(null);
        }
    };

    const handleDeleteUser = (userId: string) => {
        onDeleteUser(userId);
        setSelectedUserId(null); // Go back to list after deletion
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    const filteredUsers = useMemo(() => users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

    const selectedUser = useMemo(() =>
        users.find(u => u.id === selectedUserId),
        [users, selectedUserId]
    );

    if (selectedUser) {
        return (
            <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google overflow-hidden relative">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <UserDetailsView
                        user={selectedUser}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteUser}
                        onBack={() => setSelectedUserId(null)}
                    />
                </main>
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    userToEdit={editingUser}
                    showSnackbar={showSnackbar}
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google overflow-hidden relative">
            <header className="flex-none sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-transparent transition-all duration-300">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div>
                            <h1 className="text-2xl md:text-[34px] font-bold md:font-semibold text-slate-900 dark:text-white tracking-tight">
                                User Management
                            </h1>
                        </div>
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-full font-semibold text-[15px] hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                            title="Add User"
                            aria-label="Add User"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Add User</span>
                        </button>
                    </div>

                    {/* Apple-style Search Bar */}
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-slate-200/50 dark:bg-slate-800/50 border-transparent rounded-[16px] text-[15px] text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300 outline-none shadow-inner"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-8 py-6 md:py-8">
                <div className="max-w-[1400px] mx-auto">
                    <UserList
                        users={filteredUsers}
                        onSelectUser={handleSelectUser}
                        onEdit={handleOpenEditModal}
                        onDelete={onDeleteUser}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </main>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                userToEdit={editingUser}
                showSnackbar={showSnackbar}
            />
        </div>
    );
};

export default UsersPage;

