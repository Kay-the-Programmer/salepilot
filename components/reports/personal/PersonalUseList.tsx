import React from 'react';
import ReceiptTaxIcon from '../../icons/ReceiptTaxIcon';

interface PersonalUseListProps {
    personalUse: any[] | null;
}

export const PersonalUseList: React.FC<PersonalUseListProps> = ({ personalUse }) => {
    return (
        <div className="bg-surface rounded-2xl p-6 border border-brand-border">
            <h3 className="font-bold text-brand-text text-lg tracking-tight mb-5">Personal Use Adjustments</h3>
            {!personalUse || personalUse.length === 0 ? (
                <div className="text-center py-12">
                    <ReceiptTaxIcon className="w-12 h-12 mx-auto mb-3 text-brand-text-muted/50" />
                    <p className="text-sm font-bold uppercase tracking-widest text-brand-text-muted">No records found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {personalUse.map((item) => (
                        <div key={item.id} className="p-4 bg-surface-variant/40 rounded-xl border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-sp-navy/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg bg-surface border border-brand-border flex items-center justify-center flex-shrink-0">
                                    <ReceiptTaxIcon className="w-5 h-5 text-brand-text-muted" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-brand-text text-sm tracking-tight truncate">{item.productName}</div>
                                    <div className="text-xs text-brand-text-muted mt-0.5 flex items-center gap-2">
                                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-brand-text-muted/40 rounded-full"></span>
                                        <span className="font-semibold">{item.userName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                                <div className="bg-surface-variant rounded-lg text-[11px] font-bold text-brand-text-muted px-2.5 py-1 border border-brand-border tnum">
                                    {item.fromQty ?? 0} <span className="mx-1.5 opacity-40">→</span> {item.toQty ?? 0}
                                </div>
                                <div className="font-bold text-danger text-xl tracking-tight tnum">
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
