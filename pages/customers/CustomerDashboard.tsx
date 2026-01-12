import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { HiOutlineShoppingBag, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineClock, HiChevronRight } from 'react-icons/hi2';

export default function CustomerDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await api.get<any[]>('/marketplace/my-orders');
                setOrders(data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
            case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'processing': return 'text-orange-700 bg-orange-50 border-orange-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <HiOutlineCheckCircle className="w-4 h-4" />;
            case 'shipped': return <HiOutlineTruck className="w-4 h-4" />;
            case 'processing': return <HiOutlineClock className="w-4 h-4" />;
            default: return <HiOutlineShoppingBag className="w-4 h-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 md:mb-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">My Orders</h1>
                    <p className="text-slate-500 font-medium text-lg">Track and manage your recent purchases.</p>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-64 animate-pulse">
                                <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
                                <div className="h-8 bg-slate-100 rounded w-1/2 mb-8"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                                    <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500">
                            <HiOutlineShoppingBag className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No orders placed yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">Looks like you haven't made any purchases. Explore our marketplace to find great products.</p>
                        <button
                            onClick={() => window.location.href = '/directory'}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-200"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map((order) => (
                            <div
                                key={order.transactionId}
                                className="group bg-white rounded-3xl p-0 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-blue-100 transition-all duration-300 flex flex-col"
                            >
                                {/* Card Header */}
                                <div className="p-6 pb-4 border-b border-slate-50 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order</span>
                                            <span className="text-sm font-black text-slate-800 font-mono">#{order.transactionId.substring(0, 8)}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {new Date(order.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.fulfillmentStatus || 'processing')}`}>
                                        {getStatusIcon(order.fulfillmentStatus || 'processing')}
                                        <span className="uppercase tracking-wider">{order.fulfillmentStatus || 'Processing'}</span>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="p-6 flex-1 bg-slate-50/30">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            <span>Items</span>
                                            <span>Price</span>
                                        </div>
                                        {order.items && order.items.slice(0, 3).map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center group/item">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-sm">
                                                        {item.quantity}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 max-w-[150px] sm:max-w-xs truncate">{item.name}</span>
                                                </div>
                                                <span className="font-bold text-slate-900">${Number(item.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {order.items && order.items.length > 3 && (
                                            <div className="pt-2">
                                                <span className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                                                    + {order.items.length - 3} more items
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 pt-4 bg-white border-t border-slate-50 rounded-b-3xl">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tight">${Number(order.total).toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-400 mb-1">Sold by <span className="text-slate-700 font-bold">{order.storeName}</span></p>
                                            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">
                                                View Details <HiChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
