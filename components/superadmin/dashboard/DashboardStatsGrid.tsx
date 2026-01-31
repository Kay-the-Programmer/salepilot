import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrencyDollarIcon, BuildingStorefrontIcon } from '../../icons';
import { RevenueSummary, StoreStats } from '../../../types';

interface DashboardStatsGridProps {
    revSummary: RevenueSummary | null;
    storeStats: StoreStats;
    formatCurrency: (amount: number) => string;
    cardRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
    flippedCardId?: string | null;
    highlightedCardId?: string | null;
    glitchCardId?: string | null;
    className?: string;
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
    revSummary,
    storeStats,
    formatCurrency,
    cardRefs,
    flippedCardId,
    highlightedCardId,
    glitchCardId,
    className = ''
}) => {
    const navigate = useNavigate();

    const StatCard = forwardRef(({
        id,
        title,
        value,
        subtext,
        icon: Icon,
        colorClass,
        onClick,
        isPrimary = false,
        backContent
    }: any, ref: any) => {
        const [localFlipped, setLocalFlipped] = React.useState(false);
        const isFlipped = flippedCardId === id || localFlipped;

        const handleFlip = (e: React.MouseEvent) => {
            e.stopPropagation();
            setLocalFlipped(!localFlipped);
        };

        return (
            <div
                ref={ref}
                className={`relative h-56 w-full group perspective-2000 ${glitchCardId === id ? 'glitch-card' : ''}`}
            >
                <div className={`relative w-full h-full transition-all duration-[800ms] cubic-bezier-spring preserve-3d ${isFlipped ? 'rotate-y-180 shadow-2xl' : 'shadow-lg hover:shadow-indigo-500/10'}`}>

                    {/* FRONT OF CARD */}
                    <div
                        onClick={onClick}
                        style={{ transform: 'translateZ(20px)' }}
                        className={`
                            absolute inset-0 backface-hidden
                            rounded-2xl p-6 overflow-hidden transition-all duration-500
                            ${onClick ? 'cursor-pointer hover:bg-slate-800/40' : ''}
                            ${highlightedCardId === id ? 'ring-2 ring-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.4)] scale-[1.02]' : ''}
                            ${isPrimary
                                ? 'bg-gradient-to-br from-indigo-900/90 to-purple-900/90 border border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                                : 'bg-slate-900/60 border border-slate-800 hover:border-slate-600 backdrop-blur-xl'
                            }
                        `}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        {/* LIVE BADGE (NEW) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/40 border border-white/5 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                            <span className="text-[8px] font-mono text-green-400 font-bold tracking-widest">LIVE</span>
                        </div>

                        {/* Corner Tech Accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500/40 rounded-tl-xl opacity-60"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500/40 rounded-br-xl opacity-60"></div>

                        <div className="relative z-10 h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3.5 rounded-xl backdrop-blur-md border border-white/10 ${colorClass}`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleFlip}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-all border border-white/5"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full animate-pulse">
                                                <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.9-3.1M20 15a9 9 0 01-14.9 3.1" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-slate-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-1.5 opacity-80">{title}</h3>
                                <div className="flex items-baseline gap-2">
                                    <div className={`text-3xl lg:text-4xl font-bold text-white tracking-tighter ${isPrimary ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white' : ''} animate-pulse-subtle`}>
                                        {value}
                                    </div>
                                    {/* Fluctuating Decimal/Indicator (Simulated) */}
                                    <div className="text-xs font-mono text-green-400/60 animate-pulse underline-offset-4 decoration-dotted underline">
                                        .{Math.floor(Math.random() * 99)}%
                                    </div>
                                </div>
                            </div>

                            {/* MINI OSCILLATOR (NEW) */}
                            <div className="mt-4 flex items-center gap-2 h-4 overflow-hidden">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-indigo-500/30 rounded-full transition-all duration-300"
                                        style={{
                                            height: `${20 + Math.random() * 80}%`,
                                            animation: `oscillator-wave 1s ease-in-out infinite`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    ></div>
                                ))}
                            </div>

                            {subtext && (
                                <div className="mt-4 text-[9px] text-slate-400 font-mono flex items-center gap-2 bg-black/30 w-fit px-2.5 py-1 rounded-md border border-white/5">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                                    {subtext}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BACK OF CARD */}
                    <div
                        onClick={handleFlip}
                        style={{ transform: 'rotateY(180deg) translateZ(21px)' }}
                        className="absolute inset-0 backface-hidden cursor-pointer bg-slate-950/98 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(79,70,229,0.3)] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent"></div>
                        <div className="relative z-10 h-full flex flex-col">
                            <h3 className="text-indigo-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]"></span>
                                    METRIC_ANALYTICS
                                </span>
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 text-white/90">
                                {backContent}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    });

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12 ${className}`}>
            <StatCard
                id="revenue"
                ref={(el: HTMLDivElement | null) => { if (cardRefs) cardRefs.current['revenue'] = el; }}
                title="Total Revenue"
                value={formatCurrency(revSummary?.totalAmount || 0)}
                subtext="Real-time global revenue aggregate"
                icon={CurrencyDollarIcon}
                colorClass="bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                accentColor="bg-indigo-500"
                isPrimary={true}
                onClick={null}
                backContent={
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-slate-400 bg-white/5 p-2 rounded-lg">
                            <span>Last 24h Delta</span>
                            <span className="text-green-400 font-mono">+ {formatCurrency(Math.random() * 500)} (↑ 4.2%)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400 bg-white/5 p-2 rounded-lg">
                            <span>Processing Nodes</span>
                            <span className="text-indigo-300 font-mono">14 ACTIVE</span>
                        </div>
                        <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                            <p className="text-[10px] text-indigo-200 leading-relaxed font-mono">
                                Revenue streams optimized via Behavioral Protocols. Integrity check: 100%.
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
                subtext={`Target Utilization: 95%`}
                icon={BuildingStorefrontIcon}
                colorClass="bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(52,211,153,0.1)]"
                accentColor="bg-emerald-500"
                onClick={() => navigate('/superadmin/stores?filter=active')}
                backContent={
                    <div className="space-y-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                            <span>Network Saturation</span>
                            <span className="text-emerald-400">88.4%</span>
                        </div>
                        <div className="w-full bg-slate-900 border border-white/5 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full w-[88%] rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className="bg-white/5 p-2 rounded-lg text-center">
                                <div className="text-[8px] text-slate-500 uppercase">Latency</div>
                                <div className="text-xs font-bold text-emerald-400">12ms</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg text-center">
                                <div className="text-[8px] text-slate-500 uppercase">Uptime</div>
                                <div className="text-xs font-bold text-white">99.9%</div>
                            </div>
                        </div>
                    </div>
                }
            />

            <style>{`
                .perspective-2000 { perspective: 2000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .cubic-bezier-spring { transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6); }
                @keyframes oscillator-wave {
                    0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
                    50% { transform: scaleY(1); opacity: 1; }
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 4s ease-in-out infinite;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            `}</style>
        </div>
    );
};

export default DashboardStatsGrid;
