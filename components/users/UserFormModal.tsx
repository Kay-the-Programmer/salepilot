import React, { useState, useEffect } from 'react';
import { User } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import MailIcon from '../icons/EnvelopeIcon';
import LockIcon from '../icons/LockIcon';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
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

const ROLE_OPTIONS = [
    { value: 'staff', label: 'Staff', icon: UserGroupIcon, description: 'Basic access for daily operations', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: BuildingOfficeIcon, description: 'Full inventory control', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { value: 'admin', label: 'Admin', icon: ShieldCheckIcon, description: 'Full system access', color: 'bg-red-50 text-red-700 border-red-200' },
];

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, showSnackbar }) => {
    const [user, setUser] = useState(getInitialState());
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'security'>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setPassword('');
            setShowPassword(false);
            setIsSubmitting(false);
            setActiveTab('basic');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!user.name.trim() || !user.email.trim()) {
                setError('Name and email are required.');
                return;
            }
            if (!userToEdit && !password) {
                setError('Password is required for new users.');
                return;
            }
            if (!userToEdit && password.length < 8) {
                setError('Password must be at least 8 characters long.');
                return;
            }
            if (userToEdit && password && password.length < 8) {
                setError('New password must be at least 8 characters long.');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user.email)) {
                setError('Please enter a valid email address.');
                return;
            }

            // Show password update message
            if (password) {
                showSnackbar(`Password for ${user.email} updated.`, 'info');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const userWithPassword = !userToEdit || password ? { ...user, password } : user;
            onSave(userWithPassword, userToEdit?.id);
            onClose();
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-h-[90vh] sm:max-w-md flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="sticky top-0 bg-white px-4 pt-4 pb-3 sm:px-6 border-b border-gray-200 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                {userToEdit ? 'Edit User' : 'New User'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {userToEdit ? 'Update user details' : 'Create a new user account'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -m-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile tabs for form sections */}
                <div className="sm:hidden flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <UserCircleIcon className="w-4 h-4 inline mr-2" />
                        Basic Info
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <LockIcon className="w-4 h-4 inline mr-2" />
                        Security
                    </button>
                </div>

                {/* Form content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-slide-down">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Info Section */}
                    <div className={`${activeTab === 'basic' ? 'block' : 'hidden sm:block'}`}>
                        <div className="space-y-5">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    <UserCircleIcon className="w-4 h-4 inline mr-2 text-gray-500" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={user.name}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                    placeholder="Enter full name"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    <MailIcon className="w-4 h-4 inline mr-2 text-gray-500" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={user.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                    placeholder="user@example.com"
                                />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    User Role
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {ROLE_OPTIONS.map(({ value, label, icon: Icon, description, color }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setUser(prev => ({ ...prev, role: value as User['role'] }))}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${user.role === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{description}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${ROLE_OPTIONS.find(r => r.value === user.role)?.color}`}>
                                        {ROLE_OPTIONS.find(r => r.value === user.role)?.icon &&
                                            React.createElement(ROLE_OPTIONS.find(r => r.value === user.role)!.icon, { className: "w-4 h-4" })
                                        }
                                        <span className="text-sm font-medium">
                                            {ROLE_OPTIONS.find(r => r.value === user.role)?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className={`${activeTab === 'security' ? 'block' : 'hidden sm:block'}`}>
                        <div className="space-y-5">
                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    <LockIcon className="w-4 h-4 inline mr-2 text-gray-500" />
                                    {userToEdit ? 'Change Password' : 'Create Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        id="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="block w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                                        placeholder={userToEdit ? "Leave blank to keep current" : "Minimum 8 characters"}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={togglePasswordVisibility}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className={`${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                                            {password.length >= 8 ? '✓ ' : '○ '}8+ characters
                                        </span>
                                        <span className="text-gray-500">
                                            {password.length}/8
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${password.length >= 8 ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                {userToEdit && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Leave password field empty to keep current password
                                    </p>
                                )}
                            </div>

                            {/* Password Requirements */}
                            {!userToEdit && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements</h4>
                                    <ul className="space-y-1 text-sm text-blue-700">
                                        <li className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-blue-300'}`}></span>
                                            At least 8 characters long
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-300"></span>
                                            Include letters and numbers
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-300"></span>
                                            Case-sensitive
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Status */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Form Status:</span>
                                <span className={`ml-2 ${user.name && user.email ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {user.name && user.email ? 'Ready to save' : 'Incomplete'}
                                </span>
                            </div>
                            <div className="text-gray-500">
                                {userToEdit ? 'Editing' : 'Creating new user'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed action buttons */}
                <div className="sticky bottom-0 bg-white px-4 py-4 sm:px-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3.5 border-2 border-gray-300 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3.5 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                `${userToEdit ? 'Update' : 'Create'} User`
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserFormModal;