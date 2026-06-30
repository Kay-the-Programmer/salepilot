import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, Sale, PurchaseOrder, StoreSettings, User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { InventoryShell, InvSection } from './InventoryShell';
import InventoryDashboard from './InventoryDashboard';
import InventoryAlerts from './InventoryAlerts';
import { buildInventoryOverview } from './inventoryModel';
import { hasModule, MODULES, FREE_PRODUCT_LIMIT } from '../../utils/entitlements';
import { UpsellInline } from '../upsell/UpsellCard';
import '../crm/crm.css';
import './inventory.css';

/**
 * Proactive freemium product-cap meter. Appears as the store approaches the free
 * limit and turns into a hard "limit reached" prompt at the cap, deep-linking to
 * the Unlimited Products add-on. Hidden when the store already has it.
 */
const ProductCapBanner: React.FC<{ count: number; storeSettings: StoreSettings | null }> = ({ count, storeSettings }) => {
    const navigate = useNavigate();
    if (hasModule(storeSettings, MODULES.UNLIMITED_PRODUCTS)) return null;
    if (count < Math.floor(FREE_PRODUCT_LIMIT * 0.8)) return null; // only nudge near the cap

    const reached = count >= FREE_PRODUCT_LIMIT;
    const pct = Math.min(100, Math.round((count / FREE_PRODUCT_LIMIT) * 100));
    const goUnlock = () => navigate(`/subscription?view=addons&module=${MODULES.UNLIMITED_PRODUCTS}`);

    return (
        <div style={{ margin: '0 16px 12px', padding: '14px 16px', borderRadius: 16, border: '1px solid var(--c-outline-variant)', background: reached ? 'var(--c-error-container, #fde7e7)' : 'var(--c-surface-container, #f6f3ee)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-on-surface)' }}>
                        {reached ? "You've reached your product limit" : 'Approaching your product limit'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--c-on-surface-variant)' }}>
                        {count} of {FREE_PRODUCT_LIMIT} products used{reached ? ' — unlock Unlimited Products to add more.' : '.'}
                    </div>
                </div>
                <button type="button" onClick={goUnlock} className="crm-btn crm-btn--filled" style={{ whiteSpace: 'nowrap' }}>
                    <Icon name="bolt" size={18} /> Get Unlimited
                </button>
            </div>
            <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'var(--c-surface-high, #e7e2da)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: reached ? 'var(--c-error, #c8372d)' : 'var(--c-primary, #2f7d52)', transition: 'width .3s' }} />
            </div>
        </div>
    );
};

interface InventoryAppProps {
    section: InvSection;
    user: User;
    products: Product[];
    categories: Category[];
    sales: Sale[];
    purchaseOrders: PurchaseOrder[];
    storeSettings: StoreSettings | null;
    /** Render the existing InventoryPage (full management UI) for the items tab. */
    renderItems: () => React.ReactNode;
    onNavigate: (section: InvSection) => void;
    onPos: () => void;
    onExit: () => void;
    onLogout: () => void;
    onGeneratePO: () => void;
}

/**
 * Standalone Inventory Manager. The dashboard + alerts derive from live
 * products / sales / purchase orders; the "Inventory" tab reuses the existing
 * InventoryPage so all management (add/edit/stock/PO/categories) is unchanged.
 */
export const InventoryApp: React.FC<InventoryAppProps> = ({
    section, user, products, categories, sales, purchaseOrders, storeSettings,
    renderItems, onNavigate, onPos, onExit, onLogout, onGeneratePO,
}) => {
    const [toast, setToast] = useState<string | null>(null);
    const notify = (msg: string) => setToast(msg);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    const overview = useMemo(
        () => buildInventoryOverview(products, categories, sales, purchaseOrders, storeSettings),
        [products, categories, sales, purchaseOrders, storeSettings],
    );

    let content: React.ReactNode;
    if (section === 'items') {
        content = renderItems();
    } else if (section === 'alerts') {
        content = (
            <InventoryAlerts
                overview={overview}
                storeSettings={storeSettings}
                onGeneratePO={onGeneratePO}
                onViewItems={() => onNavigate('items')}
            />
        );
    } else {
        content = (
            <InventoryDashboard
                overview={overview}
                storeSettings={storeSettings}
                onAddItem={() => onNavigate('items')}
                onViewItems={() => onNavigate('items')}
                onViewAlerts={() => onNavigate('alerts')}
                onGeneratePO={onGeneratePO}
                onNotify={notify}
            />
        );
    }

    return (
        <InventoryShell
            active={section}
            user={user}
            onNavigate={onNavigate}
            onPos={onPos}
            onExit={onExit}
            onLogout={onLogout}
        >
            <ProductCapBanner count={products.length} storeSettings={storeSettings} />
            {/* Contextual inline upsell — stockouts / heavy manual entry. The product
                cap is handled by the richer ProductCapBanner meter above. */}
            <UpsellInline ids={['stockout_repeat', 'bulk_manual_adds']} className="mx-4 mb-3" />
            {content}

            {toast && (
                <div className="crm-toast" role="status">
                    <Icon name="check_circle" size={20} fill={1} />
                    {toast}
                </div>
            )}
        </InventoryShell>
    );
};

export default InventoryApp;
