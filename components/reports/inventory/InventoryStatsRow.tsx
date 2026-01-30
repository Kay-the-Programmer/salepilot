import React from 'react';
import { StatCard } from '../StatCard';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';
import CurrencyDollarIcon from '../../icons/CurrencyDollarIcon';
import MinusCircleIcon from '../../icons/MinusCircleIcon';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';

interface InventoryStatsRowProps {
    inventory: any;
    storeSettings: StoreSettings;
}

export const InventoryStatsRow: React.FC<InventoryStatsRowProps> = ({ inventory, storeSettings }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Retail Value"
                value={formatCurrency(inventory.totalRetailValue, storeSettings)}
                icon={<CurrencyDollarIcon className="h-5 w-5 text-blue-600" />}
                color="bg-blue-100"
            />
            <StatCard
                title="Cost Value"
                value={formatCurrency(inventory.totalCostValue, storeSettings)}
                icon={<MinusCircleIcon className="h-5 w-5 text-yellow-600" />}
                color="bg-yellow-100"
            />
            <StatCard
                title="Potential Profit"
                value={formatCurrency(inventory.potentialProfit, storeSettings)}
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                color="bg-green-100"
            />
            <StatCard
                title="Total Units"
                value={inventory.totalUnits.toLocaleString()}
                icon={<ArchiveBoxIcon className="h-5 w-5 text-purple-600" />}
                color="bg-purple-100"
            />
        </div>
    );
};
