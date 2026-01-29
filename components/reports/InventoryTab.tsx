import React from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import MinusCircleIcon from '../icons/MinusCircleIcon';
import TrendingUpIcon from '../icons/TrendingUpIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';

interface InventoryTabProps {
    reportData: any;
    storeSettings: StoreSettings;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ reportData, storeSettings }) => {
    const inventory = reportData.inventory;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg mb-6">Inventory Value Comparison</h3>
                    <div className="h-48 flex items-end justify-around px-10">
                        <div className="flex flex-col items-center w-1/3">
                            <div className="w-full bg-blue-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: '100%' }}></div>
                            <div className="mt-2 text-sm font-medium text-slate-600">Retail Value</div>
                            <div className="text-xs text-slate-500 font-bold">{formatCurrency(inventory.totalRetailValue, storeSettings)}</div>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                            <div className="w-full bg-yellow-400 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(inventory.totalCostValue / inventory.totalRetailValue) * 100}%` }}></div>
                            <div className="mt-2 text-sm font-medium text-slate-600">Cost Value</div>
                            <div className="text-xs text-slate-500 font-bold">{formatCurrency(inventory.totalCostValue, storeSettings)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <ArchiveBoxIcon className="w-16 h-16 text-slate-200 mb-4" />
                    <h3 className="font-bold text-slate-900 text-lg">Inventory Health</h3>
                    <p className="text-sm text-slate-500 mt-2 px-4">
                        Your inventory has a potential profit margin of <span className="font-bold text-green-600">{((inventory.potentialProfit / inventory.totalRetailValue) * 100).toFixed(1)}%</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};
