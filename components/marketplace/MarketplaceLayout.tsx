import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiOutlineLightningBolt, HiOutlineUserGroup } from 'react-icons/hi';

interface MarketplaceLayoutProps {
    children: React.ReactNode;
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on query param or default
    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view') || 'quick-offers';

    const tabs = [
        { id: 'quick-offers', label: 'Quick Offers', icon: HiOutlineLightningBolt },
        { id: 'suppliers', label: 'Suppliers', icon: HiOutlineUserGroup },
        { id: 'retailers', label: 'Retailers', icon: HiOutlineBuildingStorefront },
    ];

    const handleTabChange = (viewId: string) => {
        // Update URL query param to reflect the view
        navigate(`/marketplace?view=${viewId}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-200 sticky top-20 z-40">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    flex items-center gap-2 py-4 border-b-2 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap
                                    ${activeView === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'}
                                `}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[calc(100vh-180px)]">
                {children}
            </div>
        </div>
    );
}
