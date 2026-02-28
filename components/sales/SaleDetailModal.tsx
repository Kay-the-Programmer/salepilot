import { useState } from 'react';
import { Sale, StoreSettings } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import ReceiptModal from './ReceiptModal';
import SaleDetailContent from './SaleDetailContent';

interface SaleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    storeSettings: StoreSettings;
}

export default function SaleDetailModal({ isOpen, onClose, sale, storeSettings }: SaleDetailModalProps) {
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    if (!isOpen || !sale) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center transition-all duration-300"
                aria-labelledby="sale-detail-title"
                role="dialog"
                aria-modal="true"
                onClick={onClose}
            >
                <div
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:mx-4 shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.4)] ring-1 ring-slate-900/5 dark:ring-white/10 animate-NotificationSlideDown sm:animate-fade-in-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden pt-3 pb-2 flex justify-center bg-transparent">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="relative flex items-center justify-center px-4 py-4 border-b border-slate-100/80 dark:border-white/5 bg-transparent">
                        <div className="text-center">
                            <h3 id="sale-detail-title" className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">Sale Details</h3>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-wider uppercase font-mono">{sale.transactionId}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-4 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-full transition-all duration-300 active:scale-95"
                            aria-label="Close sale details"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                        <SaleDetailContent sale={sale} storeSettings={storeSettings} />
                    </div>

                    {/* Bottom action bar */}
                    <div className="flex-none p-5 px-6 border-t border-slate-100/80 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl safe-area-bottom">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsReceiptOpen(true)}
                                className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-[16px] text-[15px] font-bold tracking-wide text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                Receipt
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[16px] text-[15px] font-bold tracking-wide shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isReceiptOpen && sale && (
                <ReceiptModal
                    isOpen={isReceiptOpen}
                    onClose={() => setIsReceiptOpen(false)}
                    saleData={sale}
                    storeSettings={storeSettings}
                    showSnackbar={() => { }}
                />
            )}
        </>
    );
}