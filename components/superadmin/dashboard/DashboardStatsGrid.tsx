
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrencyDollarIcon, BuildingStorefrontIcon, ChevronRightIcon, ClockIcon } from '../../icons';
import { RevenueSummary, StoreStats } from '../../../types';

interface DashboardStatsGridProps {
    revSummary: RevenueSummary | null;
    storeStats: StoreStats;
    formatCurrency: (amount: number) => string;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ revSummary, storeStats, formatCurrency }) => {
    const navigate = useNavigate();

    return (
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
    );
};

export default DashboardStatsGrid;
