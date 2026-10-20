import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { getLaunchableApps, AppDef, APP_GROUPS, AppGroup } from './standaloneApps';
import { recordAppUse, getSuggestedRoutes } from './appUsage';
import salepilotlogo from '../../assets/salepilot.png';

/** A card of app rows. One per group when browsing, one for the hits when searching. */
const AppRows: React.FC<{
    apps: AppDef[];
    currentRoute?: string;
    onPick: (route: string) => void;
}> = ({ apps, currentRoute, onPick }) => (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden divide-y divide-brand-border">
        {apps.map(a => {
            const active = currentRoute === a.route;
            return (
                <button
                    key={a.route}
                    type="button"
                    onClick={() => onPick(a.route)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition ${active ? 'bg-primary/5' : 'hover:bg-surface-variant'}`}
                >
                    <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }} aria-hidden="true">{a.iconName}</span>
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-brand-text truncate">{a.name}</span>
                        <span className="block text-xs text-brand-text-muted truncate">{a.desc}</span>
                    </span>
                    <span className={`material-symbols-rounded flex-shrink-0 ${active ? 'text-primary' : 'text-brand-text-muted'}`} style={{ fontSize: 20 }} aria-hidden="true">chevron_right</span>
                </button>
            );
        })}
    </div>
);

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
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (!open) return;
        setFilter('');
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

    // Twenty tiles is more than anyone scans comfortably. Typing narrows the
    // list on both the name and what the app is for, so "expense" finds it
    // without having to know it is called Expenses.
    const q = filter.trim().toLowerCase();
    const visible = useMemo(
        () => (q ? allSorted.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)) : allSorted),
        [allSorted, q],
    );

    /**
     * The apps under each heading, in group order, skipping empty groups.
     *
     * Browsing is by job — Sell, Stock, Customers, Money, Setup — because
     * someone looking for where to record what they spent knows they want to
     * do something with money, not that we called it Expenses. Searching stays
     * flat: once you have typed, the list of matches *is* the answer and
     * splitting it across headings only hides it.
     */
    const grouped = useMemo(() => {
        const byGroup = new Map<AppGroup, AppDef[]>();
        // Registry order, not A–Z: within a group the apps are listed in the
        // order a shop reaches for them, so Till is the first thing under Sell
        // rather than the last because its name starts with T.
        for (const a of apps) {
            const list = byGroup.get(a.group) || [];
            list.push(a);
            byGroup.set(a.group, list);
        }
        return APP_GROUPS
            .map(g => ({ group: g, items: byGroup.get(g) || [] }))
            .filter(s => s.items.length > 0);
    }, [apps]);

    if (!open) return null;

    const go = (route: string) => { recordAppUse(route); onClose(); navigate(`/${route}`); };

    return createPortal(
        <div className="fixed inset-0 z-[300] bg-background flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label="SalePilot apps">
            <header className="relative flex-shrink-0 flex items-center justify-between px-5 h-16 bg-surface border-b border-brand-border">
                <div className="flex items-center gap-2.5 min-w-0 z-10">
                    <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-rounded" style={{ fontSize: 22 }} aria-hidden="true">apps</span>
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-base font-extrabold text-brand-text leading-tight truncate">App Menu</h2>
                    </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <img src={salepilotlogo} alt="SalePilot" className="h-7 sm:h-8 w-auto object-contain" />
                </div>
                <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-text-muted hover:bg-surface-variant active:scale-90 transition z-10">
                    <span className="material-symbols-rounded" aria-hidden="true">close</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Contextual cross-sell slot (revives the discover_card surface). */}

                    <div className="flex items-center gap-2.5 rounded-xl border border-brand-border bg-surface px-3.5 py-2.5">
                        <span className="material-symbols-rounded text-brand-text-muted" style={{ fontSize: 20 }} aria-hidden="true">search</span>
                        <input
                            autoFocus
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            onKeyDown={e => {
                                // Enter on a single remaining match opens it, so a
                                // filter that has already narrowed to one app does
                                // not still need a deliberate click.
                                if (e.key === 'Enter' && visible.length === 1) go(visible[0].route);
                            }}
                            placeholder="Search apps"
                            aria-label="Filter apps"
                            className="flex-1 bg-transparent text-sm text-brand-text placeholder:text-brand-text-muted outline-none"
                        />
                        {filter && (
                            <button type="button" onClick={() => setFilter('')} aria-label="Clear filter" className="text-brand-text-muted hover:text-brand-text">
                                <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">close</span>
                            </button>
                        )}
                    </div>

                    {/* Suggested — recency-weighted most-used apps. Hidden while
                        filtering, where the filtered list is the answer. */}
                    {!q && suggested.length > 0 && (
                        <section>
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
                                            <span className="material-symbols-rounded" style={{ fontSize: 26 }} aria-hidden="true">{a.iconName}</span>
                                        </span>
                                        <span className="text-xs font-bold text-brand-text truncate w-full">{a.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All apps — one card per job, so you can find something by
                        knowing what you want to do rather than what we named it. */}
                    {visible.length === 0 ? (
                        <section>
                            <p className="rounded-2xl border border-brand-border bg-surface px-4 py-8 text-center text-sm text-brand-text-muted">
                                Nothing matches “{filter}”.
                            </p>
                        </section>
                    ) : q ? (
                        <section>
                            <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                                {visible.length} match{visible.length === 1 ? '' : 'es'}
                            </h3>
                            <AppRows apps={visible} currentRoute={currentRoute} onPick={go} />
                        </section>
                    ) : (
                        grouped.map(({ group, items }) => (
                            <section key={group}>
                                <h3 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">{group}</h3>
                                <AppRows apps={items} currentRoute={currentRoute} onPick={go} />
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default AppSwitcherOverlay;
