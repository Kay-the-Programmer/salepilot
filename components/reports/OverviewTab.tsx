import React from 'react';
import { OnboardingTaskList } from './OnboardingTaskList';
import { AiSummaryCard } from './AiSummaryCard';
import { FilterableSalesTrend } from './sales/FilterableSalesTrend';
import { FilterableSalesChannelChart } from './FilterableSalesChannelChart';
import { FilterableTopSales } from './FilterableTopSales';
import { StoreSettings } from '../../types';
import { OverviewStatsRow } from './overview/OverviewStatsRow';
import { RecentOrdersTable } from './overview/RecentOrdersTable';

interface OverviewTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    userName?: string;
    recentOrdersTab: 'all' | 'online' | 'pos';
    setRecentOrdersTab: (tab: 'all' | 'online' | 'pos') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    reportData,
    storeSettings,
    userName,
    recentOrdersTab,
    setRecentOrdersTab,
}) => {
    const sales = reportData.sales;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Onboarding Task List for new users */}
            <OnboardingTaskList
                stats={{
                    totalUnits: reportData.inventory.totalUnits,
                    totalSuppliers: reportData.customers.totalSuppliers,
                    totalCustomers: reportData.customers.totalCustomers,
                }}
            />

            {/* AI Summary Card */}
            <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={userName} />

            <>
                {/* Row 1: Stats Cards */}
                <OverviewStatsRow storeSettings={storeSettings} />

                {/* Row 2: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <FilterableSalesTrend storeSettings={storeSettings} />
                    </div>
                    <div>
                        <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                    </div>
                </div>

                {/* Row 3: Recent Orders & Top Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders - 2 Cols */}
                    <div className="lg:col-span-2">
                        <RecentOrdersTable
                            recentOrders={reportData.sales.recentOrders}
                            recentOrdersTab={recentOrdersTab}
                            setRecentOrdersTab={setRecentOrdersTab}
                            storeSettings={storeSettings}
                        />
                    </div>

                    {/* Top Sale - 1 Col */}
                    <div>
                        <FilterableTopSales storeSettings={storeSettings} />
                    </div>
                </div>
            </>
        </div>
    );
};
