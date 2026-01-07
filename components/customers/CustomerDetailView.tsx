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
    <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-6">
            {icon && <div className="text-blue-600">{icon}</div>}
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">{title}</h3>
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
                    <InfoCard title="Account Balances" icon={<BanknotesIcon className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <dt className="text-[10px] font-black text-green-700 uppercase tracking-tight mb-1">Store Credit</dt>
                                <dd className="text-2xl font-black text-green-700">{formatCurrency(customer.storeCredit, storeSettings)}</dd>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                <dt className="text-[10px] font-black text-red-700 uppercase tracking-tight mb-1">A/R Balance</dt>
                                <dd className="text-2xl font-black text-red-700">{formatCurrency(customer.accountBalance, storeSettings)}</dd>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard title="Contact Information" icon={<UserCircleIcon className="w-5 h-5" />}>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><EnvelopeIcon className="w-4 h-4" /></div>
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Email</dt>
                                    <dd className="text-sm font-bold text-gray-900">{customer.email || 'N/A'}</dd>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><PhoneIcon className="w-4 h-4" /></div>
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Phone</dt>
                                    <dd className="text-sm font-bold text-gray-900">{customer.phone || 'N/A'}</dd>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><MapPinIcon className="w-4 h-4" /></div>
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Address</dt>
                                    <dd className="text-sm font-bold text-gray-900">
                                        {customer.address ? `${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.zip}` : 'N/A'}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400"><DocumentTextIcon className="w-4 h-4" /></div>
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Notes</dt>
                                    <dd className="text-sm font-medium text-gray-600 italic">"{customer.notes || 'No notes available'}"</dd>
                                </div>
                            </div>
                        </div>
                    </InfoCard>
                </div>

                {/* Right Column: Invoices & History */}
                <div className="lg:col-span-2 space-y-6">
                    {unpaidInvoices.length > 0 && (
                        <InfoCard title="Open Invoices" icon={<CreditCardIcon className="w-5 h-5 text-red-500" />}>
                            <div className="space-y-3">
                                {unpaidInvoices.map((sale) => (
                                    <div key={sale.transactionId} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 font-bold text-xs">
                                                INV
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">#{sale.transactionId}</p>
                                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                                                    Due: {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-red-600">{formatCurrency(sale.total - sale.amountPaid, storeSettings)}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Balance Due</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>
                    )}

                    <InfoCard title="Purchase History" icon={<CalendarIcon className="w-5 h-5 text-blue-500" />}>
                        {paidSales.length > 0 ? (
                            <div className="space-y-4">
                                {paidSales.map((sale) => (
                                    <div key={sale.transactionId} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden group hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 border-dashed">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                                    <ChevronRightIcon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">#{sale.transactionId}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(sale.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-gray-900">{formatCurrency(sale.total, storeSettings)}</p>
                                                {sale.storeCreditUsed && sale.storeCreditUsed > 0 && (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight bg-green-50 px-2 py-0.5 rounded">Used Credit</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5 px-1">
                                                {sale.cart.map(item => (
                                                    <div key={item.productId} className="flex justify-between text-xs font-bold text-gray-600">
                                                        <span className="opacity-80 truncate mr-2">{item.quantity} x {item.name}</span>
                                                        <span className="flex-shrink-0 text-gray-900">{formatCurrency(item.quantity * item.price, storeSettings)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex flex-col justify-end items-end">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
                                                <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                                                    Completed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-sm font-medium text-gray-500">This customer has no purchase history yet.</p>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailView;