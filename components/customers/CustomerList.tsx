import React from 'react';
import { Customer } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';

interface CustomerListProps {
    customers: Customer[];
    onSelectCustomer: (customerId: string) => void;
    onEdit: (customer: Customer) => void;
    isLoading: boolean;
    error: string | null;
    canManage: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onEdit, isLoading, error, canManage }) => {

    if (isLoading) {
        return <div className="text-center p-10 text-gray-500 text-sm">Loading customers...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500 text-sm">Error: {error}</div>;
    }

    if (customers.length === 0) {
        return <div className="text-center p-10 text-gray-500 text-sm">No customers found.</div>;
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-2">
            {customers.map((customer) => (
                <div
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer.id)}
                    className="group bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer relative"
                >
                    {/* Selected Indicator - simplified */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 rounded-l-lg transition-opacity" />

                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm border border-gray-200">
                                {getInitials(customer.name)}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
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
            ))}
        </div>
    );
};

export default CustomerList;
