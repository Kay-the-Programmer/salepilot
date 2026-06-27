import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Icon } from '../crm/CrmBits';

/**
 * Desktop nav-rail light/dark toggle for the `.crm`-chrome standalone apps,
 * whose rails otherwise have no theme control now that the global floating
 * switch is gone. Mobile uses the top bar's toggle instead.
 */
export const RailThemeButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button type="button" className="crm-rail__item" onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={22} />
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
    );
};

export default RailThemeButton;
