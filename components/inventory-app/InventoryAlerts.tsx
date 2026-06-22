import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { Icon } from '../crm/CrmBits';
import { num } from '../crm/crmModel';
import { hasModule, MODULES } from '../../utils/entitlements';
import PremiumUpgradeModal from '../ui/PremiumUpgradeModal';
import { InventoryOverview, thresholdFor } from './inventoryModel';

interface InventoryAlertsProps {
    overview: InventoryOverview;
    storeSettings?: StoreSettings | null;
    onGeneratePO: () => void;
    onViewItems: () => void;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ overview, storeSettings, onGeneratePO, onViewItems }) => {
    const { lowStockItems, lowStockCount, outOfStockCount, criticalCount } = overview;

    // Auto-generating purchase orders from low-stock alerts is a premium add-on.
    const poUnlocked = hasModule(storeSettings, MODULES.AUTO_REORDER);
    const [showUpsell, setShowUpsell] = useState(false);

    return (
        <main className="crm-main crm-section-fade">
            <div className="crm-pagehead" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h2 className="crm-pagehead__title">Inventory Alerts</h2>
                    <p className="crm-pagehead__sub">{lowStockCount} item{lowStockCount === 1 ? '' : 's'} at or below their reorder point.</p>
                </div>
                {lowStockCount > 0 && (
                    <button
                        className="crm-btn crm-btn--filled"
                        type="button"
                        onClick={() => (poUnlocked ? onGeneratePO() : setShowUpsell(true))}
                        title={poUnlocked ? undefined : 'Premium add-on — tap to unlock'}
                    >
                        <Icon name={poUnlocked ? 'shopping_cart' : 'lock'} size={20} /> Generate PO
                        {!poUnlocked && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4, padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#ffe2b8', color: '#8a5a00' }}>
                                Premium
                            </span>
                        )}
                    </button>
                )}
            </div>

            <div className="crm-bento crm-bento--3" style={{ marginBottom: 24 }}>
                <div className="crm-stat"><div><p className="crm-stat__label">Low stock</p><p className="crm-stat__value">{lowStockCount}</p></div></div>
                <div className="crm-stat"><div><p className="crm-stat__label">Critical</p><p className="crm-stat__value">{criticalCount}</p></div></div>
                <div className="crm-stat"><div><p className="crm-stat__label">Out of stock</p><p className="crm-stat__value">{outOfStockCount}</p></div></div>
            </div>

            <div className="crm-panel">
                <div className="crm-panel__head">
                    <h3 className="crm-panel__title">Items needing attention</h3>
                    <button className="crm-link" type="button" onClick={onViewItems}>Open inventory</button>
                </div>
                {lowStockItems.length === 0 ? (
                    <div className="crm-empty" style={{ padding: '48px 16px' }}>
                        <Icon name="task_alt" size={40} />
                        <p className="crm-empty__title">All stocked up</p>
                        <p className="crm-empty__text">No items are below their reorder point right now.</p>
                    </div>
                ) : (
                    <div>
                        {lowStockItems.map(p => {
                            const stock = num(p.stock);
                            const thr = thresholdFor(p, storeSettings);
                            const out = stock <= 0;
                            return (
                                <div key={p.id} className="inv-stock-row">
                                    <div className="inv-stock-row__left">
                                        <span className="inv-thumb">
                                            {p.imageUrls?.[0] ? <img src={p.imageUrls[0]} alt={p.name} /> : <Icon name="inventory_2" size={22} />}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <p className="inv-stock-row__name">{p.name}</p>
                                            <p className="inv-stock-row__sku">SKU {p.sku} · reorder at {thr}</p>
                                        </div>
                                    </div>
                                    <span className={`inv-stock-pill ${out ? 'inv-stock-pill--out' : 'inv-stock-pill--low'}`}>
                                        {out ? 'Out of stock' : `${stock} left`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <PremiumUpgradeModal
                isOpen={showUpsell}
                onClose={() => setShowUpsell(false)}
                title="Unlock Smart Reorder"
                description="Turn low-stock alerts into ready-to-send purchase orders in one tap — a premium add-on you can unlock for a small monthly fee."
                bullets={[
                    'Auto-build POs from items below their reorder point',
                    'Group by supplier with suggested quantities',
                    'Restock before you run out of bestsellers',
                ]}
            />
        </main>
    );
};

export default InventoryAlerts;
