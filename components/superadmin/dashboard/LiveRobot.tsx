import React, { useEffect, useRef, useState } from 'react';

interface LiveRobotProps {
    style?: React.CSSProperties;
    className?: string;
    isScanning?: boolean;
    speech?: string | null;
}

const LiveRobot: React.FC<LiveRobotProps> = ({ style, className = "", isScanning = false, speech }) => {
    const robotRef = useRef<HTMLDivElement>(null);
    const eyesRef = useRef<HTMLDivElement>(null);
    const [isBlinking, setIsBlinking] = useState(false);

    // Mouse tracking effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!robotRef.current || !eyesRef.current) return;

            const rect = robotRef.current.getBoundingClientRect();
            const robotCenterX = rect.left + rect.width / 2;
            const robotCenterY = rect.top + rect.height / 2;

            // Calculate angle and distance
            const angle = Math.atan2(e.clientY - robotCenterY, e.clientX - robotCenterX);
            const distance = Math.min(
                Math.hypot(e.clientX - robotCenterX, e.clientY - robotCenterY),
                50 // Limit eye movement range
            );

            const x = Math.cos(angle) * (distance / 5); // Scale down movement
            const y = Math.sin(angle) * (distance / 5);

            // Apply transform to eyes
            eyesRef.current.style.transform = `translate(${x}px, ${y}px)`;

            // Subtle head tilt
            const tiltX = (e.clientX - robotCenterX) / 60;
            const tiltY = (e.clientY - robotCenterY) / 60;
            const scanTilt = isScanning ? 15 : 0;
            robotRef.current.style.transform = `rotateY(${tiltX}deg) rotateX(${-tiltY + scanTilt}deg)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isScanning]);

    // Blinking effect
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 200);
        }, 3000 + Math.random() * 2000);

        return () => clearInterval(blinkInterval);
    }, []);

    return (
        <div
            className={`relative w-64 h-64 md:w-80 md:h-80 perspective-1000 transition-all duration-1000 ease-in-out ${className}`}
            style={style}
        >
            {/* SPEECH BUBBLE */}
            {speech && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 z-50 animate-pop-in">
                    <div className="bg-slate-900/90 border border-indigo-500/50 text-indigo-100 px-4 py-3 rounded-xl backdrop-blur-md shadow-lg relative">
                        <div className="text-sm font-mono typing-cursor">{speech}</div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900/90 border-r border-b border-indigo-500/50 transform rotate-45"></div>
                    </div>
                </div>
            )}

            {/* Robot Container with Float Animation */}
            <div
                ref={robotRef}
                className={`w-full h-full relative animate-float-slow transition-transform duration-500 ease-out preserve-3d ${isScanning ? 'scale-110' : ''}`}
            >
                {/* HEAD */}
                <div className="absolute top-[10%] left-[15%] w-[70%] h-[60%] bg-white rounded-[40%] shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.1),inset_10px_10px_30px_rgba(255,255,255,0.8),0_20px_40px_rgba(0,0,0,0.2)] z-20 overflow-hidden border border-slate-100/50">
                    {/* Glossy Reflection */}
                    <div className="absolute top-[5%] left-[15%] w-[40%] h-[20%] bg-white/40 rounded-full blur-[2px] transform -rotate-12"></div>

                    {/* Glass Face Screen */}
                    <div className="absolute top-[20%] left-[10%] w-[80%] h-[60%] bg-slate-950 rounded-[35%] border-[3px] border-slate-800/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center relative">

                        {/* Scanning Beam */}
                        <div className={`absolute top-0 w-full h-2 bg-cyan-400/50 blur-[4px] opacity-0 transition-all duration-300 ${isScanning ? 'animate-scan opacity-100' : ''}`}></div>

                        {/* Eyes Container */}
                        <div ref={eyesRef} className="flex gap-8 transition-transform duration-75 relative z-10">
                            {/* Left Eye */}
                            <div className={`w-12 h-12 rounded-full relative ${isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'} transition-transform duration-100`}>
                                <div className={`absolute inset-0 bg-cyan-400 rounded-full blur-[2px] ${isScanning ? 'animate-pulse' : 'animate-pulse-fast'} ${speech ? 'animate-pulse bg-indigo-400' : ''}`}></div>
                                <div className="absolute inset-2 bg-white rounded-full blur-[1px]"></div>
                                {/* Digital Grid Texture in Eye */}
                                <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-50 bg-[length:4px_4px]"></div>
                            </div>

                            {/* Right Eye */}
                            <div className={`w-12 h-12 rounded-full relative ${isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'} transition-transform duration-100`}>
                                <div className={`absolute inset-0 bg-cyan-400 rounded-full blur-[2px] ${isScanning ? 'animate-pulse' : 'animate-pulse-fast'} ${speech ? 'animate-pulse bg-indigo-400' : ''}`}></div>
                                <div className="absolute inset-2 bg-white rounded-full blur-[1px]"></div>
                                <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-50 bg-[length:4px_4px]"></div>
                            </div>
                        </div>

                        {/* Mouth (optional, simple curve) */}
                        <div className={`absolute bottom-[20%] w-[20%] h-[10%] border-b-[3px] border-cyan-500/50 rounded-full opacity-50 transition-all duration-300 ${speech ? 'h-[15%] w-[25%] animate-pulse border-indigo-400' : ''}`}></div>
                    </div>

                    {/* Antennae */}
                    <div className="absolute -top-[15%] -left-[5%] w-4 h-16 bg-gradient-to-t from-slate-300 to-white rounded-full transform -rotate-[20deg] shadow-lg -z-10">
                        <div className={`absolute top-0 w-4 h-4 bg-cyan-400 rounded-full blur-[1px] animate-pulse ${isScanning ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
                    </div>
                    <div className="absolute -top-[15%] -right-[5%] w-4 h-16 bg-gradient-to-t from-slate-300 to-white rounded-full transform rotate-[20deg] shadow-lg -z-10">
                        <div className={`absolute top-0 w-4 h-4 bg-cyan-400 rounded-full blur-[1px] animate-pulse delay-75 ${isScanning ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
                    </div>
                </div>

                {/* BODY (Simplified Torso) */}
                <div className="absolute bottom-[5%] left-[25%] w-[50%] h-[30%] bg-gradient-to-b from-white to-slate-200 rounded-[30%] shadow-[inset_-5px_-5px_15px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <div className={`w-6 h-6 rounded-full animate-pulse blur-[1px] ${isScanning ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
                    </div>
                </div>

                {/* Arms (Floating Spheres) */}
                <div className={`absolute bottom-[10%] left-[10%] w-12 h-20 bg-white rounded-full shadow-lg transition-transform duration-500 ${isScanning ? 'rotate-[-45deg] translate-x-[-10px]' : 'rotate-12'} ${speech ? 'rotate-[30deg]' : ''}`}></div>
                <div className={`absolute bottom-[10%] right-[10%] w-12 h-20 bg-white rounded-full shadow-lg transition-transform duration-500 ${isScanning ? 'rotate-[45deg] translate-x-[10px]' : '-rotate-12'} ${speech ? '-rotate-[30deg]' : ''}`}></div>
            </div>

            <style>{`
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(1deg); }
                }
                .animate-float-slow {
                    animation: float-slow 4s ease-in-out infinite;
                }
                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.95); }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 2s ease-in-out infinite;
                }
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 1.5s linear infinite;
                }
                @keyframes pop-in {
                    0% { opacity: 0; transform: translate(-50%, 10px) scale(0.9); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                .animate-pop-in {
                    animation: pop-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
                }
            `}</style>
        </div>
    );
};

export default LiveRobot;
