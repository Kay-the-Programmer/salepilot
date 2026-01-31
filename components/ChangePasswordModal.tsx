import React, { useState, useEffect } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (passwordData: { currentPassword: string, newPassword: string }) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSave }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All password fields are required.');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ currentPassword, newPassword });
            onClose(); // Close on success
        } catch (err: any) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-lg border-t dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b dark:border-slate-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Change Password</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-400"><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                        {error && (
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-900/50">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <InputField
                            label="Current Password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                        />
                        <InputField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Min. 8 characters"
                        />
                        <InputField
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter new password"
                        />
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3 border-t dark:border-slate-800">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSaving}
                            isLoading={isSaving}
                            loadingText="Saving..."
                            className="flex-1 sm:flex-none"
                        >
                            Save Password
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
