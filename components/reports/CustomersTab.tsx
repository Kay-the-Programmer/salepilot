import React from 'react';
import { StoreSettings } from '../../types';
import { CustomerStatsRow } from './customers/CustomerStatsRow';
import { CustomerAcquisitionChart } from './customers/CustomerAcquisitionChart';
import { GrowthInsightCard } from './customers/GrowthInsightCard';

interface CustomersTabProps {
    reportData: any;
    storeSettings: StoreSettings;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ reportData, storeSettings }) => {
    const customers = reportData.customers;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <CustomerStatsRow customers={customers} storeSettings={storeSettings} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CustomerAcquisitionChart />

                <GrowthInsightCard newCustomersInPeriod={customers.newCustomersInPeriod} />
            </div>
        </div>
    );
};
