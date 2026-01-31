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
import GridIcon from '../components/icons/GridIcon';
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

const InfoCard: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    variant?: 'default' | 'danger';
}> = ({ title, icon, children, actions, variant = 'default' }) => (
    <div className={`group bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm ${variant === 'danger' ? 'border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-900/50' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'} p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:-translate-y-0.5 glass-effect`} glass-effect="true">
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-3 rounded-xl transition-all duration-300 ${variant === 'danger'
                        ? 'text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
                        : 'text-blue-600 dark:text-indigo-400 dark:bg-slate-800/50 group-hover:from-blue-100 group-hover:to-indigo-100 dark:group-hover:from-indigo-900/30 dark:group-hover:to-purple-900/30'}`}>
                        {icon}
                    </div>
                )}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 transition-colors duration-200">{title}</h3>
                    {variant === 'danger' && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Irreversible action</p>
                    )}
                </div>
            </div>
            {actions}
        </div>
        {children}
    </div>
);

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
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'security' | 'app'>('info');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Order History State
    const [orders, setOrders] = useState<Sale[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    React.useEffect(() => {
        const fetchOrders = async () => {
            if (!user.email) return;
            setIsLoadingOrders(true);
            try {
                // Fetch orders for this customer (filtered by email or customerId if available)
                // Assuming backend supports filtering by email or we filter client side if needed
                // Using a generic search/filter capability if available, or just getting all sales and filtering
                const response = await api.get<Sale[]>('/sales');
                const myOrders = response.filter(order =>
                    order.customerId === user.id ||
                    (order.customerDetails?.email && order.customerDetails.email.toLowerCase() === user.email.toLowerCase())
                );

                // Sort by date desc
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

    // Platform detection for install guidance
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

    return (
        <>
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 from-gray-50 to-white dark:from-slate-950 dark:to-slate-900 md:min-h-0 md:h-full md:overflow-y-auto">
                <Header
                    title="Profile"
                    showSearch={false}
                    rightContent={
                        <div className="flex items-center gap-2 md:hidden">
                            <button
                                onClick={() => setIsEditProfileModalOpen(true)}
                                className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                aria-label="Edit Profile"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className={`p-2 rounded-full transition-colors ${isMobileMenuOpen ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-100' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                                aria-label="Menu"
                            >
                                <GridIcon className="w-5 h-5" />
                            </button>
                        </div>
                    }
                />

                <main className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column - Profile Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 lg:p-8 sticky top-8 transition-all duration-300 hover:shadow-xl dark:hover:shadow-indigo-500/10 border-gray-200 dark:border-slate-800 shadow-sm glass-effect" glass-effect="true">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative group/avatar mb-4">
                                            <div className="relative">
                                                <div className="w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full flex items-center justify-center shadow-inner border-blue-100 dark:border-indigo-900/50">
                                                    <UserCircleIcon className="w-20 h-20 text-blue-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-indigo-600 dark:to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                                                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h2>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 break-all px-4">{user.email}</p>
                                            <div className="mt-4">
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-blue-800 dark:text-indigo-300 border-blue-200 dark:border-indigo-800/50 shadow-sm">
                                                    <div className="w-2 h-2 bg-blue-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-blue-900 dark:text-indigo-300">∞</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Active</div>
                                            </div>
                                            <div className="text-center p-3 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                                                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">24/7</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">Availability</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Edit Button */}
                                    <div className="hidden lg:block mt-8 pt-6 border-t border-gray-200 w-full">
                                        <button
                                            onClick={() => setIsEditProfileModalOpen(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Details and Actions */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Mobile Navigation Tabs */}
                                <div className="lg:hidden mb-6">
                                    <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-slate-900 p-1">
                                        <button
                                            onClick={() => setActiveTab('info')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'info'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <UserCircleIcon className="w-4 h-4" />
                                                <span>Info</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'orders'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <HiOutlineShoppingBag className="w-4 h-4" />
                                                <span>Orders</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('security')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'security'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <KeyIcon className="w-4 h-4" />
                                                <span>Security</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('app')}
                                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'app'
                                                ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 shadow-sm'
                                                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <DevicePhoneMobileIcon className="w-4 h-4" />
                                                <span>App</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div className={`${activeTab === 'info' ? 'block' : 'hidden lg:block'}`}>
                                    <InfoCard
                                        title="Personal Information"
                                        icon={<UserCircleIcon className="w-5 h-5" />}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-blue-100 dark:border-indigo-800/50">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                                                    <p className="mt-2 text-lg text-gray-900 dark:text-slate-100 font-bold">{user.name}</p>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-emerald-100 dark:border-emerald-800/50">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Account Status</label>
                                                    <p className="mt-2">
                                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50">
                                                            <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                                                            Active Session
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-purple-100 dark:border-purple-800/50">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                                                    <p className="mt-2 text-lg text-gray-900 dark:text-slate-100 font-bold break-all">{user.email}</p>
                                                </div>
                                                <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-amber-100 dark:border-amber-800/50">
                                                    <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Account Role</label>
                                                    <p className="mt-2 text-lg text-gray-900 dark:text-slate-100 font-bold">
                                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoCard>
                                </div>

                                {/* Order History */}
                                <div className={`${activeTab === 'orders' ? 'block' : 'hidden lg:block'}`}>
                                    <InfoCard
                                        title="Order History"
                                        icon={<HiOutlineShoppingBag className="w-5 h-5" />}
                                    >
                                        <div className="space-y-4">
                                            {isLoadingOrders ? (
                                                <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading orders...</div>
                                            ) : orders.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <HiOutlineShoppingBag className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                                                    </div>
                                                    <p className="text-gray-500 dark:text-slate-400">No recent orders found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {orders.map((order: Sale) => (
                                                        <button
                                                            key={order.transactionId}
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="w-full text-left p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all group flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 flex items-center justify-center font-bold text-xs group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:shadow-sm transition-all">
                                                                    #{order.transactionId.slice(-4)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-900 dark:text-slate-100">{formatCurrency(order.total, storeSettings)}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                                        {new Date(order.timestamp).toLocaleDateString()} • {order.cart.length} items
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.fulfillmentStatus === 'fulfilled' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' :
                                                                    order.fulfillmentStatus === 'shipped' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50' :
                                                                        order.fulfillmentStatus === 'cancelled' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50' :
                                                                            'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                                                    }`}>
                                                                    {order.fulfillmentStatus || 'Pending'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </InfoCard>
                                </div>

                                {/* Install App Section */}
                                <div className={`${activeTab === 'app' ? 'block' : 'hidden lg:block'}`}>
                                    <InfoCard
                                        title="Install Application"
                                        icon={<DevicePhoneMobileIcon className="w-5 h-5" />

                                        }
                                    >
                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-xl border-blue-100 dark:border-indigo-800/50">

                                                <div className="flex-1">
                                                    <p className="text-base font-bold text-gray-900 dark:text-slate-100 mb-2">
                                                        {isStandalone
                                                            ? "🎉 App is Installed"
                                                            : "📱 Get the Native App Experience"}
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
                                            </div>

                                            {!isStandalone && (
                                                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                                                    <div className="p-5 border-b border-gray-200 dark:border-slate-800">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                                            <span className="w-2 h-2 bg-blue-500 dark:bg-indigo-400 rounded-full"></span>
                                                            Installation Guide
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {isIOS ? (
                                                                <>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">1</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Open in Safari and tap the Share button</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">2</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Select "Add to Home Screen" option</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">3</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Tap "Add" to complete installation</span>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">1</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Look for the install icon in browser address bar</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">2</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Or use browser menu → "Install App" / "Add to Home Screen"</span>
                                                                    </li>
                                                                    <li className="flex items-start gap-3 group">
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-purple-900 text-blue-800 dark:text-indigo-300 text-xs font-bold shadow-sm mt-0.5">3</span>
                                                                        <span className="pt-0.5 text-sm text-gray-700 dark:text-slate-300">Confirm installation when prompted</span>
                                                                    </li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div className="p-5">
                                                        <button
                                                            onClick={() => {
                                                                if (installPrompt) {
                                                                    onInstall();
                                                                } else {
                                                                    if (isStandalone) {
                                                                        alert('The app is already installed and running in standalone mode.');
                                                                    } else if (isIOS) {
                                                                        alert('To install this app on iOS:\n\n1. Open this site in Safari\n2. Tap the Share button\n3. Scroll down and tap "Add to Home Screen"\n4. Tap "Add" in the top right corner');
                                                                    } else {
                                                                        alert('Install prompt is not available yet. Try visiting a few pages and then return here, or use your browser menu: Install App/Add to Home Screen.');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-slate-700 dark:to-slate-800 text-white text-sm font-bold rounded-lg hover:from-gray-800 hover:to-gray-900 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                                            {isStandalone ? "Installed ✓" : "Install App Now"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </InfoCard>
                                </div>

                                {/* Security & Account Actions */}
                                <div className={`${activeTab === 'security' ? 'block' : 'hidden lg:block'}`}>
                                    <InfoCard
                                        title="Security & Account"
                                        icon={<KeyIcon className="w-5 h-5" />}
                                    >
                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-0">
                                                <button
                                                    onClick={() => setIsChangePasswordModalOpen(true)}
                                                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-300 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-slate-100">Change Password</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">Update your login credentials securely</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300">→</span>
                                                </button>
                                            </div>

                                            {/* Logout Section */}
                                            <div className="bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-100 dark:border-red-900/50 p-5">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                                    <ArrowLeftOnRectangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                    Session Management
                                                </h4>
                                                <div className="space-y-3">
                                                    <p className="text-sm text-gray-600 dark:text-slate-400">
                                                        You will be signed out from all devices. This action cannot be undone.
                                                    </p>
                                                    <button
                                                        onClick={onLogout}
                                                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600 dark:to-red-800 text-white text-sm font-bold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                                    >
                                                        <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                                        Sign Out Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </InfoCard>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Mobile Menu Popup (simplified) */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="absolute inset-0 bg-black/50 dark:bg-black/70 animate-fade-in" />
                        <div
                            className="absolute top-[70px] right-4 left-auto w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border-gray-200 dark:border-slate-800 p-3"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'info', icon: UserCircleIcon, label: 'Info' },
                                    { id: 'orders', icon: HiOutlineShoppingBag, label: 'Orders' },
                                    { id: 'security', icon: KeyIcon, label: 'Security' },
                                    { id: 'app', icon: DevicePhoneMobileIcon, label: 'App' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id as any);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-indigo-600 dark:to-purple-600 text-white shadow-lg'
                                            : 'bg-gray-50 dark:bg-slate-800/50 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <item.icon className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                                <button
                                    onClick={() => {
                                        setIsEditProfileModalOpen(true);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-blue-700 dark:text-indigo-300 rounded-lg font-semibold hover:from-blue-100 hover:to-indigo-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

export default ProfilePage;