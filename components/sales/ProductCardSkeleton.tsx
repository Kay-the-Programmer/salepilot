import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[24px] border border-slate-200/50 dark:border-white/5 overflow-hidden animate-pulse shadow-sm">
            {/* Image placeholder — matches new 4:3 ratio */}
            <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700/60" />
            <div className="p-3 space-y-2.5">
                {/* Name lines */}
                <div className="h-3.5 bg-slate-100 dark:bg-slate-700/60 rounded-full w-4/5" />
                <div className="h-3 bg-slate-100 dark:bg-slate-700/60 rounded-full w-3/5" />
                {/* Price + button */}
                <div className="flex items-center justify-between pt-0.5">
                    <div className="h-4 bg-slate-100 dark:bg-slate-700/60 rounded-full w-1/3" />
                    <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700/60 rounded-full" />
                </div>
            </div>
        </div>
    );
};
