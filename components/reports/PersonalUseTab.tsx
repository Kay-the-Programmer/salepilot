import React from 'react';
import { StatCard } from './StatCard';
import { formatCurrency } from '../../utils/currency';
import { StoreSettings } from '../../types';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import MinusCircleIcon from '../icons/MinusCircleIcon';
import ReceiptTaxIcon from '../icons/ReceiptTaxIcon';

interface PersonalUseTabProps {
    personalUse: any[] | null;
    storeSettings?: StoreSettings; // Optional if needed for formatting currency
}

export const PersonalUseTab: React.FC<PersonalUseTabProps> = ({ personalUse }) => {
    const totalPersonalUseCount = personalUse ? personalUse.length : 0;
    const totalPersonalUseValue = personalUse ? personalUse.reduce((acc, item) => acc + (item.change * -1), 0) : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Items"
                    value={totalPersonalUseCount.toString()}
                    icon={<ArchiveBoxIcon className="h-5 w-5 text-orange-600" />}
                    color="bg-orange-100"
                />
                <StatCard
                    title="Total Adjustments"
                    value={totalPersonalUseValue.toString()}
                    icon={<MinusCircleIcon className="h-5 w-5 text-red-600" />}
                    color="bg-red-100"
                />
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Personal Use Adjustments</h3>
                {!personalUse || personalUse.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        No personal use records in this period
                    </div>
                ) : (
                    <div className="space-y-2">
                        {personalUse.map((item) => (
                            <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                        <ReceiptTaxIcon className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{item.productName}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {new Date(item.timestamp).toLocaleDateString()} • {item.userName}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                                    <div className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                                        {item.fromQty ?? 0} → {item.toQty ?? 0}
                                    </div>
                                    <div className="font-bold text-red-600 text-lg">
                                        {item.change ?? 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
