import React, { useMemo, useState } from 'react';
import { Product, Sale, Customer, StoreSettings, User } from '../../types';
import { DashboardShell, DashSection } from './DashboardShell';
import BizOverview from './BizOverview';
import BizSales from './BizSales';
import BizProducts from './BizProducts';
import { buildDashboard, DashRange } from './dashboardModel';
import { UpsellInline } from '../upsell/UpsellCard';
import '../crm/crm.css';
import './dash.css';

interface DashboardAppProps {
    section: DashSection;
    user: User;
    sales: Sale[];
    products: Product[];
    customers: Customer[];
    storeSettings: StoreSettings | null;
    onNavigate: (section: DashSection) => void;
    onReports: () => void;
    onExit: () => void;
    onLogout: () => void;
    onNewSale: () => void;
    onInventory: () => void;
    onOrders: () => void;
}

/**
 * Standalone Business Dashboard. A modern reskin of the /reports overview that
 * opens from the app switcher as its own focused app — every figure is derived live
 * from the sales / products / customers the host already loaded.
 */
export const DashboardApp: React.FC<DashboardAppProps> = ({
    section, user, sales, products, customers, storeSettings,
    onNavigate, onReports, onExit, onLogout,
    onNewSale, onInventory, onOrders,
}) => {
    const [range, setRange] = useState<DashRange>({ kind: 'preset', preset: 'week' });

    const overview = useMemo(
        () => buildDashboard(sales, products, customers, storeSettings, range),
        [sales, products, customers, storeSettings, range],
    );

    let content: React.ReactNode;
    if (section === 'sales') {
        content = (
            <BizSales
                overview={overview}
                storeSettings={storeSettings}
                range={range}
                onRange={setRange}
                onReports={onReports}
            />
        );
    } else if (section === 'products') {
        content = (
            <BizProducts
                overview={overview}
                storeSettings={storeSettings}
                range={range}
                onRange={setRange}
                onInventory={onInventory}
            />
        );
    } else {
        content = (
            <>
                {/* Daily-summary nudge slot (one max), shown on the day-summary card. */}
                <UpsellInline ids={['daily_summary_ai']} surface="daily_summary" placement="dashboard" className="mx-4 md:mx-6 mt-4" />
                <BizOverview
                    overview={overview}
                storeSettings={storeSettings}
                user={user}
                range={range}
                onRange={setRange}
                onViewSales={() => onNavigate('sales')}
                onViewProducts={() => onNavigate('products')}
                onNewSale={onNewSale}
                onInventory={onInventory}
                onOrders={onOrders}
                />
            </>
        );
    }

    return (
        <DashboardShell
            active={section}
            user={user}
            onNavigate={onNavigate}
            onReports={onReports}
            onExit={onExit}
            onLogout={onLogout}
        >
            {content}
        </DashboardShell>
    );
};

export default DashboardApp;
