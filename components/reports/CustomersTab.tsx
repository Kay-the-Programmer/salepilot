import React from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import UsersIcon from '../icons/UsersIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import PlusIcon from '../icons/PlusIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';

interface CustomersTabProps {
    reportData: any;
    storeSettings: StoreSettings;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ reportData, storeSettings }) => {
    const customers = reportData.customers;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg mb-6">Customer Acquisition</h3>
                    <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <div className="text-center">
                            <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">Customer trend data visualization would go here</p>
                            <p className="text-slate-400 text-xs mt-1">(Requires more detailed historical data)</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-indigo-50 rounded-full mb-4">
                        <UsersIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Growth Insight</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        You acquired <span className="font-bold text-indigo-600">{customers.newCustomersInPeriod}</span> new customers this period.
                    </p>
                </div>
            </div>
        </div>
    );
};
