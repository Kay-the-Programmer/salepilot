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
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';

interface SettingsPageProps {
    settings: StoreSettings;
    onSave: (settings: StoreSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave }) => {
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [activeCategory, setActiveCategory] = useState<SettingsCategory>('store');
    const [showMobileDetail, setShowMobileDetail] = useState(false);

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

    const handleCategorySelect = (cat: SettingsCategory) => {
        setActiveCategory(cat);
        setEditingSection(null);
        setShowMobileDetail(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper for active category title
    const getCategoryTitle = () => {
        const titles: Record<string, string> = {
            'store': 'Store Details',
            'financial': 'Financials',
            'pos': 'POS Settings',
            'inventory': 'Inventory',
            'verification': 'Verification',
            'billing': 'Plans & Billing'
        };
        return titles[activeCategory] || 'Settings';
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google">
            {/* Header */}
            <header className={`sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-4">
                        {/* Mobile Back Button (only shows when in detail view on small screens) */}
                        <button
                            onClick={() => setShowMobileDetail(false)}
                            className="mr-2 -ml-2 px-1 py-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg md:hidden flex items-center transition-colors active:scale-95"
                            aria-label="Back to Settings"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                            <span className="text-[17px] font-medium tracking-tight ml-0.5">Settings</span>
                        </button>

                        <div className="hidden md:flex p-2 bg-slate-200 dark:bg-slate-800 rounded-lg shadow-sm border border-slate-300/50 dark:border-white/10">
                            <CogIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </div>
                        <h1 className="text-[17px] md:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                            {/* On mobile detail view, show category title. On desktop, just show 'Settings' */}
                            <span className="md:hidden">{getCategoryTitle()}</span>
                            <span className="hidden md:inline">Settings</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {editingSection && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                    Editing {editingSection.replace(/^\w/, c => c.toUpperCase())}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Header for Master View (Shows Large Title) */}
            <div className={`md:hidden px-4 md:px-0 pt-8 pb-3 ${showMobileDetail ? 'hidden' : 'block'}`}>
                <h1 className="text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">
                    Settings
                </h1>
            </div>

            <main className={`max-w-6xl mx-auto md:px-6 md:py-8 ${showMobileDetail ? 'px-0 py-0' : 'px-4 py-4'}`}>
                <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                    {/* Sidebar Container */}
                    <aside className={`w-full md:w-72 lg:w-80 shrink-0 transition-opacity duration-300 ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
                        <div className="md:sticky md:top-24">
                            <SettingsSidebar
                                activeCategory={activeCategory}
                                onCategoryChange={handleCategorySelect}
                            />
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className={`flex-1 min-w-0 transition-opacity duration-300 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
                        <div className="md:bg-transparent min-h-[600px]">
                            {/* Hide the category title if we are on mobile, because it's in the header */}
                            <div className="hidden md:block mb-8 px-4 md:px-0">
                                <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight">{getCategoryTitle()}</h2>
                            </div>

                            {activeCategory === 'store' && (
                                <div className="animate-fade-in">
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
                                <div className="animate-fade-in">
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
                                <div className="animate-fade-in">
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
                                <div className="animate-fade-in">
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
                                <div className="animate-fade-in px-4 md:px-0 pb-8">
                                    <SettingsCard
                                        title="Business Verification"
                                        description="Upload business documents to get your store verified."
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
                                <div className="animate-fade-in px-4 md:px-0 pb-8 space-y-6">
                                    <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                                                <CreditCardIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">Subscription & Billing</h3>
                                                <p className="text-[13px] text-slate-500 dark:text-gray-400 mt-0.5">Manage your plan and payment methods.</p>
                                            </div>
                                        </div>
                                        <a
                                            href="/subscription"
                                            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-95 text-center text-sm shadow-sm"
                                        >
                                            Manage Subscription
                                        </a>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-4 mb-2">Payment Overview</h4>
                                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 overflow-hidden">
                                            {[
                                                { label: 'Current Plan', value: 'Enterprise', icon: '✨' },
                                                { label: 'Next Billing', value: 'Feb 28, 2026', icon: '📅' },
                                                { label: 'Payment Method', value: 'Visa ending in 4242', icon: '💳' }
                                            ].map((item, idx) => (
                                                <div key={idx} className={`p-4 flex items-center justify-between ${idx !== 2 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                                                        <span className="text-[15px] font-medium text-slate-900 dark:text-white">{item.label}</span>
                                                    </div>
                                                    <p className="text-[15px] text-slate-500 dark:text-slate-400">{item.value}</p>
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
