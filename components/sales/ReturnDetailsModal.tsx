import React from 'react';
import { Return, StoreSettings } from '../../types';
import { formatCurrency } from '../../utils/currency';
import XMarkIcon from '../icons/XMarkIcon';
import CalendarIcon from '../icons/CalendarIcon';
import PackageIcon from '../icons/PackageIcon';
import Button from '../ui/Button';

interface ReturnDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    returnData: Return;
    storeSettings: StoreSettings;
}

const ReturnDetailsModal: React.FC<ReturnDetailsModalProps> = ({ isOpen, onClose, returnData, storeSettings }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="liquid-glass-card rounded-[2rem] max-w-lg w-full overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Return Details</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{returnData.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 active:scale-95 transition-all duration-300"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Meta Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">
                                {new Date(returnData.timestamp).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(returnData.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl boundary-dashed border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                                <PackageIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Original Sale</span>
                            </div>
                            <p className="font-mono font-semibold text-gray-900 text-sm">
                                {returnData.originalSaleId}
                            </p>
                        </div>
                    </div>

                    {/* Returned Items */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Returned Items
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                {returnData.returnedItems.length}
                            </span>
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {returnData.returnedItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{item.productName}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600">
                                                Qty: {item.quantity}
                                            </span>
                                            {item.addToStock && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                                    Restocked
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-gray-500 block">Reason</span>
                                        <span className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200 inline-block mt-0.5">
                                            {item.reason}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refund Summary */}
                    <div className="bg-gray-900 text-white p-5 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Refund Method</p>
                                <p className="font-semibold text-sm capitalize flex items-center gap-2">
                                    {returnData.refundMethod.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 font-medium">Total Refunded</span>
                            <span className="text-3xl font-black tracking-tight text-white">
                                {formatCurrency(returnData.refundAmount, storeSettings)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReturnDetailsModal;
