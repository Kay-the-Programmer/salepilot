import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sale, StoreSettings, User } from '../types';
import Header from '../components/Header';
import CustomerList from '../components/customers/CustomerList';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import CustomerDetailView from '../components/customers/CustomerDetailView';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { api } from '../services/api';

// Inline CSS for mobile responsiveness
const styles = `
  /* Safe area insets for modern mobile browsers */
  .safe-area-padding {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  /* Better touch interactions */
  .touch-manipulation {
    touch-action: manipulation;
  }
  
  /* Prevent pull-to-refresh on non-scrollable areas */
  .no-pull-to-refresh {
    overscroll-behavior-y: none;
  }
  
  /* Smooth scrolling for iOS */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
  }
  
  /* Mobile-optimized transitions */
  .mobile-transition {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Desktop hover effects */
  @media (min-width: 769px) {
    .desktop-hover:hover {
      background-color: rgba(243, 244, 246, 1);
    }
  }
  
  /* Mobile tap targets */
  @media (max-width: 768px) {
    .mobile-tap-target {
      min-height: 44px;
      min-width: 44px;
    }
  }
  
  /* Custom scrollbar for desktop */
  @media (min-width: 769px) {
    .desktop-scrollbar::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .desktop-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .desktop-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .desktop-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
  }
  
  /* Glass effect for mobile modals */
  .mobile-modal-backdrop {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
`;

// Custom media query hook
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    const updateMatches = () => {
      setMatches(media.matches);
    };
    
    updateMatches();
    
    const listener = () => updateMatches();
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

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
  <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm no-pull-to-refresh">
    <div className="px-4">
      <div className="flex items-center h-14">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation mobile-tap-target"
            aria-label="Go back"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex-1 ml-2 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        </div>
        {rightAction}
      </div>
    </div>
  </header>
);

