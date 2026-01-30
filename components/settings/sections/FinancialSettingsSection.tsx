import React from 'react';
import { StoreSettings } from '../../../types';
import { BanknotesIcon, ChartBarIcon, CreditCardIcon, CurrencyDollarIcon } from '../../icons';
import SettingsCard from '../SettingsCard';
import DetailItem from '../DetailItem';

interface FinancialSettingsSectionProps {
    settings: StoreSettings;
    currentSettings: StoreSettings;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const FinancialSettingsSection: React.FC<FinancialSettingsSectionProps> = ({
    settings,
    currentSettings,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    handleChange
}) => {
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white hover:bg-slate-50/50 focus:bg-white";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 mb-2";

    return (
        <SettingsCard
            title="Financial Settings"
            description="Configure tax rates, currency, and payment settings for transactions."
            icon={<BanknotesIcon />}
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            badge="Money"
        >
            {isEditing ? (
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
    );
};

export default FinancialSettingsSection;
