import React, { useState, useMemo, useEffect } from 'react';
import CustomerList from '../components/customers/CustomerList';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import CustomerDetailView from '../components/customers/CustomerDetailView';
import { api } from '../services/api';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import SearchIcon from '../components/icons/SearchIcon';
import { Customer, Sale, StoreSettings, User } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import ListGridToggle from '../components/ui/ListGridToggle';



// Mobile-optimized Header Component (simplified inline version)
const MobileHeader = ({
    title,
    onBack,
    showBack = true,
    rightAction = null
}: {
    title: string;
    onBack?: () => void;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}) => (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-sm no-pull-to-refresh">
        <div className="px-4">
            <div className="flex items-center h-16">
                {showBack && onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-xl h-10 w-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-all text-gray-500 dark:text-gray-400 active:scale-95"
                        aria-label="Go back"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <div className="flex-1 ml-2">
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">{title}</h1>
                </div>
                {rightAction}
            </div>
        </div>
    </header>
);



// Responsive Empty State
const EmptyState = ({
    message,
    actionLabel,
    onAction
}: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) => (
    <div className="text-center py-12 px-4">
        <div className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        </div>
        <p className="text-gray-500 dark:text-slate-400 mb-4">{message}</p>
        {actionLabel && onAction && (
            <button
                onClick={onAction}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-all duration-300"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {actionLabel}
            </button>
        )}
    </div>
);

// Loading Spinner
const LoadingSpinner = ({
    size = 'medium',
    message = 'Loading...'
}: {
    size?: 'small' | 'medium' | 'large';
    message?: string;
}) => {
    const sizeClasses = {
        small: 'h-8 w-8 border-2',
        medium: 'h-12 w-12 border-b-2',
        large: 'h-16 w-16 border-b-2'
    };

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-500 mb-4`}></div>
            <p className="text-gray-500 dark:text-slate-400">{message}</p>
        </div>
    );
};

// Error Display
const ErrorDisplay = ({
    error,
    onRetry
}: {
    error: string;
    onRetry?: () => void;
}) => (
    <div className="rounded-xl bg-red-50 dark:bg-red-900/10 p-4 my-4 border border-red-100 dark:border-red-900/20">
        <div className="flex">
            <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">Error</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300/80">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-2 text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                        Try again
                    </button>
                )}
            </div>
        </div>
    </div>
);

interface CustomersPageProps {
    customers: Customer[];
    sales: Sale[];
    onSaveCustomer: (customer: Customer) => void;
    onDeleteCustomer: (customerId: string) => void;
    isLoading: boolean;
    error: string | null;
    storeSettings: StoreSettings;
    currentUser: User;
}

const CustomersPage: React.FC<CustomersPageProps> = ({
    customers,
    sales,
    onSaveCustomer,
    onDeleteCustomer,
    isLoading,
    error,
    storeSettings,
    currentUser,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'recent' | 'az'>('all');
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

    const [detailedCustomer, setDetailedCustomer] = useState<Customer | null>(null);
    const [detailIsLoading, setDetailIsLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [listViewMode, setListViewMode] = useState<'grid' | 'list'>('list');



    const confirmDelete = () => {
        if (customerToDelete) {
            onDeleteCustomer(customerToDelete);
            setCustomerToDelete(null);
        }
    };

    const canManageCustomers = currentUser.role === 'admin';

    // Removing manual useMediaQuery dependencies where possible:
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
    const [isLargeDesktop, setIsLargeDesktop] = useState(window.innerWidth >= 1280);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            setIsDesktop(width > 1024);
            setIsLargeDesktop(width >= 1280);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedCustomerId) {
            const fetchCustomer = async () => {
                setDetailIsLoading(true);
                setDetailError(null);
                try {
                    const customer = await api.get<Customer>(`/customers/${selectedCustomerId}`);
                    setDetailedCustomer(customer);
                } catch (err: any) {
                    setDetailError(err.message || 'Failed to load customer details');
                } finally {
                    setDetailIsLoading(false);
                }
            };
            fetchCustomer();
        } else {
            setDetailedCustomer(null);
        }
    }, [selectedCustomerId]);



    const handleOpenAddModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSave = (customer: Customer) => {
        onSaveCustomer(customer);
        if (detailedCustomer && detailedCustomer.id === customer.id) {
            setDetailedCustomer(customer);
        }
        handleCloseModal();
    };

    const handleSelectCustomer = (customerId: string) => {
        setSelectedCustomerId(customerId);
    };

    const handleBackToList = () => {
        setSelectedCustomerId(null);
    };



    const filteredCustomers = useMemo(() => {
        let result = customers.filter(customer => {
            if (searchTerm.trim() === '') return true;
            const term = searchTerm.toLowerCase();
            return (
                customer.name.toLowerCase().includes(term) ||
                (customer.email && customer.email.toLowerCase().includes(term)) ||
                (customer.phone && customer.phone.includes(term))
            );
        });

        if (viewMode === 'recent') {
            // Assuming higher ID is newer or we just reverse original list if it's chronological
            return [...result].reverse();
        } else if (viewMode === 'az') {
            return [...result].sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [customers, searchTerm, viewMode]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, viewMode]);

    const paginatedCustomers = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, page, pageSize]);

    const customerSales = useMemo(() =>
        sales.filter(s => s.customerId === selectedCustomerId),
        [sales, selectedCustomerId]
    );

    // Desktop Layout - Split View
    if (isDesktop && selectedCustomerId) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
                {/* Desktop Header - Minimal */}
                <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h1>
                        <span className="text-gray-300 dark:text-slate-700">|</span>
                        <span className="text-sm text-gray-500 dark:text-slate-400">{filteredCustomers.length} Total</span>
                    </div>

                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <input
                            type="text"
                            placeholder="Global Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 text-sm transition-all dark:text-slate-200"
                        />
                    </div>
                </header>

                {/* Split View */}
                <main className="flex flex-1 overflow-hidden">
                    {/* Left Panel - Customer List */}
                    <div className={`${isLargeDesktop ? 'w-[360px]' : 'w-[320px]'} flex-shrink-0 border-r border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 flex flex-col`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Directory</h2>
                                {canManageCustomers && (
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm active:scale-95 transition-all duration-300"
                                        title="Add New Customer"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Filter list..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-slate-200 shadow-sm"
                                />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                            </div>

                            <div className="flex justify-between items-center">
                                <ListGridToggle
                                    viewMode={listViewMode}
                                    onViewModeChange={setListViewMode}
                                    size="sm"
                                />
                                <button
                                    onClick={() => setViewMode(viewMode === 'az' ? 'recent' : 'az')}
                                    className="text-xs text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                                >
                                    <span>{viewMode === 'az' ? 'Sorted A-Z' : 'Sorted Recently'}</span>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto desktop-scrollbar p-3">
                            <CustomerList
                                customers={paginatedCustomers}
                                onSelectCustomer={handleSelectCustomer}
                                onEdit={handleOpenEditModal}
                                isLoading={isLoading}
                                error={error}
                                canManage={canManageCustomers}
                                viewMode={listViewMode}
                                selectedCustomerId={selectedCustomerId}
                            />
                        </div>
                        <div className="flex-none p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <Pagination
                                total={filteredCustomers.length}
                                page={page}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                label="customers"
                                compact={true}
                                className="!shadow-none !p-0 !border-none !bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Panel - Customer Detail */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 custom-scrollbar">
                        <div className="sticky top-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-100/50 dark:border-blue-500/20 shadow-sm">
                                        {detailedCustomer ? detailedCustomer.name.substring(0, 2).toUpperCase() : '??'}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            {detailIsLoading ? 'Loading...' : detailedCustomer?.name}
                                        </h1>
                                        {detailedCustomer && (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400">Customer</span>
                                                <span className="text-sm text-gray-400 dark:text-slate-600">•</span>
                                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">ID: {detailedCustomer.id.substring(0, 8)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {detailedCustomer && canManageCustomers && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleOpenEditModal(detailedCustomer)}
                                            className="inline-flex items-center px-4 py-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 duration-300"
                                        >
                                            <PencilIcon className="w-4 h-4 mr-2 text-gray-500 dark:text-slate-400" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => detailedCustomer && setCustomerToDelete(detailedCustomer.id)}
                                            className="inline-flex items-center px-4 py-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shadow-sm active:scale-95 duration-300"
                                        >
                                            <TrashIcon className="w-4 h-4 mr-2 pointer-events-none" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 max-w-5xl mx-auto">
                            {detailIsLoading ? (
                                <LoadingSpinner message="Loading customer details..." />
                            ) : detailError ? (
                                <ErrorDisplay error={detailError} />
                            ) : detailedCustomer ? (
                                <CustomerDetailView
                                    customer={detailedCustomer}
                                    sales={customerSales}
                                    storeSettings={storeSettings}
                                />
                            ) : null}
                        </div>
                    </div>
                </main>

                {canManageCustomers && isModalOpen && (
                    <CustomerFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        customerToEdit={editingCustomer}
                    />
                )}

                <ConfirmationModal
                    isOpen={!!customerToDelete}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Delete Customer"
                    message="Are you sure you want to delete this customer? This action cannot be undone."
                    confirmText="Delete Customer"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
                />
            </div>
        );
    }

    // Mobile/Tablet - Detail View
    if (selectedCustomerId) {
        return (
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
                <MobileHeader
                    title={detailedCustomer?.name || 'Customer Details'}
                    onBack={handleBackToList}
                    rightAction={detailedCustomer && canManageCustomers && (
                        <button
                            onClick={() => handleOpenEditModal(detailedCustomer)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-all active:scale-95 duration-300"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            aria-label="Edit customer"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                />

                <main
                    className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 smooth-scroll safe-area-padding safe-area-bottom"
                >
                    <div className="p-4">
                        {detailIsLoading ? (
                            <LoadingSpinner message="Loading customer details..." />
                        ) : detailError ? (
                            <ErrorDisplay error={detailError} />
                        ) : detailedCustomer ? (
                            <CustomerDetailView
                                customer={detailedCustomer}
                                sales={customerSales}
                                storeSettings={storeSettings}
                            />
                        ) : null}
                    </div>
                </main>

                {/* Mobile Bottom Action - Primary */}
                {isMobile && detailedCustomer && canManageCustomers && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/10 p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] flex items-center gap-2">
                        <button
                            onClick={() => handleOpenEditModal(detailedCustomer)}
                            className="flex-1 py-4 px-4 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 duration-300"
                        >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => detailedCustomer && setCustomerToDelete(detailedCustomer.id)}
                            className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95 duration-300 border border-red-100/50 dark:border-red-500/20"
                            aria-label="Delete Customer"
                        >
                            <TrashIcon className="w-5 h-5 pointer-events-none" />
                        </button>
                    </div>
                )}

                {canManageCustomers && isModalOpen && (
                    <CustomerFormModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSave}
                        customerToEdit={editingCustomer}
                    />
                )}

                <ConfirmationModal
                    isOpen={!!customerToDelete}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Delete Customer"
                    message="Are you sure you want to delete this customer? This action cannot be undone."
                    confirmText="Delete Customer"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
                />
            </div>
        );
    }

    // Mobile/Tablet - List View
    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950">
            {/* Mobile/Tablet Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 shadow-sm no-pull-to-refresh">
                <div className="px-4">
                    <div className="flex items-center h-14 justify-between">
                        {isMobile && isMobileSearchOpen ? (
                            <div className="flex items-center w-full animate-fade-in gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search customers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-slate-200 transition-all outline-none shadow-sm"
                                    />
                                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsMobileSearchOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 font-medium text-sm whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Customers</h1>
                                    {!isMobile && (
                                        <p className="ml-3 text-sm text-gray-500 dark:text-slate-400 border-l border-gray-200 dark:border-slate-800 pl-3">
                                            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 relative">
                                    {/* List/Grid Toggle */}
                                    <ListGridToggle
                                        viewMode={listViewMode}
                                        onViewModeChange={setListViewMode}
                                        size="sm"
                                    />
                                    {/* View Options Button (Mobile) */}
                                    {isMobile && (
                                        <>
                                            <button
                                                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                                                className={`p-2.5 rounded-xl transition-colors ${isViewMenuOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 text-gray-600 dark:text-slate-400'}`}
                                                aria-label="View options"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                            </button>

                                            {/* Popup Menu */}
                                            {isViewMenuOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setIsViewMenuOpen(false)}
                                                    />
                                                    <div className="absolute top-12 right-12 z-50 w-48 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-lg py-2 animate-fade-in-up origin-top-right">
                                                        <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10">
                                                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sort Customers</span>
                                                        </div>
                                                        <button
                                                            onClick={() => { setViewMode('all'); setIsViewMenuOpen(false); }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${viewMode === 'all' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                            </svg>
                                                            Default View
                                                        </button>
                                                        <button
                                                            onClick={() => { setViewMode('az'); setIsViewMenuOpen(false); }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${viewMode === 'az' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                            </svg>
                                                            Name (A-Z)
                                                        </button>
                                                        <button
                                                            onClick={() => { setViewMode('recent'); setIsViewMenuOpen(false); }}
                                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium flex items-center gap-2 ${viewMode === 'recent' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                                        >
                                                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Recently Added
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {/* Search Icon Button */}
                                    <button
                                        onClick={() => setIsMobileSearchOpen(true)}
                                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 text-gray-600 dark:text-slate-400 transition-colors active:scale-95 transition-all duration-300"
                                        aria-label="Search"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>

                                    {/* Add Customer Icon Button (Mobile) */}
                                    {canManageCustomers && isMobile && (
                                        <button
                                            onClick={handleOpenAddModal}
                                            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 text-blue-600 dark:text-blue-400 transition-colors active:scale-95 transition-all duration-300"
                                            aria-label="Add Customer"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Desktop Add Button */}
                                    {canManageCustomers && !isMobile && (
                                        <button
                                            onClick={handleOpenAddModal}
                                            className="ml-2 inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-all duration-300"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Customer
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main
                className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 smooth-scroll safe-area-padding safe-area-bottom"
            >
                <div className="p-4">
                    {!isLoading && filteredCustomers.length > 0 && searchTerm && (
                        <div className="mb-4 text-sm text-gray-500">
                            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} for "{searchTerm}"
                        </div>
                    )}

                    {isLoading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorDisplay error={error} />
                    ) : filteredCustomers.length === 0 ? (
                        <EmptyState
                            message={searchTerm ? `No customers found for "${searchTerm}"` : "No customers yet"}
                            actionLabel={searchTerm ? "Clear search" : "Add first customer"}
                            onAction={searchTerm ? () => setSearchTerm('') : handleOpenAddModal}
                        />
                    ) : (
                        <>
                            <CustomerList
                                customers={paginatedCustomers}
                                onSelectCustomer={handleSelectCustomer}
                                onEdit={handleOpenEditModal}
                                isLoading={isLoading}
                                error={error}
                                canManage={canManageCustomers}
                                viewMode={listViewMode}
                                selectedCustomerId={selectedCustomerId}
                            />
                            <div className="mt-6">
                                <Pagination
                                    total={filteredCustomers.length}
                                    page={page}
                                    pageSize={pageSize}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                    label="customers"
                                    className="!bg-transparent !p-0 !border-none !shadow-none"
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>



            {canManageCustomers && isModalOpen && (
                <CustomerFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    customerToEdit={editingCustomer}
                />
            )}

            <ConfirmationModal
                isOpen={!!customerToDelete}
                onClose={() => setCustomerToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action cannot be undone."
                confirmText="Delete Customer"
                confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
            />
        </div>
    );
};

export default CustomersPage;