import React from 'react';
import { Customer, Sale, StoreSettings } from '../../types';
import MapPinIcon from '../icons/MapPinIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import CreditCardIcon from '../icons/CreditCardIcon';
import CalendarIcon from '../icons/CalendarIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import { formatCurrency } from '../../utils/currency';

interface CustomerDetailViewProps {
    customer: Customer;
    sales: Sale[];
    storeSettings: StoreSettings;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ title, children, icon, className = "" }) => (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
            {icon && <div className="text-gray-400 w-5 h-5">{icon}</div>}
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {children}
    </div>
);

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, sales, storeSettings }) => {
    const unpaidInvoices = sales.filter(s => s.paymentStatus !== 'paid');
    const paidSales = sales.filter(s => s.paymentStatus === 'paid');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Balances */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Account Overview" icon={<BanknotesIcon />}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-md bg-gray-50 border border-gray-100">
                                <span className="text-sm text-gray-600">Store Credit</span>
                                <span className="text-lg font-semibold text-gray-900">{formatCurrency(customer.storeCredit, storeSettings)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-md bg-gray-50 border border-gray-100">
                                <span className="text-sm text-gray-600">A/R Balance</span>
                                <span className="text-lg font-semibold text-gray-900">{formatCurrency(customer.accountBalance, storeSettings)}</span>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard title="Contact Details" icon={<UserCircleIcon />}>
                        <div className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email</dt>
                                <dd className="text-sm text-gray-900 flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                    {customer.email || 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phone</dt>
                                <dd className="text-sm text-gray-900 flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                                    {customer.phone || 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Address</dt>
                                <dd className="text-sm text-gray-900 flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <span className="flex-1">
                                        {customer.address ? `${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.zip}` : 'N/A'}
                                    </span>
                                </dd>
                            </div>
                            {customer.notes && (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</dt>
                                    <dd className="text-sm text-gray-700 italic border-l-2 border-gray-200 pl-2">"{customer.notes}"</dd>
                                </div>
                            )}
                        </div>
                    </InfoCard>
                </div>

                {/* Right Column: Invoices & History */}
                <div className="lg:col-span-2 space-y-6">
                    {unpaidInvoices.length > 0 && (
                        <InfoCard title="Outstanding Invoices" icon={<CreditCardIcon />}>
                            <div className="space-y-3">
                                {unpaidInvoices.map((sale) => (
                                    <div key={sale.transactionId} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors bg-white">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">Invoice #{sale.transactionId}</span>
                                            <span className="text-xs text-red-500 font-medium">
                                                Due: {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : 'Immediate'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(sale.total - sale.amountPaid, storeSettings)}</p>
                                            <p className="text-xs text-gray-500">Balance Due</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    )}

                    <InfoCard title="Order History" icon={<CalendarIcon />}>
                        {paidSales.length > 0 ? (
                            <div className="space-y-4">
                                {paidSales.map((sale) => (
                                    <div key={sale.transactionId} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs font-mono font-medium">#{sale.transactionId}</span>
                                                <span className="text-sm text-gray-500">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base font-medium text-gray-900">{formatCurrency(sale.total, storeSettings)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {sale.cart.map(item => (
                                                <div key={item.productId} className="flex justify-between text-sm text-gray-700">
                                                    <span>{item.quantity} × <span className="font-medium">{item.name}</span></span>
                                                    <span className="text-gray-500">{formatCurrency(item.quantity * item.price, storeSettings)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500">No purchase history available.</p>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailView;