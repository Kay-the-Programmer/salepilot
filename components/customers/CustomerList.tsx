import React from 'react';
import { Customer } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import UnifiedListGrid from '../ui/UnifiedListGrid';

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

// Customer Grid Card Component
const CustomerGridCard: React.FC<{
    customer: Customer;
    isSelected: boolean;
    canManage: boolean;
    onEdit: (customer: Customer) => void;
}> = ({ customer, isSelected, canManage, onEdit }) => (
    <div
        className={`group bg-white rounded-2xl p-4 border shadow-sm transition-all duration-300 ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02]'
                : 'border-gray-100 hover:shadow-lg hover:border-blue-100'
            }`}
    >
        {/* Avatar */}
        <div className="flex justify-center mb-3">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold border-2 ${isSelected
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                {getInitials(customer.name)}
            </div>
        </div>

        {/* Name */}
        <h3 className={`text-sm font-semibold text-center truncate mb-1 transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
            }`}>
            {customer.name}
        </h3>

        {/* Contact Info */}
        <div className="space-y-1 mt-2">
            {customer.email && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 truncate">
                    <EnvelopeIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                </div>
            )}
            {customer.phone && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <PhoneIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span>{customer.phone}</span>
                </div>
            )}
        </div>

        {/* Edit Button */}
        {canManage && (
            <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(customer);
                    }}
                    className="w-full py-2 text-xs font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Edit
                </button>
            </div>
        )}
    </div>
);

// Customer List Row Component
const CustomerListRow: React.FC<{
    customer: Customer;
    isSelected: boolean;
    canManage: boolean;
    onEdit: (customer: Customer) => void;
}> = ({ customer, isSelected, canManage, onEdit }) => (
    <div
        className={`group bg-white rounded-lg p-3 border transition-all cursor-pointer relative ${isSelected
                ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
            }`}
    >
        {/* Selected Indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-lg transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`} />

        <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium border ${isSelected
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {getInitials(customer.name)}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                        {customer.name}
                    </h3>
                    {canManage && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(customer);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit"
                        >
                            <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-0.5">
                    {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                            <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                            {customer.email}
                        </div>
                    )}
                    {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <PhoneIcon className="w-3 h-3 text-gray-400" />
                            {customer.phone}
                        </div>
                    )}
                </div>
            </div>
        </div>
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
                <CustomerGridCard
                    customer={customer}
                    isSelected={isSelected}
                    canManage={canManage}
                    onEdit={onEdit}
                />
            )}
            renderListItem={(customer, _index, isSelected) => (
                <CustomerListRow
                    customer={customer}
                    isSelected={isSelected}
                    canManage={canManage}
                    onEdit={onEdit}
                />
            )}
            gridColumns={{ minWidth: '200px' }}
            className="!p-0"
        />
    );
};

export default CustomerList;
