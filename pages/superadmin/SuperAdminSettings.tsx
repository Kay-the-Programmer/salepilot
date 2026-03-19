
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChatBubbleLeftRightIcon } from '../../components/icons';

interface SupportContactConfig {
    phone: string;
    message: string;
    phone_number_id: string;
    webhook_verify_token: string;
    access_token: string;
}

const SuperAdminSettings: React.FC = () => {
    const [config, setConfig] = useState<SupportContactConfig>({
        phone: '',
        message: '',
        phone_number_id: '',
        webhook_verify_token: `sb_${Math.random().toString(36).substr(2, 9)}`,
        access_token: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const result = await api.get<SupportContactConfig>('/whatsapp/support-contact');
            if (result) {
                setConfig({
                    phone: result.phone || '',
                    message: result.message || '',
                    phone_number_id: result.phone_number_id && result.phone_number_id !== 'system_placeholder' ? result.phone_number_id : '',
                    webhook_verify_token: result.webhook_verify_token && result.webhook_verify_token !== 'system' ? result.webhook_verify_token : `sb_${Math.random().toString(36).substr(2, 9)}`,
                    access_token: result.access_token && result.access_token !== 'system' ? result.access_token : ''
                });
            }
        } catch (error) {
            console.warn('Failed to load support contact config', error);
            // It's okay if it fails initially (404), we just start empty
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await api.put('/whatsapp/support-contact', config);
            setMessage({ text: 'Settings saved successfully', type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message || 'Failed to save settings', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-mesh-light dark:bg-slate-950 p-6 transition-colors duration-300 font-google">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Superadmin Settings</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">Configure system-wide settings.</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 border ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Support Contact Configuration</h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                This contact information will be shown to all store owners when they click "Contact Support".
                            </p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                WhatsApp Support Number
                            </label>
                            <input
                                type="text"
                                placeholder="+1 (555) 123-4567"
                                className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 shadow-sm"
                                value={config.phone}
                                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                Enter the phone number store owners should message for support.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Default Greeting Message
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Hi, I need help with my store..."
                                className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 shadow-sm"
                                value={config.message}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                The pre-filled message that appears when they open WhatsApp.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-6">
                            <h3 className="text-md font-medium text-gray-900 dark:text-white">Meta API Credentials</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Phone Number ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="From Meta Developer Portal"
                                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                        value={config.phone_number_id}
                                        onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                        Access Token
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="EAAG..."
                                        className="w-full rounded-lg border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                        value={config.access_token}
                                        onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-lg text-sm text-indigo-800 dark:text-indigo-200">
                                <p>Configure these settings in your Meta App Dashboard:</p>
                                <div className="mt-2 grid gap-2">
                                    <div className="flex justify-between">
                                        <span className="font-semibold">Callback URL:</span>
                                        <code className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 select-all">https://api.salepilot.com/api/whatsapp/webhook</code>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Verify Token:</span>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/30 select-all">{config.webhook_verify_token}</code>
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, webhook_verify_token: `sb_${Math.random().toString(36).substr(2, 9)}` }))}
                                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                                            >
                                                Regenerate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 disabled:opacity-50 transition-colors active:scale-95 transition-all duration-300"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminSettings;
