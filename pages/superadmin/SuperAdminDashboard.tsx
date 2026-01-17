import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
    UsersIcon,
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    ArrowTrendingUpIcon,
    ChevronRightIcon,
    ChartBarIcon,
    ClockIcon
} from '../../components/icons';

// Interfaces
interface RevenueSummary {
    totalAmount: number;
    count: number;
    byMonth: { month: string; amount: number; count: number; }[];
    growthPercentage?: number;
}

interface StoreStats {
    total: number;
    active: number;
    trial: number;
    inactive: number;
}

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    color: string;
}

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({ 
        total: 0, 
        active: 0, 
        trial: 0, 
        inactive: 0 
    });
    const [activeFilter, setActiveFilter] = useState<'1m' | '3m' | '6m' | '1y'>('6m');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [revResp, storesResp] = await Promise.all([
                    api.get<{ summary: RevenueSummary }>("/superadmin/revenue/summary"),
                    api.get<{ stores: any[] }>("/superadmin/stores")
                ]);

                setRevSummary(revResp.summary);

                const stores = storesResp.stores || [];
                setStoreStats({
                    total: stores.length,
                    active: stores.filter((s: any) => s.status === 'active').length,
                    trial: stores.filter((s: any) => s.subscriptionStatus === 'trial').length,
                    inactive: stores.filter((s: any) => s.status === 'inactive').length
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Filter months based on active filter
    const filteredMonths = React.useMemo(() => {
        if (!revSummary?.byMonth) return [];
        const months = revSummary.byMonth.slice(0, 12);
        
        switch (activeFilter) {
            case '1m': return months.slice(0, 1);
            case '3m': return months.slice(0, 3);
            case '6m': return months.slice(0, 6);
            case '1y': return months;
            default: return months.slice(0, 6);
        }
    }, [revSummary?.byMonth, activeFilter]);

    // Quick actions
    const quickActions: QuickAction[] = [
        {
            id: 'stores',
            title: 'Manage Stores',
            description: 'View and manage all stores',
            icon: <BuildingStorefrontIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/stores'),
            color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        },
        {
            id: 'revenue',
            title: 'Revenue Reports',
            description: 'Detailed revenue analytics',
            icon: <ChartBarIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/revenue'),
            color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
        },
        {
            id: 'trials',
            title: 'Trial Management',
            description: 'Manage trial stores',
            icon: <ClockIcon className="w-5 h-5" />,
            action: () => navigate('/superadmin/stores?filter=trial'),
            color: 'bg-amber-50 text-amber-600 hover:bg-amber-100'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-8">
                        {/* Header skeleton */}
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        
                        {/* Stats grid skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl p-6 h-40">
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <UsersIcon className="w-8 h-8 text-indigo-600" />
                            Dashboard Overview
                        </h1>
                        <p className="text-gray-600 mt-1">Welcome back, Super Admin. Here's what's happening with your platform.</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        Last updated: {new Date().toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Total Revenue */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <CurrencyDollarIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-indigo-100 font-medium">Total Revenue</span>
                                </div>
                                <div className="text-3xl font-bold mt-2">
                                    {formatCurrency(revSummary?.totalAmount || 0)}
                                </div>
                                <div className="mt-3 text-sm text-indigo-200 opacity-90">
                                    Lifetime revenue across all stores
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Stores */}
                    <div 
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate('/superadmin/stores?filter=active')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors`}>
                                <BuildingStorefrontIcon className="w-6 h-6" />
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Active Stores</h3>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{storeStats.active}</div>
                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-emerald-600 font-semibold">
                                {((storeStats.active / (storeStats.total || 1)) * 100).toFixed(0)}%
                            </span>
                            <span>of total stores</span>
                        </div>
                    </div>

                    {/* Trial Stores */}
                    <div 
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-amber-200 transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate('/superadmin/stores?filter=trial')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors`}>
                                <ClockIcon className="w-6 h-6" />
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Trial Stores</h3>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{storeStats.trial}</div>
                        <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Potential conversions</span>
                        </div>
                    </div>

                    {/* Total Stores */}
                    <div 
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate('/superadmin/stores')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors`}>
                                <BuildingStorefrontIcon className="w-6 h-6" />
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <h3 className="text-gray-600 text-sm font-medium">Total Stores</h3>
                        <div className="text-3xl font-bold text-gray-900 mt-2">{storeStats.total}</div>
                        <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">{storeStats.inactive} inactive</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={action.action}
                            className={`${action.color} rounded-xl p-5 text-left transition-all duration-300 hover:shadow-md border border-transparent hover:border-current/10`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 rounded-lg bg-white/50">
                                    {action.icon}
                                </div>
                                <ChevronRightIcon className="w-5 h-5 opacity-60" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                            <p className="text-sm opacity-75">{action.description}</p>
                        </button>
                    ))}
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Revenue Performance</h2>
                                <p className="text-gray-600 text-sm mt-1">Monthly revenue overview</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                {(['1m', '3m', '6m', '1y'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setActiveFilter(period)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            activeFilter === period
                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {period.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {filteredMonths.length > 0 ? (
                            <>
                                <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
                                    {filteredMonths.map((month, i) => {
                                        const max = Math.max(...filteredMonths.map(x => x.amount), 1);
                                        const height = (month.amount / max) * 100;
                                        return (
                                            <div 
                                                key={i} 
                                                className="flex-1 flex flex-col items-center gap-3 group"
                                            >
                                                <div className="w-full flex flex-col items-center relative">
                                                    <div 
                                                        style={{ height: `${height}%` }}
                                                        className="w-3/4 sm:w-full max-w-16 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-500 group-hover:from-indigo-600 group-hover:to-indigo-500"
                                                    ></div>
                                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                        <div className="font-semibold">{formatCurrency(month.amount)}</div>
                                                        <div className="text-gray-300 text-xs">{month.count} transactions</div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium truncate w-full text-center">
                                                    {month.month}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                                            <span>Revenue Amount</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-gray-200 rounded"></div>
                                            <span>Transaction Count</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                <ChartBarIcon className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm">No revenue data available</p>
                                <p className="text-xs mt-1">Revenue data will appear here once available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;