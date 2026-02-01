import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getCurrentUser, logout, verifySession } from '../services/authService'; // Adjust paths as needed
import { api, getOnlineStatus, syncOfflineMutations } from '../services/api'; // Adjust paths
import { dbService } from '../services/dbService'; // Adjust paths
import { User, StoreSettings, Announcement } from '../types'; // Adjust paths
import Snackbar from './Snackbar';
import LoadingSpinner from './LoadingSpinner';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import StoreCompletionModal from './StoreCompletionModal';
import SystemNotificationModal from './SystemNotificationModal';
import TourGuide from './TourGuide';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { Bars3Icon, BellAlertIcon, HomeIcon, BuildingStorefrontIcon, EnvelopeIcon, SparklesIcon } from './icons'; // Adjust paths
import Logo from '../assets/logo.png'; // Adjust paths
import SocketService from '../services/socketService';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning' | 'sync';
type SnackbarState = { message: string; type: SnackbarType; };

const getLastPageKey = (userId?: string) => userId ? `salePilot.lastPage.${userId}` : 'salePilot.lastPage';
const getSuperModeKey = (userId?: string) => userId ? `salePilot.superMode.${userId}` : 'salePilot.superMode';

const PERMISSIONS: Record<User['role'], string[]> = {
    superadmin: ['superadmin', 'superadmin/stores', 'superadmin/notifications', 'superadmin/subscriptions', 'reports', 'sales', 'sales-history', 'orders', 'inventory', 'categories', 'stock-takes', 'returns', 'customers', 'suppliers', 'purchase-orders', 'accounting', 'audit-trail', 'users', 'settings', 'profile', 'notifications', 'marketing', 'directory', 'subscription', 'user-guide', 'quick-view'],
    admin: ['reports', 'sales', 'sales-history', 'orders', 'logistics', 'inventory', 'categories', 'stock-takes', 'returns', 'customers', 'suppliers', 'purchase-orders', 'accounting', 'audit-trail', 'users', 'settings', 'profile', 'notifications', 'marketing', 'directory', 'subscription', 'user-guide', 'quick-view'],
    staff: ['sales', 'sales-history', 'orders', 'logistics', 'inventory', 'returns', 'customers', 'profile', 'notifications', 'marketing', 'directory', 'user-guide', 'quick-view'],
    inventory_manager: ['reports', 'logistics', 'inventory', 'categories', 'stock-takes', 'suppliers', 'purchase-orders', 'profile', 'notifications', 'marketing', 'directory', 'user-guide', 'quick-view'],
    customer: ['profile', 'notifications', 'directory', 'customer', 'customer/dashboard', 'customer/orders', 'user-guide', 'quick-view'],
    supplier: ['profile', 'notifications', 'directory', 'supplier/dashboard', 'supplier/orders', 'user-guide', 'quick-view']
};

const DEFAULT_PAGES: Record<User['role'], string> = {
    superadmin: 'superadmin',
    admin: 'reports',
    staff: 'sales',
    inventory_manager: 'inventory',
    customer: 'customer/dashboard',
    supplier: 'supplier/dashboard'
};

