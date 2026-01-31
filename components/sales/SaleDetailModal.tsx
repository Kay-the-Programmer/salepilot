import { useState } from 'react';
import { Sale, StoreSettings } from '@/types.ts';
import XMarkIcon from '../icons/XMarkIcon';
import PrinterIcon from '../icons/PrinterIcon';
import ReceiptModal from './ReceiptModal';
import { Button } from '../ui/Button';
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
            {/* Mobile-optimized backdrop with native feel */}
            <div
                className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 flex items-end sm:items-center justify-center animate-fade-in"
                aria-labelledby="modal-title"
                role="dialog"
                aria-modal="true"
                onClick={onClose}
            >
                <div
                    glass-effect=""
                    className="w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* iOS-style drag handle for mobile */}
                    <div className="sm:hidden pt-3 pb-1 flex justify-center">
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Header with fixed position on scroll */}
                    <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700 z-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Sale Details</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sale.transactionId}</p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content area */}
                    <div className="overflow-y-auto max-h-[calc(85vh-130px)] px-4 sm:px-6 py-3">
                        <SaleDetailContent sale={sale} storeSettings={storeSettings} />
                    </div>

                    {/* Fixed bottom action bar - iOS style */}
                    <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col-1 sm:flex-row justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsReceiptOpen(true)}
                                icon={<PrinterIcon className="w-5 h-5" />}
                            >
                                View Receipt
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={onClose}
                                className="dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                Close
                            </Button>
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