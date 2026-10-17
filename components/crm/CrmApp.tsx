import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Customer, Sale, StoreSettings, User } from '../../types';
import CrmCustomerForm from './CrmCustomerForm';
import { CrmShell, CrmSection } from './CrmShell';
import CrmDashboard from './CrmDashboard';
import CrmCustomers from './CrmCustomers';
import CrmCustomerProfile from './CrmCustomerProfile';
import CrmLoyalty from './CrmLoyalty';
import CrmInsights from './CrmInsights';
import CrmWhatsApp from './CrmWhatsApp';
import CrmRewardsSettings from './CrmRewardsSettings';
import SendMessageModal, { Channel } from './SendMessageModal';
import { useConfirm } from '../ui/useConfirm';
import { buildOverview, LoyaltyConfig, DEFAULT_LOYALTY_CONFIG, formatMoney } from './crmModel';
import loyaltyService, { RedemptionRow } from './loyaltyService';
import { smsService, SmsConfig } from '../../services/smsService';
import { whatsappService, WhatsAppStatus } from '../../services/whatsappService';
import { crmService } from '../../services/crmService';
import { hasModule, MODULES, WHATSAPP_FREE } from '../../utils/entitlements';
import { useToast } from '../../contexts/ToastContext';
import './crm.css';

interface CrmAppProps {
    section: CrmSection;
    user: User;
    customers: Customer[];
    sales: Sale[];
    storeSettings: StoreSettings | null;
    canManage: boolean;
    onNavigate: (section: CrmSection) => void;
    onUpgrade: () => void;
    onSaveCustomer: (customer: Customer) => void | Promise<void>;
    onDeleteCustomer: (id: string) => void | Promise<void>;
    /** Re-pull customers + sales from the backend (after a server-side change). */
    onRefreshData?: () => void | Promise<void>;
    onExit: () => void;
    onLogout: () => void;
}

/**
 * Container for the standalone CRM app. Derives all metrics from the live
 * `customers` + `sales` props the host Dashboard loads from the backend, layered
 * with the store's loyalty program + redemption ledger (both backend-held).
 */
