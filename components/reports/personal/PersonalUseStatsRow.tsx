import React from 'react';
import { StoreSettings } from '../../../types';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';
import MinusCircleIcon from '../../icons/MinusCircleIcon';
import CalculatorIcon from '../../icons/CalculatorIcon';
import { FilterableStatCard } from '../FilterableStatCard';

interface PersonalUseStatsRowProps {
    storeSettings: StoreSettings;
}

export const PersonalUseStatsRow: React.FC<PersonalUseStatsRowProps> = ({
    storeSettings
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FilterableStatCard
                title="Total Value"
                type="personal_total"
                icon={<MinusCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
                color="bg-red-100/50 dark:bg-red-500/20"
                sparklineColor="#ef4444"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Total Items Adjusted"
                type="personal_items"
                icon={<ArchiveBoxIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                color="bg-orange-100/50 dark:bg-orange-500/20"
                sparklineColor="#f97316"
                storeSettings={storeSettings}
            />
            <FilterableStatCard
                title="Avg Value / Record"
                type="personal_avg"
                icon={<CalculatorIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                color="bg-blue-100/50 dark:bg-blue-500/20"
                sparklineColor="#3b82f6"
                storeSettings={storeSettings}
            />
        </div>
    );
};
