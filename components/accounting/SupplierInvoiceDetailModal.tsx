import React from 'react';
import { SupplierInvoice, StoreSettings } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import ClipboardDocumentListIcon from '../icons/ClipboardDocumentListIcon';
import CalendarIcon from '../icons/CalendarIcon';
import CurrencyDollarIcon from '../icons/CurrencyDollarIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import { formatCurrency } from '../../utils/currency';

interface SupplierInvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: SupplierInvoice;
    onRecordPayment: (invoice: SupplierInvoice) => void;
    storeSettings: StoreSettings;
}

const SupplierInvoiceDetailModal: React.FC<SupplierInvoiceDetailModalProps> = ({ isOpen, onClose, invoice, onRecordPayment, storeSettings }) => {
    if (!isOpen) return null;

    const balanceDue = invoice.amount - invoice.amountPaid;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="relative bg-white w-full sm:max-w-2xl max-h-[96vh] sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up bg-gradient-to-b from-white to-slate-50/50">
                {/* Header */}
                <div className="px-6 py-6 sm:px-8 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Invoice Details
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Ref: {invoice.invoiceNumber}
                            </p>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${balanceDue <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                {balanceDue <= 0 ? 'Fully Paid' : 'Outstanding'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8 space-y-8 custom-scrollbar">
                    {/* Financial Summary Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Total Value</p>
                            <p className="text-lg font-black text-slate-900 text-center">{formatCurrency(invoice.amount, storeSettings)}</p>
                        </div>
                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-sm">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 text-center">Settled</p>
                            <p className="text-lg font-black text-emerald-600 text-center">{formatCurrency(invoice.amountPaid, storeSettings)}</p>
                        </div>
                        <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Balance Due</p>
                            <p className="text-lg font-black text-center">{formatCurrency(balanceDue, storeSettings)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Information Grid */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="p-2.5 bg-white text-blue-600 rounded-xl shadow-sm">
                                    <BuildingOfficeIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Supplier</p>
                                    <p className="text-md font-black text-slate-900 leading-tight">{invoice.supplierName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-sm">
                                    <ClipboardDocumentListIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">PO Number</p>
                                    <p className="text-md font-black text-slate-900 leading-tight">{invoice.poNumber}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-700">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                        <p className={`text-sm font-bold ${balanceDue > 0 && new Date(invoice.dueDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment History Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <BanknotesIcon className="w-4 h-4" />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Settlement Log</h4>
                            </div>

                            {invoice.payments.length > 0 ? (
                                <div className="space-y-3">
                                    {invoice.payments.map((p, idx) => (
                                        <div key={p.id || idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm group hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <CurrencyDollarIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 capitalize">{p.method.replace('_', ' ')}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{new Date(p.date).toLocaleDateString()} • {p.reference || 'No ref'}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-slate-900">
                                                {formatCurrency(p.amount, storeSettings)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                                        <BanknotesIcon className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">Log Empty</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">No disbursements recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-6 sm:px-8 border-t border-slate-100 bg-white sm:flex sm:flex-row-reverse gap-4">
                    {balanceDue > 0 && (
                        <button
                            onClick={() => onRecordPayment(invoice)}
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <BanknotesIcon className="w-5 h-5" />
                            Record Disbursement
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto mt-3 sm:mt-0 px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-[1.5rem] font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierInvoiceDetailModal;