// Floating Action Button for Mobile
const FloatingActionButton = ({ 
  onClick, 
  icon, 
  label 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 active:scale-95 transition-all duration-200 flex items-center justify-center touch-manipulation"
    aria-label={label}
    style={{ 
      WebkitTapHighlightColor: 'transparent',
      marginBottom: 'env(safe-area-inset-bottom, 0px)'
    }}
  >
    {icon}
  </button>
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
    <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
    <p className="text-gray-500 mb-4">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation mobile-tap-target"
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
      <p className="text-gray-500">{message}</p>
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
  <div className="rounded-xl bg-red-50 p-4 my-4">
    <div className="flex">
      <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <div className="ml-3">
        <p className="text-sm font-medium text-red-800">Error</p>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [detailedCustomer, setDetailedCustomer] = useState<Customer | null>(null);
    const [detailIsLoading, setDetailIsLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const canManageCustomers = currentUser.role === 'admin';
    
    // Responsive breakpoints
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const isDesktop = !isMobile && !isTablet;
    const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

    useEffect(() => {
        // Add styles to document head
        const styleElement = document.createElement('style');
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);

        return () => {
            document.head.removeChild(styleElement);
        };
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

    useEffect(() => {
        if (isMobile && selectedCustomerId) {
            setIsSidebarOpen(false);
        }
    }, [selectedCustomerId, isMobile]);

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
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    const handleBackToList = () => {
        setSelectedCustomerId(null);
        if (isMobile) {
            setIsSidebarOpen(true);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    
    const filteredCustomers = useMemo(() => customers.filter(customer => {
        if (searchTerm.trim() === '') return true;
        const term = searchTerm.toLowerCase();
        return (
            customer.name.toLowerCase().includes(term) ||
            (customer.email && customer.email.toLowerCase().includes(term)) ||
            (customer.phone && customer.phone.includes(term))
        );
    }), [customers, searchTerm]);

    const customerSales = useMemo(() => 
        sales.filter(s => s.customerId === selectedCustomerId),
        [sales, selectedCustomerId]
    );

    // Desktop Layout - Split View
    if (isDesktop && selectedCustomerId) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <style>{styles}</style>
                
                {/* Desktop Header */}
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-6">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
                                <span className="ml-3 text-sm text-gray-500">
                                    {filteredCustomers.length} total • {detailedCustomer?.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search customers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                    />
                                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {canManageCustomers && (
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 desktop-hover"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Customer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Split View */}
                <main className="flex flex-1 overflow-hidden">
                    {/* Left Panel - Customer List */}
                    <div className={`${isLargeDesktop ? 'w-1/4' : 'w-1/3'} border-r border-gray-200 bg-white overflow-y-auto desktop-scrollbar`}>
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-900">Customer Directory</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <CustomerList
                            customers={filteredCustomers}
                            onSelectCustomer={handleSelectCustomer}
                            onEdit={handleOpenEditModal}
                            onDelete={onDeleteCustomer}
                            isLoading={isLoading}
                            error={error}
                            canManage={canManageCustomers}
                            selectedCustomerId={selectedCustomerId}
                        />
                    </div>

                    {/* Right Panel - Customer Detail */}
                    <div className="flex-1 overflow-y-auto bg-white desktop-scrollbar">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {detailIsLoading ? 'Loading...' : detailedCustomer?.name}
                                    </h1>
                                    {detailedCustomer && (
                                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Customer
                                        </span>
                                    )}
                                </div>
                                {detailedCustomer && canManageCustomers && (
                                    <button
                                        onClick={() => handleOpenEditModal(detailedCustomer)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 desktop-hover"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Customer
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {detailIsLoading ? (
                                <LoadingSpinner message="Loading customer details..." />
                            ) : detailError ? (
                                <ErrorDisplay error={detailError} />
                            ) : detailedCustomer ? (
                                <CustomerDetailView
                                    customer={detailedCustomer}
                                    sales={customerSales}
                                    onEdit={canManageCustomers ? handleOpenEditModal : undefined}
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
            </div>
        );
    }

    // Mobile/Tablet - Detail View
    if (selectedCustomerId) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <style>{styles}</style>
                
                <MobileHeader
                    title={detailedCustomer?.name || 'Customer Details'}
                    onBack={handleBackToList}
                    rightAction={detailedCustomer && canManageCustomers && (
                        <button
                            onClick={() => handleOpenEditModal(detailedCustomer)}
                            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation mobile-tap-target"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            aria-label="Edit customer"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                />
                
                <main 
                    className="flex-1 overflow-y-auto bg-gray-50 smooth-scroll safe-area-padding safe-area-bottom"
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
                                onEdit={canManageCustomers ? handleOpenEditModal : undefined}
                                storeSettings={storeSettings}
                            />
                        ) : null}
                    </div>
                </main>

                {/* Mobile Bottom Action */}
                {isMobile && detailedCustomer && canManageCustomers && (
                    <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 pt-3 pb-4 px-4 safe-area-bottom"
                        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                        <button
                            onClick={() => handleOpenEditModal(detailedCustomer)}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 shadow-md touch-manipulation mobile-tap-target"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            Edit Customer
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
            </div>
        );
    }

    // Mobile/Tablet - List View
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <style>{styles}</style>
            
            {/* Mobile/Tablet Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm no-pull-to-refresh">
                <div className="px-4">
                    <div className="flex items-center h-14">
                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                className="p-2 -ml-2 mr-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation mobile-tap-target"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                                aria-label="Menu"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">Customers</h1>
                            {!isMobile && (
                                <p className="text-sm text-gray-500">
                                    {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`${isMobile ? 'w-32' : 'w-48'} pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {canManageCustomers && !isMobile && (
                                <button
                                    onClick={handleOpenAddModal}
                                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation mobile-tap-target"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            <main 
                className="flex-1 overflow-y-auto bg-gray-50 smooth-scroll safe-area-padding safe-area-bottom"
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
                        <CustomerList
                            customers={filteredCustomers}
                            onSelectCustomer={handleSelectCustomer}
                            onEdit={handleOpenEditModal}
                            onDelete={onDeleteCustomer}
                            isLoading={false}
                            error={null}
                            canManage={canManageCustomers}
                            selectedCustomerId={selectedCustomerId}
                        />
                    )}
                </div>
            </main>
            
            {/* Floating Action Button for Mobile */}
            {isMobile && canManageCustomers && (
                <FloatingActionButton
                    onClick={handleOpenAddModal}
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }
                    label="Add customer"
                />
            )}
            
            {canManageCustomers && isModalOpen && (
                <CustomerFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    customerToEdit={editingCustomer}
                />
            )}
        </div>
    );
};

export default CustomersPage;