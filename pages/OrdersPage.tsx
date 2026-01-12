import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import {
    HiOutlineShoppingBag,
    HiMagnifyingGlass
} from 'react-icons/hi2';
import Header from '../components/Header';
import RecordOrderPaymentModal from '../components/orders/RecordOrderPaymentModal';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
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
    onDataRefresh?: () => void;
}

export default function OrdersPage({ storeSettings, showSnackbar, onDataRefresh }: OrdersPageProps) {
    const [orders, setOrders] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [paymentOrder, setPaymentOrder] = useState<Sale | null>(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);

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
    }, [filterStatus, page, pageSize]);

    // Reset page when filter changes
    useEffect(() => {
        setPage(1);
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({ channel: 'online' });
            if (filterStatus !== 'all') {
                queryParams.append('fulfillmentStatus', filterStatus);
            }

            queryParams.append('page', String(page));
            queryParams.append('limit', String(pageSize));

            const response = await api.get<any>(`/sales?${queryParams.toString()}`);
            if (Array.isArray(response)) {
                setOrders(response);
                setTotal(response.length);
            } else {
                setOrders(response.items);
                setTotal(response.total);
            }
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
            onDataRefresh?.();
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
            onDataRefresh?.();
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
        total: total || orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'pending').length, // Note: This only counts pending in current page/fetch if not supported by API stats endpoint
        revenue: orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.total) : 0), 0),
        avgOrderValue: orders.length > 0 ?
            orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0
    }), [orders, total]);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            <style>{styles}</style>
            {/* Desktop Header */}
            <div className="hidden md:flex  items-center justify-between px-6 py-4 bg-gray-50 sticky top-0 z-30">
                <div className="flex w-full justify-between">
                    <h1 className="text-xl font-bold text-slate-900">Online Orders</h1>

                    {/* Status Pills */}
                    <div className="flex bg-slate-100/80 border border-white shadow-lg p-1 rounded-3xl shrink-0">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map((status) => {
                            const isActive = filterStatus === status;
                            const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-1.5 rounded-2xl text-sm font-bold transition-all duration-200 ${isActive
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

            <main className="flex-1 overflow-hidden p-0 flex flex-col">
                {/* Metrics Bar */}
                <div className="px-6 py-4 border-slate-200 bg-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="overflow-x-auto no-scrollbar shadow-lg rounded-2xl p-1  w-full md:w-auto">
                        <div className="flex items-center  gap-4 min-w-max">
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

                    {/* Search Input - Desktop Only */}
                    <div className="hidden md:flex relative w-64 shrink-0 shadow-lg p-1 rounded-3xl">
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-3xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                    {/* Orders List - Full Width */}
                    <div className="flex-1 flex flex-col min-w-0">
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
                                        className={`w-full text-left p-4 rounded-2xl border transition-all animate-fadeIn bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    #{order.transactionId.slice(-4)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 truncate">
                                                        {order.customerDetails?.name || order.customerName || 'Guest'}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                                                        {new Date(order.timestamp).toLocaleDateString()} • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyles(order.fulfillmentStatus)}`}>
                                                    {order.fulfillmentStatus?.replace('_', ' ') || 'pending'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getPaymentStatusStyles(order.paymentStatus)}`}>
                                                    {order.paymentStatus?.replace('_', ' ') || 'pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-3 pl-13">
                                            <div className="text-xs text-slate-500 font-medium">
                                                {order.cart.length} items
                                            </div>
                                            <div className="text-lg font-bold text-slate-900">
                                                {formatCurrency(order.total, storeSettings)}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {total > 0 && (
                            <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Page Info */}
                                    <div className="text-sm text-slate-500 font-medium">
                                        Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> - <span className="text-slate-900 font-bold">{Math.min(page * pageSize, total)}</span> of <span className="text-slate-900 font-bold">{total}</span> orders
                                    </div>

                                    {/* Controls */}
                                    <div className="flex items-center gap-3">
                                        {/* Rows per page */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-slate-500 font-medium hidden sm:block">Rows:</label>
                                            <div className="relative">
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(parseInt(e.target.value, 10));
                                                        setPage(1);
                                                    }}
                                                    className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all hover:border-slate-300"
                                                >
                                                    {[10, 20, 50, 100].map(sz => (
                                                        <option key={sz} value={sz}>{sz}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pagination Buttons */}
                                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                            <button
                                                className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page <= 1}
                                            >
                                                Prev
                                            </button>
                                            <div className="px-3 py-1.5 text-sm font-bold text-slate-900 min-w-[30px] text-center">
                                                {page}
                                            </div>
                                            <button
                                                className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-all"
                                                onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))}
                                                disabled={page * pageSize >= total}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <OrderDetailsModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
                orders={orders}
                storeSettings={storeSettings}
                onRecordPayment={handleMarkAsPaid}
                onUpdateStatus={updateStatus}
            />

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