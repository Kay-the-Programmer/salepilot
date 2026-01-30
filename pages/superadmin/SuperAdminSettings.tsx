
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChatBubbleLeftRightIcon } from '../../components/icons';

interface SupportContactConfig {
    phone: string;
    message: string;
}

const SuperAdminSettings: React.FC = () => {
    const [config, setConfig] = useState<SupportContactConfig>({
        phone: '',
        message: ''
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
                setConfig(result);
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Superadmin Settings</h1>
                        <p className="text-gray-600 mt-1">Configure system-wide settings.</p>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Support Contact Configuration</h2>
                            <p className="text-sm text-gray-500">
                                This contact information will be shown to all store owners when they click "Contact Support".
                            </p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                WhatsApp Support Number
                            </label>
                            <input
                                type="text"
                                placeholder="+1 (555) 123-4567"
                                className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                value={config.phone}
                                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the phone number store owners should message for support.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Greeting Message
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Hi, I need help with my store..."
                                className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                                value={config.message}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The pre-filled message that appears when they open WhatsApp.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
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
