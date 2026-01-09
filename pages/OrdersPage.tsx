import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import {
    HiOutlineEye,
    HiOutlineXCircle,
    HiOutlineBanknotes,
    HiOutlineChevronRight,
    HiOutlineEllipsisVertical,
    HiOutlineUser,
    HiOutlineCalendar,
    HiOutlineCurrencyDollar,
    HiOutlineShoppingBag,
    HiOutlineFunnel,
    HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
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

    // Enhanced stats calculation with more metrics
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'pending').length,
        revenue: orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.total) : 0), 0),
        avgOrderValue: orders.length > 0 ?
            orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0
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
            showSnackbar('Failed to fetch orders', 'error');
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
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'fulfilled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getPaymentStatusColor = (status?: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const filteredOrders = orders.filter(order =>
        (order.customerDetails?.name || order.customerName || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex flex-col">
            <Header
                title="Online Orders"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                hideSearchOnMobile={false}
            />

            {/* Enhanced Stats Cards */}
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Total Orders</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <HiOutlineShoppingBag className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-500">Online channel</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Pending Orders</p>
                                    <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                                </div>
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                                    <HiOutlineCalendar className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-500">
                                    {stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}% of total` : 'No orders'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Revenue</p>
                                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue, storeSettings)}</p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                    <HiOutlineCurrencyDollar className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-500">
                                    Avg: {formatCurrency(stats.avgOrderValue, storeSettings)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 mb-1">Actions Needed</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {orders.filter(o => o.paymentStatus !== 'paid' || o.fulfillmentStatus === 'pending').length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                                    <HiOutlineFunnel className="w-6 h-6 text-rose-600" />
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs font-medium text-slate-500">Require attention</span>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Filter Bar */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="w-full sm:w-auto">
                                <div className="relative">
                                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search orders or customers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full sm:w-80 pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-600 hidden sm:block">Status:</span>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap ${filterStatus === status
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {status === 'all' ? 'All Orders' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-grow pb-12">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-medium text-slate-600">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <HiOutlineShoppingBag className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No Orders Found</h3>
                        <p className="text-slate-500 mb-8">Try adjusting your search or filter criteria</p>
                        <button
                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Grid Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.transactionId}
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                    #{order.transactionId.slice(-6)}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-1 rounded border ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-semibold text-slate-900 mb-1">
                                                {order.customerDetails?.name || order.customerName || 'Guest'}
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-slate-900">
                                                {formatCurrency(order.total, storeSettings)}
                                            </p>
                                            <span className={`text-xs font-medium mt-1 px-2 py-1 rounded inline-block ${getStatusColor(order.fulfillmentStatus)}`}>
                                                {order.fulfillmentStatus || 'pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <HiOutlineUser className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600">
                                                {order.cart.length} item{order.cart.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500">View details</span>
                                            <HiOutlineChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.map((order) => (
                                            <tr
                                                key={order.transactionId}
                                                className="hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        #{order.transactionId.slice(-8)}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {order.cart.length} items
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                            <HiOutlineUser className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {order.customerDetails?.name || order.customerName || 'Guest'}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {order.customerDetails?.email || 'No email'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-slate-900">
                                                        {new Date(order.timestamp).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {formatCurrency(order.total, storeSettings)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {order.paymentStatus === 'paid' ? 'Paid' : `Due: ${formatCurrency(Number(order.total) - Number(order.amountPaid || 0), storeSettings)}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                        {order.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(order.fulfillmentStatus)}`}>
                                                        {order.fulfillmentStatus || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <HiOutlineEye className="w-5 h-5" />
                                                        </button>
                                                        {order.paymentStatus !== 'paid' && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(order)}
                                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                title="Record Payment"
                                                            >
                                                                <HiOutlineBanknotes className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => updateStatus(order.transactionId, 'fulfilled')}
                                                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                            title="More options"
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
                        </div>
                    </>
                )}
            </div>

            {/* Enhanced Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedOrder(null)}
                    />
                    <div className="relative h-full w-full max-w-2xl bg-white shadow-xl animate-in slide-in-from-right duration-300 overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                                    <p className="text-sm text-slate-600 mt-1">
                                        #{selectedOrder.transactionId} • {new Date(selectedOrder.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <HiOutlineXCircle className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow p-6 space-y-6">
                            {/* Customer Info */}
                            <div className="bg-slate-50 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Customer Information</h3>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <HiOutlineUser className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-medium text-slate-900">
                                            {selectedOrder.customerDetails?.name || selectedOrder.customerName || 'Guest Customer'}
                                        </p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            {selectedOrder.customerDetails?.email || 'No email provided'}
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            {selectedOrder.customerDetails?.phone || 'No phone number'}
                                        </p>
                                        {selectedOrder.customerDetails?.address && (
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                <p className="text-sm font-medium text-slate-900">Shipping Address</p>
                                                <p className="text-sm text-slate-600 mt-1">{selectedOrder.customerDetails.address}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-white border border-slate-100 rounded-xl">
                                <div className="p-5 border-b border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">Order Items</h3>
                                        <span className="text-sm text-slate-600">{selectedOrder.cart.length} items</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {selectedOrder.cart.map((item, idx) => (
                                        <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-sm font-medium text-slate-600">{item.quantity}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {formatCurrency(Number(item.price), storeSettings)} each
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">
                                                    {formatCurrency(Number(item.price) * (item.quantity || 1), storeSettings)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-slate-900 rounded-xl p-6 text-white">
                                <h3 className="text-sm font-semibold text-slate-200 mb-4">Payment Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-300">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(selectedOrder.total, storeSettings)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-300">Amount Paid</span>
                                        <span className="font-medium text-emerald-400">-{formatCurrency(selectedOrder.amountPaid || 0, storeSettings)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-slate-200">Balance Due</span>
                                            <span className="text-xl font-bold">
                                                {formatCurrency(Number(selectedOrder.total) - Number(selectedOrder.amountPaid || 0), storeSettings)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Status */}
                            <div className="bg-white border border-slate-100 rounded-xl p-5">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Payment Status</p>
                                        <span className={`text-sm font-medium px-3 py-1.5 rounded-lg ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Fulfillment Status</p>
                                        <span className={`text-sm font-medium px-3 py-1.5 rounded-lg ${getStatusColor(selectedOrder.fulfillmentStatus)}`}>
                                            {selectedOrder.fulfillmentStatus || 'pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6">
                            <div className="grid grid-cols-2 gap-3">
                                {selectedOrder.paymentStatus !== 'paid' && (
                                    <button
                                        onClick={() => handleMarkAsPaid(selectedOrder)}
                                        className="bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                                    >
                                        Record Payment
                                    </button>
                                )}
                                {selectedOrder.fulfillmentStatus === 'pending' && (
                                    <button
                                        onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                        className={`${selectedOrder.paymentStatus === 'paid' ? 'col-span-2' : ''} bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors`}
                                    >
                                        Fulfill Order
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className={`${(selectedOrder.paymentStatus === 'paid' && selectedOrder.fulfillmentStatus !== 'pending') ? 'col-span-2' : ''} bg-slate-100 text-slate-900 py-3 px-4 rounded-xl font-medium hover:bg-slate-200 transition-colors`}
                                >
                                    Close
                                </button>
                            </div>
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
                confirmButtonClass="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                variant="floating"
            />
        </div>
    );
};

export default OrdersPage;