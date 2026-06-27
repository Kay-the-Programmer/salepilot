import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { getLaunchableApps, AppDef } from './standaloneApps';
import { recordAppUse, getSuggestedRoutes } from './appUsage';

interface AppSwitcherOverlayProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    /** Route of the app currently open, to highlight it in the list (e.g. 'crm'). */
    currentRoute?: string;
}

/**
 * Controlled full-screen "all SalePilot apps" overlay (portalled to <body>).
 * Apple-style: a "Suggested" row of the user's most-used apps on top, then the
 * full A–Z app list in a grouped card. Tapping one navigates to `/<route>`.
 */
export const AppSwitcherOverlay: React.FC<AppSwitcherOverlayProps> = ({ open, onClose, user, currentRoute }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        // Opening the switcher from an app counts as using that app.
        recordAppUse(currentRoute);
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [open, onClose, currentRoute]);

    const apps = useMemo(() => getLaunchableApps(user), [user]);
    const suggested = useMemo(() => {
        const byRoute = new Map(apps.map(a => [a.route, a]));
        return getSuggestedRoutes(apps.map(a => a.route), 4)
            .map(r => byRoute.get(r))
            .filter((a): a is AppDef => !!a);
    }, [apps]);
    const allSorted = useMemo(() => [...apps].sort((a, b) => a.name.localeCompare(b.name)), [apps]);

    if (!open) return null;

    const go = (route: string) => { recordAppUse(route); onClose(); navigate(`/${route}`); };

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
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Suggested — recency-weighted most-used apps */}
                    {suggested.length > 0 && (
                        <section>
                            <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">Suggested</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {suggested.map(a => (
                                    <button
                                        key={a.route}
                                        type="button"
                                        onClick={() => go(a.route)}
                                        aria-current={currentRoute === a.route ? 'page' : undefined}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition active:scale-95 ${currentRoute === a.route ? 'border-primary bg-primary/5' : 'border-brand-border bg-surface hover:border-primary/40 hover:bg-surface-variant'}`}
                                    >
                                        <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            <span className="material-symbols-rounded" style={{ fontSize: 26 }}>{a.iconName}</span>
                                        </span>
                                        <span className="text-xs font-bold text-brand-text truncate w-full">{a.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All apps — grouped A–Z list (the Apple way) */}
                    <section>
                        <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">All Apps</h3>
                        <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden divide-y divide-brand-border">
                            {allSorted.map(a => {
                                const active = currentRoute === a.route;
                                return (
                                    <button
                                        key={a.route}
                                        type="button"
                                        onClick={() => go(a.route)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition ${active ? 'bg-primary/5' : 'hover:bg-surface-variant'}`}
                                    >
                                        <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{a.iconName}</span>
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-bold text-brand-text truncate">{a.name}</span>
                                            <span className="block text-xs text-brand-text-muted truncate">{a.desc}</span>
                                        </span>
                                        <span className={`material-symbols-rounded flex-shrink-0 ${active ? 'text-primary' : 'text-brand-text-muted'}`} style={{ fontSize: 20 }}>chevron_right</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default AppSwitcherOverlay;
