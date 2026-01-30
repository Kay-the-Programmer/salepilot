import React from 'react';
import { StatCard } from '../StatCard';
import ArchiveBoxIcon from '../../icons/ArchiveBoxIcon';
import MinusCircleIcon from '../../icons/MinusCircleIcon';

interface PersonalUseStatsRowProps {
    totalPersonalUseCount: number;
    totalPersonalUseValue: number;
}

export const PersonalUseStatsRow: React.FC<PersonalUseStatsRowProps> = ({
    totalPersonalUseCount,
    totalPersonalUseValue
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Items"
                value={totalPersonalUseCount.toString()}
                icon={<ArchiveBoxIcon className="h-5 w-5 text-orange-600" />}
                color="bg-orange-100"
            />
            <StatCard
                title="Total Adjustments"
                value={totalPersonalUseValue.toString()}
                icon={<MinusCircleIcon className="h-5 w-5 text-red-600" />}
                color="bg-red-100"
            />
        </div>
    );
};
