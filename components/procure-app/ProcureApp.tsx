import React, { useMemo, useState } from 'react';
import { Supplier, Product, Category, PurchaseOrder, SupplierInvoice, StoreSettings, User } from '../../types';
import { ProcureShell, ProcSection } from './ProcureShell';
import ProcureDashboard from './ProcureDashboard';
import ProcureSuppliers from './ProcureSuppliers';
import ProcureOrders from './ProcureOrders';
import PurchaseOrdersApp from '../../pages/purchase-orders/PurchaseOrdersApp';
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
    categories: Category[];
    purchaseOrders: PurchaseOrder[];
    supplierInvoices: SupplierInvoice[];
    storeSettings: StoreSettings | null;
    onSaveSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (supplierId: string) => void;
    onSavePurchaseOrder: (po: PurchaseOrder) => void;
    onDeletePurchaseOrder: (poId: string) => void;
    onReceivePOItems: (poId: string, items: { productId: string; quantity: number }[]) => void;
    onSaveProduct: (product: Product | Omit<Product, 'id'>) => Promise<Product>;
    showSnackbar: (message: string, type?: any) => void;
    onNavigate: (section: ProcSection) => void;
    onExit: () => void;
    onLogout: () => void;
}

/**
 * Standalone Purchase Orders hub (formerly "Procurement Hub"). The dashboard
 * derives from live suppliers / purchase orders / supplier invoices; the
 * Suppliers and Orders tabs reuse the existing management pages, and the Order
 * Lists tab embeds the former standalone /po app.
 */
export const ProcureApp: React.FC<ProcureAppProps> = ({
    section, user, suppliers, products, categories, purchaseOrders, supplierInvoices, storeSettings,
    onSaveSupplier, onDeleteSupplier, onSavePurchaseOrder, onDeletePurchaseOrder, onReceivePOItems, onSaveProduct, showSnackbar,
    onNavigate, onExit, onLogout,
}) => {
    const [draftSupplierId, setDraftSupplierId] = useState<string | null>(null);
    const [autoSignal, setAutoSignal] = useState(false);
    // A PO drafted from an order list, opened in the Orders form so the user
    // assigns a supplier there — the backend requires one, so we never save
    // a supplier-less PO directly.
    const [listDraftPo, setListDraftPo] = useState<PurchaseOrder | null>(null);
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
                importedDraft={listDraftPo}
                onConsumeImportedDraft={() => setListDraftPo(null)}
            />
        );
    } else if (section === 'lists') {
        content = (
            <PurchaseOrdersApp
                embedded
                purchaseOrders={purchaseOrders}
                products={products}
                categories={categories}
                storeSettings={storeSettings!}
                onSaveProduct={onSaveProduct}
                showSnackbar={showSnackbar}
                onCreatePurchaseOrder={(po) => { setListDraftPo(po); onNavigate('orders'); }}
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
