import React from 'react';
import {
    BuildingStorefrontIcon,
    BanknotesIcon,
    CalculatorIcon,
    PackageIcon,
    ShieldCheckIcon,
    CreditCardIcon
} from '../icons';

export type SettingsCategory =
    | 'store'
    | 'financial'
    | 'pos'
    | 'inventory'
    | 'verification'
    | 'billing';

interface SettingsSidebarProps {
    activeCategory: SettingsCategory;
    onCategoryChange: (category: SettingsCategory) => void;
}

const categories = [
    { id: 'store' as const, label: 'Store Details', icon: BuildingStorefrontIcon, description: 'Basic info and logo' },
    { id: 'financial' as const, label: 'Financials', icon: BanknotesIcon, description: 'Currency and taxes' },
    { id: 'pos' as const, label: 'POS Settings', icon: CalculatorIcon, description: 'Payment methods' },
    { id: 'inventory' as const, label: 'Inventory', icon: PackageIcon, description: 'Stock rules' },
    { id: 'verification' as const, label: 'Verification', icon: ShieldCheckIcon, description: 'Business status' },
    { id: 'billing' as const, label: 'Plans & Billing', icon: CreditCardIcon, description: 'Subscription info' },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeCategory, onCategoryChange }) => {
    return (
        <nav className="space-y-1">
            {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;

                return (
                    <button
                        key={category.id}
                        onClick={() => onCategoryChange(category.id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all duration-200 group ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-1 ring-indigo-600'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600 border border-transparent'
                            }`}
                    >
                        <div className={`shrink-0 p-2 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                            }`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                {category.label}
                            </p>
                            <p className={`text-xs mt-0.5 line-clamp-1 ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {category.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </nav>
    );
};

export default SettingsSidebar;
