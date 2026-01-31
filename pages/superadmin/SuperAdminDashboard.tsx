import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { RevenueSummary, StoreStats } from '../../types';

// Components
import WelcomeHero from '../../components/superadmin/dashboard/WelcomeHero';
import DashboardStatsGrid from '../../components/superadmin/dashboard/DashboardStatsGrid';
import DashboardQuickActions from '../../components/superadmin/dashboard/DashboardQuickActions';
import DashboardRevenueChart from '../../components/superadmin/dashboard/DashboardRevenueChart';
import { SuperAdminAiCard } from '../../components/superadmin/dashboard/SuperAdminAiCard';
import LiveRobot from '../../components/superadmin/dashboard/LiveRobot';

const SuperAdminDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [revSummary, setRevSummary] = useState<RevenueSummary | null>(null);
    const [storeStats, setStoreStats] = useState<StoreStats>({
        total: 0,
        active: 0,
        trial: 0,
        inactive: 0
    });

    // ROBOT DUO STATE
    const [scoutState, setScoutState] = useState<{
        x: number | string;
        y: number | string;
        scale: number;
        isScanning: boolean;
        speech: string | null;
        mode: 'PATROL' | 'RETURN' | 'IDLE';
    }>({
        x: '85%',
        y: '80px', // Near Commander initially
        scale: 0.8,
        isScanning: false,
        speech: null,
        mode: 'IDLE'
    });

    const [commanderSpeech, setCommanderSpeech] = useState<string | null>(null);
    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

    const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [revResp, storesResp] = await Promise.all([
                    api.get<{ summary: RevenueSummary }>("/superadmin/revenue/summary"),
                    api.get<{ stores: any[] }>("/superadmin/stores")
                ]);

                setRevSummary(revResp.summary);
                const stores = storesResp.stores || [];
                setStoreStats({
                    total: stores.length,
                    active: stores.filter((s: any) => s.status === 'active').length,
                    trial: stores.filter((s: any) => s.subscriptionStatus === 'trial').length,
                    inactive: stores.filter((s: any) => s.status === 'inactive').length
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // ROBOT ORCHESTRATION
    useEffect(() => {
        if (loading) return;

        const cardIds = ['revenue', 'active_stores', 'trial_stores', 'total_stores'];
        const COMMANDER_POS = { x: '92%', y: '60px' }; // Top right

        // Helper to delay
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

        const runPatrolMission = async () => {
            // 1. Commander Orders
            setCommanderSpeech("Unit Beta, scan sector 7.");
            await wait(2000);
            setCommanderSpeech(null);

            // 2. Scout Acknowledges & Moves
            setScoutState(prev => ({ ...prev, speech: "Affirmative.", mode: 'PATROL' }));
            await wait(1500);
            setScoutState(prev => ({ ...prev, speech: null }));

            // 3. Move to Random Card
            const targetId = cardIds[Math.floor(Math.random() * cardIds.length)];
            const card = cardRefs.current[targetId];
            const container = containerRef.current;

            if (card && container) {
                const cardRect = card.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                // We need viewport relative coordinates for fixed positioning to work seamlessly OR container relative.
                // Actually, let's use fixed positioning for robots to break out of container overflow if any.
                // But previously we used absolute relative to container. Let's stick to absolute relative to container for scroll behavior.
                // WAIT, User asked for "Sticky". So robots should be FIXED position.

                const targetX = cardRect.right - 60; // Screen coords
                const targetY = cardRect.top - 80;

                setScoutState(prev => ({
                    ...prev,
                    x: targetX, // This needs to be window-relative (fixed)
                    y: targetY,
                    scale: 0.6,
                    isScanning: false
                }));
            }

            // 4. Arrive & Scan
            await wait(1000); // Flight time
            setFlippedCardId(targetId);
            setScoutState(prev => ({ ...prev, isScanning: true }));

            await wait(4000); // Scan time

            // 5. Scan Complete & Return
            setScoutState(prev => ({ ...prev, isScanning: false }));
            setFlippedCardId(null);

            // Move back to Commander
            setScoutState(prev => ({
                ...prev,
                x: '85%', // Relative to viewport width
                y: '100px',
                scale: 0.8,
                mode: 'RETURN'
            }));

            await wait(1200); // Return flight

            // 6. Report Back
            setScoutState(prev => ({ ...prev, speech: "Data anomalies within parameters." }));
            await wait(2500);
            setScoutState(prev => ({ ...prev, speech: null }));

            setCommanderSpeech("Good work. Stand by.");
            await wait(2000);
            setCommanderSpeech(null);
        };

        const loop = setInterval(() => {
            if (Math.random() > 0.4) { // Random chance to start missions
                runPatrolMission();
            }
        }, 15000);

        return () => clearInterval(loop);
    }, [loading]);


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 transition-colors duration-300">
                <div className="animate-pulse flex items-center justify-center h-screen">
                    <div className="text-white">Loading System...</div>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-screen bg-slate-950 transition-colors duration-300 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200 relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
            </div>

            {/* --- ROBOT LAYER (FIXED POSITION) --- */}

            {/* 1. Commander (Sticky Top Right) */}
            <div className="fixed top-8 right-8 z-50 pointer-events-none hidden lg:block">
                <LiveRobot
                    style={{ width: '180px', height: '180px' }}
                    speech={commanderSpeech}
                />
            </div>

            {/* 2. Scout (Patrolling) */}
            <div
                className="fixed z-50 pointer-events-none transition-all duration-1000 ease-in-out"
                style={{
                    left: scoutState.x,
                    top: scoutState.y,
                    transform: `scale(${scoutState.scale})`,
                }}
            >
                <LiveRobot
                    isScanning={scoutState.isScanning}
                    speech={scoutState.speech}
                    className="drop-shadow-2xl"
                />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Section */}
                <div className="relative">
                    <WelcomeHero
                        userName="Super Admin"
                        stats={{
                            totalRevenue: formatCurrency(revSummary?.totalAmount || 0),
                            activeStores: storeStats.active
                        }}
                    />
                </div>

                {/* Stats Grid */}
                <DashboardStatsGrid
                    revSummary={revSummary}
                    storeStats={storeStats}
                    formatCurrency={formatCurrency}
                    cardRefs={cardRefs}
                    flippedCardId={flippedCardId}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Revenue Chart - Taking up 2 columns */}
                    <div className="lg:col-span-2">
                        <DashboardRevenueChart
                            revSummary={revSummary}
                            formatCurrency={formatCurrency}
                        />
                    </div>

                    {/* Quick Actions - Taking up 1 column */}
                    <div>
                        <DashboardQuickActions />
                    </div>
                </div>
            </div>

            {/* AI Assistant - Floating Card */}
            <SuperAdminAiCard
                userName="SuperAdmin"
                platformStats={{
                    totalStores: storeStats.total,
                    activeStores: storeStats.active,
                    totalRevenue: revSummary?.totalAmount || 0
                }}
            />
        </div>
    );
};

export default SuperAdminDashboard;