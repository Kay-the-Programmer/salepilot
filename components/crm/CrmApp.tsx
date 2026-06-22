import React, { useEffect, useMemo, useState } from 'react';
import { Customer, Sale, StoreSettings, User } from '../../types';
import CrmCustomerForm from './CrmCustomerForm';
import { CrmShell, CrmSection } from './CrmShell';
import CrmDashboard from './CrmDashboard';
import CrmCustomers from './CrmCustomers';
import CrmCustomerProfile from './CrmCustomerProfile';
import CrmLoyalty from './CrmLoyalty';
import CrmInsights from './CrmInsights';
import CrmRewardsSettings from './CrmRewardsSettings';
import SendMessageModal from './SendMessageModal';
import { Icon } from './CrmBits';
import { buildOverview, LoyaltyConfig, RedemptionEntry, formatMoney, num } from './crmModel';
import loyaltyService from './loyaltyService';
import { smsService, SmsConfig } from '../../services/smsService';
import { hasModule, MODULES } from '../../utils/entitlements';
import './crm.css';

interface CrmAppProps {
    section: CrmSection;
    user: User;
    customers: Customer[];
    sales: Sale[];
    storeSettings: StoreSettings | null;
    canManage: boolean;
    onNavigate: (section: CrmSection) => void;
    onDiscover: () => void;
    onUpgrade: () => void;
    onSaveCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: string) => void;
    onExit: () => void;
    onLogout: () => void;
}

/**
 * Container for the standalone CRM app. Derives all metrics from the live
 * `customers` + `sales` props the host Dashboard loads from the backend, layered
 * with the per-store loyalty config + redemption ledger.
 */
