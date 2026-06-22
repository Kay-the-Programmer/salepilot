import React, { useEffect, useMemo, useState } from 'react';
import { Product, Category, Sale, PurchaseOrder, StoreSettings, User } from '../../types';
import { Icon } from '../crm/CrmBits';
import { InventoryShell, InvSection } from './InventoryShell';
import InventoryDashboard from './InventoryDashboard';
import InventoryAlerts from './InventoryAlerts';
import { buildInventoryOverview } from './inventoryModel';
import '../crm/crm.css';
import './inventory.css';

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
    onDiscover: () => void;
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
    renderItems, onNavigate, onPos, onDiscover, onExit, onLogout, onGeneratePO,
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
            onDiscover={onDiscover}
            onExit={onExit}
            onLogout={onLogout}
        >
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
