import React from 'react';
import { StoreSettings } from '../../types';
import { CashflowStatsRow } from './cashflow/CashflowStatsRow';
import { OutflowBreakdown } from './cashflow/OutflowBreakdown';
import { FinancialPositionCard } from './cashflow/FinancialPositionCard';

interface CashflowTabProps {
    reportData: any;
    storeSettings: StoreSettings;
    onClose?: () => void;
}

import { FilterableCashflowTrend } from './cashflow/FilterableCashflowTrend';

export const CashflowTab: React.FC<CashflowTabProps> = ({ reportData, storeSettings, onClose }) => {
    const cashflow = reportData.cashflow;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <CashflowStatsRow cashflow={cashflow} storeSettings={storeSettings} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <FilterableCashflowTrend storeSettings={storeSettings} />
                <div className="space-y-8">
                    <OutflowBreakdown
                        outflowBreakdown={cashflow.outflowBreakdown}
                        totalOutflow={cashflow.totalOutflow}
                        storeSettings={storeSettings}
                    />

                    <FinancialPositionCard netCashflow={cashflow.netCashflow} />
                </div>
            </div>
        </div>
    );
};
