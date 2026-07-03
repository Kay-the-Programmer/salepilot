import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import SocketService from './services/socketService';
import { SnackbarType } from './App';
import { Product, Category, StockTakeSession, Sale, Return, Customer, Supplier, PurchaseOrder, User, StoreSettings, Account, JournalEntry, AuditLog, Payment, SupplierInvoice, SupplierPayment, Expense, RecurringExpense } from './types';
import Logo from './assets/logo.png';
import { lazy, Suspense } from 'react';

import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';
import { hasModule, MODULES } from './utils/entitlements';
import type { CampaignDTO } from './utils/upsell';
import { ROLE_PAGES } from './utils/rbac';

const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const StandaloneShell = lazy(() => import('@/components/standalone/StandaloneShell'));
const PosShell = lazy(() => import('@/components/pos/PosShell'));
const PosDashboard = lazy(() => import('@/components/pos/PosDashboard'));
const CrmApp = lazy(() => import('@/components/crm/CrmApp'));
const MarketingApp = lazy(() => import('@/components/marketing/MarketingApp'));
const OnlineStoreApp = lazy(() => import('@/components/shop/OnlineStoreApp'));
const MultiStoreApp = lazy(() => import('@/components/standalone/MultiStoreApp'));
const DashboardApp = lazy(() => import('@/components/dash-app/DashboardApp'));
const InventoryApp = lazy(() => import('@/components/inventory-app/InventoryApp'));
const TeamApp = lazy(() => import('@/components/team-app/TeamApp'));
const ProcureApp = lazy(() => import('@/components/procure-app/ProcureApp'));
const AssistantApp = lazy(() => import('@/pages/assistant/AssistantApp'));
const AuditApp = lazy(() => import('@/pages/audit/AuditApp'));
const NotificationsApp = lazy(() => import('@/pages/notifications/NotificationsApp'));
const ProfileApp = lazy(() => import('@/pages/profile/ProfileApp'));
const AccountingApp = lazy(() => import('@/pages/accounting/AccountingApp'));
const LogisticsApp = lazy(() => import('@/pages/logistics/LogisticsApp'));
const PurchaseOrdersApp = lazy(() => import('@/pages/purchase-orders/PurchaseOrdersApp'));
const HustleApp = lazy(() => import('@/pages/hustle/HustleApp'));
const SettingsApp = lazy(() => import('@/pages/settings/SettingsApp'));
const SalesPage = lazy(() => import('@/pages/SalesPage'));
const StockTakePage = lazy(() => import('@/pages/StockTakePage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const StoreRegistrationPage = lazy(() => import('@/pages/StoreRegistrationPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
// The Super Admin platform pages now live inside a single standalone app shell
// (its own navigation + brand chrome), opened from the app switcher like the other apps.
const SuperAdminApp = lazy(() => import('@/components/superadmin-app/SuperAdminApp'));
const MarketplacePage = lazy(() => import('@/pages/shop/MarketplacePage'));
const MarketplaceDashboard = lazy(() => import('@/pages/shop/CustomerDashboard')); // The Marketplace Portal
const CustomerOrdersPage = lazy(() => import('@/pages/customers/CustomerDashboard')); // The My Orders Page
const MarketplaceRequestActionPage = lazy(() => import('@/pages/MarketplaceRequestActionPage'));
const UserGuidePage = lazy(() => import('@/pages/UserGuidePage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));

import { useToast } from './contexts/ToastContext';
import VerifyEmailOtpModal from './components/VerifyEmailOtpModal';
import { useLogoutModal } from './contexts/LogoutModalContext';
import { useAppSwitcher } from './contexts/AppSwitcherContext';
import { getCurrentUser, logout, getUsers, saveUser, deleteUser, verifySession, changePassword } from './services/authService';
import { api, getOnlineStatus, syncOfflineMutations, getPendingMutationCount } from './services/api';
import { dbService } from './services/dbService';
import {
    BuildingStorefrontIcon
} from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import PriorityNotificationModal from './components/PriorityNotificationModal';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { logEvent } from './src/utils/analytics';
import { useUpsellSync } from './contexts/UpsellContext';
import { upsellService } from './services/upsellService';
import { notificationService } from './services/notificationService';

// Key helper for persisting the last visited page per user
const getLastPageKey = (userId?: string) => userId ? `salePilot.lastPage.${userId}` : 'salePilot.lastPage';
const getSuperModeKey = (userId?: string) => userId ? `salePilot.superMode.${userId}` : 'salePilot.superMode';

// SnackbarType now imported from App.tsx

// Role → page access. Sourced from the single canonical RBAC map in
// utils/rbac.ts so the route guard here and the app switcher
// can never disagree about who may open what.
const PERMISSIONS: Record<User['role'], string[]> = ROLE_PAGES;

const DEFAULT_PAGES: Record<User['role'], string> = {
    superadmin: 'superadmin',
    admin: 'dash',
    staff: 'pos',
    inventory_manager: 'dash',
    customer: 'customer/dashboard',
    supplier: 'supplier/dashboard'
};

// Standalone app shells launched from the app switcher. Each opens in its own
// focused frame and is gated by an underlying sidebar entitlement page key — keep
// this in sync with standaloneApps' STANDALONE_APPS so deep-links/refreshes resolve.
const STANDALONE_APP_REQUIRES: Record<string, string> = {
    pos: 'pos',
    assistant: 'quick-view',
    dash: 'reports',
    crm: 'customers',
    inv: 'inventory',
    team: 'users',
    procure: 'suppliers',
    audit: 'audit-trail',
    notify: 'notifications',
    account: 'profile',
    books: 'accounting',
    fleet: 'logistics',
    po: 'purchase-orders',
    hustle: 'sales',
    config: 'settings',
    superadmin: 'superadmin',
};


export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    // Returns render inside the POS Sales History & Refunds view (fetched there);
    // this cache only backs offline warm-up.
    const [, setReturns] = useState<Return[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
    const [stockTakeSession, setStockTakeSession] = useState<StockTakeSession | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [showOtpModal, setShowOtpModal] = useState(false);
    // Logout confirmation is mounted by LogoutModalProvider (a parent of every
    // Dashboard branch) so it shows from the standalone app shells too.
    const { requestLogout } = useLogoutModal();
    const [installPrompt, setInstallPrompt] = useState<any | null>(null); // PWA install prompt event
    // Standalone POS shell (/pos) mobile drawer
    const [posDrawerOpen, setPosDrawerOpen] = useState(false);

    // Superadmin mode and store selection
    const [superMode, setSuperMode] = useState<'superadmin' | 'store'>(() => {
        try {
            const u = getCurrentUser();
            const saved = localStorage.getItem(getSuperModeKey(u?.id));
            return (saved === 'store' || saved === 'superadmin') ? (saved as any) : 'superadmin';
        } catch { return 'superadmin'; }
    });
    const [systemStores, setSystemStores] = useState<{ id: string; name: string }[]>([]);

    // --- Offline State ---
    // (Only the setters are consumed since the legacy sidebar — which displayed
    //  online/sync status — was retired; the sync engine still drives them.)
    const [, setIsOnline] = useState(getOnlineStatus());
    const [, setIsSyncing] = useState(false);
    const [, setLastSync] = useState<number | null>(null);
    // Number of offline changes still queued for sync (drives the retry timer).
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Priority notifications are now handled within NotificationContext or dedicated components

    // All feedback goes through the single global toast engine (ToastProvider in
    // App.tsx). Dashboard used to render its own one-shot snackbar here, but that
    // renderer only existed in the main-shell branch — every standalone app
    // (POS, CRM, Procure, …) called showSnackbar into the void.
    const { showToast } = useToast();
    const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
        showToast(message, type);
    }, [showToast]);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            console.log("Install prompt captured");
            setInstallPrompt(e);
        };
        const onInstalled = () => {
            setInstallPrompt(null);
            try { console.log('App installed'); } catch { }
        };
        window.addEventListener('beforeinstallprompt', handler as any);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler as any);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const handleInstall = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                logEvent('System', 'Install PWA');
                showSnackbar('SalePilot has been installed!', 'success');
            }
            setInstallPrompt(null);
        });
    };

    const navigate = useNavigate();
    const location = useLocation();
    const { openAppSwitcher } = useAppSwitcher();

    // Suppress all proactive upsell while a sale is in progress (POS sale flow).
    const isMidSale = (() => {
        const seg = location.pathname.split('/')[1] || '';
        return seg === 'sales' || seg === 'hustle' || location.pathname === '/pos';
    })();

    // Keep the contextual upsell engine's data snapshot in sync with the store.
    // (A hook — runs before this component's many early returns, so every app
    //  branch can read it via useUpsell.)
    useUpsellSync({
        currentUser,
        storeSettings,
        products,
        customers,
        sales,
        users,
        isMidSale,
        storeCount: systemStores.length || 1,
    });

    // Load live add-on prices once authenticated, so upsell copy can show real
    // Kwacha prices (cached for offline by the service). Prices are never hardcoded.
    useEffect(() => {
        if (!currentUser) return;
        api.get<Array<{ id: string; price: number; currency: string }>>('/subscriptions/addons')
            .then(list => upsellService.setPricing(list))
            .catch(() => { /* keep last-cached pricing */ });
        // Load Super-Admin-authored upsell campaigns (offers / A-B / scheduling).
        // The engine merges these over its built-in defaults; on failure it keeps
        // the last-cached set, and absent any cache falls back to the defaults.
        api.get<{ campaigns: CampaignDTO[] }>('/subscriptions/upsell-campaigns')
            .then(res => upsellService.setCampaigns(res?.campaigns))
            .catch(() => { /* keep last-cached campaigns / built-in defaults */ });
    }, [currentUser]);

    // Record upsell funnel events server-side (in addition to GA4) so the Super
    // Admin marketing analytics has data. Fire-and-forget — telemetry never blocks UI.
    useEffect(() => {
        upsellService.setEventSink((name, params) => {
            // Conversions/revenue are derived server-side from real payments; only
            // send the top-of-funnel signals (impression / click / dismiss).
            if (name === 'upsell_convert') return;
            api.post('/subscriptions/upsell-events', { name, ...params }).catch(() => { /* ignore */ });
        });
        return () => upsellService.setEventSink(null);
    }, []);

    // High-value data moment delivered as a single local push (dormant_customers
    // only). Fires at most once per session, never prompts for permission, and
    // honours cooldown/budget via the engine.
    const pushFiredRef = useRef(false);
    useEffect(() => {
        if (pushFiredRef.current) return;
        const m = upsellService.getEligible('push');
        if (!m) return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        pushFiredRef.current = true;
        notificationService
            .showLocalNotification(m.headline, { body: m.body, data: { url: '/crm', momentId: m.id, module: m.module } })
            .then(ok => { if (ok) upsellService.recordShown(m); });
    }, [products, customers, sales, currentUser, isMidSale]);

    const hasAccess = (page: string, role: User['role']) => {
        const seg = page.split('/')[0];
        // The platform owner can always open the Super Admin app, whichever
        // mode they're in — the mode flag only gates the store-scoped pages.
        if (role === 'superadmin' && seg === 'superadmin') return true;
        // When superadmin is in super mode, only allow strictly superadmin routes (Superadmin page)
        if (role === 'superadmin' && superMode === 'superadmin') {
            return ['superadmin', 'whatsapp', 'profile'].includes(seg);
        }
        const effectiveRole: User['role'] = (role === 'superadmin' && superMode === 'store') ? 'admin' : role;
        // Standalone app shells (their own focused frames) map to an underlying
        // entitlement page key, so deep-linking / refreshing them doesn't bounce.
        const required = STANDALONE_APP_REQUIRES[seg];
        if (required) return PERMISSIONS[effectiveRole].includes(required);
        return PERMISSIONS[effectiveRole].includes(page);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Using api.get which now handles automatic IndexedDB fallback and caching
            const results = await Promise.allSettled([
                api.get<Product[]>('/products'),
                api.get<Category[]>('/categories'),
                api.get<Customer[]>('/customers'),
                api.get<Supplier[]>('/suppliers'),
                api.get<Sale[]>('/sales'),
                api.get<PurchaseOrder[]>('/purchase-orders'),
                api.get<Account[]>('/accounting/accounts'),
                api.get<JournalEntry[]>('/accounting/journal-entries'),
                api.get<SupplierInvoice[]>('/accounting/supplier-invoices'),
                api.get<User[]>('/users'),
                api.get<StoreSettings>('/settings'),
                api.get<Return[]>('/returns'),
                api.get<AuditLog[]>('/audit'),
                api.get<StockTakeSession | null>('/stock-takes/active'),
                api.get<Expense[]>('/expenses'),
                api.get<RecurringExpense[]>('/recurring-expenses'),
                currentUser?.currentStoreId ? api.get<any[]>('/audit') : Promise.resolve([] as any[]) // Placeholder for aligned indexing if needed
            ]);

            const mapResult = <T,>(res: PromiseSettledResult<T>, fallback: T): T =>
                res.status === 'fulfilled' ? res.value : fallback;

            setProducts(mapResult(results[0], [] as Product[]));
            setCategories(mapResult(results[1], [] as Category[]));
            setCustomers(mapResult(results[2], [] as Customer[]));
            setSuppliers(mapResult(results[3], [] as Supplier[]));
            setSales(mapResult(results[4], [] as Sale[]));
            setPurchaseOrders(mapResult(results[5], [] as PurchaseOrder[]));
            setAccounts(mapResult(results[6], [] as Account[]));
            setJournalEntries(mapResult(results[7], [] as JournalEntry[]));
            setSupplierInvoices(mapResult(results[8], [] as SupplierInvoice[]));
            setUsers(mapResult(results[9], [] as User[]));
            setStoreSettings(mapResult(results[10], null as any));
            setReturns(mapResult(results[11], [] as Return[]));
            setAuditLogs(mapResult(results[12], [] as AuditLog[]));
            setStockTakeSession(mapResult(results[13], null as any));
            setExpenses(mapResult(results[14], { items: [] as Expense[] } as any).items || []);
            setRecurringExpenses(mapResult(results[15], [] as RecurringExpense[]));


            // Fetch pending marketplace matches separately to avoid blocking
            /* 
            if (currentUser?.currentStoreId) {
                api.get<any[]>(`/marketplace/stores/${currentUser.currentStoreId}/matches`)
                    .then(matches => setPendingMatches(matches || []))
                    .catch(() => setPendingMatches([]));
            }
            */

            if (dbService && typeof dbService.updateLastSync === 'function') {
                await dbService.updateLastSync();
            }
            if (dbService && typeof dbService.getLastSync === 'function') {
                const ts = await dbService.getLastSync();
                setLastSync(ts);
            }

        } catch (err: any) {
            console.error("Critical fetch error:", err);
            setError(err.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.currentStoreId]);

    // Replay the offline queue. `silent` suppresses the "Syncing…" toast for
    // automatic background runs (startup, retry timer) so only user-meaningful
    // outcomes surface. Reentrancy is guarded inside syncOfflineMutations.
    const handleSync = useCallback(async (opts?: { silent?: boolean }) => {
        if (!getOnlineStatus()) return;

        const pending = await getPendingMutationCount();
        if (pending === 0) { setPendingSyncCount(0); return; }

        setIsSyncing(true);
        if (!opts?.silent) showSnackbar('Syncing offline changes…', 'sync');

        const { succeeded, failed, deadLettered, remaining } = await syncOfflineMutations();

        setIsSyncing(false);
        setPendingSyncCount(remaining);
        if (succeeded > 0) {
            const ts = Date.now();
            setLastSync(ts);
        }

        if (succeeded > 0 || deadLettered > 0) {
            if (deadLettered > 0) {
                showSnackbar(
                    `Synced ${succeeded} change${succeeded === 1 ? '' : 's'}. ${deadLettered} couldn't be saved and need attention.`,
                    'error'
                );
            } else {
                showSnackbar(`Synced ${succeeded} offline change${succeeded === 1 ? '' : 's'}.`, 'success');
            }
            fetchData(); // Refetch to reconcile with the server's canonical state.
        } else if (failed > 0 && !opts?.silent) {
            showSnackbar(`Still offline — ${remaining} change${remaining === 1 ? '' : 's'} will retry automatically.`, 'info');
        }
    }, [showSnackbar, fetchData]);

    // React to connectivity changes (custom event bridged from online/offline).
    useEffect(() => {
        const handleStatusChange = () => {
            const onlineStatus = getOnlineStatus();
            setIsOnline(onlineStatus);
            if (onlineStatus) {
                handleSync();
            }
        };
        window.addEventListener('onlineStatusChange', handleStatusChange);
        return () => window.removeEventListener('onlineStatusChange', handleStatusChange);
    }, [handleSync]);

    // On startup, flush anything left queued from a previous session and seed the badge.
    useEffect(() => {
        getPendingMutationCount()
            .then(count => {
                setPendingSyncCount(count);
                if (count > 0 && getOnlineStatus()) handleSync({ silent: true });
            })
            .catch(() => { /* ignore */ });
    }, [handleSync]);

    // The service worker pings us (via Background Sync) when connectivity returns
    // even if the tab was backgrounded — flush the queue when it does.
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === 'flush-sync' && getOnlineStatus()) {
                handleSync({ silent: true });
            }
        };
        navigator.serviceWorker.addEventListener('message', onMessage);
        return () => navigator.serviceWorker.removeEventListener('message', onMessage);
    }, [handleSync]);

    // Fallback retry loop: while changes remain queued and we're online, keep
    // retrying on an interval (covers backoff windows and platforms without
    // Background Sync). Stops as soon as the queue drains.
    useEffect(() => {
        if (pendingSyncCount <= 0) return;
        const id = setInterval(() => {
            if (getOnlineStatus()) handleSync({ silent: true });
        }, 30_000);
        return () => clearInterval(id);
    }, [pendingSyncCount, handleSync]);

    useEffect(() => {
        const initSyncStatus = async () => {
            try {
                if (dbService && typeof dbService.getLastSync === 'function') {
                    const ts = await dbService.getLastSync();
                    setLastSync(ts);
                }
            } catch (err) {
                console.error("Failed to load last sync timestamp:", err);
            }
        };
        initSyncStatus();
    }, []);

    // Notification Polling logic removed as it is now handled in NotificationContext.tsx

    // Real-time Request Notifications (Sellers)
    useEffect(() => {
        if (!currentUser || currentUser.role === 'customer') return;

        const socketService = SocketService.getInstance(); // Ensure import
        const socket = socketService.getSocket();

        // Join sellers room
        socket.emit('join_sellers');

        const handleNewRequest = (data: any) => {
            // Only show if the notification is relevant to this store (if storeId is provided)
            // If data.storeId is missing, it might be a global broadcast, so we show it (fallthrough)
            // But if it is present, it must match our currentStoreId
            if (data.storeId && currentUser?.currentStoreId && data.storeId !== currentUser.currentStoreId) {
                return;
            }

            showSnackbar(`New Request: ${data.title} - ${data.description?.substring(0, 30)}...`, 'info');
            // Play notification sound if desired
            if (Notification.permission === 'granted') {
                new Notification('New Deal Request', {
                    body: data.title,
                    icon: Logo
                });
            }
        };

        socket.on('new_request', handleNewRequest);

        return () => {
            socket.off('new_request', handleNewRequest);
        };
    }, [currentUser, showSnackbar]);

    useEffect(() => {
        const checkSession = async () => {
            // Preload stores for superadmin convenience
            try {
                const u = getCurrentUser();
                if (u?.role === 'superadmin') {
                    const resp = await api.get<{ stores: { id: string; name: string }[] }>("/superadmin/stores");
                    setSystemStores(resp.stores || []);
                }
            } catch { }
            const localUser = getCurrentUser();
            if (localUser && localUser.token) {
                try {
                    const verifiedUser = await verifySession();
                    const authedUser = { ...verifiedUser, token: localUser.token } as User;
                    setCurrentUser(authedUser);
                    try { localStorage.setItem('salePilotUser', JSON.stringify(authedUser)); } catch { }
                    // Check if current path is already valid before redirecting to 'desired'
                    const currentPath = location.pathname.substring(1);
                    if (!currentPath || !hasAccess(currentPath, authedUser.role)) {
                        const key = getLastPageKey(authedUser.id);
                        const saved = localStorage.getItem(key) || localStorage.getItem(getLastPageKey());
                        const fallback = DEFAULT_PAGES[authedUser.role];
                        let desired = fallback;
                        if (authedUser.role === 'superadmin') {
                            const savedMode = localStorage.getItem(getSuperModeKey(authedUser.id));
                            const mode = (savedMode === 'store' || savedMode === 'superadmin') ? savedMode : 'superadmin';
                            setSuperMode(mode as any);
                            desired = mode === 'superadmin' ? 'superadmin' : (saved && hasAccess(saved, 'admin') ? saved : DEFAULT_PAGES['admin']);
                        } else {
                            desired = (saved && hasAccess(saved, authedUser.role) ? saved : fallback);
                        }
                        navigate(`/${desired}`, { replace: true });
                    }
                } catch (error) {
                    console.log("Session verification failed, running in offline mode.");
                    setCurrentUser(localUser as User); // Assume user is valid offline
                    // Check if current path is already valid before redirecting
                    const currentPath = location.pathname.substring(1);
                    if (!currentPath || !hasAccess(currentPath, localUser.role)) {
                        const key = getLastPageKey(localUser.id);
                        const saved = localStorage.getItem(key) || localStorage.getItem(getLastPageKey());
                        const fallback = DEFAULT_PAGES[localUser.role];
                        let desired = fallback;
                        if (localUser.role === 'superadmin') {
                            const savedMode = localStorage.getItem(getSuperModeKey(localUser.id));
                            const mode = (savedMode === 'store' || savedMode === 'superadmin') ? savedMode : 'superadmin';
                            setSuperMode(mode as any);
                            desired = mode === 'superadmin' ? 'superadmin' : (saved && hasAccess(saved, 'admin') ? saved : DEFAULT_PAGES['admin']);
                        } else {
                            desired = (saved && hasAccess(saved, localUser.role) ? saved : fallback);
                        }
                        navigate(`/${desired}`, { replace: true });
                    }
                }
            }
            setIsAuthLoading(false);
        };
        checkSession();
    }, []);

    useEffect(() => {
        if (currentUser?.currentStoreId) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [currentUser?.currentStoreId, fetchData]);

    // Superadmin store mode needs the store list (picker gate + top-bar select);
    // reload it here in case the mount-time preload failed or hasn't run.
    useEffect(() => {
        if (currentUser?.role === 'superadmin' && superMode === 'store' && systemStores.length === 0) {
            api.get<{ stores: { id: string; name: string }[] }>('/superadmin/stores')
                .then(resp => setSystemStores(resp.stores || []))
                .catch(() => { /* picker shows loading text; snackbars stay quiet */ });
        }
    }, [currentUser?.role, superMode, systemStores.length]);

    const handleLogin = (user: User) => {
        // Force superadmin mode to 'superadmin' on login to ensure the correct dashboard is shown
        try {
            if (user.role === 'superadmin') {
                setSuperMode('superadmin');
                localStorage.setItem(getSuperModeKey(user.id), 'superadmin');
            } else {
                // For non-superadmin users, no super mode applies
            }
        } catch { }
        setCurrentUser(user);
        logEvent('Auth', 'Login', user.role);
        // Business accounts without a store go straight to /register (the single
        // store-registration surface) — never to a data page they can't use yet.
        const needsStore = !user.currentStoreId && user.role !== 'superadmin' && user.role !== 'customer' && user.role !== 'supplier';
        const desired = user.role === 'superadmin' ? 'superadmin'
            : needsStore ? 'register'
            : DEFAULT_PAGES[user.role];
        // Persist last page for this user for consistency across reloads
        try {
            const key = getLastPageKey(user.id);
            localStorage.setItem(key, desired);
        } catch (_) { /* ignore storage errors */ }
        navigate(`/${desired}`);
        showSnackbar(`Welcome back, ${user.name}!`, 'success');
    };

    const handleConfirmLogout = () => {
        logout();
        setCurrentUser(null);
        logEvent('Auth', 'Logout');
        showSnackbar('You have been logged out.', 'info');
    };

    const handleLogout = () => {
        requestLogout(handleConfirmLogout);
    };

    const handleSaveSettings = async (settings: StoreSettings) => {
        try {
            const result = await api.put<StoreSettings>('/settings', settings);
            if ((result as any).offline) {
                showSnackbar('Offline: Settings change queued.', 'info');
            } else {
                setStoreSettings(result);
                showSnackbar('Store settings updated successfully!', 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleSaveProduct = async (productData: Product | Omit<Product, 'id'>): Promise<Product> => {
        try {
            const isUpdating = 'id' in productData && !!(productData as Product).id;

            // Use FormData for both creating and updating to consistently handle images (kept for future compatibility)
            const formData = new FormData();
            Object.keys(productData).forEach(key => {
                const value = (productData as any)[key];
                if (key === 'images' && Array.isArray(value)) {
                    value.forEach(image => {
                        // We only append new files, not existing URL strings
                        if (image instanceof File) {
                            formData.append('images', image);
                        }
                    });
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            // If updating, send existing image URLs so the backend knows what to keep
            if (isUpdating && (productData as Product).imageUrls) {
                formData.append('existing_images', JSON.stringify((productData as Product).imageUrls));
            }

            const savedProduct = isUpdating
                ? await api.put<Product & { offline?: boolean }>(`/products/${(productData as Product).id}`, productData)
                // Send as JSON, the backend handles both content types now.
                : await api.post<Product & { offline?: boolean }>('/products', productData);

            if ((savedProduct as any).offline) {
                showSnackbar(`Offline: Change for "${(productData as any).name}" queued.`, 'info');
                const tempId = isUpdating ? (productData as Product).id : `offline_${Date.now()}`;
                const tempProduct = { ...(productData as any), id: tempId, imageUrls: [] } as Product;
                // UI update for offline
                if (isUpdating) {
                    setProducts(prev => prev.map(p => p.id === tempId ? tempProduct : p));
                } else {
                    setProducts(prev => [tempProduct, ...prev]);
                    upsellService.recordManualAdd();
                }
                // Persist to IndexedDB so details remain available after reload while offline
                try { await dbService.put('products', tempProduct); } catch (_) { }
                return tempProduct;
            } else {
                showSnackbar(`Product ${isUpdating ? 'updated' : 'added'} successfully!`, 'success');
                logEvent('Inventory', isUpdating ? 'Update Product' : 'Create Product');
                // Update state directly instead of calling fetchData()
                if (isUpdating) {
                    setProducts(prev => prev.map(p => p.id === (savedProduct as Product).id ? (savedProduct as Product) : p));
                } else {
                    // Add the new product to the top of the list
                    setProducts(prev => [savedProduct as Product, ...prev]);
                    upsellService.recordManualAdd();
                }
                return savedProduct as Product;
            }
        } catch (err: any) {
            // The error message from the backend is more user-friendly
            const message = err.response?.data?.message || err.message;
            showSnackbar(message, 'error');
            throw err;
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        try {
            const result = await api.delete(`/products/${productId}`);
            if ((result as any).offline) {
                showSnackbar('Offline: Product deletion queued.', 'info');
            } else {
                showSnackbar('Product permanently deleted.', 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleArchiveProduct = async (productId: string) => {
        try {
            const result = await api.patch<Product & { offline?: boolean }>(`/products/${productId}/archive`, {});
            if ((result as any).offline) {
                showSnackbar('Offline: Product status change queued.', 'info');
            } else {
                showSnackbar(`Product ${result.status === 'archived' ? 'archived' : 'restored'}.`, 'info');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleStockChange = async (productId: string, newStock: number) => {
        try {
            // Optimistic UI update
            // Optimistic UI update
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

            const result = await api.patch(`/products/${productId}/stock`, { newQuantity: newStock, reason: 'Quick adjustment' });

            if ((result as any).offline) {
                showSnackbar('Offline: Stock change queued.', 'info');
            } else {
                fetchData(); // Sync with server state
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
            setProducts(await api.get('/products')); // Revert on error
        }
    };

    const handleStockAdjustment = async (productId: string, newQuantity: number, reason: string) => {
        try {
            const result = await api.patch(`/products/${productId}/stock`, { newQuantity, reason });
            if ((result as any).offline) {
                showSnackbar('Offline: Stock adjustment queued.', 'info');
            } else {
                setProducts(await api.get('/products'));
                showSnackbar('Stock adjusted successfully.', 'success');
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleProcessSale = async (sale: Sale): Promise<Sale | null> => {
        try {
            // Ensure sale has a transactionId before sending to API. The random
            // suffix avoids collisions when two sales land in the same millisecond.
            const saleWithId: Sale = {
                ...sale,
                transactionId: sale.transactionId || `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                timestamp: sale.timestamp || new Date().toISOString()
            };

            const result = await api.post<Sale>('/sales', saleWithId);
            if ((result as any).offline) {
                showSnackbar('Offline: sale saved on this device and queued for sync.', 'info');

                const currentStoreId = currentUser?.currentStoreId;

                // Keep the UI row, the IndexedDB cache, and the queued mutation all
                // keyed by the SAME transactionId, so the optimistic record is
                // cleaned up — not duplicated — once it replays online.
                const pendingSale = { ...saleWithId, _pending: true } as Sale;
                setSales(prev => [pendingSale, ...prev]);

                // Optimistic stock decrement, mirrored to IndexedDB (with storeId
                // preserved) so a reload while still offline shows the same figures.
                const changedProducts: Product[] = [];
                setProducts(prev => prev.map(p => {
                    const line = pendingSale.cart.find(i => i.productId === p.id);
                    if (!line) return p;
                    const updated = { ...p, stock: p.stock - line.quantity };
                    changedProducts.push({ ...updated, storeId: currentStoreId ?? (p as any).storeId } as Product);
                    return updated;
                }));
                if (changedProducts.length) {
                    try { await dbService.bulkPut('products', changedProducts); } catch { /* cache best-effort */ }
                }

                if (pendingSale.customerId) {
                    let changedCustomer: Customer | undefined;
                    setCustomers(prev => prev.map(c => {
                        if (c.id !== pendingSale.customerId) return c;
                        const updated: Customer = {
                            ...c,
                            storeCredit: c.storeCredit - (pendingSale.storeCreditUsed || 0),
                            accountBalance: c.accountBalance + (pendingSale.paymentStatus !== 'paid' ? pendingSale.total : 0)
                        };
                        changedCustomer = { ...updated, storeId: currentStoreId ?? (c as any).storeId } as Customer;
                        return updated;
                    }));
                    if (changedCustomer) {
                        try { await dbService.bulkPut('customers', [changedCustomer]); } catch { /* best-effort */ }
                    }
                }

                setPendingSyncCount(c => c + 1);
                return pendingSale;
            } else {
                showSnackbar('Sale completed successfully!', 'success');
                logEvent('Sales', 'Process Sale', `Total: ${sale.total}`);
                fetchData();
                return result;
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
            return null;
        }
    };

    const handleRecordPayment = async (saleId: string, payment: Omit<Payment, 'id'>) => {
        // Optimistic UI update before awaiting API to ensure immediate UI feedback
        const previousSales = sales;
        const previousCustomers = customers;

        const currentSale = sales.find(s => s.transactionId === saleId);
        if (currentSale) {
            const newAmountPaid = (currentSale.amountPaid || 0) + payment.amount;
            const newStatus: Sale['paymentStatus'] = newAmountPaid >= currentSale.total ? 'paid' : 'partially_paid';
            setSales(prev => prev.map(s => s.transactionId === saleId ? {
                ...s,
                amountPaid: newAmountPaid,
                paymentStatus: newStatus,
                payments: [...(s.payments || []), { id: `temp_${Date.now()}`, ...payment }]
            } : s));
            if (currentSale.customerId) {
                setCustomers(prev => prev.map(c => c.id === currentSale.customerId ? {
                    ...c,
                    accountBalance: Math.max(0, c.accountBalance - payment.amount)
                } : c));
            }
        }

        try {
            const result = await api.post<Sale>(`/sales/${saleId}/payments`, payment);
            if ((result as any).offline) {
                showSnackbar('Offline: Payment record queued.', 'info');
            } else {
                showSnackbar('Payment recorded.', 'success');
                // Re-sync to ensure amounts and payments list are consistent with server (IDs, timestamps)
                fetchData();
            }
        } catch (err: any) {
            // Rollback optimistic update on error
            setSales(previousSales);
            setCustomers(previousCustomers);
            showSnackbar(err.message, 'error');
        }
    };

    const handleProcessReturn = async (returnInfo: Return) => {
        try {
            const result = await api.post<Return>('/returns', returnInfo);
            if ((result as any).offline) {
                showSnackbar('Offline: Return queued for sync.', 'info');
            } else {
                showSnackbar('Return processed successfully!', 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    // Generic save handler to reduce boilerplate for simple entities
    const createSaveHandler = <T extends { id?: any, name?: string }>(
        entityName: string,
        endpoint: string,
        currentState: T[]
    ) => async (item: T) => {
        try {
            const isUpdating = currentState.some(e => e.id === item.id);
            const result = await (isUpdating ? api.put(`${endpoint}/${item.id}`, item) : api.post(endpoint, item));
            if ((result as any).offline) {
                showSnackbar(`Offline: ${entityName} changes queued.`, 'info');
            } else {
                showSnackbar(`${entityName} ${isUpdating ? 'updated' : 'saved'}!`, 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleSaveCategory = createSaveHandler('Category', '/categories', categories);
    const handleSaveCustomer = createSaveHandler('Customer', '/customers', customers);
    const handleSaveSupplier = createSaveHandler('Supplier', '/suppliers', suppliers);
    const handleSavePurchaseOrder = createSaveHandler('Purchase Order', '/purchase-orders', purchaseOrders);
    const handleSaveAccount = createSaveHandler('Account', '/accounting/accounts', accounts);
    const handleSaveSupplierInvoice = createSaveHandler('Supplier Invoice', '/accounting/supplier-invoices', supplierInvoices);
    const handleSaveExpense = createSaveHandler('Expense', '/expenses', expenses);
    const handleSaveRecurringExpense = createSaveHandler('Recurring Expense', '/recurring-expenses', recurringExpenses);

    const handleDeleteExpense = async (expenseId: string) => {
        if (window.confirm('Are you sure you want to delete this expense? This will also reverse its journal entry.')) {
            try {
                const result = await api.delete(`/expenses/${expenseId}`);
                if ((result as any).offline) {
                    showSnackbar('Offline: Expense deletion queued.', 'info');
                } else {
                    showSnackbar('Expense deleted successfully.', 'success');
                    fetchData();
                }
            } catch (err: any) {
                showSnackbar(err.message, 'error');
            }
        }
    };

    const handleDeleteRecurringExpense = async (expenseId: string) => {
        if (window.confirm('Are you sure you want to delete this recurring expense? Future expenses will no longer be generated.')) {
            try {
                const result = await api.delete(`/recurring-expenses/${expenseId}`);
                if ((result as any).offline) {
                    showSnackbar('Offline: Deletion queued.', 'info');
                } else {
                    showSnackbar('Recurring expense deleted.', 'success');
                    fetchData();
                }
            } catch (err: any) {
                showSnackbar(err.message, 'error');
            }
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            try {
                const result = await api.delete(`/categories/${categoryId}`);
                if ((result as any).offline) { showSnackbar('Offline: Deletion queued.', 'info'); } else { fetchData(); }
            } catch (err: any) { showSnackbar(err.message, 'error'); }
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        try {
            const result = await api.delete(`/customers/${customerId}`);
            if ((result as any).offline) { showSnackbar('Offline: Deletion queued.', 'info'); } else { fetchData(); }
        } catch (err: any) { showSnackbar(err.message, 'error'); }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        try {
            const result = await api.delete(`/suppliers/${supplierId}`);
            if ((result as any).offline) { showSnackbar('Offline: Deletion queued.', 'info'); } else { fetchData(); }
        } catch (err: any) { showSnackbar(err.message, 'error'); }
    };

    const handleDeletePurchaseOrder = async (poId: string) => {
        try {
            const result = await api.delete(`/purchase-orders/${poId}`);
            if ((result as any).offline) { showSnackbar('Offline: Deletion queued.', 'info'); } else { fetchData(); }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
            throw err;
        }
    };

    const handleReceivePOItems = async (poId: string, receivedItems: { productId: string, quantity: number }[]) => {
        try {
            // The dedicated receive endpoint updates the PO's received quantities,
            // increments stock with weighted-average costing and posts the correct
            // journal entry (Dr Inventory / Cr Goods Received Not Invoiced) in one
            // transaction — never adjust stock separately here, that double-posts.
            const result = await api.post(`/purchase-orders/${poId}/receive`, receivedItems);

            if ((result as any).offline) {
                showSnackbar('Offline: Stock reception queued.', 'info');
            } else {
                showSnackbar('Stock received into inventory.', 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleStartStockTake = async () => {
        try {
            const result = await api.post<StockTakeSession>('/stock-takes', {});
            if ((result as any)?.offline) {
                // Create a local offline session using current products as baseline
                const offlineSession: StockTakeSession = {
                    id: `local-${Date.now()}`,
                    startTime: new Date().toISOString(),
                    status: 'active',
                    items: products
                        .filter(p => p.status !== 'archived')
                        .map(p => ({
                            productId: p.id,
                            name: p.name,
                            sku: p.sku,
                            expected: p.stock,
                            counted: null,
                        }))
                };
                setStockTakeSession(offlineSession);
                await dbService.put('settings', offlineSession, 'activeStockTake');
                navigate('/inv/stock-takes');
                showSnackbar('Offline: Stock take started. Changes will sync when back online.', 'info');
            } else {
                setStockTakeSession(result as StockTakeSession);
                navigate('/inv/stock-takes');
                showSnackbar('New stock take session started.', 'info');
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleUpdateStockTakeItem = async (productId: string, count: number | null) => {
        try {
            const result = await api.put<StockTakeSession>(`/stock-takes/active/items/${productId}`, { count });
            if ((result as any)?.offline) {
                // Update local session
                setStockTakeSession(prev => {
                    if (!prev) return prev;
                    const updated: StockTakeSession = {
                        ...prev,
                        items: prev.items.map(i => i.productId === productId ? { ...i, counted: count } : i)
                    };
                    dbService.put('settings', updated, 'activeStockTake');
                    return updated;
                });
            } else {
                setStockTakeSession(result as StockTakeSession);
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleCancelStockTake = async () => {
        try {
            const result = await api.delete('/stock-takes/active');
            setStockTakeSession(null);
            // Clear local offline session if any
            await dbService.put('settings', null as any, 'activeStockTake');
            if ((result as any)?.offline) {
                showSnackbar('Offline: Cancellation queued.', 'info');
            } else {
                showSnackbar('Stock take cancelled.', 'info');
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleFinalizeStockTake = async () => {
        try {
            const result = await api.post('/stock-takes/active/finalize', {});
            setStockTakeSession(null);
            await dbService.put('settings', null as any, 'activeStockTake');
            if ((result as any)?.offline) {
                showSnackbar('Offline: Finalization queued. Inventory will update once online.', 'info');
            } else {
                showSnackbar('Stock take complete and inventory updated.', 'success');
                fetchData();
            }
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };

    const handleUpdateProfile = async (userData: { name: string; email: string }) => {
        if (!currentUser) throw new Error("No user logged in");
        try {
            const payload = { ...userData, role: currentUser.role }; // Preserve role
            await saveUser(payload, currentUser.id);
            const updatedUser = { ...currentUser, ...userData };
            setCurrentUser(updatedUser);
            showSnackbar('Profile updated successfully!', 'success');
        } catch (err: any) {
            showSnackbar(err.message, 'error');
            throw err; // Propagate error to modal
        }
    };

    const handleChangePassword = async (passwordData: { currentPassword: string, newPassword: string }) => {
        try {
            await changePassword(passwordData);
            showSnackbar('Password changed successfully!', 'success');
        } catch (err: any) {
            showSnackbar(err.message, 'error');
            throw err; // Propagate error to modal
        }
    };

    // --- Accounting Handlers ---
    const handleDeleteAccount = async (accountId: string) => {
        if (window.confirm('Are you sure you want to delete this account?')) {
            try {
                const result = await api.delete(`/accounting/accounts/${accountId}`);
                if ((result as any).offline) { showSnackbar('Offline: Deletion queued.', 'info'); } else { fetchData(); }
            } catch (err: any) { showSnackbar(err.message, 'error'); }
        }
    };
    const handleAddManualJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
        try {
            const result = await api.post('/accounting/journal-entries', entry);
            if ((result as any).offline) { showSnackbar('Offline: Journal entry queued.', 'info'); } else { fetchData(); }
        } catch (err: any) { showSnackbar(err.message, 'error'); }
    };
    const handleRecordSupplierPayment = async (invoiceId: string, payment: Omit<SupplierPayment, 'id'>) => {
        try {
            const result = await api.post(`/accounting/supplier-invoices/${invoiceId}/payments`, payment);
            if ((result as any).offline) { showSnackbar('Offline: Supplier payment queued.', 'info'); } else { fetchData(); }
        } catch (err: any) { showSnackbar(err.message, 'error'); }
    };

    // Superadmin mode switch + active-store selection — formerly housed in the
    // Sidebar, now surfaced in the universal top bar and the store-picker gate
    // below (defined before the early returns so both can use them).
    const changeSuperMode = (mode: 'superadmin' | 'store') => {
        if (!currentUser) return;
        setSuperMode(mode);
        try { localStorage.setItem(getSuperModeKey(currentUser.id), mode); } catch { }
        const effectiveRole: User['role'] = (currentUser.role === 'superadmin' && mode === 'store') ? 'admin' : currentUser.role;
        const allowed = (currentUser.role === 'superadmin' && mode === 'superadmin')
            ? ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'superadmin/catalog', 'superadmin/campaigns', 'superadmin/feedback', 'superadmin/settings', 'whatsapp/conversations', 'whatsapp/settings', 'profile']
            : PERMISSIONS[effectiveRole];
        const page = location.pathname.split('/')[1] || DEFAULT_PAGES[effectiveRole];
        if (!allowed.includes(page)) {
            const next = (currentUser.role === 'superadmin' && mode === 'superadmin') ? 'superadmin' : DEFAULT_PAGES[effectiveRole];
            navigate(`/${next}`);
            try { localStorage.setItem(getLastPageKey(currentUser.id), next); } catch { }
        }
    };
    const selectStore = async (storeId: string) => {
        if (!storeId) return;
        try {
            await api.patch('/users/me/current-store', { storeId });
            const stored = getCurrentUser();
            if (stored) {
                const merged = { ...stored, currentStoreId: storeId } as User;
                localStorage.setItem('salePilotUser', JSON.stringify(merged));
                setCurrentUser(merged);
                showSnackbar('Store context updated.', 'success');
            }
        } catch (err: any) {
            showSnackbar(err.message || 'Failed to set current store', 'error');
        }
    };

    if (isAuthLoading) {
        return <LoadingSpinner />;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} showSnackbar={showSnackbar} />;
    }

    // If user has no current store yet, guide them to create one (except superadmin and customers, who are store-agnostic).
    // /register is the ONLY registration surface — any other URL (e.g. a fresh
    // Google user landing on their role's default page) redirects there instead
    // of rendering a duplicate setup UI in place.
    if (currentUser && !currentUser.currentStoreId && currentUser.role !== 'superadmin' && currentUser.role !== 'customer') {
        if (location.pathname !== '/register') {
            return <Navigate to="/register" replace />;
        }
        const token = getCurrentUser()?.token;
        const handleCompleted = (user: User) => {
            const merged = token ? ({ ...user, token } as User) : user;
            try { localStorage.setItem('salePilotUser', JSON.stringify(merged)); } catch { }
            setCurrentUser(merged);
            navigate(`/${DEFAULT_PAGES[merged.role]}`);
        };
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <StoreRegistrationPage onCompleted={handleCompleted} showSnackbar={showSnackbar} />
            </Suspense>
        );
    }

    // Authenticated users who already have a store have nothing to register —
    // send stray /register or legacy /setup-store visits home.
    if (location.pathname === '/register' || location.pathname === '/setup-store') {
        return <Navigate to="/" replace />;
    }

    // Store settings gating applies for any store-scoped context.
    // The Business Manager (/businesses) is store-AGNOSTIC — it must stay
    // reachable even when the active store's settings can't load (e.g. the
    // store was suspended), so the owner can switch to a healthy business.
    const isStoreAgnosticRoute = location.pathname.split('/')[1] === 'businesses';
    const isStoreScoped = !isStoreAgnosticRoute && ((currentUser.role !== 'superadmin' && currentUser.role !== 'customer') || (currentUser.role === 'superadmin' && superMode === 'store'));
    if (isStoreScoped) {
        if (!storeSettings && isLoading) {
            return <LoadingSpinner text="Loading store settings..." />;
        }

        if (!storeSettings && !isLoading) {
            if (currentUser.role === 'superadmin' && !currentUser.currentStoreId) {
                // Functional store picker — this gate renders before the app shell
                // (no sidebar/top bar exists yet), so it must let the superadmin
                // pick a store or return to the platform itself.
                return (
                    <div className="min-h-screen bg-background flex items-center justify-center p-6">
                        <div className="w-full max-w-md bg-surface border border-brand-border rounded-2xl shadow-sm p-6 space-y-5">
                            <div className="text-center space-y-2">
                                <span className="inline-flex w-14 h-14 rounded-2xl bg-sp-green-soft text-sp-green-dark items-center justify-center">
                                    <BuildingStorefrontIcon className="w-7 h-7" />
                                </span>
                                <h1 className="text-xl font-extrabold tracking-tight text-brand-text">Choose a store to manage</h1>
                                <p className="text-sm text-brand-text-muted">You're in Store mode. Pick which store's dashboard and data to work in.</p>
                            </div>

                            {systemStores.length === 0 ? (
                                <p className="text-sm text-center text-brand-text-muted py-4">Loading stores…</p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto border border-brand-border rounded-xl divide-y divide-brand-border">
                                    {systemStores.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={async () => {
                                                await selectStore(s.id);
                                                navigate(`/${DEFAULT_PAGES['admin']}`);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-surface-variant/60 flex items-center justify-between group transition-colors"
                                        >
                                            <span className="font-semibold text-brand-text group-hover:text-sp-green-dark">{s.name}</span>
                                            <span className="material-symbols-rounded text-brand-text-muted group-hover:text-sp-green-dark text-[20px]">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => { changeSuperMode('superadmin'); navigate('/superadmin'); }}
                                className="w-full py-2.5 rounded-xl bg-surface-variant text-brand-text font-semibold hover:bg-brand-border transition-all active:scale-95"
                            >
                                ← Back to Platform
                            </button>
                        </div>
                    </div>
                );
            }
            return <div className="flex h-screen items-center justify-center p-8 text-center text-red-500">Could not load store settings. The application cannot start. Please check your connection or local data.</div>;
        }
    }




    // ── Shared account overlays ──
    // Email-verification banner + OTP modal + priority platform broadcasts.
    // Mounted by the standalone page branches below (the ones that replaced the
    // legacy sidebar shell, which used to own these). PriorityNotificationModal
    // needs NotificationProvider, so this fragment must render inside one.
    const accountOverlays = (
        <>
            {currentUser && !currentUser.isVerified && currentUser.role !== 'customer' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-2xl">
                    <div className="bg-amber-50/90 dark:bg-amber-900/40 backdrop-blur-xl border border-amber-200/50 dark:border-amber-700/30 p-4 rounded-2xl shadow-[0_8px_32px_-4px_rgba(251,191,36,0.2)] flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-xl text-amber-600 dark:text-amber-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">Email Not Verified</p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Please verify your email to access all features and ensure account security.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        await api.post('/auth/resend-verification', { email: currentUser.email });
                                        setShowOtpModal(true);
                                    } catch (err: any) {
                                        if (err.message && err.message.toLowerCase().includes('already verified')) {
                                            const updated = { ...currentUser, isVerified: true };
                                            setCurrentUser(updated);
                                            try { localStorage.setItem('salePilotUser', JSON.stringify(updated)); } catch { }
                                            showSnackbar('Your email is already verified!', 'success');
                                        } else {
                                            showSnackbar(err.message || 'Failed to resend email.', 'error');
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all active:scale-95 whitespace-nowrap"
                            >
                                Verify Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <VerifyEmailOtpModal
                isOpen={showOtpModal}
                email={currentUser?.email || ''}
                onClose={() => setShowOtpModal(false)}
                onVerified={() => {
                    const updatedUser = { ...currentUser!, isVerified: true };
                    setCurrentUser(updatedUser);
                    try { localStorage.setItem('salePilotUser', JSON.stringify(updatedUser)); } catch { }
                    setShowOtpModal(false);
                    showSnackbar('Email verified successfully!', 'success');
                }}
            />
            <PriorityNotificationModal />
        </>
    );

    const suspenseFallback = <div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>;

    // ── Standalone Business Assistant app (/assistant, /assistant/chat) ──
    // Opens from the app switcher as its own focused app (AI Suite). Runs on
    // the same in-memory data the dashboard already loaded, and the conversational
    // view streams from the existing /ai/chat backend. Gated by the `quick-view`
    // entitlement that every role with AI access already holds.
    const assistantParts = location.pathname.split('/');
    if (assistantParts[1] === 'assistant' && currentUser) {
        const aiAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!aiAllowedPages.includes('quick-view')) {
            return <Navigate to="/" replace />;
        }
        const aiSection = assistantParts[2] === 'chat' ? 'chat' : 'dashboard';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <AssistantApp
                            section={aiSection}
                            user={currentUser}
                            locked={currentUser.role !== 'superadmin' && !hasModule(storeSettings, MODULES.AI_ASSISTANT)}
                            products={products}
                            sales={sales}
                            customers={customers}
                            storeSettings={storeSettings}
                            onNavigate={(s) => navigate(s === 'dashboard' ? '/assistant' : `/assistant/${s}`)}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Accounting Hub app (/books) ──
    const booksParts = location.pathname.split('/');
    if (booksParts[1] === 'books' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('accounting')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <AccountingApp
                            accounts={accounts}
                            journalEntries={journalEntries}
                            sales={sales}
                            customers={customers}
                            suppliers={suppliers}
                            supplierInvoices={supplierInvoices}
                            purchaseOrders={purchaseOrders}
                            expenses={expenses}
                            recurringExpenses={recurringExpenses}
                            storeSettings={storeSettings!}
                            isLoading={isLoading}
                            error={error}
                            onSaveAccount={handleSaveAccount}
                            onDeleteAccount={handleDeleteAccount}
                            onAddManualJournalEntry={handleAddManualJournalEntry}
                            onRecordPayment={handleRecordPayment}
                            onSaveSupplierInvoice={handleSaveSupplierInvoice}
                            onRecordSupplierPayment={handleRecordSupplierPayment}
                            onSaveExpense={handleSaveExpense as any}
                            onDeleteExpense={handleDeleteExpense}
                            onSaveRecurringExpense={handleSaveRecurringExpense as any}
                            onDeleteRecurringExpense={handleDeleteRecurringExpense}
                            user={currentUser}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Settings app (/config) ──
    const configParts = location.pathname.split('/');
    if (configParts[1] === 'config' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('settings')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <SettingsApp settings={storeSettings!} user={currentUser} showSnackbar={showSnackbar} onSave={handleSaveSettings} />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Hustle POS app (/hustle) ──
    const hustleParts = location.pathname.split('/');
    if (hustleParts[1] === 'hustle' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('sales')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <HustleApp
                            sales={sales}
                            storeSettings={storeSettings!}
                            showSnackbar={showSnackbar}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Purchase Orders app (/po) ──
    const poParts = location.pathname.split('/');
    if (poParts[1] === 'po' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('purchase-orders')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <PurchaseOrdersApp
                            purchaseOrders={purchaseOrders}
                            products={products}
                            storeSettings={storeSettings!}
                            onSaveProduct={handleSaveProduct}
                            showSnackbar={showSnackbar}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Logistics app (/fleet) ──
    const fleetParts = location.pathname.split('/');
    if (fleetParts[1] === 'fleet' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('logistics')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <LogisticsApp storeSettings={storeSettings!} />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Audit Trail app (/audit) ──
    const auditParts = location.pathname.split('/');
    if (auditParts[1] === 'audit' && currentUser) {
        const allowed = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!allowed.includes('audit-trail')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <AuditApp logs={auditLogs} users={users} />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Notifications app (/notify) ──
    const notifyParts = location.pathname.split('/');
    if (notifyParts[1] === 'notify' && currentUser) {
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <NotificationsApp />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Account / Profile app (/account) ──
    const accountParts = location.pathname.split('/');
    if (accountParts[1] === 'account' && currentUser) {
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <ProfileApp
                            user={currentUser}
                            storeSettings={storeSettings}
                            onUpdateProfile={handleUpdateProfile}
                            onChangePassword={handleChangePassword}
                            onLogout={handleLogout}
                            onInstall={handleInstall}
                            installPrompt={installPrompt}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Business Dashboard app (/dash, /dash/sales, /dash/products) ──
    // A modern reskin of the /reports overview that opens from the app switcher as its
    // own focused app; every figure is derived from the live sales / products /
    // customers already loaded above (no extra endpoints).
    const dashParts = location.pathname.split('/');
    if (dashParts[1] === 'dash' && currentUser) {
        const dashAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!dashAllowedPages.includes('reports')) {
            return <Navigate to="/" replace />;
        }
        const dashSection = (dashParts[2] === 'sales' ? 'sales' : dashParts[2] === 'products' ? 'products' : 'overview') as 'overview' | 'sales' | 'products';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <DashboardApp
                            section={dashSection}
                            user={currentUser}
                            sales={sales}
                            products={products}
                            customers={customers}
                            storeSettings={storeSettings}
                            onNavigate={(s) => navigate(s === 'overview' ? '/dash' : `/dash/${s}`)}
                            onReports={() => navigate('/reports')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onNewSale={() => navigate('/pos')}
                            onInventory={() => navigate('/inv/items')}
                            onOrders={() => navigate('/orders')}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone CRM app (/crm, /crm/customers, /crm/loyalty, /crm/insights) ──
    // Opens from the app switcher as its own focused app; runs entirely on
    // the existing backend data (customers + sales) already loaded above.
    const crmParts = location.pathname.split('/');
    if (crmParts[1] === 'crm' && currentUser) {
        const crmAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!crmAllowedPages.includes('customers')) {
            return <Navigate to="/" replace />;
        }
        const crmSection = crmParts[2] === 'customers' ? 'customers'
            : crmParts[2] === 'whatsapp' ? 'whatsapp'
                : crmParts[2] === 'loyalty' ? 'loyalty'
                    : crmParts[2] === 'insights' ? 'insights'
                        : 'dashboard';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <CrmApp
                            section={crmSection}
                            user={currentUser}
                            customers={customers}
                            sales={sales}
                            storeSettings={storeSettings}
                            canManage={currentUser.role === 'admin' || currentUser.role === 'superadmin'}
                            onNavigate={(s) => navigate(s === 'dashboard' ? '/crm' : `/crm/${s}`)}
                            onUpgrade={() => navigate('/subscription')}
                            onSaveCustomer={handleSaveCustomer}
                            onDeleteCustomer={handleDeleteCustomer}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Marketing Suite (/marketing) — Facebook Pages management ──
    const marketingParts = location.pathname.split('/');
    if (marketingParts[1] === 'marketing' && currentUser) {
        const mktAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!mktAllowedPages.includes('marketing')) {
            return <Navigate to="/" replace />;
        }
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <MarketingApp
                            user={currentUser}
                            storeSettings={storeSettings}
                            onUpgrade={() => navigate('/subscription')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            showSnackbar={showSnackbar}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Multi-Store Manager (/businesses) — register & switch businesses ──
    const bizParts = location.pathname.split('/');
    if (bizParts[1] === 'businesses' && currentUser) {
        const bizAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!bizAllowedPages.includes('businesses')) {
            return <Navigate to="/" replace />;
        }
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <MultiStoreApp
                            user={currentUser}
                            storeSettings={storeSettings}
                            onLogout={handleLogout}
                            showSnackbar={showSnackbar}
                            onStoreSwitched={(u) => {
                                // Soft switch: swap the user in state (keeping the token) so the
                                // currentStoreId effect refetches all store data — no reload/logout.
                                const token = getCurrentUser()?.token;
                                const merged = token ? ({ ...u, token } as User) : u;
                                try { localStorage.setItem('salePilotUser', JSON.stringify(merged)); } catch { }
                                setCurrentUser(merged);
                            }}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Online Store app (/store) — storefront link, QR & catalog sharing ──
    const storeParts = location.pathname.split('/');
    if (storeParts[1] === 'store' && currentUser) {
        const storeAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!storeAllowedPages.includes('online-store')) {
            return <Navigate to="/" replace />;
        }
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <OnlineStoreApp
                            user={currentUser}
                            storeSettings={storeSettings}
                            onLogout={handleLogout}
                            showSnackbar={showSnackbar}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Supplier & Procurement Hub (/procure, /procure/suppliers, /procure/orders) ──
    const procParts = location.pathname.split('/');
    if (procParts[1] === 'procure' && currentUser) {
        const procAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!procAllowedPages.includes('suppliers')) {
            return <Navigate to="/" replace />;
        }
        const procSection = (procParts[2] === 'suppliers' ? 'suppliers' : procParts[2] === 'orders' ? 'orders' : 'dashboard') as 'dashboard' | 'suppliers' | 'orders';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <ProcureApp
                            section={procSection}
                            user={currentUser}
                            suppliers={suppliers}
                            products={products}
                            purchaseOrders={purchaseOrders}
                            supplierInvoices={supplierInvoices}
                            storeSettings={storeSettings}
                            onSaveSupplier={handleSaveSupplier}
                            onDeleteSupplier={handleDeleteSupplier}
                            onSavePurchaseOrder={handleSavePurchaseOrder}
                            onDeletePurchaseOrder={handleDeletePurchaseOrder}
                            onReceivePOItems={handleReceivePOItems}
                            showSnackbar={showSnackbar}
                            onNavigate={(s) => navigate(s === 'dashboard' ? '/procure' : `/procure/${s}`)}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone User Manager app (/team, /team/roles) ──
    // Admin-only. Adding an extra user beyond the free seat is a premium add-on.
    const teamParts = location.pathname.split('/');
    if (teamParts[1] === 'team' && currentUser) {
        const teamAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!teamAllowedPages.includes('users')) {
            return <Navigate to="/" replace />;
        }
        const teamSection = (teamParts[2] === 'roles' ? 'roles' : 'members') as 'members' | 'roles';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <TeamApp
                            section={teamSection}
                            user={currentUser}
                            users={users}
                            storeSettings={storeSettings}
                            onNavigate={(s) => navigate(s === 'members' ? '/team' : `/team/${s}`)}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onSaveUser={async (data, id) => { await saveUser(data, id); setUsers(await getUsers()); }}
                            onDeleteUser={async (id) => { await deleteUser(id); setUsers(await getUsers()); }}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Inventory Manager app (/inv, /inv/items, /inv/alerts) ──
    // Opens from the app switcher as its own app; the dashboard derives from live data
    // and the "Inventory" tab reuses the existing InventoryPage management UI.
    const invParts = location.pathname.split('/');
    if (invParts[1] === 'inv' && currentUser) {
        const invAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!invAllowedPages.includes('inventory')) {
            return <Navigate to="/" replace />;
        }
        const invSection = (invParts[2] === 'items' ? 'items'
            : invParts[2] === 'alerts' ? 'alerts'
                : invParts[2] === 'stock-takes' ? 'stock-takes'
                    : 'dashboard') as 'dashboard' | 'items' | 'alerts' | 'stock-takes';
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <InventoryApp
                            section={invSection}
                            user={currentUser}
                            products={products}
                            categories={categories}
                            sales={sales}
                            purchaseOrders={purchaseOrders}
                            storeSettings={storeSettings}
                            renderItems={() => (
                                <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                    <InventoryPage products={products} categories={categories} suppliers={suppliers} accounts={accounts} purchaseOrders={purchaseOrders} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onArchiveProduct={handleArchiveProduct} onStockChange={handleStockChange} onAdjustStock={handleStockAdjustment} onReceivePOItems={handleReceivePOItems} onSavePurchaseOrder={handleSavePurchaseOrder} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} onOpenSidebar={() => { }} embedded />
                                </Suspense>
                            )}
                            renderStockTakes={() => (
                                <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                    <StockTakePage session={stockTakeSession} products={products} onStart={handleStartStockTake} onUpdateItem={handleUpdateStockTakeItem} onCancel={handleCancelStockTake} onFinalize={handleFinalizeStockTake} />
                                </Suspense>
                            )}
                            onNavigate={(s) => navigate(s === 'dashboard' ? '/inv' : `/inv/${s}`)}
                            onPos={() => navigate('/pos')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onGeneratePO={() => navigate('/procure/orders')}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone POS app (/pos, /pos/history, /pos/inventory, /pos/dashboard) ──
    // Focused frame with its own menu; reuses the existing page logic/props.
    // /pos/history deep-links the built-in "Sales History & Refunds" view.
    const posParts = location.pathname.split('/');
    if (posParts[1] === 'pos' && currentUser) {
        const posSection = posParts[2] === 'inventory' ? 'inventory'
            : posParts[2] === 'dashboard' ? 'dashboard'
                : 'pos';

        // Inventory is the standalone Inventory app — render it at /inv/items so it
        // has the same chrome/header everywhere (the embedded InventoryShell header,
        // not a POS-shell-only mobile header). Keeps inventory a single, consistent
        // experience and lands on the items list rather than the dashboard.
        if (posSection === 'inventory') {
            return <Navigate to="/inv/items" replace />;
        }

        const openPosDrawer = () => setPosDrawerOpen(true);
        let posContent: ReactNode;
        if (posSection === 'dashboard') {
            posContent = <PosDashboard storeSettings={storeSettings!} onOpenSidebar={openPosDrawer} />;
        } else {
            posContent = <SalesPage user={currentUser} products={products} customers={customers} categories={categories} onProcessSale={handleProcessSale} onProcessReturn={handleProcessReturn} isLoading={isLoading} showSnackbar={showSnackbar} storeSettings={storeSettings!} onOpenSidebar={openPosDrawer} onLogout={handleLogout} initialView={posParts[2] === 'history' ? 'history' : 'sell'} />;
        }

        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <PosShell
                            active={posSection}
                            user={currentUser}
                            drawerOpen={posDrawerOpen}
                            onCloseDrawer={() => setPosDrawerOpen(false)}
                            onNavigate={(s) => navigate(s === 'pos' ? '/pos' : s === 'inventory' ? '/inv/items' : `/pos/${s}`)}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        >
                            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                                {posContent}
                            </Suspense>
                        </PosShell>
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone Super Admin app (/superadmin, /superadmin/stores, …) ──
    // The platform control center opens from the app switcher as its own focused app
    // with its own navigation. Strictly superadmin-only.
    const superParts = location.pathname.split('/');
    if (superParts[1] === 'superadmin' && currentUser) {
        if (currentUser.role !== 'superadmin') return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                        <SuperAdminApp
                            user={currentUser}
                            subPath={superParts[2]}
                            storeId={superParts[2] === 'stores' ? superParts[3] : undefined}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onStoreMode={() => changeSuperMode('store')}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Standalone page branches — these replaced the legacy sidebar shell.
    // Each page renders in its own focused frame (or wrapped in the shared
    // StandaloneShell chrome) and mounts the shared account overlays.
    // ────────────────────────────────────────────────────────────────────────

    const pathParts = location.pathname.split('/');
    const seg = pathParts[1] || '';
    const allowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];

    // ── Standalone Reports app (/reports) — ships its own full-page chrome ──
    if (seg === 'reports') {
        if (!allowedPages.includes('reports')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        <ReportsPage storeSettings={storeSettings!} user={currentUser} />
                    </Suspense>
                    {accountOverlays}
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Sales History & Refunds live inside the POS app (/pos/history) ──
    if (seg === 'sales' || seg === 'sales-history' || seg === 'returns') {
        return <Navigate to="/pos/history" replace />;
    }

    // ── Standalone Orders app (/orders) — online order management ──
    if (seg === 'orders') {
        if (!allowedPages.includes('orders')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        <StandaloneShell title="Orders" onBack={() => navigate('/')}>
                            <OrdersPage storeSettings={storeSettings!} onOpenSidebar={openAppSwitcher} showSnackbar={showSnackbar} onDataRefresh={fetchData} />
                        </StandaloneShell>
                    </Suspense>
                    {accountOverlays}
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── User guide & support (universal help pages, standalone chrome) ──
    if (seg === 'user-guide' || seg === 'support') {
        if (seg === 'support' && !allowedPages.includes('support')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        <StandaloneShell title={seg === 'support' ? 'Support' : 'User Guide'}>
                            {seg === 'support' ? <SupportPage /> : <UserGuidePage />}
                        </StandaloneShell>
                    </Suspense>
                    {accountOverlays}
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Marketplace / public store directory (/directory, /marketplace) ──
    if (seg === 'directory' || seg === 'marketplace') {
        if (!allowedPages.includes('directory')) return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        {pathParts[2] === 'request' && pathParts[3]
                            ? <MarketplaceRequestActionPage requestId={pathParts[3]} products={products} storeSettings={storeSettings} onBack={() => navigate('/directory')} showSnackbar={showSnackbar} />
                            : <MarketplacePage />}
                    </Suspense>
                    {accountOverlays}
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Customer self-service portal (/customer/dashboard, /customer/orders) ──
    if (seg === 'customer') {
        if (currentUser.role !== 'customer' && currentUser.role !== 'superadmin') return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        <StandaloneShell title={pathParts[2] === 'orders' ? 'My Orders' : 'Marketplace Portal'}>
                            {pathParts[2] === 'orders' ? <CustomerOrdersPage /> : <MarketplaceDashboard />}
                        </StandaloneShell>
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Supplier self-service portal (/supplier/dashboard, /supplier/orders) ──
    if (seg === 'supplier') {
        if (currentUser.role !== 'supplier' && currentUser.role !== 'superadmin') return <Navigate to="/" replace />;
        return (
            <OnboardingProvider user={currentUser}>
                <NotificationProvider user={currentUser}>
                    <Suspense fallback={suspenseFallback}>
                        <StandaloneShell title="Supplier Portal">
                            {pathParts[2] === 'orders' ? <SupplierOrdersPage /> : <SupplierDashboard />}
                        </StandaloneShell>
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Fallback — no page matched: land on the role's default app ──
    const fallbackPage = currentUser.role === 'superadmin'
        ? (superMode === 'store' ? DEFAULT_PAGES['admin'] : 'superadmin')
        : DEFAULT_PAGES[currentUser.role];
    return <Navigate to={`/${fallbackPage}`} replace />;
}


