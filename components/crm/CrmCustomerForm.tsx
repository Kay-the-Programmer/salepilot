import React, { useState, useEffect } from 'react';
import { Customer, StoreSettings } from '../../types';
import LocationPickerModal from '../ui/LocationPickerModal';
import { Icon } from './CrmBits';
import { initials, avatarColor, formatMoney } from './crmModel';

interface CrmCustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Customer) => void;
    customerToEdit?: Customer | null;
    storeSettings?: StoreSettings | null;
}

/**
 * Add / Edit customer — CRM-styled task sheet. The logic structure is preserved
 * verbatim from components/customers/CustomerFormModal: same state shape, the
 * same name-required validation, the same address + map-picker flow, and the
 * same finalCustomer payload (id / createdAt). Only the presentation changed.
 */
const getInitialState = (): Omit<Customer, 'id' | 'createdAt'> => ({
    name: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zip: '' },
    notes: '',
    storeCredit: 0,
    accountBalance: 0,
});

export const CrmCustomerForm: React.FC<CrmCustomerFormProps> = ({ isOpen, onClose, onSave, customerToEdit, storeSettings }) => {
    const [customer, setCustomer] = useState(getInitialState());
    const [error, setError] = useState('');
    const [isMapOpen, setIsMapOpen] = useState(false);

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
            setCustomer(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, address: { ...prev.address!, [name]: value } }));
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

    const currency = storeSettings?.currency?.symbol ?? '$';

    return (
        <div className="crm-form-overlay" role="dialog" aria-modal="true" aria-label={customerToEdit ? 'Edit customer' : 'Add new customer'}>
            <header className="crm-form-bar">
                <div className="crm-form-bar__left">
                    <button type="button" className="crm-iconbtn" aria-label="Close" onClick={onClose} style={{ color: 'var(--c-primary)' }}>
                        <Icon name="close" />
                    </button>
                    <h1 className="crm-form-bar__title">{customerToEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
                </div>
                <span className="crm-form-bar__ctx"><Icon name="storefront" size={18} /> {storeSettings?.name || 'SalePilot CRM'}</span>
            </header>

            <form id="crm-customer-form" onSubmit={handleSubmit} className="crm-form-scroll">
                <div className="crm-form-inner">
                    {error && (
                        <div className="crm-form-error" role="alert">
                            <Icon name="error" size={20} fill={1} /> {error}
                        </div>
                    )}

                    <div className="crm-form-grid">
                        {/* Identity column */}
                        <div className="crm-form-identity">
                            <div className="crm-form-avatar">
                                <span className="crm-form-avatar__ring" style={{ background: avatarColor(customer.name || '?') }}>
                                    {customer.name.trim() ? initials(customer.name) : <Icon name="person" size={64} />}
                                </span>
                            </div>
                            <div>
                                <p className="crm-form-minihint"><Icon name="auto_awesome" size={16} fill={1} /> Avatar from initials</p>
                                <p className="crm-form-identity__hint">A clean monogram is generated automatically from the customer's name.</p>
                            </div>

                            {customerToEdit && (
                                <div className="crm-form-summary">
                                    <div className="crm-form-summary__row">
                                        <span className="crm-form-summary__label">Store Credit</span>
                                        <span className="crm-form-summary__value">{formatMoney(customer.storeCredit || 0, storeSettings)}</span>
                                    </div>
                                    <div className="crm-form-summary__row">
                                        <span className="crm-form-summary__label">A/R Balance</span>
                                        <span className="crm-form-summary__value">{formatMoney(customer.accountBalance || 0, storeSettings)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form fields */}
                        <div className="crm-form-fields">
                            <section className="crm-form-section">
                                <div className="crm-form-section__head">
                                    <h2 className="crm-form-section__title">Customer Details</h2>
                                </div>

                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="cf-name">Full Name</label>
                                    <input
                                        id="cf-name" className="crm-input" name="name" type="text"
                                        value={customer.name} onChange={handleChange}
                                        placeholder="e.g. Jane Doe" autoFocus required
                                    />
                                </div>

                                <div className="crm-form-row crm-form-row--2">
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="cf-phone">Phone Number</label>
                                        <input
                                            id="cf-phone" className="crm-input" name="phone" type="tel"
                                            value={customer.phone || ''} onChange={handleChange}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="cf-email">Email Address</label>
                                        <input
                                            id="cf-email" className="crm-input" name="email" type="email"
                                            value={customer.email || ''} onChange={handleChange}
                                            placeholder="jane@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="cf-credit">Store Credit</label>
                                    <div className="crm-input-affix">
                                        <span className="crm-input-affix__prefix">{currency}</span>
                                        <input
                                            id="cf-credit" className="crm-input" name="storeCredit" type="number"
                                            min="0" step="0.01"
                                            value={customer.storeCredit?.toString() || '0'} onChange={handleChange}
                                        />
                                    </div>
                                    <p className="crm-input-group__hint">Prepaid balance the customer can spend in store.</p>
                                </div>

                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="cf-credit-limit">Credit Limit (trade credit)</label>
                                    <div className="crm-input-affix">
                                        <span className="crm-input-affix__prefix">{currency}</span>
                                        <input
                                            id="cf-credit-limit" className="crm-input" name="creditLimit" type="number"
                                            min="0" step="0.01" placeholder="No limit set"
                                            value={(customer as any).creditLimit ?? ''} onChange={handleChange}
                                        />
                                    </div>
                                    <p className="crm-input-group__hint">Caps this customer's outstanding balance for online orders. Leave blank for no credit line.</p>
                                </div>
                            </section>

                            <section className="crm-form-section">
                                <div className="crm-form-section__head">
                                    <h2 className="crm-form-section__title">Location Details</h2>
                                    <button type="button" className="crm-link" onClick={() => setIsMapOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Icon name="location_on" size={18} /> Pick from Map
                                    </button>
                                </div>

                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="cf-street">Street Address</label>
                                    <input
                                        id="cf-street" className="crm-input" name="street" type="text"
                                        value={customer.address?.street || ''} onChange={handleAddressChange}
                                        placeholder="123 Commerce Way"
                                    />
                                </div>
                                <div className="crm-form-row crm-form-row--3">
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="cf-city">City</label>
                                        <input id="cf-city" className="crm-input" name="city" type="text" value={customer.address?.city || ''} onChange={handleAddressChange} placeholder="New York" />
                                    </div>
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="cf-state">State</label>
                                        <input id="cf-state" className="crm-input" name="state" type="text" value={customer.address?.state || ''} onChange={handleAddressChange} placeholder="NY" />
                                    </div>
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="cf-zip">Zip Code</label>
                                        <input id="cf-zip" className="crm-input" name="zip" type="text" value={customer.address?.zip || ''} onChange={handleAddressChange} placeholder="10001" />
                                    </div>
                                </div>
                            </section>

                            <section className="crm-form-section">
                                <div className="crm-form-section__head">
                                    <h2 className="crm-form-section__title">Notes</h2>
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="cf-notes">Customer Notes</label>
                                    <textarea
                                        id="cf-notes" className="crm-input" name="notes" rows={4}
                                        value={customer.notes || ''} onChange={handleChange}
                                        placeholder="Key preferences, loyalty status, or behavioural notes..."
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </form>

            <footer className="crm-form-foot">
                <div className="crm-form-foot__inner">
                    <button type="button" className="crm-btn crm-btn--ghost" onClick={onClose} style={{ color: 'var(--c-on-surface-variant)', padding: '14px 24px' }}>
                        Discard
                    </button>
                    <button type="submit" form="crm-customer-form" className="crm-btn crm-btn--primary" style={{ padding: '14px 28px' }}>
                        <Icon name="person_add" size={20} /> {customerToEdit ? 'Save Changes' : 'Save Customer'}
                    </button>
                </div>
            </footer>

            {isMapOpen && (
                <LocationPickerModal
                    isOpen={isMapOpen}
                    onClose={() => setIsMapOpen(false)}
                    onSelect={(loc: any) => {
                        setCustomer(prev => ({
                            ...prev,
                            address: {
                                street: loc.details?.street || loc.address.split(',')[0] || '',
                                city: loc.details?.city || '',
                                state: loc.details?.state || '',
                                zip: loc.details?.zip || '',
                            },
                        }));
                        setIsMapOpen(false);
                    }}
                    title="Set Customer Location"
                />
            )}
        </div>
    );
};

export default CrmCustomerForm;
