
import React from 'react';
import { Supplier } from '../../types';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';

interface SupplierListProps {
    suppliers: Supplier[];
    onSelectSupplier: (supplierId: string) => void;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
    isLoading: boolean;
    error: string | null;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onSelectSupplier, onEdit, onDelete, isLoading, error }) => {

    if (isLoading) {
        return <div className="text-center p-10">Loading suppliers...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }

    if (suppliers.length === 0) {
        return <div className="text-center p-10 text-gray-500">No suppliers found. Add a new supplier to get started.</div>;
    }

    return (
        <div className="px-4 sm:px-4 lg:px-4 py-4">
            <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Supplier Name</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Person</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact Info</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {suppliers.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSelectSupplier(supplier.id)}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {supplier.name}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {supplier.contactPerson || 'N/A'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div>{supplier.email || 'No email'}</div>
                                                <div className="text-gray-400">{supplier.phone || 'No phone'}</div>
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="flex items-center justify-end space-x-4" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => onEdit(supplier)} className="text-blue-600 hover:text-blue-900" title="Edit Supplier">
                                                        <PencilIcon className="w-5 h-5"/>
                                                    </button>
                                                    <button onClick={() => onDelete(supplier.id)} className="text-red-600 hover:text-red-900" title="Delete Supplier">
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
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

export default SupplierList;
