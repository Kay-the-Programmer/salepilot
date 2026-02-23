import React, { useState } from 'react';
import { api } from '../services/api';
import { User, StoreSettings, Sale } from '../types';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ArrowLeftOnRectangleIcon from '../components/icons/ArrowLeftOnRectangleIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import DevicePhoneMobileIcon from '../components/icons/DevicePhoneMobileIcon';
import KeyIcon from '../components/icons/KeyIcon';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import Header from "@/components/Header.tsx";
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import { formatCurrency } from '../utils/currency';

interface ProfilePageProps {
    user: User;
    storeSettings: StoreSettings;
    onLogout: () => void;
    installPrompt: any | null;
    onInstall: () => void;
    onUpdateProfile: (userData: { name: string; email: string }) => Promise<void>;
    onChangePassword: (passwordData: { currentPassword: string, newPassword: string }) => Promise<void>;
}

// ── Tab metadata ────────────────────────────────────────────────────
const TABS = [
    { id: 'info', label: 'Info', Icon: UserCircleIcon },
    { id: 'orders', label: 'Orders', Icon: HiOutlineShoppingBag },
    { id: 'security', label: 'Security', Icon: KeyIcon },
    { id: 'app', label: 'App', Icon: DevicePhoneMobileIcon },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Reusable Section Card ───────────────────────────────────────────
const SectionCard: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}> = ({ title, icon, children, className = '' }) => (
    <section
        aria-label={title}
        className={`bg-white dark:bg-slate-900/60 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 ${className}`}
    >
        <div className="flex items-center gap-3 mb-5">
            {icon && (
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-indigo-900/30 text-blue-600 dark:text-indigo-400">
                    {icon}
                </span>
            )}
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">{title}</h3>
        </div>
        {children}
    </section>
);

