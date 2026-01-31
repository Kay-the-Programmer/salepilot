import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrencyDollarIcon, BuildingStorefrontIcon, ChevronRightIcon, ClockIcon } from '../../icons';
import { RevenueSummary, StoreStats } from '../../../types';

interface DashboardStatsGridProps {
    revSummary: RevenueSummary | null;
    storeStats: StoreStats;
    formatCurrency: (amount: number) => string;
    cardRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
    flippedCardId?: string | null;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
    revSummary,
    storeStats,
    formatCurrency,
    cardRefs,
    flippedCardId
}) => {
    const navigate = useNavigate();

    const StatCard = forwardRef(({
        id,
        title,
        value,
        subtext,
        icon: Icon,
        colorClass,
        accentColor,
        onClick,
        isPrimary = false,
        backContent
    }: any, ref: any) => {
        const isFlipped = flippedCardId === id;

        return (
            <div
                ref={ref}
                className="relative h-48 w-full group perspective-1000"
            >
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* FRONT OF CARD */}
                    <div
                        onClick={onClick}
                        className={`
                            absolute inset-0 backface-hidden
                            rounded-2xl p-6 overflow-hidden transition-all duration-300
                            ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
                            ${isPrimary
                                ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.2)]'
                                : 'bg-slate-900/40 border border-slate-800 hover:border-slate-600 backdrop-blur-md'
                            }
                        `}
                    >
                        {/* Glow effects */}
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10 pointer-events-none transition-opacity duration-300 ${accentColor}`}></div>

                        {/* Corner Tech Accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-lg"></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl backdrop-blur-md border border-white/5 ${colorClass}`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                {onClick && (
                                    <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                                )}
                            </div>

                            <h3 className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-1">{title}</h3>
                            <div className={`text-2xl lg:text-3xl font-bold text-white tracking-tight ${isPrimary ? 'text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200' : ''}`}>
                                {value}
                            </div>

                            {subtext && (
                                <div className="mt-3 text-sm text-slate-500 font-medium">
                                    {subtext}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BACK OF CARD */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900/90 border border-indigo-500/50 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(79,70,229,0.15)] overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <h3 className="text-indigo-400 text-xs font-mono uppercase tracking-widest mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                                Analysis
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {backContent}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                id="revenue"
                ref={(el: HTMLDivElement | null) => { if (cardRefs) cardRefs.current['revenue'] = el; }}
                title="Total Revenue"
                value={formatCurrency(revSummary?.totalAmount || 0)}
                subtext="Lifetime platform revenue"
                icon={CurrencyDollarIcon}
                colorClass="bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                accentColor="bg-indigo-500"
                isPrimary={true}
                onClick={null}
                backContent={
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Today</span>
                            <span className="text-white">+ {formatCurrency(0)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>This Week</span>
                            <span className="text-white">+ {formatCurrency(0)}</span>
                        </div>
                        <div className="bg-indigo-500/10 p-2 rounded-lg mt-2">
                            <p className="text-[10px] text-indigo-300 leading-relaxed">
                                Revenue trending upwards by 12% compared to last month.
                            </p>
                        </div>
                    </div>
                }
            />

            <StatCard
                id="active_stores"
                ref={(el: HTMLDivElement | null) => { if (cardRefs) cardRefs.current['active_stores'] = el; }}
                title="Active Stores"
                value={storeStats.active}
                subtext={`${((storeStats.active / (storeStats.total || 1)) * 100).toFixed(0)}% of total stores`}
                icon={BuildingStorefrontIcon}
                colorClass="bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors"
                accentColor="bg-emerald-500"
                onClick={() => navigate('/superadmin/stores?filter=active')}
                backContent={
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>New (30d)</span>
                            <span className="text-emerald-400">+3 Stores</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[85%] rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center">85% Utilization Rate</p>
                    </div>
                }
            />

            <StatCard
                id="trial_stores"
                ref={(el: HTMLDivElement | null) => { if (cardRefs) cardRefs.current['trial_stores'] = el; }}
                title="Trial Stores"
                value={storeStats.trial}
                subtext="Potential conversions"
                icon={ClockIcon}
                colorClass="bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors"
                accentColor="bg-amber-500"
                onClick={() => navigate('/superadmin/stores?filter=trial')}
                backContent={
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400 border-b border-white/5 pb-1">
                            <span>Expiring Soon</span>
                            <span className="text-amber-400">2</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 border-b border-white/5 pb-1">
                            <span>Converted</span>
                            <span className="text-white">5</span>
                        </div>
                        <p className="text-[10px] text-amber-500/80 mt-1">
                            Action: Check expiration dates.
                        </p>
                    </div>
                }
            />

            <StatCard
                id="total_stores"
                ref={(el: HTMLDivElement | null) => { if (cardRefs) cardRefs.current['total_stores'] = el; }}
                title="Total Stores"
                value={storeStats.total}
                subtext={`${storeStats.inactive} inactive stores`}
                icon={BuildingStorefrontIcon}
                colorClass="bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors"
                accentColor="bg-blue-500"
                onClick={() => navigate('/superadmin/stores')}
                backContent={
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-800/50 p-2 rounded-lg">
                            <div className="text-xs text-slate-400">Active</div>
                            <div className="text-sm font-bold text-white">{storeStats.active}</div>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-lg">
                            <div className="text-xs text-slate-400">Inactive</div>
                            <div className="text-sm font-bold text-slate-500">{storeStats.inactive}</div>
                        </div>
                    </div>
                }
            />

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default DashboardStatsGrid;
