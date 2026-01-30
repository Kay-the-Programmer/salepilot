import React from 'react';
import ChartBarIcon from '../../icons/ChartBarIcon';
import { StoreSettings } from '../../../types';
import { formatCurrency } from '../../../utils/currency';

interface DailySalesSummaryProps {
    dailySales: { date: string; totalRevenue: number; totalQuantity: number; items: { name: string; quantity: number; revenue: number }[] }[];
    mobileView: 'summary' | 'history';
    storeSettings: StoreSettings;
}

export default function DailySalesSummary({ dailySales, mobileView, storeSettings }: DailySalesSummaryProps) {
    if (!dailySales || dailySales.length === 0) return null;

    return (
        <div className={`mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${mobileView === 'summary' ? 'block' : 'hidden md:block'}`}>
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                            <ChartBarIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Daily Sales Breakdown</h3>
                            <p className="text-sm text-gray-500">Product performance by day</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        {dailySales.length} day{dailySales.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {dailySales.map(day => (
                    <div key={day.date} className="hover:bg-gray-50/50 transition-colors">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="font-semibold text-gray-900">
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600">
                                        <span className="font-semibold">{day.totalQuantity.toLocaleString()}</span> units
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {formatCurrency(day.totalRevenue, storeSettings)}
                                    </span>
                                </div>
                            </div>

                            {/* Product Items */}
                            <div className="space-y-2">
                                {day.items.slice(0, 3).map((item, idx) => (
                                    <div key={item.name + idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-600 font-medium">{item.quantity}</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(item.revenue, storeSettings)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {day.items.length > 3 && (
                                    <div className="text-center">
                                        <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                                            + {day.items.length - 3} more products
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
