import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import { HiOutlineEye, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineBanknotes } from 'react-icons/hi2';
import Header from '../components/Header';
import RecordOrderPaymentModal from '../components/orders/RecordOrderPaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';

interface OrdersPageProps {
    onOpenSidebar?: () => void;
    storeSettings: StoreSettings;
    showSnackbar: (message: string, type: 'success' | 'error' | 'info' | 'sync') => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ onOpenSidebar, storeSettings, showSnackbar }) => {
    const [orders, setOrders] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [paymentOrder, setPaymentOrder] = useState<Sale | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Stats calculation
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'pending').length,
        revenue: orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.total) : 0), 0)
    };

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ channel: 'online' });
            if (filterStatus !== 'all') {
                queryParams.append('fulfillmentStatus', filterStatus);
            }

            const response = await api.get<any>(`/sales?${queryParams.toString()}`);

            const data = Array.isArray(response) ? response : response.items;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // ... existing action handlers ...
    const handleMarkAsPaid = async (order: Sale) => {
        const remaining = Number(order.total) - Number(order.amountPaid || 0);
        if (remaining <= 0.01) {
            alert('Order is already fully paid.');
            return;
        }
        setPaymentOrder(order);
    };

    const handleSavePayment = async (order: Sale, payment: Omit<Payment, 'id'>) => {
        try {
            await api.post(`/sales/${order.transactionId}/payments`, payment);

            fetchOrders();
            if (selectedOrder && selectedOrder.transactionId === order.transactionId) {
                setSelectedOrder(null);
            }
            setPaymentOrder(null);
            showSnackbar('Payment recorded successfully!', 'success');
        } catch (error: any) {
            console.error('Error recording payment:', error);
            const errorMessage = error.body?.error || error.body?.message || error.message || 'Failed to record payment';
            showSnackbar(errorMessage, 'error');
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Update Order Status',
            message: `Are you sure you want to mark this order as ${newStatus}?`,
            onConfirm: () => proceedWithUpdateStatus(orderId, newStatus)
        });
    };

    const proceedWithUpdateStatus = async (orderId: string, newStatus: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        try {
            await api.put(`/sales/${orderId}/fulfillment`,
                { status: newStatus }
            );
            fetchOrders();
            if (selectedOrder && selectedOrder.transactionId === orderId) {
                setSelectedOrder(null);
            }
            showSnackbar(`Order marked as ${newStatus}!`, 'success');
        } catch (error: any) {
            console.error('Error updating status:', error);
            const errorMessage = error.body?.error || error.body?.message || error.message || 'Failed to update status';
            showSnackbar(errorMessage, 'error');
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'fulfilled': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const filteredOrders = orders.filter(order =>
        order.customerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <Header
                title="Online Orders"
                onMenuClick={onOpenSidebar}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hideSearchOnMobile={false}
            />

            {/* Stats & Filters Bar */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-16 z-10 transition-all">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-slate-600">Total: <span className="font-semibold text-slate-900">{stats.total}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-slate-600">Pending: <span className="font-semibold text-slate-900">{stats.pending}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-600">Revenue: <span className="font-semibold text-slate-900">${stats.revenue.toFixed(2)}</span></span>
                        </div>
                    </div>

                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${filterStatus === status
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">


                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-sm text-slate-500">Loading orders...</p>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <HiOutlineBanknotes className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-slate-900 font-medium">No orders found</p>
                                            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.transactionId} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                                                #{order.transactionId.slice(-6)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{order.customerDetails?.name || order.customerName || 'Guest'}</div>
                                                <div className="text-xs text-slate-500">{order.customerDetails?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                                ${Number(order.total).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${order.paymentStatus === 'paid'
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.fulfillmentStatus)}`}>
                                                    {order.fulfillmentStatus || 'fulfilled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <HiOutlineEye className="w-5 h-5" />
                                                    </button>
                                                    {order.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(order)}
                                                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Mark as Paid"
                                                        >
                                                            <HiOutlineBanknotes className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {order.fulfillmentStatus === 'pending' && (
                                                        <button
                                                            onClick={() => updateStatus(order.transactionId, 'fulfilled')}
                                                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Mark as Fulfilled"
                                                        >
                                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {order.fulfillmentStatus !== 'cancelled' && (
                                                        <button
                                                            onClick={() => updateStatus(order.transactionId, 'cancelled')}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Cancel Order"
                                                        >
                                                            <HiOutlineXCircle className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrder(null)}></div>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-bold leading-6 text-slate-900" id="modal-title">
                                                    Order #{selectedOrder.transactionId}
                                                </h3>
                                                <button
                                                    onClick={() => setSelectedOrder(null)}
                                                    className="text-slate-400 hover:text-slate-500"
                                                >
                                                    <span className="sr-only">Close</span>
                                                    <HiOutlineXCircle className="h-6 w-6" />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Customer Section */}
                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Customer Details</h4>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-slate-900">{selectedOrder.customerDetails?.name || selectedOrder.customerName || 'Guest'}</p>
                                                        <p className="text-sm text-slate-600">{selectedOrder.customerDetails?.email}</p>
                                                        <p className="text-sm text-slate-600">{selectedOrder.customerDetails?.phone}</p>
                                                        {selectedOrder.customerDetails?.address && (
                                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                                                <p className="text-sm text-slate-500 italic">
                                                                    {selectedOrder.customerDetails?.address}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Items Section */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Order Items</h4>
                                                    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                                                        {selectedOrder.cart.map((item, idx) => (
                                                            <li key={idx} className="p-3 flex justify-between text-sm bg-white hover:bg-slate-50 transition-colors">
                                                                <div className="flex gap-3">
                                                                    <span className="font-medium text-slate-900">{item.quantity}x</span>
                                                                    <span className="text-slate-600">{item.name}</span>
                                                                </div>
                                                                <span className="font-medium text-slate-900">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Summary Section */}
                                                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                                                    <div className="flex justify-between text-slate-600 text-sm">
                                                        <span>Subtotal</span>
                                                        <span>${Number(selectedOrder.total).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-emerald-600 text-sm font-medium">
                                                        <span>Amount Paid</span>
                                                        <span>-${Number(selectedOrder.amountPaid || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold text-lg">
                                                        <span>Total Due</span>
                                                        <span>${(Number(selectedOrder.total) - Number(selectedOrder.amountPaid || 0)).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                                    {selectedOrder.paymentStatus !== 'paid' && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAsPaid(selectedOrder)}
                                            className="inline-flex w-full justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 sm:w-auto transition-colors"
                                        >
                                            Mark as Paid
                                        </button>
                                    )}
                                    {selectedOrder.fulfillmentStatus === 'pending' && (
                                        <button
                                            type="button"
                                            onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                            className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto transition-colors"
                                        >
                                            Mark Fulfilled
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOrder(null)}
                                        className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {paymentOrder && (
                <RecordOrderPaymentModal
                    isOpen={!!paymentOrder}
                    onClose={() => setPaymentOrder(null)}
                    order={paymentOrder}
                    onSave={handleSavePayment}
                    storeSettings={storeSettings}
                    showSnackbar={showSnackbar}
                />
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Proceed"
                confirmButtonClass="bg-emerald-600 hover:bg-emerald-700"
            />
        </div>
    );
};

export default OrdersPage;
