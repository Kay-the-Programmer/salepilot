import React from 'react';

interface MobileTabBarProps {
    tabs: { id: string; label: string; icon?: React.ReactNode }[];
    activeTab: string;
    onChange: (tab: string) => void;
}

// Native-like tab bar for mobile
export const MobileTabBar: React.FC<MobileTabBarProps> = ({ tabs, activeTab, onChange }) => (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-1 py-2">
        <div className="flex overflow-x-auto scrollbar-hide -mx-1 px-1">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-lg mx-1 flex items-center space-x-2 transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                    <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                </button>
            ))}
        </div>
    </div>
);
