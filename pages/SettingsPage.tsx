import React, { useState, useEffect } from 'react';
import { StoreSettings, VerificationDocument } from '../types';
import { api } from '../services/api';
import CogIcon from '../components/icons/CogIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';

// Modular Components
import StoreDetailsSection from '../components/settings/sections/StoreDetailsSection';
import FinancialSettingsSection from '../components/settings/sections/FinancialSettingsSection';
import POSSettingsSection from '../components/settings/sections/POSSettingsSection';
import InventorySettingsSection from '../components/settings/sections/InventorySettingsSection';
import BusinessVerificationSection from '../components/settings/BusinessVerificationSection';
import SettingsCard from '../components/settings/SettingsCard';
import SettingsSidebar, { SettingsCategory } from '../components/settings/SettingsSidebar';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';

interface SettingsPageProps {
    settings: StoreSettings;
    onSave: (settings: StoreSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave }) => {
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('store');

    // Verification State
    const [verificationStatus, setVerificationStatus] = useState<{ isVerified: boolean; verificationDocuments: VerificationDocument[] } | null>(null);

    const fetchVerificationStatus = async () => {
        try {
            const res = await api.get<any>('/verification/status');
            setVerificationStatus(res);
        } catch (error) {
            console.error('Failed to fetch verification status', error);
        }
    };

    useEffect(() => {
        fetchVerificationStatus();
    }, []);

    useEffect(() => {
        setCurrentSettings(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name === 'currency.symbol' || name === 'currency.code' || name === 'currency.position') {
            const currencyField = name.split('.')[1];
            setCurrentSettings(prev => ({ ...prev, currency: { ...prev.currency, [currencyField]: value } }));
        } else if (name === 'enableStoreCredit') {
            setCurrentSettings(prev => ({ ...prev, enableStoreCredit: (e.target as HTMLInputElement).checked }));
        } else {
            setCurrentSettings(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
            }));
        }
    };

    const handleSave = () => {
        onSave(currentSettings);
        setEditingSection(null);
    };

    const handleCancel = () => {
        setCurrentSettings(settings);
        setEditingSection(null);
    };

    const handlePaymentMethodChange = (type: 'paymentMethods' | 'supplierPaymentMethods', index: number, value: string) => {
        setCurrentSettings(prev => {
            const methods = [...(prev[type] || [])];
            methods[index] = { ...methods[index], name: value };
            return { ...prev, [type]: methods };
        });
    };

    const addPaymentMethod = (type: 'paymentMethods' | 'supplierPaymentMethods', name: string, setName: React.Dispatch<React.SetStateAction<string>>) => {
        if (!name.trim()) return;
        setCurrentSettings(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), { id: `pm_${Date.now()}_${Math.random()}`, name: name.trim() }]
        }));
        setName('');
    };

    const removePaymentMethod = (type: 'paymentMethods' | 'supplierPaymentMethods', id: string) => {
        setCurrentSettings(prev => ({
            ...prev,
            [type]: (prev[type] || []).filter(pm => pm.id !== id)
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="liquid-glass-header sticky top-0 z-30 /80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                <CogIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-3xl">
                                    Store Settings
                                </h1>
                                <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
                                    Configure your store preferences and business rules
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingSection && (
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Editing {editingSection.replace(/^\w/, c => c.toUpperCase())}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <div className="sticky top-28">
                            <SettingsSidebar
                                activeCategory={activeCategory}
                                onCategoryChange={(cat) => {
                                    setActiveCategory(cat);
                                    setEditingSection(null);
                                }}
                            />
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-800 border border-slate-200/60 dark:border-white/5 overflow-hidden min-h-[600px]">
                            {activeCategory === 'store' && (
                                <div className="p-1">
                                    <StoreDetailsSection
                                        settings={settings}
                                        currentSettings={currentSettings}
                                        isEditing={editingSection === 'store'}
                                        onEdit={() => setEditingSection('store')}
                                        onSave={handleSave}
                                        onCancel={handleCancel}
                                        handleChange={handleChange}
                                        setCurrentSettings={setCurrentSettings}
                                    />
                                </div>
                            )}

                            {activeCategory === 'financial' && (
                                <div className="p-1">
                                    <FinancialSettingsSection
                                        settings={settings}
                                        currentSettings={currentSettings}
                                        isEditing={editingSection === 'financial'}
                                        onEdit={() => setEditingSection('financial')}
                                        onSave={handleSave}
                                        onCancel={handleCancel}
                                        handleChange={handleChange}
                                    />
                                </div>
                            )}

                            {activeCategory === 'pos' && (
                                <div className="p-1">
                                    <POSSettingsSection
                                        settings={settings}
                                        currentSettings={currentSettings}
                                        isEditing={editingSection === 'pos'}
                                        onEdit={() => setEditingSection('pos')}
                                        onSave={handleSave}
                                        onCancel={handleCancel}
                                        handleChange={handleChange}
                                        handlePaymentMethodChange={handlePaymentMethodChange}
                                        addPaymentMethod={addPaymentMethod}
                                        removePaymentMethod={removePaymentMethod}
                                    />
                                </div>
                            )}

                            {activeCategory === 'inventory' && (
                                <div className="p-1">
                                    <InventorySettingsSection
                                        settings={settings}
                                        currentSettings={currentSettings}
                                        isEditing={editingSection === 'inventory'}
                                        onEdit={() => setEditingSection('inventory')}
                                        onSave={handleSave}
                                        onCancel={handleCancel}
                                        handleChange={handleChange}
                                    />
                                </div>
                            )}

                            {activeCategory === 'verification' && (
                                <div className="p-1">
                                    <SettingsCard
                                        title="Business Verification"
                                        description="Upload business documents to get your store verified."
                                        icon={<ShieldCheckIcon className="w-6 h-6" />}
                                        isEditing={editingSection === 'verification'}
                                        onEdit={() => setEditingSection('verification')}
                                        onSave={() => setEditingSection(null)}
                                        onCancel={() => setEditingSection(null)}
                                        badge={verificationStatus?.isVerified ? "Verified" : "Unverified"}
                                    >
                                        <BusinessVerificationSection
                                            isEditing={editingSection === 'verification'}
                                            verificationStatus={verificationStatus}
                                            onUploadSuccess={fetchVerificationStatus}
                                        />
                                    </SettingsCard>
                                </div>
                            )}

                            {activeCategory === 'billing' && (
                                <div className="p-8">
                                    <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20">
                                        <div className="flex items-center gap-5">
                                            <div className="liquid-glass-card rounded-[2rem] p-4 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                                                <CreditCardIcon className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Subscription & Billing</h3>
                                                <p className="text-slate-500 dark:text-gray-400 mt-1">Manage your subscription plan, billing history, and payment methods.</p>
                                            </div>
                                        </div>
                                        <a
                                            href="/subscription"
                                            className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-2xl hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                                        >
                                            Manage Subscription
                                        </a>
                                    </div>

                                    <div className="mt-12">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Payment Overview</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {[
                                                { label: 'Current Plan', value: 'Enterprise', icon: '✨' },
                                                { label: 'Next Billing', value: 'Feb 28, 2026', icon: '📅' },
                                                { label: 'Payment Method', value: 'Visa ending in 4242', icon: '💳' }
                                            ].map((item, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                    <span className="text-2xl mb-3 block">{item.icon}</span>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-gray-400">{item.label}</p>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
