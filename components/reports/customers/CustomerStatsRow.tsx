import React from 'react';
import { StoreSettings } from '../../../types';
import UsersIcon from '../../icons/UsersIcon';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import PlusIcon from '../../icons/PlusIcon';
import CurrencyDollarIcon from '../../icons/CurrencyDollarIcon';
import { FilterableStatCard } from '../FilterableStatCard';

interface CustomerStatsRowProps {
    customers: any;
    storeSettings: StoreSettings;
}

export const CustomerStatsRow: React.FC<CustomerStatsRowProps> = ({ storeSettings }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterableStatCard
                title="Total Customers"
                type="customers"
                icon={<UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                color="bg-blue-100/50 dark:bg-blue-500/20"
                sparklineColor="#3b82f6"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Active Customers"
                type="active_customers"
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
                color="bg-green-100/50 dark:bg-green-500/20"
                sparklineColor="#10b981"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="New Customers"
                type="new_customers"
                icon={<PlusIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                color="bg-indigo-100/50 dark:bg-indigo-500/20"
                sparklineColor="#6366f1"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Store Credit"
                type="store_credit"
                icon={<CurrencyDollarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                color="bg-yellow-100/50 dark:bg-yellow-500/20"
                sparklineColor="#eab308"
                storeSettings={storeSettings}
            />
        </div>
    );
};
