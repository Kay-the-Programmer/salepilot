import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { User, StoreSettings } from '../../types';
import { getAccessibleNavItems } from '../Sidebar';
import PosIcon from '../sales/PosIcon';
import AssistantCharacter from './AssistantCharacter';
import { hasModule, MODULES, isPageEntitled, MARKETING_COMING_SOON } from '../../utils/entitlements';
import { useUpsell } from '../../contexts/UpsellContext';
import '../../pages/sale-v2.css';
import './pos-shell.css';
import './discover.css';

interface PosDiscoverProps {
    user: User;
    /** Pages the current role/plan is entitled to (PERMISSIONS[role]). */
    allowedPages: string[];
    /** Store entitlements — used to mark premium add-on apps as locked. */
    storeSettings?: StoreSettings | null;
    /** Launch an app into the full app (navigates to /<page>). */
    onLaunch: (page: string) => void;
    onOpenSidebar?: () => void;
}

type Tint = [string, string];
const DEFAULT_TINT: Tint = ['#0c8f6e', '#00654b'];

/** Per-app brand colours — a curated, premium palette for the icon tiles so the
 *  whole launcher reads as one consistent product family. */
const TINTS: Record<string, Tint> = {
    superadmin: ['#10a37d', '#00513c'],
    dash: ['#12a37d', '#00654b'],
    hustle: ['#f0a93c', '#d4820a'],
    assistant: ['#7b7bf0', '#4b4bc9'],
    crm: ['#e0728f', '#b83a66'],
    marketing: ['#3b82f6', '#1e40af'],
    store: ['#0e9c78', '#00654b'],
    businesses: ['#7d8aa0', '#3e4944'],
    inv: ['#1fb0a0', '#0c6f66'],
    team: ['#5aa0f2', '#2f6fd0'],
    procure: ['#f0894b', '#d4630a'],
    books: ['#34b27b', '#0c8f6e'],
    fleet: ['#46c6e0', '#1f9fc0'],
    po: ['#f0b54b', '#cf9410'],
    subscription: ['#f0c64b', '#d4a017'],
    config: ['#8a93a6', '#5b6478'],
    audit: ['#7d8aa0', '#566076'],
    notify: ['#ef7070', '#d64545'],
    account: ['#5ab0f2', '#2f8fd0'],
    // raw pages
    reports: ['#12a37d', '#00513c'],
    pos: ['#34b27b', '#0c8f6e'],
    directory: ['#b07ce0', '#8a4fd0'],
    'user-guide': ['#5aa0f2', '#2f6fd0'],
};

/** Marketing badges — novelty & social proof drive taps. */
const TAGS: Record<string, 'New' | 'Popular'> = {
    dash: 'New',
    assistant: 'Popular',
    crm: 'Popular',
    inv: 'New',
    marketing: 'New',
    store: 'New',
    businesses: 'New',
};

const DESCRIPTIONS: Record<string, string> = {
    'reports': 'Detailed reports & export',
    'pos': 'Point of sale terminal',
    'directory': 'Marketplace & requests',
    'user-guide': 'Help & documentation',
};

type AppDef = { name: string; page: string; route: string; desc: string; iconName: string; requires: string; module?: string; comingSoon?: boolean };

