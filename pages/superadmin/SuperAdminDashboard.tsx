import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import {
    UsersIcon,
    CurrencyDollarIcon,
    BuildingStorefrontIcon,
    ArrowTrendingUpIcon
} from '../../components/icons';

// Re-using interfaces or defining new ones localized for now
interface RevenueSummary {
    totalAmount: number;
    count: number;
    byMonth: { month: string; amount: number; count: number; }[];
}

interface StoreStats {
    total: number;
    active: number;
    trial: number;
}

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({ total: 0, active: 0, trial: 0 });

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
                    trial: stores.filter((s: any) => s.subscriptionStatus === 'trial').length
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-96 text-indigo-600 animate-pulse">Loading dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <UsersIcon className="w-6 h-6 text-gray-500 mr-2 inline-block" />
                    Dashboard Overview
                    <p className="text-sm text-gray-500 mt-1">Welcome back, Super Admin.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CurrencyDollarIcon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <CurrencyDollarIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-indigo-100 font-medium text-sm">Total Revenue</span>
                        </div>
                        <div className="text-3xl font-bold mt-2">
                            ${revSummary?.totalAmount.toFixed(2) || '0.00'}
                        </div>
                        <div className="mt-4 text-xs text-indigo-200">
                            Lifetime revenue across all stores
                        </div>
                    </div>
                </div>

                {/* Active Stores */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/superadmin/stores')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <BuildingStorefrontIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Real-time</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Active Stores</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{storeStats.active}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        <span className="text-emerald-600 font-medium">{(storeStats.active / (storeStats.total || 1) * 100).toFixed(0)}%</span> of {storeStats.total} total registered
                    </div>
                </div>

                {/* Growth / Trials */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/superadmin/stores')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <ArrowTrendingUpIcon className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Stores on Trial</h3>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{storeStats.trial}</div>
                    <div className="mt-2 text-xs text-gray-500">
                        Potential conversions
                    </div>
                </div>
            </div>

            {/* Revenue Chart / Detailed Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue Performance</h2>
                {/* Simple Bar Chart Visualization */}
                <div className="h-64 flex items-end justify-between gap-2">
                    {revSummary?.byMonth.slice(0, 12).map((m, i) => {
                        const max = Math.max(...revSummary.byMonth.map(x => x.amount), 1);
                        const height = (m.amount / max) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-indigo-50 rounded-t-lg relative h-full flex items-end overflow-hidden">
                                    <div
                                        style={{ height: `${height}%` }}
                                        className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-600"
                                    ></div>
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        ${Number(m.amount).toFixed(2)}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium truncate w-full text-center">{m.month}</span>
                            </div>
                        )
                    })}
                    {(!revSummary?.byMonth || revSummary.byMonth.length === 0) && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No revenue data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
