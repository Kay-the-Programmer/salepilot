import React from 'react';
import { StoreSettings } from '../../types';
import { PersonalUseStatsRow } from './personal/PersonalUseStatsRow';
import { PersonalUseList } from './personal/PersonalUseList';

interface PersonalUseTabProps {
    personalUse: any[] | null;
    storeSettings?: StoreSettings; // Optional if needed for formatting currency
}

export const PersonalUseTab: React.FC<PersonalUseTabProps> = ({ personalUse }) => {
    const totalPersonalUseCount = personalUse ? personalUse.length : 0;
    const totalPersonalUseValue = personalUse ? personalUse.reduce((acc, item) => acc + (item.change * -1), 0) : 0;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PersonalUseStatsRow
                totalPersonalUseCount={totalPersonalUseCount}
                totalPersonalUseValue={totalPersonalUseValue}
            />

            <PersonalUseList personalUse={personalUse} />
        </div>
    );
};
