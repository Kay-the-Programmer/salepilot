import React from 'react';
import './SalePilotLoader.css';

interface SalePilotLoaderProps {
    fullScreen?: boolean;
    text?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const SalePilotLoader: React.FC<SalePilotLoaderProps> = ({
    fullScreen = true,
    text = 'Loading...',
    className = '',
    size = 'md'
}) => {
    const sizeScale = {
        sm: 0.65,
        md: 1,
        lg: 1.35
    };

    const scale = sizeScale[size];

    const loader = (
        <div className={`sp-loader-container ${className}`}>
            {/* Ambient Background Effects */}
            <div className="sp-ambient">
                <div className="sp-ambient-orb sp-orb-1"></div>
                <div className="sp-ambient-orb sp-orb-2"></div>
                <div className="sp-ambient-orb sp-orb-3"></div>
            </div>

            {/* Main Logo Animation */}
            <div className="sp-logo-stage" style={{ transform: `scale(${scale})` }}>
                {/* Outer Glow Ring */}
                <div className="sp-glow-ring"></div>

                {/* Rotating Arc */}
                <svg className="sp-arc-ring" viewBox="0 0 120 120">
                    <defs>
                        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF7F27" stopOpacity="0" />
                            <stop offset="50%" stopColor="#FF7F27" stopOpacity="1" />
                            <stop offset="100%" stopColor="#FFA35C" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        stroke="url(#arcGrad)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray="80 260"
                    />
                </svg>

                {/* Digital Pixels Cascade */}
                <div className="sp-pixels-cascade">
                    <div className="sp-cascade-pixel sp-cp-1"></div>
                    <div className="sp-cascade-pixel sp-cp-2"></div>
                    <div className="sp-cascade-pixel sp-cp-3"></div>
                    <div className="sp-cascade-pixel sp-cp-4"></div>
                    <div className="sp-cascade-pixel sp-cp-5"></div>
                    <div className="sp-cascade-pixel sp-cp-6"></div>
                    <div className="sp-cascade-pixel sp-cp-7"></div>
                </div>

                {/* Central Cart Assembly */}
                <div className="sp-cart-assembly">
                    {/* Speed Trail */}
                    <div className="sp-speed-trail">
                        <div className="sp-trail sp-trail-1"></div>
                        <div className="sp-trail sp-trail-2"></div>
                        <div className="sp-trail sp-trail-3"></div>
                    </div>

                    {/* Shopping Cart */}
                    <div className="sp-cart-core">
                        <svg viewBox="0 0 56 56" className="sp-cart-svg">
                            {/* Cart Body Gradient */}
                            <defs>
                                <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#154180" />
                                    <stop offset="100%" stopColor="#0A2E5C" />
                                </linearGradient>
                            </defs>
                            {/* Cart Basket */}
                            <path
                                d="M12 16 L16 16 L20 38 L44 38 L48 20 L18 20"
                                fill="none"
                                stroke="url(#cartGrad)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="sp-cart-path"
                            />
                            {/* Wheels */}
                            <circle cx="24" cy="44" r="4" className="sp-wheel" />
                            <circle cx="40" cy="44" r="4" className="sp-wheel" />
                        </svg>

                        {/* Lightning Bolt */}
                        <div className="sp-lightning-core">
                            <svg viewBox="0 0 24 24" className="sp-bolt">
                                <defs>
                                    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#FFA35C" />
                                        <stop offset="50%" stopColor="#FF7F27" />
                                        <stop offset="100%" stopColor="#E66B1F" />
                                    </linearGradient>
                                    <filter id="boltGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <path
                                    d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"
                                    fill="url(#boltGrad)"
                                    filter="url(#boltGlow)"
                                    className="sp-bolt-shape"
                                />
                            </svg>
                            {/* Energy Ring */}
                            <div className="sp-energy-ring"></div>
                        </div>
                    </div>
                </div>

                {/* Particle Burst */}
                <div className="sp-particle-field">
                    <div className="sp-spark sp-spark-1"></div>
                    <div className="sp-spark sp-spark-2"></div>
                    <div className="sp-spark sp-spark-3"></div>
                    <div className="sp-spark sp-spark-4"></div>
                </div>
            </div>

            {/* Brand Identity */}
            {text && (
                <div className="sp-brand-identity">
                    <div className="sp-brand-name">
                        <span className="sp-name-sale">Sale</span>
                        <span className="sp-name-pilot">Pilot</span>
                    </div>
                    <div className="sp-tagline">Business Suite</div>
                </div>
            )}

            {/* Premium Progress Bar */}
            <div className="sp-progress-container" style={{ transform: `scaleX(${scale * 0.9})` }}>
                <div className="sp-progress-bar">
                    <div className="sp-progress-fill"></div>
                    <div className="sp-progress-shimmer"></div>
                </div>
                <div className="sp-progress-dots">
                    <span className="sp-dot sp-dot-1"></span>
                    <span className="sp-dot sp-dot-2"></span>
                    <span className="sp-dot sp-dot-3"></span>
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="sp-loader-overlay">
                <div className="sp-backdrop-blur"></div>
                {loader}
            </div>
        );
    }

    return loader;
};

export default SalePilotLoader;
