import React, { useState, useEffect } from 'react';

interface WelcomeHeroProps {
    userName?: string;
    stats?: {
        totalRevenue: string; // Pre-formatted
        activeStores: number;
    };
    isTypingReport?: boolean;
    reportText?: string;
    description?: string;
    onRefreshInsight?: () => void;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({
    userName = "Super Admin",
    stats,
    isTypingReport = false,
    reportText = "",
    description = "Analyzing platform performance...",
    onRefreshInsight
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [displayText, setDisplayText] = useState('');
    const [typedTitle, setTypedTitle] = useState('');
    const [showDescription, setShowDescription] = useState(false);

    // Greeting logic based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const fullTitle = `${getGreeting()}, ${userName}.`;

    // Normal State Typing Logic
    useEffect(() => {
        if (!isTypingReport) {
            let i = 0;
            setTypedTitle(''); // Reset title when not typing report
            setShowDescription(false); // Reset description visibility
            const titleInterval = setInterval(() => {
                setTypedTitle(fullTitle.slice(0, i + 1));
                i++;
                if (i >= fullTitle.length) {
                    clearInterval(titleInterval);
                    setTimeout(() => setShowDescription(true), 500);
                }
            }, 50);
            return () => clearInterval(titleInterval);
        }
    }, [isTypingReport, userName, fullTitle]); // Added fullTitle to dependencies

    // Typing Report Logic (existing)
    useEffect(() => {
        if (isTypingReport) {
            let i = 0;
            setDisplayText('');
            const interval = setInterval(() => {
                setDisplayText(reportText.slice(0, i + 1));
                i++;
                if (i >= reportText.length) clearInterval(interval);
            }, 30);
            return () => clearInterval(interval);
        } else {
            setDisplayText('');
        }
    }, [isTypingReport, reportText]);

    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-[0_0_40px_rgba(79,70,229,0.15)] group min-h-[320px]">
            {/* dynamic background effects */}
            <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20 pointer-events-none"></div>
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 transition-opacity duration-1000 ${isTypingReport ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 transition-opacity duration-1000 ${isTypingReport ? 'opacity-0' : 'opacity-100'}`}></div>

            {/* NORMAL CONTENT (Fades out when typing) */}
            <div className={`relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 md:gap-16 transition-all duration-1000 ${isTypingReport ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>

                {/* Text Content */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-widest backdrop-blur-sm animate-fade-in">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            AI Intelligence Online
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight min-h-[1.2em]">
                            {typedTitle}<span className={`inline-block w-1 h-8 bg-indigo-500 ml-1 ${typedTitle.length < fullTitle.length ? 'opacity-100' : 'animate-blink'}`}></span>
                        </h1>
                        <div className={`flex items-start gap-3 transition-all duration-1000 transform ${showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <p className="text-slate-400 text-lg max-w-xl mx-auto md:mx-0 font-light">
                                {description}
                            </p>
                            {onRefreshInsight && (
                                <button
                                    onClick={() => {
                                        setIsRefreshing(true);
                                        onRefreshInsight();
                                        setTimeout(() => setIsRefreshing(false), 2000);
                                    }}
                                    disabled={isRefreshing}
                                    className={`mt-1.5 p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all ${isRefreshing ? 'animate-spin cursor-not-allowed' : 'hover:scale-110'}`}
                                    title="Refresh AI Insight"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                                        <path d="M21 3v5h-5" />
                                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                                        <path d="M3 21v-5h5" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mini HUD Stats */}
                    {stats && (
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className={`px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md flex flex-col items-center md:items-start group/stat hover:border-indigo-500/30 transition-all duration-700 delay-[800ms] transform ${showDescription ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Total Revenue</span>
                                <span className="text-xl font-bold text-white group-hover/stat:text-indigo-400 transition-colors">{stats.totalRevenue}</span>
                            </div>
                            <div className={`px-5 py-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md flex flex-col items-center md:items-start group/stat hover:border-cyan-500/30 transition-all duration-700 delay-[1000ms] transform ${showDescription ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                                <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Active Stores</span>
                                <span className="text-xl font-bold text-white group-hover/stat:text-cyan-400 transition-colors">{stats.activeStores}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TYPING REPORT OVERLAY */}
            <div className={`absolute inset-0 z-20 flex flex-col p-8 md:p-12 transition-all duration-1000 ${isTypingReport ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>



                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500/20"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500/20"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50 border border-emerald-500/20"></div>
                    </div>
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest pl-4 border-l border-slate-800">
                        Live System Report // Unit Beta
                    </div>

                    {/* Pulsing Signal */}
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-1 h-3 bg-cyan-500/20 rounded-full`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 font-mono text-cyan-400/90 text-sm md:text-base leading-relaxed overflow-hidden relative z-10">
                    <div className="mb-4 text-emerald-400/80 flex items-center gap-2">
                        <span className="opacity-50">$</span>
                        <span>executing_scout_analysis.sh --target="Global Hub"</span>
                    </div>
                    <div className="mb-4 text-emerald-400/80 flex items-center gap-2">
                        <span className="opacity-50">$</span>
                        <span className="animate-pulse">decrypting_packet_data...</span>
                    </div>

                    <div className="relative">
                        <span className="typing-cursor-bold whitespace-pre-wrap">{displayText}</span>
                        <span className="inline-block w-2.5 h-5 bg-cyan-400 ml-1 animate-pulse align-middle shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 relative z-10">
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-4">
                        <span>LATENCY: 12ms</span>
                        <span className="w-px h-3 bg-slate-800"></span>
                        <span>SCAN_DEPTH: 8.4m</span>
                        <span className="w-px h-3 bg-slate-800"></span>
                        <span>ENCRYPTION: AES-256-RBT</span>
                    </div>

                    {/* Animated Progress Mini Bar */}
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500/50 animate-progress-loop"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                            <span className="text-[10px] font-mono text-cyan-500">UPLINK ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .typing-cursor-bold::after {
                    content: '';
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-blink {
                    animation: blink 1.5s step-end infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WelcomeHero;
