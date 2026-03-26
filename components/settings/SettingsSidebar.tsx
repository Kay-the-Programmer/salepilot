import React from 'react';
import {
    BuildingStorefrontIcon,
    BanknotesIcon,
    CalculatorIcon,
    PackageIcon,
    ShieldCheckIcon,
    CreditCardIcon
} from '../icons';
import ChevronRightIcon from '../icons/ChevronRightIcon';

// Inline barcode scanner icon (no external dep needed)
const ScannerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="7" y2="12.01" />
        <line x1="12" y1="7" x2="12" y2="17" />
        <line x1="17" y1="12" x2="17" y2="12.01" />
    </svg>
);

export type SettingsCategory =
    | 'store'
    | 'financial'
    | 'pos'
    | 'inventory'
    | 'verification'
    | 'billing'
    | 'notifications'
    | 'referrals'
    | 'scanner';

interface SettingsSidebarProps {
    activeCategory: SettingsCategory;
    onCategoryChange: (category: SettingsCategory) => void;
}

const categories = [
    { id: 'store' as const, label: 'Store Details', icon: BuildingStorefrontIcon, description: 'Basic info and logo', color: 'bg-blue-500' },
    { id: 'financial' as const, label: 'Financials', icon: BanknotesIcon, description: 'Currency and taxes', color: 'bg-emerald-500' },
    { id: 'pos' as const, label: 'POS Settings', icon: CalculatorIcon, description: 'Payment methods', color: 'bg-indigo-500' },
    { id: 'inventory' as const, label: 'Inventory', icon: PackageIcon, description: 'Stock rules', color: 'bg-amber-500' },
    { id: 'scanner' as const, label: 'Barcode Scanner', icon: ScannerIcon, description: 'USB/HID device setup', color: 'bg-violet-500' },
    { id: 'verification' as const, label: 'Verification', icon: ShieldCheckIcon, description: 'Business status', color: 'bg-slate-500' },
    { id: 'billing' as const, label: 'Plans & Billing', icon: CreditCardIcon, description: 'Subscription info', color: 'bg-rose-500' },
    { id: 'notifications' as const, label: 'Notifications', icon: BuildingStorefrontIcon, description: 'Push & alert settings', color: 'bg-purple-500' },
    { id: 'referrals' as const, label: 'Referrals', icon: ShieldCheckIcon, description: 'Invite friends, earn rewards', color: 'bg-emerald-600' },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeCategory, onCategoryChange }) => {
    return (
        <nav className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/10 overflow-hidden mx-4 md:mx-0">
            <div className="flex flex-col">
                {categories.map((category, index) => {
                    const Icon = category.icon;
                    const isActive = activeCategory === category.id;
                    const isLast = index === categories.length - 1;

                    return (
                        <button
                            key={category.id}
                            onClick={() => onCategoryChange(category.id)}
                            className={`w-full flex items-center justify-between p-3 md:p-4 transition-colors group relative
                                ${isActive ? 'md:bg-slate-50 md:dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800'}
                            `}
                        >
                            {/* Active Indicator on Desktop */}
                            <div className={`hidden md:block absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

                            <div className="flex items-center gap-3.5 md:gap-4 md:ml-2">
                                <div className={`shrink-0 p-1.5 md:p-2 rounded-lg text-white shadow-sm flex items-center justify-center ${category.color}`}>
                                    <Icon className="w-5 h-5 md:w-5 md:h-5" />
                                </div>
                                <div className="text-left py-0.5">
                                    <p className={`font-medium tracking-tight text-[17px] md:text-[15px] ${isActive ? 'text-slate-900 dark:text-white font-semibold md:text-blue-600 md:dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {category.label}
                                    </p>
                                    <p className={`hidden md:block text-[13px] text-slate-500 dark:text-slate-400 max-w-[180px] md:max-w-none truncate mt-0.5`}>
                                        {category.description}
                                    </p>
                                </div>
                            </div>

                            {/* Chevron for Mobile Only */}
                            <div className="md:hidden pr-1 text-slate-300 dark:text-slate-600 flex items-center">
                                <span className="text-[15px] text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline-block max-w-[100px] truncate">{category.description}</span>
                                <ChevronRightIcon className="w-5 h-5" />
                            </div>

                            {/* Inner Divider */}
                            {!isLast && (
                                <div className="absolute bottom-0 left-[52px] md:left-4 right-0 h-px bg-slate-100 dark:bg-white/5" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default SettingsSidebar;
