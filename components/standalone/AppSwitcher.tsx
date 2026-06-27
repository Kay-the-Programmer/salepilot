import React, { useState } from 'react';
import { User } from '../../types';
import AppSwitcherOverlay from './AppSwitcherOverlay';

interface AppSwitcherProps {
    user: User | null;
    /** Extra classes for the trigger button so it matches the host app bar. */
    triggerClassName?: string;
    /** Route of the app currently open, to highlight it in the grid (e.g. 'crm'). */
    currentRoute?: string;
}

/**
 * Top-left "all SalePilot apps" launcher: a trigger button that opens the
 * shared full-screen {@link AppSwitcherOverlay}. Used by every standalone app
 * shell to replace routing out to the Discover page on mobile.
 */
export const AppSwitcher: React.FC<AppSwitcherProps> = ({ user, triggerClassName, currentRoute }) => {
    const [open, setOpen] = useState(false);

    const btnClass = triggerClassName
        || 'inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition';

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} aria-label="All SalePilot apps" className={btnClass}>
                <span className="material-symbols-rounded">apps</span>
            </button>
            <AppSwitcherOverlay open={open} onClose={() => setOpen(false)} user={user} currentRoute={currentRoute} />
        </>
    );
};

export default AppSwitcher;