// Standalone apps that open in their own focused shell.
const STANDALONE_APPS: AppDef[] = [
    { name: 'Super Admin', page: 'superadmin', route: 'superadmin', desc: 'Platform control center', iconName: 'admin_panel_settings', requires: 'superadmin' },
    { name: 'Business Dashboard', page: 'dash', route: 'dash', desc: 'Sales, trends & insights', iconName: 'monitoring', requires: 'reports' },
    { name: 'Hustle POS', page: 'hustle', route: 'hustle', desc: 'Fast amount-entry sales', iconName: 'bolt', requires: 'sales' },
    { name: 'Business Assistant', page: 'assistant', route: 'assistant', desc: 'AI insights & data chat', iconName: 'auto_awesome', requires: 'quick-view', module: MODULES.AI_ASSISTANT },
    { name: 'CRM', page: 'crm', route: 'crm', desc: 'Customers, loyalty & insights', iconName: 'diversity_3', requires: 'customers' },
    { name: 'Marketing Suite', page: 'marketing', route: 'marketing', desc: 'Facebook posts, comments & insights', iconName: 'campaign', requires: 'marketing', comingSoon: MARKETING_COMING_SOON },
    { name: 'Online Store', page: 'online-store', route: 'store', desc: 'Storefront link, QR & catalog sharing', iconName: 'storefront', requires: 'online-store' },
    { name: 'My Businesses', page: 'businesses', route: 'businesses', desc: 'Run multiple shops from one account', iconName: 'domain', requires: 'businesses' },
    { name: 'Inventory Manager', page: 'inv', route: 'inv', desc: 'Stock value, alerts & items', iconName: 'inventory_2', requires: 'inventory' },
    { name: 'User Manager', page: 'team', route: 'team', desc: 'Team members, roles & access', iconName: 'manage_accounts', requires: 'users' },
    { name: 'Procurement Hub', page: 'procure', route: 'procure', desc: 'Suppliers & purchase orders', iconName: 'local_shipping', requires: 'suppliers' },
    { name: 'Accounting Hub', page: 'books', route: 'books', desc: 'Ledger, expenses & reports', iconName: 'account_balance', requires: 'accounting' },
    { name: 'Logistics', page: 'fleet', route: 'fleet', desc: 'Shipments, couriers & fleet', iconName: 'local_shipping', requires: 'logistics' },
    { name: 'Purchase Orders', page: 'po', route: 'po', desc: 'Order lists & supplier POs', iconName: 'shopping_cart_checkout', requires: 'purchase-orders' },
    { name: 'Subscription', page: 'subscription', route: 'subscription', desc: 'Plan, billing & modules', iconName: 'card_membership', requires: 'subscription' },
    { name: 'Settings', page: 'config', route: 'config', desc: 'Store, POS & system config', iconName: 'settings', requires: 'settings' },
    { name: 'Audit Trail', page: 'audit', route: 'audit', desc: 'Activity log & alerts', iconName: 'manage_search', requires: 'audit-trail' },
    { name: 'Notifications', page: 'notify', route: 'notify', desc: 'Alerts & messages', iconName: 'notifications', requires: 'notifications' },
    { name: 'Account', page: 'account', route: 'account', desc: 'Profile & preferences', iconName: 'account_circle', requires: 'profile' },
];

type Feature = {
    requires: string; route: string; module?: string; premium?: boolean;
    eyebrow: string; title: string; text: string; cta: string; icon: string; tint: Tint;
    character?: boolean;
};

// Top-of-page promotional slides — invite users to try premium / high-value apps.
const FEATURES: Feature[] = [
    { requires: 'quick-view', route: 'assistant', module: MODULES.AI_ASSISTANT, eyebrow: 'AI Suite', title: 'Meet your AI business partner', text: 'Ask anything about your shop — sales, stock, customers — and get instant answers.', cta: 'Try Assistant', icon: 'auto_awesome', tint: ['#7b7bf0', '#4b3bc9'], character: true },
    { requires: 'reports', route: 'reports', premium: true, eyebrow: 'Premium', title: 'Unlock Advanced Reports', text: 'P&L, cashflow & deep analytics — export-ready for tax and investors.', cta: 'Unlock now', icon: 'query_stats', tint: ['#0e9c78', '#00513c'] },
    { requires: 'customers', route: 'crm', eyebrow: 'Grow revenue', title: 'Turn buyers into regulars', text: 'Loyalty, segments and re-engagement that keep customers coming back.', cta: 'Open CRM', icon: 'diversity_3', tint: ['#e0728f', '#a8325c'] },
    { requires: 'inventory', route: 'inv', eyebrow: 'Stay in stock', title: 'Never run out again', text: 'Live stock value, low-stock alerts and smart reorder insights.', cta: 'Open Inventory', icon: 'inventory_2', tint: ['#1fb0a0', '#0c6258'] },
];

type Tip = { icon: string; title: string; text: string; cta: string; route: string; premium?: boolean };
const TIPS: Tip[] = [
    { icon: 'auto_awesome', title: 'Did you know?', text: 'The Business Assistant can summarise your whole day in one tap.', cta: 'Try it', route: 'assistant' },
    { icon: 'workspace_premium', title: 'Pro tip', text: 'Unlock Advanced Reports to export a P&L statement for your accountant.', cta: 'See plans', route: 'subscription', premium: true },
    { icon: 'diversity_3', title: 'Grow faster', text: 'Stores using CRM loyalty see customers return up to 30% more often.', cta: 'Open CRM', route: 'crm' },
    { icon: 'inventory_2', title: 'Stay stocked', text: 'Inventory Manager warns you before your bestsellers sell out.', cta: 'Open', route: 'inv' },
];

interface Tile {
    key: string; name: string; desc: string; icon: React.ReactNode;
    tint: Tint; tag?: 'New' | 'Popular'; locked: boolean; comingSoon?: boolean; onClick: () => void;
}

