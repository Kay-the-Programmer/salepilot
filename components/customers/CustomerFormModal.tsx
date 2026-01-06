
import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';

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
            setCustomer(prev => ({ ...prev, storeCredit: parseFloat(value) || 0 }));
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
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up sm:max-w-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                    {/* Header */}
                    <div className="sticky top-0 bg-white px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 z-10">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
                            </h3>
                            <button type="button" onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 sm:px-6 py-4 flex-grow overflow-y-auto">
                        {error && <div className="rounded-xl bg-red-50 p-4 mb-4 border border-red-100"><p className="text-sm text-red-700">{error}</p></div>}

                        {renderSectionTitle('Primary Information')}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="Full Name"
                                name="name"
                                value={customer.name}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                            <InputField
                                label="Store Credit Balance ($)"
                                name="storeCredit"
                                type="number"
                                value={customer.storeCredit?.toString() || '0'}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <InputField
                                label="Email"
                                name="email"
                                type="email"
                                value={customer.email || ''}
                                onChange={handleChange}
                                placeholder="john@example.com"
                            />
                            <InputField
                                label="Phone"
                                name="phone"
                                type="tel"
                                value={customer.phone || ''}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        {renderSectionTitle('Address')}
                        <InputField
                            label="Street Address"
                            name="street"
                            value={customer.address?.street || ''}
                            onChange={(e: any) => handleAddressChange(e)}
                            placeholder="123 Main St"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                            <InputField
                                label="City"
                                name="city"
                                value={customer.address?.city || ''}
                                onChange={(e: any) => handleAddressChange(e)}
                            />
                            <InputField
                                label="State / Province"
                                name="state"
                                value={customer.address?.state || ''}
                                onChange={(e: any) => handleAddressChange(e)}
                            />
                            <InputField
                                label="Zip / Postal Code"
                                name="zip"
                                value={customer.address?.zip || ''}
                                onChange={(e: any) => handleAddressChange(e)}
                            />
                        </div>

                        {renderSectionTitle('Additional Information')}
                        <InputField
                            label="Notes"
                            name="notes"
                            multiline
                            rows={4}
                            value={customer.notes || ''}
                            onChange={handleChange}
                            placeholder="e.g., Prefers window shopping, birthday in June, etc."
                        />
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-white px-4 py-4 sm:px-6 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                            >
                                Save Customer
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerFormModal;
