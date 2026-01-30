import React, { useState } from 'react';

export interface StandardCardProps {
    title: string;
    subtitle?: string;
    /** Upper right status badge or label */
    status?: React.ReactNode;
    /** Main display image or icon area */
    image?: string | React.ReactNode;
    /** Primary highlight info (e.g. Price, Total) */
    primaryInfo?: React.ReactNode;
    /** Secondary info (bottom of card) */
    secondaryInfo?: React.ReactNode;
    /** Action buttons (e.g. Edit, specific actions) - usually hidden until hover or in a specific slot */
    actions?: React.ReactNode;
    isSelected?: boolean;
    onClick?: () => void;
    className?: string;
}

const StandardCard: React.FC<StandardCardProps> = ({
    title,
    subtitle,
    status,
    image,
    primaryInfo,
    secondaryInfo,
    actions,
    isSelected,
    onClick,
    className = ''
}) => {
    const [imgError, setImgError] = useState(false);

    const isImageUrl = typeof image === 'string';
    const showImage = isImageUrl && !imgError;

    return (
        <div
            onClick={(e) => {
                if (!e.defaultPrevented && onClick) {
                    onClick();
                }
            }}
            className={`group bg-white rounded-2xl shadow-sm border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer h-full ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]'
                : 'border-gray-100 hover:shadow-lg hover:border-blue-100'
                } ${className}`}
        >
            {/* Card Header / Image Area */}
            {(image || status) && (
                <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-50">
                    {image && (
                        isImageUrl ? (
                            showImage ? (
                                <img
                                    src={image as string}
                                    alt={title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="text-gray-300">
                                    {/* Fallback Icon */}
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                {image}
                            </div>
                        )
                    )}

                    {/* Status Badge */}
                    {status && (
                        <div className="absolute top-2 right-2 z-10">
                            {status}
                        </div>
                    )}
                </div>
            )}

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                        {subtitle && (
                            <div className={`text-[10px] font-bold uppercase tracking-wider truncate ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                {subtitle}
                            </div>
                        )}
                        {!image && status && (
                            <div className="ml-auto">{status}</div>
                        )}
                    </div>
                    <h3
                        className={`font-bold text-sm sm:text-base mb-1 line-clamp-2 leading-tight transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'}`}
                        title={title}
                    >
                        {title}
                    </h3>
                    {secondaryInfo && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {secondaryInfo}
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                    {primaryInfo && (
                        <div className="text-lg font-black text-gray-900">
                            {primaryInfo}
                        </div>
                    )}
                    {actions && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StandardCard;
