import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineUserGroup, HiOutlineInbox, HiOutlineClipboardList } from 'react-icons/hi';
import { HiOutlineBuildingStorefront, HiOutlineShoppingBag } from 'react-icons/hi2';

interface MarketplaceLayoutProps {
    children: React.ReactNode;
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view') || 'shop';

    const tabs = [
        { id: 'shop', label: 'Shop', icon: HiOutlineShoppingBag },
        { id: 'quick-offers', label: 'Quick Offers', icon: HiOutlineLightningBolt },
        { id: 'requests', label: 'Requests', icon: HiOutlineInbox },
        { id: 'activity', label: 'Activity', icon: HiOutlineClipboardList },
        { id: 'suppliers', label: 'Suppliers', icon: HiOutlineUserGroup },
        { id: 'retailers', label: 'Retailers', icon: HiOutlineBuildingStorefront },
    ];

    const handleTabChange = (viewId: string) => {
        // Preserve the current search (q) when hopping between views.
        const next = new URLSearchParams(location.search);
        next.set('view', viewId);
        navigate(`/marketplace?${next.toString()}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation tabs */}
            <div className="bg-surface border-b border-brand-border">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    flex items-center gap-2 h-12 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap
                                    ${activeView === tab.id
                                        ? 'border-sp-amber text-sp-navy'
                                        : 'border-transparent text-brand-text-muted hover:text-brand-text'}
                                `}
                            >
                                <tab.icon className="w-[18px] h-[18px]" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[calc(100vh-180px)]">
                {children}
            </div>
        </div>
    );
}
