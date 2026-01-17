import React from 'react';
import { Skeleton } from '../ui/Skeleton';

export const ProductCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col h-full">
            <Skeleton className="w-full aspect-square rounded-lg mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    );
};
