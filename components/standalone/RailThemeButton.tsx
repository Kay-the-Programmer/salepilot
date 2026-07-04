import React from 'react';
import { useTheme, THEME_PREFERENCE_ICON, THEME_PREFERENCE_LABEL } from '../../contexts/ThemeContext';
import { Icon } from '../crm/CrmBits';

/**
 * Desktop nav-rail light/dark toggle for the `.crm`-chrome standalone apps,
 * whose rails otherwise have no theme control now that the global floating
 * switch is gone. Mobile uses the top bar's toggle instead.
 */
export const RailThemeButton: React.FC = () => {
    const { preference, cycleTheme } = useTheme();
    return (
        <button type="button" className="crm-rail__item" onClick={cycleTheme} title="Switch theme — auto, light or dark">
            <Icon name={THEME_PREFERENCE_ICON[preference]} size={22} />
            {THEME_PREFERENCE_LABEL[preference]}
        </button>
    );
};

export default RailThemeButton;
