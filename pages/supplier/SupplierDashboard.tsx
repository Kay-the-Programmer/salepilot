import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sale } from '../../types';
import { HiOutlineShoppingBag, HiOutlineCurrencyDollar, HiOutlineClock } from 'react-icons/hi2';

export default function SupplierDashboard() {
    const [stats, setStats] = useState({
        pendingOrders: 0,
        totalSales: 0,
        revenue: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // In a real implementation, we would fetch orders where we are the supplier.
                // Assuming backend filters for us or we filter client side for now.
                // For MVP, we might need a specific endpoint or filter on /sales
                const sales = await api.get<Sale[]>('/sales');

                // Filter for sales that are "orders" to this supplier
                // Since we don't have a backend filter yet, we'll assume we see all sales for now 
                // BUT we need to filter by our store ID if we are a supplier.
                // The backend likely returns sales for the current store context.
                // If I am logged in as a supplier, my context is my store.

                const pending = sales.filter(s => s.paymentStatus !== 'paid' && s.fulfillmentStatus !== 'fulfilled').length;
                const revenue = sales.reduce((acc, sale) => acc + sale.total, 0);

                setStats({
                    pendingOrders: pending,
                    totalSales: sales.length,
                    revenue: revenue,
                });
                setRecentOrders(sales.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch supplier dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Supplier Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="liquid-glass-card rounded-[2rem] p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                        <HiOutlineShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    </div>
                </div>

                <div className="liquid-glass-card rounded-[2rem] p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <HiOutlineCurrencyDollar className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {/* Placeholder currency formatting */}
                            K{stats.revenue.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="liquid-glass-card rounded-[2rem] p-6 border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                        <HiOutlineClock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="liquid-glass-card rounded-[2rem] border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Recent Orders</h3>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentOrders.length > 0 ? (
                        recentOrders.map(order => (
                            <div key={order.transactionId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors active:scale-95 transition-all duration-300">
                                <div>
                                    <p className="font-semibold text-gray-900">Order #{order.transactionId.slice(-6)}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">K{order.total.toLocaleString()}</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">No recent orders found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
