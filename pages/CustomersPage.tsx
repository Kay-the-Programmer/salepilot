import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Sale, StoreSettings, User } from '../types';
import Header from '../components/Header';
import CustomerList from '../components/customers/CustomerList';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import CustomerDetailView from '../components/customers/CustomerDetailView';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import { api } from '../services/api';

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

    const [detailedCustomer, setDetailedCustomer] = useState<Customer | null>(null);
    const [detailIsLoading, setDetailIsLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const canManageCustomers = currentUser.role === 'admin';

    useEffect(() => {
        if (selectedCustomerId) {
            const fetchCustomer = async () => {
                setDetailIsLoading(true);
                setDetailError(null);
                try {
                    const customer = await api.get<Customer>(`/customers/${selectedCustomerId}`);
                    setDetailedCustomer(customer);
                } catch (err: any) {
                    setDetailError(err.message);
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

    if (selectedCustomerId) {
        return (
            <div className="flex flex-col h-full">
                <header className="bg-gray-100 z-10">
                    <div className="mx-auto px-4 sm:px-4  lg:px-4">
                        <div className="flex items-center h-16">
                            <button
                                onClick={handleBackToList}
                                className="mr-4 p-2 rounded-full hover:bg-gray-100"
                                aria-label="Back to customer list"
                            >
                                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
                            </button>
                            <h1 className="text-2xl font-bold py-2 leading-7 text-gray-700 sm:truncate">
                                {detailIsLoading ? 'Loading...' : detailedCustomer?.name}
                            </h1>
                        </div>
                    </div>
                </header>
                 <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    {detailIsLoading && <div className="text-center p-10">Loading customer details...</div>}
                    {detailError && <div className="text-center p-10 text-red-500">Error: {detailError}</div>}
                    {detailedCustomer && (
                        <CustomerDetailView
                            customer={detailedCustomer}
                            sales={customerSales}
                            onEdit={canManageCustomers ? handleOpenEditModal : undefined}
                            storeSettings={storeSettings}
                        />
                    )}
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
        )
    }

    return (
        <>
            <Header
                title="Customers"
                buttonText={canManageCustomers ? "Add Customer" : undefined}
                onButtonClick={canManageCustomers ? handleOpenAddModal : undefined}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
             />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <CustomerList
                    customers={filteredCustomers}
                    onSelectCustomer={handleSelectCustomer}
                    onEdit={handleOpenEditModal}
                    onDelete={onDeleteCustomer}
                    isLoading={isLoading}
                    error={error}
                    canManage={canManageCustomers}
                />
            </main>
            {canManageCustomers && isModalOpen && (
                <CustomerFormModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                    customerToEdit={editingCustomer}
                />
            )}
        </>
    );
};

export default CustomersPage;