
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

    if (selectedCustomer) {
        return (
            <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                    <UserCircleIcon className="w-6 h-6 text-blue-600" />
                    <div>
                        <p className="font-semibold text-sm text-blue-800">{selectedCustomer.name}</p>
                        <p className="text-xs text-blue-600">{selectedCustomer.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100"
                    aria-label="Remove customer"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">Add Customer to Sale</label>
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
                className="w-full p-2 border border-gray-300 rounded-md"
            />
            {isDropdownOpen && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <ul>
                        {filteredCustomers.map(customer => (
                            <li
                                key={customer.id}
                                onClick={() => handleSelect(customer)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                            >
                                <p className="font-medium text-sm">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.email}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomerSelect;
