import React from 'react';
import { StoreSettings } from '../../../types';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import TrendingDownIcon from '../../icons/TrendingDownIcon';
import ScaleIcon from '../../icons/ScaleIcon';
import ReceiptPercentIcon from '../../icons/ReceiptPercentIcon';
import { FilterableStatCard } from '../FilterableStatCard';

interface CashflowStatsRowProps {
    cashflow: any;
    storeSettings: StoreSettings;
}

export const CashflowStatsRow: React.FC<CashflowStatsRowProps> = ({ cashflow, storeSettings }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterableStatCard
                title="Total Inflow"
                type="total_inflow"
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
                color="bg-green-100/50 dark:bg-green-500/20"
                sparklineColor="#10b981"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Total Outflow"
                type="total_outflow"
                icon={<TrendingDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
                color="bg-red-100/50 dark:bg-red-500/20"
                sparklineColor="#ef4444"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Net Cashflow"
                type="net_cashflow"
                icon={<ScaleIcon className={`h-5 w-5 ${cashflow.netCashflow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />}
                color={cashflow.netCashflow >= 0 ? 'bg-blue-100/50 dark:bg-blue-500/20' : 'bg-red-100/50 dark:bg-red-500/20'}
                sparklineColor={cashflow.netCashflow >= 0 ? '#3b82f6' : '#ef4444'}
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Efficiency"
                type="cashflow_efficiency"
                icon={<ReceiptPercentIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                color="bg-purple-100/50 dark:bg-purple-500/20"
                sparklineColor="#a855f7"
                storeSettings={storeSettings}
            />
        </div>
    );
};
