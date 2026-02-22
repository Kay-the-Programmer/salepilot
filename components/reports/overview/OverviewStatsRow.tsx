import React from 'react';
import { FilterableStatCard } from '../FilterableStatCard';
import CurrencyDollarIcon from '../../icons/CurrencyDollarIcon';
import ShoppingCartIcon from '../../icons/ShoppingCartIcon';
import DocumentTextIcon from '../../icons/DocumentTextIcon';
import ChartBarIcon from '../../icons/ChartBarIcon';
import BanknotesIcon from '../../icons/BanknotesIcon';
import { StoreSettings } from '../../../types';

interface OverviewStatsRowProps {
    storeSettings: StoreSettings;
}

export const OverviewStatsRow: React.FC<OverviewStatsRowProps> = ({ storeSettings }) => {
    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {/* Card 1: Total Earnings */}
            <FilterableStatCard
                title="Total Earnings"
                type="revenue"
                icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-600" />}
                color="bg-emerald-100"
                sparklineColor="#10b981"
                storeSettings={storeSettings}
            />

            {/* Card 2: Total Orders */}
            <FilterableStatCard
                title="Total Orders"
                type="orders"
                icon={<ShoppingCartIcon className="w-5 h-5 text-orange-600" />}
                color="bg-orange-100"
                sparklineColor="#f97316"
                storeSettings={storeSettings}
            />

            {/* Card 3: Gross Profit */}
            <FilterableStatCard
                title="Gross Profit"
                type="profit"
                icon={<ChartBarIcon className="w-5 h-5 text-indigo-600" />}
                color="bg-indigo-100"
                sparklineColor="#6366f1"
                storeSettings={storeSettings}
            />

            {/* Card 4: Operating Expenses */}
            <FilterableStatCard
                title="Operating Expenses"
                type="operating_expenses"
                icon={<BanknotesIcon className="w-5 h-5 text-red-600" />}
                color="bg-red-100"
                sparklineColor="#ef4444"
                storeSettings={storeSettings}
            />

            {/* Card 5: Net Profit */}
            <FilterableStatCard
                title="Net Profit"
                type="net_income"
                icon={<DocumentTextIcon className="w-5 h-5 text-blue-600" />}
                color="bg-blue-100"
                sparklineColor="#3b82f6"
                storeSettings={storeSettings}
            />
        </div>
    );
};
