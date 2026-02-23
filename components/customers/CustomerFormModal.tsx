import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, ChatBubbleLeftRightIcon, CreditCardIcon } from '../icons';
import { InputField } from '../ui/InputField';

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

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{title}</h4>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200/50 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20">
                            <UserIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {customerToEdit ? 'Edit Customer' : 'New Customer'}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-0.5">
                                {customerToEdit ? `Updating ID: ${customerToEdit.id.substring(0, 8)}` : 'Create a new buyer account'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold active:scale-95 duration-300"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl animate-shake">
                            <p className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                {error}
                            </p>
                        </div>
                    )}

                    <SectionHeader icon={UserIcon} title="Primary Identity" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField
                            label="Full Name"
                            name="name"
                            value={customer.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Alexander Pierce"
                            icon={<UserIcon className="w-4 h-4" />}
                        />
                        <InputField
                            label="Store Credit ($)"
                            name="storeCredit"
                            type="number"
                            value={customer.storeCredit?.toString() || '0'}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            icon={<CreditCardIcon className="w-4 h-4" />}
                        />
                    </div>

                    <SectionHeader icon={EnvelopeIcon} title="Contact Channels" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            value={customer.email || ''}
                            onChange={handleChange}
                            placeholder="mail@example.com"
                            icon={<EnvelopeIcon className="w-4 h-4" />}
                        />
                        <InputField
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            value={customer.phone || ''}
                            onChange={handleChange}
                            placeholder="+1 (000) 000-0000"
                            icon={<PhoneIcon className="w-4 h-4" />}
                        />
                    </div>

                    <SectionHeader icon={MapPinIcon} title="Location Details" />
                    <div className="space-y-6">
                        <InputField
                            label="Street Address"
                            name="street"
                            value={customer.address?.street || ''}
                            onChange={handleAddressChange}
                            placeholder="123 Commerce Way"
                            icon={<MapPinIcon className="w-4 h-4" />}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <InputField
                                label="City"
                                name="city"
                                value={customer.address?.city || ''}
                                onChange={handleAddressChange}
                                placeholder="New York"
                            />
                            <InputField
                                label="State"
                                name="state"
                                value={customer.address?.state || ''}
                                onChange={handleAddressChange}
                                placeholder="NY"
                            />
                            <InputField
                                label="Zip Code"
                                name="zip"
                                value={customer.address?.zip || ''}
                                onChange={handleAddressChange}
                                placeholder="10001"
                            />
                        </div>
                    </div>

                    <SectionHeader icon={ChatBubbleLeftRightIcon} title="Intelligence & Notes" />
                    <InputField
                        label="Internal Notes"
                        name="notes"
                        multiline
                        rows={4}
                        value={customer.notes || ''}
                        onChange={handleChange}
                        placeholder="Key preferences, loyalty status, or behavioral notes..."
                        icon={<ChatBubbleLeftRightIcon className="w-4 h-4 mt-1" />}
                    />
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-all bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="submit"
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-[0.98] duration-300 text-sm shadow-sm"
                    >
                        {customerToEdit ? 'Save Changes' : 'Initialize Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerFormModal;
