import React from 'react';
import ReceiptTaxIcon from '../../icons/ReceiptTaxIcon';

interface PersonalUseListProps {
    personalUse: any[] | null;
}

export const PersonalUseList: React.FC<PersonalUseListProps> = ({ personalUse }) => {
    return (
        <div className="glass-effect dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/50 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-6 uppercase tracking-wider">Personal Use Adjustments</h3>
            {!personalUse || personalUse.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                    <ReceiptTaxIcon className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">No records found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {personalUse.map((item) => (
                        <div key={item.id} className="p-4 bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <ReceiptTaxIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 dark:text-white text-md tracking-tight">{item.productName}</div>
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                        <span className="text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{item.userName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto px-2 sm:px-0">
                                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/5 shadow-inner">
                                    {item.fromQty ?? 0} <span className="mx-2 opacity-30 text-[8px]">→</span> {item.toQty ?? 0}
                                </div>
                                <div className="font-black text-red-600 dark:text-red-400 text-2xl tracking-tighter">
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
