import React from 'react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    text?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullScreen = true,
    text = 'Loading...',
    className = '',
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
            <div className={`relative ${sizeClasses[size]}`}>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            {text && <p className="text-gray-500 font-medium animate-pulse">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center transition-all duration-300">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;
