import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { User } from '../types';

interface TourGuideProps {
    user: User;
    run?: boolean; // Optional prop to force run
    page?: 'dashboard' | 'sales'; // Differentiate tours
    onTourEnd?: () => void;
}

// Velocity POS palette
const SP_GREEN = '#002b6b';
const SP_INK = '#181c1e';
const SP_MUTED = '#6b6b78';
const SP_SUBTLE = '#9a9aa6';

export default function TourGuide({ user, run: propsRun, page = 'dashboard', onTourEnd }: TourGuideProps) {
    const [run, setRun] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // If propsRun is explicitly true, run the tour (manual trigger)
        if (propsRun) {
            setRun(true);
            return;
        }
        // Otherwise, only run if they haven't seen it and propsRun isn't false
        const tourKey = page === 'dashboard' ? `salePilot.tourSeen.${user.id}` : `salePilot.tourSeen.${page}.${user.id}`;
        const hasSeenTour = localStorage.getItem(tourKey) === 'true';
        setRun(hasSeenTour ? false : propsRun !== false);
    }, [user.id, propsRun, page]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRun(false);
            const tourKey = page === 'dashboard' ? `salePilot.tourSeen.${user.id}` : `salePilot.tourSeen.${page}.${user.id}`;
            localStorage.setItem(tourKey, 'true');
            if (onTourEnd) onTourEnd();
        }
    };

    const desktopSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Welcome to SalePilot! 🚀</h3>
                    <p>Let's take a quick tour to help you get started with your new POS and Inventory management system.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#app-sidebar',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Navigation Sidebar</h3>
                    <p>This is your main navigation hub. Access all your modules here, including Sales, Inventory, Reports, and Settings.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-reports',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Dashboard & Reports</h3>
                    <p>Get a bird's-eye view of your business performance, sales metrics, and low stock alerts right here.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-sales',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Point of Sale</h3>
                    <p>Process sales quickly and efficiently. Compatible with barcode scanners and receipt printers.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-inventory',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Inventory Management</h3>
                    <p>Track your stock levels, manage suppliers, and organize categories.</p>
                    <p className="mt-2 text-sm p-2 rounded-lg italic" style={{ color: SP_GREEN, background: 'rgba(0,128,96,0.08)', border: '1px solid rgba(0,128,96,0.18)' }}>
                        💡 Tip: Click here to view your products. On the Inventory page, click <strong>"Add Product"</strong> in the top right to create new items.
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-profile-section',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Your Profile</h3>
                    <p>Manage your account settings, switch stores (if you have multiple), and log out from here.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">You're All Set!</h3>
                    <p>Explore the app and enjoy using SalePilot. If you need help, check the documentation or contact support.</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    const mobileSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Welcome to SalePilot! 🚀</h3>
                    <p>Let's take a quick tour to help you get started with your new POS and Inventory management system.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#mobile-menu-toggle',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Main Menu</h3>
                    <p>Tap here to access all modules including Dashboard, POS, Inventory, and Settings.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">You're All Set!</h3>
                    <p>Tap the menu button to start exploring features. Enjoy using SalePilot!</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    // POS tour — targets elements that exist in the redesigned POS on both
    // desktop and mobile (search, category strip, catalog, held sales).
    const salesSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Point of Sale Tour 🛒</h3>
                    <p>Welcome to the POS terminal — where you build orders and take payments.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#pos-search',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Find Products</h3>
                    <p>Search by name, SKU or barcode — or use a hardware scanner to add items instantly.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '.sale__chips',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Browse by Category</h3>
                    <p>Swipe through categories to filter the catalog. Tap <strong>Scan</strong> to focus the scanner.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '#pos-product-list',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Product Catalog</h3>
                    <p>Tap any product to add it to the current sale. The cart updates live on the right.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-menu-btn',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">POS Menu</h3>
                    <p>Open the menu to view <strong>Sales History</strong>, process refunds, recall <strong>Held Sales</strong>, or replay this guide.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Take Payment</h3>
                    <p>Add items, hit <strong>Process Payment</strong>, pick a method, and you're done. Enjoy SalePilot!</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    const getSteps = () => {
        if (page === 'sales') return salesSteps;
        return isMobile ? mobileSteps : desktopSteps;
    };

    return (
        <Joyride
            steps={getSteps()}
            run={run}
            continuous
            showProgress
            showSkipButton
            locale={{ last: 'Done' }}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: SP_GREEN,
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                    textColor: SP_INK,
                    width: 340,
                },
                tooltip: {
                    borderRadius: 18,
                    padding: 20,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    boxShadow: '0 12px 28px rgba(26,26,46,0.18)',
                },
                tooltipContent: { padding: '4px 0 8px', color: SP_MUTED, lineHeight: 1.5 },
                buttonNext: {
                    backgroundColor: SP_GREEN,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 14,
                    padding: '10px 18px',
                },
                buttonBack: { color: SP_MUTED, fontWeight: 600, marginRight: 8 },
                buttonSkip: { color: SP_SUBTLE, fontWeight: 600 },
                spotlight: { borderRadius: 14 },
            }}
            spotlightPadding={6}
            spotlightClicks={true}
            floaterProps={{ disableAnimation: true }}
        />
    );
}
