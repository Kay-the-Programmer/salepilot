import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { getLaunchableApps } from './standaloneApps';

interface AppSwitcherOverlayProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    /** Route of the app currently open, to highlight it in the grid (e.g. 'crm'). */
    currentRoute?: string;
}

/**
 * Controlled full-screen "all SalePilot apps" overlay (portalled to <body>).
 * Lists every app the user can open; tapping one navigates to `/<route>`.
 * Used by `AppSwitcher` (its own trigger) and directly by shells that already
 * have a launcher button (e.g. the POS rail/drawer).
 */
export const AppSwitcherOverlay: React.FC<AppSwitcherOverlayProps> = ({ open, onClose, user, currentRoute }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [open, onClose]);

    if (!open) return null;
    const apps = getLaunchableApps(user);
    const go = (route: string) => { onClose(); navigate(`/${route}`); };

    return createPortal(
        <div className="fixed inset-0 z-[300] bg-background flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label="SalePilot apps">
            <header className="flex-shrink-0 flex items-center justify-between px-5 h-16 bg-surface border-b border-brand-border">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }}>apps</span>
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-extrabold text-brand-text leading-tight truncate">SalePilot Apps</h2>
                        <p className="text-xs text-brand-text-muted">Jump to any app</p>
                    </div>
                </div>
                <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition">
                    <span className="material-symbols-rounded">close</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                    {apps.map(a => {
                        const active = currentRoute === a.route;
                        return (
                            <button
                                key={a.route}
                                type="button"
                                onClick={() => go(a.route)}
                                aria-current={active ? 'page' : undefined}
                                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition active:scale-95 ${active ? 'border-primary bg-primary/5' : 'border-brand-border bg-surface hover:border-primary/40 hover:bg-surface-variant'}`}
                            >
                                <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="material-symbols-rounded">{a.iconName}</span>
                                </span>
                                <span className="min-w-0 w-full">
                                    <span className="block text-sm font-bold text-brand-text truncate">{a.name}</span>
                                    <span className="block text-xs text-brand-text-muted leading-snug line-clamp-2">{a.desc}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default AppSwitcherOverlay;
