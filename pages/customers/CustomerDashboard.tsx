import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sale } from '../../types';
import { HiOutlineShoppingBag, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';

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
            case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
            case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'processing': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <HiOutlineCheckCircle className="w-5 h-5" />;
            case 'shipped': return <HiOutlineTruck className="w-5 h-5" />;
            case 'processing': return <HiOutlineClock className="w-5 h-5" />; // Or a spinner icon
            default: return <HiOutlineShoppingBag className="w-5 h-5" />;
        }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto font-sans">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Orders</h1>
                <p className="text-slate-500 font-medium">Track your recent purchases and delivery status.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <HiOutlineShoppingBag className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
                    <p className="text-slate-500 text-sm mt-1">Start shopping to see your orders here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.transactionId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-slate-50 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Order #{order.transactionId.substring(0, 8)}</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        Sold by <span className="text-slate-700 font-bold">{order.storeName}</span> • {new Date(order.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.fulfillmentStatus || 'processing')}`}>
                                    {getStatusIcon(order.fulfillmentStatus || 'processing')}
                                    <span className="uppercase tracking-wider">{order.fulfillmentStatus || 'Processing'}</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-3">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <span className="font-medium text-slate-700">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-900">${Number(item.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end items-center gap-4">
                                    <span className="text-sm text-slate-500 font-medium">Total Amount</span>
                                    <span className="text-xl font-black text-slate-900">${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
