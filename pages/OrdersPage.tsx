import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Sale, StoreSettings, Payment } from '../types';
import RecordOrderPaymentModal from '../components/orders/RecordOrderPaymentModal';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/ui/Pagination';

// New Modular Components
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersMetrics from '../components/orders/OrdersMetrics';
import OrdersFilterBar from '../components/orders/OrdersFilterBar';
import OrdersList from '../components/orders/OrdersList';
import OrderDetailContent from '../components/orders/OrderDetailContent';
import { HiOutlineXMark, HiOutlineBanknotes, HiOutlineCheckCircle, HiOutlineTruck } from 'react-icons/hi2';



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

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            (order.customerDetails?.name || order.customerName || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [orders, searchTerm]);

    const stats = useMemo(() => ({
        total: total || orders.length,
        pending: orders.filter(o => o.fulfillmentStatus === 'pending').length,
        revenue: orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? Number(o.total) : 0), 0),
        avgOrderValue: orders.length > 0 ?
            orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length : 0
    }), [orders, total]);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

            <OrdersHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
            />

            <main className="flex-1 overflow-hidden p-0 flex flex-col">


                <OrdersFilterBar
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                <div className="flex-1 flex overflow-hidden p-0">
                    {/* Orders List Content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
                        <div className="flex-1 overflow-y-auto premium-scrollbar p-0">
                            <OrdersMetrics
                                stats={stats}
                                storeSettings={storeSettings}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                            />
                            <OrdersList
                                orders={filteredOrders}
                                viewMode={viewMode}
                                loading={loading}
                                onOrderClick={setSelectedOrder}
                                storeSettings={storeSettings}
                                selectedOrderId={selectedOrder?.transactionId}
                            />
                        </div>

                        <Pagination
                            total={total}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            label="orders"
                        />
                    </div>

                    {/* Desktop Sideview */}
                    {selectedOrder && (
                        <div className="hidden xl:flex w-[450px] flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-slide-in-right">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-20">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                >
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto premium-scrollbar p-6">
                                <OrderDetailContent order={selectedOrder} storeSettings={storeSettings} />
                            </div>

                            {/* Sideview Actions */}
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex flex-col gap-3">
                                    {selectedOrder.paymentStatus !== 'paid' && (
                                        <button
                                            onClick={() => handleMarkAsPaid(selectedOrder)}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}

                                    {selectedOrder.fulfillmentStatus === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}

                                    {selectedOrder.fulfillmentStatus === 'fulfilled' && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder.transactionId, 'shipped')}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <HiOutlineTruck className="w-5 h-5" />
                                            Mark Shipped
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Modal */}
            <OrderDetailsModal
                isOpen={!!selectedOrder && (typeof window !== 'undefined' && window.innerWidth < 1280)}
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
