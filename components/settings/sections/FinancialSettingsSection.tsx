import React from 'react';
import { StoreSettings } from '../../../types';
import { CreditCardIcon, CurrencyDollarIcon, ChartBarIcon } from '../../icons';
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
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-brand-text shadow-sm ring-1 ring-inset ring-brand-border placeholder:text-brand-text-muted focus:ring-2 focus:ring-inset focus:ring-primary focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-surface hover:bg-surface-variant focus:bg-surface";
    const labelClasses = "block text-sm font-semibold leading-6 text-brand-text-muted mb-2";

    return (
        <SettingsCard
            title="Financial Settings"
            description="Configure tax rates, currency, and payment settings for transactions."
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
                                %
                            </div>
                        </div>
                    </div>

                    <h4 className="text-sm font-semibold text-brand-text mb-4 flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4" />
                        Currency Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="currency.symbol" className="text-sm font-medium text-brand-text-muted">Symbol</label>
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
                            <label htmlFor="currency.code" className="text-sm font-medium text-brand-text-muted">Code</label>
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
                            <label htmlFor="currency.position" className="text-sm font-medium text-brand-text-muted">Position</label>
                            <select
                                name="currency.position"
                                id="currency.position"
                                value={currentSettings.currency.position}
                                onChange={handleChange}
                                className={inputFieldClasses}
                            >
                                <option value="before" className="dark:bg-slate-800">Before amount ($100)</option>
                                <option value="after" className="dark:bg-slate-800">After amount (100$)</option>
                            </select>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <DetailItem
                        label="Tax Rate"
                        value={
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-[15px] font-semibold text-brand-text">{settings.taxRate}%</span>
                            </div>
                        }
                        icon={<ChartBarIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Currency"
                        value={
                            <div className="flex items-center justify-end gap-2 text-[15px]">
                                <span className="font-semibold text-brand-text">{settings.currency.symbol}</span>
                                <span className="text-brand-text-muted">({settings.currency.code})</span>
                            </div>
                        }
                        icon={<CurrencyDollarIcon className="w-5 h-5" />}
                    />
                </div>
            )
            }
        </SettingsCard >
    );
};

export default FinancialSettingsSection;
