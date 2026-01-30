import React from 'react';
import Header from '../Header';
import { HiMagnifyingGlass } from 'react-icons/hi2';

interface OrdersHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus
}) => {
    return (
        <>
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gray-50 sticky top-0 z-30">
                <div className="flex w-full justify-between items-center">
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

                    {/* Search Input - Desktop Only */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative w-64 shrink-0 shadow-lg p-1 rounded-3xl">
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
                </div>
            </div>

            {/* Mobile Header */}
            <Header
                title="Online Orders"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                className="md:hidden"
            />
        </>
    );
};

export default OrdersHeader;
