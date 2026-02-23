import React, { useState } from 'react';
import { StoreSettings } from '../../../types';
import { ReceiptPercentIcon, CreditCardIcon, TrashIcon, PlusIcon, BuildingStorefrontIcon } from '../../icons';
import SettingsCard from '../SettingsCard';
import DetailItem from '../DetailItem';

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

    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-800";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 mb-2";

    return (
        <SettingsCard
            title="POS & Receipts"
            description="Customize Point of Sale behavior, payment methods, and receipt formatting."
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

                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500 transition-colors duration-300 relative">
                                    <div className="liquid-glass-card rounded-[2rem] absolute w-5 h-5 dark:bg-slate-100 left-1 top-0.5 peer-checked:left-7 transition-all duration-300"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="enableStoreCredit" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer active:scale-95 transition-all duration-300">
                                Enable Store Credit System
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Allow customers to use store credit for purchases and manage credit balances
                            </p>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <CreditCardIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
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
                                            className="p-3 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 group-hover:opacity-100 active:scale-95 transition-all duration-300"
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
                                        className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-800 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-600 dark:hover:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                                        disabled={!newPaymentMethod.trim()}
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <BuildingStorefrontIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
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
                                            className="p-3 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 group-hover:opacity-100 active:scale-95 transition-all duration-300"
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
                                        className="px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-700 dark:to-slate-800 text-white font-semibold rounded-xl hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-600 dark:hover:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
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
                <div className="flex flex-col">
                    <DetailItem
                        label="Receipt Footer"
                        value={
                            <div className="text-[15px] italic text-slate-500 dark:text-slate-400 sm:text-right max-w-[250px] sm:max-w-none truncate">
                                "{settings.receiptMessage || 'No footer message set'}"
                            </div>
                        }
                        icon={<ReceiptPercentIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Customer Payment Methods"
                        value={
                            <div className="flex flex-wrap gap-1.5 sm:justify-end mt-1 sm:mt-0">
                                {(settings.paymentMethods || []).map(pm => (
                                    <span key={pm.id} className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800 rounded-md text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 shadow-sm">
                                        {pm.name}
                                    </span>
                                ))}
                            </div>
                        }
                        icon={<CreditCardIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Supplier Payment Methods"
                        value={
                            <div className="flex flex-wrap gap-1.5 sm:justify-end mt-1 sm:mt-0">
                                {(settings.supplierPaymentMethods || []).map(pm => (
                                    <span key={pm.id} className="px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800 rounded-md text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 shadow-sm">
                                        {pm.name}
                                    </span>
                                ))}
                            </div>
                        }
                        icon={<BuildingStorefrontIcon className="w-5 h-5" />}
                    />
                </div>
            )}
        </SettingsCard>
    );
};

export default POSSettingsSection;
