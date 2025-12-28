import React, { useState } from 'react';
import { User } from '../types';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ArrowLeftOnRectangleIcon from '../components/icons/ArrowLeftOnRectangleIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
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

const InfoCard: React.FC<{ title: string; children: React.ReactNode, actions?: React.ReactNode }> = ({ title, children, actions }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {actions}
        </div>
        {children}
    </div>
);

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, installPrompt, onInstall, onUpdateProfile, onChangePassword }) => {
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
            <div className="flex flex-col h-full bg-gray-10">
                <Header title={""}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-1 flex flex-col items-center text-center">
                                <div className="p-2 bg-gray-100 rounded-full">
                                <UserCircleIcon className="w-24 h-24 text-gray-400" />
                                </div>
                                <h2 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h2>
                                <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                                <span className="mt-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                            </div>
                            <div className="md:col-span-2 space-y-6">
                                <InfoCard 
                                    title="Profile Information"
                                    actions={
                                        <button onClick={() => setIsEditProfileModalOpen(true)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <PencilIcon className="w-4 h-4" /> Edit
                                        </button>
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
                                            <dd className="mt-1 text-md text-gray-900">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</dd>
                                        </div>
                                    </dl>
                                </InfoCard>

                                <InfoCard title="Security & Account Actions">
                                <div className="space-y-4">
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
                                                    alert('To install this app on iOS: 1) Tap the Share button in Safari, 2) Choose "Add to Home Screen".');
                                                } else {
                                                    alert('Install prompt is not available yet. Try visiting a few pages and then return here, or use your browser menu: Install App/Add to Home Screen.');
                                                }
                                            }
                                        }}
                                        className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-blue-600"
                                    >
                                        <span>Install App on this Device</span>
                                        <ArrowDownTrayIcon className="w-5 h-5"/>
                                    </button>
                                    {/* Install guidance note */}
                                    <p className="text-xs text-gray-500 px-3">
                                        {isStandalone ? (
                                            <span>The app is already installed and running in standalone mode.</span>
                                        ) : isIOS ? (
                                            <span>On iPhone/iPad: Open this site in Safari, tap the Share button, then choose "Add to Home Screen" to install.</span>
                                        ) : (
                                            <span>On Android or desktop browsers: You should see an install prompt here when available, or use your browser menu (Install App/Add to Home Screen).</span>
                                        )}
                                    </p>
                                    <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full text-left p-3 rounded-md hover:bg-gray-100 flex justify-between items-center text-sm font-medium text-gray-700">
                                        <span>Change Password</span>
                                        <span>›</span>
                                    </button>
                                    <button 
                                        onClick={onLogout}
                                        className="w-full text-left p-3 rounded-md hover:bg-red-50 flex justify-between items-center text-sm font-medium text-red-600"
                                        >
                                        <span>Logout</span>
                                        <ArrowLeftOnRectangleIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                                </InfoCard>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
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