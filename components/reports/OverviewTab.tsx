import React from 'react';
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

    // Memoize static-ish cards to prevent them from re-rendering when parent isn't changed
    const MemoizedTipsCard = React.useMemo(() => (
        <TipsCard
            hasProducts={reportData.inventory.totalProducts > 0}
            hasExpenses={reportData.sales.totalOperatingExpenses > 0}
            hasSuppliers={reportData.customers.totalSuppliers > 0}
            hasCustomers={reportData.customers.totalCustomers > 0}
            hasSales={reportData.sales.totalRevenue > 0}
        />
    ), [reportData.inventory.totalProducts, reportData.sales.totalOperatingExpenses, reportData.customers.totalSuppliers, reportData.customers.totalCustomers, reportData.sales.totalRevenue]);

    const MemoizedExpensesCard = React.useMemo(() => (
        <InteractiveOperatingExpensesCard storeSettings={storeSettings} />
    ), [storeSettings]);

    const MemoizedProfitCard = React.useMemo(() => (
        <InteractiveNetProfitCard storeSettings={storeSettings} />
    ), [storeSettings]);

    const MemoizedCashflowCard = React.useMemo(() => (
        <FilterableCashflowTrend storeSettings={storeSettings} />
    ), [storeSettings]);

    const MemoizedRecentOrders = React.useMemo(() => (
        <RecentOrdersTable
            recentOrders={reportData.sales.recentOrders}
            recentOrdersTab={recentOrdersTab}
            setRecentOrdersTab={setRecentOrdersTab}
            storeSettings={storeSettings}
        />
    ), [reportData.sales.recentOrders, recentOrdersTab, setRecentOrdersTab, storeSettings]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* AI Summary Card */}
            <AiSummaryCard reportData={reportData} storeSettings={storeSettings} userName={userName} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Bento Row 1: Finance Stats & Tips */}
                <div className="min-w-0 h-full">
                    {MemoizedTipsCard}
                </div>
                <div className="min-w-0 h-full">
                    {MemoizedExpensesCard}
                </div>
                <div className="min-w-0 h-full">
                    {MemoizedProfitCard}
                </div>
                <div className="min-w-0 h-full">
                    {MemoizedCashflowCard}
                </div>

                {/* Bento Row 2: Sales Trends & Channels */}
                <div className="md:col-span-2 lg:col-span-3 min-w-0 h-full">
                    <FilterableSalesTrend storeSettings={storeSettings} />
                </div>
                <div className="md:col-span-1 min-w-0 h-full">
                    <FilterableSalesChannelChart totalRevenue={sales.totalRevenue} />
                </div>

                {/* Bento Row 3: Recent Orders & Top Sales */}
                <div className="md:col-span-2 lg:col-span-3 min-w-0 h-full">
                    {MemoizedRecentOrders}
                </div>
                <div className="md:col-span-1 min-w-0 h-full">
                    <FilterableTopSales storeSettings={storeSettings} />
                </div>
            </div>
        </div>
    );
};
