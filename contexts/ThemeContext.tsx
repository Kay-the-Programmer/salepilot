import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
/** 'system' follows the device's light/dark setting automatically. */
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Material-symbol icon name + human label for each preference — shared by every
 * in-app theme control so they read consistently. 'system' is the auto-follow-
 * device state, shown with the `brightness_auto` glyph.
 */
export const THEME_PREFERENCE_ICON: Record<ThemePreference, string> = {
    system: 'brightness_auto',
    light: 'light_mode',
    dark: 'dark_mode',
};
export const THEME_PREFERENCE_LABEL: Record<ThemePreference, string> = {
    system: 'Auto theme',
    light: 'Light mode',
    dark: 'Dark mode',
};

interface ThemeContextType {
    /** The theme actually applied right now (when preference is 'system', this is the OS theme). */
    theme: Theme;
    /** The user's stored choice. 'system' = auto-follow the device. */
    preference: ThemePreference;
    /** Set an explicit preference ('system' restores automatic device-following). */
    setPreference: (p: ThemePreference) => void;
    /** Cycle System → Light → Dark → System. */
    cycleTheme: () => void;
    /** Toggle light/dark as an explicit override. Kept for existing in-app switches. */
    toggleTheme: () => void;
}

const STORAGE_KEY = 'themePreference';

const getSystemTheme = (): Theme =>
    typeof window !== 'undefined'
        && window.matchMedia
        && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

const readStoredPreference = (): ThemePreference => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
        console.warn('Failed to read theme preference:', e);
    }
    // Default: be intelligent and follow the user's device.
    return 'system';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
    const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);

    // Live-follow the device: update instantly when the OS light/dark setting
    // changes — and re-sync on focus/visibility in case a change was missed while
    // the app was backgrounded.
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => setSystemTheme(mq.matches ? 'dark' : 'light');
        sync(); // sync once on mount
        const onVisible = () => { if (!document.hidden) sync(); };
        if (mq.addEventListener) mq.addEventListener('change', sync);
        else mq.addListener(sync); // Safari < 14
        window.addEventListener('focus', sync);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', sync);
            else mq.removeListener(sync);
            window.removeEventListener('focus', sync);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    const theme: Theme = preference === 'system' ? systemTheme : preference;

    // Apply to <html> + native color-scheme (so scrollbars / form controls match too).
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.style.colorScheme = theme;
    }, [theme]);

    // Persist the user's CHOICE (preference), not the resolved theme — so 'system'
    // keeps auto-following the device across reloads.
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, preference); } catch (e) { /* ignore */ }
    }, [preference]);

    const setPreference = (p: ThemePreference) => setPreferenceState(p);
    const cycleTheme = () => setPreferenceState(p => (p === 'system' ? 'light' : p === 'light' ? 'dark' : 'system'));
    const toggleTheme = () => setPreferenceState(theme === 'dark' ? 'light' : 'dark');

    return (
        <ThemeContext.Provider value={{ theme, preference, setPreference, cycleTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
