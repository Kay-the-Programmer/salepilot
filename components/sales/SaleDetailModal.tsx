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
                className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
                aria-labelledby="sale-detail-title"
                role="dialog"
                aria-modal="true"
                onClick={onClose}
            >
                <div
                    className="liquid-glass-card rounded-[2rem] w-full sm:max-w-xl dark:bg-slate-900 rounded-t-2xl sm: max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:mx-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
                        <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5">
                        <div>
                            <h3 id="sale-detail-title" className="text-base font-semibold text-slate-900 dark:text-white">Sale Details</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{sale.transactionId}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 transition-all duration-300"
                            aria-label="Close sale details"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                        <SaleDetailContent sale={sale} storeSettings={storeSettings} />
                    </div>

                    {/* Bottom action bar */}
                    <div className="flex-none px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 safe-area-bottom">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsReceiptOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 transition-all duration-300"
                            >
                                <PrinterIcon className="w-4 h-4" />
                                Receipt
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2.5 text-sm font-medium text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 transition-all duration-300"
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