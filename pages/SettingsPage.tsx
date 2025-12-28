

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

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, icon, isEditing, onEdit, onSave, onCancel, children }) => {
    return (
        <div className="bg-gray-50 shadow-md rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-gray-100 rounded-full p-3 mr-4">
                           {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold leading-6 text-gray-700">{title}</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
                        </div>
                    </div>
                     {!isEditing && (
                        <button onClick={onEdit} type="button" className="ml-3 inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <PencilIcon className="-ml-0.5 h-5 w-5 text-gray-400" />
                            Edit
                        </button>
                    )}
                </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                {children}
            </div>
            {isEditing && (
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onCancel} type="button" className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={onSave} type="button" className="inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                        Save Changes
                    </button>
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

    // Shared input styles for better visibility and accessibility
    const inputFieldClasses = "block w-full rounded-md bg-white border p-2 ring-1 ring-inset ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

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
        }
        else {
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


    const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <div className="py-2 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 col-span-2 sm:mt-0">{value}</dd>
        </div>
    );
    
    const renderInput = (label: string, name: keyof StoreSettings, type = 'text', props = {}) => (
         <div className="py-2 grid grid-cols-3 gap-4 items-center">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="col-span-2">
                 <input type={type} name={name} id={name} value={(currentSettings as any)[name]} onChange={handleChange} className={inputFieldClasses} {...props} />
            </div>
        </div>
    );

    return (
        <>


            <main className="flex-1 overflow-y-auto bg-gray-100 pb-10">
                <header className=" flex justify-center top-0 bg-gray-100 z-20 p-3 sm:p-4 mb-8 flex-1 overflow-y-auto bg-gray-100 pb-10">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-700 p-2">Application Settings</h1>
                </header>
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    <SettingsCard
                        title="Store Details"
                        description="Manage your store's public details for receipts and labels."
                        icon={<BuildingStorefrontIcon className="w-6 h-6 text-gray-500"/>}
                        isEditing={editingSection === 'store'}
                        onEdit={() => setEditingSection('store')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'store' ? (
                            <div className="space-y-2">
                                {renderInput("Store Name", "name", "text", { required: true })}
                                {renderInput("Address", "address")}
                                {renderInput("Phone Number", "phone")}
                                {renderInput("Contact Email", "email", "email")}
                                {renderInput("Website", "website", "url")}
                            </div>
                        ) : (
                             <dl className="divide-y divide-gray-100">
                                <DetailItem label="Store Name" value={settings.name} />
                                <DetailItem label="Address" value={settings.address} />
                                <DetailItem label="Phone Number" value={settings.phone} />
                                <DetailItem label="Contact Email" value={settings.email} />
                                <DetailItem label="Website" value={<a href={settings.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{settings.website}</a>} />
                            </dl>
                        )}
                    </SettingsCard>

                    <SettingsCard
                        title="Financials"
                        description="Configure tax rates and currency settings for your store."
                        icon={<BanknotesIcon className="w-6 h-6 text-gray-500"/>}
                        isEditing={editingSection === 'financial'}
                        onEdit={() => setEditingSection('financial')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'financial' ? (
                             <div className="space-y-4">
                                {renderInput("Tax Rate (%)", "taxRate", "number", { step: "0.01" })}
                                <div className="py-2 grid grid-cols-3 gap-4 items-start">
                                    <label className="block text-sm font-medium text-gray-700 pt-2">Currency</label>
                                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                         <input type="text" name="currency.symbol" value={currentSettings.currency.symbol} onChange={handleChange} placeholder="Symbol (e.g., $)" className={inputFieldClasses} />
                                         <input type="text" name="currency.code" value={currentSettings.currency.code} onChange={handleChange} placeholder="Code (e.g., USD)" className={inputFieldClasses} />
                                         <select name="currency.position" value={currentSettings.currency.position} onChange={handleChange} className={inputFieldClasses}>
                                            <option value="before">Before amount</option>
                                            <option value="after">After amount</option>
                                         </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <dl className="divide-y divide-gray-100">
                                <DetailItem label="Tax Rate" value={`${settings.taxRate}%`} />
                                <DetailItem label="Currency" value={`${settings.currency.symbol} (${settings.currency.code})`} />
                                <DetailItem label="Currency Position" value={settings.currency.position === 'before' ? 'Before amount' : 'After amount'} />
                            </dl>
                        )}
                    </SettingsCard>
                    
                     <SettingsCard
                        title="POS & Receipts"
                        description="Customize the Point of Sale and receipt behavior."
                        icon={<ReceiptPercentIcon className="w-6 h-6 text-gray-500"/>}
                        isEditing={editingSection === 'pos'}
                        onEdit={() => setEditingSection('pos')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                       {editingSection === 'pos' ? (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="receiptMessage" className="block text-sm font-medium text-gray-700">Receipt Footer Message</label>
                                    <div className="mt-1">
                                        <textarea id="receiptMessage" name="receiptMessage" value={currentSettings.receiptMessage} onChange={handleChange} rows={3} className={inputFieldClasses} />
                                    </div>
                                </div>
                                <div className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input id="enableStoreCredit" name="enableStoreCredit" type="checkbox" checked={currentSettings.enableStoreCredit} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label htmlFor="enableStoreCredit" className="font-medium text-gray-900">Enable store credit features</label>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-700">Customer Payment Methods</h4>
                                    {(currentSettings.paymentMethods || []).map((pm, index) => (
                                        <div key={pm.id} className="flex items-center gap-2">
                                            <input type="text" value={pm.name} onChange={(e) => handlePaymentMethodChange('paymentMethods', index, e.target.value)} className={inputFieldClasses} />
                                            <button type="button" onClick={() => removePaymentMethod('paymentMethods', pm.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={newPaymentMethod} onChange={(e) => setNewPaymentMethod(e.target.value)} placeholder="New method name" className={inputFieldClasses} />
                                        <button type="button" onClick={() => addPaymentMethod('paymentMethods', newPaymentMethod, setNewPaymentMethod)} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"><PlusIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-700">Supplier Payment Methods</h4>
                                    {(currentSettings.supplierPaymentMethods || []).map((pm, index) => (
                                        <div key={pm.id} className="flex items-center gap-2">
                                            <input type="text" value={pm.name} onChange={(e) => handlePaymentMethodChange('supplierPaymentMethods', index, e.target.value)} className={inputFieldClasses} />
                                            <button type="button" onClick={() => removePaymentMethod('supplierPaymentMethods', pm.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={newSupplierPaymentMethod} onChange={(e) => setNewSupplierPaymentMethod(e.target.value)} placeholder="New method name" className={inputFieldClasses} />
                                        <button type="button" onClick={() => addPaymentMethod('supplierPaymentMethods', newSupplierPaymentMethod, setNewSupplierPaymentMethod)} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"><PlusIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                       ) : (
                            <dl className="divide-y divide-gray-100">
                                <DetailItem label="Receipt Footer Message" value={<p className="whitespace-pre-wrap">{settings.receiptMessage}</p>} />
                                <DetailItem label="Store Credit" value={settings.enableStoreCredit ? 'Enabled' : 'Disabled'} />
                                <DetailItem label="Customer Payments" value={(settings.paymentMethods || []).map(pm => pm.name).join(', ') || 'None configured'} />
                                <DetailItem label="Supplier Payments" value={(settings.supplierPaymentMethods || []).map(pm => pm.name).join(', ') || 'None configured'} />
                            </dl>
                       )}
                    </SettingsCard>
                    
                    <SettingsCard
                        title="Inventory"
                        description="Set default behaviors for inventory and product management."
                        icon={<ArchiveBoxIcon className="w-6 h-6 text-gray-500"/>}
                        isEditing={editingSection === 'inventory'}
                        onEdit={() => setEditingSection('inventory')}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    >
                        {editingSection === 'inventory' ? (
                            <div className="space-y-2">
                                {renderInput("Default Low Stock Level", "lowStockThreshold", "number", { placeholder: 'e.g., 10' })}
                                {renderInput("SKU Prefix", "skuPrefix", "text", { placeholder: 'e.g., SP-' })}
                            </div>
                        ) : (
                             <dl className="divide-y divide-gray-100">
                                <DetailItem label="Default Low Stock Level" value={settings.lowStockThreshold} />
                                <DetailItem label="SKU Prefix" value={settings.skuPrefix} />
                            </dl>
                        )}
                    </SettingsCard>

                </div>
            </main>
        </>
    );
};

export default SettingsPage;