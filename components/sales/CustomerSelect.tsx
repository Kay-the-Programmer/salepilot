
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '../../types';
import UserCircleIcon from '../icons/UserCircleIcon';
import XMarkIcon from '../icons/XMarkIcon';

interface CustomerSelectProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    onSelectCustomer: (customer: Customer | null) => void;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({ customers, selectedCustomer, onSelectCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(term) ||
            (c.email && c.email.toLowerCase().includes(term))
        ).slice(0, 5); // Limit results for performance
    }, [searchTerm, customers]);

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
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Add Customer to Sale
            </label>

            {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                            <UserCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-300">{selectedCustomer.name}</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedCustomer.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="p-1.5 text-indigo-500 dark:text-indigo-400 hover:text-white dark:hover:text-white rounded-full hover:bg-indigo-500 dark:hover:bg-indigo-500 active:scale-95 transition-all duration-300"
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
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
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
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{customer.email}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerSelect;
