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
    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white hover:bg-slate-50/50 focus:bg-white";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 mb-2";

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
    );
};

export default InventorySettingsSection;
