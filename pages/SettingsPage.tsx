import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import Header from '../components/Header';
import PencilIcon from '../components/icons/PencilIcon';
import BuildingStorefrontIcon from '../components/icons/BuildingStorefrontIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import ReceiptPercentIcon from '../components/icons/ReceiptPercentIcon';
import ArchiveBoxIcon from '../components/icons/ArchiveBoxIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';

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
}

const SettingsCard: React.FC<SettingsCardProps> = ({
    title,
    description,
    icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    children
}) => {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 transition-all duration-300 ${isEditing ? 'ring-2 ring-blue-500/10 shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
            <div className="px-8 py-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-5">
                        <div className={`flex-shrink-0 rounded-xl p-3.5 transition-colors duration-300 ${isEditing ? 'bg-blue-600 text-white shadow-blue-500/30 shadow-lg' : 'bg-gray-50 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50'}`}>
                            {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
                                {isEditing && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 animate-fade-in">
                                        Editing
                                    </span>
                                )}
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{description}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={onEdit}
                            type="button"
                            className="group inline-flex items-center gap-x-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:text-blue-600 hover:ring-blue-200 transition-all duration-200"
                            aria-label={`Edit ${title}`}
                        >
                            <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            <span>Edit</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={`px-8 transition-all duration-300 ${isEditing ? 'bg-gray-50/30 py-8 border-t border-gray-100' : 'pb-8 pt-2'}`}>
                {children}
            </div>

            {isEditing && (
                <div className="bg-gray-50/50 px-8 py-5 border-t border-gray-100 rounded-b-2xl backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            onClick={onCancel}
                            type="button"
                            className="order-2 sm:order-1 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            type="button"
                            className="order-1 sm:order-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Save Changes
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

    // Enhanced input styles with better focus states and accessibility
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white";
    const labelClasses = "block text-sm font-medium leading-6 text-gray-700 mb-1.5";

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

    const DetailItem: React.FC<{ label: string; value: React.ReactNode; isLast?: boolean }> = ({ label, value, isLast = false }) => (
        <div className={`py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="text-sm font-medium text-gray-900 sm:col-span-2">{value}</dd>
        </div>
    );

    const renderInput = (label: string, name: keyof StoreSettings, type = 'text', props = {}) => (
        <div className="space-y-2">
            <label htmlFor={name} className={labelClasses}>{label}</label>
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
        <div className="min-h-screen bg-gray-50/50 md:min-h-0 md:h-full md:overflow-y-auto">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight sm:text-3xl">Application Settings</h1>
                            <p className="mt-1 text-sm text-gray-500">Manage and configure your store preferences</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="space-y-8">
                    <SettingsCard
                        title="Store Details"
                        description="Manage your store's public details for receipts and labels."
                        icon={<BuildingStorefrontIcon className="w-5 h-5" />}
                        isEditing={editingSection === 'store'}
                        onEdit={() => setEditingSection('store')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'store' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Store Name", "name", "text", { required: true })}
                                {renderInput("Phone Number", "phone", "tel")}
                                {renderInput("Contact Email", "email", "email")}
                                {renderInput("Website", "website", "url")}
                                <div className="md:col-span-2">
                                    {renderInput("Address", "address", "text")}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Store Name" value={settings.name} />
                                <DetailItem label="Phone Number" value={settings.phone || 'Not set'} />
                                <DetailItem label="Contact Email" value={settings.email || 'Not set'} />
                                <DetailItem label="Website" value={
                                    settings.website ? (
                                        <a
                                            href={settings.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
                                        >
                                            {settings.website}
                                        </a>
                                    ) : 'Not set'
                                } />
                                <div className="md:col-span-2">
                                    <DetailItem label="Address" value={settings.address || 'Not set'} />
                                </div>
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard
                        title="Financials"
                        description="Configure tax rates and currency settings for your store."
                        icon={<BanknotesIcon className="w-5 h-5" />}
                        isEditing={editingSection === 'financial'}
                        onEdit={() => setEditingSection('financial')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'financial' ? (
                            <div className="space-y-6">
                                {renderInput("Tax Rate (%)", "taxRate", "number", {
                                    step: "0.01",
                                    min: "0",
                                    max: "100"
                                })}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Currency Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="currency.symbol" className={labelClasses}>Symbol</label>
                                            <input
                                                type="text"
                                                name="currency.symbol"
                                                id="currency.symbol"
                                                value={currentSettings.currency.symbol}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                                placeholder="$"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="currency.code" className={labelClasses}>Code</label>
                                            <input
                                                type="text"
                                                name="currency.code"
                                                id="currency.code"
                                                value={currentSettings.currency.code}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                                placeholder="USD"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="currency.position" className={labelClasses}>Position</label>
                                            <select
                                                name="currency.position"
                                                id="currency.position"
                                                value={currentSettings.currency.position}
                                                onChange={handleChange}
                                                className={inputFieldClasses}
                                            >
                                                <option value="before">Before amount</option>
                                                <option value="after">After amount</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Tax Rate" value={`${settings.taxRate}%`} />
                                <DetailItem label="Currency Symbol" value={settings.currency.symbol} />
                                <DetailItem label="Currency Code" value={settings.currency.code} />
                                <DetailItem label="Position" value={
                                    <span className="inline-flex items-center gap-1.5">
                                        {settings.currency.position === 'before' ? (
                                            <>
                                                <span className="text-green-600">•</span>
                                                Before amount
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-blue-600">•</span>
                                                After amount
                                            </>
                                        )}
                                    </span>
                                } />
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard
                        title="POS & Receipts"
                        description="Customize the Point of Sale and receipt behavior."
                        icon={<ReceiptPercentIcon className="w-5 h-5" />}
                        isEditing={editingSection === 'pos'}
                        onEdit={() => setEditingSection('pos')}
                        onSave={handleSave}
                        onCancel={handleCancel}
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
                                        placeholder="Thank you for your business!"
                                    />
                                </div>

                                <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow hover:shadow-md">
                                    <div className="flex h-6 items-center">
                                        <input
                                            id="enableStoreCredit"
                                            name="enableStoreCredit"
                                            type="checkbox"
                                            checked={currentSettings.enableStoreCredit}
                                            onChange={handleChange}
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 transition-colors duration-200 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="enableStoreCredit" className="text-sm font-semibold text-gray-900 cursor-pointer">
                                            Enable store credit features
                                        </label>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Allow customers to use store credit for purchases
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-gray-900">Customer Payment Methods</h4>
                                    <div className="space-y-3">
                                        {(currentSettings.paymentMethods || []).map((pm, index) => (
                                            <div key={pm.id} className="flex items-center gap-2 group">
                                                <input
                                                    type="text"
                                                    value={pm.name}
                                                    onChange={(e) => handlePaymentMethodChange('paymentMethods', index, e.target.value)}
                                                    className={inputFieldClasses}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePaymentMethod('paymentMethods', pm.id)}
                                                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all duration-200"
                                                    aria-label={`Remove ${pm.name}`}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newPaymentMethod}
                                                onChange={(e) => setNewPaymentMethod(e.target.value)}
                                                placeholder="Add new payment method"
                                                className={inputFieldClasses}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addPaymentMethod('paymentMethods', newPaymentMethod, setNewPaymentMethod)}
                                                className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!newPaymentMethod.trim()}
                                            >
                                                <PlusIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t">
                                    <h4 className="text-sm font-semibold text-gray-900">Supplier Payment Methods</h4>
                                    <div className="space-y-3">
                                        {(currentSettings.supplierPaymentMethods || []).map((pm, index) => (
                                            <div key={pm.id} className="flex items-center gap-2 group">
                                                <input
                                                    type="text"
                                                    value={pm.name}
                                                    onChange={(e) => handlePaymentMethodChange('supplierPaymentMethods', index, e.target.value)}
                                                    className={inputFieldClasses}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePaymentMethod('supplierPaymentMethods', pm.id)}
                                                    className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all duration-200"
                                                    aria-label={`Remove ${pm.name}`}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newSupplierPaymentMethod}
                                                onChange={(e) => setNewSupplierPaymentMethod(e.target.value)}
                                                placeholder="Add new supplier payment method"
                                                className={inputFieldClasses}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addPaymentMethod('supplierPaymentMethods', newSupplierPaymentMethod, setNewSupplierPaymentMethod)}
                                                className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!newSupplierPaymentMethod.trim()}
                                            >
                                                <PlusIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <DetailItem label="Receipt Footer Message" value={
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {settings.receiptMessage || 'Not set'}
                                    </div>
                                } />
                                <DetailItem label="Store Credit" value={
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${settings.enableStoreCredit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {settings.enableStoreCredit ? 'Enabled' : 'Disabled'}
                                    </span>
                                } />
                                <DetailItem label="Customer Payment Methods" value={
                                    (settings.paymentMethods || []).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(settings.paymentMethods || []).map((pm, index) => (
                                                <span key={pm.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                                    {pm.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm">No methods configured</span>
                                    )
                                } />
                                <DetailItem label="Supplier Payment Methods" value={
                                    (settings.supplierPaymentMethods || []).length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(settings.supplierPaymentMethods || []).map((pm, index) => (
                                                <span key={pm.id} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                                                    {pm.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm">No methods configured</span>
                                    )
                                } />
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard
                        title="Inventory"
                        description="Set default behaviors for inventory and product management."
                        icon={<ArchiveBoxIcon className="w-5 h-5" />}
                        isEditing={editingSection === 'inventory'}
                        onEdit={() => setEditingSection('inventory')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'inventory' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Default Low Stock Level", "lowStockThreshold", "number", {
                                    placeholder: 'e.g., 10',
                                    min: "0"
                                })}
                                {renderInput("SKU Prefix", "skuPrefix", "text", {
                                    placeholder: 'e.g., SP-'
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Default Low Stock Level" value={
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold text-gray-900">{settings.lowStockThreshold}</span>
                                        <span className="text-sm text-gray-500">units</span>
                                    </div>
                                } />
                                <DetailItem label="SKU Prefix" value={
                                    settings.skuPrefix ? (
                                        <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                                            {settings.skuPrefix}
                                        </code>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Not set</span>
                                    )
                                } />
                            </div>
                        )}
                    </SettingsCard>
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;