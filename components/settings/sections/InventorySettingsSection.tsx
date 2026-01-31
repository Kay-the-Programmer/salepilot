import React from 'react';
import { StoreSettings } from '../../../types';
import { ArchiveBoxIcon, BellAlertIcon, TagIcon } from '../../icons';
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
            icon={<ArchiveBoxIcon />}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <DetailItem
                        label="Low Stock Alert"
                        value={
                            <div className="flex items-center gap-4">
                                <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/30 shadow-sm shrink-0">
                                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-500">{settings.lowStockThreshold}</div>
                                    <div className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-500/70">Units</div>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Threshold for triggering <span className="font-bold text-slate-900 dark:text-slate-200">low stock warnings</span> across all products.
                                </div>
                            </div>
                        }
                        icon={<BellAlertIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                    />
                    <DetailItem
                        label="SKU Prefix"
                        value={
                            settings.skuPrefix ? (
                                <div className="flex items-center gap-4">
                                    <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                                        <code className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                                            {settings.skuPrefix}
                                        </code>
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Prefix</div>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        This identifier is <span className="font-bold text-slate-900 dark:text-slate-200">appended</span> to all newly generated product SKUs.
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic text-sm">No prefix configured</span>
                            )
                        }
                        icon={<TagIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                    />
                </div>
            )}
        </SettingsCard>
    );
};

export default InventorySettingsSection;
