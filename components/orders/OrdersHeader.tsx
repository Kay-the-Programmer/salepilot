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
            <div className="hidden md:flex items-center justify-between px-6 py-4 bg-background sticky top-0 z-30 transition-colors">
                <div className="flex w-full justify-between items-center">
                    <h1 className="text-xl font-bold text-brand-text">Online Orders</h1>

                    {/* Status Pills */}
                    <div className="flex bg-surface-variant border border-brand-border p-1 rounded-full shrink-0">
                        {['all', 'pending', 'fulfilled', 'shipped', 'cancelled'].map((status) => {
                            const isActive = filterStatus === status;
                            const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${isActive
                                        ? 'bg-sp-navy text-white shadow-sm'
                                        : 'text-brand-text-muted hover:text-brand-text'
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Input - Desktop Only */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative w-64 shrink-0">
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-brand-border rounded-lg text-sm font-medium text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-sp-orange focus:ring-1 focus:ring-sp-orange transition-all shadow-sm"
                            />
                            <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
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
