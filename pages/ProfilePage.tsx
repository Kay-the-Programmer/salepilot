import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User, StoreSettings, Sale } from '../types';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ArrowLeftOnRectangleIcon from '../components/icons/ArrowLeftOnRectangleIcon';
import ArrowDownTrayIcon from '../components/icons/ArrowDownTrayIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import DevicePhoneMobileIcon from '../components/icons/DevicePhoneMobileIcon';
import KeyIcon from '../components/icons/KeyIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import OrderDetailsModal from '../components/orders/OrderDetailsModal';
import { HiOutlineShoppingBag } from 'react-icons/hi2';
import { formatCurrency } from '../utils/currency';
import { useNavigate } from 'react-router-dom';

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
        className={`bg-white dark:bg-slate-900/60 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm p-6 sm:p-8 ${className}`}
    >
        <div className="flex items-center gap-4 mb-6">
            {icon && (
                <span className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                    {icon}
                </span>
            )}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
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
    const navigate = useNavigate();
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>(() => (localStorage.getItem('profile.activeTab') as TabId) || 'info');
    const tabBarRef = useRef<HTMLDivElement>(null);

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

        if (activeTab === 'orders' && orders.length === 0) {
            fetchOrders();
        }
    }, [activeTab, user.id, user.email, orders.length]);

    // Keyboard navigation for tabs
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
        const tabIds = TABS.map(t => t.id);
        const currentIndex = tabIds.indexOf(activeTab);
        let nextIndex = -1;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            nextIndex = (currentIndex + 1) % tabIds.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            nextIndex = tabIds.length - 1;
        }

        if (nextIndex !== -1) {
            const nextTabId = tabIds[nextIndex];
            setActiveTab(nextTabId);
            const nextTabElement = document.getElementById(`tab-${nextTabId}`);
            nextTabElement?.focus();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab && tabBarRef.current) {
            const activeElement = document.getElementById(`tab-${activeTab}`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        localStorage.setItem('profile.activeTab', activeTab);
    }, [activeTab]);

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
        <section className="bg-white dark:bg-slate-900/60 rounded-[24px] border border-slate-200/50 dark:border-white/5 shadow-sm p-8 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative shrink-0 mb-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center shadow-inner border-[4px] border-white dark:border-slate-800">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <UserCircleIcon className="w-14 h-14 sm:w-16 sm:h-16 text-slate-400 dark:text-slate-500" />
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center border-[3px] border-white dark:border-slate-900 shadow-sm" aria-label="Verified account">
                    <ShieldCheckIcon className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Name & metadata */}
            <div className="min-w-0 w-full space-y-1.5 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate tracking-tight">{user.name}</h2>
                <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                <div className="pt-2 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" aria-hidden="true" />
                        {user.role}
                    </span>
                </div>
            </div>

            {/* Edit Profile button */}
            <button
                onClick={() => setIsEditProfileModalOpen(true)}
                className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[15px] font-semibold rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all duration-300 active:scale-95 shadow-md"
                aria-label="Edit your profile"
            >
                <PencilIcon className="w-4.5 h-4.5" />
                Edit Profile
            </button>
        </section>
    );

    const renderPersonalInfo = () => (
        <div className="space-y-6">
            {renderProfileCard()}

            <SectionCard title="Personal Details" icon={<UserCircleIcon className="w-5 h-5" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Full Name" value={user.name} color="blue" />
                    <InfoField label="Email Address" value={user.email} color="purple" breakAll />
                    <InfoField label="Account Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} color="amber" />
                    <InfoField
                        label="Account Status"
                        color="emerald"
                        value={
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" aria-hidden="true" />
                                Active Session
                            </span>
                        }
                    />
                </div>
            </SectionCard>
        </div>
    );

    const renderOrders = () => (
        <SectionCard title="Order History" icon={<HiOutlineShoppingBag className="w-5 h-5" />}>
            <div aria-live="polite" aria-busy={isLoadingOrders}>
                {isLoadingOrders ? (
                    <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-medium text-[15px]">Loading orders…</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiOutlineShoppingBag className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[15px] font-medium">No recent orders found.</p>
                    </div>
                ) : (
                    <ul className="space-y-3" role="list">
                        {orders.map((order: Sale) => (
                            <li key={order.transactionId}>
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full text-left p-4 sm:p-5 rounded-[20px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-slate-800/50 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] shadow-sm hover:shadow-md"
                                    aria-label={`Order ${order.transactionId.slice(-4)}, ${formatCurrency(order.total, storeSettings)}, ${order.fulfillmentStatus || 'Pending'}`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <span className="shrink-0 w-12 h-12 rounded-[14px] bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-white/5">
                                            #{order.transactionId.slice(-4)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-base font-bold text-slate-900 dark:text-white mb-0.5">{formatCurrency(order.total, storeSettings)}</p>
                                            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                                <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
                                                <span>{order.cart.length} item{order.cart.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="self-end sm:self-center shrink-0">
                                        <span className={`inline-flex px-3 py-1.5 rounded-[10px] text-[11px] font-bold uppercase tracking-wider ${order.fulfillmentStatus === 'fulfilled' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                                                order.fulfillmentStatus === 'shipped' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                                                    order.fulfillmentStatus === 'cancelled' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400' :
                                                        'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                            }`}>
                                            {order.fulfillmentStatus || 'Pending'}
                                        </span>
                                    </div>
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
            <div className="space-y-5">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 rounded-[20px]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            {isStandalone ? <ShieldCheckIcon className="w-5 h-5" /> : <DevicePhoneMobileIcon className="w-5 h-5" />}
                        </div>
                        <h4 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">
                            {isStandalone ? "App Installed" : "Get Native Experience"}
                        </h4>
                    </div>
                    <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed ml-13 pl-[52px]">
                        {isStandalone
                            ? "You're running the installed version with full PWA functionality including offline access and push notifications."
                            : isIOS
                                ? "Install on your iPhone/iPad home screen for quick access, offline capabilities, and a native app feel."
                                : "Install on your device for offline access, faster loading times, and desktop notifications."
                        }
                    </p>
                </div>

                {!isStandalone && (
                    <div className="bg-white dark:bg-slate-900/40 rounded-[20px] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
                        <div className="p-5 lg:p-6 border-b border-slate-100 dark:border-white/5">
                            <h4 className="text-[15px] font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Installation Guide</h4>
                            <ol className="space-y-4 list-none">
                                {(isIOS ? [
                                    "Open in Safari and tap the Share button",
                                    "Select \"Add to Home Screen\"",
                                    "Tap \"Add\" to complete installation"
                                ] : [
                                    "Look for the install icon in browser address bar",
                                    "Or use browser menu → \"Install App\"",
                                    "Confirm installation when prompted"
                                ]).map((step, i) => (
                                    <li key={i} className="flex items-start gap-3.5">
                                        <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[13px] font-bold flex items-center justify-center mt-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                                            {i + 1}
                                        </span>
                                        <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300 leading-snug pt-1">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="p-5 lg:p-6 bg-slate-50 dark:bg-slate-800/20">
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
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[15px] font-bold tracking-wide rounded-[16px] xl:rounded-full hover:bg-slate-800 dark:hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all duration-300 active:scale-[0.98] shadow-md"
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
                    className="w-full flex items-center justify-between p-5 rounded-[20px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800/80 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] shadow-sm hover:shadow-md group"
                >
                    <div className="text-left">
                        <p className="text-base font-bold text-slate-900 dark:text-white mb-1">Change Password</p>
                        <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Update your login credentials securely</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/20 transition-colors">
                        <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" aria-hidden="true">→</span>
                    </div>
                </button>

                {/* Logout */}
                <div className="p-5 lg:p-6 bg-rose-50/50 dark:bg-rose-500/10 rounded-[20px] border border-rose-100 dark:border-rose-500/20 mt-6 xl:mt-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                        </div>
                        <h4 className="text-[17px] font-bold text-slate-900 dark:text-white">Session Management</h4>
                    </div>
                    <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                        You will be signed out from all devices. This action cannot be undone.
                    </p>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 dark:bg-rose-600 text-white text-[15px] font-bold tracking-wide rounded-[16px] xl:rounded-full hover:bg-rose-700 dark:hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all duration-300 active:scale-[0.98] shadow-md shadow-rose-500/20"
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
        <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 font-google overflow-hidden relative">
            {/* Skip to content link for accessibility */}
            <a
                href="#profile-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
            >
                Skip to profile content
            </a>

            {/* Header */}
            <header className="flex-none sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-transparent transition-all duration-300" role="banner">
                <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-4 md:py-6 flex items-center gap-4 lg:gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl transition-all duration-300 active:scale-95 shadow-sm group border border-slate-200/50 dark:border-white/10"
                        aria-label="Go back"
                    >
                        <ChevronLeftIcon className="w-5 h-5 lg:w-6 lg:h-6 text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors" />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[13px] md:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-0.5 lg:mb-1 tracking-wide uppercase">
                            Account Settings
                        </p>
                        <h1 className="text-2xl md:text-[34px] font-bold md:font-semibold text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                            Profile
                        </h1>
                    </div>
                </div>
            </header>

            {/* Apple-style Segmented Control Tab Bar */}
            <nav
                ref={tabBarRef}
                className="flex-none sticky top-[72px] md:top-[90px] lg:top-[100px] z-30 transition-all duration-300 bg-slate-50 dark:bg-slate-950 pb-2 md:pb-4 border-b border-slate-200/50 dark:border-white/5"
                role="tablist"
                aria-label="Profile sections"
                onKeyDown={handleTabKeyDown}
            >
                <div className="max-w-[1000px] mx-auto px-4 md:px-8 flex items-center justify-between">
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-[16px] md:rounded-[20px] overflow-x-auto scrollbar-hide gap-1.5 w-full max-w-full relative shadow-inner">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.Icon;
                            return (
                                <button
                                    key={tab.id}
                                    role="tab"
                                    id={`tab-${tab.id}`}
                                    aria-selected={isActive}
                                    aria-controls={`tabpanel-${tab.id}`}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-[12px] md:rounded-[16px] text-[13px] md:text-[15px] font-bold tracking-wide whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300 ${isActive ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <Icon className={isActive ? 'w-5 h-5 text-blue-600 dark:text-blue-400' : 'w-4.5 h-4.5'} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <main
                id="profile-content"
                className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 scroll-smooth"
                tabIndex={-1}
            >
                <div className="max-w-[1000px] mx-auto w-full pb-24 lg:pb-12">
                    {TABS.map(({ id }) => (
                        <div
                            key={id}
                            role="tabpanel"
                            id={`tabpanel-${id}`}
                            aria-labelledby={`tab-${id}`}
                            hidden={activeTab !== id}
                            className={activeTab === id ? 'animate-profile-tab-in' : ''}
                        >
                            {activeTab === id && tabPanels[id]()}
                        </div>
                    ))}
                </div>
            </main>

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
    );
};

// ── Small helper for info fields ────────────────────────────────────
const InfoField: React.FC<{
    label: string;
    value: React.ReactNode;
    color: 'blue' | 'purple' | 'amber' | 'emerald';
    breakAll?: boolean;
}> = ({ label, value, color, breakAll }) => {
    return (
        <div className={`p-5 rounded-[20px] bg-slate-50/80 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5`}>
            <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`w-2 h-2 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'purple' ? 'bg-purple-500' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <label className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
            </div>
            <div className={`text-[15px] font-semibold text-slate-900 dark:text-white ${breakAll ? 'break-all' : ''}`}>{value}</div>
        </div>
    );
};

export default ProfilePage;