export const CrmApp: React.FC<CrmAppProps> = ({
    section, user, customers, sales, storeSettings, canManage,
    onNavigate, onUpgrade, onSaveCustomer, onDeleteCustomer, onRefreshData, onExit, onLogout,
}) => {
    const storeId = user?.currentStoreId;
    const smsEntitled = hasModule(storeSettings, MODULES.SMS_MESSAGING);
    // WHATSAPP_FREE: dev override so the add-on is unlocked while we build/test.
    const whatsappEntitled = WHATSAPP_FREE || hasModule(storeSettings, MODULES.WHATSAPP_MESSAGING);
    // Email is free core; either phone channel unlocked adds SMS/WhatsApp.
    const messagingEntitled = true;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [messageTarget, setMessageTarget] = useState<Customer | null>(null);
    const [rewardsOpen, setRewardsOpen] = useState(false);
    /** Set by "Re-engage" so the WhatsApp hub opens on Broadcast with a selection. */
    const [waIntent, setWaIntent] = useState<{ tool: 'broadcast'; customerIds: string[]; n: number } | null>(null);

    const [config, setConfig] = useState<LoyaltyConfig>(DEFAULT_LOYALTY_CONFIG);
    const [ledger, setLedger] = useState<RedemptionRow[]>([]);
    /** Points earned per customer, from the backend ledger (never derived here). */
    const [earned, setEarned] = useState<Map<string, number>>(new Map());
    const [smsInfo, setSmsInfo] = useState<SmsConfig | null>(null);
    const [waInfo, setWaInfo] = useState<WhatsAppStatus | null>(null);
    const [waLoading, setWaLoading] = useState(true);
    const { confirm, confirmDialog } = useConfirm();
    const { showToast } = useToast();

    // The CRM used to own a private `crm-toast`; it now shares the one global
    // toast engine, so CRM notices queue and dedupe with everything else.
    const notify = useCallback(
        (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => showToast(msg, type),
        [showToast],
    );

    // Discover whether the server can send SMS (best-effort; non-blocking).
    useEffect(() => {
        let active = true;
        smsService.getConfig().then(c => { if (active) setSmsInfo(c); }).catch(() => { if (active) setSmsInfo(null); });
        return () => { active = false; };
    }, []);

    // Discover the store's WhatsApp connection state (best-effort; non-blocking).
    // Fold the live entitlement into the status so a stale/absent backend flag
    // never overrides what the store actually owns. Exposed as a callback so the
    // Connect screen can refresh the badge right after saving credentials.
    const loadWaStatus = useCallback(() => {
        setWaLoading(true);
        whatsappService.getStatus()
            .then(s => setWaInfo({ ...s, entitled: s?.entitled ?? whatsappEntitled }))
            .catch(() => setWaInfo({ configured: false, enabled: false, entitled: whatsappEntitled }))
            .finally(() => setWaLoading(false));
    }, [whatsappEntitled]);

    useEffect(() => { loadWaStatus(); }, [loadWaStatus]);

    // Loyalty program + redemption ledger come from the backend, so they follow
    // the store rather than the browser. Reload when the active store changes.
    const loadLedger = useCallback(() => {
        loyaltyService.getLedger().then(setLedger).catch(() => setLedger([]));
        loyaltyService.getEarnedPoints().then(setEarned).catch(() => { /* keep last good map */ });
    }, []);

    useEffect(() => {
        let active = true;
        loyaltyService.getConfig().then(c => { if (active) setConfig(c); }).catch(() => { /* defaults stand */ });
        loyaltyService.getLedger().then(l => { if (active) setLedger(l); }).catch(() => { /* empty stands */ });
        loyaltyService.getEarnedPoints().then(e => { if (active) setEarned(e); }).catch(() => { /* empty stands */ });
        return () => { active = false; };
    }, [storeId]);

    // `sales` is still a dependency: a new sale changes spend, tiers and
    // recency even though it no longer determines the points balance.
    const overview = useMemo(
        () => buildOverview(customers, sales, config, ledger, earned),
        [customers, sales, config, ledger, earned],
    );

    useEffect(() => { setSelectedId(null); }, [section]);

    const openCustomer = (id: string) => { onNavigate('customers'); setSelectedId(id); };
    const goSection = (s: CrmSection) => { setSelectedId(null); setRewardsOpen(false); onNavigate(s); };
    const openRewardsSettings = () => { setRewardsOpen(true); onNavigate('loyalty'); };

    const openAdd = () => {
        if (!canManage) { notify('You do not have permission to add customers.', 'warning'); return; }
        setEditing(null); setFormOpen(true);
    };
    const openEdit = (c: Customer) => {
        if (!canManage) { notify('You do not have permission to edit customers.', 'warning'); return; }
        setEditing(c); setFormOpen(true);
    };

    // The host Dashboard reports the save outcome (it owns the API call and
    // knows whether it was queued offline), so this doesn't toast on top of it.
    const handleSave = async (c: Customer) => {
        setFormOpen(false); setEditing(null);
        await onSaveCustomer(c);
    };

    const handleDelete = async (c: Customer) => {
        if (!canManage) { notify('You do not have permission to delete customers.', 'warning'); return; }
        const ok = await confirm({
            title: `Delete ${c.name}?`,
            message: 'This permanently removes the customer and their profile. This cannot be undone.',
            confirmLabel: 'Delete',
            danger: true,
        });
        if (!ok) return;
        await onDeleteCustomer(c.id);
        setSelectedId(null);
    };

    const handleSaveConfig = async (cfg: LoyaltyConfig) => {
        try {
            const saved = await loyaltyService.saveConfig(cfg);
            setConfig(saved);
            setRewardsOpen(false);
            notify('Rewards settings saved.', 'success');
        } catch (err: any) {
            notify(err?.message || 'Could not save the rewards settings.', 'error');
        }
    };

    /**
     * Redeem points. The server recomputes the balance from the customer's own
     * sales, writes the ledger row and grants the store credit in ONE
     * transaction — so a failed grant can no longer leave a phantom redemption
     * behind, as the old client-side two-step could.
     */
    const handleRedeem = async (customerId: string) => {
        if (!canManage) { notify('You do not have permission to redeem points.', 'warning'); return; }
        try {
            const res = await loyaltyService.redeem(customerId);
            setLedger(prev => [res.redemption, ...prev]); // optimistic; loadLedger confirms
            await onRefreshData?.();
            loadLedger();
            notify(
                `Redeemed ${res.redemption.points.toLocaleString()} pts → ${formatMoney(res.redemption.value, storeSettings)} store credit.`,
                'success',
            );
        } catch (err: any) {
            notify(err?.message || 'Could not redeem these points.', 'error');
            // The server may have rejected because our view was stale.
            loadLedger();
        }
    };

    const handleSent = async (channel: Channel, body: string) => {
        const target = messageTarget;
        setMessageTarget(null);
        if (!target) return;

        if (channel === 'email') {
            notify(`Emailing ${target.name}…`);
            try {
                const res = await crmService.sendEmail({ customerId: target.id, message: body }) as any;
                notify(res?.success
                    ? `Email sent to ${target.name}.`
                    : `Email not delivered: ${res?.message || 'failed'}.`, res?.success ? 'success' : 'error');
            } catch (err: any) {
                notify(err?.message || 'Failed to send the email.', 'error');
            }
            return;
        }

        if (!target.phone) { notify(`No phone number on file for ${target.name}.`, 'warning'); return; }

        if (channel === 'whatsapp') {
            // WhatsApp Business via the Meta Cloud API (backend).
            notify(`Sending WhatsApp to ${target.name}…`);
            try {
                const res = await whatsappService.send({ to: target.phone, message: body, customerId: target.id }) as any;
                notify(res.success
                    ? `WhatsApp message sent to ${target.name}.`
                    : `WhatsApp not delivered: ${res.status || res.message || 'failed'}.`, res.success ? 'success' : 'error');
            } catch (err: any) {
                notify(err?.message || 'Failed to send WhatsApp message.', 'error');
            }
            return;
        }

        // SMS via Africa's Talking (backend).
        notify(`Sending SMS to ${target.name}…`);
        try {
            const res = await smsService.send({ to: target.phone, message: body, customerId: target.id }) as any;
            notify(res.success
                ? `SMS sent to ${target.name}${res.cost ? ` · ${res.cost}` : ''}.`
                : `SMS not delivered: ${res.status || res.message || 'failed'}.`, res.success ? 'success' : 'error');
        } catch (err: any) {
            notify(err?.message || 'Failed to send SMS.', 'error');
        }
    };

    /**
     * "Re-engage" used to raise a toast and stop. It now opens the WhatsApp
     * Broadcast tool with the at-risk customers already selected — or, when
     * WhatsApp isn't owned, sends the owner to the upgrade screen.
     */
    const handleReengage = () => {
        const atRisk = overview.metrics.filter(m => m.isChurnRisk && m.customer.phone?.trim()).map(m => m.customer.id);
        if (atRisk.length === 0) {
            notify(overview.churnCount > 0
                ? 'Your at-risk customers have no phone numbers on file — add one to reach them.'
                : 'No customers are at churn risk right now.', 'info');
            return;
        }
        if (!whatsappEntitled) { onUpgrade(); return; }
        setWaIntent(p => ({ tool: 'broadcast', customerIds: atRisk, n: (p?.n || 0) + 1 }));
        setSelectedId(null);
        setRewardsOpen(false);
        onNavigate('whatsapp');
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
                messagingEntitled={messagingEntitled}
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
    } else if (section === 'whatsapp') {
        content = (
            <CrmWhatsApp
                status={waInfo}
                statusLoading={waLoading}
                customers={customers}
                storeSettings={storeSettings}
                storeName={storeSettings?.name}
                canManage={canManage}
                intent={waIntent}
                onUpgrade={onUpgrade}
                onNotify={notify}
                onRefreshStatus={loadWaStatus}
            />
        );
    } else if (section === 'loyalty') {
        content = (
            <CrmLoyalty
                overview={overview}
                ledger={ledger}
                storeSettings={storeSettings}
                onConfigure={openRewardsSettings}
                onOpenCustomer={openCustomer}
            />
        );
    } else if (section === 'insights') {
        content = (
            <CrmInsights
                overview={overview}
                storeSettings={storeSettings}
                onReengage={handleReengage}
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
                    smsEntitled={smsEntitled}
                    smsDisplayName={smsInfo?.displayName ?? storeSettings?.name}
                    smsSenderId={smsInfo?.storeSenderId ?? null}
                    whatsappConfigured={waInfo?.configured ?? false}
                    whatsappEnabled={waInfo?.enabled ?? false}
                    whatsappEntitled={whatsappEntitled}
                    whatsappNumber={waInfo?.displayPhoneNumber}
                    onClose={() => setMessageTarget(null)}
                    onSent={handleSent}
                />
            )}

            {confirmDialog}
        </CrmShell>
    );
};

export default CrmApp;
