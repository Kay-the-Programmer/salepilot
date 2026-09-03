import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { getLaunchableApps } from './standalone/standaloneApps';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';
import { Customer, Product, User } from '../types';

/**
 * One search box over the whole product.
 *
 * SalePilot is twenty separate apps behind a launcher, which means "record an
 * expense" or "find that customer" starts with remembering which app owns it.
 * Ctrl+K skips that step: type what you want, press Enter, land on it.
 *
 * Records are loaded once on first open and reused, rather than per keystroke —
 * the catalog is already fetched wholesale elsewhere in the app, and going
 * through `api.get` means the palette keeps working from the offline cache.
 */

type Result =
    | { kind: 'app'; id: string; label: string; hint: string; icon: string; to: string }
    | { kind: 'product'; id: string; label: string; hint: string; icon: string; to: string }
    | { kind: 'customer'; id: string; label: string; hint: string; icon: string; to: string };

const GROUP_LABEL: Record<Result['kind'], string> = {
    app: 'Apps',
    product: 'Products',
    customer: 'Customers',
};

/** Cheap subsequence-free contains match — enough for a list this size. */
const matches = (haystack: string | undefined | null, needle: string): boolean =>
    !!haystack && haystack.toLowerCase().includes(needle);

const MAX_PER_GROUP = 6;

const CommandPalette: React.FC = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadedRecords, setLoadedRecords] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    // Resolved when the palette is opened rather than on render: this component
    // lives in App, which does not re-render when Dashboard signs someone in,
    // so reading the user at render time would pin it to whoever was signed in
    // when the tab loaded — nobody, on a fresh load.
    const [user, setUser] = useState<User | null>(null);

    // Ctrl/Cmd+K from anywhere. Registered even when closed, which is the point.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) return;
            const current = getCurrentUser() as User | null;
            // Signed out (the login screen, the public storefront): leave the
            // shortcut to the browser rather than swallowing it for a palette
            // that has nothing to search.
            if (!current) return;
            e.preventDefault();
            setUser(current);
            setOpen(v => !v);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Records are fetched the first time the palette is opened, not on mount —
    // no reason to pull the catalog for a session that never presses Ctrl+K.
    useEffect(() => {
        if (!open || loadedRecords || !user?.currentStoreId) return;
        setLoadedRecords(true);
        Promise.allSettled([api.get<Product[]>('/products'), api.get<Customer[]>('/customers')])
            .then(([p, c]) => {
                if (p.status === 'fulfilled' && Array.isArray(p.value)) setProducts(p.value);
                if (c.status === 'fulfilled' && Array.isArray(c.value)) setCustomers(c.value);
            });
    }, [open, loadedRecords, user?.currentStoreId]);

    useEffect(() => {
        if (!open) { setQuery(''); setActive(0); }
    }, [open]);

    const results = useMemo<Result[]>(() => {
        const q = query.trim().toLowerCase();
        const apps = getLaunchableApps(user)
            .filter(a => !q || matches(a.name, q) || matches(a.desc, q))
            .slice(0, q ? MAX_PER_GROUP : 100)
            .map<Result>(a => ({
                kind: 'app', id: `app:${a.route}`, label: a.name, hint: a.desc,
                icon: a.iconName, to: `/${a.route}`,
            }));

        // An empty box lists the apps alone — a launcher. Records only join in
        // once there is something to match them against.
        if (!q) return apps;

        const productHits = products
            .filter(p => matches(p.name, q) || matches(p.sku, q) || matches(p.barcode, q))
            .slice(0, MAX_PER_GROUP)
            .map<Result>(p => ({
                kind: 'product', id: `product:${p.id}`, label: p.name,
                hint: [p.sku, p.barcode].filter(Boolean).join(' · ') || 'Product',
                icon: 'inventory_2', to: `/inv/items?product=${encodeURIComponent(p.id)}`,
            }));

        const customerHits = customers
            .filter(c => matches(c.name, q) || matches(c.phone, q) || matches(c.email, q))
            .slice(0, MAX_PER_GROUP)
            .map<Result>(c => ({
                kind: 'customer', id: `customer:${c.id}`, label: c.name,
                hint: c.phone || c.email || 'Customer',
                icon: 'person', to: '/crm/customers',
            }));

        return [...apps, ...productHits, ...customerHits];
    }, [query, products, customers, user]);

    // Any change to the result set invalidates where the highlight was sitting.
    useEffect(() => { setActive(0); }, [query]);

    const go = useCallback((r: Result | undefined) => {
        if (!r) return;
        setOpen(false);
        navigate(r.to);
    }, [navigate]);

    const onInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            go(results[active]);
        }
    };

    // Keep the highlighted row in view when arrowing past the fold.
    useEffect(() => {
        listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    // Never opened this session (or signed out): nothing to render.
    if (!user) return null;

    let lastKind: Result['kind'] | null = null;

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            size="xl"
            align="top"
            ariaLabel="Search SalePilot"
            className="!max-h-[70vh]"
        >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-border">
                <span className="material-symbols-rounded text-brand-text-muted text-[20px]" aria-hidden="true">search</span>
                <input
                    data-autofocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Search apps, products and customers…"
                    aria-label="Search apps, products and customers"
                    className="flex-1 bg-transparent text-base text-brand-text placeholder:text-brand-text-muted outline-none"
                />
                <kbd className="hidden sm:inline-block rounded border border-brand-border px-1.5 py-0.5 text-[10px] font-bold text-brand-text-muted">ESC</kbd>
            </div>

            <div ref={listRef} className="overflow-y-auto py-2">
                {results.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-brand-text-muted">
                        Nothing matches “{query}”.
                    </p>
                ) : (
                    results.map((r, i) => {
                        const showHeader = r.kind !== lastKind;
                        lastKind = r.kind;
                        return (
                            <React.Fragment key={r.id}>
                                {showHeader && (
                                    <p className="px-4 pt-2 pb-1 text-[11px] font-black uppercase tracking-wider text-brand-text-muted">
                                        {GROUP_LABEL[r.kind]}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    data-active={i === active}
                                    onMouseEnter={() => setActive(i)}
                                    onClick={() => go(r)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? 'bg-surface-variant' : ''}`}
                                >
                                    <span className="material-symbols-rounded text-brand-text-muted text-[20px] shrink-0" aria-hidden="true">{r.icon}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-brand-text">{r.label}</span>
                                        <span className="block truncate text-[11px] text-brand-text-muted">{r.hint}</span>
                                    </span>
                                    {i === active && (
                                        <kbd className="hidden sm:inline-block shrink-0 rounded border border-brand-border px-1.5 py-0.5 text-[10px] font-bold text-brand-text-muted">↵</kbd>
                                    )}
                                </button>
                            </React.Fragment>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};

export default CommandPalette;
