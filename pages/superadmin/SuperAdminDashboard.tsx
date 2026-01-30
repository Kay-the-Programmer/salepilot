
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { RevenueSummary, StoreStats } from '../../types';

// Components
import DashboardHeader from '../../components/superadmin/dashboard/DashboardHeader';
import DashboardStatsGrid from '../../components/superadmin/dashboard/DashboardStatsGrid';
import DashboardQuickActions from '../../components/superadmin/dashboard/DashboardQuickActions';
import DashboardRevenueChart from '../../components/superadmin/dashboard/DashboardRevenueChart';

const SuperAdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({
        total: 0,
        active: 0,
        trial: 0,
        inactive: 0
    });

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
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

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
                <DashboardHeader />

                {/* Stats Grid */}
                <DashboardStatsGrid
                    revSummary={revSummary}
                    storeStats={storeStats}
                    formatCurrency={formatCurrency}
                />

                {/* Quick Actions */}
                <DashboardQuickActions />

                {/* Revenue Chart */}
                <DashboardRevenueChart
                    revSummary={revSummary}
                    formatCurrency={formatCurrency}
                />
            </div>
        </div>
    );
};

export default SuperAdminDashboard;