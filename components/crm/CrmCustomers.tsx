import React, { useMemo, useState } from 'react';
import { StoreSettings } from '../../types';
import { Icon, Avatar, TierBadge } from './CrmBits';
import { CrmOverview, CustomerMetrics, formatMoney, formatMonthYear } from './crmModel';

interface CrmCustomersProps {
    overview: CrmOverview;
    storeSettings?: StoreSettings | null;
    search: string;
    onSearch: (v: string) => void;
    onOpenCustomer: (id: string) => void;
    onAddCustomer: () => void;
}

type FilterId = 'all' | 'new' | 'vip' | 'inactive';

const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All Customers' },
    { id: 'new', label: 'New arrivals' },
    { id: 'vip', label: 'VIP Members' },
    { id: 'inactive', label: 'Inactive (45d+)' },
];

const matchesFilter = (m: CustomerMetrics, f: FilterId): boolean => {
    switch (f) {
        case 'new': return m.isNew || m.orderCount === 0;
        case 'vip': return (m.tier.id === 'gold' || m.tier.id === 'platinum') && !m.isInactive;
        case 'inactive': return m.isInactive;
        default: return true;
    }
};

export const CrmCustomers: React.FC<CrmCustomersProps> = ({ overview, storeSettings, search, onSearch, onOpenCustomer, onAddCustomer }) => {
    const [filter, setFilter] = useState<FilterId>('all');

    const counts = useMemo(() => {
        const c: Record<FilterId, number> = { all: 0, new: 0, vip: 0, inactive: 0 };
        for (const m of overview.metrics) {
            c.all++;
            if (matchesFilter(m, 'new')) c.new++;
            if (matchesFilter(m, 'vip')) c.vip++;
            if (matchesFilter(m, 'inactive')) c.inactive++;
        }
        return c;
    }, [overview.metrics]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        return overview.metrics
            .filter(m => matchesFilter(m, filter))
            .filter(m => {
                if (!term) return true;
                const c = m.customer;
                return c.name.toLowerCase().includes(term)
                    || (c.email?.toLowerCase().includes(term) ?? false)
                    || (c.phone?.includes(term) ?? false);
            })
            .sort((a, b) => b.totalSpend - a.totalSpend);
    }, [overview.metrics, filter, search]);

    return (
        <main className="crm-main crm-section-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <h2 className="crm-pagehead__title" style={{ margin: 0 }}>Customer Directory</h2>
                    <div className="crm-search" style={{ maxWidth: 420 }}>
                        <Icon name="search" size={22} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => onSearch(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                        />
                    </div>
                </div>

                <div className="crm-chips">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            type="button"
                            className={`crm-chip${filter === f.id ? ' is-active' : ''}`}
                            onClick={() => setFilter(f.id)}
                        >
                            {f.label}
                            <span className="crm-chip__count">{counts[f.id]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="crm-empty">
                    <Icon name="person_search" size={44} />
                    <p className="crm-empty__title">No customers found</p>
                    <p className="crm-empty__text">
                        {search ? `Nothing matches "${search}".` : 'Add your first customer to get started.'}
                    </p>
                    {!search && (
                        <button className="crm-btn crm-btn--primary" type="button" onClick={onAddCustomer} style={{ marginTop: 8 }}>
                            <Icon name="person_add" size={20} /> Add Customer
                        </button>
                    )}
                </div>
            ) : (
                <div className="crm-custgrid">
                    {visible.map(m => (
                        <button
                            key={m.customer.id}
                            type="button"
                            className={`crm-custcard${m.isInactive ? ' is-inactive' : ''}`}
                            onClick={() => onOpenCustomer(m.customer.id)}
                        >
                            <div className="crm-custcard__top">
                                <div className="crm-custcard__id">
                                    <Avatar name={m.customer.name} size={56} />
                                    <div style={{ minWidth: 0 }}>
                                        <h3 className="crm-custcard__name">{m.customer.name}</h3>
                                        <p className="crm-custcard__since">
                                            {m.isInactive && m.daysSinceLastPurchase != null
                                                ? `Last visit: ${m.daysSinceLastPurchase} days ago`
                                                : `Member since ${formatMonthYear(m.customer.createdAt)}`}
                                        </p>
                                    </div>
                                </div>
                                <TierBadge status={m.statusBadge} label={m.statusLabel} />
                            </div>
                            <div className="crm-custcard__foot">
                                <div>
                                    <p className="crm-custcard__spendlabel">Total Spend</p>
                                    <p className="crm-custcard__spend">{formatMoney(m.totalSpend, storeSettings)}</p>
                                </div>
                                <span className="crm-custcard__go"><Icon name="chevron_right" size={22} /></span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <button className="crm-fab" type="button" aria-label="Add customer" onClick={onAddCustomer}>
                <Icon name="person_add" size={26} />
            </button>
        </main>
    );
};

export default CrmCustomers;
