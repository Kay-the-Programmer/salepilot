import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sale } from '../types';
import { HiOutlineEye, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OrdersPage: React.FC = () => {
    // const { user } = useAuth(); // Not strictly needed if token used directly
    const [orders, setOrders] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params: any = { channel: 'online' };
            if (filterStatus !== 'all') {
                params.fulfillmentStatus = filterStatus;
            }

            const response = await axios.get(`${API_URL}/sales`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            // Backend returns { items: [], total, ... } if paginated, or [] if not
            // Our getSales controller returns paginated object if limit is present, else array. 
            // Current call sends no limit, so array.
            // However, type check is good.
            const data = Array.isArray(response.data) ? response.data : response.data.items;
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/sales/${orderId}/fulfillment`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchOrders();
            if (selectedOrder && selectedOrder.transactionId === orderId) {
                setSelectedOrder(null); // Close modal
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'fulfilled': return 'bg-green-100 text-green-800';
            case 'shipped': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Online Orders
                        </h2>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex space-x-4">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${filterStatus === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading orders...</td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No orders found.</td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.transactionId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                                #{order.transactionId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {order.customerDetails?.name || order.customerName || 'Guest'}
                                                <div className="text-xs text-gray-500">{order.customerDetails?.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.fulfillmentStatus)}`}>
                                                    {order.fulfillmentStatus || 'fulfilled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="View Details"
                                                >
                                                    <HiOutlineEye className="w-5 h-5" />
                                                </button>
                                                {order.fulfillmentStatus === 'pending' && (
                                                    <button
                                                        onClick={() => updateStatus(order.transactionId, 'fulfilled')}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Mark as Fulfilled"
                                                    >
                                                        <HiOutlineCheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {order.fulfillmentStatus !== 'cancelled' && (
                                                    <button
                                                        onClick={() => updateStatus(order.transactionId, 'cancelled')}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Cancel Order"
                                                    >
                                                        <HiOutlineXCircle className="w-5 h-5" />
                                                    </button>
                                                )}
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
                <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedOrder(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            Order Details #{selectedOrder.transactionId}
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700">Customer</h4>
                                                <p className="text-sm text-gray-600">{selectedOrder.customerDetails?.name || selectedOrder.customerName}</p>
                                                <p className="text-sm text-gray-600">{selectedOrder.customerDetails?.email}</p>
                                                <p className="text-sm text-gray-600">{selectedOrder.customerDetails?.phone}</p>
                                                <p className="text-sm text-gray-600 italic mt-1 bg-gray-50 p-2 rounded">
                                                    {selectedOrder.customerDetails?.address}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-gray-700">Items</h4>
                                                <ul className="divide-y divide-gray-200 mt-2 border-t border-b border-gray-200">
                                                    {selectedOrder.cart.map((item, idx) => (
                                                        <li key={idx} className="py-2 flex justify-between text-sm">
                                                            <span>{item.quantity}x {item.name}</span>
                                                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex justify-between font-bold text-gray-900 pt-2">
                                                <span>Total</span>
                                                <span>${selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Close
                                </button>
                                {selectedOrder.fulfillmentStatus === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => updateStatus(selectedOrder.transactionId, 'fulfilled')}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Mark Fulfilled
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
