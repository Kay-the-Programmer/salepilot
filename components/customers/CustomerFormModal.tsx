
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Customer) => void;
    customerToEdit?: Customer | null;
}

const getInitialState = (): Omit<Customer, 'id' | 'createdAt'> => ({
    name: '',
    email: '',
    phone: '',
    address: {
        street: '',
        city: '',
        state: '',
        zip: '',
    },
    notes: '',
    storeCredit: 0,
    accountBalance: 0,
});

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
    const [customer, setCustomer] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (customerToEdit) {
                // Ensure address and store credit object exists
                const initialData = { ...getInitialState(), ...customerToEdit };
                if (!initialData.address) {
                    initialData.address = getInitialState().address;
                }
                setCustomer(initialData);
            } else {
                setCustomer(getInitialState());
            }
        }
    }, [customerToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'storeCredit') {
            setCustomer(prev => ({...prev, storeCredit: parseFloat(value) || 0}));
        } else {
             setCustomer(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({
            ...prev,
            address: {
                ...prev.address!,
                [name]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer.name.trim()) {
            setError('Customer name is required.');
            return;
        }

        const finalCustomer: Customer = {
            ...customer,
            id: customerToEdit?.id || `cust_${new Date().toISOString()}`,
            createdAt: customerToEdit?.createdAt || new Date().toISOString(),
        };
        onSave(finalCustomer);
    };

    if (!isOpen) return null;

    const renderSectionTitle = (title: string) => <h4 className="text-md font-semibold text-gray-800 mt-6 mb-2 border-b pb-1">{title}</h4>;


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-xl transform transition-all sm:max-w-2xl w-full m-4">
                <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[95vh]">
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex justify-between items-start border-b">
                         <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
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
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name *</label>
                                <input type="text" name="name" id="name" value={customer.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="storeCredit" className="block text-sm font-medium text-gray-700">Store Credit Balance ($)</label>
                                <input type="number" name="storeCredit" id="storeCredit" value={customer.storeCredit || 0} onChange={handleChange} min="0" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" id="email" value={customer.email || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" name="phone" id="phone" value={customer.phone || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                        </div>

                        {renderSectionTitle('Address')}
                        <div>
                            <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street Address</label>
                            <input type="text" name="street" id="street" value={customer.address?.street || ''} onChange={handleAddressChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                <input type="text" name="city" id="city" value={customer.address?.city || ''} onChange={handleAddressChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                             <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700">State / Province</label>
                                <input type="text" name="state" id="state" value={customer.address?.state || ''} onChange={handleAddressChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                             <div>
                                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">Zip / Postal Code</label>
                                <input type="text" name="zip" id="zip" value={customer.address?.zip || ''} onChange={handleAddressChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"/>
                            </div>
                        </div>
                        
                        {renderSectionTitle('Additional Information')}
                        <div>
                             <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                             <textarea name="notes" id="notes" rows={4} value={customer.notes || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., Prefers window shopping, birthday in June, etc."/>
                        </div>

                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                            Save Customer
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

export default CustomerFormModal;
