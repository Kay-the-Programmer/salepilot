import React from 'react';
import ReceiptTaxIcon from '../../icons/ReceiptTaxIcon';

interface PersonalUseListProps {
    personalUse: any[] | null;
}

export const PersonalUseList: React.FC<PersonalUseListProps> = ({ personalUse }) => {
    return (
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
    );
};
