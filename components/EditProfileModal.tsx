import React, { useState, useEffect } from 'react';
import { User } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import { InputField } from './ui/InputField';
import { Button } from './ui/Button';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: { name: string; email: string }) => Promise<void>;
    currentUser: User;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            await onSave({ name, email });
            // The parent component (ProfilePage) will close the modal on success
        } catch (err: any) {
            setError(err.message || 'Failed to save profile.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center animate-fade-in">
            <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900 w-full rounded-t-3xl sm: max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-lg border-t dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b dark:border-slate-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Edit Profile</h3>
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
                            label="Full Name"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Enter your full name"
                        />
                        <InputField
                            label="Email"
                            name="email"
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email address"
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
                            Save Changes
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

export default EditProfileModal;
