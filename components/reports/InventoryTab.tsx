import React from 'react';
import { StoreSettings } from '../../types';
import { InventoryStatsRow } from './inventory/InventoryStatsRow';
import { InventoryValueComparison } from './inventory/InventoryValueComparison';
import { InventoryHealthCard } from './inventory/InventoryHealthCard';

interface InventoryTabProps {
    reportData: any;
    storeSettings: StoreSettings;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ reportData, storeSettings }) => {
    const inventory = reportData.inventory;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <InventoryStatsRow inventory={inventory} storeSettings={storeSettings} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <InventoryValueComparison
                        totalRetailValue={inventory.totalRetailValue}
                        totalCostValue={inventory.totalCostValue}
                        storeSettings={storeSettings}
                    />
                </div>

                <div className="md:col-span-1">
                    <InventoryHealthCard
                        potentialProfit={inventory.potentialProfit}
                        totalRetailValue={inventory.totalRetailValue}
                    />
                </div>
            </div>
        </div>
    );
};
