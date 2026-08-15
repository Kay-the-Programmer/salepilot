import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product, Sale, Customer, StoreSettings, User } from '../../types';
import { api } from '../../services/api';
import { DashboardShell, DashSection } from './DashboardShell';
import BizOverview from './BizOverview';
import BizSales from './BizSales';
import BizProducts from './BizProducts';
import { buildDashboard, DashRange, DashServerTotals, rangeDatePair } from './dashboardModel';
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

    // The period's "now" is PINNED, not read at render time. Open-ended presets
    // ("This Week" runs to the current instant) otherwise resolved to a slightly
    // different end on every render, so each render produced a new request URL
    // and the report table refetched in a loop. It is re-pinned when the period
    // changes, which is the only time the window is meant to move.
    const [now, setNow] = useState(() => Date.now());
    const firstRange = useRef(true);
    useEffect(() => {
        // The initial range is already pinned by useState — re-pinning it here
        // would fetch every window twice on mount.
        if (firstRange.current) { firstRange.current = false; return; }
        setNow(Date.now());
    }, [range]);

    // Period totals come from the server's aggregate report, which sees every
    // sale. The locally derived figures below are computed from GET /sales,
    // which the backend caps at the newest 1000 rows — so on a busy store
    // "This Year" was quietly under-reported with no warning. The local numbers
    // stay as the offline / no-permission fallback.
    const [serverTotals, setServerTotals] = useState<DashServerTotals | null>(null);
    useEffect(() => {
        let cancelled = false;
        const { current, prior, comparable } = rangeDatePair(range, now);
        const fetchWindow = async (w: { startDate: string; endDate: string }) => {
            const res = await api.get<any>(`/reports/dashboard?startDate=${encodeURIComponent(w.startDate)}&endDate=${encodeURIComponent(w.endDate)}`);
            return {
                revenue: Number(res?.sales?.totalRevenue) || 0,
                orders: Number(res?.sales?.totalTransactions) || 0,
            };
        };
        (async () => {
            try {
                const [cur, prev] = await Promise.all([
                    fetchWindow(current),
                    comparable ? fetchWindow(prior) : Promise.resolve({ revenue: 0, orders: 0 }),
                ]);
                if (!cancelled) setServerTotals({ revenue: cur.revenue, orders: cur.orders, prevRevenue: prev.revenue, prevOrders: prev.orders });
            } catch {
                // Offline, or a role without report permission — fall back to the
                // client-side figures rather than showing nothing.
                if (!cancelled) setServerTotals(null);
            }
        })();
        return () => { cancelled = true; };
    }, [range, now]);

    const overview = useMemo(
        () => buildDashboard(sales, products, customers, storeSettings, range, now, serverTotals),
        [sales, products, customers, storeSettings, range, now, serverTotals],
    );

    let content: React.ReactNode;
    if (section === 'sales') {
        content = (
            <BizSales
                overview={overview}
                storeSettings={storeSettings}
                range={range}
                onRange={setRange}
                now={now}
                onReports={onReports}
                preparedBy={user?.name}
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
