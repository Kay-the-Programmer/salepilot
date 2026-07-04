import React, { useState } from 'react';
import { useTheme, THEME_PREFERENCE_ICON, THEME_PREFERENCE_LABEL } from '../../contexts/ThemeContext';

export interface AppNavItem {
    icon: string;
    label: string;
    active?: boolean;
    onClick: () => void;
}

interface AppNavMenuProps {
    /** The current app's own navigation sections (replaces the bottom tab bar). */
    items: AppNavItem[];
    /** "Full SalePilot App" — leave the standalone app. */
    onExit?: () => void;
    onLogout?: () => void;
    /** Extra classes for the icon buttons so they match the host app bar. */
    triggerClassName?: string;
}

/**
 * Top-right mobile control cluster for the standalone apps: a compact dropdown
 * exposing the current app's own sections (so the bottom tab bar can be
 * removed), plus the global light/dark toggle beside it.
 */
export const AppNavMenu: React.FC<AppNavMenuProps> = ({ items, onExit, onLogout, triggerClassName }) => {
    const [open, setOpen] = useState(false);
    const { preference, cycleTheme } = useTheme();

    const btnClass = triggerClassName
        || 'inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition';

    const itemClass = (active?: boolean) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition ${active ? 'bg-primary/10 text-primary' : 'text-brand-text hover:bg-surface-variant'}`;

    // Only show the dropdown when there's something in it; otherwise the cluster
    // is just the theme toggle.
    const hasMenu = items.length > 0 || !!onExit || !!onLogout;

    return (
        <div className="flex items-center gap-1">
            {hasMenu && (
            <div className="relative">
                <button type="button" onClick={() => setOpen(o => !o)} aria-label="App menu" aria-haspopup="menu" aria-expanded={open} className={btnClass}>
                    <span className="material-symbols-rounded">menu</span>
                </button>
                {open && (
                    <>
                        <div className="fixed inset-0 z-[60]" aria-hidden="true" onClick={() => setOpen(false)} />
                        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-[61] min-w-[224px] max-h-[72vh] overflow-y-auto bg-surface rounded-2xl shadow-xl border border-brand-border p-1.5 animate-fade-in">
                            {items.map(it => (
                                <button key={it.label} type="button" role="menuitem" onClick={() => { setOpen(false); it.onClick(); }} className={itemClass(it.active)}>
                                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{it.icon}</span>{it.label}
                                </button>
                            ))}
                            {(onExit || onLogout) && <div className="h-px bg-brand-border my-1.5" />}
                            {onExit && (
                                <button type="button" role="menuitem" onClick={() => { setOpen(false); onExit(); }} className={itemClass(false)}>
                                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>grid_view</span>Full SalePilot App
                                </button>
                            )}
                            {onLogout && (
                                <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-danger hover:bg-danger-muted transition">
                                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>logout</span>Logout
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
            )}
            <button type="button" onClick={cycleTheme} aria-label="Switch theme — auto, light or dark" title={THEME_PREFERENCE_LABEL[preference]} className={btnClass}>
                <span className="material-symbols-rounded">{THEME_PREFERENCE_ICON[preference]}</span>
            </button>
        </div>
    );
};

export default AppNavMenu;
