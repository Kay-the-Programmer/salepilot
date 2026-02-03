import { useState, useEffect, useCallback } from 'react';
import SocketService from './services/socketService';
import { SnackbarType } from './App';
import { Product, Category, StockTakeSession, Sale, Return, Customer, Supplier, PurchaseOrder, User, StoreSettings, Account, JournalEntry, AuditLog, Payment, SupplierInvoice, SupplierPayment, Announcement, Expense, RecurringExpense } from './types';
import Logo from './assets/logo.png';
import Sidebar from './components/Sidebar';
import { lazy, Suspense } from 'react';

import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';

const QuickView = lazy(() => import('@/pages/QuickView'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
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
const SuperAdminDashboard = lazy(() => import('@/pages/superadmin/SuperAdminDashboard'));
const SuperAdminStores = lazy(() => import('@/pages/superadmin/SuperAdminStores'));
const SuperAdminNotifications = lazy(() => import('@/pages/superadmin/SuperAdminNotifications'));
const SuperAdminSubscriptions = lazy(() => import('@/pages/superadmin/SuperAdminSubscriptions'));
const SuperAdminStoreDetails = lazy(() => import('@/pages/superadmin/SuperAdminStoreDetails'));
const SuperAdminSettings = lazy(() => import('@/pages/superadmin/SuperAdminSettings'));
const MarketplacePage = lazy(() => import('@/pages/shop/MarketplacePage'));
const MarketplaceDashboard = lazy(() => import('@/pages/shop/CustomerDashboard')); // The Marketplace Portal
const CustomerOrdersPage = lazy(() => import('@/pages/customers/CustomerDashboard')); // The My Orders Page
const CustomerRequestTrackingPage = lazy(() => import('@/pages/shop/CustomerRequestTrackingPage'));
const MarketingPage = lazy(() => import('@/pages/MarketingPage'));
const MarketplaceRequestActionPage = lazy(() => import('@/pages/MarketplaceRequestActionPage'));
const LogisticsPage = lazy(() => import('@/pages/LogisticsPage'));
const UserGuidePage = lazy(() => import('@/pages/UserGuidePage'));
const WhatsAppConversationsPage = lazy(() => import('@/pages/WhatsAppConversationsPage'));
const WhatsAppSettingsPage = lazy(() => import('@/pages/WhatsAppSettingsPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));

import Snackbar from './components/Snackbar';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';
import { getCurrentUser, logout, getUsers, saveUser, deleteUser, verifySession, changePassword } from './services/authService';
import { api, getOnlineStatus, syncOfflineMutations } from './services/api';
import { dbService } from './services/dbService';
import {
    Bars3Icon,
    BellAlertIcon,
    BuildingStorefrontIcon
} from './components/icons';
import LoadingSpinner from './components/LoadingSpinner';
import { useNavigate, useLocation } from 'react-router-dom';
import SystemNotificationModal from './components/SystemNotificationModal';
import TourGuide from './components/TourGuide';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Key helper for persisting the last visited page per user
const getLastPageKey = (userId?: string) => userId ? `salePilot.lastPage.${userId}` : 'salePilot.lastPage';
const getSuperModeKey = (userId?: string) => userId ? `salePilot.superMode.${userId}` : 'salePilot.superMode';

// SnackbarType now imported from App.tsx

type SnackbarState = {
    message: string;
    type: SnackbarType;
};

const PERMISSIONS: Record<User['role'], string[]> = {
    superadmin: ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'reports', 'sales', 'sales-history', 'orders', 'inventory', 'categories', 'stock-takes', 'returns', 'customers', 'suppliers', 'purchase-orders', 'accounting', 'audit-trail', 'users', 'settings', 'profile', 'notifications', 'marketing', 'subscription', 'logistics', 'user-guide', 'quick-view', 'whatsapp/conversations', 'whatsapp/settings'],
    admin: ['reports', 'sales', 'sales-history', 'orders', 'inventory', 'categories', 'stock-takes', 'returns', 'customers', 'suppliers', 'purchase-orders', 'accounting', 'audit-trail', 'users', 'settings', 'profile', 'notifications', 'marketing', 'subscription', 'logistics', 'user-guide', 'quick-view', 'support'],
    staff: ['sales', 'sales-history', 'orders', 'inventory', 'returns', 'customers', 'profile', 'notifications', 'marketing', 'user-guide', 'quick-view'],
    inventory_manager: ['reports', 'inventory', 'categories', 'stock-takes', 'suppliers', 'purchase-orders', 'profile', 'notifications', 'marketing', 'user-guide', 'quick-view'],
    customer: ['profile', 'notifications', 'user-guide', 'quick-view'],
    supplier: ['profile', 'notifications', 'user-guide', 'quick-view']
};

const DEFAULT_PAGES: Record<User['role'], string> = {
    superadmin: 'superadmin',
    admin: 'reports',
    staff: 'sales',
    inventory_manager: 'inventory',
    customer: 'customer/dashboard',
    supplier: 'supplier/dashboard'
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
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pendingMatches, setPendingMatches] = useState<any[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any | null>(null); // PWA install prompt event
    // Mobile sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    // System Priority Notification State
    const [priorityNotification, setPriorityNotification] = useState<Announcement | null>(null);

    useEffect(() => {
        // Check for unread system priority notifications
        // We pick the first one we find. If there are multiple, they will appear one after another as they are acknowledged.
        const priority = (announcements || []).find(a => !a.isRead && (a.type === 'system_priority' || a.type === 'admin_broadcast'));
        setPriorityNotification(priority || null);
    }, [announcements]);

    const handleAcknowledgeNotification = async () => {
        if (!priorityNotification) return;
        try {
            await api.patch(`/notifications/${priorityNotification.id}/read`, {});
            // Optimistically update local state to hide the modal and potentially show the next one
            setAnnouncements(prev => prev.map(a => a.id === priorityNotification.id ? { ...a, isRead: true } : a));
            setPriorityNotification(null);
            showSnackbar('Notification acknowledged', 'success');
        } catch (err: any) {
            console.error('Failed to mark notification as read:', err);
            showSnackbar('Failed to acknowledge notification', 'error');
        }
    };

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
        // When superadmin is in super mode, only allow strictly superadmin routes (Superadmin page)
        if (role === 'superadmin' && superMode === 'superadmin') {
            return ['superadmin', 'whatsapp', 'profile'].includes(page);
        }
        const effectiveRole: User['role'] = (role === 'superadmin' && superMode === 'store') ? 'admin' : role;
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
                currentUser?.currentStoreId ? api.get<Announcement[]>(`/notifications/stores/${currentUser.currentStoreId}`) : Promise.resolve([] as Announcement[])
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
            setAnnouncements(mapResult(results[16], [] as Announcement[]));


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

    // Notification Polling (every 30 seconds)
    useEffect(() => {
        if (!currentUser?.currentStoreId) return;

        const pollNotifications = async () => {
            if (!getOnlineStatus()) return;
            try {
                const freshAnnouncements = await api.get<Announcement[]>(`/notifications/stores/${currentUser.currentStoreId}`);
                setAnnouncements(prev => {
                    // Simple check to avoid unnecessary re-renders if length/IDs haven't changed
                    // Since specific content change is less likely to soft-update than "new item arrived"
                    const prevIds = prev.map(a => a.id).join(',');
                    const newIds = freshAnnouncements.map(a => a.id).join(',');
                    if (prevIds !== newIds) {
                        return freshAnnouncements;
                    }
                    return prev;
                });
            } catch (err) {
                console.warn('Background notification poll failed:', err);
            }
        };

        const intervalId = setInterval(pollNotifications, 30000); // 30 seconds
        return () => clearInterval(intervalId);
    }, [currentUser?.currentStoreId]);

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
        const desired = user.role === 'superadmin' ? 'superadmin' : DEFAULT_PAGES[user.role];
        // Persist last page for this user for consistency across reloads
        try {
            const key = getLastPageKey(user.id);
            localStorage.setItem(key, desired);
        } catch (_) { /* ignore storage errors */ }
        navigate(`/${desired}`);
        showSnackbar(`Welcome back, ${user.name}!`, 'success');
    };

    const handleLogout = () => setIsLogoutModalOpen(true);

    const handleConfirmLogout = () => {
        logout();
        setCurrentUser(null);
        setIsLogoutModalOpen(false);
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
            return result;
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
                    return <QuickView user={currentUser} sales={sales} products={products} />;
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
                        isLoading={isLoading}
                        showSnackbar={showSnackbar}
                        storeSettings={storeSettings!}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                    />;
                case 'sales-history':
                    return <AllSalesPage customers={customers} storeSettings={storeSettings!} />;
                case 'orders':
                    return <OrdersPage storeSettings={storeSettings!} onOpenSidebar={() => setIsSidebarOpen(true)} showSnackbar={showSnackbar} onDataRefresh={fetchData} />;
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
                    return <SettingsPage settings={storeSettings!} onSave={handleSaveSettings} />;
                case 'users':
                    return <UsersPage users={users} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} showSnackbar={showSnackbar} isLoading={isLoading} error={error} />;
                case 'notifications':
                    return <NotificationsPage announcements={announcements} onRefresh={fetchData} userId={currentUser?.id} showSnackbar={showSnackbar} />;
                case 'directory':
                case 'marketplace':
                    if (parts[1] === 'request' && parts[2]) {
                        return <MarketplaceRequestActionPage requestId={parts[2]} products={products} storeSettings={storeSettings} onBack={() => navigate('/directory')} showSnackbar={showSnackbar} />;
                    }
                    return <MarketplacePage />;

                case 'track':
                    return <CustomerRequestTrackingPage />;
                case 'superadmin': {
                    const parts = location.pathname.split('/');
                    const subPath = parts[2];
                    const id = parts[3];

                    if (subPath === 'stores') {
                        if (id) return <SuperAdminStoreDetails storeId={id} />;
                        return <SuperAdminStores />;
                    }
                    if (subPath === 'notifications') return <SuperAdminNotifications />;
                    if (subPath === 'subscriptions') return <SuperAdminSubscriptions />;
                    if (subPath === 'settings') return <SuperAdminSettings />;
                    return <SuperAdminDashboard currentUser={currentUser} />;
                }
                case 'marketing':
                    return <MarketingPage />;
                case 'logistics':
                    return <LogisticsPage />;
                case 'inventory':
                    return <InventoryPage products={products} categories={categories} suppliers={suppliers} accounts={accounts} purchaseOrders={purchaseOrders} onSaveProduct={handleSaveProduct} onDeleteProduct={handleDeleteProduct} onArchiveProduct={handleArchiveProduct} onStockChange={handleStockChange} onAdjustStock={handleStockAdjustment} onReceivePOItems={handleReceivePOItems} onSavePurchaseOrder={handleSavePurchaseOrder} onSaveCategory={handleSaveCategory} onDeleteCategory={handleDeleteCategory} isLoading={isLoading} error={error} storeSettings={storeSettings!} currentUser={currentUser} />;
                case 'user-guide':
                    return <UserGuidePage />;
                case 'whatsapp':
                    if (parts[1] === 'settings') {
                        return <WhatsAppSettingsPage storeSettings={storeSettings!} showSnackbar={showSnackbar} />;
                    }
                    return <WhatsAppConversationsPage storeSettings={storeSettings!} showSnackbar={showSnackbar} />;
                case 'support':
                    return <SupportPage />;
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
                z-[60] md:static md:block
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
                            storeSettings={storeSettings}
                            lastSync={lastSync}
                            isSyncing={isSyncing}
                            installPrompt={installPrompt}
                            onInstall={handleInstall}
                            unreadNotificationsCount={(announcements || []).filter(a => !a.isRead).length}
                            pendingMatchesCount={(pendingMatches || []).length}
                        />
                    </div>

                    {/* Main content */}
                    <div id="main-content" className="flex-1 flex flex-col overflow-y-auto dark:bg-slate-950">
                        {/* Mobile top bar with menu button - hidden on SalesPage as it has its own header */}
                        {/* Mobile top bar with menu button - hidden on SalesPage as it has its own header */}
                        {location.pathname !== '/sales' && (
                            <div className="md:hidden h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between transition-all duration-200">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    id="mobile-menu-toggle"
                                    className="p-2 -ml-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="Open menu"
                                    aria-controls="app-sidebar"
                                    aria-expanded={isSidebarOpen}
                                >
                                    <Bars3Icon className="w-6 h-6" />
                                </button>

                                <div className="flex items-center justify-center flex-1">
                                    <img src={Logo} alt="SalePilot" className="h-8 w-auto object-contain" />
                                </div>

                                <button
                                    onClick={() => navigate('/notifications')}
                                    className="p-2 -mr-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
                                    aria-label="Notifications"
                                >
                                    <BellAlertIcon className="w-6 h-6" />
                                    {(announcements || []).some(a => !a.isRead) && (
                                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                    )}
                                </button>
                            </div>
                        )}

                        {renderPage(currentPage)}
                    </div>

                    {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar(null)} />}
                    <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleConfirmLogout} />
                    <TourGuide user={currentUser} />


                    {priorityNotification && (
                        <SystemNotificationModal
                            isOpen={true}
                            title={priorityNotification.title}
                            message={priorityNotification.message}
                            date={priorityNotification.createdAt}
                            onAcknowledge={handleAcknowledgeNotification}
                        />
                    )}
                </div>
            </NotificationProvider>
        </OnboardingProvider>
    );
}