export default function DashboardLayout() {
    // --- Global State ---
    const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [pendingMatches, setPendingMatches] = useState<any[]>([]);

    // --- UI State ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isStoreCompletionModalOpen, setIsStoreCompletionModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [installPrompt, setInstallPrompt] = useState<any | null>(null);

    // --- Sync State ---
    const [isOnline, setIsOnline] = useState(getOnlineStatus());
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(null);

    // --- Super Admin Mode ---
    const [superMode, setSuperMode] = useState<'superadmin' | 'store'>(() => {
        try {
            const u = getCurrentUser();
            const saved = localStorage.getItem(getSuperModeKey(u?.id));
            return (saved === 'store' || saved === 'superadmin') ? (saved as any) : 'superadmin';
        } catch { return 'superadmin'; }
    });
    const [systemStores, setSystemStores] = useState<{ id: string; name: string }[]>([]);

    const [priorityNotification, setPriorityNotification] = useState<Announcement | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
        setSnackbar({ message, type });
    }, []);

    // --- Effects & Logic (Ported from Dashboard.tsx but simplified) ---

    // 1. Session Check & Auth
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
                    // Permission check is now handled largely by the Routes but we do a sanity check on mount if needed
                    // or we rely on the Sidebar to just show what's allowed.
                    // For now, we trust the Route guards (to be implemented) or just Redirect if root.
                } catch (error) {
                    console.log("Session verification failed, running in offline mode.");
                    setCurrentUser(localUser as User);
                }
            }
            setIsLoading(false);
        };
        checkSession();
    }, []);

    // 2. Fetch Global Data (Settings, Notifications) - ONLY lightweight data
    const fetchGlobalData = useCallback(async () => {
        if (!currentUser?.currentStoreId) return;
        try {
            const results = await Promise.allSettled([
                api.get<StoreSettings>('/settings'),
                api.get<Announcement[]>(`/notifications/stores/${currentUser.currentStoreId}`)
            ]);

            const mapResult = <T,>(res: PromiseSettledResult<T>, fallback: T): T =>
                res.status === 'fulfilled' ? res.value : fallback;

            const settings = mapResult(results[0], null as any);
            setStoreSettings(settings);
            setAnnouncements(mapResult(results[1], []));

            // Check for incomplete store settings
            if (settings) {
                if (!settings.address?.trim() || !settings.phone?.trim()) {
                    setIsStoreCompletionModalOpen(true);
                }
            }

            // Pending matches
            api.get<any[]>(`/marketplace/stores/${currentUser.currentStoreId}/matches`)
                .then(matches => setPendingMatches(matches || []))
                .catch(() => setPendingMatches([]));

        } catch (err) {
            console.error("Failed to load global data", err);
        }
    }, [currentUser?.currentStoreId]);

    useEffect(() => {
        if (currentUser?.currentStoreId) fetchGlobalData();
    }, [fetchGlobalData]);

    // 3. Sync Logic
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
            fetchGlobalData();
        }
    }, [isSyncing, showSnackbar, fetchGlobalData]);

    useEffect(() => {
        const handleStatusChange = () => {
            const onlineStatus = getOnlineStatus();
            setIsOnline(onlineStatus);
            if (onlineStatus) handleSync();
        };
        window.addEventListener('onlineStatusChange', handleStatusChange);
        return () => window.removeEventListener('onlineStatusChange', handleStatusChange);
    }, [handleSync]);

    // 4. Notifications & Sockets
    useEffect(() => {
        if (!currentUser?.currentStoreId) return;
        const pollNotifications = async () => {
            if (!getOnlineStatus()) return;
            try {
                const freshAnnouncements = await api.get<Announcement[]>(`/notifications/stores/${currentUser.currentStoreId}`);
                setAnnouncements(prev => {
                    const prevIds = prev.map(a => a.id).join(',');
                    const newIds = freshAnnouncements.map(a => a.id).join(',');
                    if (prevIds !== newIds) return freshAnnouncements;
                    return prev;
                });
            } catch (err) { console.warn('Background notification poll failed:', err); }
        };
        const intervalId = setInterval(pollNotifications, 30000);
        return () => clearInterval(intervalId);
    }, [currentUser?.currentStoreId]);

    useEffect(() => {
        if (!currentUser || currentUser.role === 'customer') return;
        const socketService = SocketService.getInstance();
        const socket = socketService.getSocket();
        socket.emit('join_sellers');
        const handleNewRequest = (data: any) => {
            if (data.storeId && currentUser?.currentStoreId && data.storeId !== currentUser.currentStoreId) return;
            showSnackbar(`New Request: ${data.title}`, 'info');
            if (Notification.permission === 'granted') {
                new Notification('New Deal Request', { body: data.title, icon: Logo });
            }
        };
        socket.on('new_request', handleNewRequest);
        return () => { socket.off('new_request', handleNewRequest); };
    }, [currentUser, showSnackbar]);

    // Priority Notification Check
    useEffect(() => {
        const priority = (announcements || []).find(a => !a.isRead && (a.type === 'system_priority' || a.type === 'admin_broadcast'));
        setPriorityNotification(priority || null);
    }, [announcements]);

    const handleAcknowledgeNotification = async () => {
        if (!priorityNotification) return;
        try {
            await api.patch(`/notifications/${priorityNotification.id}/read`, {});
            setAnnouncements(prev => prev.map(a => a.id === priorityNotification.id ? { ...a, isRead: true } : a));
            setPriorityNotification(null);
        } catch (err) { console.error(err); }
    };

    // Install Prompt
    useEffect(() => {
        const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((res: any) => {
            if (res.outcome === 'accepted') showSnackbar('Installed!', 'success');
            setInstallPrompt(null);
        });
    };

    // Mobile Sidebar
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);


    if (isLoading && !currentUser) {
        return <div className="h-screen w-full flex items-center justify-center"><LoadingSpinner /></div>;
    }

    if (!currentUser) {
        // Fallback if not auth (should be handled by Route guards but safe to have)
        navigate('/login');
        return null;
    }

    return (
        <OnboardingProvider user={currentUser}>
            <NotificationProvider user={currentUser}>
                <div className="flex h-screen bg-gray-100 font-sans">
                    {/* Mobile overlay */}
                    {isSidebarOpen && (
                        <div className="fixed inset-0 bg-black/40 z-[55] md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
                    )}

                    {/* Sidebar */}
                    <div id="app-sidebar" className={`z-[60] md:static md:block ${isSidebarOpen ? 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none' : 'hidden md:block'}`}>
                        <Sidebar
                            user={currentUser}
                            onLogout={() => setIsLogoutModalOpen(true)}
                            isOnline={isOnline}
                            allowedPages={currentUser.role === 'superadmin' ? (superMode === 'superadmin' ? PERMISSIONS['superadmin'].filter(p => p.startsWith('superadmin')) : PERMISSIONS['admin']) : PERMISSIONS[currentUser.role]} // Simplified permission logic for visual
                            superMode={currentUser.role === 'superadmin' ? superMode : undefined}
                            onChangeSuperMode={(mode) => {
                                setSuperMode(mode);
                                try { localStorage.setItem(getSuperModeKey(currentUser.id), mode); } catch { }
                                // Navigation logic will be handled by the user clicking links, or we can force redirect if needed
                                const effectiveRole = (currentUser.role === 'superadmin' && mode === 'store') ? 'admin' : currentUser.role;
                                const defaultPage = DEFAULT_PAGES[effectiveRole];
                                navigate(`/${defaultPage}`);
                            }}
                            storesForSelect={currentUser.role === 'superadmin' ? systemStores : undefined}
                            selectedStoreId={currentUser.currentStoreId}
                            onSelectStore={async (storeId) => {
                                if (!storeId) return;
                                try {
                                    await api.patch('/users/me/current-store', { storeId });
                                    const stored = getCurrentUser();
                                    // Update local user and reload
                                    if (stored) {
                                        const merged = { ...stored, currentStoreId: storeId } as User as any;
                                        localStorage.setItem('salePilotUser', JSON.stringify(merged));
                                        setCurrentUser(merged);
                                        showSnackbar('Store context updated.', 'success');
                                        // window.location.reload(); // Might need to reload to refresh all data or just trigger re-fetch
                                    }
                                } catch (err: any) {
                                    showSnackbar(err.message, 'error');
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

                    {/* Main Content */}
                    <div id="main-content" className="flex-1 flex flex-col overflow-y-auto">
                        {/* Mobile Header - Optional, only if needed or specific pages don't have it */}
                        {location.pathname !== '/sales' && (
                            <div className="md:hidden h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 flex items-center px-4 justify-between transition-all duration-200" glass-effect="">
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700">
                                    <Bars3Icon className="w-6 h-6" />
                                </button>
                                <div className="flex items-center justify-center flex-1">
                                    <img src={Logo} alt="SalePilot" className="h-8 w-auto object-contain" />
                                </div>
                                <button onClick={() => navigate('/notifications')} className="p-2 -mr-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 relative">
                                    <BellAlertIcon className="w-6 h-6" />
                                    {(announcements || []).some(a => !a.isRead) && (
                                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* OUTLET - This is where the page content will be rendered */}
                        <Outlet context={{
                            currentUser,
                            storeSettings,
                            isOnline,
                            showSnackbar,
                            fetchGlobalData // Expose this so pages can trigger a global refresh if needed
                        }} />

                        {/* SuperAdmin "Command Deck" Mobile Nav */}
                        {currentUser.role === 'superadmin' && superMode === 'superadmin' && (
                            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-16 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.25)] flex items-center justify-around px-2 z-[45] pointer-events-auto overflow-hidden">
                                {/* Deck Glow */}
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none"></div>

                                <button
                                    onClick={() => navigate('/superadmin')}
                                    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all ${location.pathname === '/superadmin' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                                >
                                    <HomeIcon className="w-5 h-5" />
                                    <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">HUB</span>
                                </button>

                                <button
                                    onClick={() => navigate('/superadmin/stores')}
                                    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all ${location.pathname.includes('/stores') ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                                >
                                    <BuildingStorefrontIcon className="w-5 h-5" />
                                    <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">FLEET</span>
                                </button>

                                <button
                                    onClick={() => navigate('/superadmin/notifications')}
                                    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all ${location.pathname.includes('/notifications') ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                                >
                                    <EnvelopeIcon className="w-5 h-5" />
                                    <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">COMMS</span>
                                </button>

                                <button
                                    onClick={() => {
                                        // Trigger AI Chat (it's a component in SuperAdminDashboard, but we might want a global way to open it)
                                        // For now, let's navigate to dashboard if not there, or we can use a context/state
                                        if (location.pathname !== '/superadmin') navigate('/superadmin');
                                        // The AI card will be accessible via its FAB
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all ${location.pathname.includes('/ai') ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'}`}
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    <span className="text-[8px] font-mono font-bold tracking-tighter uppercase">INTEL</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {snackbar && <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar(null)} />}
                    <LogoutConfirmationModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={() => {
                        logout();
                        setCurrentUser(null);
                        setIsLogoutModalOpen(false);
                        navigate('/login');
                    }} />
                    <TourGuide
                        user={currentUser}
                        run={!isStoreCompletionModalOpen && !priorityNotification && storeSettings !== null}
                    />

                    <StoreCompletionModal
                        isOpen={isStoreCompletionModalOpen}
                        initialSettings={storeSettings}
                        onSave={async (address, phone) => {
                            if (!storeSettings) return;
                            try {
                                await api.put<StoreSettings>('/settings', { ...storeSettings, address, phone });
                                setStoreSettings({ ...storeSettings, address, phone });
                                setIsStoreCompletionModalOpen(false);
                                showSnackbar('Settings saved', 'success');
                            } catch (e) { showSnackbar('Failed to save settings', 'error'); }
                        }}
                    />

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
