import React from 'react';
import { StoreSettings } from '../../../types';
import CurrencyDollarIcon from '../../icons/CurrencyDollarIcon';
import MinusCircleIcon from '../../icons/MinusCircleIcon';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';
import { FilterableStatCard } from '../FilterableStatCard';

interface InventoryStatsRowProps {
    inventory: any;
    storeSettings: StoreSettings;
}

export const InventoryStatsRow: React.FC<InventoryStatsRowProps> = ({ storeSettings }) => {
    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            <FilterableStatCard
                title="Retail Value"
                type="inventory_retail"
                icon={<CurrencyDollarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                color="bg-blue-100/50 dark:bg-blue-500/20"
                sparklineColor="#3b82f6"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Cost Value"
                type="inventory_cost"
                icon={<MinusCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                color="bg-yellow-100/50 dark:bg-yellow-500/20"
                sparklineColor="#eab308"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Potential Profit"
                type="inventory_profit"
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
                color="bg-green-100/50 dark:bg-green-500/20"
                sparklineColor="#10b981"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Total Units"
                type="inventory_units"
                icon={<ArchiveBoxIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                color="bg-purple-100/50 dark:bg-purple-500/20"
                sparklineColor="#a855f7"
                storeSettings={storeSettings}
            />
        </div>
    );
};
