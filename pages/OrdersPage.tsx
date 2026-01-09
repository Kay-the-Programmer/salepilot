import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import { HiOutlineEye, HiOutlineXCircle, HiOutlineBanknotes, HiOutlineChevronRight, HiOutlineEllipsisVertical } from 'react-icons/hi2';
import Header from '../components/Header';
import RecordOrderPaymentModal from '../components/orders/RecordOrderPaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { formatCurrency } from '../utils/currency';

interface OrdersPageProps {
    onOpenSidebar?: () => void;
    storeSettings: StoreSettings;
    showSnackbar: (message: string, type: 'success' | 'error' | 'info' | 'sync') => void;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ storeSettings, showSnackbar }) => {
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
            await api.put(`/sales/${orderId}/fulfillment`, { status: newStatus });
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
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'fulfilled': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const filteredOrders = orders.filter(order =>
        (order.customerDetails?.name || order.customerName || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header
                title="Online Orders"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hideSearchOnMobile={false}
            />

            {/* Premium Stats Bar */}
            <div className="px-4 sm:px-8 py-6 bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm overflow-x-auto no-scrollbar">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-10 w-full lg:w-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</span>
                            <span className="text-xl font-black text-slate-900">{stats.total}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4 sm:pl-10">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending</span>
                            <span className="text-xl font-black text-slate-900">{stats.pending}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-100 pl-4 sm:pl-10 col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Revenue</span>
                            <span className="text-xl font-black text-slate-900">{formatCurrency(stats.revenue, storeSettings)}</span>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-xs font-black capitalize transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full p-4 sm:p-8 flex-grow">
                {loading ? (
                    <div className="py-20 text-center animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 max-w-2xl mx-auto shadow-inner">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <HiOutlineBanknotes className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">No Orders Found</h3>
                        <p className="text-slate-500 font-medium mt-2">Adjust your search or filters to see results.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Grid Layout (Hidden on Desktop) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
                            {filteredOrders.map(order => (
                                <div key={order.transactionId} onClick={() => setSelectedOrder(order)} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all active:scale-[0.98]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2 py-1 bg-indigo-50 rounded-lg">#{order.transactionId.slice(-6)}</span>
                                            <h4 className="text-lg font-black text-slate-900 mt-2">{order.customerDetails?.name || order.customerName || 'Guest'}</h4>
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border ${getStatusColor(order.fulfillmentStatus)}`}>
                                            {order.fulfillmentStatus || 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                            <span className="text-lg font-black text-slate-900">{formatCurrency(order.total, storeSettings)}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                            <HiOutlineChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table (Hidden on Mobile) */}
                        <div className="hidden lg:block bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Ref</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredOrders.map((order) => (
                                        <tr key={order.transactionId} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all cursor-copy">
                                                    #{order.transactionId.slice(-6)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-sm font-black text-slate-900">{order.customerDetails?.name || order.customerName || 'Guest'}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.customerDetails?.email || 'No email provided'}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-sm font-black text-slate-900">
                                                {formatCurrency(order.total, storeSettings)}
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-[10px] leading-5 font-black rounded-lg border uppercase tracking-widest ${order.paymentStatus === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-[10px] leading-4 font-black rounded-lg border uppercase tracking-widest ${getStatusColor(order.fulfillmentStatus)}`}>
                                                    {order.fulfillmentStatus || 'PENDING'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-100 rounded-2xl transition-all active:scale-95"
                                                        title="View Details"
                                                    >
                                                        <HiOutlineEye className="w-5 h-5" />
                                                    </button>
                                                    {order.paymentStatus !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkAsPaid(order)}
                                                            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-xl hover:shadow-emerald-100 rounded-2xl transition-all active:scale-95"
                                                            title="Record Payment"
                                                        >
                                                            <HiOutlineBanknotes className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedOrder(order)} // Placeholder or add status toggle
                                                        className="p-2.5 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                                                    >
                                                        <HiOutlineEllipsisVertical className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Premium Order Detail Drawer-style Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto flex flex-col">
                        <div className="p-8 sm:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Order Receipt</span>
                                <h3 className="text-3xl font-black text-slate-900 mt-2">#{selectedOrder.transactionId.slice(-8)}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95"
                            >
                                <HiOutlineXCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-8 sm:p-12 space-y-12">
                            {/* Customer Profile */}
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Customer Profile</h4>
                                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <div className="w-16 h-16 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                                        {(selectedOrder.customerDetails?.name || selectedOrder.customerName || 'G').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900">{selectedOrder.customerDetails?.name || selectedOrder.customerName || 'Guest Buyer'}</p>
                                        <p className="text-sm font-bold text-slate-500 mt-1">{selectedOrder.customerDetails?.email || 'No email registered'}</p>
                                        <p className="text-sm font-bold text-slate-500">{selectedOrder.customerDetails?.phone || 'No phone number'}</p>
                                    </div>
                                </div>
                                {selectedOrder.customerDetails?.address && (
                                    <div className="mt-4 p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Delivery Address</span>
                                        <p className="text-slate-600 font-medium italic leading-relaxed">{selectedOrder.customerDetails.address}</p>
                                    </div>
                                )}
                            </section>

                            {/* Order Line Items */}
                            <section>
                                <div className="flex justify-between items-end mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</h4>
                                    <span className="text-xs font-black text-slate-900">{selectedOrder.cart.length} Products</span>
                                </div>
                                <div className="space-y-3">
                                    {selectedOrder.cart.map((item, idx) => (
                                        <div key={idx} className="p-5 flex justify-between items-center bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-sm font-black text-slate-400">{item.quantity}x</div>
                                                <span className="text-sm font-black text-slate-900">{item.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Payment Summary */}
                            <section className="bg-slate-900 rounded-[40px] p-8 sm:p-10 text-white shadow-2xl shadow-slate-200">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                                        <span>Subtotal</span>
                                        <span className="text-white">{formatCurrency(selectedOrder.total, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-widest">
                                        <span>Paid Amount</span>
                                        <span>-{formatCurrency(selectedOrder.amountPaid || 0, storeSettings)}</span>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Balance Due</span>
                                            <span className="text-4xl font-black">{formatCurrency(Number(selectedOrder.total) - Number(selectedOrder.amountPaid || 0), storeSettings)}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="mt-auto p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                            {selectedOrder.paymentStatus !== 'paid' && (
                                <button
                                    onClick={() => handleMarkAsPaid(selectedOrder)}
                                    className="flex-1 py-4.5 bg-emerald-600 text-white rounded-[24px] font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                >
                                    Record Payment
                                </button>
                            )}
                            {selectedOrder.fulfillmentStatus === 'pending' && (
                                <button
                                    onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                    className={`${selectedOrder.paymentStatus === 'paid' ? 'col-span-2' : ''} flex-1 py-4.5 bg-indigo-600 text-white rounded-[24px] font-black text-sm hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 active:scale-95`}
                                >
                                    Fulfill Order
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className={`${(selectedOrder.paymentStatus === 'paid' && selectedOrder.fulfillmentStatus !== 'pending') ? 'col-span-2' : ''} py-4.5 bg-slate-100 text-slate-900 rounded-[24px] font-black text-sm hover:bg-slate-200 transition-all active:scale-95`}
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
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
                confirmText="Apply Status"
                confirmButtonClass="bg-slate-900 hover:bg-black rounded-2xl"
                variant="floating"
            />
        </div>
    );
};

export default OrdersPage;
