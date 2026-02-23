import React from 'react';
import { FilterableStatCard } from '../FilterableStatCard';
import DocumentTextIcon from '../../icons/DocumentTextIcon';
import ChartBarIcon from '../../icons/ChartBarIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import { StoreSettings } from '../../../types';

interface OverviewStatsRowProps {
    storeSettings: StoreSettings;
}

export const OverviewStatsRow: React.FC<OverviewStatsRowProps> = ({ storeSettings }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Operating Expenses */}
            <FilterableStatCard
                title="Operating Expenses"
                type="operating_expenses"
                icon={<BanknotesIcon className="w-5 h-5 text-red-600" />}
                color="bg-red-100"
                sparklineColor="#ef4444"
                storeSettings={storeSettings}
            />

            {/* Card 2: Net Profit */}
            <FilterableStatCard
                title="Net Profit"
                type="net_income"
                icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}
                color="bg-blue-100"
                sparklineColor="#3b82f6"
                storeSettings={storeSettings}
            />

            {/* Card 3: Active Customers */}
            <FilterableStatCard
                title="Active Customers"
                type="active_customers"
                icon={<ChartBarIcon className="w-5 h-5 text-indigo-600" />}
                color="bg-indigo-100"
                sparklineColor="#6366f1"
                storeSettings={storeSettings}
            />
        </div>
    );
};
