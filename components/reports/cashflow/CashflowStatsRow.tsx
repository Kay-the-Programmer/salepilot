import React from 'react';
import { StatCard } from '../StatCard';
import { formatCurrency } from '../../../utils/currency';
import { StoreSettings } from '../../../types';
import TrendingUpIcon from '../../icons/TrendingUpIcon';
import TrendingDownIcon from '../../icons/TrendingDownIcon';
import ScaleIcon from '../../icons/ScaleIcon';
import ReceiptPercentIcon from '../../icons/ReceiptPercentIcon';

interface CashflowStatsRowProps {
    cashflow: any;
    storeSettings: StoreSettings;
}

export const CashflowStatsRow: React.FC<CashflowStatsRowProps> = ({ cashflow, storeSettings }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Inflow"
                value={formatCurrency(cashflow.totalInflow, storeSettings)}
                icon={<TrendingUpIcon className="h-5 w-5 text-green-600" />}
                color="bg-green-100"
                tooltip="Total money received by the business (Sales, Payments, etc.)"
            />
            <StatCard
                title="Total Outflow"
                value={formatCurrency(cashflow.totalOutflow, storeSettings)}
                icon={<TrendingDownIcon className="h-5 w-5 text-red-600" />}
                color="bg-red-100"
                tooltip="Total money spent by the business (Expenses, Supplier Payments, etc.)"
            />
            <StatCard
                title="Net Cashflow"
                value={formatCurrency(cashflow.netCashflow, storeSettings)}
                icon={<ScaleIcon className={`h-5 w-5 ${cashflow.netCashflow >= 0 ? 'text-blue-600' : 'text-red-600'}`} />}
                color={cashflow.netCashflow >= 0 ? 'bg-blue-100' : 'bg-red-100'}
                tooltip="The difference between Total Inflow and Total Outflow. Positive means more money came in than went out."
            />
            <StatCard
                title="Efficiency"
                value={cashflow.totalInflow > 0 ? `${((cashflow.netCashflow / cashflow.totalInflow) * 100).toFixed(1)}%` : '0%'}
                icon={<ReceiptPercentIcon className="h-5 w-5 text-purple-600" />}
                color="bg-purple-100"
                tooltip="Percentage of Inflow that remains after all Outflows. (Net Cashflow / Total Inflow)"
            />
        </div>
    );
};
