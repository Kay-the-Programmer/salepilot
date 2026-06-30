import React, { createContext, useCallback, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppSwitcherOverlay from '../components/standalone/AppSwitcherOverlay';
import { getCurrentUser } from '../services/authService';

interface AppSwitcherContextValue {
    /**
     * Open the full-screen "SalePilot Apps" switcher overlay from anywhere.
     * Because the overlay is mounted by this provider (a parent of every route,
     * including the standalone app shells that `return` before Dashboard's own
     * layout), app switching works from any app without prop-drilling a handler.
     * This replaced the old `/pos/discover` launcher page.
     */
    openAppSwitcher: () => void;
}

const AppSwitcherContext = createContext<AppSwitcherContextValue | null>(null);

export const AppSwitcherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    // Highlight the app the user is currently in (first path segment, e.g. 'crm').
    const currentRoute = location.pathname.split('/')[1] || undefined;

    const openAppSwitcher = useCallback(() => setOpen(true), []);
    const close = useCallback(() => setOpen(false), []);

    return (
        <AppSwitcherContext.Provider value={{ openAppSwitcher }}>
            {children}
            <AppSwitcherOverlay open={open} onClose={close} user={getCurrentUser()} currentRoute={currentRoute} />
        </AppSwitcherContext.Provider>
    );
};

export const useAppSwitcher = (): AppSwitcherContextValue => {
    const ctx = useContext(AppSwitcherContext);
    if (!ctx) throw new Error('useAppSwitcher must be used within an AppSwitcherProvider');
    return ctx;
};
