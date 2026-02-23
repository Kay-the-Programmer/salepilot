import React, { useState } from 'react';
import { StoreSettings } from '../../../types';
import { BuildingStorefrontIcon, EnvelopeIcon, GlobeAltIcon, MapPinIcon, PhoneIcon } from '../../icons';
import LocationPicker from '../../LocationPicker';
import SettingsCard from '../SettingsCard';
import DetailItem from '../DetailItem';

interface StoreDetailsSectionProps {
    settings: StoreSettings;
    currentSettings: StoreSettings;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    setCurrentSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

const StoreDetailsSection: React.FC<StoreDetailsSectionProps> = ({
    settings,
    currentSettings,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    handleChange,
    setCurrentSettings
}) => {
    const [isMapOpen, setIsMapOpen] = useState(false);

    const inputFieldClasses = "block w-full rounded-xl border-0 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200 bg-white dark:bg-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-800";
    const labelClasses = "block text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 mb-2";

    const renderInput = (label: string, name: keyof StoreSettings, type = 'text', props: any = {}) => (
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
                className={props.className || inputFieldClasses}
                {...props}
            />
        </div>
    );

    return (
        <SettingsCard
            title="Store Details"
            description="Configure your store's public information displayed on receipts and invoices."
            isEditing={isEditing}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            badge="Public Info"
        >
            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        {renderInput("Store Name", "name", "text", {
                            required: true,
                            placeholder: "Your Store Name"
                        })}
                        {renderInput("Contact Email", "email", "email", {
                            placeholder: "contact@example.com",
                            readOnly: true,
                            className: `${inputFieldClasses} bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-500 cursor-not-allowed`
                        })}
                        {renderInput("Website", "website", "url", {
                            placeholder: "https://example.com"
                        })}

                        <div className="pt-2">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div>
                                    <label htmlFor="isOnlineStoreEnabled" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer block active:scale-95 transition-all duration-300">
                                        Online Store Status
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {currentSettings.isOnlineStoreEnabled !== false
                                            ? 'Your store is currently visible to customers'
                                            : 'Your store is hidden (maintenance mode)'}
                                    </p>
                                </div>

                                <label className="relative cursor-pointer active:scale-95 transition-all duration-300">
                                    <input
                                        id="isOnlineStoreEnabled"
                                        name="isOnlineStoreEnabled"
                                        type="checkbox"
                                        checked={currentSettings.isOnlineStoreEnabled !== false}
                                        onChange={(e) => setCurrentSettings(prev => ({ ...prev, isOnlineStoreEnabled: e.target.checked }))}
                                        className="peer sr-only"
                                    />
                                    <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500 transition-colors duration-300 relative">
                                        <div className="liquid-glass-card rounded-[2rem] absolute w-5 h-5 left-1 top-0.5 peer-checked:left-7 transition-all duration-300"></div>
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
                            <button
                                type="button"
                                onClick={() => setIsMapOpen(true)}
                                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Pick from Map
                            </button>

                            {isMapOpen && (
                                <LocationPicker
                                    onClose={() => setIsMapOpen(false)}
                                    onLocationSelect={(loc) => {
                                        if (loc.address) {
                                            setCurrentSettings(prev => ({
                                                ...prev,
                                                address: loc.address || ''
                                            }));
                                        }
                                        setIsMapOpen(false);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col">
                    <DetailItem
                        label="Store Name"
                        value={settings.name}
                        icon={<BuildingStorefrontIcon className="w-5 h-5" />}
                        highlight={true}
                    />
                    <DetailItem
                        label="Contact Email"
                        value={settings.email || 'Not set'}
                        icon={<EnvelopeIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Website"
                        value={
                            settings.website ? (
                                <a
                                    href={settings.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                                >
                                    {settings.website}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            ) : 'Not set'
                        }
                        icon={<GlobeAltIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Phone Number"
                        value={settings.phone || 'Not set'}
                        icon={<PhoneIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Address"
                        value={
                            <div className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap text-right">
                                {settings.address || 'Not set'}
                            </div>
                        }
                        icon={<MapPinIcon className="w-5 h-5" />}
                    />
                    <DetailItem
                        label="Online Store Status"
                        value={
                            <div className="flex items-center justify-end gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-semibold rounded-full ${settings.isOnlineStoreEnabled !== false
                                    ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${settings.isOnlineStoreEnabled !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                    {settings.isOnlineStoreEnabled !== false ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        }
                        icon={<BuildingStorefrontIcon className="w-5 h-5" />}
                    />
                </div>
            )}
        </SettingsCard>
    );
};

export default StoreDetailsSection;
