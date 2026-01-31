import React from 'react';

interface WelcomeHeroProps {
    userName?: string;
    stats?: {
        totalRevenue: string; // Pre-formatted
        activeStores: number;
    };
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({ userName = "Super Admin", stats }) => {
    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-[0_0_40px_rgba(79,70,229,0.15)] group">
            {/* dynamic background effects */}
            <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 md:gap-16">

                {/* Text Content */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            System Online
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{userName}</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto md:mx-0 font-light">
                            Global platform metrics are stable. Real-time analysis indicates a positive trend in store acquisitions.
                        </p>
                    </div>

                    {/* Mini HUD Stats */}
                    {stats && (
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md flex flex-col items-center md:items-start group/stat hover:border-indigo-500/30 transition-colors">
                                <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Total Revenue</span>
                                <span className="text-xl font-bold text-white group-hover/stat:text-indigo-400 transition-colors">{stats.totalRevenue}</span>
                            </div>
                            <div className="px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md flex flex-col items-center md:items-start group/stat hover:border-cyan-500/30 transition-colors">
                                <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Active Stores</span>
                                <span className="text-xl font-bold text-white group-hover/stat:text-cyan-400 transition-colors">{stats.activeStores}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Robot Placeholder - Reserved for Global Overlay positioning reference if needed, or empty */}
                {/* <div className="hidden md:block w-80"></div> */}
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default WelcomeHero;
