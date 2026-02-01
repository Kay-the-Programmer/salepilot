import React, { useEffect, useState } from 'react';

export type RobotMood = 'NORMAL' | 'HAPPY' | 'SCANNING' | 'THINKING' | 'WARNING' | 'ANGRY' | 'SURPRISED';
export type RobotMode = 'PATROL' | 'REPORT' | 'MAINTENANCE' | 'RETURN' | 'IDLE' | 'RESEARCH';

interface LiveRobotProps {
    style?: React.CSSProperties;
    className?: string;
    isScanning?: boolean;
    isCalling?: boolean;
    speech?: string | null;
    mood?: RobotMood;
    mode?: RobotMode;
    onClick?: () => void;
    targetPos?: { x: number; y: number } | null;
    isLanding?: boolean;
    variant?: 'APPLE' | 'ANDROID';
    isDragging?: boolean;
    onMouseDown?: (e: React.MouseEvent) => void;
}

const LiveRobot: React.FC<LiveRobotProps> = ({
    style,
    className = '',
    isScanning = false,
    isCalling = false,
    speech,
    mood = 'NORMAL',
    mode = 'IDLE',
    onClick,
    targetPos,
    isLanding = false,
    variant = 'APPLE',
    isDragging = false,
    onMouseDown
}) => {
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // Combined tracking effect (Mouse or Target)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (targetPos) return; // Prioritize targetPos if provided
            updateTracking(e.clientX, e.clientY);
        };

        const updateTracking = (targetX: number, targetY: number) => {
            const centerX = (typeof window !== 'undefined' ? window.innerWidth : 1920) / 2;
            const centerY = (typeof window !== 'undefined' ? window.innerHeight : 1080) / 2;

            const dx = (targetX - centerX) / (centerX || 1);
            const dy = (targetY - centerY) / (centerY || 1);

            if (!isNaN(dx) && !isNaN(dy)) {
                setEyeOffset({ x: dx * 8, y: dy * 5 });
            }
        };

        if (targetPos) {
            updateTracking(targetPos.x, targetPos.y);
        } else {
            window.addEventListener('mousemove', handleMouseMove);
        }

        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isScanning, isCalling, targetPos, isLanding]);

    const renderEyes = () => {
        const eyeColor = variant === 'ANDROID' ? '#FFFFFF' : '#22d3ee';

        if (mood === 'SCANNING' || isScanning) {
            return (
                <g>
                    <rect x="-25" y="-2" width="20" height="4" fill={eyeColor} className="animate-pulse">
                        <animate attributeName="width" values="20;10;20" dur="0.5s" repeatCount="indefinite" />
                    </rect>
                    <rect x="5" y="-2" width="20" height="4" fill={eyeColor} className="animate-pulse">
                        <animate attributeName="width" values="20;10;20" dur="0.5s" repeatCount="indefinite" />
                    </rect>
                </g>
            );
        }

        if (mood === 'ANGRY') {
            return (
                <g>
                    <path d="M -25 -5 L -5 5" stroke="#ef4444" strokeWidth="4" />
                    <path d="M 25 -5 L 5 5" stroke="#ef4444" strokeWidth="4" />
                </g>
            );
        }

        if (mood === 'HAPPY') {
            return (
                <g>
                    <path d="M -25 5 Q -15 -10 -5 5" fill="none" stroke={eyeColor} strokeWidth="4" />
                    <path d="M 5 5 Q 15 -10 25 5" fill="none" stroke={eyeColor} strokeWidth="4" />
                </g>
            );
        }

        if (mood === 'WARNING') {
            return (
                <g>
                    <circle cx="-15" cy="0" r="6" fill="#f59e0b" className="animate-ping" />
                    <circle cx="15" cy="0" r="6" fill="#f59e0b" className="animate-ping" />
                </g>
            );
        }

        if (mood === 'SURPRISED') {
            return (
                <g>
                    <circle cx="-15" cy="0" r="10" fill={eyeColor} />
                    <circle cx="15" cy="0" r="10" fill={eyeColor} />
                    <circle cx="-15" cy="0" r="4" fill="#000" />
                    <circle cx="15" cy="0" r="4" fill="#000" />
                </g>
            );
        }

        // NORMAL / THINKING
        return (
            <g>
                <circle cx="-15" cy="0" r="6" fill={eyeColor} />
                <circle cx="15" cy="0" r="6" fill={eyeColor} />
                {mood === 'THINKING' && (
                    <circle cx="0" cy="0" r="30" fill="none" stroke={eyeColor} strokeWidth="1" strokeDasharray="5,5" className="animate-spin" style={{ animationDuration: '3s' }} />
                )}
            </g>
        );
    };

    return (
        <div
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`transition-all duration-500 group ${className}
                ${isDragging ? 'cursor-grabbing scale-110 rotate-12 animate-wobble' : 'cursor-grab hover:scale-110 active:scale-95'}
                ${isLanding ? 'animate-landing-squash' : ''}
                ${mode === 'RESEARCH' ? 'animate-research-wiggle' : ''}
            `}
            onClick={onClick}
            onMouseDown={onMouseDown}
        >
            {/* DATA SPARKS (Only on hover or research) */}
            <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ${(isHovered || mode === 'RESEARCH') ? 'opacity-100' : 'opacity-0'}`}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full animate-ping ${variant === 'ANDROID' ? 'bg-green-400' : 'bg-cyan-400'}`}
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${40 + Math.random() * 40}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '1s'
                        }}
                    ></div>
                ))}
            </div>

            <svg viewBox="0 0 200 200" className={`w-32 h-32 ${variant === 'ANDROID' ? 'drop-shadow-[0_0_15px_rgba(164,198,57,0.4)]' : 'drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
                <defs>
                    <filter id="cyber-glow-robot" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    {/* APPLE GRADIENTS */}
                    <linearGradient id="apple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#f1f5f9', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#cbd5e1', stopOpacity: 1 }} />
                    </linearGradient>

                    {/* ANDROID GRADIENTS */}
                    <linearGradient id="android-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#A4C639', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#8DB32B', stopOpacity: 1 }} />
                    </linearGradient>

                    <linearGradient id="visor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#000', stopOpacity: 0.9 }} />
                        <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 0.8 }} />
                    </linearGradient>

                    <linearGradient id="thruster-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: variant === 'ANDROID' ? '#A4C639' : '#22d3ee', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: variant === 'ANDROID' ? '#A4C639' : '#22d3ee', stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                {/* Jet / Thruster */}
                <g transform="translate(100, 160)">
                    <ellipse cx="0" cy="0" rx="15" ry="5" fill={variant === 'ANDROID' ? '#4d7c0f' : '#334155'} />
                    <path
                        d="M -10 0 L 0 40 L 10 0"
                        fill="url(#thruster-grad)"
                        className={`animate-pulse ${mode === 'RESEARCH' ? 'opacity-100' : ''}`}
                    />
                </g>

                {/* Android Specific Body/Head Structure */}
                {variant === 'ANDROID' ? (
                    <g filter="url(#cyber-glow-robot)">
                        {/* Body - Rounded top rect */}
                        <path d="M 60 160 L 140 160 L 140 110 Q 140 100 130 100 L 70 100 Q 60 100 60 110 Z" fill="url(#android-grad)" stroke="#ffffff" strokeWidth="0.5" />
                        {/* Head - Dome */}
                        <g transform="translate(100, 95)">
                            <path d="M -40 0 A 40 40 0 0 1 40 0 Z" fill="url(#android-grad)" stroke="#ffffff" strokeWidth="0.5" />
                            {/* Antennae */}
                            <line x1="-25" y1="-25" x2="-35" y2="-45" stroke="#A4C639" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="-35" cy="-45" r="3" fill="#A4C639" />
                            <line x1="25" y1="-25" x2="35" y2="-45" stroke="#A4C639" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="35" cy="-45" r="3" fill="#A4C639" />

                            {/* Eyes */}
                            <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y - 15})`}>
                                {renderEyes()}
                            </g>
                        </g>
                    </g>
                ) : (
                    /* APPLE Design (Sleek, White/Silver) */
                    <g filter="url(#cyber-glow-robot)">
                        {/* Body - Floating pill */}
                        <rect x="65" y="115" width="70" height="40" rx="20" fill="url(#apple-grad)" stroke="#22d3ee" strokeWidth="0.5" opacity="0.95" />

                        {/* Head - Perfect Sphere */}
                        <g transform="translate(100, 85)">
                            <circle cx="0" cy="0" r="45" fill="url(#apple-grad)" stroke="#22d3ee" strokeWidth="0.5" />

                            {/* Glass Face Shield / Visor */}
                            <rect x="-30" y="-12" width="60" height="25" rx="12" fill="url(#visor-grad)" />

                            {/* Eyes */}
                            <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
                                {renderEyes()}
                            </g>
                        </g>
                    </g>
                )}

                {/* DATA BITS (Digital Particles when typing) */}
                {(mode === 'RESEARCH' || mode === 'REPORT' || isCalling) && (
                    <g className="data-bits">
                        {[...Array(5)].map((_, i) => (
                            <rect
                                key={i}
                                width="3"
                                height="3"
                                fill={variant === 'APPLE' ? '#22d3ee' : '#A4C639'}
                                className="animate-data-bit"
                                style={{
                                    animationDelay: `${i * 0.4}s`,
                                    x: 100 + (Math.random() * 40 - 20),
                                    y: 110
                                }}
                            />
                        ))}
                    </g>
                )}

                {/* INTERACTION ARMS (For Typing/Holding Phone) */}
                {(mode === 'RESEARCH' || mode === 'REPORT' || isCalling) && (
                    <g className={mode === 'RESEARCH' || mode === 'REPORT' ? 'animate-arms-typing-refined' : 'animate-bounce-slow'}>
                        {/* Left Arm Holding Phone Base */}
                        <path
                            d="M 60 110 Q 75 125 90 120"
                            stroke={variant === 'APPLE' ? '#e2e8f0' : '#A4C639'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* Right Arm Typing/Interacting */}
                        <path
                            d="M 140 110 Q 125 125 110 120"
                            stroke={variant === 'APPLE' ? '#e2e8f0' : '#A4C639'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="none"
                        />

                        {/* PHONE / DEVICE */}
                        <g transform="translate(90, 110)">
                            <rect width="20" height="30" rx="4" fill="#1e293b" stroke={variant === 'APPLE' ? '#22d3ee' : '#A4C639'} strokeWidth="1" />
                            {/* Device Screen Activity */}
                            <rect x="2" y="4" width="16" height="22" rx="2" fill={variant === 'APPLE' ? '#083344' : '#064e3b'} />
                            <g className="animate-pulse">
                                <rect x="4" y="8" width="8" height="1" fill={variant === 'APPLE' ? '#22d3ee' : '#A4C639'} opacity="0.6" />
                                <rect x="4" y="12" width="12" height="1" fill={variant === 'APPLE' ? '#22d3ee' : '#A4C639'} opacity="0.4" />
                                <rect x="4" y="16" width="6" height="1" fill={variant === 'APPLE' ? '#22d3ee' : '#A4C639'} opacity="0.3" />
                            </g>
                            {/* Hand Grip on Device */}
                            <circle cx="2" cy="15" r="3" fill={variant === 'APPLE' ? '#e2e8f0' : '#A4C639'} />
                            <circle cx="18" cy="15" r="3" fill={variant === 'APPLE' ? '#e2e8f0' : '#A4C639'} />
                        </g>
                    </g>
                )}
            </svg>

            {/* Speech Bubble */}
            {speech && (
                <div
                    className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl text-[12px] font-bold whitespace-nowrap shadow-xl border backdrop-blur-md animate-bounce-subtle metal-text
                        ${variant === 'APPLE' ? 'bg-white/90 border-cyan-200' : 'bg-green-500/90 border-green-400 text-white'}`}
                >
                    {speech}
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b 
                        ${variant === 'APPLE' ? 'bg-white/90 border-cyan-200' : 'bg-green-500/90 border-green-400'}`} />
                </div>
            )}

            <style>{`
                .animate-arms-typing-refined {
                    animation: arms-typing-rhythmic 0.5s ease-in-out infinite alternate;
                    transform-origin: center;
                }
                @keyframes arms-typing-rhythmic {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(-4px) rotate(2deg); }
                }
                @keyframes data-bit {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-30px) translateX(${Math.random() > 0.5 ? '10px' : '-10px'}) scale(0); opacity: 0; }
                }
                .animate-data-bit {
                    animation: data-bit 0.8s ease-out infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes float-robot {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float-robot {
                    animation: float-robot 4s ease-in-out infinite;
                }
                @keyframes eye-scan {
                    0%, 100% { transform: translateX(-2px); }
                    50% { transform: translateX(2px); }
                }
                .animate-eye-scan {
                    animation: eye-scan 2s ease-in-out infinite;
                }
                @keyframes scanning-glow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.8; }
                }
                .animate-scanning-glow {
                    animation: scanning-glow 1.5s ease-in-out infinite;
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s ease-in-out infinite;
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translate(-50%, 0); }
                    50% { transform: translate(-50%, -4px); }
                }
                .metal-text {
                    text-shadow: 0 1px 0 rgba(255,255,255,0.4);
                }
                @keyframes wobble {
                    0%, 100% { transform: rotate(12deg) translateY(0); }
                    25% { transform: rotate(15deg) translateY(-5px); }
                    75% { transform: rotate(9deg) translateY(5px); }
                }
                .animate-wobble {
                    animation: wobble 0.3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default LiveRobot;
