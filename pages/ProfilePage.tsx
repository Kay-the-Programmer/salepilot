import React, { useState } from 'react';
import { User } from '../types';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ArrowLeftOnRectangleIcon from '../components/icons/ArrowLeftOnRectangleIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import DevicePhoneMobileIcon from '../components/icons/DevicePhoneMobileIcon';
import KeyIcon from '../components/icons/KeyIcon';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Header from "@/components/Header.tsx";

interface ProfilePageProps {
    user: User;
    onLogout: () => void;
    installPrompt: any | null;
    onInstall: () => void;
    onUpdateProfile: (userData: { name: string; email: string }) => Promise<void>;
    onChangePassword: (passwordData: { currentPassword: string, newPassword: string }) => Promise<void>;
}

const InfoCard: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    variant?: 'default' | 'danger';
}> = ({ title, icon, children, actions, variant = 'default' }) => (
    <div className={`group bg-white rounded-xl shadow-sm border ${variant === 'danger' ? 'border-red-100 hover:border-red-200' : 'border-gray-200 hover:border-gray-300'} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-2.5 rounded-lg transition-all duration-300 ${variant === 'danger' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-200">{title}</h3>
                    {variant === 'danger' && (
                        <p className="text-sm text-gray-500 mt-1">Irreversible action</p>
                    )}
                </div>
            </div>
            {actions}
        </div>
        {children}
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({
    user,
    onLogout,
    installPrompt,
    onInstall,
    onUpdateProfile,
    onChangePassword
}) => {
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

    // Platform detection for install guidance
    const ua = typeof window !== 'undefined' ? (window.navigator.userAgent || '') : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document);
    const isStandalone = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (typeof window !== 'undefined' && (window as any).navigator?.standalone);

    const handleSaveProfile = async (userData: { name: string; email: string }) => {
        try {
            await onUpdateProfile(userData);
            setIsEditProfileModalOpen(false);
        } catch (error) {
            // Error is handled in App.tsx, modal stays open for user to see the error
            console.error("Failed to update profile", error);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-100  md:min-h-0 md:h-full md:overflow-y-auto">
                <Header title="" />

                <main className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="mt-2 text-sm text-gray-600">Manage your account information and preferences</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Profile Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 lg:p-8 sticky top-8 transition-all duration-300 hover:shadow-xl">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative group/avatar">
                                            <div className="p-5 bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 rounded-2xl transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:rotate-2 shadow-sm group-hover/avatar:shadow-md">
                                                <UserCircleIcon className="w-24 h-24 text-blue-600 transition-transform duration-300" />
                                            </div>
                                            {!isStandalone && (
                                                <div className="absolute -top-2 -right-2 animate-bounce">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200 shadow-sm">
                                                        <DevicePhoneMobileIcon className="w-3 h-3" />
                                                        Web
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                                            <p className="text-sm text-gray-500 break-all">{user.email}</p>
                                            <div className="mt-3">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-gray-200 w-full">
                                            <button
                                                onClick={() => setIsEditProfileModalOpen(true)}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                Edit Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Details and Actions */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Personal Information */}
                                <InfoCard
                                    title="Personal Information"
                                    icon={<UserCircleIcon className="w-5 h-5" />}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                                                <p className="mt-2 text-base text-gray-900 font-semibold group-hover:text-blue-600 transition-colors duration-200">{user.name}</p>
                                            </div>
                                            <div className="group">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                                                <p className="mt-2 text-base text-gray-900 font-semibold break-all group-hover:text-blue-600 transition-colors duration-200">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Role</label>
                                                <p className="mt-2 text-base text-gray-900 font-semibold group-hover:text-blue-600 transition-colors duration-200">
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</label>
                                                <p className="mt-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Active
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </InfoCard>

                                {/* Install App Section */}
                                <InfoCard
                                    title="Install Application"
                                    icon={<DevicePhoneMobileIcon className="w-5 h-5" />}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl border border-blue-100 transition-all duration-300 hover:shadow-md">
                                            <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                                                <ArrowDownTrayIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-900 font-semibold mb-1">
                                                    {isStandalone
                                                        ? "App is Installed"
                                                        : "Install this app for better experience"}
                                                </p>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {isStandalone
                                                        ? "You're running the installed version with full functionality."
                                                        : isIOS
                                                            ? "Install on your iPhone/iPad home screen for quick access."
                                                            : "Install on your device for offline access and better performance."
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={() => {
                                                    if (installPrompt) {
                                                        onInstall();
                                                    } else {
                                                        const ua = window.navigator.userAgent || '';
                                                        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
                                                        const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window as any).navigator.standalone;
                                                        if (isStandalone) {
                                                            alert('The app is already installed and running in standalone mode.');
                                                        } else if (isIOS) {
                                                            alert('To install this app on iOS:\n\n1. Tap the Share button in Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right corner');
                                                        } else {
                                                            alert('Install prompt is not available yet. Try visiting a few pages and then return here, or use your browser menu: Install App/Add to Home Screen.');
                                                        }
                                                    }
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-semibold rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                                                disabled={isStandalone}
                                            >
                                                {isStandalone ? (
                                                    <>
                                                        <DevicePhoneMobileIcon className="w-5 h-5" />
                                                        Installed ✓
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                                        Install App
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Installation Guide */}
                                        {!isStandalone && (
                                            <div className="mt-4 p-5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">How to Install</h4>
                                                <ul className="space-y-3 text-sm text-gray-600">
                                                    {isIOS ? (
                                                        <>
                                                            <li className="flex items-start gap-3 group">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200">1</span>
                                                                <span className="pt-0.5">Open this site in Safari browser</span>
                                                            </li>
                                                            <li className="flex items-start gap-3 group">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200">2</span>
                                                                <span className="pt-0.5">Tap the Share button (square with arrow up)</span>
                                                            </li>
                                                            <li className="flex items-start gap-3 group">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200">3</span>
                                                                <span className="pt-0.5">Select "Add to Home Screen"</span>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="flex items-start gap-3 group">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200">1</span>
                                                                <span className="pt-0.5">Look for the install icon in your browser's address bar</span>
                                                            </li>
                                                            <li className="flex items-start gap-3 group">
                                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold mt-0.5 shadow-sm group-hover:scale-110 transition-transform duration-200">2</span>
                                                                <span className="pt-0.5">Or use your browser menu → "Install App" / "Add to Home Screen"</span>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </InfoCard>

                                {/* Security & Account Actions */}
                                <InfoCard
                                    title="Security & Account"
                                    icon={<KeyIcon className="w-5 h-5" />}
                                >
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setIsChangePasswordModalOpen(true)}
                                            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group transform hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300">
                                                    <KeyIcon className="w-4 h-4 text-gray-600 group-hover:text-blue-700 transition-colors duration-300" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-medium text-gray-900">Change Password</p>
                                                    <p className="text-xs text-gray-500">Update your login credentials</p>
                                                </div>
                                            </div>
                                            <span className="text-gray-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1">→</span>
                                        </button>
                                    </div>
                                </InfoCard>

                                {/* Logout Section */}
                                <InfoCard
                                    title="Logout"
                                    variant="danger"
                                    icon={<ArrowLeftOnRectangleIcon className="w-5 h-5" />}
                                >
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">
                                            You will be signed out of all devices. Make sure to save any unsaved work.
                                        </p>
                                        <button
                                            onClick={onLogout}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </div>
                                </InfoCard>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            <EditProfileModal
                isOpen={isEditProfileModalOpen}
                onClose={() => setIsEditProfileModalOpen(false)}
                onSave={handleSaveProfile}
                currentUser={user}
            />
            <ChangePasswordModal
                isOpen={isChangePasswordModalOpen}
                onClose={() => setIsChangePasswordModalOpen(false)}
                onSave={onChangePassword}
            />
        </>
    );
};

export default ProfilePage;