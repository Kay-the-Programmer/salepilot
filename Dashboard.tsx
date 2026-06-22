import { useState, useEffect, useCallback, type ReactNode } from 'react';
import SocketService from './services/socketService';
import { SnackbarType } from './App';
import { Product, Category, StockTakeSession, Sale, Return, Customer, Supplier, PurchaseOrder, User, StoreSettings, Account, JournalEntry, AuditLog, Payment, SupplierInvoice, SupplierPayment, Expense, RecurringExpense } from './types';
import Logo from './assets/logo.png';
import Sidebar from './components/Sidebar';
import { lazy, Suspense } from 'react';

import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';
import { hasModule, MODULES } from './utils/entitlements';
import { ROLE_PAGES } from './utils/rbac';

const QuickView = lazy(() => import('@/pages/QuickView'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const PosShell = lazy(() => import('@/components/pos/PosShell'));
const PosDashboard = lazy(() => import('@/components/pos/PosDashboard'));
const PosDiscover = lazy(() => import('@/components/pos/PosDiscover'));
const CrmApp = lazy(() => import('@/components/crm/CrmApp'));
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
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const StockTakePage = lazy(() => import('@/pages/StockTakePage'));
const ReturnsPage = lazy(() => import('@/pages/ReturnsPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage'));
const PurchaseOrdersPage = lazy(() => import('@/pages/PurchaseOrdersPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const StoreSetupPage = lazy(() => import('@/pages/StoreSetupPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const AccountingPage = lazy(() => import('@/pages/AccountingPage'));
const AllSalesPage = lazy(() => import('@/pages/AllSalesPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
// The Super Admin platform pages now live inside a single standalone app shell
// (its own navigation + brand chrome), opened from Discover like the other apps.
const SuperAdminApp = lazy(() => import('@/components/superadmin-app/SuperAdminApp'));
const MarketplacePage = lazy(() => import('@/pages/shop/MarketplacePage'));
const MarketplaceDashboard = lazy(() => import('@/pages/shop/CustomerDashboard')); // The Marketplace Portal
const CustomerOrdersPage = lazy(() => import('@/pages/customers/CustomerDashboard')); // The My Orders Page
const CustomerRequestTrackingPage = lazy(() => import('@/pages/shop/CustomerRequestTrackingPage'));
const MarketplaceRequestActionPage = lazy(() => import('@/pages/MarketplaceRequestActionPage'));
const LogisticsPage = lazy(() => import('@/pages/LogisticsPage'));
const UserGuidePage = lazy(() => import('@/pages/UserGuidePage'));
const WhatsAppConversationsPage = lazy(() => import('@/pages/WhatsAppConversationsPage'));
const WhatsAppSettingsPage = lazy(() => import('@/pages/WhatsAppSettingsPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));

import Snackbar from './components/Snackbar';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';
import VerifyEmailOtpModal from './components/VerifyEmailOtpModal';
import { getCurrentUser, logout, getUsers, saveUser, deleteUser, verifySession, changePassword } from './services/authService';
import { api, getOnlineStatus, syncOfflineMutations } from './services/api';
import { dbService } from './services/dbService';
import {
    Bars3Icon,
    BuildingStorefrontIcon,
    ArrowLeftOnRectangleIcon
} from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import NotificationBell from './components/NotificationBell';
import PriorityNotificationModal from './components/PriorityNotificationModal';
import TourGuide from './components/TourGuide';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { logEvent } from './src/utils/analytics';

// Key helper for persisting the last visited page per user
const getLastPageKey = (userId?: string) => userId ? `salePilot.lastPage.${userId}` : 'salePilot.lastPage';
const getSuperModeKey = (userId?: string) => userId ? `salePilot.superMode.${userId}` : 'salePilot.superMode';

// SnackbarType now imported from App.tsx

type SnackbarState = {
    message: string;
    type: SnackbarType;
};

// Role → page access. Sourced from the single canonical RBAC map in
// utils/rbac.ts so the route guard here and the app launcher (PosDiscover)
// can never disagree about who may open what.
const PERMISSIONS: Record<User['role'], string[]> = ROLE_PAGES;

const DEFAULT_PAGES: Record<User['role'], string> = {
    superadmin: 'superadmin',
    admin: 'dash',
    staff: 'sales',
    inventory_manager: 'dash',
    customer: 'customer/dashboard',
    supplier: 'supplier/dashboard'
};

// Standalone app shells launched from Discover. Each opens in its own focused
// frame and is gated by an underlying sidebar entitlement page key — keep this
// in sync with PosDiscover's STANDALONE_APPS so deep-links/refreshes resolve.
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
    const [returns, setReturns] = useState<Return[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
    const [stockTakeSession, setStockTakeSession] = useState<StockTakeSession | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [pendingMatches, _] = useState<any[]>([]); // Prefixed with _ to silence unused warning if desired, or just remove if safe
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any | null>(null); // PWA install prompt event
    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    const [isOnline, setIsOnline] = useState(getOnlineStatus());
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(null);

    // Priority notifications are now handled within NotificationContext or dedicated components

    const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
        setSnackbar({ message, type });
    }, []);

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

    // Close mobile sidebar on Escape
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSidebarOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const navigate = useNavigate();
    const location = useLocation();

    // Determine current "page" from URL
    const currentPage = location.pathname.substring(1) || 'reports';

    // Close mobile sidebar after navigation
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const hasAccess = (page: string, role: User['role']) => {
        const seg = page.split('/')[0];
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

    const handleSync = useCallback(async () => {
        if (isSyncing || !getOnlineStatus()) return;
        setIsSyncing(true);
        showSnackbar('Syncing offline changes...', 'sync');
        const { succeeded, failed } = await syncOfflineMutations();
        setIsSyncing(false);

        if (succeeded > 0 || failed > 0) {
            if (failed > 0) {
                showSnackbar(`Sync complete. ${succeeded} succeeded, ${failed} failed.`, 'error');
            } else {
                showSnackbar(`Successfully synced ${succeeded} offline changes.`, 'success');
            }
            fetchData(); // Refetch all data to get the latest state from the server
        }
    }, [isSyncing, showSnackbar, fetchData]);

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
        const desired = user.role === 'superadmin' ? 'superadmin' : DEFAULT_PAGES[user.role];
        // Persist last page for this user for consistency across reloads
        try {
            const key = getLastPageKey(user.id);
            localStorage.setItem(key, desired);
        } catch (_) { /* ignore storage errors */ }
        navigate(`/${desired}`);
        showSnackbar(`Welcome back, ${user.name}!`, 'success');
    };

    const handleLogout = () => {
        setIsSidebarOpen(false);
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = () => {
        logout();
        setCurrentUser(null);
        setIsLogoutModalOpen(false);
        logEvent('Auth', 'Logout');
        showSnackbar('You have been logged out.', 'info');
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

            // Special case: some callers (e.g., ProductFormModal) already perform the API call
            // and pass back the saved Product. If this product is not yet in our state,
            // insert it immediately and skip making another request.
            if (isUpdating) {
                const incoming = productData as Product;
                const exists = products.some(p => p.id === incoming.id);
                if (!exists) {
                    setProducts(prev => [incoming, ...prev]);
                    showSnackbar('Product added successfully!', 'success');
                    return incoming;
                }
            }

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
            // Ensure sale has a transactionId before sending to API
            const saleWithId: Sale = {
                ...sale,
                transactionId: sale.transactionId || `temp_${Date.now()}`,
                timestamp: sale.timestamp || new Date().toISOString()
            };

            const result = await api.post<Sale>('/sales', saleWithId);
            if ((result as any).offline) {
                showSnackbar('Offline: Sale queued for sync.', 'info');

                const tempSale: Sale = {
                    ...saleWithId,
                    transactionId: `offline_${Date.now()}`,
                    timestamp: new Date().toISOString()
                };

                setSales(prev => [tempSale, ...prev]);

                tempSale.cart.forEach(item => {
                    setProducts(prevProducts => prevProducts.map(p =>
                        p.id === item.productId ? { ...p, stock: p.stock - item.quantity } : p
                    ));
                });

                if (tempSale.customerId) {
                    setCustomers(prevCustomers => prevCustomers.map(c => {
                        if (c.id === tempSale.customerId) {
                            return {
                                ...c,
                                storeCredit: c.storeCredit - (tempSale.storeCreditUsed || 0),
                                accountBalance: c.accountBalance + (tempSale.paymentStatus !== 'paid' ? tempSale.total : 0)
                            };
                        }
                        return c;
                    }));
                }

                return tempSale;
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
            // Find the PO locally first to calculate new state
            const existingPO = purchaseOrders.find(p => p.id === poId);
            if (!existingPO) throw new Error('Purchase Order not found');

            // Create updated PO object
            const updatedItems = existingPO.items.map(item => {
                const receivedItem = receivedItems.find(r => r.productId === item.productId);
                if (receivedItem) {
                    const newReceived = (item.receivedQuantity || 0) + receivedItem.quantity;
                    return { ...item, receivedQuantity: newReceived };
                }
                return item;
            });

            // Calculate new status
            const allReceived = updatedItems.every(item => (item.receivedQuantity || 0) >= item.quantity);
            const someReceived = updatedItems.some(item => (item.receivedQuantity || 0) > 0);
            const newStatus: PurchaseOrder['status'] = allReceived ? 'received' : (someReceived ? 'partially_received' : 'ordered');

            const updatedPO: PurchaseOrder = {
                ...existingPO,
                items: updatedItems,
                status: newStatus
            };

            // Update PO
            const result = await api.put<PurchaseOrder>(`/purchase-orders/${poId}`, updatedPO);

            // Also update product stock for each received item
            // Note: This logic assumes the backend /receive endpoint was doing both. 
            // Since we are now manually updating the PO, we must also manually update the stock.
            // However, InventoryPage already handles stock updates via onReceivePOItems? 
            // NO. InventoryPage calls onReceivePOItems inside handleLinkToPO and DOES NOT call onAdjustStock there.
            // So we MUST update stock here.

            for (const item of receivedItems) {
                // We use PATCH for stock updates
                await api.patch(`/products/${item.productId}/stock`, {
                    newQuantity: item.quantity,
                    reason: 'Receiving Stock'
                });
            }

            if ((result as any).offline) {
                showSnackbar('Offline: Stock reception queued.', 'info');
            } else {
                showSnackbar('Purchase Order updated.', 'success');
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
                navigate('/stock-takes');
                showSnackbar('Offline: Stock take started. Changes will sync when back online.', 'info');
            } else {
                setStockTakeSession(result as StockTakeSession);
                navigate('/stock-takes');
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

    const handleSaveUser = async (userData: Omit<User, 'id'>, id?: string) => {
        try {
            await saveUser(userData, id);
            setUsers(await getUsers());
            showSnackbar(`User ${id ? 'updated' : 'created'} successfully!`, 'success');
        } catch (err: any) {
            showSnackbar(err.message, 'error');
        }
    };



    const handleDeleteUser = async (userId: string) => {
        if (userId === currentUser?.id) {
            showSnackbar("You cannot delete your own account.", "error");
            return;
        }
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser(userId);
                setUsers(await getUsers());
                showSnackbar("User deleted successfully.", "success");
            } catch (err: any) {
                showSnackbar(err.message, "error");
            }
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

    if (isAuthLoading) {
        return <LoadingSpinner />;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} showSnackbar={showSnackbar} />;
    }

    // If user has no current store yet, guide them to create one (except superadmin and customers, who are store-agnostic)
    if (currentUser && !currentUser.currentStoreId && currentUser.role !== 'superadmin' && currentUser.role !== 'customer') {
        const token = getCurrentUser()?.token;
        const handleCompleted = (user: User) => {
            const merged = token ? ({ ...user, token } as User) : user;
            try { localStorage.setItem('salePilotUser', JSON.stringify(merged)); } catch { }
            setCurrentUser(merged);
            navigate(`/${DEFAULT_PAGES[merged.role]}`);
        };
        return <StoreSetupPage onCompleted={handleCompleted} showSnackbar={showSnackbar} />;
    }

    // Store settings gating applies for any store-scoped context
    const isStoreScoped = (currentUser.role !== 'superadmin' && currentUser.role !== 'customer') || (currentUser.role === 'superadmin' && superMode === 'store');
    if (isStoreScoped) {
        if (!storeSettings && isLoading) {
            return <LoadingSpinner text="Loading store settings..." />;
        }

        if (!storeSettings && !isLoading) {
            if (currentUser.role === 'superadmin' && !currentUser.currentStoreId) {
                return (
                    <div className="flex flex-col h-screen items-center justify-center p-8 text-center text-gray-500 space-y-4">
                        <BuildingStorefrontIcon className="w-16 h-16 text-gray-300" />
                        <p className="text-xl font-medium text-gray-700">No Store Selected</p>
                        <p className="max-w-md">Please select a store from the sidebar menu to view its dashboard and data.</p>
                    </div>
                );
            }
            return <div className="flex h-screen items-center justify-center p-8 text-center text-red-500">Could not load store settings. The application cannot start. Please check your connection or local data.</div>;
        }
    }




    const renderPage = (pagePath: string) => {
        const parts = pagePath.split('/');
        const page = parts[0];

        if (!hasAccess(page, currentUser.role) && !hasAccess(pagePath, currentUser.role)) {
            return <div className="p-8 text-center text-red-500">Access Denied. You do not have permission to view this page.</div>;
        }

        const renderContent = () => {
            if (pagePath === 'customer/dashboard') {
                return <MarketplaceDashboard />;
            }

            if (pagePath === 'supplier/orders') {
                return <SupplierOrdersPage />;
            }
            if (pagePath === 'supplier/dashboard') {
                return <SupplierDashboard />;
            }

            if (pagePath === 'customer/orders') {
                return <CustomerOrdersPage />;
            }

            switch (page) {
                case 'quick-view':
                    return <QuickView user={currentUser} />;
                case 'setup-store':
                    return (
                        <StoreSetupPage
                            onCompleted={(user) => {
                                const token = currentUser.token;
                                const merged = token ? { ...user, token } : user;
                                setCurrentUser(merged as User);
                                navigate(`/${DEFAULT_PAGES[merged.role]}`);
                            }}
                            showSnackbar={showSnackbar}
                        />
                    );
                case 'sales':
                    return <SalesPage
                        user={currentUser}
                        products={products}
                        customers={customers}
                        categories={categories}
                        suppliers={suppliers}
                        onProcessSale={handleProcessSale}
                        onSaveProduct={handleSaveProduct}
                        onProcessReturn={handleProcessReturn}
                        isLoading={isLoading}
                        showSnackbar={showSnackbar}
                        storeSettings={storeSettings!}
                        onOpenSidebar={() => navigate('/pos/discover')}
                    />;
                case 'sales-history':
                    return <AllSalesPage customers={customers} storeSettings={storeSettings!} />;
                case 'orders':
                    return <OrdersPage storeSettings={storeSettings!} onOpenSidebar={() => navigate('/pos/discover')} showSnackbar={showSnackbar} onDataRefresh={fetchData} />;
                case 'returns':
                    return <ReturnsPage sales={sales} returns={returns} onProcessReturn={handleProcessReturn} showSnackbar={showSnackbar} storeSettings={storeSettings!} />;
                case 'customers':
                    return <CustomersPage customers={customers} sales={sales} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} />;
                case 'suppliers':
                    return <SuppliersPage suppliers={suppliers} products={products} onSaveSupplier={handleSaveSupplier} onDeleteSupplier={handleDeleteSupplier} isLoading={isLoading} error={error} storeSettings={storeSettings!} />;
                case 'purchase-orders':
                    return <PurchaseOrdersPage purchaseOrders={purchaseOrders} suppliers={suppliers} products={products} onSave={handleSavePurchaseOrder} onDelete={handleDeletePurchaseOrder} onReceiveItems={handleReceivePOItems} showSnackbar={showSnackbar} isLoading={isLoading} error={error} storeSettings={storeSettings!} />;
                case 'categories':
                    return <CategoriesPage categories={categories} accounts={accounts} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} />;
                case 'stock-takes':
                    return <StockTakePage session={stockTakeSession} onStart={handleStartStockTake} onUpdateItem={handleUpdateStockTakeItem} onCancel={handleCancelStockTake} onFinalize={handleFinalizeStockTake} />;
                case 'reports':
                    return <ReportsPage storeSettings={storeSettings!} user={currentUser} />;
                case 'logistics':
                    return <LogisticsPage />;
                case 'accounting':
                    return <AccountingPage
                        accounts={accounts}
                        journalEntries={journalEntries}
                        sales={sales}
                        customers={customers}
                        suppliers={suppliers}
                        supplierInvoices={supplierInvoices}
                        purchaseOrders={purchaseOrders}
                        expenses={expenses}
                        recurringExpenses={recurringExpenses}
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
                        isLoading={isLoading}
                        error={error}
                        storeSettings={storeSettings!}
                    />;
                case 'audit-trail':
                    return <AuditLogPage logs={auditLogs} users={users} />;
                case 'profile':
                    return <ProfilePage user={currentUser} storeSettings={storeSettings!} onLogout={handleLogout} onInstall={handleInstall} installPrompt={installPrompt} onUpdateProfile={handleUpdateProfile} onChangePassword={handleChangePassword} />;
                case 'settings':
                    return <SettingsPage settings={storeSettings!} user={currentUser!} showSnackbar={showSnackbar} onSave={handleSaveSettings} />;
                case 'users':
                    return <UsersPage users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} showSnackbar={showSnackbar} isLoading={isLoading} error={error} />;
                case 'notifications':
                    return <NotificationsPage userId={currentUser?.id} showSnackbar={showSnackbar} />;
                case 'directory':
                case 'marketplace':
                    if (parts[1] === 'request' && parts[2]) {
                        return <MarketplaceRequestActionPage requestId={parts[2]} products={products} storeSettings={storeSettings} onBack={() => navigate('/directory')} showSnackbar={showSnackbar} />;
                    }
                    return <MarketplacePage />;

                case 'track':
                    return <CustomerRequestTrackingPage />;
                // NOTE: /superadmin/* is intercepted earlier and rendered as the
                // standalone SuperAdminApp shell, so it never reaches this switch.

                case 'inventory':
                    return <InventoryPage products={products} categories={categories} suppliers={suppliers} accounts={accounts} purchaseOrders={purchaseOrders} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onArchiveProduct={handleArchiveProduct} onStockChange={handleStockChange} onAdjustStock={handleStockAdjustment} onReceivePOItems={handleReceivePOItems} onSavePurchaseOrder={handleSavePurchaseOrder} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} />;
                case 'user-guide':
                    return <UserGuidePage />;
                case 'whatsapp':
                    if (parts[1] === 'settings') {
                        return <WhatsAppSettingsPage storeSettings={storeSettings!} showSnackbar={showSnackbar} />;
                    }
                    return <WhatsAppConversationsPage showSnackbar={showSnackbar} currentUser={currentUser} superMode={superMode} />;
                case 'support':
                    return <SupportPage />;
                case 'privacy':
                    return <PrivacyPolicyPage />;
                default:
                    return <div className="p-8 text-center text-red-500">Page not found: {page}</div>;
            }
        };

        return (
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
                {renderContent()}
            </Suspense>
        );
    };

    // ── Standalone Business Assistant app (/assistant, /assistant/chat) ──
    // Opens from the Discover launcher as its own focused app (AI Suite). Runs on
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
                            onDiscover={() => navigate('/pos/discover')}
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
                            expenses={expenses}
                            supplierInvoices={supplierInvoices}
                            storeSettings={storeSettings!}
                            onSaveExpense={handleSaveExpense as any}
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
    // A modern reskin of the /reports overview that opens from Discover as its
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
                            onDiscover={() => navigate('/pos/discover')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onNewSale={() => navigate('/sales')}
                            onInventory={() => navigate('/inventory')}
                            onOrders={() => navigate('/orders')}
                            onCustomers={() => navigate('/customers')}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone CRM app (/crm, /crm/customers, /crm/loyalty, /crm/insights) ──
    // Opens from the Discover launcher as its own focused app; runs entirely on
    // the existing backend data (customers + sales) already loaded above.
    const crmParts = location.pathname.split('/');
    if (crmParts[1] === 'crm' && currentUser) {
        const crmAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!crmAllowedPages.includes('customers')) {
            return <Navigate to="/" replace />;
        }
        const crmSection = crmParts[2] === 'customers' ? 'customers'
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
                            onDiscover={() => navigate('/pos/discover')}
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
                            onDiscover={() => navigate('/pos/discover')}
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
                            onDiscover={() => navigate('/pos/discover')}
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
    // Opens from Discover as its own app; the dashboard derives from live data
    // and the "Inventory" tab reuses the existing InventoryPage management UI.
    const invParts = location.pathname.split('/');
    if (invParts[1] === 'inv' && currentUser) {
        const invAllowedPages = currentUser.role === 'superadmin' ? PERMISSIONS['admin'] : PERMISSIONS[currentUser.role];
        if (!invAllowedPages.includes('inventory')) {
            return <Navigate to="/" replace />;
        }
        const invSection = (invParts[2] === 'items' ? 'items' : invParts[2] === 'alerts' ? 'alerts' : 'dashboard') as 'dashboard' | 'items' | 'alerts';
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
                                    <InventoryPage products={products} categories={categories} suppliers={suppliers} accounts={accounts} purchaseOrders={purchaseOrders} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onArchiveProduct={handleArchiveProduct} onStockChange={handleStockChange} onAdjustStock={handleStockAdjustment} onReceivePOItems={handleReceivePOItems} onSavePurchaseOrder={handleSavePurchaseOrder} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} onOpenSidebar={() => { }} />
                                </Suspense>
                            )}
                            onNavigate={(s) => navigate(s === 'dashboard' ? '/inv' : `/inv/${s}`)}
                            onPos={() => navigate('/pos')}
                            onDiscover={() => navigate('/pos/discover')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                            onGeneratePO={() => navigate('/purchase-orders')}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // ── Standalone POS app (/pos, /pos/inventory, /pos/dashboard) ──
    // Focused frame with its own menu; reuses the existing page logic/props.
    const posParts = location.pathname.split('/');
    if (posParts[1] === 'pos' && currentUser) {
        const posSection = posParts[2] === 'inventory' ? 'inventory'
            : posParts[2] === 'dashboard' ? 'dashboard'
                : posParts[2] === 'discover' ? 'discover'
                    : 'pos';

        const openPosDrawer = () => setPosDrawerOpen(true);
        // Superadmins see every admin app PLUS the Super Admin platform app.
        const posAllowedPages = currentUser.role === 'superadmin' ? [...PERMISSIONS['admin'], 'superadmin'] : PERMISSIONS[currentUser.role];
        let posContent: ReactNode;
        if (posSection === 'inventory') {
            posContent = <InventoryPage products={products} categories={categories} suppliers={suppliers} accounts={accounts} purchaseOrders={purchaseOrders} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onArchiveProduct={handleArchiveProduct} onStockChange={handleStockChange} onAdjustStock={handleStockAdjustment} onReceivePOItems={handleReceivePOItems} onSavePurchaseOrder={handleSavePurchaseOrder} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} onOpenSidebar={openPosDrawer} />;
        } else if (posSection === 'dashboard') {
            posContent = <PosDashboard storeSettings={storeSettings!} onOpenSidebar={openPosDrawer} />;
        } else if (posSection === 'discover') {
            posContent = <PosDiscover user={currentUser} allowedPages={posAllowedPages} storeSettings={storeSettings} onLaunch={(page) => navigate(`/${page}`)} onOpenSidebar={openPosDrawer} />;
        } else {
            posContent = <SalesPage user={currentUser} products={products} customers={customers} categories={categories} suppliers={suppliers} onProcessSale={handleProcessSale} onSaveProduct={handleSaveProduct} onProcessReturn={handleProcessReturn} isLoading={isLoading} showSnackbar={showSnackbar} storeSettings={storeSettings!} onOpenSidebar={openPosDrawer} />;
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
                            onNavigate={(s) => navigate(s === 'pos' ? '/pos' : `/pos/${s}`)}
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
    // The platform control center opens from Discover as its own focused app
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
                            onDiscover={() => navigate('/pos/discover')}
                            onExit={() => navigate('/')}
                            onLogout={handleLogout}
                        />
                    </Suspense>
                </NotificationProvider>
            </OnboardingProvider>
        );
    }

    // Superadmin mode switch + active-store selection — formerly housed in the
    // Sidebar, now surfaced in the universal top bar below.
    const changeSuperMode = (mode: 'superadmin' | 'store') => {
        setSuperMode(mode);
        try { localStorage.setItem(getSuperModeKey(currentUser.id), mode); } catch { }
        const effectiveRole: User['role'] = (currentUser.role === 'superadmin' && mode === 'store') ? 'admin' : currentUser.role;
        const allowed = (currentUser.role === 'superadmin' && mode === 'superadmin')
            ? ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'superadmin/settings', 'whatsapp/conversations', 'whatsapp/settings', 'profile']
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

    return (
        <OnboardingProvider user={currentUser}>
            <NotificationProvider user={currentUser}>
                <div className="flex h-screen bg-gray-100 dark:bg-slate-950 font-sans transition-colors duration-200">
                    {/* Mobile overlay/backdrop */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/40 z-[55] md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                            aria-hidden="true"
                        />
                    )}

                    {/* Sidebar container: modal on mobile, static on desktop */}
                    <div id="app-sidebar" className={`
                z-[110] md:static md:block
                ${isSidebarOpen
                            ? 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none'
                            : 'hidden md:block'
                        }
            `}>
                        <Sidebar
                            user={currentUser}
                            onLogout={handleLogout}
                            isOnline={isOnline}
                            allowedPages={currentUser.role === 'superadmin' ? (superMode === 'superadmin' ? ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'superadmin/settings', 'whatsapp/conversations', 'whatsapp/settings', 'profile'] : PERMISSIONS['admin']) : PERMISSIONS[currentUser.role]}
                            superMode={currentUser.role === 'superadmin' ? superMode : undefined}
                            onChangeSuperMode={(mode) => {
                                setSuperMode(mode);
                                try { localStorage.setItem(getSuperModeKey(currentUser.id), mode); } catch { }
                                // Redirect to appropriate default page if current is no longer permitted
                                const effectiveRole: User['role'] = (currentUser.role === 'superadmin' && mode === 'store') ? 'admin' : currentUser.role;
                                const allowed = (currentUser.role === 'superadmin' && mode === 'superadmin') ? ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'superadmin/settings', 'whatsapp/conversations', 'whatsapp/settings', 'profile'] : PERMISSIONS[effectiveRole];
                                const page = location.pathname.split('/')[1] || DEFAULT_PAGES[effectiveRole];
                                if (!allowed.includes(page)) {
                                    const next = (currentUser.role === 'superadmin' && mode === 'superadmin') ? 'superadmin' : DEFAULT_PAGES[effectiveRole];
                                    navigate(`/${next}`);
                                    try { localStorage.setItem(getLastPageKey(currentUser.id), next); } catch { }
                                }
                            }}
                            storesForSelect={currentUser.role === 'superadmin' ? systemStores : undefined}
                            selectedStoreId={currentUser.currentStoreId}
                            onSelectStore={async (storeId) => {
                                if (!storeId) return;
                                try {
                                    await api.patch('/users/me/current-store', { storeId });
                                    const stored = getCurrentUser();
                                    if (stored) {
                                        const merged = { ...stored, currentStoreId: storeId } as User as any;
                                        localStorage.setItem('salePilotUser', JSON.stringify(merged));
                                        setCurrentUser(merged);
                                        showSnackbar('Store context updated.', 'success');
                                    }
                                } catch (err: any) {
                                    showSnackbar(err.message || 'Failed to set current store', 'error');
                                }
                            }}
                            showOnMobile={isSidebarOpen}
                            onMobileClose={() => setIsSidebarOpen(false)}
                            lastSync={lastSync}
                            isSyncing={isSyncing}
                            installPrompt={installPrompt}
                            onInstall={handleInstall}
                            pendingMatchesCount={(pendingMatches || []).length}
                        />
                    </div>

                    {/* Main content */}
                    <div id="main-content" className="flex-1 flex flex-col overflow-y-auto bg-background">
                        {/* Universal top bar — the "Apps" button opens the Discover page,
                            which is now the navigation surface that replaced the sidebar.
                            Carries the global actions the sidebar used to own. Pages that
                            ship their own full chrome (POS Sale, Reports) opt out. */}
                        {location.pathname !== '/sales' && location.pathname !== '/reports' && (
                            <header className="sticky top-0 z-40 h-14 bg-surface border-b border-brand-border flex items-center gap-2 px-3 md:px-4 transition-all duration-200">
                                <button
                                    onClick={() => navigate('/pos/discover')}
                                    id="apps-launcher"
                                    className="flex items-center gap-2 p-2 rounded-lg text-brand-text hover:bg-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-colors active:scale-95"
                                    aria-label="Open apps"
                                    title="All apps"
                                >
                                    <Bars3Icon className="w-6 h-6" />
                                    <span className="hidden sm:block text-sm font-semibold">Apps</span>
                                </button>

                                <button onClick={() => navigate('/dash')} className="flex items-center" aria-label="Home dashboard">
                                    <img src={Logo} alt="SalePilot" className="h-8 w-auto object-contain" />
                                </button>

                                <div className="flex-1" />

                                {currentUser.role === 'superadmin' && (
                                    <div className="hidden md:flex items-center gap-2 mr-1">
                                        <div className="flex items-center bg-surface-variant rounded-lg p-0.5">
                                            <button onClick={() => changeSuperMode('superadmin')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${superMode === 'superadmin' ? 'bg-primary text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}>Platform</button>
                                            <button onClick={() => changeSuperMode('store')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${superMode === 'store' ? 'bg-primary text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}>Store</button>
                                        </div>
                                        {superMode === 'store' && systemStores && systemStores.length > 0 && (
                                            <select value={currentUser.currentStoreId || ''} onChange={(e) => selectStore(e.target.value)} className="px-2 py-1.5 text-xs border border-brand-border rounded-lg bg-surface text-brand-text focus:ring-2 focus:ring-primary">
                                                <option value="">Select store</option>
                                                {systemStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <NotificationBell onNavigate={() => navigate('/notifications')} />

                                <button onClick={() => navigate('/profile')} aria-label="Your profile" title={currentUser?.name} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-bold flex items-center justify-center shadow-sm active:scale-95 transition-transform flex-shrink-0">
                                    {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                                </button>

                                <button onClick={handleLogout} aria-label="Logout" title="Logout" className="p-2 rounded-lg text-brand-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0">
                                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                </button>
                            </header>
                        )}

                        {renderPage(currentPage)}

                        {/* Email Verification Banner */}
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
                                                        // Update state to remove banner if backend confirmed they are verified
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
                    </div>

                    {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar(null)} />}
                    <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleConfirmLogout} />
                    <VerifyEmailOtpModal
                        isOpen={showOtpModal}
                        email={currentUser?.email || ''}
                        onClose={() => setShowOtpModal(false)}
                        onVerified={() => {
                            // Update user state and localStorage so the banner disappears
                            const updatedUser = { ...currentUser!, isVerified: true };
                            setCurrentUser(updatedUser);
                            try { localStorage.setItem('salePilotUser', JSON.stringify(updatedUser)); } catch { }
                            setShowOtpModal(false);
                            showSnackbar('Email verified successfully!', 'success');
                        }}
                    />
                    <TourGuide user={currentUser} />


                    <PriorityNotificationModal />
                </div>
            </NotificationProvider>
        </OnboardingProvider>
    );
}


