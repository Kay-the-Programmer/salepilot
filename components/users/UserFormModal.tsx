
import React, { useState, useEffect } from 'react';
import { User } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import { SnackbarType } from '../../App';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<User, 'id'>, id?: string) => void;
    userToEdit?: User | null;
    showSnackbar: (message: string, type?: SnackbarType) => void;
}

const getInitialState = (): Omit<User, 'id'> => ({
    name: '',
    email: '',
    role: 'staff',
});

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, showSnackbar }) => {
    const [user, setUser] = useState(getInitialState());
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setPassword('');
            setShowPassword(false);
            if (userToEdit) {
                setUser({ ...userToEdit });
            } else {
                setUser(getInitialState());
            }
        }
    }, [userToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.name.trim() || !user.email.trim()) {
            setError('Name and email are required.');
            return;
        }
        if (!userToEdit && !password) {
            setError('Password is required for new users.');
            return;
        }
        if (!userToEdit && password.length < 8) {
            setError('For new users, password must be at least 8 characters long.');
            return;
        }
        if (userToEdit && password && password.length < 8) {
            setError('If changing password, it must be at least 8 characters long.');
            return;
        }
        // In a real app, password would be handled by the authService
        // This is a mock, so we just log a message if it changes.
        if (password) {
            console.log(`Password for ${user.email} would be set to "${password}"`);
            showSnackbar(`Password for ${user.email} updated (simulated).`, 'info');
        }

        // Include password in the user object when creating a new user or updating password
        // For new users, password is required
        const userWithPassword = !userToEdit || password ? { ...user, password } : user;
        onSave(userWithPassword, userToEdit?.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl sm:max-w-lg w-full m-4">
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                        <h3 className="text-lg font-medium text-gray-900">
                            {userToEdit ? 'Edit User' : 'Add New User'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                        {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm text-red-700">{error}</p></div>}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" name="name" id="name" value={user.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" id="email" value={user.email} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                            <select name="role" id="role" value={user.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                                <option value="staff">Staff</option>
                                <option value="inventory_manager">Inventory Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    id="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10" 
                                    placeholder={userToEdit ? "Leave blank to keep current password" : "Min. 8 characters"}
                                />
                                <button 
                                    type="button" 
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-1"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm">
                            Save User
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
