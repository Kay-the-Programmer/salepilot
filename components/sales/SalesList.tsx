
import React from 'react';
import {Sale, StoreSettings} from '@/types.ts';
import { formatCurrency } from '@/utils/currency.ts';

interface SalesListProps {
    sales: Sale[];
    onSelectSale: (sale: Sale) => void;
    storeSettings: StoreSettings;
}

const PaymentStatusBadge: React.FC<{ status: Sale['paymentStatus'] }> = ({ status }) => {
    const statusStyles: Record<Sale['paymentStatus'], string> = {
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
        partially_paid: 'bg-yellow-100 text-yellow-800',
    };

    // Handle undefined status
    if (!status) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                Unknown
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    );
};


const SalesList: React.FC<SalesListProps> = ({ sales, onSelectSale, storeSettings }) => {

    if (sales.length === 0) {
        return <div className="text-center p-10 text-gray-500">No sales found for the selected filters.</div>;
    }

    return (
        <div className="flow-root">
            {/* Mobile card list */}
            <ul className="md:hidden divide-y divide-gray-200 bg-white border border-gray-200 rounded-md">
                {sales.map((sale) => (
                    <li key={sale.transactionId} className="p-4 active:bg-gray-50" onClick={() => onSelectSale(sale)}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-blue-600">{sale.transactionId}</div>
                                <div className="mt-0.5 text-xs text-gray-500">{new Date(sale.timestamp).toLocaleString()}</div>
                                <div className="mt-1 text-sm text-gray-700">{sale.customerName || 'Walk in Customer'}</div>
                                <div className="mt-2"><PaymentStatusBadge status={sale.paymentStatus} /></div>
                            </div>
                            <div className="text-right text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(sale.total, storeSettings)}</div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* Desktop/tablet table */}
            <div className="hidden md:block -mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden border border-gray-200 sm:rounded-md">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/*<th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Transaction ID</th>*/}
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {sales.map((sale) => (
                                    <tr key={sale.transactionId} onClick={() => onSelectSale(sale)} className="cursor-pointer hover:bg-gray-50">
                                        {/*<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-blue-600 sm:pl-6">{sale.transactionId}</td>*/}
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(sale.timestamp).toLocaleString()}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{sale.customerName || 'Walk in Customer'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                            <PaymentStatusBadge status={sale.paymentStatus} />
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-semibold text-gray-900">{formatCurrency(sale.total, storeSettings)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesList;
