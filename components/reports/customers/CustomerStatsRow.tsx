import React from 'react';
import { StatCard } from '../StatCard';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';
import UsersIcon from '../../icons/UsersIcon';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import PlusIcon from '../../icons/PlusIcon';
import CurrencyDollarIcon from '../../icons/CurrencyDollarIcon';

interface CustomerStatsRowProps {
    customers: any;
    storeSettings: StoreSettings;
}

export const CustomerStatsRow: React.FC<CustomerStatsRowProps> = ({ customers, storeSettings }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Customers"
                value={customers.totalCustomers.toLocaleString()}
                icon={<UsersIcon className="h-5 w-5 text-blue-600" />}
                color="bg-blue-100"
                tooltip="Total number of unique customers registered in your store."
            />
            <StatCard
                title="Active Customers"
                value={customers.activeCustomersInPeriod.toLocaleString()}
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                color="bg-green-100"
                tooltip="Customers who made at least one purchase during the selected period."
            />
            <StatCard
                title="New Customers"
                value={customers.newCustomersInPeriod.toLocaleString()}
                icon={<PlusIcon className="h-5 w-5 text-indigo-600" />}
                color="bg-indigo-100"
                tooltip="Customers who registered during the selected period."
            />
            <StatCard
                title="Store Credit"
                value={formatCurrency(customers.totalStoreCreditOwed, storeSettings)}
                icon={<CurrencyDollarIcon className="h-5 w-5 text-yellow-600" />}
                color="bg-yellow-100"
                tooltip="Total outstanding store credit currently held by all customers."
            />
        </div>
    );
};
