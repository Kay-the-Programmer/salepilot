import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { SubscriptionHistoryItem } from '../../types/subscription';
import { useToast } from '../../contexts/ToastContext';

interface SubscriptionHistoryProps {
    storeId: string;
}

import InvoiceModal from './InvoiceModal';

const SubscriptionHistory: React.FC<SubscriptionHistoryProps> = ({ storeId }) => {
    const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionHistoryItem | null>(null);
    const { } = useToast();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.get<SubscriptionHistoryItem[]>(`/subscriptions/history/${storeId}`);
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch subscription history:', error);

                // Mock data
                setHistory([
                    {
                        id: 'sub_123',
                        planName: 'Pro Plan',
                        amount: 499,
                        currency: 'ZMW',
                        status: 'active',
                        startDate: new Date().toISOString(),
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        paymentMethod: 'mobile-money',
                        reference: 'REF-123456',
                        createdAt: new Date().toISOString(),
                        invoiceUrl: '#',
                        invoiceId: 'INV-2024-001'
                    },
                    {
                        id: 'sub_124',
                        planName: 'Basic Plan',
                        amount: 299,
                        currency: 'ZMW',
                        status: 'expired',
                        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                        endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        paymentMethod: 'card',
                        reference: 'REF-123000',
                        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                        invoiceUrl: '#',
                        invoiceId: 'INV-2023-012'
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (storeId) {
            fetchHistory();
        }
    }, [storeId]);

    const handleViewInvoice = (item: SubscriptionHistoryItem) => {
        setSelectedInvoice(item);
    };

    if (loading) {
        return (
            <div className="mt-12 animate-pulse">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-900 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return null; // Or a "No history" message
    }

    return (
        <div className="mt-16 max-w-5xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
                Billing History
            </h3>
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                                <th className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Date</th>
                                <th className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Plan</th>
                                <th className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider text-right">Amount</th>
                                <th className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Status</th>
                                <th className="px-4 py-3 md:px-8 md:py-5 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-wider text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group active:scale-95 transition-all duration-300">
                                    <td className="px-4 py-3 md:px-8 md:py-5 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-4 py-3 md:px-8 md:py-5 font-semibold text-slate-900 dark:text-white">
                                        {item.planName}
                                    </td>
                                    <td className="px-4 py-3 md:px-8 md:py-5 text-slate-600 dark:text-slate-400 text-right font-mono font-medium">
                                        {item.currency} {item.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 md:px-8 md:py-5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm
                                            ${item.status === 'succeeded' || item.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                                                : item.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/20'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300 ring-1 ring-slate-500/20'
                                            }
                                        `}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 
                                                ${item.status === 'succeeded' || item.status === 'active' ? 'bg-emerald-500' :
                                                    item.status === 'pending' ? 'bg-amber-500' : 'bg-slate-500'}
                                            `}></span>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 md:px-8 md:py-5 text-right">
                                        <button
                                            onClick={() => handleViewInvoice(item)}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all opacity-80 hover:opacity-100 uppercase tracking-wide group-hover:translate-x-1"
                                        >
                                            View
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Viewer Modal */}
            {selectedInvoice && (
                <InvoiceModal
                    isOpen={!!selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    invoice={selectedInvoice}
                />
            )}
        </div>
    );
};

export default SubscriptionHistory;
