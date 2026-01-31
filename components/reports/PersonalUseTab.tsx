import React from 'react';
import { StoreSettings } from '../../types';
import { PersonalUseStatsRow } from './personal/PersonalUseStatsRow';
import { PersonalUseList } from './personal/PersonalUseList';

interface PersonalUseTabProps {
    personalUse: any[] | null;
    storeSettings?: StoreSettings; // Optional if needed for formatting currency
}

export const PersonalUseTab: React.FC<PersonalUseTabProps> = ({ personalUse, storeSettings }) => {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PersonalUseStatsRow
                storeSettings={storeSettings!}
            />

            <PersonalUseList personalUse={personalUse} />
        </div>
    );
};
