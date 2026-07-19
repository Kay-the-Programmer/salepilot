import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineUserGroup, HiOutlineInbox, HiOutlineClipboardList } from 'react-icons/hi';
import { HiOutlineBuildingStorefront, HiOutlineShoppingBag } from 'react-icons/hi2';

/**
 * Section tabs for the marketplace, styled for the navy structural header —
 * rendered as the bottom row of MarketplacePage's sticky <header> so the nav
 * stays visible while the page scrolls.
 */
export function MarketplaceNavTabs() {
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
        <nav aria-label="Marketplace sections" className="border-t border-white/10">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                flex items-center gap-2 h-12 border-b-2 text-sm font-semibold transition-colors whitespace-nowrap
                                ${activeView === tab.id
                                    ? 'border-sp-amber text-white'
                                    : 'border-transparent text-white/65 hover:text-white'}
                            `}
                        >
                            <tab.icon className="w-[18px] h-[18px]" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}

interface MarketplaceLayoutProps {
    children: React.ReactNode;
}

export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
    return (
        <div className="min-h-[60vh] bg-background">
            {children}
        </div>
    );
}
