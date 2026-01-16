import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CreditCardIcon } from '../../components/icons';

interface StoreRow {
    id: string;
    name: string;
    status: string;
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'canceled';
    subscriptionEndsAt?: string | null;
}

const SuperAdminSubscriptions: React.FC = () => {
    const [stores, setStores] = useState<StoreRow[]>([]);


    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState('');

    // Payment Form
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [periodDays, setPeriodDays] = useState('30');

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const resp = await api.get<{ stores: StoreRow[] }>("/superadmin/stores");
            setStores(resp.stores || []);
        } catch (e) {
            console.error(e);
        } finally {
            // done
        }
    };

    const openPaymentModal = (storeId?: string) => {
        if (storeId) setSelectedStoreId(storeId);
        setPaymentModalOpen(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStoreId || !amount) return;

        try {
            // Calculate start/end based on simple days logic for now, or let backend handle it
            // Backend endpoint: /superadmin/revenue/payments
            // Expects: { storeId, amount, currency, periodStart, periodEnd }

            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + parseInt(periodDays));

            await api.post('/superadmin/revenue/payments', {
                storeId: selectedStoreId,
                amount: parseFloat(amount),
                currency,
                periodStart: startDate.toISOString().split('T')[0],
                periodEnd: endDate.toISOString().split('T')[0]
            });

            alert('Payment Recorded & Subscription Extended!');
            setPaymentModalOpen(false);
            setAmount('');
            setSelectedStoreId('');
            loadStores(); // Refresh to see updated subscription status
        } catch (error: any) {
            alert(error.message || 'Failed to record payment');
        }
    };

    // Filter mainly for subscriptions relevant info
    const subStores = stores.filter(s => s.status !== 'suspended'); // maybe hide suspended

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor billing status and record offline payments</p>
                </div>
                <button
                    onClick={() => openPaymentModal(stores[0]?.id || '')}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto"
                >
                    <CreditCardIcon className="w-5 h-5" />
                    Record New Payment
                </button>
            </div>

            {/* Quick Stats Row could go here */}

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Store</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Current Plan Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Expiration</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {subStores.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                            ${s.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                                                s.subscriptionStatus === 'trial' ? 'bg-purple-100 text-purple-800' :
                                                    s.subscriptionStatus === 'past_due' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                                            {s.subscriptionStatus.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                        {s.subscriptionEndsAt ? new Date(s.subscriptionEndsAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => openPaymentModal(s.id)}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline"
                                        >
                                            Extend / Pay
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Record Subscription Payment</h2>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={selectedStoreId}
                                    onChange={e => setSelectedStoreId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select Store</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id.slice(0, 5)}...)</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={periodDays}
                                    onChange={e => setPeriodDays(e.target.value)}
                                >
                                    <option value="30">1 Month (30 Days)</option>
                                    <option value="90">3 Months (90 Days)</option>
                                    <option value="365">1 Year (365 Days)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setPaymentModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Confirm Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminSubscriptions;
