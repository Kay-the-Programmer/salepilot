import React, { useState } from 'react';
import { Customer, Sale, StoreSettings } from '../../types';
import SendSmsModal from './SendSmsModal';
import PremiumUpgradeModal from '../ui/PremiumUpgradeModal';
import { hasModule, MODULES } from '../../utils/entitlements';
import MapPinIcon from '../icons/MapPinIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import { toneClass, fulfillmentMeta, paymentMeta } from '../ui/StatusPill';
import CreditCardIcon from '../icons/CreditCardIcon';
import CalendarIcon from '../icons/CalendarIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import { formatCurrency } from '../../utils/currency';
import { HiOutlineShoppingBag } from 'react-icons/hi2';

interface CustomerDetailViewProps {
    customer: Customer;
    sales: Sale[];
    storeSettings: StoreSettings;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ title, children, icon, className = "" }) => (
    <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200/50 dark:border-white/10">
            {icon && <div className="text-gray-400 dark:text-slate-500 w-5 h-5">{icon}</div>}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {children}
    </div>
);

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer, sales, storeSettings }) => {
    const [smsOpen, setSmsOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const smsUnlocked = hasModule(storeSettings, MODULES.SMS_MESSAGING);
    const unpaidInvoices = sales.filter(s => s.paymentStatus !== 'paid');
    const paidSales = sales.filter(s => s.paymentStatus === 'paid');

    // Sort by timestamp descending to get recent orders
    const recentOrders = [...sales].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details & Balances */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Account Overview" icon={<BanknotesIcon />}>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-md bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                <span className="text-sm text-gray-600 dark:text-slate-400">Store Credit</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(customer.storeCredit, storeSettings)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-md bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                <span className="text-sm text-gray-600 dark:text-slate-400">A/R Balance</span>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(customer.accountBalance, storeSettings)}</span>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard title="Contact Details" icon={<UserCircleIcon />}>
                        <div className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Email</dt>
                                <dd className="text-sm text-gray-900 dark:text-slate-200 flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    {customer.email || 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Phone</dt>
                                <dd className="text-sm text-gray-900 dark:text-slate-200 flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                                    {customer.phone || 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Address</dt>
                                <dd className="text-sm text-gray-900 dark:text-slate-200 flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5" />
                                    <span className="flex-1">
                                        {customer.address ? `${customer.address.street}, ${customer.address.city}, ${customer.address.state} ${customer.address.zip}` : 'N/A'}
                                    </span>
                                </dd>
                            </div>
                            {customer.notes && (
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-1">Notes</dt>
                                    <dd className="text-sm text-gray-700 dark:text-slate-300 italic border-l-2 border-gray-200 dark:border-slate-800 pl-2">"{customer.notes}"</dd>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => (smsUnlocked ? setSmsOpen(true) : setUpgradeOpen(true))}
                                disabled={smsUnlocked && !customer.phone}
                                title={smsUnlocked
                                    ? (customer.phone ? 'Send an SMS to this customer' : 'Add a phone number to send an SMS')
                                    : 'SMS messaging is a premium add-on — tap to unlock'}
                                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-surface rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {smsUnlocked ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 3v-3z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                )}
                                Send SMS
                                {!smsUnlocked && <span className="ml-1 px-1.5 py-0.5 rounded bg-surface/25 text-[10px] font-bold uppercase tracking-wide">Premium</span>}
                            </button>
                        </div>
                    </InfoCard>
                </div>

                {/* Right Column: Invoices & History */}
                <div className="lg:col-span-2 space-y-6">
                    <InfoCard title="Recent Orders" icon={<HiOutlineShoppingBag className="w-5 h-5" />}>
                        {recentOrders.length > 0 ? (
                            <div className="space-y-3">
                                {recentOrders.map((sale) => (
                                    <div key={sale.transactionId} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-400">
                                                <DocumentTextIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">#{sale.transactionId.slice(-4)}</span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-500">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${toneClass(fulfillmentMeta(sale.fulfillmentStatus).tone)}`}>
                                                        {sale.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${toneClass(paymentMeta(sale.paymentStatus).tone)}`}>
                                                        {sale.paymentStatus === 'paid' ? 'Paid' : (sale.paymentStatus === 'partially_paid' ? 'Partial' : 'Unpaid')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(sale.total, storeSettings)}</span>
                                            <span className="text-xs text-gray-500 dark:text-slate-500">{sale.cart.length} items</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500 dark:text-slate-500">No recent orders.</p>
                            </div>
                        )}
                    </InfoCard>

                    {unpaidInvoices.length > 0 && (
                        <InfoCard title="Outstanding Invoices" icon={<CreditCardIcon />}>
                            <div className="space-y-3">
                                {unpaidInvoices.map((sale) => (
                                    <div key={sale.transactionId} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-500 transition-colors bg-white/50 dark:bg-slate-800/50 shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Invoice #{sale.transactionId}</span>
                                            <span className="text-xs text-red-500 dark:text-red-400 font-medium">
                                                Due: {sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : 'Immediate'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(sale.total - sale.amountPaid, storeSettings)}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-500">Balance Due</p>
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
                                    <div key={sale.transactionId} className="p-4 rounded-2xl border border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors active:scale-95 duration-300">
                                        <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 dark:border-white/10 pb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 py-1 px-2 rounded-lg text-xs font-mono font-medium border border-slate-200/50 dark:border-white/10 shadow-sm">#{sale.transactionId}</span>
                                                <span className="text-sm text-gray-500 dark:text-slate-500">{new Date(sale.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base font-medium text-gray-900 dark:text-white">{formatCurrency(sale.total, storeSettings)}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            {sale.cart.map(item => (
                                                <div key={item.productId} className="flex justify-between text-sm text-gray-700 dark:text-slate-400">
                                                    <span>{item.quantity} × <span className="font-medium text-gray-900 dark:text-slate-200">{item.name}</span></span>
                                                    <span className="text-gray-500 dark:text-slate-500">{formatCurrency(item.quantity * item.price, storeSettings)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-gray-200 dark:border-slate-800">
                                <p className="text-sm text-gray-500 dark:text-slate-500">No purchase history available.</p>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>

            <SendSmsModal
                customer={customer}
                storeSettings={storeSettings}
                isOpen={smsOpen}
                onClose={() => setSmsOpen(false)}
            />

            <PremiumUpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
        </div>
    );
};

export default CustomerDetailView;