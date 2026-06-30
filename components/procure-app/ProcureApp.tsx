import React, { useMemo, useState } from 'react';
import { Supplier, Product, PurchaseOrder, SupplierInvoice, StoreSettings, User } from '../../types';
import { ProcureShell, ProcSection } from './ProcureShell';
import ProcureDashboard from './ProcureDashboard';
import ProcureSuppliers from './ProcureSuppliers';
import ProcureOrders from './ProcureOrders';
import PremiumUpgradeModal from '../ui/PremiumUpgradeModal';
import { hasModule, MODULES } from '../../utils/entitlements';
import { buildProcureOverview, generateReorderDrafts } from './procureModel';
import '../crm/crm.css';
import './procure.css';

interface ProcureAppProps {
    section: ProcSection;
    user: User;
    suppliers: Supplier[];
    products: Product[];
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    storeSettings: StoreSettings | null;
    onSaveSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: string) => void;
    onSavePurchaseOrder: (po: PurchaseOrder) => void;
    onDeletePurchaseOrder: (poId: string) => void;
    onReceivePOItems: (poId: string, items: { productId: string; quantity: number }[]) => void;
    showSnackbar: (message: string, type?: any) => void;
    onNavigate: (section: ProcSection) => void;
    onExit: () => void;
    onLogout: () => void;
}

/**
 * Standalone Supplier & Procurement Hub. The dashboard derives from live
 * suppliers / purchase orders / supplier invoices; the Suppliers and Orders
 * tabs reuse the existing management pages unchanged.
 */
export const ProcureApp: React.FC<ProcureAppProps> = ({
    section, user, suppliers, products, purchaseOrders, supplierInvoices, storeSettings,
    onSaveSupplier, onDeleteSupplier, onSavePurchaseOrder, onDeletePurchaseOrder, onReceivePOItems, showSnackbar,
    onNavigate, onExit, onLogout,
}) => {
    const [draftSupplierId, setDraftSupplierId] = useState<string | null>(null);
    const [autoSignal, setAutoSignal] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const autoReorderEntitled = hasModule(storeSettings, MODULES.AUTO_REORDER);

    const overview = useMemo(
        () => buildProcureOverview(suppliers, purchaseOrders, supplierInvoices, Date.now()),
        [suppliers, purchaseOrders, supplierInvoices],
    );

    const reorderCount = useMemo(
        () => generateReorderDrafts(products, suppliers, storeSettings).reduce((n, d) => n + d.items.length, 0),
        [products, suppliers, storeSettings],
    );

    const placeOrder = (supplierId?: string) => { setDraftSupplierId(supplierId ?? null); onNavigate('orders'); };
    const autoReorder = () => {
        if (!autoReorderEntitled) { setUpgradeOpen(true); return; }
        setAutoSignal(true);
        onNavigate('orders');
    };

    let content: React.ReactNode;
    if (section === 'suppliers') {
        content = (
            <ProcureSuppliers
                suppliers={suppliers}
                products={products}
                purchaseOrders={purchaseOrders}
                supplierInvoices={supplierInvoices}
                storeSettings={storeSettings}
                onSaveSupplier={onSaveSupplier}
                onDeleteSupplier={onDeleteSupplier}
                onPlaceOrder={placeOrder}
            />
        );
    } else if (section === 'orders') {
        content = (
            <ProcureOrders
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
                products={products}
                storeSettings={storeSettings!}
                onSave={onSavePurchaseOrder}
                onDelete={onDeletePurchaseOrder}
                onReceiveItems={onReceivePOItems}
                showSnackbar={showSnackbar}
                draftSupplierId={draftSupplierId}
                onConsumeDraft={() => setDraftSupplierId(null)}
                autoGenerate={autoSignal}
                onConsumeAutoGenerate={() => setAutoSignal(false)}
                autoReorderEntitled={autoReorderEntitled}
                onRequireUpgrade={() => setUpgradeOpen(true)}
            />
        );
    } else {
        content = (
            <ProcureDashboard
                overview={overview}
                storeSettings={storeSettings}
                reorderCount={reorderCount}
                onNewOrder={() => onNavigate('orders')}
                onViewSuppliers={() => onNavigate('suppliers')}
                onViewOrders={() => onNavigate('orders')}
                onAutoReorder={autoReorder}
                autoReorderEntitled={autoReorderEntitled}
            />
        );
    }

    return (
        <ProcureShell
            active={section}
            user={user}
            onNavigate={onNavigate}
            onExit={onExit}
            onLogout={onLogout}
        >
            {content}

            <PremiumUpgradeModal
                isOpen={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                title="Unlock Auto Reorder"
                description="Let SalePilot generate purchase orders automatically from your low-stock items. A premium add-on you can unlock for a small monthly fee."
                bullets={[
                    'One-tap reorder drafts, grouped by supplier',
                    'Suggested quantities from your reorder points',
                    'You still review and place every order',
                ]}
            />
        </ProcureShell>
    );
};

export default ProcureApp;
