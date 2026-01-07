import React from 'react';
import { Customer } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import CalendarIcon from '../icons/CalendarIcon';

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
        return <div className="text-center p-10">Loading customers...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (customers.length === 0) {
        return <div className="text-center p-10 text-gray-500">No customers found. Add a new customer to get started.</div>;
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                {customers.map((customer) => (
                    <div
                        key={customer.id}
                        onClick={() => onSelectCustomer(customer.id)}
                        className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden active:scale-[0.99]"
                    >
                        {/* Selected Indicator (Desktop) */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200">
                                    {getInitials(customer.name)}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-bold text-gray-900 truncate">
                                        {customer.name}
                                    </h3>
                                    {canManage && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => onEdit(customer)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors active:scale-90"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                    {customer.email && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 truncate">
                                            <EnvelopeIcon className="w-3.5 h-3.5 opacity-60" />
                                            {customer.email}
                                        </div>
                                    )}
                                    {customer.phone && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <PhoneIcon className="w-3.5 h-3.5 opacity-60" />
                                            {customer.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 sm:col-span-2">
                                        <CalendarIcon className="w-3 h-3 opacity-60" />
                                        Since {new Date(customer.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomerList;
