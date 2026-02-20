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
    text = 'Loading',
    className = '',
    size = 'md'
}) => {
    const loader = (
        <div className={`sp-loader-container ${className} ${size}`}>
            <div className="sp-minimal-spinner"></div>
            {text && <div className="sp-minimal-text">{text}</div>}
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
