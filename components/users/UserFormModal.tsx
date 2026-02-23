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

import { InputField } from '../ui/InputField';

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
    { value: 'staff', label: 'Staff', icon: UserGroupIcon, description: 'Basic access for daily operations', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: BuildingOfficeIcon, description: 'Full inventory control', color: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20' },
    { value: 'admin', label: 'Admin', icon: ShieldCheckIcon, description: 'Full system access', color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20' },
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            if (password && userToEdit) {
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
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in sm:p-4"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <form
                onSubmit={handleSubmit}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-t-[32px] sm:rounded-[32px] w-full sm:max-h-[90vh] overflow-hidden flex flex-col animate-notification-slide-up sm:max-w-md shadow-2xl border border-slate-200/50 dark:border-white/10 safe-area-bottom"
                onClick={(e) => e.stopPropagation()}
            >
                {/* iOS-style drag handle for mobile */}
                <div className="sm:hidden pt-3 pb-1 flex justify-center">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="sticky top-0 px-4 pt-4 pb-3 sm:px-6 border-b border-slate-200/50 dark:border-white/10 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {userToEdit ? 'Edit User' : 'New User'}
                            </h3>
                            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                {userToEdit ? 'Update user details' : 'Create a new user account'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-[22px] w-[22px]" />
                        </button>
                    </div>
                </div>

                {/* Styled Segmented Control for Mobile/Desktop Tabs */}
                <div className="px-4 sm:px-6 pt-4 pb-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-100 dark:border-white/5">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-[14px]">
                        <button
                            type="button"
                            onClick={() => setActiveTab('basic')}
                            className={`flex flex-1 items-center justify-center py-2.5 text-[14px] font-semibold rounded-[10px] transition-all duration-300 ${activeTab === 'basic' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <UserCircleIcon className="w-4 h-4 mr-2" />
                            Basic Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('security')}
                            className={`flex flex-1 items-center justify-center py-2.5 text-[14px] font-semibold rounded-[10px] transition-all duration-300 ${activeTab === 'security' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <LockIcon className="w-4 h-4 mr-2" />
                            Security
                        </button>
                    </div>
                </div>

                {/* Form content */}
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 max-h-[60vh] sm:max-h-full">
                    {error && (
                        <div className="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-900/30 p-4 rounded-[16px] animate-fade-in shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="h-[18px] w-[18px] text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-[14px] text-red-700 dark:text-red-400 font-semibold">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Info Section */}
                    <div className={`${activeTab === 'basic' ? 'block animate-fade-in' : 'hidden'}`}>
                        <div className="space-y-5">
                            {/* Name Field */}
                            <InputField
                                label="Full Name"
                                name="name"
                                value={user.name}
                                onChange={handleChange}
                                required
                                icon={<UserCircleIcon className="w-5 h-5 text-slate-400" />}
                                placeholder="Enter full name"
                            />

                            {/* Email Field */}
                            <InputField
                                label="Email Address"
                                name="email"
                                value={user.email}
                                onChange={handleChange}
                                type="email"
                                required
                                icon={<MailIcon className="w-5 h-5 text-slate-400" />}
                                placeholder="user@example.com"
                            />

                            {/* Role Selection */}
                            <div>
                                <label className="block text-[14px] font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    User Role
                                </label>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {ROLE_OPTIONS.map(({ value, label, icon: Icon, description, color }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setUser(prev => ({ ...prev, role: value as User['role'] }))}
                                            className={`p-3.5 rounded-[16px] border-2 text-left transition-all duration-300 active:scale-[0.98] ${user.role === value ? 'border-blue-500/50 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-800/50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl border ${user.role === value ? color : 'bg-slate-100 dark:bg-slate-700 border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-slate-400'}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className={`block text-[15px] font-semibold ${user.role === value ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
                                                        <span className={`block text-[13px] mt-0.5 ${user.role === value ? 'text-blue-700/80 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>{description}</span>
                                                    </div>
                                                </div>
                                                {user.role === value && (
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center transform scale-in">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className={`${activeTab === 'security' ? 'block animate-fade-in' : 'hidden'}`}>
                        <div className="space-y-5">
                            {/* Password Field */}
                            <div className="relative">
                                <InputField
                                    label={userToEdit ? "Change Password" : "Create Password"}
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={<LockIcon className="w-5 h-5 text-slate-400" />}
                                    placeholder={userToEdit ? "Leave blank to keep current" : "Minimum 8 characters"}
                                />
                                <div className="absolute right-0 top-0 mt-[34px] mr-[6px]">
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 text-[13px] font-medium">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`${password.length >= 8 ? 'text-green-600 dark:text-green-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {password.length >= 8 ? '✓ ' : '○ '}8+ characters required
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                                        {password.length}/8
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                                    <div
                                        className={`h-full transition-all duration-300 ease-out ${password.length >= 8 ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min((password.length / 8) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            {userToEdit && (
                                <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                    Leave the password field empty to keep the user's current password.
                                </p>
                            )}

                            {/* Password Requirements */}
                            {!userToEdit && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 mt-4">
                                    <h4 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300 mb-3">Password Requirements</h4>
                                    <ul className="space-y-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                        <li className="flex items-center gap-2.5">
                                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${password.length >= 8 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                {password.length >= 8 ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                                            </span>
                                            At least 8 characters long
                                        </li>
                                        <li className="flex items-center gap-2.5 opacity-60">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400">
                                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                            </span>
                                            Include letters and numbers
                                        </li>
                                        <li className="flex items-center gap-2.5 opacity-60">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400">
                                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                            </span>
                                            Case-sensitive
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Fixed action buttons */}
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-4 sm:px-6 border-t border-slate-200/50 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 dark:border-white/10 text-[15px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-[15px] font-bold text-white transition-all duration-300 ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5'} flex items-center justify-center min-w-[120px]`}
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                userToEdit ? 'Update User' : 'Create User'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserFormModal;