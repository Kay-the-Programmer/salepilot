import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sale } from '../../types';

export default function SupplierOrdersPage() {
    const [orders, setOrders] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await api.get<Sale[]>('/sales');
            // Check if backend filtering is needed or already present
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setIsLoading(false);
        }
    };



    if (isLoading) return <div className="p-8 text-center">Loading orders...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Incoming Orders</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Order ID</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Customer</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Items</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Total</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                            <tr key={order.transactionId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-900 font-medium">#{order.transactionId.slice(-6)}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(order.timestamp).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-gray-900">{order.customerDetails?.name || 'Guest'}</td>
                                <td className="px-6 py-4 text-gray-900">{order.cart.length} items</td>
                                <td className="px-6 py-4 text-gray-900 font-bold">K{order.total.toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 text-green-700' :
                                        order.fulfillmentStatus === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {order.fulfillmentStatus || 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
}
