import React, { useState } from 'react';
import { StoreSettings } from '../../../types';
import { ReceiptPercentIcon, CreditCardIcon, TrashIcon, PlusIcon, BuildingStorefrontIcon } from '../../icons';
import SettingsCard from '../SettingsCard';

interface POSSettingsSectionProps {
    settings: StoreSettings;
    currentSettings: StoreSettings;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handlePaymentMethodChange: (type: 'paymentMethods' | 'supplierPaymentMethods', index: number, value: string) => void;
    addPaymentMethod: (type: 'paymentMethods' | 'supplierPaymentMethods', name: string, setName: React.Dispatch<React.SetStateAction<string>>) => void;
    removePaymentMethod: (type: 'paymentMethods' | 'supplierPaymentMethods', id: string) => void;
}

const POSSettingsSection: React.FC<POSSettingsSectionProps> = ({
    settings,
    currentSettings,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    handleChange,
    handlePaymentMethodChange,
    addPaymentMethod,
    removePaymentMethod
}) => {
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newSupplierPaymentMethod, setNewSupplierPaymentMethod] = useState('');

    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white hover:bg-slate-50/50 focus:bg-white";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 mb-2";

    return (
        <SettingsCard
            title="POS & Receipts"
            description="Customize Point of Sale behavior, payment methods, and receipt formatting."
            icon={<ReceiptPercentIcon />}
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            badge="Checkout"
        >
            {isEditing ? (
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
                                        placeholder="Enter new supplier payment method"
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
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-500 mb-2">Receipt Footer</h4>
                        <p className="text-slate-900 italic">"{settings.receiptMessage || 'No footer message set'}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <CreditCardIcon className="w-4 h-4 text-slate-400" />
                                Customer Payment Methods
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(settings.paymentMethods || []).map(pm => (
                                    <span key={pm.id} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm">
                                        {pm.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <BuildingStorefrontIcon className="w-4 h-4 text-slate-400" />
                                Supplier Payment Methods
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {(settings.supplierPaymentMethods || []).map(pm => (
                                    <span key={pm.id} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg shadow-sm">
                                        {pm.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SettingsCard>
    );
};

export default POSSettingsSection;
