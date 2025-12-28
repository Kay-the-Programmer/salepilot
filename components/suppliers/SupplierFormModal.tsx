import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';

interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    supplierToEdit?: Supplier | null;
}

const getInitialState = (): Omit<Supplier, 'id'> => ({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: '',
    bankingDetails: '',
    notes: '',
});

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSave, supplierToEdit }) => {
    const [supplier, setSupplier] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (supplierToEdit) {
                setSupplier({ ...getInitialState(), ...supplierToEdit });
            } else {
                setSupplier(getInitialState());
            }
        }
    }, [supplierToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSupplier(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplier.name.trim()) {
            setError('Supplier name is required.');
            return;
        }

        const finalSupplier: Supplier = {
            ...supplier,
            id: supplierToEdit?.id || `sup_${new Date().toISOString()}`,
        };
        onSave(finalSupplier);
    };

    if (!isOpen) return null;

    const renderSectionTitle = (title: string) => <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2 border-b pb-1">{title}</h4>;


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full m-4">
                <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[95vh]">
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}
                        </h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                     <div className="px-4 sm:px-6 py-4 flex-grow overflow-y-auto">
                        {error && <div className="rounded-md bg-red-50 p-4 mb-4"><p className="text-sm text-red-700">{error}</p></div>}
                        
                        {renderSectionTitle('Primary Information')}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                                <input type="text" name="name" id="name" value={supplier.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person</label>
                                <input type="text" name="contactPerson" id="contactPerson" value={supplier.contactPerson} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" id="email" value={supplier.email || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone" id="phone" value={supplier.phone || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                        </div>

                        {renderSectionTitle('Address & Terms')}
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea name="address" id="address" rows={2} value={supplier.address || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">Payment Terms</label>
                            <input type="text" name="paymentTerms" id="paymentTerms" value={supplier.paymentTerms || ''} onChange={handleChange} placeholder="e.g., Net 30, COD" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                        </div>
                         <div className="mt-4">
                            <label htmlFor="bankingDetails" className="block text-sm font-medium text-gray-700">Banking Details</label>
                             <textarea name="bankingDetails" id="bankingDetails" rows={3} value={supplier.bankingDetails || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Bank Name, Account Number, Routing, etc."/>
                        </div>
                        
                        {renderSectionTitle('Additional Information')}
                        <div>
                             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                             <textarea name="notes" id="notes" rows={4} value={supplier.notes || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., Minimum order quantity, delivery schedule, etc."/>
                        </div>

                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Save Supplier
                        </button>
                        <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierFormModal;