import React from 'react';

interface HoloComputeHubProps {
    isSyncing?: boolean;
    isResearching?: boolean;
}

const HoloComputeHub: React.FC<HoloComputeHubProps> = ({ isSyncing = false, isResearching = false }) => {
    return (
        <div className={`absolute right-[20px] top-[15%] z-20 pointer-events-none select-none hidden lg:block transition-all duration-1000 ${isSyncing || isResearching ? 'scale-110' : ''}`}>
            <div className="relative w-[450px] h-[650px] perspective-[1200px]">

                {/* HOLOGRAPHIC TABLE BASE (Interactive Console) */}
                <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[400px] h-40 [transform:rotateX(65deg)] border-t-2 border-cyan-500/50 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-[50px] shadow-[0_-20px_60px_rgba(34,211,238,0.3)]">
                    <div className="absolute inset-x-0 top-0 h-px bg-cyan-300 blur-[3px]"></div>
                    {/* Console Controls */}
                    <div className="absolute inset-6 border border-cyan-500/10 rounded-[35px] grid grid-cols-12 gap-1 p-2">
                        {[...Array(48)].map((_, i) => (
                            <div key={i} className={`h-full border border-cyan-500/5 rounded-sm transition-colors duration-200 ${isResearching && i % 3 === 0 ? 'bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-white/5'}`} style={{ transitionDelay: `${i * 10}ms` }}></div>
                        ))}
                    </div>
                    {/* Table-to-Screen Data Particles */}
                    {isResearching && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] [transform:rotateX(-65deg)] pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-data-up" style={{ left: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.4}s` }}></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CENTRAL HUB PILLAR */}
                <div className={`absolute left-1/2 bottom-0 -translate-x-1/2 w-14 h-72 bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-t-3xl shadow-[0_0_40px_rgba(34,211,238,0.2)]`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-transparent"></div>
                </div>

                {/* MAIN LARGE SCREEN (HoloDisplay) */}
                <div className={`absolute top-[5%] left-1/2 -translate-x-1/2 w-[380px] h-[280px] bg-slate-950/60 backdrop-blur-2xl border border-cyan-400/30 rounded-3xl shadow-[0_0_60px_rgba(34,211,238,0.2)] transition-all duration-700 overflow-hidden ${isResearching ? 'border-cyan-300/60 scale-[1.02]' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>

                    {/* ORGANIZED UI ZONES */}
                    <div className="p-4 h-full flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/80 border-b border-cyan-500/20 pb-2">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div> OS_KERNEL: ACTIVE</span>
                            <span className="opacity-60">{new Date().toLocaleTimeString()}</span>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                            {/* Left: System Status Monitor */}
                            <div className="flex flex-col gap-2 border border-cyan-500/10 rounded-lg p-2 bg-black/40">
                                <div className="text-[8px] font-bold text-cyan-500/70 border-b border-cyan-500/10 pb-1">SYSTEM_STATUS</div>
                                <div className="space-y-1.5 flex-1 overflow-hidden">
                                    {['CPU', 'MEM', 'GPU', 'NWT'].map((key) => (
                                        <div key={key} className="space-y-0.5">
                                            <div className="flex justify-between text-[7px] font-mono text-cyan-400/60 px-0.5">
                                                <span>{key}</span>
                                                <span>{isResearching ? Math.floor(60 + Math.random() * 30) : 20}%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full bg-cyan-400/40 rounded-full transition-all duration-1000 ${isResearching ? 'w-[85%]' : 'w-[20%]'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Network Map / Visual Flux */}
                            <div className="flex flex-col gap-2 border border-cyan-500/10 rounded-lg p-2 bg-black/40">
                                <div className="text-[8px] font-bold text-cyan-500/70 border-b border-cyan-500/10 pb-1">NETWORK_TOPOLOGY</div>
                                <div className="flex-1 relative flex items-center justify-center">
                                    <div className="absolute w-12 h-12 border border-cyan-500/20 rounded-full animate-ping"></div>
                                    <div className="absolute w-8 h-8 border-2 border-cyan-400/30 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_cyan]"></div>
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="absolute w-0.5 h-6 bg-cyan-400/20" style={{ transform: `rotate(${i * 60}deg) translateY(-20px)` }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom: MEANINGFUL COMMAND TERMINAL */}
                        <div className="h-20 border border-cyan-400/40 rounded-lg bg-black/80 font-mono text-[8px] p-2 overflow-hidden relative">
                            <div className={`space-y-1 transition-all duration-300 ${isResearching ? 'animate-terminal-scroll text-cyan-300' : 'text-cyan-500/40'}`}>
                                {isResearching ? (
                                    <>
                                        <div>{'>'} INITIATING_CORE_QUERY...</div>
                                        <div>{'>'} SCANNING_MARKET_VECTORS...</div>
                                        <div>{'>'} OPTIMIZING_UPLINK_PEERS...</div>
                                        <div>{'>'} ANALYZING_REVENUE_STREAM...</div>
                                        <div>{'>'} GENERATING_BEHAVIORAL_PATCH...</div>
                                        <div>{'>'} SUCCESS: PROTOCOLX_V2 LOADED</div>
                                        <div>{'>'} WAITING_FOR_COMMAND...</div>
                                    </>
                                ) : (
                                    <>
                                        <div>SALE_PILOT_OS [v4.2.0]</div>
                                        <div>(c) 2077 ANTIGRAVITY CORP</div>
                                        <div>SYSTEM_IDLE...</div>
                                    </>
                                )}
                            </div>
                            {/* Terminal Scanline */}
                            <div className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent top-0 animate-terminal-scan"></div>
                        </div>
                    </div>

                    {/* Overall Screen Scan Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
                </div>

                {/* SIDE WIDGETS (Floating Modules) */}
                <div className={`absolute top-[40%] left-[-80px] w-48 h-32 bg-slate-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-2xl rotate-[-12deg] p-3 text-[8px] font-mono animate-float`}>
                    <div className="text-indigo-400 mb-2 font-bold tracking-widest">ENCRYPTION_ENGINE</div>
                    <div className="grid grid-cols-2 gap-1 opacity-60">
                        {['RSA_4M', 'AES_512', 'PQC_X4', 'SHA_7V'].map(k => (
                            <div key={k} className="border border-indigo-400/20 p-1 rounded">
                                <div className="text-indigo-200">{k}</div>
                                <div className="text-[6px] text-indigo-400/60">LOCKED</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RESEARCH POPUPS (Organized) */}
                {isResearching && (
                    <div className="absolute top-[8%] right-[-140px] w-40 space-y-2 pointer-events-none">
                        {[
                            { label: "CORE_ANALYSIS", color: "text-cyan-400" },
                            { label: "SECURITY_PATCH", color: "text-amber-400" }
                        ].map((win, i) => (
                            <div key={i} className="bg-slate-950/90 border border-cyan-500/20 rounded-lg p-2 animate-float-delayed backdrop-blur-2xl shadow-xl" style={{ animationDelay: `${i * 1.5}s` }}>
                                <div className={`text-[7px] font-mono ${win.color} mb-1 flex items-center justify-between`}>
                                    <span>{win.label}</span>
                                    <span className="w-1 h-1 bg-current rounded-full animate-ping"></span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-current w-[85%] animate-data-stream"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: rotate(-12deg) translateY(0); }
                    50% { transform: rotate(-12deg) translateY(-10px); }
                }
                @keyframes float-delayed {
                }
                @keyframes scan-panel {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes data-stream {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                @keyframes pulse-data {
                    0%, 100% { opacity: 0.4; transform: scaleY(1); }
                    50% { opacity: 1; transform: scaleY(1.2); }
                }
            `}</style>
        </div>
    );
};

export default HoloComputeHub;
