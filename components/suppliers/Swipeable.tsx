// Swipeable.tsx
import React, { useState, useRef, TouchEvent } from 'react';

interface SwipeableProps {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftActionColor?: string;
    rightActionColor?: string;
    leftActionIcon?: React.ReactNode;
    rightActionIcon?: React.ReactNode;
    threshold?: number;
    className?: string;
}

const Swipeable: React.FC<SwipeableProps> = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftActionColor = 'bg-red-500',
    rightActionColor = 'bg-blue-500',
    leftActionIcon,
    rightActionIcon,
    threshold = 100,
    className = ''
}) => {
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isSwiping) return;
        setCurrentX(e.touches[0].clientX - startX);
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;

        const deltaX = currentX;
        if (Math.abs(deltaX) > threshold) {
            if (deltaX < 0 && onSwipeLeft) {
                // Swipe left
                onSwipeLeft();
            } else if (deltaX > 0 && onSwipeRight) {
                // Swipe right
                onSwipeRight();
            }
        }

        // Reset
        setCurrentX(0);
        setIsSwiping(false);
    };

    const swipeStyle = {
        transform: `translateX(${currentX}px)`,
        transition: isSwiping ? 'none' : 'transform 0.3s ease'
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Background actions */}
            <div className="absolute inset-0 flex">
                {onSwipeRight && (
                    <div className={`flex-1 ${rightActionColor} flex items-center justify-start px-4`}>
                        {rightActionIcon}
                    </div>
                )}
                {onSwipeLeft && (
                    <div className={`flex-1 ${leftActionColor} flex items-center justify-end px-4`}>
                        {leftActionIcon}
                    </div>
                )}
            </div>

            {/* Swipeable content */}
            <div
                ref={containerRef}
                style={swipeStyle}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative"
            >
                {children}
            </div>
        </div>
    );
};

export default Swipeable;