export const CrmApp: React.FC<CrmAppProps> = ({
    section, user, customers, sales, storeSettings, canManage,
    onNavigate, onDiscover, onUpgrade, onSaveCustomer, onDeleteCustomer, onExit, onLogout,
}) => {
    const storeId = user?.currentStoreId;
    const smsEntitled = hasModule(storeSettings, MODULES.SMS_MESSAGING);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [messageTarget, setMessageTarget] = useState<Customer | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [rewardsOpen, setRewardsOpen] = useState(false);

    const [config, setConfig] = useState<LoyaltyConfig>(() => loyaltyService.getConfig(storeId));
    const [ledger, setLedger] = useState<RedemptionEntry[]>(() => loyaltyService.getLedger(storeId));
    const [smsInfo, setSmsInfo] = useState<SmsConfig | null>(null);

    // Discover whether the server can send SMS (best-effort; non-blocking).
    useEffect(() => {
        let active = true;
        smsService.getConfig().then(c => { if (active) setSmsInfo(c); }).catch(() => { if (active) setSmsInfo(null); });
        return () => { active = false; };
    }, []);

    // Reload loyalty state when the active store changes.
    useEffect(() => {
        setConfig(loyaltyService.getConfig(storeId));
        setLedger(loyaltyService.getLedger(storeId));
    }, [storeId]);

    const overview = useMemo(() => buildOverview(customers, sales, config, ledger), [customers, sales, config, ledger]);

    useEffect(() => { setSelectedId(null); }, [section]);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const notify = (msg: string) => setToast(msg);

    const openCustomer = (id: string) => { onNavigate('customers'); setSelectedId(id); };
    const goSection = (s: CrmSection) => { setSelectedId(null); setRewardsOpen(false); onNavigate(s); };
    const openRewardsSettings = () => { setRewardsOpen(true); onNavigate('loyalty'); };

    const openAdd = () => {
        if (!canManage) { notify('You do not have permission to add customers.'); return; }
        setEditing(null); setFormOpen(true);
    };
    const openEdit = (c: Customer) => {
        if (!canManage) { notify('You do not have permission to edit customers.'); return; }
        setEditing(c); setFormOpen(true);
    };

    const handleSave = (c: Customer) => {
        onSaveCustomer(c);
        setFormOpen(false); setEditing(null);
        notify(editing ? 'Customer updated.' : 'Customer added.');
    };

    const handleDelete = (c: Customer) => {
        if (!canManage) { notify('You do not have permission to delete customers.'); return; }
        if (window.confirm(`Delete ${c.name}? This cannot be undone.`)) {
            onDeleteCustomer(c.id);
            setSelectedId(null);
            notify('Customer deleted.');
        }
    };

    const handleSaveConfig = (cfg: LoyaltyConfig) => {
        loyaltyService.saveConfig(storeId, cfg);
        setConfig(cfg);
        setRewardsOpen(false);
        notify('Rewards settings saved.');
    };

    const handleRedeem = (customerId: string) => {
        const m = overview.byId.get(customerId);
        if (!m) return;
        if (!config.enabled) { notify('The loyalty program is currently paused.'); return; }
        if (!canManage) { notify('You do not have permission to redeem points.'); return; }
        if (!m.canRedeem) {
            notify(config.minRedeemPoints > 0
                ? `Needs at least ${config.minRedeemPoints.toLocaleString()} points to redeem.`
                : 'Not enough points to redeem yet.');
            return;
        }
        const points = m.redeemableBlocks * config.redeemPointsPerUnit;
        const value = m.redeemableValue;

        // Grant the reward as store credit (persisted to the backend) ...
        onSaveCustomer({
            ...m.customer,
            storeCredit: num(m.customer.storeCredit) + value,
            accountBalance: num(m.customer.accountBalance),
        });
        // ... and record the redemption so the balance and monthly totals reflect it.
        setLedger(loyaltyService.addRedemption(storeId, { customerId, points, value }));
        notify(`Redeemed ${points.toLocaleString()} pts → ${formatMoney(value, storeSettings)} store credit.`);
    };

    const handleSent = async (channel: 'sms' | 'email', body: string) => {
        const target = messageTarget;
        setMessageTarget(null);
        if (!target) return;

        if (channel === 'email') {
            notify(`Email to ${target.name} composed — email delivery isn't enabled yet.`);
            return;
        }

        // SMS via Africa's Talking (backend).
        if (!target.phone) { notify(`No phone number on file for ${target.name}.`); return; }
        notify(`Sending SMS to ${target.name}…`);
        try {
            const res = await smsService.send({ to: target.phone, message: body, customerId: target.id });
            notify(res.success
                ? `SMS sent to ${target.name}${res.cost ? ` · ${res.cost}` : ''}.`
                : `SMS not delivered: ${res.status || res.message || 'failed'}.`);
        } catch (err: any) {
            notify(err?.message || 'Failed to send SMS.');
        }
    };

    const selected = selectedId ? overview.byId.get(selectedId) : undefined;

    let content: React.ReactNode;
    if (rewardsOpen) {
        content = (
            <CrmRewardsSettings
                config={config}
                storeSettings={storeSettings}
                onBack={() => setRewardsOpen(false)}
                onSave={handleSaveConfig}
            />
        );
    } else if (section === 'customers' && selected) {
        content = (
            <CrmCustomerProfile
                metrics={selected}
                sales={sales}
                storeSettings={storeSettings}
                config={config}
                canManage={canManage}
                smsEntitled={smsEntitled}
                onBack={() => setSelectedId(null)}
                onEdit={() => openEdit(selected.customer)}
                onMessage={() => setMessageTarget(selected.customer)}
                onUpgrade={onUpgrade}
                onRedeem={() => handleRedeem(selected.customer.id)}
                onDelete={() => handleDelete(selected.customer)}
            />
        );
    } else if (section === 'customers') {
        content = (
            <CrmCustomers
                overview={overview}
                storeSettings={storeSettings}
                search={search}
                onSearch={setSearch}
                onOpenCustomer={openCustomer}
                onAddCustomer={openAdd}
            />
        );
    } else if (section === 'loyalty') {
        content = (
            <CrmLoyalty
                overview={overview}
                storeSettings={storeSettings}
                onConfigure={openRewardsSettings}
                onOpenCustomer={openCustomer}
                onNotify={notify}
            />
        );
    } else if (section === 'insights') {
        content = (
            <CrmInsights
                overview={overview}
                storeSettings={storeSettings}
                onReengage={() => notify(`${overview.churnCount} at-risk customer${overview.churnCount === 1 ? '' : 's'} ready for outreach.`)}
                onNotify={notify}
            />
        );
    } else {
        content = (
            <CrmDashboard
                overview={overview}
                storeSettings={storeSettings}
                onAddCustomer={openAdd}
                onOpenCustomer={openCustomer}
                onViewAll={() => goSection('customers')}
                onViewInsights={() => goSection('insights')}
                onManageRewards={openRewardsSettings}
            />
        );
    }

    return (
        <CrmShell
            active={section}
            user={user}
            onNavigate={goSection}
            onDiscover={onDiscover}
            onExit={onExit}
            onLogout={onLogout}
            onSearch={() => goSection('customers')}
        >
            {content}

            {formOpen && (
                <CrmCustomerForm
                    isOpen={formOpen}
                    onClose={() => { setFormOpen(false); setEditing(null); }}
                    onSave={handleSave}
                    customerToEdit={editing}
                    storeSettings={storeSettings}
                />
            )}

            {messageTarget && (
                <SendMessageModal
                    customer={messageTarget}
                    metrics={overview.byId.get(messageTarget.id)}
                    storeName={storeSettings?.name}
                    smsConfigured={smsInfo?.configured ?? true}
                    smsSandbox={smsInfo?.sandbox ?? false}
                    onClose={() => setMessageTarget(null)}
                    onSent={handleSent}
                />
            )}

            {toast && (
                <div className="crm-toast" role="status">
                    <Icon name="check_circle" size={20} fill={1} />
                    {toast}
                </div>
            )}
        </CrmShell>
    );
};

export default CrmApp;
