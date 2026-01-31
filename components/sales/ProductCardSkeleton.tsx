import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-3 flex flex-col h-full">
            <Skeleton className="w-full aspect-square rounded-lg mb-2 bg-slate-100 dark:bg-white/5" />
            <Skeleton className="h-4 w-3/4 mb-2 bg-slate-100 dark:bg-white/5" />
            <Skeleton className="h-4 w-1/4 bg-slate-100 dark:bg-white/5" />
        </div>
    );
};
