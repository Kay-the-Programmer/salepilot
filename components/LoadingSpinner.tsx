import React from 'react';
import SalePilotLoader from './SalePilotLoader';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    text?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = (props) => {
    return <SalePilotLoader {...props} />;
};

export default LoadingSpinner;
