import React from 'react';
import { OnboardingTaskList } from './OnboardingTaskList';
import { AiSummaryCard } from './AiSummaryCard';
import { FilterableSalesTrend } from './sales/FilterableSalesTrend';
import { FilterableSalesChannelChart } from './FilterableSalesChannelChart';
import { FilterableTopSales } from './FilterableTopSales';
import { StoreSettings } from '../../types';
import { RecentOrdersTable } from './overview/RecentOrdersTable';
import { InteractiveOperatingExpensesCard } from './overview/InteractiveOperatingExpensesCard';
import { InteractiveNetProfitCard } from './overview/InteractiveNetProfitCard';
import { FilterableCashflowTrend } from './cashflow/FilterableCashflowTrend';
import { TipsCard } from './overview/TipsCard';

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

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Bento Row 1: Finance Stats & Tips */}
                <div className="lg:col-span-1 h-full">
                    <InteractiveOperatingExpensesCard storeSettings={storeSettings} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <TipsCard
                        hasProducts={reportData.inventory.totalProducts > 0}
                        hasExpenses={reportData.sales.totalOperatingExpenses > 0}
                        hasSuppliers={reportData.customers.totalSuppliers > 0}
                        hasCustomers={reportData.customers.totalCustomers > 0}
                        hasSales={reportData.sales.totalRevenue > 0}
                    />
                </div>
                <div className="lg:col-span-1 h-full">
                    <InteractiveNetProfitCard storeSettings={storeSettings} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <FilterableCashflowTrend storeSettings={storeSettings} />
                </div>

                {/* Bento Row 2: Sales Trends & Channels */}
                <div className="lg:col-span-3 h-full">
                    <FilterableSalesTrend storeSettings={storeSettings} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                </div>

                {/* Bento Row 3: Recent Orders & Top Sales */}
                <div className="lg:col-span-3 h-full">
                    <RecentOrdersTable
                        recentOrders={reportData.sales.recentOrders}
                        recentOrdersTab={recentOrdersTab}
                        setRecentOrdersTab={setRecentOrdersTab}
                        storeSettings={storeSettings}
                    />
                </div>
                <div className="lg:col-span-1 h-full">
                    <FilterableTopSales storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};
