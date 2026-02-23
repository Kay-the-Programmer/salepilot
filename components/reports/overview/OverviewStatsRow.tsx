import React from 'react';
import { InteractiveOperatingExpensesCard } from './InteractiveOperatingExpensesCard';
import { InteractiveNetProfitCard } from './InteractiveNetProfitCard';
import { FilterableCashflowTrend } from '../cashflow/FilterableCashflowTrend';
import { StoreSettings } from '../../../types';

interface OverviewStatsRowProps {
    storeSettings: StoreSettings;
}

export const OverviewStatsRow: React.FC<OverviewStatsRowProps> = ({ storeSettings }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Card 1: Operating Expenses */}
            <div className="col-span-1">
                <InteractiveOperatingExpensesCard storeSettings={storeSettings} />
            </div>

            {/* Card 2: Net Profit */}
            <div className="col-span-1">
                <InteractiveNetProfitCard storeSettings={storeSettings} />
            </div>

            {/* Card 3: Cashflow Trend (replaces Active Customers) */}
            <FilterableCashflowTrend storeSettings={storeSettings} />
        </div>
    );
};
