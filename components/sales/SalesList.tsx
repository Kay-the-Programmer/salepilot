import React from 'react';
import { Sale, StoreSettings } from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';
import CreditCardIcon from '../icons/CreditCardIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import CalendarIcon from '../icons/CalendarIcon';
import ReceiptPercentIcon from '../icons/ReceiptPercentIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

interface SalesListProps {
    sales: Sale[];
    onSelectSale: (sale: Sale) => void;
    storeSettings: StoreSettings;
}

const PaymentStatusBadge: React.FC<{ status: Sale['paymentStatus'] }> = ({ status }) => {
    const statusConfig = {
        paid: { 
            color: 'from-emerald-500 to-green-500', 
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
            text: 'text-emerald-700',
            icon: '✓',
            label: 'Paid'
        },
        unpaid: { 
            color: 'from-red-500 to-red-600', 
            bg: 'bg-gradient-to-r from-red-50 to-red-100',
            text: 'text-red-700',
            icon: '!',
            label: 'Unpaid'
        },
        partially_paid: { 
            color: 'from-amber-500 to-yellow-500', 
            bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
            text: 'text-amber-700',
            icon: '~',
            label: 'Partial'
        },
    };

    if (!status) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                Unknown
            </span>
        );
    }

    const config = statusConfig[status] || statusConfig.unpaid;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${config.color}`}></div>
            {config.label}
        </span>
    );
};

const SalesList: React.FC<SalesListProps> = ({ sales, onSelectSale, storeSettings }) => {
    if (sales.length === 0) {
        return (
            <div className="text-center py-16 px-4 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ReceiptPercentIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Sales Found</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                    No sales match your current filters. Try adjusting your search criteria or date range.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Mobile View */}
            <div className="md:hidden space-y-3">
                {sales.map((sale) => {
                    const isOverdue = sale.paymentStatus === 'unpaid' && sale.dueDate && new Date(sale.dueDate) < new Date();
                    const paymentPercentage = sale.amountPaid > 0 ? (sale.amountPaid / sale.total) * 100 : 0;
                    
                    return (
                        <div 
                            key={sale.transactionId} 
                            onClick={() => onSelectSale(sale)}
                            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.99]"
                        >
                            <div className="p-4">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                {sale.transactionId.substring(0, 8)}
                                            </div>
                                            <PaymentStatusBadge status={sale.paymentStatus} />
                                            {isOverdue && (
                                                <span className="px-2 py-1 bg-gradient-to-r from-red-50 to-red-100 text-red-700 text-xs font-medium rounded-full">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            {new Date(sale.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900">
                                            {formatCurrency(sale.total, storeSettings)}
                                        </div>
                                        {paymentPercentage > 0 && paymentPercentage < 100 && (
                                            <div className="text-xs text-slate-500">
                                                {paymentPercentage.toFixed(0)}% paid
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl mb-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                                        <UserCircleIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-900 truncate">
                                            {sale.customerName || 'Walk-in Customer'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {sale.itemsCount || sale.cart?.length || 0} items
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Progress */}
                                {sale.paymentStatus === 'partially_paid' && (
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                                            <span>Payment Progress</span>
                                            <span>{formatCurrency(sale.amountPaid, storeSettings)} / {formatCurrency(sale.total, storeSettings)}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                style={{ width: `${paymentPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <CreditCardIcon className="w-3.5 h-3.5" />
                                        {sale.paymentMethod || 'Multiple methods'}
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                                        <span>View Details</span>
                                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop/Tablet View */}
            <div className="hidden md:block">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            Date & Time
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <UserCircleIcon className="w-4 h-4" />
                                            Customer
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {sales.map((sale) => {
                                    const isOverdue = sale.paymentStatus === 'unpaid' && sale.dueDate && new Date(sale.dueDate) < new Date();
                                    const itemsCount = sale.itemsCount || sale.cart?.length || 0;
                                    const paymentPercentage = sale.amountPaid > 0 ? (sale.amountPaid / sale.total) * 100 : 0;
                                    
                                    return (
                                        <tr 
                                            key={sale.transactionId} 
                                            onClick={() => onSelectSale(sale)}
                                            className="group hover:bg-slate-50/50 cursor-pointer transition-colors duration-200"
                                        >
                                            {/* Date & Time */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                                                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">
                                                            {new Date(sale.timestamp).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg flex items-center justify-center">
                                                        <UserCircleIcon className="w-4 h-4 text-slate-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                                                            {sale.customerName || 'Walk-in Customer'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                                            ID: {sale.transactionId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col items-center gap-2">
                                                    <PaymentStatusBadge status={sale.paymentStatus} />
                                                    {isOverdue && (
                                                        <span className="px-2 py-0.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 text-xs font-medium rounded-full">
                                                            Overdue
                                                        </span>
                                                    )}
                                                    {paymentPercentage > 0 && paymentPercentage < 100 && (
                                                        <div className="w-20">
                                                            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                                    style={{ width: `${paymentPercentage}%` }}
                                                                />
                                                            </div>
                                                            <div className="text-xs text-slate-500 text-center mt-0.5">
                                                                {paymentPercentage.toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Items */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2.5 py-1 bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                                        {itemsCount} items
                                                    </div>
                                                    {sale.paymentMethod && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                            <CreditCardIcon className="w-3 h-3" />
                                                            {sale.paymentMethod}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="space-y-1">
                                                    <div className="text-lg font-bold text-slate-900">
                                                        {formatCurrency(sale.total, storeSettings)}
                                                    </div>
                                                    {sale.amountPaid > 0 && sale.amountPaid < sale.total && (
                                                        <div className="text-xs text-slate-500">
                                                            Paid: {formatCurrency(sale.amountPaid, storeSettings)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelectSale(sale);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                >
                                                    <span>View</span>
                                                    <ArrowRightIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Footer */}
                {sales.length > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-slate-600">
                            Showing <span className="font-semibold text-slate-900">{sales.length}</span> sales
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm text-slate-600">Total Sales Value</div>
                                <div className="text-xl font-bold text-slate-900">
                                    {formatCurrency(
                                        sales.reduce((sum, sale) => sum + sale.total, 0),
                                        storeSettings
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-600">Average Sale</div>
                                <div className="text-xl font-bold text-slate-900">
                                    {formatCurrency(
                                        sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length,
                                        storeSettings
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesList;