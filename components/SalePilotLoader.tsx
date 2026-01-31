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
        sm: 0.6,
        md: 1,
        lg: 1.4
    };

    const scale = sizeScale[size];

    const loader = (
        <div className={`sp-loader-container ${className}`}>
            {/* Brand Badge */}
            <div className="sp-brand-ring" style={{ transform: `scale(${scale})` }}>
                <div className="sp-ring-glow"></div>

                <div className="sp-loader">
                    {/* Speed Lines */}
                    <div className="sp-speed-lines">
                        <div className="sp-speed-line sp-speed-line-1"></div>
                        <div className="sp-speed-line sp-speed-line-2"></div>
                        <div className="sp-speed-line sp-speed-line-3"></div>
                        <div className="sp-speed-line sp-speed-line-4"></div>
                        <div className="sp-speed-line sp-speed-line-5"></div>
                    </div>

                    {/* Shopping Cart */}
                    <div className="sp-cart">
                        {/* Cart Body */}
                        <div className="sp-cart-body">
                            {/* Lightning Bolt */}
                            <div className="sp-lightning">
                                <svg viewBox="0 0 24 24" className="sp-bolt-svg">
                                    <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
                                </svg>
                            </div>
                            {/* Motion Blur Effect */}
                            <div className="sp-motion-blur"></div>
                        </div>

                        {/* Cart Handle */}
                        <div className="sp-cart-handle"></div>

                        {/* Cart Wheels with Trail */}
                        <div className="sp-wheel-container sp-wheel-left">
                            <div className="sp-wheel-trail"></div>
                            <div className="sp-wheel"></div>
                        </div>
                        <div className="sp-wheel-container sp-wheel-right">
                            <div className="sp-wheel-trail"></div>
                            <div className="sp-wheel"></div>
                        </div>
                    </div>

                    {/* Energy Particles */}
                    <div className="sp-particles">
                        <div className="sp-particle sp-particle-1"></div>
                        <div className="sp-particle sp-particle-2"></div>
                        <div className="sp-particle sp-particle-3"></div>
                        <div className="sp-particle sp-particle-4"></div>
                        <div className="sp-particle sp-particle-5"></div>
                        <div className="sp-particle sp-particle-6"></div>
                    </div>
                </div>
            </div>

            {/* Brand Text */}
            {text && (
                <div className="sp-brand-text">
                    <span className="sp-text-sale">Sale</span>
                    <span className="sp-text-pilot">Pilot</span>
                </div>
            )}

            {/* Progress Indicator */}
            <div className="sp-progress-bar" style={{ transform: `scaleX(${scale * 0.8})` }}>
                <div className="sp-progress-fill"></div>
                <div className="sp-progress-glow"></div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="sp-loader-overlay">
                {loader}
            </div>
        );
    }

    return loader;
};

export default SalePilotLoader;
