
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChatBubbleLeftRightIcon } from '../../components/icons';
import { INPUT_CLASS } from '../../utils/ui';

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
    const [tokenConfigured, setTokenConfigured] = useState(false);

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
                setTokenConfigured(!!(result as any).access_token_set);
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

    const inputClass = `${INPUT_CLASS} shadow-sm`;

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest text-sp-green-dark">Platform</p>
                        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text">Superadmin Settings</h1>
                        <p className="text-brand-text-muted mt-1">Configure system-wide settings.</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-semibold ${message.type === 'success'
                        ? 'bg-success-muted text-success'
                        : 'bg-danger-muted text-danger'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-brand-border flex items-center gap-3">
                        <div className="w-11 h-11 bg-sp-green-soft text-sp-green-dark rounded-xl flex items-center justify-center shrink-0">
                            <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight text-brand-text">Support Contact Configuration</h2>
                            <p className="text-sm text-brand-text-muted">
                                This contact information will be shown to all store owners when they click "Contact Support".
                            </p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                WhatsApp Support Number
                            </label>
                            <input
                                type="text"
                                placeholder="+1 (555) 123-4567"
                                className={inputClass}
                                value={config.phone}
                                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                            />
                            <p className="text-xs text-brand-text-muted mt-1.5">
                                Enter the phone number store owners should message for support.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                Default Greeting Message
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Hi, I need help with my store..."
                                className={inputClass}
                                value={config.message}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                            />
                            <p className="text-xs text-brand-text-muted mt-1.5">
                                The pre-filled message that appears when they open WhatsApp.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-brand-border space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-text-muted">Meta API Credentials</h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                        Phone Number ID
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="From Meta Developer Portal"
                                        className={inputClass}
                                        value={config.phone_number_id}
                                        onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-brand-text mb-1.5">
                                        Access Token
                                    </label>
                                    <input
                                        type="password"
                                        placeholder={tokenConfigured ? '•••••••• (leave blank to keep)' : 'EAAG...'}
                                        className={inputClass}
                                        value={config.access_token}
                                        onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                                    />
                                    <p className="text-xs text-brand-text-muted mt-1.5">
                                        {tokenConfigured
                                            ? 'A token is securely stored. Leave blank to keep it, or enter a new one to replace.'
                                            : 'Stored securely and never shown again after saving.'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-sp-green-soft border border-sp-green/20 p-4 rounded-2xl text-sm text-sp-green-dark">
                                <p className="font-semibold">Configure these settings in your Meta App Dashboard:</p>
                                <div className="mt-3 grid gap-2">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="font-semibold">Callback URL:</span>
                                        <code className="bg-surface text-brand-text px-2 py-0.5 rounded-lg border border-brand-border select-all">https://api.salepilot.com/api/whatsapp/webhook</code>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <span className="font-semibold">Verify Token:</span>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-surface text-brand-text px-2 py-0.5 rounded-lg border border-brand-border select-all">{config.webhook_verify_token}</code>
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, webhook_verify_token: `sb_${Math.random().toString(36).substr(2, 9)}` }))}
                                                className="text-xs font-semibold text-sp-green-dark hover:underline"
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
                                className="px-5 py-2.5 bg-sp-green text-white text-sm font-bold rounded-xl shadow-sm hover:bg-sp-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sp-green disabled:opacity-50 transition-all active:scale-95"
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
