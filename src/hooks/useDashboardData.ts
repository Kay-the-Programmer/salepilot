import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Product, Category, Customer, Supplier, Sale, PurchaseOrder, Account, JournalEntry, SupplierInvoice, User, StoreSettings, Return, AuditLog, Announcement, StockTakeSession } from '../../types';
import { getCurrentUser } from '../../services/authService';

// Helper to get current store ID
const useCurrentStoreId = () => {
    const user = getCurrentUser();
    return user?.currentStoreId;
};

// --- Products ---
export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: () => api.get<Product[]>('/products'),
        initialData: [],
    });
};

// --- Categories ---
export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.get<Category[]>('/categories'),
        initialData: [],
    });
};

// --- Customers ---
export const useCustomers = () => {
    return useQuery({
        queryKey: ['customers'],
        queryFn: () => api.get<Customer[]>('/customers'),
        initialData: [],
    });
};

// --- Suppliers ---
export const useSuppliers = () => {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: () => api.get<Supplier[]>('/suppliers'),
        initialData: [],
    });
};

// --- Sales ---
export const useSales = () => {
    return useQuery({
        queryKey: ['sales'],
        queryFn: () => api.get<Sale[]>('/sales'),
        initialData: [],
    });
};

// --- Purchase Orders ---
export const usePurchaseOrders = () => {
    return useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: () => api.get<PurchaseOrder[]>('/purchase-orders'),
        initialData: [],
    });
};

// --- Accounts ---
export const useAccounts = () => {
    return useQuery({
        queryKey: ['accounts'],
        queryFn: () => api.get<Account[]>('/accounting/accounts'),
        initialData: [],
    });
};

// --- Journal Entries ---
export const useJournalEntries = () => {
    return useQuery({
        queryKey: ['journalEntries'],
        queryFn: () => api.get<JournalEntry[]>('/accounting/journal-entries'),
        initialData: [],
    });
};

// --- Supplier Invoices ---
export const useSupplierInvoices = () => {
    return useQuery({
        queryKey: ['supplierInvoices'],
        queryFn: () => api.get<SupplierInvoice[]>('/accounting/supplier-invoices'),
        initialData: [],
    });
};

// --- Users ---
export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: () => api.get<User[]>('/users'),
        initialData: [],
    });
};

// --- Store Settings ---
export const useStoreSettings = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: () => api.get<StoreSettings>('/settings'),
        // Don't provide initialData for object/null types effectively unless we have a default object
    });
};

// --- Returns ---
export const useReturns = () => {
    return useQuery({
        queryKey: ['returns'],
        queryFn: () => api.get<Return[]>('/returns'),
        initialData: [],
    });
};

// --- Audit Logs ---
export const useAuditLogs = () => {
    return useQuery({
        queryKey: ['auditLogs'],
        queryFn: () => api.get<AuditLog[]>('/audit'),
        initialData: [],
    });
};

// --- Stock Take Session ---
export const useStockTakeSession = () => {
    return useQuery({
        queryKey: ['stockTakeSession'],
        queryFn: () => api.get<StockTakeSession | null>('/stock-takes/active'),
    });
};

// --- Announcements ---
export const useAnnouncements = () => {
    const storeId = useCurrentStoreId();
    return useQuery({
        queryKey: ['announcements', storeId],
        queryFn: () => storeId ? api.get<Announcement[]>(`/notifications/stores/${storeId}`) : Promise.resolve([]),
        enabled: !!storeId,
        initialData: [],
        refetchInterval: 30000, // Replacing the polling useEffect
    });
};

// --- Pending Matches ---
export const usePendingMatches = () => {
    const storeId = useCurrentStoreId();
    return useQuery({
        queryKey: ['pendingMatches', storeId],
        queryFn: () => storeId ? api.get<any[]>(`/marketplace/stores/${storeId}/matches`) : Promise.resolve([]),
        enabled: !!storeId,
        initialData: [],
    });
};
