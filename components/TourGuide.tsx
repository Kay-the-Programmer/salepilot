import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { User } from '../types';

interface TourGuideProps {
    user: User;
    run?: boolean; // Optional prop to force run, though we'll mainly use local state
}

export default function TourGuide({ user }: TourGuideProps) {
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
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem(`salePilot.tourSeen.${user.id}`);
        if (!hasSeenTour) {
            setRun(true);
        }
    }, [user.id]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem(`salePilot.tourSeen.${user.id}`, 'true');
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

    return (
        <Joyride
            steps={isMobile ? mobileSteps : desktopSteps}
            run={run}
            continuous
            showProgress
            showSkipButton
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
                }
            }}
            floaterProps={{
                disableAnimation: true,
            }}
        />
    );
}
