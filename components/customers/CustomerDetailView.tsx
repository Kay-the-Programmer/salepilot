import React from 'react';
import { Customer, Sale, StoreSettings } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import { formatCurrency } from '../../utils/currency';

interface CustomerDetailViewProps {
    customer: Customer;
    sales: Sale[];
    onEdit?: (customer: Customer) => void;
    storeSettings: StoreSettings;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, sales, onEdit, storeSettings }) => {
    
    const unpaidInvoices = sales.filter(s => s.paymentStatus !== 'paid');
    const paidSales = sales.filter(s => s.paymentStatus === 'paid');

    return (
        <div className="p-4 sm:p-4 lg:p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <InfoCard title="Customer Details">
                        <div className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                <dd className="mt-1 text-sm text-gray-900">{customer.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{customer.email || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                <dd className="mt-1 text-sm text-gray-900">{customer.phone || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {customer.address ? `${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.zip}` : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{customer.notes || 'None'}</dd>
                            </div>
                        </div>
                        {onEdit && (
                            <button
                                onClick={() => onEdit(customer)}
                                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <PencilIcon className="w-5 h-5 mr-2 -ml-1" />
                                Edit Profile
                            </button>
                        )}
                    </InfoCard>

                    <InfoCard title="Account Balance">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Store Credit</dt>
                            <dd className="mt-1 text-3xl font-bold text-green-600">{formatCurrency(customer.storeCredit, storeSettings)}</dd>
                        </div>
                         <div className="mt-4 border-t pt-4">
                            <dt className="text-sm font-medium text-gray-500">A/R Balance (Invoices)</dt>
                            <dd className="mt-1 text-3xl font-bold text-red-600">{formatCurrency(customer.accountBalance, storeSettings)}</dd>
                        </div>
                    </InfoCard>
                </div>
                <div className="lg:col-span-2 space-y-8">
                     {unpaidInvoices.length > 0 && (
                        <InfoCard title="Open Invoices">
                            <ul role="list" className="divide-y divide-gray-200 -mt-4">
                                {unpaidInvoices.map((sale) => (
                                    <li key={sale.transactionId} className="py-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-blue-600">{sale.transactionId}</p>
                                                <p className="text-xs text-gray-500">Due: {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <p className="text-lg font-bold text-red-600">{formatCurrency(sale.total - sale.amountPaid, storeSettings)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </InfoCard>
                     )}
                    <InfoCard title="Purchase History">
                        {paidSales.length > 0 ? (
                            <ul role="list" className="divide-y divide-gray-200 -mt-4">
                                {paidSales.map((sale) => (
                                    <li key={sale.transactionId} className="py-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{sale.transactionId}</p>
                                                <p className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleString()}</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-800">{formatCurrency(sale.total, storeSettings)}</p>
                                        </div>
                                        <ul className="pl-4 mt-2 space-y-1 text-sm">
                                            {sale.cart.map(item => (
                                                <li key={item.productId} className="flex justify-between text-gray-600">
                                                    <span>{item.quantity} x {item.name}</span>
                                                    <span>{formatCurrency(item.quantity * item.price, storeSettings)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                         {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                                             <div className="text-xs text-right text-green-600 font-semibold mt-1">
                                                 Paid with Store Credit: {formatCurrency(sale.storeCreditUsed, storeSettings)}
                                             </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">This customer has no purchase history.</p>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailView;