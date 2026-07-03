import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import SocketService from '../services/socketService';
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

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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

    // Real-time updates
    useEffect(() => {
        const storeId = storeSettings?.storeId;
        if (!storeId) return;

        const socketService = SocketService.getInstance();
        socketService.joinStore(storeId);

        const handleNewOrder = (data: any) => {
            console.log('Real-time order received:', data);
            showSnackbar('New online order received!', 'info');
            fetchOrders();
            onDataRefresh?.();
        };

        socketService.on('new_sale', handleNewOrder);
        socketService.on('new_order', handleNewOrder);

        return () => {
            socketService.off('new_sale', handleNewOrder);
            socketService.off('new_order', handleNewOrder);
            socketService.leaveStore(storeId);
        };
    }, [storeSettings?.storeId]);

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
        <div className="flex flex-col h-full bg-background">

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
                    <div className="flex-1 flex flex-col min-w-0 bg-background">
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
                        <div className="hidden xl:flex w-[450px] flex-col bg-surface border-l border-brand-border shadow-xl overflow-hidden animate-slide-in-right">
                            <div className="px-6 py-2 border-b border-brand-border flex items-center justify-between bg-surface sticky top-0 z-20">
                                <h2 className="text-lg font-bold text-brand-text">Order Details</h2>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-xl text-brand-text-muted hover:text-brand-text hover:bg-surface-variant transition-all border border-transparent hover:border-brand-border active:scale-95 duration-300"
                                >
                                    <HiOutlineXMark className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto premium-scrollbar p-6">
                                <OrderDetailContent order={selectedOrder} storeSettings={storeSettings} />
                            </div>

                            {/* Sideview Actions — orange is reserved for the money
                                "conversion" action, navy for standard flow steps. */}
                            <div className="p-6 border-t border-brand-border bg-surface-variant/50">
                                <div className="flex flex-col gap-3">
                                    {selectedOrder.paymentStatus !== 'paid' && (
                                        <button
                                            onClick={() => handleMarkAsPaid(selectedOrder)}
                                            className="w-full py-3 bg-sp-orange hover:bg-sp-orange-light text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 active:scale-95 duration-300"
                                        >
                                            <HiOutlineBanknotes className="w-5 h-5" />
                                            Record Payment
                                        </button>
                                    )}

                                    {selectedOrder.fulfillmentStatus === 'pending' && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                            className="w-full py-3 bg-sp-navy hover:bg-sp-navy-light text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 active:scale-95 duration-300"
                                        >
                                            <HiOutlineCheckCircle className="w-5 h-5" />
                                            Fulfill Order
                                        </button>
                                    )}

                                    {selectedOrder.fulfillmentStatus === 'fulfilled' && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder.transactionId, 'shipped')}
                                            className="w-full py-3 bg-sp-navy hover:bg-sp-navy-light text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 active:scale-95 duration-300"
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
                confirmButtonClass="bg-sp-navy hover:bg-sp-navy-light rounded-lg font-bold uppercase tracking-widest text-xs"
                variant="floating"
            />
        </div>
    );
}
