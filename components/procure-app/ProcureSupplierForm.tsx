import React, { useEffect, useMemo, useState } from 'react';
import { Supplier } from '../../types';
import { Icon } from '../crm/CrmBits';

interface ProcureSupplierFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    supplierToEdit?: Supplier | null;
}

const getInitialState = (): Omit<Supplier, 'id'> => ({
    name: '', contactPerson: '', phone: '', email: '', address: '', paymentTerms: '', bankingDetails: '', notes: '',
});

const TERM_OPTIONS = ['Net 15', 'Net 30', 'Net 60', 'Due on receipt'];

/**
 * Add / edit supplier — redesigned to the M3 two-column layout. The logic is
 * preserved from SupplierFormModal: same fields, the same name-required
 * validation and the same finalSupplier payload (id = sup_<ts> for new).
 */
export const ProcureSupplierForm: React.FC<ProcureSupplierFormProps> = ({ isOpen, onClose, onSave, supplierToEdit }) => {
    const [supplier, setSupplier] = useState(getInitialState());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setSupplier(supplierToEdit ? { ...getInitialState(), ...supplierToEdit } : getInitialState());
        }
    }, [supplierToEdit, isOpen]);

    const change = (name: keyof Supplier, value: string) => setSupplier(prev => ({ ...prev, [name]: value }));

    const submit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!supplier.name.trim()) { setError('Supplier name is required.'); return; }
        const finalSupplier: Supplier = { ...supplier, id: supplierToEdit?.id || `sup_${Date.now()}` } as Supplier;
        onSave(finalSupplier);
    };

    const termOptions = useMemo(() => {
        const opts = [...TERM_OPTIONS];
        if (supplier.paymentTerms && !opts.includes(supplier.paymentTerms)) opts.unshift(supplier.paymentTerms);
        return opts;
    }, [supplier.paymentTerms]);

    if (!isOpen) return null;

    return (
        <div className="crm-form-overlay" role="dialog" aria-modal="true" aria-label={supplierToEdit ? 'Edit supplier' : 'Add supplier'}>
            <header className="crm-form-bar">
                <div className="crm-form-bar__left">
                    <button type="button" className="crm-iconbtn" aria-label="Back" onClick={onClose} style={{ color: 'var(--c-primary)' }}>
                        <Icon name="arrow_back" />
                    </button>
                    <h1 className="crm-form-bar__title">{supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}</h1>
                </div>
            </header>

            <form onSubmit={submit} className="crm-form-scroll">
                <div className="crm-form-inner" style={{ maxWidth: 1000 }}>
                    {error && (
                        <div className="crm-form-error" role="alert"><Icon name="error" size={20} fill={1} /> {error}</div>
                    )}

                    <div className="sup-grid">
                        {/* Left: primary info */}
                        <div className="sup-grid__main">
                            <section className="crm-form-section">
                                <div className="sup-sec-head">
                                    <span className="sup-sec-head__icon"><Icon name="domain" size={22} /></span>
                                    <h2 className="crm-form-section__title">Company Information</h2>
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-name">Company Name</label>
                                    <input id="sf-name" className="crm-input" value={supplier.name} onChange={e => change('name', e.target.value)} placeholder="e.g. Northwood Distribution Ltd." autoFocus />
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-address">Address</label>
                                    <input id="sf-address" className="crm-input" value={supplier.address || ''} onChange={e => change('address', e.target.value)} placeholder="Street, city, country" />
                                </div>
                            </section>

                            <section className="crm-form-section">
                                <div className="sup-sec-head">
                                    <span className="sup-sec-head__icon"><Icon name="contact_phone" size={22} /></span>
                                    <h2 className="crm-form-section__title">Contact Details</h2>
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-contact">Primary Contact Person</label>
                                    <input id="sf-contact" className="crm-input" value={supplier.contactPerson || ''} onChange={e => change('contactPerson', e.target.value)} placeholder="Full name" />
                                </div>
                                <div className="sup-row">
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="sf-email">Email Address</label>
                                        <input id="sf-email" className="crm-input" type="email" value={supplier.email || ''} onChange={e => change('email', e.target.value)} placeholder="contact@company.com" />
                                    </div>
                                    <div className="crm-input-group">
                                        <label className="crm-input-group__label" htmlFor="sf-phone">Phone Number</label>
                                        <input id="sf-phone" className="crm-input" type="tel" value={supplier.phone || ''} onChange={e => change('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Right: terms + tip */}
                        <div className="sup-grid__side">
                            <section className="crm-form-section">
                                <div className="sup-sec-head">
                                    <span className="sup-sec-head__icon sup-sec-head__icon--s"><Icon name="payments" size={20} /></span>
                                    <h2 className="crm-form-section__title" style={{ fontSize: 16 }}>Payment Terms</h2>
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-terms">Invoicing Cycle</label>
                                    <div className="sup-select">
                                        <select id="sf-terms" className="crm-input" value={supplier.paymentTerms || ''} onChange={e => change('paymentTerms', e.target.value)}>
                                            <option value="">No specific terms</option>
                                            {termOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        <Icon name="expand_more" size={20} />
                                    </div>
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-bank">Banking / Payment Details</label>
                                    <textarea id="sf-bank" className="crm-input" rows={3} value={supplier.bankingDetails || ''} onChange={e => change('bankingDetails', e.target.value)} placeholder="Account name, number, bank..." />
                                </div>
                                <div className="crm-input-group">
                                    <label className="crm-input-group__label" htmlFor="sf-notes">Notes</label>
                                    <textarea id="sf-notes" className="crm-input" rows={3} value={supplier.notes || ''} onChange={e => change('notes', e.target.value)} placeholder="Lead times, minimums, preferences..." />
                                </div>
                            </section>

                            <div className="sup-tip">
                                <div className="sup-tip__glow" />
                                <h3 className="sup-tip__title"><Icon name="lightbulb" size={18} fill={1} /> Pro Tip</h3>
                                <p className="sup-tip__text">Accurate contact and payment terms speed up reorders and month-end reconciliation inside SalePilot.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <footer className="crm-form-foot">
                <div className="crm-form-foot__inner" style={{ justifyContent: 'space-between' }}>
                    <p className="crm-input-group__hint" style={{ margin: 0 }}>Company name is required to save.</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" className="crm-btn crm-btn--ghost" style={{ color: 'var(--c-on-surface-variant)', padding: '12px 22px' }} onClick={onClose}>Discard</button>
                        <button type="button" className="crm-btn crm-btn--primary" style={{ padding: '12px 26px' }} onClick={() => submit()}>
                            <Icon name="save" size={20} /> Save Supplier
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ProcureSupplierForm;
