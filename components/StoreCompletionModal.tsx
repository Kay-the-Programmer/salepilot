import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';

interface StoreCompletionModalProps {
    isOpen: boolean;
    onSave: (address: string, phone: string) => Promise<void>;
    initialSettings: StoreSettings | null;
}

const StoreCompletionModal: React.FC<StoreCompletionModalProps> = ({ isOpen, onSave, initialSettings }) => {
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialSettings) {
            setAddress(initialSettings.address || '');
            setPhone(initialSettings.phone || '');
        }
    }, [initialSettings]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!address.trim() || !phone.trim()) {
            setError('Both Address and Phone Number are required.');
            return;
        }

        setIsLoading(true);
        try {
            await onSave(address, phone);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity">
            <div className="liquid-glass-card rounded-[2rem] w-full max-w-lg transform transition-all scale-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
                    <h2 className="text-xl font-bold text-white">Complete Your Store Registration</h2>
                    <p className="text-blue-100 mt-1 text-sm">
                        Almost there! We just need a few more details to get your store ready.
                    </p>
                </div>

                <div className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start">
                                <span className="mr-2">⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="modal-phone" className="block text-sm font-semibold text-gray-700">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="modal-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                placeholder="+1 (555) 123-4567"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="modal-address" className="block text-sm font-semibold text-gray-700">
                                Shop Address <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="modal-address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                                placeholder="123 Main St, City, State, Zip"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 transition-all duration-300"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                        Saving Details...
                                    </>
                                ) : (
                                    'Save & Continue'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StoreCompletionModal;
