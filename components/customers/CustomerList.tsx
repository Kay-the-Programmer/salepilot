import React from 'react';
import { Customer } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import UnifiedListGrid from '../ui/UnifiedListGrid';
import { StandardCard, StandardRow } from '../ui/standard';

interface CustomerListProps {
    customers: Customer[];
    onSelectCustomer: (customerId: string) => void;
    onEdit: (customer: Customer) => void;
    isLoading: boolean;
    error: string | null;
    canManage: boolean;
    viewMode?: 'grid' | 'list';
    selectedCustomerId?: string | null;
}

// Helper to get customer initials
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Reusable Avatar Component
const CustomerAvatar = ({ name, isSelected, size = 'default' }: { name: string, isSelected?: boolean, size?: 'default' | 'large' }) => (
    <div className={`${size === 'large' ? 'h-24 w-24 text-2xl' : 'h-10 w-10 text-sm'} rounded-full flex items-center justify-center font-bold border-2 transition-colors ${isSelected
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
        : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700'
        }`}>
        {getInitials(name)}
    </div>
);

const CustomerList: React.FC<CustomerListProps> = ({
    customers,
    onSelectCustomer,
    onEdit,
    isLoading,
    error,
    canManage,
    viewMode = 'list',
    selectedCustomerId = null
}) => {
    return (
        <UnifiedListGrid<Customer>
            items={customers}
            viewMode={viewMode}
            isLoading={isLoading}
            error={error}
            emptyMessage="No customers found."
            selectedId={selectedCustomerId}
            getItemId={(customer) => customer.id}
            onItemClick={(customer) => onSelectCustomer(customer.id)}
            renderGridItem={(customer, _index, isSelected) => (
                <StandardCard
                    title={customer.name}
                    subtitle="Customer"
                    isSelected={isSelected}
                    onClick={() => onSelectCustomer(customer.id)}
                    image={
                        <CustomerAvatar name={customer.name} isSelected={isSelected} size="large" />
                    }
                    secondaryInfo={
                        <div className="flex flex-col gap-1 mt-1">
                            {customer.email && (
                                <div className="flex items-center justify-center gap-1 text-xs truncate">
                                    <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                                    {customer.email}
                                </div>
                            )}
                            {customer.phone && (
                                <div className="flex items-center justify-center gap-1 text-xs truncate">
                                    <PhoneIcon className="w-3 h-3 text-gray-400" />
                                    {customer.phone}
                                </div>
                            )}
                        </div>
                    }
                    actions={canManage ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(customer);
                            }}
                            className="bg-gray-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold active:scale-95 transition-all duration-300"
                        >
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                        </button>
                    ) : undefined}
                />
            )}
            renderListItem={(customer, _index, isSelected) => (
                <StandardRow
                    title={customer.name}
                    isSelected={isSelected}
                    onClick={() => onSelectCustomer(customer.id)}
                    leading={<CustomerAvatar name={customer.name} isSelected={isSelected} />}
                    details={[
                        customer.email ? (
                            <div className="flex items-center gap-1 truncate" key="email">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate max-w-[150px]">{customer.email}</span>
                            </div>
                        ) : null,
                        customer.phone ? (
                            <div className="flex items-center gap-1" key="phone">
                                <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                                {customer.phone}
                            </div>
                        ) : null
                    ]}
                    actions={canManage ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(customer);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors active:scale-95 transition-all duration-300"
                            title="Edit"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                    ) : undefined}
                />
            )}
            gridColumns={{ minWidth: '200px' }}
            className="!p-0"
        />
    );
};

export default CustomerList;
