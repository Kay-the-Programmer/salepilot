
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
        <div className={`mb-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[32px] ring-1 ring-slate-900/5 dark:ring-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden ${mobileView === 'summary' ? 'block' : 'hidden md:block'}`}>
            <div className="p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/50 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 rounded-[18px] text-orange-600 dark:text-orange-400 shadow-inner">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Daily Performance</h3>
                            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Detailed product breakdown by day</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100/80 dark:divide-white/5">
                {dailySales.map(day => (
                    <div key={day.date} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors duration-300">
                        <div className="p-6 lg:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-[12px] font-bold uppercase tracking-widest">
                                        {day.totalQuantity.toLocaleString()} Units
                                    </div>
                                    <div className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight">
                                        {formatCurrency(day.totalRevenue, storeSettings)}
                                    </div>
                                </div>
                            </div>

                            {/* Product Items with mini-chart bars */}
                            <div className="space-y-4">
                                {day.items.slice(0, 3).map((item, idx) => {
                                    const percentage = (item.revenue / (day.totalRevenue || 1)) * 100;
                                    return (
                                        <div key={item.name + idx} className="group relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="text-[14px] font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {item.name}
                                                    </div>
                                                </div>
                                                <div className="text-right flex items-center gap-3">
                                                    <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">{item.quantity} qty</span>
                                                    <span className="text-[14px] font-black text-slate-900 dark:text-white">
                                                        {formatCurrency(item.revenue, storeSettings)}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Mini Bar Chart */}
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mt-1">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.max(5, percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {day.items.length > 3 && (
                                    <div className="pt-3">
                                        <button className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[16px] text-[13px] font-bold text-slate-600 dark:text-slate-400 transition-all border border-slate-200/50 dark:border-white/5 active:scale-95 transition-all duration-300">
                                            +{day.items.length - 3} more products
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
