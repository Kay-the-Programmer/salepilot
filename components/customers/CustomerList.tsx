
import React from 'react';
import { Customer } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface CustomerListProps {
    customers: Customer[];
    onSelectCustomer: (customerId: string) => void;
    onEdit: (customer: Customer) => void;
    onDelete: (customerId: string) => void;
    isLoading: boolean;
    error: string | null;
    canManage: boolean;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, onSelectCustomer, onEdit, onDelete, isLoading, error, canManage }) => {

    if (isLoading) {
        return <div className="text-center p-10">Loading customers...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (customers.length === 0) {
        return <div className="text-center p-10 text-gray-500">No customers found. Add a new customer to get started.</div>;
    }

    return (
        <div className="px-4 sm:px-4 lg:px-4 py-8">
            <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Member Since</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectCustomer(customer.id)}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {customer.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div>{customer.email}</div>
                                                <div className="text-gray-400">{customer.phone}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                {canManage && (
                                                    <div className="flex items-center justify-end space-x-4" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => onEdit(customer)} className="text-blue-600 hover:text-blue-900" title="Edit Customer">
                                                            <PencilIcon className="w-5 h-5"/>
                                                        </button>
                                                        <button onClick={() => onDelete(customer.id)} className="text-red-600 hover:text-red-900" title="Delete Customer">
                                                            <TrashIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerList;