export const PosDiscover: React.FC<PosDiscoverProps> = ({ user, allowedPages, storeSettings, onLaunch, onOpenSidebar }) => {
    const SUPERSEDED_BY_APP = ['users', 'support', 'inventory', 'suppliers', 'customers', 'returns', 'stock-takes', 'sales', 'sales-history', 'dash', 'quick-view', 'subscription', 'audit-trail', 'notifications', 'profile', 'accounting', 'logistics', 'purchase-orders', 'settings', 'superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'superadmin/settings'];

    const rawPages = useMemo(
        () => getAccessibleNavItems(user, allowedPages).filter(item => !SUPERSEDED_BY_APP.includes(item.page)),
        [user, allowedPages],
    );

    const [query, setQuery] = useState('');

    // ── Contextual upsell tile (discover_card surface) ────────────────────────
    const { getEligible, recordShown, recordClick, getPrice } = useUpsell();
    const discoverMoment = getEligible('discover_card');
    const discoverPrice = discoverMoment ? getPrice(discoverMoment.module) : null;
    useEffect(() => {
        if (discoverMoment) recordShown(discoverMoment);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [discoverMoment?.id]);
    const openUpsell = () => {
        if (!discoverMoment) return;
        recordClick(discoverMoment);
        onLaunch(`subscription?view=addons&module=${encodeURIComponent(discoverMoment.module)}`);
    };

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    })();
    const firstName = user?.name?.split(' ')[0] || 'there';

    // ── Featured slider ──────────────────────────────────────────────────────
    const features = useMemo(() => FEATURES.filter(f => allowedPages.includes(f.requires)), [allowedPages]);
    const [slide, setSlide] = useState(0);
    const [playing, setPlaying] = useState(true);
    const slideCount = features.length;

    useEffect(() => {
        if (slideCount <= 1 || !playing) return;
        const t = setInterval(() => setSlide(s => (s + 1) % slideCount), 5200);
        return () => clearInterval(t);
    }, [slideCount, playing]);

    useEffect(() => { if (slide >= slideCount && slideCount > 0) setSlide(0); }, [slideCount, slide]);

    const launchFeature = (f: Feature) => {
        const locked = f.premium || (!!f.module && !hasModule(storeSettings, f.module));
        onLaunch(locked ? 'subscription' : f.route);
    };

    // ── "Did you know?" popup ────────────────────────────────────────────────
    const [tipOpen, setTipOpen] = useState(false);
    const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
    const dismissedRef = useRef(false);
    useEffect(() => {
        const t = setTimeout(() => { if (!dismissedRef.current) setTipOpen(true); }, 4000);
        return () => clearTimeout(t);
    }, []);
    const tip = TIPS[tipIdx % TIPS.length];
    const closeTip = () => { dismissedRef.current = true; setTipOpen(false); };
    const nextTip = () => setTipIdx(i => (i + 1) % TIPS.length);

    // ── GSAP entrance polish (runs once, respects reduced-motion) ─────────────
    const pageRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const ctx = gsap.context(() => {
            gsap.from('.ddisc__title', { y: 18, opacity: 0, duration: 0.55, ease: 'power3.out' });
            gsap.from('.ddisc__sub', { y: 14, opacity: 0, duration: 0.55, delay: 0.06, ease: 'power3.out' });
            gsap.from('.ddisc__search', { y: 14, opacity: 0, duration: 0.55, delay: 0.12, ease: 'power3.out' });
            gsap.from('.dfeat', { y: 22, opacity: 0, duration: 0.65, delay: 0.1, ease: 'power3.out' });
            gsap.from('.dapptile', { y: 16, opacity: 0, duration: 0.5, stagger: 0.035, delay: 0.2, ease: 'power2.out' });
            gsap.from('.dpromo', { y: 16, opacity: 0, duration: 0.5, delay: 0.24, ease: 'power2.out' });
        }, pageRef);
        return () => ctx.revert();
    }, []);

    // ── Normalised app tiles ─────────────────────────────────────────────────
    const standaloneTiles: Tile[] = useMemo(() => STANDALONE_APPS
        .filter(a => allowedPages.includes(a.requires))
        .map(app => {
            const locked = !!app.module && !hasModule(storeSettings, app.module);
            return {
                key: app.page,
                name: app.name,
                desc: app.desc,
                icon: <PosIcon name={app.iconName} size={26} fill={1} />,
                tint: TINTS[app.route] || DEFAULT_TINT,
                tag: TAGS[app.route],
                locked,
                comingSoon: app.comingSoon,
                onClick: () => onLaunch(locked ? 'subscription' : app.route),
            };
        }), [allowedPages, storeSettings, onLaunch]);

    const moreTiles: Tile[] = useMemo(() => rawPages.map(item => {
        const Icon = item.icon;
        const locked = !isPageEntitled(storeSettings, item.page);
        return {
            key: item.page,
            name: item.name,
            desc: DESCRIPTIONS[item.page] || 'Open app',
            icon: <Icon className="dapptile__glyph" />,
            tint: TINTS[item.page] || DEFAULT_TINT,
            tag: TAGS[item.page],
            locked,
            onClick: () => onLaunch(locked ? 'subscription' : item.page),
        };
    }), [rawPages, storeSettings, onLaunch]);

    const q = query.trim().toLowerCase();
    const match = (t: Tile) => !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    const standaloneFiltered = standaloneTiles.filter(match);
    const moreFiltered = moreTiles.filter(match);
    const noResults = q && standaloneFiltered.length === 0 && moreFiltered.length === 0;

    const renderTile = (t: Tile) => (
        <button
            key={t.key}
            type="button"
            className={`dapptile${t.comingSoon ? ' dapptile--soon' : ''}`}
            onClick={t.onClick}
            title={t.comingSoon ? 'Coming soon' : t.locked ? 'Premium add-on — tap to unlock' : t.name}
        >
            <span className="dapptile__icon" style={{ backgroundImage: `linear-gradient(135deg, ${t.tint[0]}, ${t.tint[1]})` }}>
                {t.icon}
                <span className="dapptile__gloss" aria-hidden="true" />
            </span>
            <span className="dapptile__body">
                <span className="dapptile__name">{t.name}</span>
                <span className="dapptile__desc">{t.desc}</span>
            </span>
            <span className={`dapptile__cta${t.comingSoon ? ' dapptile__cta--soon' : t.locked ? ' dapptile__cta--locked' : ''}`}>
                {t.comingSoon ? <><PosIcon name="schedule" size={13} /> Coming Soon</> : t.locked ? <><PosIcon name="lock" size={13} /> Unlock</> : 'Open'}
            </span>
            {t.comingSoon
                ? <span className="dapptile__tag dapptile__tag--soon">Soon</span>
                : t.tag && <span className={`dapptile__tag dapptile__tag--${t.tag.toLowerCase()}`}>{t.tag}</span>}
        </button>
    );

    return (
        <div className="posdash ddisc" ref={pageRef}>
            {/* Hero */}
            <header className="ddisc__hero">
                <div className="ddisc__hero-top">
                    <button type="button" className="posdash__menu" aria-label="Open menu" onClick={onOpenSidebar}>
                        <PosIcon name="apps" size={22} />
                    </button>
                    <span className="ddisc__eyebrow">{greeting}, {firstName}</span>
                </div>
                <h1 className="ddisc__title">Discover</h1>
                <p className="ddisc__sub">Your toolkit for running and managing your business, explore what each app can do.</p>
                <div className="ddisc__search">
                    <PosIcon name="search" size={20} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search apps & features"
                        aria-label="Search apps"
                    />
                    {query && (
                        <button type="button" className="ddisc__search-clear" aria-label="Clear search" onClick={() => setQuery('')}>
                            <PosIcon name="close" size={18} />
                        </button>
                    )}
                </div>
            </header>

            <div className="ddisc__body">
                {/* Featured slider */}
                {!q && features.length > 0 && (
                    <section
                        className="dfeat"
                        aria-roledescription="carousel"
                        aria-label="Featured"
                    >
                        <div className="dfeat__viewport">
                            <div className="dfeat__track" style={{ transform: `translateX(-${slide * 100}%)` }}>
                                {features.map((f, i) => (
                                    <article
                                        className={`dfeat__slide${f.character ? ' dfeat__slide--character' : ''}`}
                                        key={f.route}
                                        style={{ backgroundImage: `linear-gradient(125deg, ${f.tint[0]}, ${f.tint[1]})` }}
                                        aria-hidden={i !== slide}
                                    >
                                        <div className="dfeat__content">
                                            <span className="dfeat__eyebrow">
                                                {f.premium && <PosIcon name="workspace_premium" size={14} fill={1} />}
                                                {f.eyebrow}
                                            </span>
                                            <h2 className="dfeat__title">{f.title}</h2>
                                            <p className="dfeat__text">{f.text}</p>
                                            <button type="button" className="dfeat__cta" onClick={() => launchFeature(f)}>
                                                {f.cta}
                                                <PosIcon name="arrow_forward" size={18} />
                                            </button>
                                        </div>
                                        {f.character ? (
                                            <AssistantCharacter className="dfeat__character" />
                                        ) : (
                                            <span className="dfeat__ghost" aria-hidden="true">
                                                <PosIcon name={f.icon} size={200} fill={1} />
                                            </span>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </div>

                        {slideCount > 1 && (
                            <div className="dfeat__nav">
                                <button type="button" className="dfeat__arrow dfeat__arrow--prev" aria-label="Previous" onClick={() => setSlide(s => (s - 1 + slideCount) % slideCount)}>
                                    <PosIcon name="chevron_left" size={22} />
                                </button>
                                <button
                                    type="button"
                                    className="dfeat__pause"
                                    aria-label={playing ? 'Pause' : 'Play'}
                                    aria-pressed={!playing}
                                    onClick={() => setPlaying(p => !p)}
                                >
                                    <PosIcon name={playing ? 'pause' : 'play_arrow'} size={24} fill={1} />
                                </button>
                                <button type="button" className="dfeat__arrow dfeat__arrow--next" aria-label="Next" onClick={() => setSlide(s => (s + 1) % slideCount)}>
                                    <PosIcon name="chevron_right" size={22} />
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {noResults ? (
                    <div className="posdash__empty">
                        <PosIcon name="search_off" size={40} />
                        <p>No apps match “{query}”.</p>
                    </div>
                ) : (
                    <>
                        {standaloneFiltered.length > 0 && (
                            <section className="ddisc__section">
                                <div className="ddisc__section-head">
                                    <h2 className="ddisc__section-title">SalePilot Apps</h2>
                                    <span className="ddisc__section-count">{standaloneFiltered.length}</span>
                                </div>
                                <div className="dapptile-grid">
                                    {standaloneFiltered.map(renderTile)}
                                </div>
                            </section>
                        )}

                        {/* Upgrade / cross-sell banner — contextual when the engine has a
                            discover_card moment, otherwise the generic promo. */}
                        {!q && (discoverMoment ? (
                            <button type="button" className="dpromo" onClick={openUpsell}>
                                <span className="dpromo__icon"><PosIcon name="workspace_premium" size={26} fill={1} /></span>
                                <span className="dpromo__body">
                                    <span className="dpromo__title">{discoverMoment.headline}</span>
                                    <span className="dpromo__text">
                                        {discoverMoment.body}
                                        {discoverPrice ? ` From ${discoverPrice.currency === 'ZMW' ? 'K' : `${discoverPrice.currency} `}${discoverPrice.price.toLocaleString()}/mo.` : ''}
                                    </span>
                                </span>
                                <span className="dpromo__cta">{discoverMoment.ctaLabel} <PosIcon name="arrow_forward" size={18} /></span>
                            </button>
                        ) : (
                            <button type="button" className="dpromo" onClick={() => onLaunch('subscription')}>
                                <span className="dpromo__icon"><PosIcon name="rocket_launch" size={26} fill={1} /></span>
                                <span className="dpromo__body">
                                    <span className="dpromo__title">Get more from SalePilot</span>
                                    <span className="dpromo__text">Add only the premium modules your shop needs — and pay less than all-in-one suites.</span>
                                </span>
                                <span className="dpromo__cta">Explore plans <PosIcon name="arrow_forward" size={18} /></span>
                            </button>
                        ))}

                        {moreFiltered.length > 0 && (
                            <section className="ddisc__section">
                                <div className="ddisc__section-head">
                                    <h2 className="ddisc__section-title">More</h2>
                                    <span className="ddisc__section-count">{moreFiltered.length}</span>
                                </div>
                                <div className="dapptile-grid">
                                    {moreFiltered.map(renderTile)}
                                </div>
                            </section>
                        )}

                        {standaloneTiles.length === 0 && moreTiles.length === 0 && (
                            <div className="posdash__empty">
                                <PosIcon name="apps" size={40} />
                                <p>No apps available for your account.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* "Did you know?" marketing popup */}
            {tipOpen && (
                <div className="dtip" role="status">
                    <span className="dtip__icon"><PosIcon name={tip.icon} size={22} fill={1} /></span>
                    <div className="dtip__body">
                        <p className="dtip__title">
                            {tip.title}
                            {tip.premium && <span className="dtip__premium">Premium</span>}
                        </p>
                        <p className="dtip__text">{tip.text}</p>
                    </div>
                    <div className="dtip__actions">
                        <button type="button" className="dtip__cta" onClick={() => { onLaunch(tip.route); closeTip(); }}>{tip.cta}</button>
                        <button type="button" className="dtip__next" aria-label="Next tip" onClick={nextTip}><PosIcon name="refresh" size={16} /></button>
                        <button type="button" className="dtip__close" aria-label="Dismiss" onClick={closeTip}><PosIcon name="close" size={18} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosDiscover;
