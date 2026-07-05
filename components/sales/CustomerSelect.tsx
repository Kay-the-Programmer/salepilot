
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '../../types';
import UserCircleIcon from '../icons/UserCircleIcon';
import XMarkIcon from '../icons/XMarkIcon';

interface CustomerSelectProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
    /** Phone number collected for this sale — auto-saved to the customer on checkout. */
    customerPhone?: string;
    onCustomerPhoneChange?: (phone: string) => void;
}

const digitsOnly = (v: string) => v.replace(/\D/g, '');

const CustomerSelect: React.FC<CustomerSelectProps> = ({
    customers,
    selectedCustomer,
    onSelectCustomer,
    customerPhone = '',
    onCustomerPhoneChange,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        const termDigits = digitsOnly(searchTerm);
        return customers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (termDigits.length >= 3 && c.phone && digitsOnly(c.phone).includes(termDigits))
        ).slice(0, 5); // Limit results for performance
    }, [searchTerm, customers]);

    // Auto-match: when the typed phone number belongs to an existing customer,
    // attach them to the sale automatically.
    useEffect(() => {
        if (selectedCustomer || !customerPhone) return;
        const phoneDigits = digitsOnly(customerPhone);
        if (phoneDigits.length < 7) return;
        const match = customers.find(c => c.phone && digitsOnly(c.phone) === phoneDigits);
        if (match) onSelectCustomer(match);
    }, [customerPhone, customers, selectedCustomer, onSelectCustomer]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (customer: Customer) => {
        onSelectCustomer(customer);
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const handleClear = () => {
        onSelectCustomer(null);
        setSearchTerm('');
        onCustomerPhoneChange?.('');
    };

    const selectedNeedsPhone = !!selectedCustomer && !selectedCustomer.phone;
    const phoneInputVisible = !!onCustomerPhoneChange && (!selectedCustomer || selectedNeedsPhone);
    const phoneDigits = digitsOnly(customerPhone);

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add Customer to Sale
            </label>

            {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-success-muted dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <UserCircleIcon className="w-6 h-6 text-primary dark:text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-primary">{selectedCustomer.name}</p>
                            <p className="text-xs text-primary dark:text-primary">{selectedCustomer.phone || selectedCustomer.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-1.5 text-primary dark:text-primary hover:text-white dark:hover:text-white rounded-full hover:bg-primary dark:hover:bg-primary active:scale-95 transition-all duration-300"
                        aria-label="Remove customer"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        id="customer-search"
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all shadow-sm"
                    />

                    {isDropdownOpen && filteredCustomers.length > 0 && (
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-2xl absolute z-20 w-full mt-2 border border-slate-200/50 dark:border-white/10 max-h-60 overflow-auto shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                            <ul className="py-2">
                                {filteredCustomers.map(customer => (
                                    <li
                                        key={customer.id}
                                        onClick={() => handleSelect(customer)}
                                        className="px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer active:scale-[0.98] transition-all duration-200"
                                    >
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{customer.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{customer.phone || customer.email}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {phoneInputVisible && (
                <div className="mt-2">
                    <input
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        placeholder={selectedNeedsPhone ? `Add ${selectedCustomer!.name}'s phone number...` : 'Customer phone number (optional)...'}
                        value={customerPhone}
                        onChange={e => onCustomerPhoneChange!(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all shadow-sm"
                    />
                    {phoneDigits.length >= 7 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-1">
                            {selectedNeedsPhone
                                ? 'Number will be saved to this customer on checkout.'
                                : 'New number — a customer profile will be saved automatically on checkout.'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerSelect;
