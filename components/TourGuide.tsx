import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { User } from '../types';

/**
 * First-visit walkthrough of the POS terminal (react-joyride).
 *
 * Runs automatically the first time a user opens the register (tracked per
 * user in localStorage) and can be replayed from the POS menu ("Replay guide")
 * via the `run` prop. Every step targets an element that exists in the
 * redesigned POS on both desktop and mobile — keep targets in sync with
 * SalesPage ids: #pos-search, #pos-product-list, #pos-cart, #pos-menu-btn.
 */
interface TourGuideProps {
    user: User;
    /** Force-run the tour (replay). Auto-runs on first visit regardless. */
    run?: boolean;
    onTourEnd?: () => void;
}

// Velocity POS palette
const SP_NAVY = '#002b6b';
const SP_INK = '#181c1e';
const SP_MUTED = '#6b6b78';
const SP_SUBTLE = '#9a9aa6';

const TOUR_KEY = (userId: string) => `salePilot.tourSeen.sales.${userId}`;

export default function TourGuide({ user, run: forceRun, onTourEnd }: TourGuideProps) {
    const [run, setRun] = useState(false);

    useEffect(() => {
        if (forceRun) {
            setRun(true);
            return;
        }
        // First visit: run automatically until finished or skipped once.
        const hasSeenTour = localStorage.getItem(TOUR_KEY(user.id)) === 'true';
        if (!hasSeenTour) setRun(true);
    }, [user.id, forceRun]);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem(TOUR_KEY(user.id), 'true');
            if (onTourEnd) onTourEnd();
        }
    };

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Point of Sale Tour 🛒</h3>
                    <p>Welcome to the POS terminal — where you build orders and take payments. This takes under a minute.</p>
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
            target: '#pos-product-list',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Product Catalog</h3>
                    <p>Tap any product to add it to the current sale. Tap again to increase the quantity.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '#pos-cart',
            content: (
                <div>
                    <h3 className="font-extrabold text-lg mb-2">Current Sale</h3>
                    <p>Items you add appear here. Attach a customer, adjust quantities, then hit <strong>Process Payment</strong> to check out.</p>
                </div>
            ),
            placement: 'left',
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
                    <h3 className="font-extrabold text-lg mb-2">You're Ready!</h3>
                    <p>Add items, hit <strong>Process Payment</strong>, pick a method, and you're done. Enjoy SalePilot!</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            locale={{ last: 'Done' }}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: SP_NAVY,
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
                    backgroundColor: SP_NAVY,
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
