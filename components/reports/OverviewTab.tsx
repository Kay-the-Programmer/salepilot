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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <FilterableSalesTrend storeSettings={storeSettings} />
                    <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                </div>

                {/* Row 3: Recent Orders & Top Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Recent Orders - 2 Cols */}
                    <RecentOrdersTable
                        recentOrders={reportData.sales.recentOrders}
                        recentOrdersTab={recentOrdersTab}
                        setRecentOrdersTab={setRecentOrdersTab}
                        storeSettings={storeSettings}
                    />

                    {/* Top Sale - 1 Col */}
                    <FilterableTopSales storeSettings={storeSettings} />
                </div>
            </>
        </div>
    );
};
