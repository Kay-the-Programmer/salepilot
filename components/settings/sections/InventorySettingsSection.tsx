import React from 'react';
import { StoreSettings } from '../../../types';
import { BellAlertIcon, TagIcon } from '../../icons';
import SettingsCard from '../SettingsCard';
import DetailItem from '../DetailItem';

interface InventorySettingsSectionProps {
    settings: StoreSettings;
    currentSettings: StoreSettings;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const InventorySettingsSection: React.FC<InventorySettingsSectionProps> = ({
    settings,
    currentSettings,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    handleChange
}) => {
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-800";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 mb-2";

    return (
        <SettingsCard
            title="Inventory Settings"
            description="Configure stock alerts, SKU formatting, and inventory management rules."
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            badge="Stock"
        >
            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">
                                units
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            This prefix will be automatically added to new product SKUs
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <DetailItem
                        label="Low Stock Alert"
                        value={
                            <span className="text-[17px] font-medium text-slate-900 dark:text-white">{settings.lowStockThreshold} Units</span>
                        }
                        icon={<BellAlertIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="SKU Prefix"
                        value={
                            settings.skuPrefix ? (
                                <span className="text-[17px] font-mono font-medium text-slate-900 dark:text-white uppercase tracking-wider">{settings.skuPrefix}</span>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">None</span>
                            )
                        }
                        icon={<TagIcon className="w-5 h-5" />}
                    />
                </div>
            )}
        </SettingsCard>
    );
};

export default InventorySettingsSection;
