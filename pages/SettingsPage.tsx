import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import PencilIcon from '../components/icons/PencilIcon';
import BuildingStorefrontIcon from '../components/icons/BuildingStorefrontIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import CogIcon from '../components/icons/CogIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import TagIcon from '../components/icons/TagIcon';
import ChartBarIcon from '../components/icons/ChartBarIcon';
import BellAlertIcon from '../components/icons/BellAlertIcon';

interface SettingsPageProps {
    settings: StoreSettings;
    onSave: (settings: StoreSettings) => void;
}

interface SettingsCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    children: React.ReactNode;
    badge?: string;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
    title,
    description,
    icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    children,
    badge
}) => {
    return (
        <div className={`relative bg-white rounded-2xl border transition-all duration-500 ${isEditing
            ? 'border-blue-200 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/10'
            : 'border-slate-200 shadow-sm hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5'
            }`}>
            {/* Card Header */}
            <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className={`relative flex-shrink-0 rounded-xl p-3 transition-all duration-500 ${isEditing
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                            {React.cloneElement(icon as React.ReactElement<{ className: string }>, { className: "w-5 h-5" })}
                            {isEditing && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                                {badge && !isEditing && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100">
                                        {badge}
                                    </span>
                                )}
                                {isEditing && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold animate-pulse bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-200">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{description}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={onEdit}
                            type="button"
                            className="group relative inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-b from-white to-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:ring-blue-200 hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                            aria-label={`Edit ${title}`}
                        >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
                            <PencilIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors relative z-10" />
                            <span className="relative z-10">Edit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Card Content */}
            <div className={`px-6 transition-all duration-500 ${isEditing
                ? 'pb-6 pt-0'
                : 'pb-6 pt-1'
                }`}>
                <div className={`transition-all duration-500 ${isEditing ? 'opacity-100 scale-100' : 'opacity-100 scale-100'}`}>
                    {children}
                </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-4 rounded-b-2xl">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={onCancel}
                            type="button"
                            className="order-2 sm:order-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200 active:scale-95"
                        >
                            Discard
                        </button>
                        <button
                            onClick={onSave}
                            type="button"
                            className="order-1 sm:order-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all duration-200 active:scale-95 group"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Save Changes
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave }) => {
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [currentSettings, setCurrentSettings] = useState(settings);
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newSupplierPaymentMethod, setNewSupplierPaymentMethod] = useState('');

    // Enhanced input styles
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white hover:bg-slate-50/50 focus:bg-white";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 mb-2";

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

    const DetailItem: React.FC<{
        label: string;
        value: React.ReactNode;
        icon?: React.ReactNode;
        highlight?: boolean;
    }> = ({ label, value, icon, highlight = false }) => (
        <div className="py-3 border-b border-slate-100 last:border-b-0">
            <div className="flex items-start gap-4">
                {icon && (
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                            {icon}
                        </div>
                    </div>
                )}
                <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
                    <div className={`${highlight ? 'font-bold' : 'font-semibold'} text-slate-900 ${typeof value === 'string' ? 'text-base' : ''}`}>
                        {value}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInput = (label: string, name: keyof StoreSettings, type = 'text', props = {}) => (
        <div className="space-y-2">
            <label htmlFor={name} className={labelClasses}>
                <span className="flex items-center gap-2">
                    {label}
                </span>
            </label>
            <input
                type={type}
                name={name}
                id={name}
                value={(currentSettings as any)[name] || ''}
                onChange={handleChange}
                className={inputFieldClasses}
                {...props}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                                <CogIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                                    Store Settings
                                </h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    Configure your store preferences and business rules
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingSection && (
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-blue-700">
                                        Editing {editingSection.replace(/^\w/, c => c.toUpperCase())}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
                <div className="space-y-6">
                    {/* Store Details Section */}
                    <SettingsCard
                        title="Store Details"
                        description="Configure your store's public information displayed on receipts and invoices."
                        icon={<BuildingStorefrontIcon />}
                        isEditing={editingSection === 'store'}
                        onEdit={() => setEditingSection('store')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        badge="Public Info"
                    >
                        {editingSection === 'store' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {renderInput("Store Name", "name", "text", {
                                        required: true,
                                        placeholder: "Your Store Name"
                                    })}
                                    {renderInput("Contact Email", "email", "email", {
                                        placeholder: "contact@example.com",
                                        readOnly: true,
                                        className: `${inputFieldClasses} bg-slate-100 text-slate-500 cursor-not-allowed`
                                    })}
                                    {renderInput("Website", "website", "url", {
                                        placeholder: "https://example.com"
                                    })}

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div>
                                                <label htmlFor="isOnlineStoreEnabled" className="text-sm font-semibold text-slate-900 cursor-pointer block">
                                                    Online Store Status
                                                </label>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {currentSettings.isOnlineStoreEnabled !== false
                                                        ? 'Your store is currently visible to customers'
                                                        : 'Your store is hidden (maintenance mode)'}
                                                </p>
                                            </div>

                                            <label className="relative cursor-pointer">
                                                <input
                                                    id="isOnlineStoreEnabled"
                                                    name="isOnlineStoreEnabled"
                                                    type="checkbox"
                                                    checked={currentSettings.isOnlineStoreEnabled !== false}
                                                    onChange={(e) => setCurrentSettings(prev => ({ ...prev, isOnlineStoreEnabled: e.target.checked }))}
                                                    className="peer sr-only"
                                                />
                                                <div className="w-12 h-6 bg-slate-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500 transition-colors duration-300 relative">
                                                    <div className="absolute w-5 h-5 bg-white rounded-full left-1 top-0.5 peer-checked:left-7 transition-all duration-300 shadow-sm"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {renderInput("Phone Number", "phone", "tel", {
                                        placeholder: "+1 (555) 123-4567"
                                    })}
                                    <div className="space-y-2">
                                        <label htmlFor="address" className={labelClasses}>Address</label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            value={currentSettings.address || ''}
                                            onChange={handleChange}
                                            rows={3}
                                            className={inputFieldClasses}
                                            placeholder="123 Main Street, City, State 12345"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Store Name"
                                        value={settings.name}
                                        icon={<BuildingStorefrontIcon className="w-4 h-4 text-slate-500" />}
                                        highlight={true}
                                    />
                                    <DetailItem
                                        label="Contact Email"
                                        value={settings.email || 'Not set'}
                                        icon={<EnvelopeIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Website"
                                        value={
                                            settings.website ? (
                                                <a
                                                    href={settings.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 inline-flex items-center gap-1"
                                                >
                                                    {settings.website}
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            ) : 'Not set'
                                        }
                                        icon={<GlobeAltIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Online Store Status"
                                        value={
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${settings.isOnlineStoreEnabled !== false
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${settings.isOnlineStoreEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                    {settings.isOnlineStoreEnabled !== false ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                        }
                                        icon={<BuildingStorefrontIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Phone Number"
                                        value={settings.phone || 'Not set'}
                                        icon={<PhoneIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Address"
                                        value={
                                            <div className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                                                {settings.address || 'Not set'}
                                            </div>
                                        }
                                        icon={<MapPinIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                            </div>
                        )}
                    </SettingsCard>

                    {/* Financial Settings */}
                    <SettingsCard
                        title="Financial Settings"
                        description="Configure tax rates, currency, and payment settings for transactions."
                        icon={<BanknotesIcon />}
                        isEditing={editingSection === 'financial'}
                        onEdit={() => setEditingSection('financial')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        badge="Money"
                    >
                        {editingSection === 'financial' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="taxRate" className={labelClasses}>Tax Rate (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="taxRate"
                                            id="taxRate"
                                            value={currentSettings.taxRate}
                                            onChange={handleChange}
                                            className={inputFieldClasses}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                            %
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <CreditCardIcon className="w-4 h-4" />
                                        Currency Settings
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="currency.symbol" className="text-sm font-medium text-slate-700">Symbol</label>
                                            <input
                                                type="text"
                                                name="currency.symbol"
                                                id="currency.symbol"
                                                value={currentSettings.currency.symbol}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                                placeholder="K"
                                                maxLength={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="currency.code" className="text-sm font-medium text-slate-700">Code</label>
                                            <input
                                                type="text"
                                                name="currency.code"
                                                id="currency.code"
                                                value={currentSettings.currency.code}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                                placeholder="ZMW"
                                                maxLength={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="currency.position" className="text-sm font-medium text-slate-700">Position</label>
                                            <select
                                                name="currency.position"
                                                id="currency.position"
                                                value={currentSettings.currency.position}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                            >
                                                <option value="before">Before amount ($100)</option>
                                                <option value="after">After amount (100$)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Tax Rate"
                                        value={
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-bold rounded-lg">
                                                    {settings.taxRate}%
                                                </div>
                                                <span className="text-sm text-slate-500">applied to all sales</span>
                                            </div>
                                        }
                                        icon={<ChartBarIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Currency"
                                        value={
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                                                    <span className="font-bold text-slate-900 text-lg">{settings.currency.symbol}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{settings.currency.code}</div>
                                                    <div className="text-sm text-slate-500">
                                                        {settings.currency.position === 'before' ? 'Before amount' : 'After amount'}
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        icon={<CurrencyDollarIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                            </div>
                        )}
                    </SettingsCard>

                    {/* POS & Receipts */}
                    <SettingsCard
                        title="POS & Receipts"
                        description="Customize Point of Sale behavior, payment methods, and receipt formatting."
                        icon={<ReceiptPercentIcon />}
                        isEditing={editingSection === 'pos'}
                        onEdit={() => setEditingSection('pos')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        badge="Checkout"
                    >
                        {editingSection === 'pos' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="receiptMessage" className={labelClasses}>Receipt Footer Message</label>
                                    <textarea
                                        id="receiptMessage"
                                        name="receiptMessage"
                                        value={currentSettings.receiptMessage}
                                        onChange={handleChange}
                                        rows={3}
                                        className={inputFieldClasses}
                                        placeholder="Thank you for shopping with us! Visit again soon."
                                    />
                                </div>

                                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
                                    <div className="flex items-center">
                                        <div className="relative">
                                            <input
                                                id="enableStoreCredit"
                                                name="enableStoreCredit"
                                                type="checkbox"
                                                checked={currentSettings.enableStoreCredit}
                                                onChange={handleChange}
                                                className="peer sr-only"
                                            />
                                            <div className="w-12 h-6 bg-slate-300 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500 transition-colors duration-300 relative">
                                                <div className="absolute w-5 h-5 bg-white rounded-full left-1 top-0.5 peer-checked:left-7 transition-all duration-300"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="enableStoreCredit" className="text-sm font-semibold text-slate-900 cursor-pointer">
                                            Enable Store Credit System
                                        </label>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Allow customers to use store credit for purchases and manage credit balances
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Methods */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <CreditCardIcon className="w-4 h-4" />
                                            Customer Payment Methods
                                        </h4>
                                        <div className="space-y-3">
                                            {(currentSettings.paymentMethods || []).map((pm, index) => (
                                                <div key={pm.id} className="flex items-center gap-3 group">
                                                    <div className="flex-grow">
                                                        <input
                                                            type="text"
                                                            value={pm.name}
                                                            onChange={(e) => handlePaymentMethodChange('paymentMethods', index, e.target.value)}
                                                            className={inputFieldClasses}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePaymentMethod('paymentMethods', pm.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-all duration-200 group-hover:opacity-100"
                                                        aria-label={`Remove ${pm.name}`}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={newPaymentMethod}
                                                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                                                    placeholder="Enter new payment method name"
                                                    className={inputFieldClasses}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => addPaymentMethod('paymentMethods', newPaymentMethod, setNewPaymentMethod)}
                                                    className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    disabled={!newPaymentMethod.trim()}
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-slate-200">
                                        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <BuildingStorefrontIcon className="w-4 h-4" />
                                            Supplier Payment Methods
                                        </h4>
                                        <div className="space-y-3">
                                            {(currentSettings.supplierPaymentMethods || []).map((pm, index) => (
                                                <div key={pm.id} className="flex items-center gap-3 group">
                                                    <div className="flex-grow">
                                                        <input
                                                            type="text"
                                                            value={pm.name}
                                                            onChange={(e) => handlePaymentMethodChange('supplierPaymentMethods', index, e.target.value)}
                                                            className={inputFieldClasses}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePaymentMethod('supplierPaymentMethods', pm.id)}
                                                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition-all duration-200 group-hover:opacity-100"
                                                        aria-label={`Remove ${pm.name}`}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={newSupplierPaymentMethod}
                                                    onChange={(e) => setNewSupplierPaymentMethod(e.target.value)}
                                                    placeholder="Enter supplier payment method"
                                                    className={inputFieldClasses}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => addPaymentMethod('supplierPaymentMethods', newSupplierPaymentMethod, setNewSupplierPaymentMethod)}
                                                    className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    disabled={!newSupplierPaymentMethod.trim()}
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Receipt Message"
                                        value={
                                            <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                                {settings.receiptMessage || 'No custom message set'}
                                            </div>
                                        }
                                        icon={<ReceiptPercentIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Store Credit System"
                                        value={
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${settings.enableStoreCredit
                                                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                    {settings.enableStoreCredit ? 'Enabled' : 'Disabled'}
                                                </span>
                                                {settings.enableStoreCredit && (
                                                    <span className="text-xs text-slate-500">Customers can use credit</span>
                                                )}
                                            </div>
                                        }
                                        icon={<CreditCardIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <DetailItem
                                        label="Customer Payments"
                                        value={
                                            (settings.paymentMethods || []).length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(settings.paymentMethods || []).map((pm) => (
                                                        <span key={pm.id} className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                                                            {pm.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No payment methods configured</span>
                                            )
                                        }
                                        icon={<CreditCardIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                    <DetailItem
                                        label="Supplier Payments"
                                        value={
                                            (settings.supplierPaymentMethods || []).length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {(settings.supplierPaymentMethods || []).map((pm) => (
                                                        <span key={pm.id} className="px-3 py-2 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-200">
                                                            {pm.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No supplier methods configured</span>
                                            )
                                        }
                                        icon={<BanknotesIcon className="w-4 h-4 text-slate-500" />}
                                    />
                                </div>
                            </div>
                        )}
                    </SettingsCard>

                    {/* Inventory Settings */}
                    <SettingsCard
                        title="Inventory Settings"
                        description="Configure stock alerts, SKU formatting, and inventory management rules."
                        icon={<ArchiveBoxIcon />}
                        isEditing={editingSection === 'inventory'}
                        onEdit={() => setEditingSection('inventory')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        badge="Stock"
                    >
                        {editingSection === 'inventory' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="lowStockThreshold" className={labelClasses}>Low Stock Threshold</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="lowStockThreshold"
                                            id="lowStockThreshold"
                                            value={currentSettings.lowStockThreshold}
                                            onChange={handleChange}
                                            className={inputFieldClasses}
                                            placeholder="10"
                                            min="0"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                            units
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Products with stock at or below this level will be marked as low stock
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="skuPrefix" className={labelClasses}>SKU Prefix</label>
                                    <input
                                        type="text"
                                        name="skuPrefix"
                                        id="skuPrefix"
                                        value={currentSettings.skuPrefix || ''}
                                        onChange={handleChange}
                                        className={inputFieldClasses}
                                        placeholder="SP-"
                                        maxLength={10}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        This prefix will be automatically added to new product SKUs
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <DetailItem
                                    label="Low Stock Alert"
                                    value={
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                                <div className="text-2xl font-bold text-amber-700">{settings.lowStockThreshold}</div>
                                                <div className="text-xs text-amber-600">units threshold</div>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                Products below this level will trigger low stock warnings
                                            </div>
                                        </div>
                                    }
                                    icon={<BellAlertIcon className="w-4 h-4 text-slate-500" />}
                                />
                                <DetailItem
                                    label="SKU Prefix"
                                    value={
                                        settings.skuPrefix ? (
                                            <div className="flex items-center gap-3">
                                                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                                                    <code className="text-lg font-bold text-slate-900 font-mono">
                                                        {settings.skuPrefix}
                                                    </code>
                                                    <div className="text-xs text-slate-500">prefix</div>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    Automatically added to new product SKUs
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">No prefix configured</span>
                                        )
                                    }
                                    icon={<TagIcon className="w-4 h-4 text-slate-500" />}
                                />
                            </div>
                        )}
                    </SettingsCard>

                    {/* Subscription & Plans */}
                    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                    <CreditCardIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Subscription & Billing</h3>
                                    <p className="text-sm text-slate-500">Manage your subscription plan and billing details</p>
                                </div>
                            </div>
                            <a
                                href="/subscription"
                                className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
                            >
                                Manage Subscription
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Add missing icon components
const EnvelopeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const GlobeAltIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const MapPinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default SettingsPage;
