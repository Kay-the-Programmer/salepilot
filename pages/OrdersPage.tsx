import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import {
    HiOutlineBanknotes,
    HiOutlineXMark,
    HiOutlineEllipsisVertical,
    HiOutlineUser,
    HiOutlineCurrencyDollar,
    HiOutlineShoppingBag,
    HiOutlinePrinter,
    HiOutlineCheckCircle,
    HiOutlineTruck
} from 'react-icons/hi2';
import Header from '../components/Header';
import RecordOrderPaymentModal from '../components/orders/RecordOrderPaymentModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { formatCurrency } from '../utils/currency';

const styles = `
    .premium-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    .premium-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .premium-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
        animation: fadeIn 0.4s ease-out forwards;
    }

    .glass-effect {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }
`;

interface OrdersPageProps {
    onOpenSidebar?: () => void;
    storeSettings: StoreSettings;
    showSnackbar: (message: string, type: 'success' | 'error' | 'info' | 'sync') => void;
}

export default function OrdersPage({ storeSettings, showSnackbar }: OrdersPageProps) {
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
            showSnackbar('Failed to fetch orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (order: Sale) => {
        const remaining = Number(order.total) - Number(order.amountPaid || 0);
        if (remaining <= 0.01) {
            showSnackbar('Order is already fully paid.', 'info');
            return;
        }
        setPaymentOrder(order);
    };

    const handleSavePayment = async (order: Sale, payment: Omit<Payment, 'id'>) => {
        try {
            await api.post(`/sales/${order.transactionId}/payments`, payment);
            fetchOrders();
            if (selectedOrder && selectedOrder.transactionId === order.transactionId) {
                const updatedOrder = { ...selectedOrder, amountPaid: (Number(selectedOrder.amountPaid || 0) + Number(payment.amount)) };
                if (Number(updatedOrder.amountPaid) >= Number(updatedOrder.total)) {
                    updatedOrder.paymentStatus = 'paid';
                }
                setSelectedOrder(updatedOrder);
            }
            setPaymentOrder(null);
            showSnackbar('Payment recorded successfully!', 'success');
        } catch (error: any) {
            const errorMessage = error.body?.error || error.body?.message || error.message || 'Failed to record payment';
            showSnackbar(errorMessage, 'error');
        }
    };

    const proceedWithUpdateStatus = async (orderId: string, newStatus: NonNullable<Sale['fulfillmentStatus']>) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await api.put(`/sales/${orderId}/fulfillment`, { status: newStatus });
            fetchOrders();
            if (selectedOrder && selectedOrder.transactionId === orderId) {
                setSelectedOrder({ ...selectedOrder, fulfillmentStatus: newStatus });
            }
            showSnackbar(`Order marked as ${newStatus}!`, 'success');
        } catch (error: any) {
            const errorMessage = error.body?.error || error.body?.message || error.message || 'Failed to update status';
            showSnackbar(errorMessage, 'error');
        }
    };

    const updateStatus = (orderId: string, newStatus: NonNullable<Sale['fulfillmentStatus']>) => {
        setConfirmModal({
            isOpen: true,
            title: 'Update Order Status',
            message: `Are you sure you want to mark this order as ${newStatus}?`,
            onConfirm: () => proceedWithUpdateStatus(orderId, newStatus)
        });
    };

    const getStatusStyles = (status?: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'fulfilled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPaymentStatusStyles = (status?: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'partially_paid': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            (order.customerDetails?.name || order.customerName || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [orders, searchTerm]);

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'pending').length,
        revenue: orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.total) : 0), 0),
        avgOrderValue: orders.length > 0 ?
            orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0
    }), [orders]);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <style>{styles}</style>
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="flex w-full justify-between">
                    <h1 className="text-xl font-bold text-slate-900">Online Orders</h1>

                    {/* Status Pills */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl shrink-0">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map((status) => {
                            const isActive = filterStatus === status;
                            const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${isActive
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Header
                title="Online Orders"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                className="md:hidden"
            />

            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Metrics Bar */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white/50 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4 min-w-max">
                        {[
                            { label: 'Total', value: stats.total, color: 'slate' },
                            { label: 'Pending', value: stats.pending, color: 'amber' },
                            { label: 'Revenue', value: formatCurrency(stats.revenue, storeSettings), color: 'emerald' },
                            { label: 'Avg Value', value: formatCurrency(stats.avgOrderValue, storeSettings), color: 'indigo' }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col px-4 py-2 bg-white rounded-2xl border border-slate-200 min-w-[120px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                                <span className={`text-lg font-bold text-${s.color}-600`}>{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Tabs (Mobile Only) */}
                <div className="md:hidden px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/30">
                    {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filterStatus === status
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Orders List */}
                    <div className={`flex-1 flex flex-col min-w-0 ${selectedOrder ? 'hidden lg:flex lg:max-w-md border-r border-slate-200' : 'flex'}`}>
                        <div className="flex-1 overflow-y-auto premium-scrollbar p-6 space-y-3">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <HiOutlineShoppingBag className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No orders found</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <button
                                        key={order.transactionId}
                                        onClick={() => setSelectedOrder(order)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all animate-fadeIn ${selectedOrder?.transactionId === order.transactionId
                                            ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100'
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 tracking-tighter uppercase">#{order.transactionId.slice(-8)}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyles(order.fulfillmentStatus)}`}>
                                                {order.fulfillmentStatus || 'pending'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 truncate">
                                            {order.customerDetails?.name || order.customerName || 'Guest'}
                                        </h3>
                                        <div className="flex justify-between items-end mt-3">
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                {new Date(order.timestamp).toLocaleDateString()} • {order.cart.length} items
                                            </div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {formatCurrency(order.total, storeSettings)}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Order Details Panel */}
                    <div className={`flex-1 flex flex-col bg-white overflow-hidden ${selectedOrder ? 'flex' : 'hidden lg:flex items-center justify-center text-slate-300'}`}>
                        {selectedOrder ? (
                            <div className="flex flex-col h-full animate-fadeIn">
                                {/* Details Header */}
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedOrder(null)}
                                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600"
                                        >
                                            <HiOutlineXMark className="w-6 h-6" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                Order Details
                                                <span className="text-sm text-slate-400 font-normal">#{selectedOrder.transactionId.slice(-8)}</span>
                                            </h2>
                                            <p className="text-xs text-slate-400 font-medium">{new Date(selectedOrder.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">
                                            <HiOutlinePrinter className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">
                                            <HiOutlineEllipsisVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto premium-scrollbar p-8 space-y-8">
                                    {/* Status Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-2xl border ${getStatusStyles(selectedOrder.fulfillmentStatus)} flex items-center gap-3`}>
                                            <div className="p-2 bg-white/50 rounded-xl">
                                                <HiOutlineTruck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Fulfillment</p>
                                                <p className="text-sm font-bold">{selectedOrder.fulfillmentStatus || 'Pending'}</p>
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-2xl border ${getPaymentStatusStyles(selectedOrder.paymentStatus)} flex items-center gap-3`}>
                                            <div className="p-2 bg-white/50 rounded-xl">
                                                <HiOutlineCurrencyDollar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Payment</p>
                                                <p className="text-sm font-bold">{selectedOrder.paymentStatus || 'Pending'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Section */}
                                    <section>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Customer Information</h3>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                                <HiOutlineUser className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 truncate">{selectedOrder.customerDetails?.name || selectedOrder.customerName || 'Guest'}</p>
                                                <div className="mt-1 space-y-1">
                                                    <p className="text-xs text-slate-500 font-medium truncate">{selectedOrder.customerDetails?.email || 'No email'}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{selectedOrder.customerDetails?.phone || 'No phone'}</p>
                                                </div>
                                                {selectedOrder.customerDetails?.address && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 shadow-none">Delivery Address</p>
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedOrder.customerDetails.address}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Items Section */}
                                    <section>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Ordered Items</h3>
                                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="divide-y divide-slate-100">
                                                {selectedOrder.cart.map((item, idx) => (
                                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-xs text-slate-600 border border-slate-100">
                                                                {item.quantity}x
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900 leading-none mb-1">{item.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">SKU: {item.sku || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-slate-50/50 flex flex-col gap-2">
                                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(selectedOrder.total, storeSettings)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                                    <span>Discount</span>
                                                    <span>-</span>
                                                </div>
                                                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                                                    <span>Total</span>
                                                    <span>{formatCurrency(selectedOrder.total, storeSettings)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Payment Progress */}
                                    <section className="p-6 bg-slate-900 rounded-[32px] text-white overflow-hidden relative shadow-xl shadow-slate-200">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-end mb-6">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Payment Progress</p>
                                                    <h4 className="text-2xl font-bold flex items-center gap-2">
                                                        {formatCurrency(selectedOrder.amountPaid || 0, storeSettings)}
                                                        <span className="text-sm text-slate-500 font-normal"> / {formatCurrency(selectedOrder.total, storeSettings)}</span>
                                                    </h4>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    {selectedOrder.paymentStatus}
                                                </div>
                                            </div>

                                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                                    style={{ width: `${Math.min(100, (Number(selectedOrder.amountPaid || 0) / Number(selectedOrder.total)) * 100)}%` }}
                                                />
                                            </div>

                                            {selectedOrder.paymentStatus !== 'paid' && (
                                                <p className="text-xs text-slate-400 font-medium">Remaining: {formatCurrency(Number(selectedOrder.total) - Number(selectedOrder.amountPaid || 0), storeSettings)}</p>
                                            )}
                                        </div>
                                        {/* Abstract background shape */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    </section>
                                </div>

                                {/* Actions Footer */}
                                <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedOrder.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(selectedOrder)}
                                                className="col-span-1 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                            >
                                                <HiOutlineBanknotes className="w-5 h-5" />
                                                Record Payment
                                            </button>
                                        )}
                                        {selectedOrder.fulfillmentStatus === 'pending' && (
                                            <button
                                                onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                                className={`flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 ${selectedOrder.paymentStatus === 'paid' ? 'col-span-2' : 'col-span-1'}`}
                                            >
                                                <HiOutlineCheckCircle className="w-5 h-5" />
                                                Fulfill Order
                                            </button>
                                        )}
                                        {selectedOrder.fulfillmentStatus === 'fulfilled' && (
                                            <button
                                                onClick={() => updateStatus(selectedOrder.transactionId, 'shipped')}
                                                className={`flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 ${selectedOrder.paymentStatus === 'paid' ? 'col-span-2' : 'col-span-1'}`}
                                            >
                                                <HiOutlineTruck className="w-5 h-5" />
                                                Mark Shipped
                                            </button>
                                        )}
                                        {((selectedOrder.paymentStatus === 'paid' && (selectedOrder.fulfillmentStatus === 'shipped' || selectedOrder.fulfillmentStatus === 'cancelled'))) && (
                                            <div className="col-span-2 text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                Order Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <HiOutlineShoppingBag className="w-12 h-12" />
                                <p className="font-bold text-sm tracking-widest uppercase">Select an order to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
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
                confirmText="Update Status"
                confirmButtonClass="bg-[#0f172a] rounded-2xl font-bold uppercase tracking-widest text-xs"
                variant="floating"
            />
        </div>
    );
}