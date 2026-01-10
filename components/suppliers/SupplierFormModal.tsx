import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import CheckIcon from '../icons/CheckIcon';
import BuildingOfficeIcon from '../icons/BuildingOfficeIcon';
import UserCircleIcon from '../icons/UserCircleIcon';
import EnvelopeIcon from '../icons/EnvelopeIcon';
import PhoneIcon from '../icons/PhoneIcon';
import MapPinIcon from '../icons/MapPinIcon';
import BanknotesIcon from '../icons/BanknotesIcon';
import BankIcon from '../icons/BankIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import { InputField } from '../ui/InputField';
import { Button } from '../ui/Button';

interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    supplierToEdit?: Supplier | null;
}

type SupplierFormSection = 'basic' | 'details' | 'banking' | 'notes';

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

interface SectionProgressProps {
    activeSection: SupplierFormSection;
    setActiveSection: (section: SupplierFormSection) => void;
}

function SectionProgress({ activeSection, setActiveSection }: SectionProgressProps) {
    return (
        <div className="flex items-center justify-center space-x-2 mb-6">
            {(['basic', 'details', 'banking', 'notes'] as const).map((section, index) => (
                <React.Fragment key={section}>
                    <button
                        type="button"
                        onClick={() => setActiveSection(section)}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${activeSection === section
                            ? 'bg-gray-900 text-white scale-110'
                            : 'bg-gray-100 text-gray-500'
                            }`}
                        aria-label={`Go to ${section} section`}
                    >
                        {index + 1}
                    </button>
                    {index < 3 && (
                        <div className={`w-6 h-0.5 ${activeSection === section || index < ['basic', 'details', 'banking', 'notes'].indexOf(activeSection) ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function SupplierFormModal({ isOpen, onClose, onSave, supplierToEdit }: SupplierFormModalProps) {
    const [supplier, setSupplier] = useState(getInitialState());
    const [error, setError] = useState('');
    const [activeSection, setActiveSection] = useState<SupplierFormSection>('basic');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (supplierToEdit) {
                setSupplier({ ...getInitialState(), ...supplierToEdit });
            } else {
                setSupplier(getInitialState());
            }
            setActiveSection('basic');
        }
    }, [supplierToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSupplier(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!supplier.name.trim()) {
            setError('Supplier name is required.');
            // Scroll to error
            document.getElementById('name')?.focus();
            return;
        }

        const finalSupplier: Supplier = {
            ...supplier,
            id: supplierToEdit?.id || `sup_${Date.now()}`,
        } as Supplier;
        onSave(finalSupplier);
        // Success animation
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    const renderSection = () => {
        switch (activeSection) {
            case 'basic':
                return (
                    <div className="space-y-4 animate-slide-in">
                        <div className="flex items-center mb-4">
                            <BuildingOfficeIcon className="w-5 h-5 text-gray-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-4 border border-red-100 mb-4 animate-shake">
                                <p className="text-sm text-red-600 flex items-center">
                                    <span className="mr-2">⚠️</span>
                                    {error}
                                </p>
                            </div>
                        )}

                        <InputField
                            label="Supplier Name"
                            name="name"
                            value={supplier.name}
                            onChange={handleChange}
                            required
                            hasError={!!error}
                            icon={<BuildingOfficeIcon className="w-5 h-5" />}
                            placeholder="Enter supplier name"
                        />

                        <InputField
                            label="Contact Person"
                            name="contactPerson"
                            value={supplier.contactPerson}
                            onChange={handleChange}
                            icon={<UserCircleIcon className="w-5 h-5" />}
                            placeholder="Name of contact person"
                        />

                        <InputField
                            label="Email"
                            name="email"
                            value={supplier.email || ''}
                            onChange={handleChange}
                            type="email"
                            icon={<EnvelopeIcon className="w-5 h-5" />}
                            placeholder="supplier@example.com"
                        />

                        <InputField
                            label="Phone"
                            name="phone"
                            value={supplier.phone || ''}
                            onChange={handleChange}
                            type="tel"
                            icon={<PhoneIcon className="w-5 h-5" />}
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                );

            case 'details':
                return (
                    <div className="space-y-4 animate-slide-in">
                        <div className="flex items-center mb-4">
                            <MapPinIcon className="w-5 h-5 text-gray-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Address & Terms</h3>
                        </div>

                        <InputField
                            label="Address"
                            name="address"
                            value={supplier.address || ''}
                            onChange={handleChange}
                            multiline
                            icon={<MapPinIcon className="w-5 h-5" />}
                            placeholder="Full address including city, state, and ZIP"
                            rows={3}
                        />

                        <InputField
                            label="Payment Terms"
                            name="paymentTerms"
                            value={supplier.paymentTerms || ''}
                            onChange={handleChange}
                            icon={<BanknotesIcon className="w-5 h-5" />}
                            placeholder="e.g., Net 30, COD, 2/10 Net 30"
                        />
                    </div>
                );

            case 'banking':
                return (
                    <div className="space-y-4 animate-slide-in">
                        <div className="flex items-center mb-4">
                            <BankIcon className="w-5 h-5 text-gray-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Banking Details</h3>
                        </div>

                        <InputField
                            label="Banking Information"
                            name="bankingDetails"
                            value={supplier.bankingDetails || ''}
                            onChange={handleChange}
                            multiline
                            icon={<BankIcon className="w-5 h-5" />}
                            placeholder="Bank name, account number, routing number, SWIFT/BIC"
                            rows={4}
                        />
                    </div>
                );

            case 'notes':
                return (
                    <div className="space-y-4 animate-slide-in">
                        <div className="flex items-center mb-4">
                            <DocumentTextIcon className="w-5 h-5 text-gray-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                        </div>

                        <InputField
                            label="Notes"
                            name="notes"
                            value={supplier.notes || ''}
                            onChange={handleChange}
                            multiline
                            icon={<DocumentTextIcon className="w-5 h-5" />}
                            placeholder="Minimum order quantity, delivery schedule, special instructions, etc."
                            rows={5}
                        />
                    </div>
                );
        }
    };

    const isLastSection = activeSection === 'notes';
    const isFirstSection = activeSection === 'basic';

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/40 flex items-end justify-center md:items-center safe-area-bottom"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="bg-white w-full max-w-md md:max-w-2xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-xl active:bg-gray-100 transition-colors"
                                aria-label="Close modal"
                            >
                                <XMarkIcon className="w-6 h-6 text-gray-600" />
                            </button>
                            <div className="ml-2">
                                <h1 id="modal-title" className="text-lg font-bold text-gray-900">
                                    {supplierToEdit ? 'Edit Supplier' : 'New Supplier'}
                                </h1>
                                <div className="text-xs text-gray-500">
                                    {activeSection === 'basic' && 'Basic Information'}
                                    {activeSection === 'details' && 'Address & Terms'}
                                    {activeSection === 'banking' && 'Banking Details'}
                                    {activeSection === 'notes' && 'Additional Notes'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Button
                                onClick={() => handleSubmit()}
                                icon={<CheckIcon className="w-5 h-5" />}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="px-4 pt-4">
                    <SectionProgress activeSection={activeSection} setActiveSection={setActiveSection} />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <form onSubmit={handleSubmit} className="pb-4">
                        {renderSection()}
                    </form>
                </div>

                {/* Footer Navigation */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant={isFirstSection ? 'ghost' : 'secondary'}
                            onClick={() => {
                                const sections: SupplierFormSection[] = ['basic', 'details', 'banking', 'notes'];
                                const currentIndex = sections.indexOf(activeSection);
                                if (currentIndex > 0) {
                                    setActiveSection(sections[currentIndex - 1]);
                                }
                            }}
                            disabled={isFirstSection}
                        >
                            Back
                        </Button>

                        <div className="text-xs text-gray-500">
                            {activeSection === 'basic' && 'Step 1 of 4'}
                            {activeSection === 'details' && 'Step 2 of 4'}
                            {activeSection === 'banking' && 'Step 3 of 4'}
                            {activeSection === 'notes' && 'Step 4 of 4'}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const sections: SupplierFormSection[] = ['basic', 'details', 'banking', 'notes'];
                                const currentIndex = sections.indexOf(activeSection);
                                if (currentIndex < sections.length - 1) {
                                    setActiveSection(sections[currentIndex + 1]);
                                } else {
                                    handleSubmit();
                                }
                            }}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${isLastSection
                                ? 'bg-gray-900 text-white active:bg-gray-800 active:scale-95'
                                : 'bg-gray-100 text-gray-900 active:bg-gray-200'
                                }`}
                        >
                            {isLastSection ? 'Save Supplier' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}