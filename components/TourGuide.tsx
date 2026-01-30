import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { User } from '../types';

interface TourGuideProps {
    user: User;
    run?: boolean; // Optional prop to force run
    page?: 'dashboard' | 'sales'; // New prop to differentiate tours
    onTourEnd?: () => void;
}

export default function TourGuide({ user, run: propsRun, page = 'dashboard', onTourEnd }: TourGuideProps) {
    const [run, setRun] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // specific check for mobile screens
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // If propsRun is explicitly true, we want to run the tour (manual trigger)
        if (propsRun) {
            setRun(true);
            return;
        }

        // Otherwise, only run if they haven't seen it and propsRun isn't false
        const tourKey = page === 'dashboard' ? `salePilot.tourSeen.${user.id}` : `salePilot.tourSeen.${page}.${user.id}`;
        const hasSeenTour = localStorage.getItem(tourKey) === 'true';

        if (hasSeenTour) {
            setRun(false);
        } else {
            setRun(propsRun !== false);
        }
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
                    <h3 className="font-bold text-lg mb-2">Welcome to SalePilot! 🚀</h3>
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
                    <h3 className="font-bold text-lg mb-2">Navigation Sidebar</h3>
                    <p>This is your main navigation hub. Access all your modules here, including Sales, Inventory, Reports, and Settings.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-reports',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Dashboard & Reports</h3>
                    <p>Get a bird's-eye view of your business performance, sales metrics, and low stock alerts right here.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-sales',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Point of Sale</h3>
                    <p>Process sales quickly and efficiently. Compatible with barcode scanners and receipt printers.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-nav-inventory',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Inventory Management</h3>
                    <p>Track your stock levels, manage suppliers, and organize categories.</p>
                    <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 italic">
                        💡 Tip: Click here to view your products. Once on the Inventory page, click the <strong>"Add Product"</strong> button in the top right to create new items.
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '#sidebar-profile-section',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Your Profile</h3>
                    <p>Manage your account settings, switch stores (if you have multiple), and log out from here.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">You're All Set!</h3>
                    <p>Explore the app and enjoy using SalePilot. If you need help, check the documentation or contact support.</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    const desktopSalesSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Point of Sale Tour 🛒</h3>
                    <p>Welcome to the POS terminal. This is where you process sales and manage transactions.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#pos-search-container',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Find Products</h3>
                    <p>Search for products by name, SKU, or barcode here.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '#pos-view-toggle',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">View Toggle</h3>
                    <p>Switch between Grid and List view based on your preference.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '#pos-product-list',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Product Catalog</h3>
                    <p>Tap any product to add it to your shopping cart.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-cart-items',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Shopping Cart</h3>
                    <p>View all items currently in the cart. You can adjust quantities or remove items here.</p>
                </div>
            ),
            placement: 'left',
        },
        {
            target: '#pos-scanner-btn',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Barcode Scanner</h3>
                    <p>Enable the camera to scan product barcodes directly into the cart.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-tab-customer',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Customer Selection</h3>
                    <p>Assign a customer to the sale to track history or apply store credit.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-tab-summary',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Order Summary</h3>
                    <p>Add discounts and review tax calculations before finalizing.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-tab-payment',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Payment Details</h3>
                    <p>Select the payment method and enter cash received if applicable.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-pay-btn',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Finalize Sale</h3>
                    <p>Click here to complete the transaction and generate a receipt.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-hold-btn',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Hold Sale</h3>
                    <p>Pause this sale for later. You can recall it anytime from the "Held Sales" button.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-held-btn',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Recall Held Sales</h3>
                    <p>Access your suspended transactions here.</p>
                </div>
            ),
            placement: 'bottom',
        },
    ];

    const mobileSalesSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">POS Mobile Tour 🛒</h3>
                    <p>Welcome! This terminal is optimized for your mobile device.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#pos-mobile-header',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">App Menu</h3>
                    <p>Tap here to access the main navigation and switch between modules.</p>
                </div>
            ),
            placement: 'bottom',
            disableScrolling: true,
        },
        {
            target: '#pos-mobile-help-btn',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Help Guide</h3>
                    <p>Tap this icon anytime to restart this tour and learn about POS features.</p>
                </div>
            ),
            placement: 'bottom',
            disableScrolling: true,
        },
        {
            target: '#pos-mobile-search-container',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Find Products</h3>
                    <p>Search for items quickly using the search bar.</p>
                </div>
            ),
            placement: 'bottom',
            disableScrolling: true,
        },
        {
            target: '#pos-mobile-product-list',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Product Grid</h3>
                    <p>Tap products to add them to your cart instantly.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-mobile-scanner-fab',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Quick Scan</h3>
                    <p>Use your camera to scan barcodes and add products even faster.</p>
                </div>
            ),
            placement: 'top',
            disableScrolling: true,
        },
        {
            target: '#pos-mobile-cart-fab',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">View Cart</h3>
                    <p>Tap here to review your items, adjust quantities, and proceed to checkout.</p>
                </div>
            ),
            placement: 'top',
            disableScrolling: true,
        },
        {
            target: '#pos-mobile-held-fab',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Held Sales</h3>
                    <p>Access your paused transactions here on mobile.</p>
                </div>
            ),
            placement: 'top',
            disableScrolling: true,
        },
    ];

    const mobileSteps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Welcome to SalePilot! 🚀</h3>
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
                    <h3 className="font-bold text-lg mb-2">Main Menu</h3>
                    <p>Tap here to access all modules including Dashboard, POS, Inventory, and Settings.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">You're All Set!</h3>
                    <p>Tap the menu button to start exploring features. Enjoy using SalePilot!</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    const getSteps = () => {
        if (page === 'sales') {
            return isMobile ? mobileSalesSteps : desktopSalesSteps;
        }
        return isMobile ? mobileSteps : desktopSteps;
    };

    return (
        <Joyride
            steps={getSteps()}
            run={run}
            continuous
            showProgress
            showSkipButton
            locale={{ last: 'Okay' }}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#3B82F6', // Blue-500
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                    textColor: '#333333',
                },
                buttonNext: {
                    backgroundColor: '#3B82F6',
                },
                buttonBack: {
                    color: '#3B82F6',
                },
                spotlight: {
                    borderRadius: 12,
                }
            }}
            spotlightPadding={5}
            spotlightClicks={true}
            floaterProps={{
                disableAnimation: true,
            }}
        />
    );
}