// ── Main Component ──────────────────────────────────────────────────
const ProfilePage: React.FC<ProfilePageProps> = ({
    user,
    storeSettings,
    onLogout,
    installPrompt,
    onInstall,
    onUpdateProfile,
    onChangePassword
}) => {
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('info');

    // Order History State
    const [orders, setOrders] = useState<Sale[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    React.useEffect(() => {
        const fetchOrders = async () => {
            if (!user.email) return;
            setIsLoadingOrders(true);
            try {
                const response = await api.get<Sale[]>('/sales');
                const myOrders = response.filter(order =>
                    order.customerId === user.id ||
                    (order.customerDetails?.email && order.customerDetails.email.toLowerCase() === user.email.toLowerCase())
                );
                myOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setOrders(myOrders);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setIsLoadingOrders(false);
            }
        };

        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab, user.id, user.email]);

    // Platform detection
    const ua = typeof window !== 'undefined' ? (window.navigator.userAgent || '') : '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') && typeof document !== 'undefined' && 'ontouchend' in document);
    const isStandalone = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (typeof window !== 'undefined' && (window as any).navigator?.standalone);

    const handleSaveProfile = async (userData: { name: string; email: string }) => {
        try {
            await onUpdateProfile(userData);
            setIsEditProfileModalOpen(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        }
    };

    // ── Render helpers ──────────────────────────────────────────────
    const renderProfileCard = () => (
        <div className="liquid-glass-card rounded-[2rem] dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 p-5 sm:p-6 lg:sticky lg:top-8">
            <div className="flex items-center gap-4 lg:flex-col lg:text-center">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div className="w-20 h-20 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-full flex items-center justify-center">
                        <UserCircleIcon className="w-12 h-12 lg:w-16 lg:h-16 text-blue-600 dark:text-indigo-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" aria-label="Verified account">
                        <ShieldCheckIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-white" />
                    </div>
                </div>

                {/* Name & metadata */}
                <div className="min-w-0 flex-1 lg:mt-4 lg:space-y-2">
                    <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-slate-100 truncate">{user.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{user.email}</p>
                    <div className="mt-2 lg:mt-3 flex items-center gap-2 lg:justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-indigo-900/30 text-blue-700 dark:text-indigo-300">
                            <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-indigo-400 rounded-full animate-pulse" aria-hidden="true" />
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Edit Profile button */}
            <button
                onClick={() => setIsEditProfileModalOpen(true)}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors active:scale-[0.98] active:scale-95 transition-all duration-300"
                aria-label="Edit your profile"
            >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
            </button>
        </div>
    );

    const renderPersonalInfo = () => (
        <SectionCard title="Personal Information" icon={<UserCircleIcon className="w-5 h-5" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Full Name" value={user.name} color="blue" />
                <InfoField label="Email Address" value={user.email} color="purple" breakAll />
                <InfoField label="Account Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} color="amber" />
                <InfoField
                    label="Account Status"
                    color="emerald"
                    value={
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
                            Active Session
                        </span>
                    }
                />
            </div>
        </SectionCard>
    );

    const renderOrders = () => (
        <SectionCard title="Order History" icon={<HiOutlineShoppingBag className="w-5 h-5" />}>
            <div aria-live="polite" aria-busy={isLoadingOrders}>
                {isLoadingOrders ? (
                    <div className="py-8 text-center text-gray-500 dark:text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Loading orders…
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-8 text-center">
                        <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <HiOutlineShoppingBag className="w-7 h-7 text-gray-300 dark:text-slate-600" />
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">No recent orders found.</p>
                    </div>
                ) : (
                    <ul className="space-y-2" role="list">
                        {orders.map((order: Sale) => (
                            <li key={order.transactionId}>
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-indigo-800 hover:bg-blue-50/30 dark:hover:bg-indigo-900/10 transition-colors flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95 transition-all duration-300"
                                    aria-label={`Order ${order.transactionId.slice(-4)}, ${formatCurrency(order.total, storeSettings)}, ${order.fulfillmentStatus || 'Pending'}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs">
                                            #{order.transactionId.slice(-4)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{formatCurrency(order.total, storeSettings)}</p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                {new Date(order.timestamp).toLocaleDateString()} · {order.cart.length} items
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.fulfillmentStatus === 'fulfilled' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                            order.fulfillmentStatus === 'shipped' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                order.fulfillmentStatus === 'cancelled' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                                                    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                        }`}>
                                        {order.fulfillmentStatus || 'Pending'}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </SectionCard>
    );

    const renderInstallApp = () => (
        <SectionCard title="Install Application" icon={<DevicePhoneMobileIcon className="w-5 h-5" />}>
            <div className="space-y-4">
                <div className="p-4 bg-blue-50/60 dark:bg-indigo-900/20 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">
                        {isStandalone ? "🎉 App is Installed" : "📱 Get the Native App Experience"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                        {isStandalone
                            ? "You're running the installed version with full PWA functionality including offline access and push notifications."
                            : isIOS
                                ? "Install on your iPhone/iPad home screen for quick access, offline capabilities, and a native app feel."
                                : "Install on your device for offline access, faster loading times, and desktop notifications."
                        }
                    </p>
                </div>

                {!isStandalone && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Installation Guide</h4>
                            <ol className="space-y-2.5 list-none">
                                {(isIOS ? [
                                    "Open in Safari and tap the Share button",
                                    "Select \"Add to Home Screen\"",
                                    "Tap \"Add\" to complete installation"
                                ] : [
                                    "Look for the install icon in browser address bar",
                                    "Or use browser menu → \"Install App\"",
                                    "Confirm installation when prompted"
                                ]).map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-indigo-900/40 text-blue-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-slate-300">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="p-4">
                            <button
                                onClick={() => {
                                    if (installPrompt) {
                                        onInstall();
                                    } else if (isStandalone) {
                                        alert('The app is already installed and running in standalone mode.');
                                    } else if (isIOS) {
                                        alert('To install this app on iOS:\n\n1. Open this site in Safari\n2. Tap the Share button\n3. Scroll down and tap "Add to Home Screen"\n4. Tap "Add" in the top right corner');
                                    } else {
                                        alert('Install prompt is not available yet. Try visiting a few pages and then return here, or use your browser menu: Install App/Add to Home Screen.');
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors active:scale-[0.98] active:scale-95 transition-all duration-300"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                {isStandalone ? "Installed ✓" : "Install App Now"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SectionCard>
    );

    const renderSecurity = () => (
        <SectionCard title="Security & Account" icon={<KeyIcon className="w-5 h-5" />}>
            <div className="space-y-4">
                <button
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-indigo-700 hover:bg-blue-50/30 dark:hover:bg-indigo-900/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-95 transition-all duration-300"
                >
                    <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Change Password</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Update your login credentials securely</p>
                    </div>
                    <span className="text-gray-400 dark:text-slate-500 ml-2" aria-hidden="true">→</span>
                </button>

                {/* Logout */}
                <div className="p-4 bg-red-50/60 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowLeftOnRectangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Session Management</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                        You will be signed out from all devices. This action cannot be undone.
                    </p>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 dark:bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-colors active:scale-[0.98] active:scale-95 transition-all duration-300"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        Sign Out Now
                    </button>
                </div>
            </div>
        </SectionCard>
    );

    // Map tab id → renderer
    const tabPanels: Record<TabId, () => React.ReactNode> = {
        info: renderPersonalInfo,
        orders: renderOrders,
        security: renderSecurity,
        app: renderInstallApp,
    };

    return (
        <>
            <div className="min-h-screen bg-mesh-light dark:bg-slate-950 md:min-h-0 md:h-full md:overflow-y-auto font-google">
                <Header
                    title="Profile"
                    showSearch={false}
                />

                <main className="px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-6">

                            {/* ── Profile Card (top on mobile, sidebar on desktop) ── */}
                            <aside className="lg:w-72 lg:shrink-0" aria-label="Profile summary">
                                {renderProfileCard()}

                                {/* Desktop sidebar nav */}
                                <nav className="hidden lg:block mt-4" aria-label="Profile sections">
                                    <div role="tablist" aria-label="Profile sections" className="liquid-glass-card rounded-[2rem] dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 p-2 space-y-1">
                                        {TABS.map(({ id, label, Icon }) => (
                                            <button
                                                key={id}
                                                role="tab"
                                                id={`profile-tab-${id}`}
                                                aria-selected={activeTab === id}
                                                aria-controls={`profile-panel-${id}`}
                                                onClick={() => setActiveTab(id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === id
                                                        ? 'bg-blue-50 dark:bg-indigo-900/30 text-blue-700 dark:text-indigo-300'
                                                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                                                    }`}
                                            >
                                                <Icon className="w-4.5 h-4.5" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </nav>
                            </aside>

                            {/* ── Content Area ── */}
                            <div className="flex-1 min-w-0">
                                {TABS.map(({ id }) => (
                                    <div
                                        key={id}
                                        role="tabpanel"
                                        id={`profile-panel-${id}`}
                                        aria-labelledby={`profile-tab-${id}`}
                                        hidden={activeTab !== id}
                                        className={activeTab === id ? 'animate-profile-tab-in' : ''}
                                    >
                                        {activeTab === id && tabPanels[id]()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                {/* ── Mobile Bottom Tab Bar ── */}
                <nav
                    className="profile-tab-bar lg:hidden"
                    aria-label="Profile sections"
                >
                    <div role="tablist" aria-label="Profile sections" className="flex items-stretch">
                        {TABS.map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                role="tab"
                                id={`profile-tab-mobile-${id}`}
                                aria-selected={activeTab === id}
                                aria-controls={`profile-panel-${id}`}
                                onClick={() => setActiveTab(id)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${activeTab === id
                                        ? 'text-blue-600 dark:text-indigo-400'
                                        : 'text-gray-400 dark:text-slate-500'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Modals */}
                <EditProfileModal
                    isOpen={isEditProfileModalOpen}
                    onClose={() => setIsEditProfileModalOpen(false)}
                    onSave={handleSaveProfile}
                    currentUser={user}
                />
                <ChangePasswordModal
                    isOpen={isChangePasswordModalOpen}
                    onClose={() => setIsChangePasswordModalOpen(false)}
                    onSave={onChangePassword}
                />
                <OrderDetailsModal
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                    orders={orders}
                    storeSettings={storeSettings}
                />
            </div>
        </>
    );
};

// ── Small helper for info fields ────────────────────────────────────
const InfoField: React.FC<{
    label: string;
    value: React.ReactNode;
    color: 'blue' | 'purple' | 'amber' | 'emerald';
    breakAll?: boolean;
}> = ({ label, value, color, breakAll }) => {
    const bgMap = {
        blue: 'bg-blue-50/60 dark:bg-blue-900/15',
        purple: 'bg-purple-50/60 dark:bg-purple-900/15',
        amber: 'bg-amber-50/60 dark:bg-amber-900/15',
        emerald: 'bg-emerald-50/60 dark:bg-emerald-900/15',
    };

    return (
        <div className={`p-4 rounded-xl ${bgMap[color]}`}>
            <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
            <p className={`mt-1.5 text-sm font-semibold text-gray-900 dark:text-slate-100 ${breakAll ? 'break-all' : ''}`}>{value}</p>
        </div>
    );
};

export default ProfilePage;