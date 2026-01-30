
import { useState, useEffect } from 'react';
import { StoreSettings, WhatsAppConfig } from '../types';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { RefreshIcon, CheckCircleIcon } from '../components/icons';

interface WhatsAppSettingsPageProps {
    storeSettings: StoreSettings | null;
    showSnackbar: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function WhatsAppSettingsPage({ storeSettings, showSnackbar }: WhatsAppSettingsPageProps) {
    const [config, setConfig] = useState<WhatsAppConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const result = await api.get<WhatsAppConfig>('/whatsapp/config');
            setConfig(result || {});
        } catch (error) {
            console.error(error);
            // If 404, it might mean no config yet, which is fine
            setConfig({
                store_id: '',
                phone_number_id: '',
                webhook_verify_token: `sb_${Math.random().toString(36).substr(2, 9)}`,
                is_enabled: false,
                auto_reply_enabled: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true);
        try {
            await api.put('/whatsapp/config', config);
            showSnackbar('WhatsApp configuration saved', 'success');
        } catch (error: any) {
            showSnackbar(error.message || 'Failed to save config', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">WhatsApp Integration Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                {/* Connection Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">Integration Status</h3>
                        <p className={`text-sm ${config?.is_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {config?.is_enabled ? 'Active & Connected' : 'Inactive'}
                        </p>
                    </div>
                    <button
                        onClick={() => setConfig(prev => prev ? ({ ...prev, is_enabled: !prev.is_enabled }) : null)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config?.is_enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config?.is_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* API Credentials */}
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">Meta API Credentials</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                                value={config?.phone_number_id || ''}
                                onChange={e => setConfig(prev => prev ? ({ ...prev, phone_number_id: e.target.value }) : null)}
                                placeholder="From Meta Developer Portal"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Business Account ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                                value={config?.business_account_id || ''}
                                onChange={e => setConfig(prev => prev ? ({ ...prev, business_account_id: e.target.value }) : null)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Phone Number (for Support)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                            value={config?.display_phone_number || ''}
                            onChange={e => setConfig(prev => prev ? ({ ...prev, display_phone_number: e.target.value }) : null)}
                            placeholder="+1 (555) 123-4567"
                        />
                        <p className="mt-1 text-xs text-gray-500">This number will be shown to store owners for support.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Access Token (Need 'messages' permission)</label>
                        <input
                            type="password"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                            value={config?.access_token || ''} // Usually we wouldn't show the token back, separate logic needed for "change token"
                            onChange={e => setConfig(prev => prev ? ({ ...prev, access_token: e.target.value }) : null)}
                            placeholder="EAAG..."
                        />
                        <p className="mt-1 text-xs text-gray-500">System generated permanent token recommended.</p>
                    </div>
                </div>

                {/* Webhook Config */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">Webhook Configuration</h2>
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p>Configure these settings in your Meta App Dashboard:</p>
                        <div className="mt-2 grid gap-2">
                            <div className="flex justify-between">
                                <span className="font-semibold">Callback URL:</span>
                                <code className="bg-white px-2 py-0.5 rounded border border-blue-200 select-all">https://api.salepilot.com/api/whatsapp/webhook</code>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Verify Token:</span>
                                <div className="flex items-center gap-2">
                                    <code className="bg-white px-2 py-0.5 rounded border border-blue-200 select-all">{config?.webhook_verify_token}</code>
                                    <button onClick={() => setConfig(prev => prev ? ({ ...prev, webhook_verify_token: `sb_${Math.random().toString(36).substr(2, 9)}` }) : null)} className="text-xs text-blue-600 underline">Regenerate</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Settings */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900">AI Auto-Reply</h2>
                        <button
                            onClick={() => setConfig(prev => prev ? ({ ...prev, auto_reply_enabled: !prev.auto_reply_enabled }) : null)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${config?.auto_reply_enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config?.auto_reply_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        When enabled, SalePilot AI will attempt to answer customer queries automatically using store context.
                    </p>
                    {config?.auto_reply_enabled && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Away Message (Outside Business Hours)</label>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                                rows={3}
                                value={config?.away_message || ''}
                                onChange={e => setConfig(prev => prev ? ({ ...prev, away_message: e.target.value }) : null)}
                                placeholder="Thanks for contacting us. We are currently closed..."
                            />
                        </div>
                    )}
                </div>

                <div className="pt-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>

            </div>
        </div>
    );
}
