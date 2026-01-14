import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  HiOutlineShoppingBag, 
  HiOutlineTruck, 
  HiOutlineCheckCircle, 
  HiOutlineClock, 
  HiChevronRight,
  HiOutlineXCircle,
  HiOutlineInformationCircle 
} from 'react-icons/hi2';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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

  const getStatusConfig = (status: string) => {
    const configs = {
      delivered: {
        color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        icon: <HiOutlineCheckCircle className="w-4 h-4" />,
        label: 'Delivered'
      },
      shipped: {
        color: 'text-blue-700 bg-blue-50 border-blue-100',
        icon: <HiOutlineTruck className="w-4 h-4" />,
        label: 'Shipped'
      },
      processing: {
        color: 'text-amber-700 bg-amber-50 border-amber-100',
        icon: <HiOutlineClock className="w-4 h-4" />,
        label: 'Processing'
      },
      cancelled: {
        color: 'text-rose-700 bg-rose-50 border-rose-100',
        icon: <HiOutlineXCircle className="w-4 h-4" />,
        label: 'Cancelled'
      }
    };
    return configs[status as keyof typeof configs] || {
      color: 'text-slate-600 bg-slate-50 border-slate-100',
      icon: <HiOutlineShoppingBag className="w-4 h-4" />,
      label: 'Pending'
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.fulfillmentStatus === filter);

  const statusFilters = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'processing', label: 'Processing', count: orders.filter(o => o.fulfillmentStatus === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.fulfillmentStatus === 'shipped').length },
    { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.fulfillmentStatus === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.fulfillmentStatus === 'cancelled').length }
  ];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Order History
              </h1>
              <p className="text-slate-500 text-sm sm:text-base">
                Track and manage your purchases
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/directory'}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow"
              >
                Shop More
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {statusFilters.map((status) => (
              <button
                key={status.id}
                onClick={() => setFilter(status.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === status.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {status.label}
                {status.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    filter === status.id 
                      ? 'bg-slate-700 text-slate-200' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {status.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-50 rounded-xl h-80"></div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            </h3>
            <p className="text-slate-500 mb-8">
              {filter === 'all' 
                ? "You haven't made any purchases yet. Start shopping to see your orders here."
                : `You don't have any ${filter} orders at the moment.`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                View all orders <HiChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Orders Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const status = getStatusConfig(order.fulfillmentStatus || 'processing');
              
              return (
                <div
                  key={order.transactionId}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                          Order #{order.transactionId.substring(0, 8)}
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(order.timestamp)}
                        </p>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${status.color}`}>
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                    </div>
                    
                    {/* Store Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <HiOutlineInformationCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600 truncate">
                        Sold by <span className="font-medium text-slate-900">{order.storeName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-5">
                    <div className="space-y-3">
                      {order.items && order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-6 h-6 bg-slate-100 rounded text-xs font-medium text-slate-700 flex items-center justify-center flex-shrink-0">
                              {item.quantity}
                            </div>
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-slate-900 flex-shrink-0 ml-4">
                            {formatCurrency(Number(item.price))}
                          </span>
                        </div>
                      ))}
                      
                      {order.items && order.items.length > 3 && (
                        <div className="pt-2">
                          <span className="text-xs font-medium text-slate-500">
                            + {order.items.length - 3} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="p-5 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(Number(order.total))}
                        </p>
                      </div>
                      <button className="text-sm font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                        View Details
                        <HiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {!isLoading && orders.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
                <p className="text-sm text-slate-500">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => o.fulfillmentStatus === 'delivered').length}
                </p>
                <p className="text-sm text-slate-500">Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(0)}
                </p>
                <p className="text-sm text-slate-500">Total Spent ($)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter(o => 
                    ['processing', 'shipped'].includes(o.fulfillmentStatus)
                  ).length}
                </p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}